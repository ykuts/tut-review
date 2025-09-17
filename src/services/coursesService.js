// src/services/coursesService.js - FIXED for real DB structure
import apiConfig, {
    buildUrl,
    getRequestOptions,
    getFunctionKeyForEndpoint,
    mapMaterialType,
    getMaterialDisplayConfig,
    validateMaterialData,
    generateMaterialContent,
    getMaterialTypeProperties
} from '../config/apiConfig';

/**
 * Custom API Error class for courses
 */
export class CoursesAPIError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'CoursesAPIError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Make authenticated request with smart key selection and better timeout handling
 */
const makeAuthenticatedRequest = async (url, options = {}, endpoint = null) => {
    try {
        const functionKey = getFunctionKeyForEndpoint ? getFunctionKeyForEndpoint(endpoint) : apiConfig.FUNCTION_KEYS?.HOST;

        console.log(`🔄 Making courses request to: ${url}`);
        console.log(`   Method: ${options.method || 'GET'}`);
        
        // --- START OF FIX ---
        const contentType = options.headers?.['Content-Type'] || 'application/json';
        console.log(`   Content-Type: ${contentType}`);
        
        // Only stringify the body if it's JSON. For text/plain, use it directly.
        let bodyToSend = options.body;
        if (bodyToSend && contentType === 'application/json' && typeof bodyToSend !== 'string') {
            bodyToSend = JSON.stringify(bodyToSend);
        }

        if (bodyToSend) {
            console.log(`   Request Body:`, typeof bodyToSend === 'string' ? bodyToSend.substring(0,200) + '...' : bodyToSend);
        }
        // --- END OF FIX ---

        const requestOptions = getRequestOptions(options.headers || {}, functionKey, 10000);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('⏰ Request timeout - aborting...');
            controller.abort();
        }, 10000);

        const response = await fetch(url, {
            ...options,
            body: bodyToSend, // Use the prepared body
            headers: requestOptions.headers,
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log(`📡 Courses response: ${response.status} ${response.statusText} (${url})`);

        return response;

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error(`⏰ Request timeout for ${url}`);
            throw new CoursesAPIError('Request timeout - please check your internet connection', 408, { url });
        }

        console.error(`❌ Courses request failed for ${url}:`, error);
        throw error;
    }
};

/**
 * Parse response with enhanced error handling
 */
const parseCoursesResponse = async (response) => {
    try {
        const responseText = await response.text();
        console.log(`📄 Raw courses response (${response.status}):`, responseText.substring(0, 300) + '...');

        if (!responseText) {
            return {
                success: false,
                error: 'Empty response from server',
                status: response.status
            };
        }

        try {
            const parsedData = JSON.parse(responseText);

            if (response.ok && !parsedData.hasOwnProperty('success')) {
                parsedData.success = true;
            }

            return parsedData;
        } catch (jsonError) {
            console.error('❌ JSON parsing failed:', jsonError);
            return {
                success: false,
                error: 'Invalid JSON response from server',
                rawResponse: responseText.substring(0, 500),
                status: response.status
            };
        }

    } catch (error) {
        console.error('❌ Failed to read response:', error);
        return {
            success: false,
            error: 'Failed to read server response',
            status: 500
        };
    }
};

/**
 * Transform database materials to component format - FIXED for real DB structure
 */
