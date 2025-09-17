// src/utils/ChapterIdResolver.js - Helper for resolving chapter IDs
import coursesService from '../services/coursesService';

/**
 * Chapter ID Resolver - решает проблему с несоответствием ID глав
 */
export class ChapterIdResolver {
    
    /**
     * Cache для соответствия сгенерированных ID и реальных ID из БД
     */
    static chapterIdCache = new Map();
    
    /**
     * Получить реальный chapter ID из базы данных
     * Если передан сгенерированный ID (courseId_chapter_X), попытается найти соответствующий реальный ID
     */
    static async resolveChapterId(generatedChapterId, courseId = null, moduleId = null) {
        try {
            console.log('🔍 Resolving chapter ID:', generatedChapterId);
            
            // Если ID выглядит как настоящий UUID, используем его как есть
            if (this.isRealChapterId(generatedChapterId)) {
                console.log('✅ Using real chapter ID as is:', generatedChapterId);
                return generatedChapterId;
            }
            
            // Проверяем кэш
            if (this.chapterIdCache.has(generatedChapterId)) {
                const cachedId = this.chapterIdCache.get(generatedChapterId);
                console.log('📋 Found cached chapter ID:', cachedId);
                return cachedId;
            }
            
            // Попытаемся найти реальный chapter ID через API
            const realChapterId = await this.findRealChapterId(generatedChapterId, courseId, moduleId);
            
            if (realChapterId) {
                // Сохраняем в кэш
                this.chapterIdCache.set(generatedChapterId, realChapterId);
                console.log('✅ Resolved and cached chapter ID:', generatedChapterId, '→', realChapterId);
                return realChapterId;
            }
            
            // Если не нашли, возвращаем оригинальный
            console.log('⚠️ Could not resolve chapter ID, using original:', generatedChapterId);
            return generatedChapterId;
            
        } catch (error) {
            console.error('❌ Error resolving chapter ID:', error);
            return generatedChapterId; // Fallback to original
        }
    }
    
    /**
     * Проверить, является ли ID настоящим UUID главы
     */
    static isRealChapterId(chapterId) {
        // Настоящие chapter ID обычно UUID формата: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        // Или MongoDB ObjectId: 24-символьная hex строка
        const objectIdRegex = /^[0-9a-f]{24}$/i;
        
        return uuidRegex.test(chapterId) || objectIdRegex.test(chapterId);
    }
    
    /**
     * Найти реальный chapter ID через API
     */
    static async findRealChapterId(generatedId, courseId, moduleId) {
        try {
            console.log('🔎 Searching for real chapter ID for:', generatedId);
            
            // Извлекаем номер главы из сгенерированного ID
            const chapterMatch = generatedId.match(/_chapter_(\d+)$/);
            const chapterIndex = chapterMatch ? parseInt(chapterMatch[1]) : 0;
            
            console.log('📊 Extracted chapter index:', chapterIndex);
            
            // Стратегия 1: Получить главы через moduleId
            if (moduleId) {
                try {
                    const chaptersResult = await coursesService.getChaptersByModule(moduleId);
                    if (chaptersResult.success && chaptersResult.data.length > chapterIndex) {
                        const realChapter = chaptersResult.data[chapterIndex];
                        console.log('✅ Found real chapter via module:', realChapter);
                        return realChapter.id || realChapter.chapterId || realChapter._id;
                    }
                } catch (moduleError) {
                    console.warn('⚠️ Failed to get chapters by module:', moduleError);
                }
            }
            
            // Стратегия 2: Получить курс целиком и найти главу по индексу
            if (courseId) {
                try {
                    const courseResult = await coursesService.getCourseById(courseId);
                    if (courseResult.success && courseResult.data.all_chapters) {
                        const allChapters = courseResult.data.all_chapters;
                        if (allChapters.length > chapterIndex) {
                            const realChapter = allChapters[chapterIndex];
                            console.log('✅ Found real chapter via course:', realChapter);
                            return realChapter.id || realChapter.chapterId || realChapter._id;
                        }
                    }
                } catch (courseError) {
                    console.warn('⚠️ Failed to get course details:', courseError);
                }
            }
            
            // Стратегия 3: Поиск по паттерну (если есть API для поиска)
            return await this.searchChapterByPattern(generatedId, courseId);
            
        } catch (error) {
            console.error('❌ Error finding real chapter ID:', error);
            return null;
        }
    }
    
