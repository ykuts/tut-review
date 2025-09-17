import apiConfig, { 
    buildUrl, 
    getRequestOptions, 
    getFunctionKeyForEndpoint 
} from '../config/apiConfig';

/**
 * Custom API Error class for progress operations
 */
export class ProgressAPIError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'ProgressAPIError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Make authenticated request to Progress API
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Response object
 */
const makeProgressRequest = async (url, options = {}) => {
    try {
        const functionKey = getFunctionKeyForEndpoint('/progress');
        
        console.log(`📊 Making progress request to: ${url}`);
        console.log(`   Method: ${options.method || 'GET'}`);
        console.log(`   Has Function Key: ${!!functionKey}`);
        
        if (options.body) {
            console.log(`   Request Body:`, JSON.parse(options.body));
        }
        
        const requestOptions = getRequestOptions(options.headers || {}, functionKey, 15000); // Increased timeout
        
        const response = await fetch(url, {
            ...options,
            headers: requestOptions.headers,
            signal: requestOptions.signal
        });
        
        console.log(`📈 Progress response: ${response.status} ${response.statusText}`);
        
        return response;
        
    } catch (error) {
        console.error(`❌ Progress request failed for ${url}:`, error);
        throw error;
    }
};

/**
 * Parse response from Progress API
 * @param {Response} response - Fetch response
 * @returns {Promise<Object>} Parsed response data
 */
const parseProgressResponse = async (response) => {
    try {
        const responseText = await response.text();
        console.log(`📄 Raw progress response (${response.status}):`, responseText.substring(0, 500) + '...');
        
        if (!responseText) {
            return { 
                success: false, 
                error: 'Empty response from server',
                status: response.status 
            };
        }
        
        try {
            const parsedData = JSON.parse(responseText);
            
            // Add success flag if not present
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
 * GET /progress - Retrieve Progress Records
 * @param {Object} queryParams - Query parameters for filtering
 * @returns {Promise<Object>} Progress data
 */
export const getProgress = async (queryParams) => {
    try {
        // Build URL with query parameters
        const params = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                params.append(key, value);
            }
        });
        
        const url = `${apiConfig.AZURE_FUNCTIONS_URL}/progress?${params.toString()}`;
        console.log('📊 Getting progress with params:', queryParams);
        
        const response = await makeProgressRequest(url, {
            method: 'GET'
        });
        
        const responseData = await parseProgressResponse(response);
        
        if (!response.ok) {
            let errorMessage;
            
            switch (response.status) {
                case 400:
                    errorMessage = 'Invalid query parameters';
                    break;
                case 404:
                    // 404 is OK for progress - means no records found
                    console.log('ℹ️ No progress records found (404)');
                    return {
                        success: true,
                        data: [],
                        count: 0
                    };
                case 401:
                    errorMessage = 'Authentication required. Please check your function key.';
                    break;
                case 500:
                    errorMessage = responseData.message || responseData.error || 'Server error';
                    break;
                default:
                    errorMessage = responseData.error || 'Failed to fetch progress';
            }
            
            throw new ProgressAPIError(errorMessage, response.status, responseData);
        }
        
        console.log('✅ Progress fetched successfully:', responseData.data?.length || 0, 'records');
        
        return {
            success: true,
            data: responseData.data || [],
            count: responseData.data?.length || 0
        };
        
    } catch (error) {
        console.error('❌ Get progress failed:', error);
        
        if (error instanceof ProgressAPIError) {
            throw error;
        }
        
        throw new ProgressAPIError(
            'Network error. Please check your internet connection.',
            0,
            { message: error.message }
        );
    }
};

/**
 * POST /progress - Create a Progress Record
 * @param {Object} progressData - Progress data to create
 * @returns {Promise<Object>} Created progress record
 */