const transformDbMaterials = (rawMaterials, chapterId) => {
    if (!Array.isArray(rawMaterials)) {
        console.warn('⚠️ Expected array of materials, got:', typeof rawMaterials);
        return [];
    }

    return rawMaterials.map(material => {
        try {
            console.log('🔄 Transforming material from DB:', material);

            // Handle different possible ID fields
            const materialId = material.materialId || material._id || material.id || `temp_${Date.now()}`;

            // --- THE FIX IS HERE ---
            // Prioritize the new `contentUrl` field, but fall back to the old `url` field for backward compatibility.
            const finalUrl = material.contentUrl || material.url;
            // --- END OF FIX ---
            
            // Map database type to component type
            let componentType = 'text'; // default
            if (material.type) {
                switch (material.type.toLowerCase()) {
                    case 'md':
                    case 'markdown':
                        componentType = 'text';
                        break;
                    case 'video':
                    case 'mp4':
                    case 'avi':
                    case 'mov':
                        componentType = 'video';
                        break;
                    case 'code':
                    case 'js':
                    case 'python':
                    case 'java':
                        componentType = 'code';
                        break;
                    case 'quiz':
                    case 'test':
                        componentType = 'quiz';
                        break;
                    default:
                        componentType = 'text';
                }
            }
            
            // Use the final URL if available, otherwise use other content fields
            const content = finalUrl || material.content || material.description || 'No content available';

            const transformedMaterial = {
                id: materialId,
                chapterId: material.chapterId || chapterId,
                type: componentType,
                title: material.title || 'Untitled Material',
                content: content,
                description: material.description || '',
                order: material.order || 0,
                completed: material.completed || false,
                created_at: material.upload_date || material.created_at || material.createdAt || new Date().toISOString(),
                updated_at: material.updated_at || material.updatedAt || new Date().toISOString(),

                // Use the finalUrl to set these properties
                isMarkdownUrl: (material.type === 'md' || material.type === 'markdown') && !!finalUrl,
                url: finalUrl,
                originalType: material.type,

                // Preserve original material data for debugging
                originalData: material
            };

            console.log('✅ Transformed material:', {
                id: transformedMaterial.id,
                title: transformedMaterial.title,
                type: transformedMaterial.type,
                originalType: material.type,
                hasUrl: !!finalUrl, // Log if we found any URL
                isMarkdownUrl: transformedMaterial.isMarkdownUrl,
                content: typeof transformedMaterial.content === 'string' ? transformedMaterial.content.substring(0, 100) + '...' : '[Content]'
            });

            return transformedMaterial;

        } catch (transformError) {
            console.error('❌ Error transforming material:', transformError, material);

            // Return a fallback material
            return {
                id: `error_${Date.now()}`,
                chapterId: chapterId,
                type: 'text',
                title: 'Material Loading Error',
                content: 'This material could not be loaded properly.',
                order: 999,
                completed: false,
                created_at: new Date().toISOString(),
                isError: true
            };
        }
    });
};

/**
 * Get materials for a specific chapter - ENHANCED for real DB structure
 */
export const getChapterMaterials = async (chapterId) => {
    try {
        console.log(`🔄 [ENHANCED] Getting materials for chapter: ${chapterId}`);

        if (!chapterId) {
            throw new Error('Chapter ID is required');
        }

        const url = `${apiConfig.AZURE_FUNCTIONS_URL}/materials?chapterId=${encodeURIComponent(chapterId)}`;
        console.log(`🔗 [ENHANCED] URL: ${url}`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-functions-key': apiConfig.FUNCTION_KEYS.HOST
            }
        });

        console.log(`📡 [ENHANCED] Response: ${response.status} ${response.statusText}`);

        const responseText = await response.text();
        console.log(`📄 [ENHANCED] Response text:`, responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ [ENHANCED] JSON parse error:', parseError);
            return {
                success: false,
                error: 'Invalid JSON response',
                rawResponse: responseText,
                isEmpty: true
            };
        }

        // Handle 404 - no materials
        if (response.status === 404) {
            console.log('ℹ️ [ENHANCED] 404 - No materials found');
            return {
                success: true,
                data: [],
                isEmpty: true,
                message: 'No materials found'
            };
        }

        // Handle other errors
        if (!response.ok) {
            console.error('❌ [ENHANCED] HTTP error:', response.status, data);
            return {
                success: false,
                error: data.error || `HTTP ${response.status}`,
                isEmpty: true
            };
        }

        // Success - process materials
        const rawMaterials = data.data || data || [];
        console.log(`✅ [ENHANCED] Found ${rawMaterials.length} raw materials`);

        // Enhanced transformation for real DB structure
        const transformedMaterials = transformDbMaterials(rawMaterials, chapterId);

        console.log(`🎯 [ENHANCED] Transformed materials:`, transformedMaterials.map(m => ({
            id: m.id,
            title: m.title,
            type: m.type,
            isMarkdownUrl: m.isMarkdownUrl,
            hasUrl: !!m.url
        })));

        return {
            success: true,
            data: transformedMaterials,
            isEmpty: transformedMaterials.length === 0,
            message: `Found ${transformedMaterials.length} materials`
        };

    } catch (error) {
        console.error('❌ [ENHANCED] Error:', error);
        return {
            success: false,
            error: error.message,
            isEmpty: true
        };
    }
};

/**
 * Get materials with fallback - ENHANCED
 */
