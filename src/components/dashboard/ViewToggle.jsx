import React from 'react';
import { HiAcademicCap, HiUserCircle } from 'react-icons/hi2';

/**
 * Toggle component for switching between student and mentor dashboard views
 * Only renders if user has mentor role
 */
const ViewToggle = ({ user, currentView, onViewChange }) => {
  // Don't render if user is not a mentor
  if (!user?.role?.includes('mentor')) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      {/* View Info */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B6B] to-red-500 rounded-lg flex items-center justify-center">
          <HiAcademicCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Dashboard View</h3>
          <p className="text-sm text-gray-500">
            {currentView === 'mentor' 
              ? '👨‍🏫 Managing your courses and students'
              : '🎓 Your learning journey and progress'
            }
          </p>
        </div>
      </div>
      
      {/* Toggle Buttons */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button 
          onClick={() => onViewChange('student')}
          className={`
            px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2
            ${currentView === 'student' 
              ? 'bg-white shadow-sm text-[#FF6B6B] border border-gray-200' 
              : 'text-gray-600 hover:text-gray-800'
            }
          `}
        >
          <HiUserCircle className="w-4 h-4" />
          <span>Student View</span>
        </button>
        
        <button 
          onClick={() => onViewChange('mentor')}
          className={`
            px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2
            ${currentView === 'mentor' 
              ? 'bg-white shadow-sm text-[#FF6B6B] border border-gray-200' 
              : 'text-gray-600 hover:text-gray-800'
            }
          `}
        >
          <HiAcademicCap className="w-4 h-4" />
          <span>Mentor View</span>
        </button>
      </div>
    </div>
  );
};

export default ViewToggle;