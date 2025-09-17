// src/services/apiService.js
import apiConfig, { buildUrl, getRequestOptions } from '../config/apiConfig';

/**
 * Service for handling all API calls to the backend
 * Clean version without excessive logging
 */

/**
 * Create a user in the backend system
 * @param {Object} userData - User data from OAuth provider
 * @returns {Promise<Object>} API response
 */
export const createUser = async (userData) => {
    try {
        const url = buildUrl(apiConfig.ENDPOINTS.USERS);
        const options = getRequestOptions();
        
        const response = await fetch(url, {
            method: 'POST',
            ...options,
            body: JSON.stringify({
                // Required fields
                email: userData.email,
                name: userData.name,
                preferredLanguage: userData.preferredLanguage || 'en',
                
                // Optional OAuth fields
                ...(userData.microsoftUserId && { microsoftUserId: userData.microsoftUserId }),
                ...(userData.googleUserId && { googleUserId: userData.googleUserId }),
                ...(userData.authProvider && { authProvider: userData.authProvider }),
                ...(userData.profilePictureUrl && { profilePictureUrl: userData.profilePictureUrl }),
                
                // Set lastLogin to current timestamp
                lastLogin: new Date().toISOString(),
            }),
        });

        const responseData = await response.json();
        
        if (!response.ok) {
            throw new APIError(
                responseData.error || apiConfig.ERROR_MESSAGES.SERVER_ERROR, 
                response.status, 
                responseData
            );
        }

        return {
            success: true,
            data: responseData,
        };

    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        
        // Network or other errors
        throw new APIError(
            apiConfig.ERROR_MESSAGES.NETWORK_ERROR, 
            500, 
            { message: 'Failed to connect to server. Please check your internet connection.' }
        );
    }
};

/**
 * Check if user exists and get user data
 * @param {string} email - User email
 * @returns {Promise<Object>} User data or null if not found
 */
export const getUserByEmail = async (email) => {
    try {
        const url = buildUrl(apiConfig.ENDPOINTS.USER_BY_EMAIL, { email });
        const options = getRequestOptions();
        
        const response = await fetch(url, {
            method: 'GET',
            ...options,
        });

        if (response.status === 404) {
            return { exists: false, user: null };
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const userData = await response.json();
        return { exists: true, user: userData };

    } catch (error) {
        return { exists: false, user: null };
    }
};

/**
 * Register or login user - unified method
 * @param {Object} oauthData - Data from OAuth provider
 * @returns {Promise<Object>} User data and registration status
 */
export const registerOrLoginUser = async (oauthData) => {
    try {
        // Prepare user data for API
        const userData = {
            email: oauthData.email,
            name: oauthData.name,
            preferredLanguage: 'en',
            authProvider: oauthData.provider,
            profilePictureUrl: oauthData.picture || oauthData.avatar,
        };

        // Add provider-specific IDs
        if (oauthData.provider === 'microsoft') {
            userData.microsoftUserId = oauthData.id;
        } else if (oauthData.provider === 'google') {
            userData.googleUserId = oauthData.id;
        }

        // Try to create user
        try {
            const result = await createUser(userData);
            return {
                success: true,
                isNewUser: true,
                user: result.data,
                message: 'Account created successfully!'
            };
            
        } catch (error) {
            // Check if user already exists (this is normal, not an error)
            if (error.status === 409 && error.data?.error === 'User already exists') {
                return {
                    success: true,
                    isNewUser: false,
                    user: {
                        email: userData.email,
                        name: userData.name,
                    },
                    message: 'Welcome back!'
                };
            }
            
            // Re-throw other errors (these are actual errors)
            throw error;
        }

    } catch (error) {
        throw error;
    }
};

/**
 * API Health Check
 * @returns {Promise<boolean>} Whether API is available
 */
export const checkAPIHealth = async () => {
    try {
        const url = buildUrl(apiConfig.ENDPOINTS.HEALTH);
        const options = getRequestOptions();
        
        const response = await fetch(url, {
            method: 'GET',
            ...options,
        });
        
        return response.ok;
    } catch (error) {
        return false;
    }
};

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
 * Handle API errors and return user-friendly messages
 * @param {APIError} error - API error object
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
    if (!(error instanceof APIError)) {
        return 'An unexpected error occurred. Please try again.';
    }

    switch (error.status) {
        case 400:
            if (error.data?.error === 'Invalid email format') {
                return apiConfig.ERROR_MESSAGES.INVALID_EMAIL;
            }
            if (error.data?.error === 'Missing required fields') {
                return apiConfig.ERROR_MESSAGES.MISSING_FIELDS;
            }
            return 'Invalid request. Please try again.';
            
        case 409:
            return apiConfig.ERROR_MESSAGES.USER_EXISTS;
            
        case 500:
            if (error.data?.error === 'Database connection failed') {
                return apiConfig.ERROR_MESSAGES.DATABASE_ERROR;
            }
            return apiConfig.ERROR_MESSAGES.SERVER_ERROR;
            
        default:
            return error.data?.message || 'An error occurred. Please try again.';
    }
};

const apiService = {
    createUser,
    getUserByEmail,
    registerOrLoginUser,
    getErrorMessage,
    checkAPIHealth,
    APIError,
};

export default apiService;