export const getChapterMaterialsWithFallback = async (chapterId, chapterTitle = 'Chapter') => {
    try {
        console.log(`🔄 [ENHANCED] Getting materials with fallback for: ${chapterId}`);

        // Try to get real materials
        const result = await getChapterMaterials(chapterId);

        // If successful and has real materials, return them
        if (result.success && !result.isEmpty) {
            console.log('✅ [ENHANCED] Found real materials from database');
            return result;
        }

        // If no materials found, create placeholder
        if (result.isEmpty) {
            console.log('📝 [ENHANCED] Creating placeholder materials');
            const placeholderMaterials = [{
                id: `placeholder_${chapterId}`,
                chapterId: chapterId,
                type: 'text',
                title: 'Materials Coming Soon',
                content: `# ${chapterTitle}\n\n📚 Materials for this chapter are being prepared.\n\nPlease check back soon!`,
                order: 1,
                completed: false,
                created_at: new Date().toISOString(),
                isPlaceholder: true
            }];

            return {
                success: true,
                data: placeholderMaterials,
                isPlaceholder: true,
                message: 'Using placeholder materials'
            };
        }

        // If error, create error material
        if (!result.success) {
            console.log('❌ [ENHANCED] Creating error materials');
            const errorMaterials = [{
                id: `error_${chapterId}`,
                chapterId: chapterId,
                type: 'text',
                title: 'Loading Error',
                content: `# ${chapterTitle}\n\n❌ Error loading materials: ${result.error}\n\nChapter ID: ${chapterId}\n\nPlease try refreshing or contact support.`,
                order: 1,
                completed: false,
                created_at: new Date().toISOString(),
                isError: true
            }];

            return {
                success: true,
                data: errorMaterials,
                isError: true,
                message: `Error: ${result.error}`
            };
        }

        return result;

    } catch (error) {
        console.error('❌ [ENHANCED] Fallback error:', error);

        // Emergency fallback
        const emergencyMaterials = [{
            id: `emergency_${chapterId}`,
            chapterId: chapterId,
            type: 'text',
            title: 'Critical Error',
            content: `# ${chapterTitle}\n\n💥 Critical error: ${error.message}\n\nChapter ID: ${chapterId}`,
            order: 1,
            completed: false,
            created_at: new Date().toISOString(),
            isEmergency: true
        }];

        return {
            success: true,
            data: emergencyMaterials,
            isEmergency: true,
            message: `Critical error: ${error.message}`
        };
    }
};

/**
 * Test materials API
 */
export const testMaterialsAPI = async (chapterId) => {
    console.log('🧪 [ENHANCED] Testing materials API...');

    const url = `${apiConfig.AZURE_FUNCTIONS_URL}/materials?chapterId=${encodeURIComponent(chapterId)}`;
    const hasHostKey = !!(apiConfig.FUNCTION_KEYS?.HOST);

    console.log('Test URL:', url);
    console.log('Has Host Key:', hasHostKey);
    console.log('Host Key Preview:', apiConfig.FUNCTION_KEYS?.HOST?.substring(0, 8) + '...');

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-functions-key': apiConfig.FUNCTION_KEYS?.HOST || ''
            }
        });

        const responseText = await response.text();

        return {
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            url: url,
            hasKey: hasHostKey,
            responsePreview: responseText.substring(0, 200) + '...',
            fullResponse: responseText
        };

    } catch (error) {
        return {
            success: false,
            error: error.message,
            url: url,
            hasKey: hasHostKey
        };
    }
};

/**
 * Debug materials API
 */
export const debugMaterialsAPI = async () => {
    console.log('🔧 [ENHANCED] Materials API Debug:');
    console.log('  Base URL:', apiConfig.AZURE_FUNCTIONS_URL);
    console.log('  Host Key Available:', !!(apiConfig.FUNCTION_KEYS?.HOST));
    console.log('  Host Key Preview:', apiConfig.FUNCTION_KEYS?.HOST?.substring(0, 8) + '...');

    return {
        baseUrl: apiConfig.AZURE_FUNCTIONS_URL,
        hasHostKey: !!(apiConfig.FUNCTION_KEYS?.HOST),
        hostKeyPreview: apiConfig.FUNCTION_KEYS?.HOST?.substring(0, 8) + '...'
    };
};

/**
 * Health check for courses API
 */
