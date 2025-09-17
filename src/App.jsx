
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { msalConfig, googleConfig } from './config/authConfig';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import { ProgressProvider } from './contexts/ProgressContext';

import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import SignupPage from './pages/SignupPage';
import { useTranslation } from 'react-i18next';
import MaterialsPage from './pages/MaterialsPage';
import CourseModulesPage from './pages/CourseModulesPage';
import CourseEditorPage from './pages/CourseEditorPage';


const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.initialize().then(() => {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0 && !msalInstance.getActiveAccount()) {
    msalInstance.setActiveAccount(accounts[0]);
    console.log('✅ MSAL initialized with account:', accounts[0].username);
  } else {
    console.log('ℹ️ MSAL initialized, no cached accounts');
  }
}).catch((error) => {
  console.error('❌ Error initializing MSAL:', error);
});



function App() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <MsalProvider instance={msalInstance}>
      <GoogleOAuthProvider clientId={googleConfig.clientId}>
        <AuthProvider>
          <ProgressProvider> 
          <Router>
            <div className="App min-h-screen flex flex-col bg-gray-50">
              <Header />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  {/* Course modules route */}
                  <Route
                    path="/course/:courseId"
                    element={<CourseModulesPage />}
                  />
                  {/* Materials route with URL parameters */}
                  <Route
                    path="/materials/:courseId/:chapterId"
                    element={<MaterialsPage />}
                  />
                  {/* Fallback route for materials without courseId */}
                  <Route
                    path="/materials/:chapterId"
                    element={<MaterialsPage />}
                  />
                  {/* ADD EDITOR ROUTES 👇 */}
                  <Route path="/create-course" element={<CourseEditorPage />} />
                  <Route path="/edit-course/:courseId" element={<CourseEditorPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
          </ProgressProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </MsalProvider>
  );
}


export default App;