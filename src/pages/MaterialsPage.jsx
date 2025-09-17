import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ChapterMaterialsView from '../components/dashboard/ChapterMaterialsView';
import coursesService from '../services/coursesService';
import useScrollToTop from '../hooks/useScrollToTop';
import { HiArrowLeft, HiExclamationTriangle } from 'react-icons/hi2';

const MaterialsPage = () => {
  const { courseId, chapterId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [chapterInfo, setChapterInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auto scroll to top
  useScrollToTop({ smooth: true, delay: 100 });

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Load chapter info from URL parameters
  useEffect(() => {
    if (isAuthenticated && !authLoading && chapterId) {
      setChapterInfo({
        id: chapterId,
        chapterId: chapterId,
        title: 'Chapter Materials',
        courseId: courseId || 'unknown',
        courseTitle: 'Course Content'
      });
      setLoading(false);
    }
  }, [courseId, chapterId, isAuthenticated, authLoading]);

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B6B] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading materials...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <HiExclamationTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-red-800 font-medium">Materials Loading Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center"
                >
                  <HiArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render materials view
  const handleBack = () => {
    if (courseId) {
      navigate('/dashboard', { state: { selectedCourseId: courseId } });
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <ChapterMaterialsView
      chapter={chapterInfo}
      onBack={handleBack}
    />
  );
};

export default MaterialsPage;