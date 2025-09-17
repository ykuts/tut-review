import apiConfig, { buildUrl, getRequestOptions } from '../config/apiConfig';

/**
 * Custom API Error class
 */
export class APIError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Make authenticated request to Azure Functions
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @param {string} functionKey - Function key to use
 * @returns {Promise<Response>} Response object
 */
const makeAuthenticatedRequest = async (url, options, functionKey = null) => {
    const keyToUse = functionKey || apiConfig.FUNCTION_KEY;
    
    try {
        const requestOptions = getRequestOptions(options.headers || {}, keyToUse);
        
        console.log(`🔄 Making request to: ${url}`);
        console.log(`   Method: ${options.method || 'GET'}`);
        console.log(`   Has Function Key: ${!!keyToUse}`);
        
        if (options.body) {
            console.log(`   Request Body:`, options.body);
        }
        
        const response = await fetch(url, {
            ...options,
            headers: requestOptions.headers,
            signal: requestOptions.signal
        });
        
        console.log(`📡 Response: ${response.status} ${response.statusText}`);
        
        return response;
        
    } catch (error) {
        console.error(`❌ Request failed:`, error);
        throw error;
    }
};

/**
 * Parse response with proper error handling
 * @param {Response} response - Fetch response
 * @returns {Promise<Object>} Parsed response data
 */
const parseResponse = async (response) => {
    try {
        const responseText = await response.text();
        console.log(`📄 Raw response:`, responseText);
        
        if (!responseText) {
            return { 
                success: false, 
                error: 'Empty response from server' 
            };
        }
        
        try {
            return JSON.parse(responseText);
        } catch (jsonError) {
            console.error('❌ JSON parsing failed:', jsonError);
            return {
                success: false,
                error: 'Invalid JSON response from server',
                rawResponse: responseText
            };
        }
        
    } catch (error) {
        console.error('❌ Failed to read response:', error);
        return {
            success: false,
            error: 'Failed to read server response',
            originalError: error.message
        };
    }
};

/**
 * Create a user according to API documentation
 * @param {Object} userData - User data from OAuth provider
 * @param {string} functionKey - Optional function key
 * @returns {Promise<Object>} API response
 */
export const createUser = async (userData, functionKey = null) => {
    try {
        const url = buildUrl(apiConfig.ENDPOINTS.USERS); // /api/users
        
        console.log('🔵 Creating user with data:', userData);
        
        // Prepare request body according to API documentation
        // Required fields: email, preferredLanguage, name
        const requestBody = {
            // Required fields
            email: userData.email,
            preferredLanguage: userData.preferredLanguage || 'en',
            name: userData.name,
            
            // Optional OAuth fields (camelCase as per API docs)
            ...(userData.microsoftUserId && { microsoftUserId: userData.microsoftUserId }),
            ...(userData.googleUserId && { googleUserId: userData.googleUserId }),
            ...(userData.authProvider && { authProvider: userData.authProvider }),
            ...(userData.profilePictureUrl && { profilePictureUrl: userData.profilePictureUrl }),
            ...(userData.lastLogin && { lastLogin: userData.lastLogin })
        };
        
        console.log('🔵 Sending request body:', requestBody);
        
        const response = await makeAuthenticatedRequest(url, {
            method: 'POST',
            body: JSON.stringify(requestBody)
        }, functionKey);
        
        const responseData = await parseResponse(response);
        
        if (!response.ok) {
            let errorMessage;
            
            switch (response.status) {
                case 400:
                    errorMessage = responseData.message || responseData.error || 'Missing required fields';
                    break;
                case 401:
                    errorMessage = 'Authentication required. Please check your function key.';
                    break;
                case 403:
                    errorMessage = 'Access denied. Please check your permissions.';
                    break;
                case 409:
                    errorMessage = responseData.message || responseData.error || 'User already exists';
                    break;
                case 500:
                    errorMessage = responseData.message || responseData.error || 'Server error. Please check Azure Functions logs.';
                    break;
                default:
                    errorMessage = responseData.message || responseData.error || `HTTP ${response.status} error`;
            }
            
            throw new APIError(errorMessage, response.status, responseData);
        }
        
        console.log('✅ User created successfully:', responseData);
        return {
            success: true,
            data: responseData,
            isNewUser: true
        };
        
    } catch (error) {
        console.error('❌ Create user failed:', error);
        
        if (error instanceof APIError) {
            throw error;
        }
        
        // Network errors
        throw new APIError(
            'Network error. Please check your internet connection.',
            0,
            { message: error.message }
        );
    }
};

/**
 * Get user by ID from API
 * @param {string} userId - User UUID
 * @param {string} functionKey - Optional function key
 * @returns {Promise<Object>} User data or null
 */
