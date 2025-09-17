import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useMsal } from "@azure/msal-react";
import userService from '../services/userService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const { accounts: msalAccounts } = useMsal();
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authProvider, setAuthProvider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [apiStatus, setApiStatus] = useState({
        isConnected: false,
        lastCheck: null,
        error: null
    });

    // Check authentication status on mount
    const checkAuthStatus = useCallback(async () => {
        setLoading(true);

        try {
            // Check Microsoft account
            if (msalAccounts.length > 0) {
                const msalUser = msalAccounts[0];
                await processMicrosoftUser(msalUser);
                return;
            }

            // Check Google account in localStorage
            const googleUser = localStorage.getItem('googleUser');
            if (googleUser) {
                try {
                    const parsedUser = JSON.parse(googleUser);
                    console.log('🟢 Found Google user in localStorage:', parsedUser);
                    await processGoogleUser(parsedUser);
                    return;
                } catch (error) {
                    console.error('Error parsing Google user from storage:', error);
                    localStorage.removeItem('googleUser');
                }
            }

            // No user found
            console.log('❌ No user found in storage');
            setUser(null);
            setAuthProvider(null);
            setIsAuthenticated(false);

        } catch (error) {
            console.error('Auth check error:', error);
        } finally {
            setLoading(false);
        }
    }, [msalAccounts]);

    // Process Microsoft user WITH fallback handling
    const processMicrosoftUser = async (msalUser) => {
        try {
            console.log('🔵 Processing Microsoft user:', msalUser.name);

            const oauthData = {
                id: msalUser.localAccountId,
                email: msalUser.username,
                name: msalUser.name,
                provider: 'microsoft',
                avatar: null
            };

            // Try to register/login with backend
            const result = await userService.registerOrLoginUser(oauthData);

            if (result.success) {
                const userData = {
                    ...oauthData,
                    isNewUser: result.isNewUser,
                    apiUser: result.user,
                    message: result.message
                };

                setUser(userData);
                setAuthProvider('microsoft');
                setIsAuthenticated(true);

                setApiStatus({
                    isConnected: true,
                    lastCheck: new Date().toISOString(),
                    error: null
                });

                console.log('✅ Microsoft user processed with backend:', userData);
            } else {
                throw new Error(result.message || 'Backend integration failed');
            }

        } catch (error) {
            console.error('❌ Microsoft user API integration failed:', error);

            // Fallback: set user without API integration
            const userData = {
                id: msalUser.localAccountId,
                email: msalUser.username,
                name: msalUser.name,
                provider: 'microsoft',
                avatar: null,
                isNewUser: false
            };

            setUser(userData);
            setAuthProvider('microsoft');
            setIsAuthenticated(true);

            // Set API status with detailed error info
            const errorMessage = userService.getErrorMessage(error);
            setApiStatus({
                isConnected: false,
                lastCheck: new Date().toISOString(),
                error: `Backend connection failed: ${errorMessage}`,
                details: {
                    originalError: error.message,
                    status: error.status || 'unknown',
                    suggestion: error.status === 401
                        ? 'Your Azure Functions may require authentication or API keys.'
                        : 'Please check if your backend is running and accessible.'
                }
            });

            console.log('⚠️ Using fallback authentication (local only)');
        }
    };

    // Process Google user WITH fallback handling
    const processGoogleUser = async (googleUserData) => {
        try {
            console.log('🟢 Processing Google user:', googleUserData.name);

            const oauthData = {
                id: googleUserData.id || googleUserData.sub,
                email: googleUserData.email,
                name: googleUserData.name,
                provider: 'google',
                picture: googleUserData.picture
            };

            console.log('🟢 OAuth data prepared:', oauthData);


            // Try to register/login with backend
            const result = await userService.registerOrLoginUser(oauthData);

            if (result.success) {
                const userData = {
                id: result.user?.userId || result.user?.id, 
                googleId: oauthData.id,
                email: oauthData.email,
                name: oauthData.name,
                provider: 'google',
                avatar: oauthData.picture,
                isNewUser: result.isNewUser,
                apiUser: result.user,
                message: result.message
                };

                console.log('🟢 Setting user data:', userData);
                setUser(userData);
                setAuthProvider('google');
                setIsAuthenticated(true);

                localStorage.setItem('googleUser', JSON.stringify(userData));

                setApiStatus({
                    isConnected: true,
                    lastCheck: new Date().toISOString(),
                    error: null
                });

                console.log('✅ Google user processed with backend:', userData);
            } else {
                throw new Error(result.message || 'Backend integration failed');
            }

        } catch (error) {
            console.error('❌ Google user API integration failed:', error);

            // Fallback: set user without API integration
            const userData = {
                id: googleUserData.id || googleUserData.sub,
            email: googleUserData.email,
            name: googleUserData.name,
            provider: 'google',
            avatar: googleUserData.picture,
            isNewUser: false,
            isTemporaryId: true
            };

            console.warn('⚠️ Using Google ID as temporary userId - API calls may fail');
            setUser(userData);
            setAuthProvider('google');
            setIsAuthenticated(true);

            // Set API status with detailed error info
            const errorMessage = userService.getErrorMessage(error);
            setApiStatus({
                isConnected: false,
                lastCheck: new Date().toISOString(),
                error: `Backend connection failed: ${errorMessage}`,
                details: {
                    originalError: error.message,
                    status: error.status || 'unknown',
                    suggestion: error.status === 401
                        ? 'Your Azure Functions may require authentication or API keys.'
                        : 'Please check if your backend is running and accessible.'
                }
            });

            console.log('⚠️ Using fallback authentication (local only)');
        }
    };

    // Run checkAuthStatus when accounts change
    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    // Login with Google
    const loginWithGoogle = useCallback(async (googleUserData) => {
        console.log('🟢 Google login started for:', googleUserData.email);
        setLoading(true);

        try {
            const user = {
                id: googleUserData.id,
                sub: googleUserData.id,
                email: googleUserData.email,
                name: googleUserData.name,
                picture: googleUserData.picture
            };

            // Save to localStorage for persistence
            localStorage.setItem('googleUser', JSON.stringify(user));

            // Process user with API integration (includes fallback)
            await processGoogleUser(user);

        } catch (error) {
            console.error('Google login processing failed:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Login with Microsoft (handled automatically via MSAL)
    const loginWithMicrosoft = useCallback(() => {
        console.log('🔵 Microsoft login handled by MSAL');
    }, []);

    // Universal logout
    const logout = useCallback(() => {
        setUser(null);
        setAuthProvider(null);
        setIsAuthenticated(false);
        setApiStatus({
            isConnected: false,
            lastCheck: null,
            error: null
        });

        // Clear Google storage
        localStorage.removeItem('googleUser');
        console.log('✅ User logged out');
    }, []);

    // Retry API integration
    const retryApiIntegration = useCallback(async () => {
        if (!user) return;

        console.log('🔄 Retrying API integration...');
        setLoading(true);

        try {
            if (authProvider === 'microsoft') {
                await processMicrosoftUser({
                    localAccountId: user.id,
                    username: user.email,
                    name: user.name
                });
            } else if (authProvider === 'google') {
                await processGoogleUser({
                    sub: user.id,
                    email: user.email,
                    name: user.name,
                    picture: user.avatar
                });
            }
        } catch (error) {
            console.error('Retry failed:', error);
        } finally {
            setLoading(false);
        }
    }, [user, authProvider]);

    // Test API health
    const testApiHealth = useCallback(async () => {
        console.log('🏥 Testing API health...');
        try {
            const healthStatus = await userService.checkAPIHealth();

            setApiStatus(prev => ({
                ...prev,
                isConnected: healthStatus.isHealthy,
                lastCheck: healthStatus.timestamp,
                error: healthStatus.isHealthy ? null : healthStatus.error
            }));

            return healthStatus;
        } catch (error) {
            console.error('Health check failed:', error);
            setApiStatus(prev => ({
                ...prev,
                isConnected: false,
                lastCheck: new Date().toISOString(),
                error: 'Health check failed: ' + error.message
            }));
            return { isHealthy: false, error: error.message };
        }
    }, []);

    const value = {
        user,
        isAuthenticated,
        authProvider,
        loading,
        apiStatus,
        loginWithGoogle,
        loginWithMicrosoft,
        logout,
        checkAuthStatus,
        retryApiIntegration,
        testApiHealth
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};