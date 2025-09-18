import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Contexts and hooks
import { useAuth } from '../contexts/AuthContext';
import useScrollToTop from '../hooks/useScrollToTop';

// Dashboard components
import ViewToggle from '../components/dashboard/ViewToggle';
import StudentDashboard from '../components/dashboard/student/StudentDashboard';
import MentorDashboard from '../components/dashboard/mentor/MentorDashboard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, authLoading } = useAuth();
  
  // View state - default to student, switch to mentor if user prefers
  const [currentView, setCurrentView] = useState('student');

  useScrollToTop({ smooth: true, delay: 100 });

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('❌ No authenticated user, redirecting to login');
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Set initial view based on user preferences or role
  useEffect(() => {
    if (user?.role?.includes('mentor')) {
      // If user is only mentor (not student), default to mentor view
      if (!user.role.includes('student')) {
        setCurrentView('mentor');
      }
      // If user has both roles, could check localStorage for preference
      const savedView = localStorage.getItem('dashboardView');
      if (savedView && ['student', 'mentor'].includes(savedView)) {
        setCurrentView(savedView);
      }
    }
  }, [user]);

  /**
   * Handle view switching between student and mentor dashboards
   */
  const handleViewChange = (newView) => {
    setCurrentView(newView);
    // Save preference to localStorage
    localStorage.setItem('dashboardView', newView);
    console.log(`🔄 Switching to ${newView} view`);
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF5F90] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Return early if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* View Toggle - Show only if user has mentor role */}
      {user?.role?.includes('mentor') && (
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <ViewToggle 
              user={user}
              currentView={currentView}
              onViewChange={handleViewChange}
            />
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="py-4 sm:py-8">
        {currentView === 'mentor' ? (
          <MentorDashboard user={user} />
        ) : (
          <StudentDashboard user={user} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