export const getUserById = async (userId, functionKey = null) => {
    try {
        const url = buildUrl(apiConfig.ENDPOINTS.USER_BY_ID, userId); // /api/users/{id}
        
        console.log('🔍 Getting user by ID:', userId);
        
        const response = await makeAuthenticatedRequest(url, {
            method: 'GET'
        }, functionKey);
        
        if (response.status === 404) {
            return { exists: false, user: null };
        }
        
        const responseData = await parseResponse(response);
        
        if (!response.ok) {
            throw new APIError(
                responseData.message || responseData.error || 'Failed to get user',
                response.status,
                responseData
            );
        }
        
        console.log('✅ User found:', responseData);
        return {
            exists: true,
            user: responseData.data || responseData
        };
        
    } catch (error) {
        console.error('❌ Get user failed:', error);
        return { exists: false, user: null, error: error.message };
    }
};

/**
 * Register or login user - unified method according to API docs
 * @param {Object} oauthData - Data from OAuth provider
 * @param {string} functionKey - Optional function key
 * @returns {Promise<Object>} User data and registration status
 */
export const registerOrLoginUser = async (oauthData, functionKey = null) => {
    try {
        console.log('🚀 Starting register/login process for:', oauthData.email);
        console.log('🚀 Original OAuth data:', oauthData);
        
        // Prepare user data according to API documentation
        const userData = {
            // Required fields
            email: oauthData.email,
            preferredLanguage: 'en',
            name: oauthData.name,
            
            // Optional fields
            authProvider: oauthData.provider,
            profilePictureUrl: oauthData.picture || oauthData.avatar,
            lastLogin: new Date().toISOString()
        };
        
        // Add provider-specific IDs (camelCase as per API docs)
        if (oauthData.provider === 'microsoft') {
            userData.microsoftUserId = oauthData.id;
        } else if (oauthData.provider === 'google') {
            userData.googleUserId = oauthData.id;
        }
        
        console.log('🚀 Prepared user data for API:', userData);
        
        try {
            const result = await createUser(userData, functionKey);
            return {
                success: true,
                isNewUser: true,
                user: result.data,
                message: 'Account created successfully!'
            };
            
        } catch (error) {
            console.log('🔍 Create user error details:', {
                status: error.status,
                message: error.message,
                data: error.data
            });
            
            // Handle user already exists (409 conflict)
            if (error.status === 409) {
                console.log('ℹ️ User already exists, this is normal');
                return {
                    success: true,
                    isNewUser: false,
                    user: {
                        email: userData.email,
                        name: userData.name,
                        provider: userData.authProvider
                    },
                    message: 'Welcome back!'
                };
            }
            
            // Handle authentication errors
            if (error.status === 401) {
                return {
                    success: false,
                    isNewUser: false,
                    user: null,
                    message: 'Azure Functions authentication required.',
                    error: error.message,
                    instructions: 'Please add your function key to apiConfig.js'
                };
            }
            
            // Re-throw other errors
            throw error;
        }
        
    } catch (error) {
        console.error('❌ Register/login failed:', error);
        throw error;
    }
};

/**
 * API Health Check
 * @param {string} functionKey - Optional function key
 * @returns {Promise<Object>} Health status with details
 */
export const checkAPIHealth = async (functionKey = null) => {
    try {
        const url = buildUrl(apiConfig.ENDPOINTS.USERS);
        console.log('🔍 Checking API health at:', url);
        
        const response = await makeAuthenticatedRequest(url, {
            method: 'GET'
        }, functionKey);
        
        const responseData = await parseResponse(response);
        
        const result = {
            isHealthy: response.ok,
            status: response.status,
            statusText: response.statusText,
            data: responseData,
            timestamp: new Date().toISOString(),
            hasFunctionKey: !!(functionKey || apiConfig.FUNCTION_KEY)
        };
        
        if (response.ok) {
            console.log('✅ API is healthy:', result);
        } else {
            console.log('❌ API is unhealthy:', result);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ API health check failed:', error);
        return {
            isHealthy: false,
            error: error.message,
            timestamp: new Date().toISOString(),
            hasFunctionKey: !!(functionKey || apiConfig.FUNCTION_KEY)
        };
    }
};

/**
 * Get user-friendly error message
 * @param {APIError|Error} error - Error object
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
    if (!(error instanceof APIError)) {
        return 'An unexpected error occurred. Please try again.';
    }
    
    switch (error.status) {
        case 0:
            return 'Cannot connect to server. Please check your internet connection.';
        case 400:
            return 'Missing required fields. Please check that email, name, and preferredLanguage are provided.';
        case 401:
            return 'Authentication required. Please add your Azure Function key.';
        case 403:
            return 'Access denied. Please check your permissions.';
        case 404:
            return 'User not found.';
        case 405:
            return 'Method not allowed.';
        case 409:
            return 'User already exists'; // This is normal, not an error
        case 500:
            return 'Server error. Please check Azure Functions logs.';
        default:
            return error.message || 'An error occurred. Please try again.';
    }
};

const userService = {
    createUser,
    getUserById,
    registerOrLoginUser,
    checkAPIHealth,
    getErrorMessage,
    APIError,
};

export default userService;