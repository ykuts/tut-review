import React from 'react';
import { HiArrowRight, HiClock, HiCalendar, HiTag } from 'react-icons/hi2';

const CourseCard = ({ course, onClick, showDetails = false }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            In Progress
          </span>
        );
      case 'not-started':
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
            Not Started
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
            Available
          </span>
        );
    }
  };

  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return null;
    }
  };

  return (
    <div 
      className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center flex-1 min-w-0">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${course.bgColor || 'bg-gray-100'} flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0`}>
            {course.icon ? (
              <course.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${course.color || 'text-gray-500'}`} />
            ) : (
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-400 rounded"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate">{course.title}</h3>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mt-1 space-y-1 sm:space-y-0">
              {getStatusBadge(course.status)}
              <span className="text-xs sm:text-sm text-gray-600">{course.difficulty || 'Beginner'}</span>
            </div>
          </div>
        </div>
        <HiArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
      </div>

      {/* Course Description */}
      {course.description && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
        </div>
      )}

      {/* Course Slug */}
      {course.slug && (
        <div className="mb-3">
          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded">
            <HiTag className="w-3 h-3 mr-1" />
            {course.slug}
          </span>
        </div>
      )}

      {showDetails && (
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <HiClock className="w-4 h-4 mr-1" />
              <span>{course.estimatedTime || '8 hours'}</span>
            </div>
            <span className="text-xs sm:text-sm">
              {course.completedModules || 0}/{course.totalModules || 0} modules
            </span>
          </div>
          
          <div className="text-xs sm:text-sm text-gray-600">
            {course.completedChapters || 0}/{course.totalChapters || 0} chapters completed
          </div>

          {/* Real API Data Display */}
          {(course.modules || course.all_chapters) && (
            <div className="text-xs text-gray-500 space-y-1">
              {course.modules && course.modules.length > 0 && (
                <div>📚 {course.modules.length} modules available</div>
              )}
              {course.all_chapters && course.all_chapters.length > 0 && (
                <div>📖 {course.all_chapters.length} chapters total</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs sm:text-sm text-gray-600">Progress</span>
          <span className="text-xs sm:text-sm font-medium text-[#FF6B6B]">{course.progress || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-[#FF6B6B] to-red-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${course.progress || 0}%` }}
          ></div>
        </div>
      </div>

      {/* Course Metadata */}
      {(course.created_at || course.updated_at) && (
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            {course.created_at && (
              <div className="flex items-center">
                <HiCalendar className="w-3 h-3 mr-1" />
                <span>Created {formatDate(course.created_at)}</span>
              </div>
            )}
            {course.updated_at && (
              <span>Updated {formatDate(course.updated_at)}</span>
            )}
          </div>
        </div>
      )}

      {/* Development Info */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <div><strong>ID:</strong> {course.id || course._id || 'N/A'}</div>
            {course.slug && <div><strong>Slug:</strong> {course.slug}</div>}
            <div><strong>API Modules:</strong> {course.modules?.length || 0}</div>
            <div><strong>API Chapters:</strong> {course.all_chapters?.length || 0}</div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default CourseCard;