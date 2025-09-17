// src/components/dashboard/RecentActivity.jsx
import React from 'react';
import { HiBookOpen, HiCheckCircle } from 'react-icons/hi2';
import { FaCertificate } from 'react-icons/fa';

const RecentActivity = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'chapter-completed':
        return <HiBookOpen className="w-4 h-4 text-blue-500" />;
      case 'module-completed':
        return <HiCheckCircle className="w-4 h-4 text-green-500" />;
      case 'certificate-earned':
        return <FaCertificate className="w-4 h-4 text-purple-500" />;
      default:
        return <HiBookOpen className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityBgColor = (type) => {
    switch (type) {
      case 'chapter-completed':
        return 'bg-blue-100';
      case 'module-completed':
        return 'bg-green-100';
      case 'certificate-earned':
        return 'bg-purple-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Recent Activity</h2>
      <div className="space-y-3 sm:space-y-4">
        {activities.map(activity => (
          <div key={activity.id} className="flex items-start space-x-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityBgColor(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
              <p className="text-xs text-gray-600 truncate">{activity.course}</p>
              <p className="text-xs text-gray-500">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;