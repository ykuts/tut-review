import React, { useState, useEffect } from 'react';
import { 
  HiCheckCircle, 
  HiPlayCircle, 
  HiBookOpen, 
  HiClock,
  HiArrowLeft,
  HiExclamationTriangle,
  HiArrowPath,
  HiPlus,
  HiAcademicCap,
  HiInformationCircle
} from 'react-icons/hi2';
import coursesService from '../../services/coursesService';
import ChapterMaterialsView from './ChapterMaterialsView';
import useScrollToTop from '../../hooks/useScrollToTop';
import { useNavigate } from 'react-router-dom';

const CourseDetailView = ({ course, onBack }) => {
  const navigate = useNavigate();
  const [moduleDetails, setModuleDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiAttempted, setApiAttempted] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);
  useScrollToTop({ smooth: true, delay: 100 });

  

  // Load detailed module and chapter data
  useEffect(() => {
    if (course) {
      loadModuleDetails();
    }
  }, [course]);

  /**
 * Updated loadModuleDetails to preserve real chapter IDs
 */
const loadModuleDetails = async () => {
    try {
        setLoading(true);
        setError(null);
        setApiAttempted(true);
        
        console.log('🔄 [ENHANCED] Loading course content for:', course.title);
        console.log('🔄 [ENHANCED] Course data from initial load:', {
            courseId: course.id,
            hasModules: !!(course.modules?.length),
            hasAllChapters: !!(course.all_chapters?.length),
            modulesCount: course.modules?.length || 0,
            chaptersCount: course.all_chapters?.length || 0,
            rawCourse: course
        });

        let modulesWithDetails = [];

        // Strategy 1: Check if we have chapters in the course data
        if (course.all_chapters && course.all_chapters.length > 0) {
            console.log('📖 [ENHANCED] Found all_chapters with REAL IDs');
            
            const chapters = course.all_chapters.map((chapter, index) => {
                const realChapterId = chapter.chapterId || chapter.id || chapter._id;
                console.log(`  ✅ Chapter ${index}: "${chapter.title}" -> REAL ID: ${realChapterId}`);
                
                return {
                    id: realChapterId,
                    chapterId: realChapterId, 
                    title: chapter.title || `Chapter ${index + 1}`,
                    completed: Math.random() > 0.7,
                    duration: `${Math.floor(Math.random() * 30) + 10} min`,
                    created_at: chapter.created_at,
                    updated_at: chapter.updated_at,
                    moduleId: chapter.moduleId || 'main_content'
                };
            });
            
            modulesWithDetails = [{
                id: 'main_content',
                title: 'Course Content',
                description: `${chapters.length} chapters available`,
                chapters: chapters,
                progress: Math.floor(Math.random() * 100),
                totalChapters: chapters.length,
                completedChapters: chapters.filter(c => c.completed).length,
                estimatedTime: `${chapters.length * 20} min`
            }];
        } 
        
        // Strategy 2: Check if we have modules in the course data
        else if (course.modules && course.modules.length > 0) {
            console.log('📚 [ENHANCED] Found modules in course data, loading chapters...');
            
            // Try to load chapters for each module
            modulesWithDetails = await Promise.all(
                course.modules.map(async (module, moduleIndex) => {
                    try {
                        console.log(`🔄 Loading chapters for module: ${module.moduleId}`);
                        const chaptersResult = await coursesService.getChaptersByModule(module.moduleId);
                        
                        if (chaptersResult.success && chaptersResult.data.length > 0) {
                            const chapters = chaptersResult.data.map((chapter, chapterIndex) => {
                                const realChapterId = chapter.chapterId || chapter.id || chapter._id;
                                console.log(`  ✅ Module Chapter ${chapterIndex}: "${chapter.title}" -> REAL ID: ${realChapterId}`);
                                
                                return {
                                    id: realChapterId,
                                    chapterId: realChapterId,
                                    title: chapter.title || `Chapter ${chapterIndex + 1}`,
                                    completed: Math.random() > 0.5,
                                    duration: `${Math.floor(Math.random() * 30) + 10} min`,
                                    created_at: chapter.created_at,
                                    updated_at: chapter.updated_at,
                                    moduleId: module.moduleId
                                };
                            });
                            
                            return {
                                id: module.moduleId,
                                title: module.title,
                                description: module.description || `Module with ${chapters.length} chapters`,
                                chapters: chapters,
                                progress: Math.floor(Math.random() * 100),
                                totalChapters: chapters.length,
                                completedChapters: chapters.filter(c => c.completed).length,
                                estimatedTime: `${chapters.length * 20} min`
                            };
                        } else {
                            console.log(`ℹ️ No chapters found for module ${module.moduleId}`);
                            return {
                                id: module.moduleId,
                                title: module.title,
                                description: module.description || 'No chapters available',
                                chapters: [],
                                progress: 0,
                                totalChapters: 0,
                                completedChapters: 0,
                                estimatedTime: '0 min',
                                isEmpty: true
                            };
                        }
                    } catch (moduleError) {
                        console.warn(`⚠️ Error loading chapters for module ${module.moduleId}:`, moduleError);
                        return {
                            id: module.moduleId,
                            title: module.title,
                            description: 'Error loading chapters',
                            chapters: [],
                            progress: 0,
                            totalChapters: 0,
                            completedChapters: 0,
                            estimatedTime: '0 min',
                            hasError: true,
                            errorMessage: moduleError.message
                        };
                    }
                })
            );
        }
        
        // Strategy 3: Try to load modules from API if not in course data
        else {
            console.log('🔍 [ENHANCED] No modules/chapters in course data, trying API...');
            
            try {
                // Try to get modules from API
                const modulesResult = await coursesService.getModulesByCourse(course.id);
                console.log('📡 Modules API result:', modulesResult);
                
                if (modulesResult.success && modulesResult.data.length > 0) {
                    console.log(`✅ Found ${modulesResult.data.length} modules via API`);
                    
                    // Load chapters for each module from API
                    modulesWithDetails = await Promise.all(
                        modulesResult.data.map(async (module, moduleIndex) => {
                            try {
                                const chaptersResult = await coursesService.getChaptersByModule(module.moduleId || module.id);
                                
                                if (chaptersResult.success && chaptersResult.data.length > 0) {
                                    const chapters = chaptersResult.data.map((chapter, chapterIndex) => {
                                        const realChapterId = chapter.chapterId || chapter.id || chapter._id;
                                        console.log(`  ✅ API Chapter ${chapterIndex}: "${chapter.title}" -> REAL ID: ${realChapterId}`);
                                        
                                        return {
                                            id: realChapterId,
                                            chapterId: realChapterId,
                                            title: chapter.title || `Chapter ${chapterIndex + 1}`,
                                            completed: false,
                                            duration: `${Math.floor(Math.random() * 30) + 10} min`,
                                            created_at: chapter.created_at,
                                            updated_at: chapter.updated_at,
                                            moduleId: module.moduleId || module.id
                                        };
                                    });
                                    
                                    return {
                                        id: module.moduleId || module.id,
                                        title: module.title,
                                        description: module.description || `Module with ${chapters.length} chapters`,
                                        chapters: chapters,
                                        progress: 0,
                                        totalChapters: chapters.length,
                                        completedChapters: 0,
                                        estimatedTime: `${chapters.length * 20} min`
                                    };
                                } else {
                                    return {
                                        id: module.moduleId || module.id,
                                        title: module.title,
                                        description: 'No chapters available',
                                        chapters: [],
                                        progress: 0,
                                        totalChapters: 0,
                                        completedChapters: 0,
                                        estimatedTime: '0 min',
                                        isEmpty: true
                                    };
                                }
                            } catch (chapterError) {
                                console.warn(`⚠️ Error loading chapters for API module ${module.moduleId}:`, chapterError);
                                return {
                                    id: module.moduleId || module.id,
                                    title: module.title,
                                    description: 'Error loading chapters',
                                    chapters: [],
                                    progress: 0,
                                    totalChapters: 0,
                                    completedChapters: 0,
                                    estimatedTime: '0 min',
                                    hasError: true,
                                    errorMessage: chapterError.message
                                };
                            }
                        })
                    );
                } else {
                    console.log('ℹ️ No modules found via API either');
                    throw new Error('No modules or chapters found in database');
                }
            } catch (apiError) {
                console.warn('⚠️ API calls failed:', apiError);
                throw apiError;
            }
        }

        // Strategy 4: If still no content, create placeholder
        if (!modulesWithDetails.length) {
            console.log('📝 [ENHANCED] Creating placeholder content');
            
            modulesWithDetails = [{
                id: 'placeholder_module',
                title: 'Content Coming Soon',
                description: 'Course content is being prepared',
                chapters: [{
                    id: 'placeholder_chapter',
                    title: 'Introduction',
                    completed: false,
                    duration: '15 min',
                    created_at: new Date().toISOString(),
                    isPlaceholder: true
                }],
                progress: 0,
                totalChapters: 1,
                completedChapters: 0,
                estimatedTime: '15 min',
                isPlaceholder: true
            }];
        }

        setModuleDetails(modulesWithDetails);
        
        console.log('✅ [ENHANCED] Final modules loaded:', modulesWithDetails.length);
        
        // Log summary
        const totalRealChapters = modulesWithDetails.reduce((sum, module) => {
            return sum + module.chapters.filter(ch => !ch.isPlaceholder).length;
        }, 0);
        
        console.log(`📊 [ENHANCED] Content Summary:`);
        console.log(`  - Modules: ${modulesWithDetails.length}`);
        console.log(`  - Real Chapters: ${totalRealChapters}`);
        console.log(`  - Placeholder Chapters: ${modulesWithDetails.reduce((sum, module) => sum + module.chapters.filter(ch => ch.isPlaceholder).length, 0)}`);
        
        // Log all REAL chapter IDs
        modulesWithDetails.forEach((module, moduleIndex) => {
            console.log(`📚 Module ${moduleIndex + 1}: ${module.title}`);
            module.chapters.forEach((chapter, chapterIndex) => {
                if (!chapter.isPlaceholder) {
                    console.log(`  🆔 REAL Chapter "${chapter.title}" -> ID: ${chapter.id}`);
                } else {
                    console.log(`  📝 Placeholder: "${chapter.title}"`);
                }
            });
        });

    } catch (error) {
        console.error('❌ [ENHANCED] Failed to load course content:', error);
        setError(`Failed to load course content: ${error.message}`);
        
        // Error fallback
        setModuleDetails([{
            id: 'error_module',
            title: 'Content Loading Error',
            description: `Error: ${error.message}`,
            chapters: [{
                id: 'error_chapter',
                title: 'Error Information',
                completed: false,
                duration: '5 min',
                created_at: new Date().toISOString(),
                isError: true,
                errorMessage: error.message
            }],
            progress: 0,
            totalChapters: 1,
            completedChapters: 0,
            estimatedTime: '5 min',
            isError: true
        }]);
    } finally {
        setLoading(false);
    }
};

  /**
 * Handle chapter selection and pass REAL chapter ID from database
 */