    /**
     * Поиск главы по паттерну названия
     */
    static async searchChapterByPattern(generatedId, courseId) {
        try {
            // Пока заглушка - можно расширить если появится поисковое API
            console.log('🔎 Pattern search not implemented yet for:', generatedId);
            return null;
        } catch (error) {
            console.error('❌ Pattern search failed:', error);
            return null;
        }
    }
    
    /**
     * Получить материалы с автоматическим разрешением chapter ID
     */
    static async getChapterMaterialsWithResolvedId(generatedChapterId, courseId = null, moduleId = null, chapterTitle = 'Chapter') {
        try {
            // Сначала попробуем разрешить настоящий chapter ID
            const realChapterId = await this.resolveChapterId(generatedChapterId, courseId, moduleId);
            
            console.log('🎯 Using resolved chapter ID for materials:', realChapterId);
            
            // Теперь попробуем получить материалы с настоящим ID
            const result = await coursesService.getChapterMaterialsWithFallback(realChapterId, chapterTitle);
            
            // Если нашли материалы с настоящим ID, отлично!
            if (result.success && result.data.length > 0 && !result.data[0].isPlaceholder) {
                console.log('✅ Found materials with resolved ID:', result.data.length);
                return result;
            }
            
            // Если не нашли, попробуем с оригинальным сгенерированным ID
            console.log('🔄 Trying with original generated ID:', generatedChapterId);
            return await coursesService.getChapterMaterialsWithFallback(generatedChapterId, chapterTitle);
            
        } catch (error) {
            console.error('❌ Error getting materials with resolved ID:', error);
            // Fallback к обычному методу
            return await coursesService.getChapterMaterialsWithFallback(generatedChapterId, chapterTitle);
        }
    }
    
    /**
     * Получить все возможные варианты chapter ID для поиска
     */
    static getPossibleChapterIds(generatedId, courseId, moduleId) {
        const possibilities = [generatedId]; // Начинаем с оригинального
        
        // Добавляем варианты с разными форматами
        if (generatedId.includes('_chapter_')) {
            const basePart = generatedId.split('_chapter_')[0];
            const chapterNum = generatedId.split('_chapter_')[1];
            
            possibilities.push(
                `${basePart}-chapter-${chapterNum}`,
                `${basePart}.chapter.${chapterNum}`,
                `chapter_${chapterNum}_${basePart}`,
                `${courseId}_${chapterNum}`,
                `${moduleId}_${chapterNum}`
            );
        }
        
        return possibilities;
    }
    
    /**
     * Получить статистику разрешения ID
     */
    static getResolutionStats() {
        return {
            cacheSize: this.chapterIdCache.size,
            cachedMappings: Array.from(this.chapterIdCache.entries()),
            lastResolutionTime: new Date().toISOString()
        };
    }
    
    /**
     * Очистить кэш разрешения ID
     */
    static clearCache() {
        this.chapterIdCache.clear();
        console.log('🗑️ Chapter ID cache cleared');
    }
    
    /**
     * Предварительно загрузить соответствия ID для курса
     */
    static async preloadChapterIds(courseId) {
        try {
            console.log('🔄 Preloading chapter IDs for course:', courseId);
            
            const courseResult = await coursesService.getCourseById(courseId);
            if (courseResult.success && courseResult.data.all_chapters) {
                courseResult.data.all_chapters.forEach((chapter, index) => {
                    const generatedId = `${courseId}_chapter_${index}`;
                    const realId = chapter.id || chapter.chapterId || chapter._id;
                    
                    if (realId) {
                        this.chapterIdCache.set(generatedId, realId);
                        console.log(`📋 Preloaded: ${generatedId} → ${realId}`);
                    }
                });
                
                console.log('✅ Preloaded chapter IDs:', this.chapterIdCache.size);
            }
            
        } catch (error) {
            console.error('❌ Error preloading chapter IDs:', error);
        }
    }
}

export default ChapterIdResolver;