import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useGoogleLogin } from '@react-oauth/google';
import { loginRequest } from '../config/authConfig';
import { useAuth } from '../contexts/AuthContext';
import {
  HiExclamationTriangle,
  HiCheckCircle,
  HiArrowLeft,
  HiSparkles
} from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import TranslatedText from '../components/TranslatedText';

const LoginPage = () => {
  const { instance, accounts, inProgress } = useMsal();
  const { loginWithGoogle } = useAuth(); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);

  useEffect(() => {
    if (accounts.length > 0 && inProgress === 'none') {
      navigate('/dashboard');
    }
  }, [accounts, inProgress, navigate]);

  const handleMicrosoftLogin = async () => {
    if (inProgress !== 'none') return;
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const loginResponse = await instance.loginPopup(loginRequest);
      setSuccessMessage(t('login.welcomeBackUser', { name: loginResponse.account.name }));
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

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const res = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const userInfo = await res.json();
        await loginWithGoogle(userInfo);
        setSuccessMessage(t('login.welcomeBackUser', { name: userInfo.name }));
        setTimeout(() => navigate('/dashboard'), 2000);
      } catch (error) {
        console.error('❌ Google Login Failed:', error);
        setError(t('login.googleProcessError'));
        setLoading(false);
      }
    },
    onError: () => setError(t('login.googleAuthFailed')),
    flow: 'implicit'
  });

  if (loading || inProgress === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF5F90] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">
            <TranslatedText keyName='login.signingYouIn' />
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-[#FF5F90] mb-8 transition-colors duration-200">
          <HiArrowLeft className="w-5 h-5 mr-2" />
          <TranslatedText keyName='login.backToHome' />
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#FF5F90] to-red-500 rounded-2xl mb-4">
              <HiSparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              <TranslatedText keyName='login.welcomeBack' />
            </h1>
            <p className="text-gray-600">
              <TranslatedText keyName='login.signInToContinue' />
            </p>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
              <HiCheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-green-800 font-medium">{successMessage}</p>
                <p className="text-green-600 text-sm mt-1">
                  <TranslatedText keyName='login.redirecting' />
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <HiExclamationTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleMicrosoftLogin}
              disabled={loading || inProgress !== 'none'}
              className="w-full flex items-center justify-center px-4 py-2.5 bg-white text-gray-800 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-100 transition-all duration-200"
            >
              {isRTL ? (
                <>
                  <span className="ml-2 font-bold">Microsoft  </span>
                  <span><TranslatedText keyName="login.signInWith" /></span>
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 ml-2">
                    <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                    <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
                    <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
                    <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
                  </svg>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 mr-2">
                    <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                    <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
                    <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
                    <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
                  </svg>
                  <span className="ml-2"><TranslatedText keyName="login.signInWith" /> <strong>Microsoft</strong></span>
                </>
              )}
            </button>

            <button
              onClick={() => googleLogin()}
              className="w-full flex items-center justify-center px-4 py-2.5 bg-white text-gray-800 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-100 transition-all duration-200"
            >
              {isRTL ? (
                <>
                  <span className="ml-2 font-bold">Google  </span>
                  <span><TranslatedText keyName="login.signInWith" /></span>
                  <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="w-5 h-5 ml-2" />
                </>
              ) : (
                <>
                  <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="w-5 h-5 mr-2" />
                  <span className="ml-2"><TranslatedText keyName="login.signInWith" /> <strong>Google</strong></span>
                </>
              )}
            </button>
          </div>

          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-gray-500 text-sm">
              <TranslatedText keyName='login.newToAITutor' />
            </span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <Link
            to="/signup"
            className="w-full flex items-center justify-center px-6 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:border-[#FF5F90] hover:text-[#FF5F90] transition-all duration-200 transform hover:scale-[1.02]"
          >
            <TranslatedText keyName='login.createAccount' />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;