export const createProgress = async (progressData) => {
    try {
        const url = `${apiConfig.AZURE_FUNCTIONS_URL}/progress`;
        console.log('📊 Creating progress:', progressData);
        
        // Validate required fields
        const requiredFields = ['userId', 'resourceType', 'resourceId', 'courseId'];
        const missingFields = requiredFields.filter(field => !progressData[field]);
        
        if (missingFields.length > 0) {
            throw new ProgressAPIError(
                `Missing required fields: ${missingFields.join(', ')}`,
                400,
                { missingFields }
            );
        }
        
        // FIXED: Ensure proper data structure
        const requestData = {
            userId: progressData.userId,
            resourceType: progressData.resourceType,
            resourceId: progressData.resourceId,
            courseId: progressData.courseId,
            percentComplete: progressData.percentComplete || 0,
            status: progressData.status || 'not_started',
            ...(progressData.moduleId && { moduleId: progressData.moduleId }),
            ...(progressData.startedAt && { startedAt: progressData.startedAt }),
            ...(progressData.completedAt && { completedAt: progressData.completedAt })
        };
        
        const response = await makeProgressRequest(url, {
            method: 'POST',
            body: JSON.stringify(requestData)
        });
        
        const responseData = await parseProgressResponse(response);
        
        if (!response.ok) {
            let errorMessage;
            
            switch (response.status) {
                case 400:
                    errorMessage = responseData.message || responseData.error || 'Invalid progress data';
                    break;
                case 409:
                    // Progress already exists - return existing record if available
                    if (responseData.data) {
                        console.log('ℹ️ Progress record already exists, returning existing');
                        return {
                            success: true,
                            data: responseData.data,
                            existed: true
                        };
                    }
                    errorMessage = 'Progress record already exists';
                    break;
                case 401:
                    errorMessage = 'Authentication required';
                    break;
                case 500:
                    errorMessage = responseData.message || responseData.error || 'Server error';
                    break;
                default:
                    errorMessage = responseData.error || 'Failed to create progress';
            }
            
            throw new ProgressAPIError(errorMessage, response.status, responseData);
        }
        
        console.log('✅ Progress created successfully:', responseData.data);
        
        return {
            success: true,
            data: responseData.data
        };
        
    } catch (error) {
        console.error('❌ Create progress failed:', error);
        
        if (error instanceof ProgressAPIError) {
            throw error;
        }
        
        throw new ProgressAPIError(
            'Network error. Please check your internet connection.',
            0,
            { message: error.message }
        );
    }
};

/**
 * PUT /progress/{id} - Update a Progress Record
 * @param {string} progressId - Progress record ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated progress record
 */
export const updateProgress = async (progressId, updateData) => {
    try {
        if (!progressId) {
            throw new ProgressAPIError('Progress ID is required', 400, { progressId });
        }
        
        const url = `${apiConfig.AZURE_FUNCTIONS_URL}/progress/${progressId}`;
        console.log('📊 Updating progress:', progressId, updateData);
        
        // FIXED: Ensure proper update data structure
        const requestData = {
            ...(updateData.percentComplete !== undefined && { percentComplete: updateData.percentComplete }),
            ...(updateData.status && { status: updateData.status }),
            ...(updateData.completedAt !== undefined && { completedAt: updateData.completedAt }),
            ...(updateData.lastUpdated !== undefined && { lastUpdated: updateData.lastUpdated }),
            // Add timestamp
            lastUpdated: new Date().toISOString()
        };
        
        const response = await makeProgressRequest(url, {
            method: 'PUT',
            body: JSON.stringify(requestData)
        });
        
        const responseData = await parseProgressResponse(response);
        
        if (response.status === 404) {
            throw new ProgressAPIError('Progress record not found', 404, { progressId });
        }
        
        if (!response.ok) {
            let errorMessage = responseData.error || 'Failed to update progress';
            throw new ProgressAPIError(errorMessage, response.status, responseData);
        }
        
        console.log('✅ Progress updated successfully:', responseData.data);
        
        return {
            success: true,
            data: responseData.data
        };
        
    } catch (error) {
        console.error('❌ Update progress failed:', error);
        
        if (error instanceof ProgressAPIError) {
            throw error;
        }
        
        throw new ProgressAPIError(
            'Network error. Please check your internet connection.',
            0,
            { message: error.message }
        );
    }
};