export const checkCoursesAPIHealth = async () => {
    try {
        const url = buildUrl(apiConfig.ENDPOINTS.COURSES);
        console.log('🔍 Checking courses API health at:', url);

        const response = await makeAuthenticatedRequest(url, {
            method: 'GET'
        }, '/courses');

        const result = {
            isHealthy: response.ok,
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString(),
            hasHostKey: !!(apiConfig.FUNCTION_KEYS?.HOST),
            endpoint: url
        };

        if (response.ok) {
            console.log('✅ Courses API is healthy:', result);
        } else {
            console.log('❌ Courses API is unhealthy:', result);
        }

        return result;

    } catch (error) {
        console.error('❌ Courses API health check failed:', error);
        return {
            isHealthy: false,
            error: error.message,
            timestamp: new Date().toISOString(),
            hasHostKey: !!(apiConfig.FUNCTION_KEYS?.HOST),
            originalError: error.name
        };
    }
};

/**
 * Get all courses with enhanced error handling
 */
export const getAllCourses = async () => {
    try {
        const url = buildUrl(apiConfig.ENDPOINTS.COURSES);
        console.log('🔄 Fetching all courses from:', url);

        const response = await makeAuthenticatedRequest(url, {
            method: 'GET'
        }, '/courses');

        const responseData = await parseCoursesResponse(response);

        if (!response.ok) {
            let errorMessage;

            switch (response.status) {
                case 401:
                    errorMessage = 'Authentication required. Please check your Host Key in apiConfig.js';
                    break;
                case 403:
                    errorMessage = 'Access denied. Please check your permissions.';
                    break;
                case 500:
                    errorMessage = responseData.message || responseData.error || 'Server error. Please check Azure Functions logs.';
                    break;
                default:
                    errorMessage = responseData.error || 'Failed to fetch courses';
            }

            throw new CoursesAPIError(errorMessage, response.status, responseData);
        }

        const coursesData = responseData.data || [];
        console.log('✅ Courses fetched successfully:', coursesData.length, 'courses');

        return {
            success: true,
            data: coursesData,
            count: coursesData.length
        };

    } catch (error) {
        console.error('❌ Get all courses failed:', error);

        if (error instanceof CoursesAPIError) {
            throw error;
        }

        throw new CoursesAPIError(
            'Network error. Please check your internet connection.',
            0,
            { message: error.message }
        );
    }
};

/**
 * Get course by ID with enhanced error handling
 */
export const getCourseById = async (courseId) => {
    try {
        console.log(`🔄 Getting course by ID: ${courseId}`);

        if (!courseId) {
            throw new CoursesAPIError('Course ID is required', 400, { courseId });
        }

        const url = buildUrl(apiConfig.ENDPOINTS.COURSE_BY_ID, courseId);
        console.log(`🔗 Course URL: ${url}`);

        const response = await makeAuthenticatedRequest(url, {
            method: 'GET'
        }, '/courses');

        const responseData = await parseCoursesResponse(response);

        if (response.status === 404) {
            throw new CoursesAPIError('Course not found', 404, { courseId });
        }

        if (!response.ok) {
            let errorMessage = responseData.error || 'Failed to fetch course';
            throw new CoursesAPIError(errorMessage, response.status, responseData);
        }

        const courseData = responseData.data || responseData;
        console.log(`✅ Course fetched successfully:`, courseData.title || courseData.name);

        return {
            success: true,
            data: courseData
        };

    } catch (error) {
        console.error('❌ Get course by ID failed:', error);

        if (error instanceof CoursesAPIError) {
            throw error;
        }

        throw new CoursesAPIError(
            'Network error. Please check your internet connection.',
            0,
            { message: error.message }
        );
    }
};

/**
 * Get modules by course ID
 */
export const getModulesByCourse = async (courseId) => {
    try {
        console.log(`🔄 Getting modules for course: ${courseId}`);

        if (!courseId) {
            throw new CoursesAPIError('Course ID is required', 400, { courseId });
        }

        const url = buildUrl(apiConfig.ENDPOINTS.MODULES_BY_COURSE, null, { courseId });
        console.log(`🔗 Modules URL: ${url}`);

        const response = await makeAuthenticatedRequest(url, {
            method: 'GET'
        }, '/modules');

        const responseData = await parseCoursesResponse(response);

        if (response.status === 404) {
            console.log(`ℹ️ No modules found for course ${courseId}`);
            return {
                success: true,
                data: [],
                message: 'No modules found for this course yet'
            };
        }

        if (!response.ok) {
            let errorMessage = responseData.error || 'Failed to fetch modules';
            throw new CoursesAPIError(errorMessage, response.status, responseData);
        }

        const modulesData = responseData.data || [];
        console.log(`✅ Modules fetched successfully: ${modulesData.length} modules`);

        return {
            success: true,
            data: modulesData
        };

    } catch (error) {
        console.error('❌ Get modules by course failed:', error);

        if (error instanceof CoursesAPIError) {
            throw error;
        }

        throw new CoursesAPIError(
            'Network error. Please check your internet connection.',
            0,
            { message: error.message }
        );
    }
};



