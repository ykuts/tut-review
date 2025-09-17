import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMsal } from "@azure/msal-react";
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { loginRequest } from '../config/authConfig';
import {
  HiExclamationTriangle,
  HiCheckCircle,
  HiArrowLeft,
  HiSparkles
} from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
    const { instance, inProgress } = useMsal();
    const { isAuthenticated, loginWithGoogle } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Redirect if user is already logged in
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    // Microsoft Login Handler
    const handleMicrosoftLogin = async () => {
        if (inProgress !== 'none') return;

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const loginResponse = await instance.loginPopup(loginRequest);
            setSuccessMessage(t('login.welcomeBackUser', { name: loginResponse.account.name }));

            // Simulate API call here
            console.log('🟦 Microsoft User:', {
                provider: 'microsoft',
                id: loginResponse.account.localAccountId,
                email: loginResponse.account.username,
                name: loginResponse.account.name,
                idToken: loginResponse.idToken
            });

            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (error) {
            if (error.name === 'BrowserAuthError' && error.message.includes('popup_window_error')) {
                setError(t('login.popupBlocked'));
            } else if (error.name === 'InteractionInProgress') {
                setError(t('login.interactionInProgress'));
            } else {
                setError(t('login.microsoftLoginFailed'));
            }
        } finally {
            setLoading(false);
        }
    };

    // Google Login Success Handler
    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setSuccessMessage('');

        try {
            const decoded = jwtDecode(credentialResponse.credential);

            // Use AuthContext for login
            await loginWithGoogle({
                id: decoded.sub,
                email: decoded.email,
                name: decoded.name,
                picture: decoded.picture
            });

            setSuccessMessage(t('login.welcomeBackUser', { name: decoded.name }));

            // Simulate API call here
            console.log('🟥 Google User:', {
                provider: 'google',
                id: decoded.sub,
                email: decoded.email,
                name: decoded.name,
                picture: decoded.picture,
                idToken: credentialResponse.credential
            });

            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (error) {
            console.error('❌ Google Decode Failed:', error);
            setError(t('login.googleProcessError'));
        }
    };

    const handleGoogleError = () => {
        setError(t('login.googleAuthFailed'));
    };

    // Loading state
    if (loading || inProgress === 'login') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#FF5F90] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Signing you in...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-white">
            <div className="w-full max-w-md">
                {/* Back to Home Button */}
                <Link 
                    to="/" 
                    className="inline-flex items-center text-gray-600 hover:text-[#FF5F90] mb-8 transition-colors duration-200"
                >
                    <HiArrowLeft className="w-5 h-5 mr-2" />
                    {t('login.backToHome')}
                </Link>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#FF5F90] to-red-500 rounded-2xl mb-4">
                            <HiSparkles className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('login.welcomeBack')}</h1>
                        <p className="text-gray-600">{t('login.signInToContinue')}</p>
                    </div>

                    {/* Success Message */}
                    {successMessage && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
                            <HiCheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                                <p className="text-green-800 font-medium">{successMessage}</p>
                                <p className="text-green-600 text-sm mt-1">{t('login.redirecting')}</p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                            <HiExclamationTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Login Buttons */}
                    <div className="space-y-4">
                        {/* Microsoft Login Button */}
                        <button
                            onClick={handleMicrosoftLogin}
                            disabled={loading || inProgress !== "none"}
                            className="w-full flex items-center justify-center px-6 py-4 bg-[#0078d4] text-white font-semibold rounded-lg hover:bg-[#106ebe] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                            ) : (
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/>
                                </svg>
                            )}
                            {loading ? 'Signing in...' : 'Continue with Microsoft'}
                        </button>

                        {/* Google Login Button */}
                        <div className="w-full">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                size="large"
                                width={400}
                                text="signin_with"
                                theme="outline"
                                shape="rectangular"
                                locale="en"
                                useOneTap={false}
                                cancel_on_tap_outside={true}
                                auto_select={false}
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="my-8 flex items-center">
                        <div className="flex-1 border-t border-gray-200"></div>
                        <span className="px-4 text-gray-500 text-sm">{t('login.newToAITutor')}</span>
                        <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    {/* Signup Link */}
                    <Link
                        to="/signup"
                        className="w-full flex items-center justify-center px-6 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:border-[#FF5F90] hover:text-[#FF5F90] transition-all duration-200 transform hover:scale-[1.02]"
                    >
                        {t('login.createAccount')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;