/**
 * DELETE /progress/{id} - Delete a Progress Record
 * @param {string} progressId - Progress record ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteProgress = async (progressId) => {
    try {
        if (!progressId) {
            throw new ProgressAPIError('Progress ID is required', 400, { progressId });
        }
        
        const url = `${apiConfig.AZURE_FUNCTIONS_URL}/progress/${progressId}`;
        console.log('📊 Deleting progress:', progressId);
        
        const response = await makeProgressRequest(url, {
            method: 'DELETE'
        });
        
        const responseData = await parseProgressResponse(response);
        
        if (response.status === 404) {
            throw new ProgressAPIError('Progress record not found', 404, { progressId });
        }
        
        if (!response.ok) {
            let errorMessage = responseData.error || 'Failed to delete progress';
            throw new ProgressAPIError(errorMessage, response.status, responseData);
        }
        
        console.log('✅ Progress deleted successfully');
        
        return {
            success: true,
            message: 'Progress record deleted successfully'
        };
        
    } catch (error) {
        console.error('❌ Delete progress failed:', error);
        
        if (error instanceof ProgressAPIError) {
            throw error;
        }
        
        throw new ProgressAPIError(
            'Network error. Please check your internet connection.',
            0,
            { message: error.message }
        );
    }
};

/**
 * Utility functions for common progress operations
 */

/**
 * Get progress for a specific user and resource
 * @param {string} userId - User ID
 * @param {string} resourceId - Resource ID
 * @param {string} resourceType - Resource type (course, module, chapter, material)
 * @returns {Promise<Object|null>} Progress record or null if not found
 */
export const getUserResourceProgress = async (userId, resourceId, resourceType) => {
    try {
        console.log('🔍 getUserResourceProgress called with:', { userId, resourceId, resourceType });
        
        // ИСПРАВЛЕНО: Используем правильные параметры на основе структуры базы
        let queryParams = { userId };
        
        // Добавляем правильные параметры в зависимости от типа ресурса
        if (resourceType === 'material') {
            queryParams.materialId = resourceId; // Для материалов используем materialId
            queryParams.resourceType = resourceType;
        } else {
            queryParams.resourceId = resourceId; // Для курсов/модулей/глав используем resourceId
            queryParams.resourceType = resourceType;
        }
        
        console.log('🔍 Query params:', queryParams);
        
        const result = await getProgress(queryParams);
        
        if (result.success && result.data && result.data.length > 0) {
            return result.data[0]; // Return first match
        }
        
        return null; // No progress found
        
    } catch (error) {
        if (error.status === 404) {
            return null; // No progress found
        }
        console.error('❌ getUserResourceProgress failed:', error);
        throw error; // Re-throw other errors
    }
};

/**
 * Get all progress for a user within a course
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @returns {Promise<Array>} Array of progress records
 */
export const getUserCourseProgress = async (userId, courseId) => {
    try {
        const result = await getProgress({ userId, courseId });
        return result.success ? result.data : [];
        
    } catch (error) {
        if (error.status === 404) {
            return []; // No progress found
        }
        throw error;
    }
};

/**
 * FIXED: Mark a resource as started (if not already started)
 * @param {string} userId - User ID
 * @param {string} resourceId - Resource ID
 * @param {string} resourceType - Resource type
 * @param {string} courseId - Course ID
 * @param {string} moduleId - Module ID (optional)
 * @returns {Promise<Object>} Progress record
 */
export const markResourceStarted = async (userId, resourceId, resourceType, courseId, moduleId = null) => {
    try {
        console.log('📊 markResourceStarted called with:', { userId, resourceId, resourceType, courseId, moduleId });
        
        // Check if progress already exists
        const existingProgress = await getUserResourceProgress(userId, resourceId, resourceType);
        
        if (existingProgress) {
            console.log('📊 Progress already exists, not creating new record');
            return existingProgress;
        }
        
        // Create new progress record
        const progressData = {
            userId,
            courseId,
            resourceType,
            percentComplete: 0,
            status: 'in_progress'
        };
        
        // ИСПРАВЛЕНО: Добавляем правильные поля в зависимости от типа
        if (resourceType === 'material') {
            progressData.materialId = resourceId; // Для материалов
            progressData.resourceId = resourceId; // Также добавляем resourceId для совместимости
        } else {
            progressData.resourceId = resourceId; // Для курсов/модулей/глав
        }
        
        // Add moduleId if provided
        if (moduleId && moduleId !== 'null' && moduleId !== 'undefined') {
            progressData.moduleId = moduleId;
        }
        
        console.log('📊 Creating progress with data:', progressData);
        
        const result = await createProgress(progressData);
        
        if (result.success && result.data) {
            console.log('✅ Progress created successfully:', result.data);
            return result.data;
        } else {
            throw new Error('Failed to create progress record');
        }
        
    } catch (error) {
        console.error('❌ Failed to mark resource as started:', error);
        throw error;
    }
};