// --- Course Functions ---

/**
 * Create a new course
 * @param {Object} courseData - { title, description, slug, etc. }
 */
export const createCourse = async (courseData) => {
    const url = buildUrl(apiConfig.ENDPOINTS.COURSES);
    const response = await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(courseData)
    }, '/courses');
    const responseData = await parseCoursesResponse(response);
    if (!response.ok) throw new CoursesAPIError('Failed to create course', response.status, responseData);
    return { success: true, data: responseData.data || responseData };
};

/**
 * Update an existing course
 * @param {string} courseId
 * @param {Object} courseData - { title, description, etc. }
 */
export const updateCourse = async (courseId, courseData) => {
    const url = buildUrl(apiConfig.ENDPOINTS.COURSE_BY_ID, courseId);
    const response = await makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify(courseData)
    }, '/courses');
    const responseData = await parseCoursesResponse(response);
    if (!response.ok) throw new CoursesAPIError('Failed to update course', response.status, responseData);
    return { success: true, data: responseData.data || responseData };
};

/**
 * Delete a course
 * @param {string} courseId
 */
export const deleteCourse = async (courseId) => {
    const url = buildUrl(apiConfig.ENDPOINTS.COURSE_BY_ID, courseId);
    const response = await makeAuthenticatedRequest(url, { method: 'DELETE' }, '/courses');
    if (response.status !== 204 && response.status !== 200) {
        const responseData = await parseCoursesResponse(response);
        throw new CoursesAPIError('Failed to delete course', response.status, responseData);
    }
    return { success: true, message: 'Course deleted successfully.' };
};


// --- Module Functions ---
export const createModuleForCourse = async (moduleData) => {
    const url = buildUrl(apiConfig.ENDPOINTS.MODULES);
    const response = await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(moduleData)
    }, '/modules');
    const responseData = await parseCoursesResponse(response);
    if (!response.ok) throw new CoursesAPIError('Failed to create module', response.status, responseData);
    return { success: true, data: responseData.data || responseData };
}

export const updateModule = async (moduleId, moduleData) => {
    const url = `${buildUrl(apiConfig.ENDPOINTS.MODULES)}/${moduleId}`;
    const response = await makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify(moduleData)
    }, '/modules');
    const responseData = await parseCoursesResponse(response);
    if (!response.ok) throw new CoursesAPIError('Failed to update module', response.status, responseData);
    return { success: true, data: responseData.data || responseData };
}

export const deleteModule = async (moduleId) => {
    const url = `${buildUrl(apiConfig.ENDPOINTS.MODULES)}/${moduleId}`;
    const response = await makeAuthenticatedRequest(url, { method: 'DELETE' }, '/modules');
    if (response.status !== 204 && response.status !== 200) {
        const responseData = await parseCoursesResponse(response);
        throw new CoursesAPIError('Failed to delete module', response.status, responseData);
    }
    return { success: true };
}


// --- Chapter Functions ---
export const createChapterForModule = async (chapterData) => {
    const url = buildUrl(apiConfig.ENDPOINTS.CHAPTERS);
    const response = await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(chapterData)
    }, '/chapters');
    const responseData = await parseCoursesResponse(response);
    if (!response.ok) throw new CoursesAPIError('Failed to create chapter', response.status, responseData);
    return { success: true, data: responseData.data || responseData };
}

export const updateChapter = async (chapterId, chapterData) => {
    const url = `${buildUrl(apiConfig.ENDPOINTS.CHAPTERS)}/${chapterId}`;
    const response = await makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify(chapterData)
    }, '/chapters');
    const responseData = await parseCoursesResponse(response);
    if (!response.ok) throw new CoursesAPIError('Failed to update chapter', response.status, responseData);
    return { success: true, data: responseData.data || responseData };
}

export const deleteChapter = async (chapterId) => {
    const url = `${buildUrl(apiConfig.ENDPOINTS.CHAPTERS)}/${chapterId}`;
    const response = await makeAuthenticatedRequest(url, { method: 'DELETE' }, '/chapters');
    if (response.status !== 204 && response.status !== 200) {
        const responseData = await parseCoursesResponse(response);
        throw new CoursesAPIError('Failed to delete chapter', response.status, responseData);
    }
    return { success: true };
}


