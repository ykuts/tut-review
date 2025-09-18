import React from 'react';
import { HiUserGroup, HiEye, HiChartBarSquare } from 'react-icons/hi2';

/**
 * Format date to readable string
 */
const formatDate = (date) => {
  if (!date) return 'Never';
  
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} hours ago`;
  } else if (diffInDays < 7) {
    return `${Math.floor(diffInDays)} days ago`;
  } else {
    return new Date(date).toLocaleDateString();
  }
};

const StudentList = ({ students, onViewProgress }) => {
  if (!students || students.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Your Students</h3>
          <HiUserGroup className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="text-center py-8">
          <HiUserGroup className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No assigned students yet</p>
          <p className="text-gray-400 text-xs mt-1">Students will appear here when you assign courses</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Your Students</h3>
        <div className="flex items-center space-x-2">
          <HiUserGroup className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">{students.length}</span>
        </div>
      </div>

      <div className="space-y-4">
        {students.map((student) => (
          <div 
            key={student.id}
            className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                {student.avatar ? (
                  <img 
                    src={student.avatar} 
                    alt={student.name}
                    className="w-8 h-8 rounded-md object-cover"
                  />
                ) : (
                  <span className="text-blue-600 font-medium text-sm">
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </span>
                )}
              </div>

              {/* Student Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {student.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {student.email}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Last active: {formatDate(student.lastActive)}
                </div>
              </div>
            </div>

            {/* Progress & Actions */}
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <div className="text-xs text-gray-500">
                  {student.completedCourses}/{student.enrolledCourses} courses
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  student.overallProgress >= 80 ? 'bg-green-400' :
                  student.overallProgress >= 50 ? 'bg-yellow-400' : 
                  'bg-red-400'
                }`} />
              </div>
              
              <div className="text-xs font-medium text-gray-700 mb-2">
                {student.overallProgress}% complete
              </div>

              <button
                onClick={() => onViewProgress(student.id)}
                className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                <HiEye className="w-3 h-3 mr-1" />
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* View All Students Button */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button 
          onClick={() => alert('Student management page coming soon!')}
          className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <HiChartBarSquare className="w-4 h-4 inline mr-2" />
          Manage All Students
        </button>
      </div>
    </div>
  );
};

export default StudentList;
