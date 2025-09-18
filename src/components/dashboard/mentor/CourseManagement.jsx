import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HiArrowPath,
  HiAcademicCap,
  HiEye,
  HiEyeSlash,
  HiUserGroup,
  HiCog6Tooth,
  HiPlusCircle
} from 'react-icons/hi2';

import CourseCard from '../CourseCard';

const CourseManagement = ({ 
  courses, 
  loading, 
  error, 
  onRetry, 
  onVisibilityToggle, 
  onAssignStudents, 
  onEditCourse 
}) => {
  
  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Your Courses</h2>
        
        <div className="flex items-center space-x-2">
          {error && (
            <button
              onClick={onRetry}
              disabled={loading}
              className="text-[#FF6B6B] hover:text-red-600 text-sm font-medium flex items-center disabled:opacity-50"
            >
              <HiArrowPath className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Retry
            </button>
          )}
          
          <span className="text-sm text-gray-500">
            {courses.length} course{courses.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#FF5F90] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading courses...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 mb-4">⚠️ {error}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Course Grid */}
      {!loading && !error && courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => (
            <div key={course.id} className="relative">
              {/* Base Course Card */}
              <CourseCard
                course={course}
                onSelect={() => window.open(`/course/${course.id}`, '_blank')}
                showDetails={true}
              />
              
              {/* Mentor-specific overlay */}
              <div className="absolute top-4 right-4">
                <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                  course.visibility === 'private' 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {course.visibility === 'private' ? (
                    <><HiEyeSlash className="w-3 h-3 inline mr-1" />Private</>
                  ) : (
                    <><HiEye className="w-3 h-3 inline mr-1" />Public</>
                  )}
                </div>
              </div>
              
              {/* Mentor Actions */}
              <div className="mt-4 flex gap-2 flex-wrap">
                <button 
                  onClick={() => onEditCourse(course)}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <HiCog6Tooth className="w-4 h-4 inline mr-1" />
                  Edit
                </button>
                
                <button 
                  onClick={() => onAssignStudents(course)}
                  className="flex-1 px-3 py-2 text-sm bg-[#FF6B6B] text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <HiUserGroup className="w-4 h-4 inline mr-1" />
                  Assign
                </button>
                
                <button 
                  onClick={() => onVisibilityToggle(
                    course.id, 
                    course.visibility === 'public' ? 'private' : 'public'
                  )}
                  className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  title={`Make ${course.visibility === 'public' ? 'Private' : 'Public'}`}
                >
                  {course.visibility === 'public' ? 
                    <HiEyeSlash className="w-4 h-4" /> : 
                    <HiEye className="w-4 h-4" />
                  }
                </button>
              </div>
              
              {/* Student Enrollment Info */}
              <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
                <span>👥 {course.enrolledStudents || 0} student{(course.enrolledStudents || 0) !== 1 ? 's' : ''} enrolled</span>
                {course.completionRate && (
                  <span>📊 {course.completionRate}% avg completion</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && courses.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <HiAcademicCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-500 mb-4">Create your first course to start teaching students.</p>
          <Link to="/create-course">
            <button className="px-6 py-3 bg-[#FF6B6B] text-white font-medium rounded-lg hover:bg-red-600 transition-colors">
              <HiPlusCircle className="w-5 h-5 inline mr-2" />
              Create Your First Course
            </button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;