// --- Material Functions ---
export const createMaterialForChapter = async (materialData) => {
    const url = buildUrl(apiConfig.ENDPOINTS.MATERIALS);
    const response = await makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(materialData)
    }, '/materials');
    const responseData = await parseCoursesResponse(response);
    if (!response.ok) throw new CoursesAPIError('Failed to create material', response.status, responseData);
    return { success: true, data: responseData.data || responseData };
}

export const updateMaterial = async (materialId, materialData) => {
    const url = buildUrl(apiConfig.ENDPOINTS.MATERIAL_BY_ID, materialId);
    const response = await makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify(materialData)
    }, '/materials');
    const responseData = await parseCoursesResponse(response);
    if (!response.ok) throw new CoursesAPIError('Failed to update material', response.status, responseData);
    return { success: true, data: responseData.data || responseData };
}

export const deleteMaterial = async (materialId) => {
    const url = buildUrl(apiConfig.ENDPOINTS.MATERIAL_BY_ID, materialId);
    const response = await makeAuthenticatedRequest(url, { method: 'DELETE' }, '/materials');
    if (response.status !== 204 && response.status !== 200) {
        const responseData = await parseCoursesResponse(response);
        throw new CoursesAPIError('Failed to delete material', response.status, responseData);
    }
    return { success: true };
}

/**
 * Update the markdown content for a material, creating a new version.
 * @param {string} materialId
 * @param {string} markdownContent - The raw markdown text
 */
export const updateMaterialContent = async (materialId, markdownContent) => {
    // This endpoint expects the raw text in the body, not JSON.
    const url = buildUrl(apiConfig.ENDPOINTS.CONTENT_BY_MATERIAL_ID, materialId);
    
    // NOTE: The 'Content-Type' is 'text/plain'. This is different from other API calls.
    const response = await makeAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 
            'Content-Type': 'text/plain' 
        },
        body: markdownContent
    }, '/content');
    
    const responseData = await parseCoursesResponse(response);
    if (!response.ok) throw new CoursesAPIError('Failed to update material content', response.status, responseData);
    
    return { success: true, data: responseData.data || responseData };
};


/**
 * Get chapters by module ID
 */
export const getChaptersByModule = async (moduleId) => {
    try {
        console.log(`🔄 Getting chapters for module: ${moduleId}`);

        if (!moduleId) {
            throw new CoursesAPIError('Module ID is required', 400, { moduleId });
        }

        const url = buildUrl(apiConfig.ENDPOINTS.CHAPTERS_BY_MODULE, null, { moduleId });
        console.log(`🔗 Chapters URL: ${url}`);

        const response = await makeAuthenticatedRequest(url, {
            method: 'GET'
        }, '/chapters');

        const responseData = await parseCoursesResponse(response);

        if (response.status === 404) {
            console.log(`ℹ️ No chapters found for module ${moduleId}`);
            return {
                success: true,
                data: [],
                message: 'No chapters found for this module yet'
            };
        }

        if (!response.ok) {
            let errorMessage = responseData.error || 'Failed to fetch chapters';
            throw new CoursesAPIError(errorMessage, response.status, responseData);
        }

        const chaptersData = responseData.data || [];
        console.log(`✅ Chapters fetched successfully: ${chaptersData.length} chapters`);

        return {
            success: true,
            data: chaptersData
        };

    } catch (error) {
        console.error('❌ Get chapters by module failed:', error);

        if (error instanceof CoursesAPIError) {
            throw error;
        }

        throw new CoursesAPIError(
            'Network error. Please check your internet connection.',
            0,
            { message: error.message }
        );
    }
};

// Export the service as default
const coursesService = {
    // Materials
    getChapterMaterials,
    getChapterMaterialsWithFallback,

    // Courses
    getAllCourses,
    getCourseById,

    // Modules
    getModulesByCourse,

    // Chapters
    getChaptersByModule,

    // Health & Debug
    checkCoursesAPIHealth,
    testMaterialsAPI,
    debugMaterialsAPI,

    // Utilities
    CoursesAPIError,

        // Course CRUD
    createCourse,
    updateCourse,
    deleteCourse,
    
    // Module CRUD
    createModuleForCourse,
    updateModule,
    deleteModule,
    
    // Chapter CRUD
    createChapterForModule,
    updateChapter,
    deleteChapter,
    
    // Material CRUD
    createMaterialForChapter,
    updateMaterial,
    deleteMaterial,
    updateMaterialContent,
};

export default coursesService;