/**
 * FIXED: Update progress percentage
 * @param {string} progressId - Progress ID
 * @param {number} percentComplete - Percentage (0-100)
 * @returns {Promise<Object>} Updated progress record
 */
export const updateProgressPercentage = async (progressId, percentComplete) => {
    try {
        console.log('📊 updateProgressPercentage called:', { progressId, percentComplete });
        
        // Validate percentage
        const validPercent = Math.max(0, Math.min(100, percentComplete));
        
        const status = validPercent >= 100 ? 'completed' : 
                      validPercent > 0 ? 'in_progress' : 'not_started';
        
        const updateData = {
            percentComplete: validPercent,
            status
        };
        
        // Add completion timestamp if completing
        if (validPercent >= 100) {
            updateData.completedAt = new Date().toISOString();
        }
        
        const result = await updateProgress(progressId, updateData);
        
        return result.data;
        
    } catch (error) {
        console.error('❌ Failed to update progress percentage:', error);
        throw error;
    }
};

/**
 * FIXED: Mark resource as completed
 * @param {string} progressId - Progress ID
 * @returns {Promise<Object>} Updated progress record
 */
export const markResourceCompleted = async (progressId) => {
    try {
        console.log('📊 markResourceCompleted called:', { progressId });
        
        const result = await updateProgress(progressId, {
            percentComplete: 100,
            status: 'completed',
            completedAt: new Date().toISOString()
        });
        
        return result.data;
        
    } catch (error) {
        console.error('❌ Failed to mark resource as completed:', error);
        throw error;
    }
};

/**
 * FIXED: Toggle resource completion
 * @param {string} progressId - Progress ID
 * @returns {Promise<Object>} Updated progress record
 */
export const toggleResourceCompletion = async (progressId) => {
    try {
        console.log('📊 toggleResourceCompletion called:', { progressId });
        
        // First get current progress to determine current state
        const currentProgress = await getProgressById(progressId);
        
        if (!currentProgress) {
            throw new ProgressAPIError('Progress record not found', 404, { progressId });
        }
        
        const isCurrentlyCompleted = currentProgress.status === 'completed';
        
        const updateData = {
            percentComplete: isCurrentlyCompleted ? 0 : 100,
            status: isCurrentlyCompleted ? 'not_started' : 'completed'
        };
        
        if (!isCurrentlyCompleted) {
            // Marking as completed
            updateData.completedAt = new Date().toISOString();
        } else {
            // Marking as not completed
            updateData.completedAt = null;
        }
        
        const result = await updateProgress(progressId, updateData);
        
        return result.data;
        
    } catch (error) {
        console.error('❌ Failed to toggle resource completion:', error);
        throw error;
    }
};

/**
 * FIXED: Get progress by ID
 * @param {string} progressId - Progress ID
 * @returns {Promise<Object|null>} Progress record or null
 */
export const getProgressById = async (progressId) => {
    try {
        const url = `${apiConfig.AZURE_FUNCTIONS_URL}/progress/${progressId}`;
        console.log('📊 Getting progress by ID:', progressId);
        
        const response = await makeProgressRequest(url, {
            method: 'GET'
        });
        
        if (response.status === 404) {
            return null;
        }
        
        const responseData = await parseProgressResponse(response);
        
        if (!response.ok) {
            throw new ProgressAPIError(
                responseData.error || 'Failed to get progress',
                response.status,
                responseData
            );
        }
        
        return responseData.data;
        
    } catch (error) {
        console.error('❌ Get progress by ID failed:', error);
        
        if (error.status === 404) {
            return null;
        }
        
        throw error;
    }
};

/**
 * Health check for Progress API
 * @returns {Promise<Object>} Health status
 */