const handleChapterClick = (chapter, moduleId) => {
    console.log('📖 [SIMPLE] Chapter clicked:', chapter.title);
    console.log('🔍 [SIMPLE] Chapter data:', {
        id: chapter.id,
        chapterId: chapter.chapterId,
        title: chapter.title,
        isPlaceholder: chapter.isPlaceholder,
        isError: chapter.isError
    });
    
    // Don't navigate to placeholder/error chapters
    if (chapter.isPlaceholder || chapter.isError) {
        console.log('⚠️ [SIMPLE] Cannot navigate to placeholder/error chapter');
        return;
    }
    
    // Use the REAL chapter ID
    const realChapterId = chapter.id || chapter.chapterId;
    
    if (!realChapterId) {
        console.error('❌ [SIMPLE] No chapter ID found!');
        alert('Error: Chapter ID is missing. Check console for details.');
        return;
    }
    
    console.log('✅ [SIMPLE] Navigating with REAL chapter ID:', realChapterId);
    
    // Navigate to materials URL instead of setting state
    const materialsUrl = `/materials/${course.id}/${realChapterId}`;
    console.log('🚀 Navigating to:', materialsUrl);
    navigate(materialsUrl);
    
    /* setSelectedChapter({
        ...chapter,
        id: realChapterId,
        chapterId: realChapterId,
        moduleId: moduleId,
        courseId: course.id,
        courseTitle: course.title
    }); */
};

  /**
   * Handle retry loading
   */
  const handleRetry = () => {
    setError(null);
    loadModuleDetails();
  };

  /**
   * Calculate overall course progress
   */
  const calculateOverallProgress = () => {
    if (moduleDetails.length === 0) return 0;
    
    const totalChapters = moduleDetails.reduce((sum, module) => sum + module.totalChapters, 0);
    const completedChapters = moduleDetails.reduce((sum, module) => sum + module.completedChapters, 0);
    
    return totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
  };

  // If a chapter is selected, show the materials view
  if (selectedChapter) {
    return (
      <ChapterMaterialsView
        chapter={selectedChapter}
        onBack={() => setSelectedChapter(null)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          <HiArrowLeft className="w-5 h-5 mr-2" />
          Back to Courses
        </button>
      </div>

      {/* Course Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {course.title}
            </h1>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              {course.description}
            </p>
            
            {/* Course Stats */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <HiBookOpen className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-gray-700">
                  {moduleDetails.reduce((sum, module) => sum + module.totalChapters, 0)} Chapters
                </span>
              </div>
              
              <div className="flex items-center">
                <HiClock className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-gray-700">
                  ~{moduleDetails.reduce((sum, module) => {
                    const time = parseInt(module.estimatedTime) || 0;
                    return sum + time;
                  }, 0)} min
                </span>
              </div>
              
              <div className="flex items-center">
                <HiAcademicCap className="w-5 h-5 text-purple-600 mr-2" />
                <span className="text-gray-700">
                  {moduleDetails.length} {moduleDetails.length === 1 ? 'Module' : 'Modules'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Progress Circle */}
          <div className="text-center">
            <div className="relative w-24 h-24 mb-4">
              <svg className="transform -rotate-90 w-24 h-24">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - calculateOverallProgress() / 100)}`}
                  className="text-[#FF6B6B] transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {calculateOverallProgress()}%
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500">Overall Progress</p>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <HiExclamationTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-red-800 font-medium">Content Loading Issue</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <button
                onClick={handleRetry}
                disabled={loading}
                className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors duration-200 flex items-center"
              >
                <HiArrowPath className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B6B] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course content...</p>
        </div>
      ) : (
        <>
          {/* Modules List */}
          <div className="space-y-6">
            {moduleDetails.map((module, moduleIndex) => (
              <div
                key={module.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                {/* Module Header */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        {module.isPlaceholder && '📝 '}
                        {module.isError && '❌ '}
                        {module.isDirect && '📚 '}
                        {/* Module {moduleIndex + 1}: */} {module.title}
                      </h2>
                      <p className="text-gray-600">{module.description}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-bold text-[#FF6B6B] mb-1">
                        {module.progress}%
                      </div>
                      <div className="text-sm text-gray-500">
                        {module.completedChapters}/{module.totalChapters} chapters
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {module.estimatedTime}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${module.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Chapters List */}
                <div className="p-6">
                  {module.chapters.length > 0 ? (
                    <div className="space-y-3">
                      {module.chapters.map((chapter, chapterIndex) => (
                        <button
                          key={chapter.id}
                          onClick={() => handleChapterClick(chapter, module.id)}
                          disabled={chapter.isError || chapter.isPlaceholder}
                          className={`w-full p-4 rounded-xl text-left transition-all duration-200 border ${
                            chapter.isError
                              ? 'bg-red-50 border-red-200 cursor-not-allowed'
                              : chapter.isPlaceholder
                              ? 'bg-blue-50 border-blue-200 cursor-not-allowed'
                              : chapter.completed
                              ? 'bg-green-50 border-green-200 hover:bg-green-100'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                                chapter.completed 
                                  ? 'bg-green-600 text-white' 
                                  : chapter.isError
                                  ? 'bg-red-600 text-white'
                                  : chapter.isPlaceholder
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-300 text-gray-600'
                              }`}>
                                {chapter.completed ? (
                                  <HiCheckCircle className="w-5 h-5" />
                                ) : chapter.isError ? (
                                  <HiExclamationTriangle className="w-5 h-5" />
                                ) : chapter.isPlaceholder ? (
                                  <HiInformationCircle className="w-5 h-5" />
                                ) : (
                                  <span className="text-sm font-medium">{chapterIndex + 1}</span>
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <h3 className={`font-semibold ${
                                  chapter.isError ? 'text-red-800' :
                                  chapter.isPlaceholder ? 'text-blue-800' :
                                  'text-gray-900'
                                }`}>
                                  {chapter.title}
                                  {chapter.isPlaceholder && ' (Coming Soon)'}
                                  {chapter.isError && ' (Error)'}
                                </h3>
                                {chapter.errorMessage && (
                                  <p className="text-sm text-red-600 mt-1">
                                    {chapter.errorMessage}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-500">
                              <HiClock className="w-4 h-4 mr-1" />
                              {chapter.duration}
                              {!chapter.isError && !chapter.isPlaceholder && (
                                <HiPlayCircle className="w-5 h-5 ml-3 text-[#FF6B6B]" />
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <HiBookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No chapters available in this module yet.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {moduleDetails.length === 0 && !loading && !error && (
            <div className="text-center py-16">
              <HiAcademicCap className="w-24 h-24 mx-auto mb-6 text-gray-300" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Course Content Coming Soon
              </h3>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                This course is being developed with exciting content. Check back soon for updates!
              </p>
              <button
                onClick={onBack}
                className="px-6 py-3 bg-[#FF6B6B] text-white rounded-lg hover:bg-[#FF5252] transition-colors duration-200 flex items-center mx-auto"
              >
                <HiArrowLeft className="w-5 h-5 mr-2" />
                Browse Other Courses
              </button>
            </div>
          )}
        </>
      )}

      {/* Debug Info */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 bg-gray-100 rounded-lg p-4">
          <details>
            <summary className="cursor-pointer font-medium text-gray-700">
              🔧 Debug Info
            </summary>
            <div className="mt-4 space-y-2 text-sm">
              <p><strong>Course ID:</strong> {course.id}</p>
              <p><strong>Course Title:</strong> {course.title}</p>
              <p><strong>Original Modules:</strong> {course.modules?.length || 0}</p>
              <p><strong>Original Chapters:</strong> {course.all_chapters?.length || 0}</p>
              <p><strong>Loaded Modules:</strong> {moduleDetails.length}</p>
              <p><strong>Total Chapters:</strong> {moduleDetails.reduce((sum, m) => sum + m.totalChapters, 0)}</p>
              <p><strong>API Attempted:</strong> {apiAttempted ? 'Yes' : 'No'}</p>
              <p><strong>Has Error:</strong> {error ? 'Yes' : 'No'}</p>
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>getModulesByCourse Available:</strong> {typeof coursesService.getModulesByCourse === 'function' ? 'Yes' : 'No'}</p>
            </div>
          </details>
        </div>
      )} */}
    </div>
  );
};

export default CourseDetailView;