export const checkProgressAPIHealth = async () => {
    try {
        // Try a simple GET request to check if API is responsive
        const url = `${apiConfig.AZURE_FUNCTIONS_URL}/progress?userId=health-check-${Date.now()}`;
        
        console.log('🏥 Progress API health check:', url);
        
        const response = await makeProgressRequest(url, {
            method: 'GET'
        });
        
        const result = {
            isHealthy: response.status === 404 || response.ok, // 404 is expected for health check
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString(),
            hasHostKey: !!(apiConfig.FUNCTION_KEYS?.HOST),
            endpoint: url
        };
        
        if (result.isHealthy) {
            console.log('🏥 Progress API health check: ✅ Healthy');
        } else {
            console.log('🏥 Progress API health check: ❌ Unhealthy');
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Progress API health check failed:', error);
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
 * Get user-friendly error message
 * @param {ProgressAPIError|Error} error - Error object
 * @returns {string} User-friendly error message
 */
export const getProgressErrorMessage = (error) => {
    if (!(error instanceof ProgressAPIError)) {
        return 'An unexpected error occurred. Please try again.';
    }
    
    switch (error.status) {
        case 0:
            return 'Cannot connect to server. Please check your internet connection.';
        case 400:
            return 'Invalid data provided. Please check your input.';
        case 401:
            return 'Authentication required. Please log in again.';
        case 404:
            return 'Progress record not found.';
        case 409:
            return 'Progress record already exists.';
        case 500:
            return 'Server error. Please try again later.';
        default:
            return error.message || 'An error occurred. Please try again.';
    }
};

/**
 * ADDED: Test progress operations
 * @param {string} userId - User ID for testing
 * @param {string} courseId - Course ID for testing
 * @returns {Promise<Object>} Test results
 */
export const testProgressOperations = async (userId, courseId) => {
    const testResults = {
        timestamp: new Date().toISOString(),
        userId,
        courseId,
        tests: [],
        overallSuccess: true
    };
    
    const testResourceId = `test-resource-${Date.now()}`;
    
    try {
        // Test 1: Health check
        console.log('🧪 Test 1: Health check');
        const healthResult = await checkProgressAPIHealth();
        testResults.tests.push({
            name: 'Health Check',
            success: healthResult.isHealthy,
            details: healthResult
        });
        
        if (!healthResult.isHealthy) {
            testResults.overallSuccess = false;
            return testResults;
        }
        
        // Test 2: Create progress
        console.log('🧪 Test 2: Create progress');
        const createResult = await markResourceStarted(userId, testResourceId, 'material', courseId);
        testResults.tests.push({
            name: 'Create Progress',
            success: !!createResult,
            details: createResult
        });
        
        if (!createResult) {
            testResults.overallSuccess = false;
            return testResults;
        }
        
        const progressId = createResult.progressId;
        
        // Test 3: Update progress
        console.log('🧪 Test 3: Update progress');
        const updateResult = await updateProgressPercentage(progressId, 50);
        testResults.tests.push({
            name: 'Update Progress',
            success: updateResult?.percentComplete === 50,
            details: updateResult
        });
        
        // Test 4: Mark completed
        console.log('🧪 Test 4: Mark completed');
        const completeResult = await markResourceCompleted(progressId);
        testResults.tests.push({
            name: 'Mark Completed',
            success: completeResult?.status === 'completed',
            details: completeResult
        });
        
        // Test 5: Toggle completion
        console.log('🧪 Test 5: Toggle completion');
        const toggleResult = await toggleResourceCompletion(progressId);
        testResults.tests.push({
            name: 'Toggle Completion',
            success: toggleResult?.status === 'not_started',
            details: toggleResult
        });
        
        // Test 6: Clean up - delete test record
        console.log('🧪 Test 6: Clean up');
        const deleteResult = await deleteProgress(progressId);
        testResults.tests.push({
            name: 'Delete Progress',
            success: deleteResult?.success === true,
            details: deleteResult
        });
        
    } catch (error) {
        console.error('❌ Progress operations test failed:', error);
        testResults.tests.push({
            name: 'Test Execution',
            success: false,
            error: error.message,
            details: error
        });
        testResults.overallSuccess = false;
    }
    
    // Check if any test failed
    testResults.overallSuccess = testResults.tests.every(test => test.success);
    
    console.log('🧪 Progress operations test completed:', testResults.overallSuccess ? '✅ All passed' : '❌ Some failed');
    
    return testResults;
};

// Export the service as default
const progressService = {
    // Core API operations
    getProgress,
    createProgress,
    updateProgress,
    deleteProgress,
    getProgressById,
    
    // Utility functions
    getUserResourceProgress,
    getUserCourseProgress,
    markResourceStarted,
    updateProgressPercentage,
    markResourceCompleted,
    toggleResourceCompletion,
    
    // Health and testing
    checkProgressAPIHealth,
    testProgressOperations,
    getProgressErrorMessage,
    ProgressAPIError
};

export default progressService;