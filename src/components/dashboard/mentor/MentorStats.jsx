import React from 'react';
import { 
  HiAcademicCap,
  HiEye,
  HiEyeSlash, 
  HiUserGroup,
  HiChartBarSquare,
  HiUsers
} from 'react-icons/hi2';

const MentorStats = ({ stats }) => {
  const statCards = [
    {
      title: 'Courses Created',
      value: stats.coursesCreated,
      icon: HiAcademicCap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Public Courses',
      value: stats.publicCourses,
      icon: HiEye,
      color: 'text-green-600',
      bgColor: 'bg-green-50', 
      borderColor: 'border-green-200'
    },
    {
      title: 'Private Courses',
      value: stats.privateCourses,
      icon: HiEyeSlash,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Total Enrollments',
      value: stats.totalEnrollments,
      icon: HiUsers,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Students Managed',
      value: stats.studentsManaged,
      icon: HiUserGroup,
      color: 'text-indigo-600', 
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      title: 'Avg. Completion',
      value: `${stats.avgCompletionRate}%`,
      icon: HiChartBarSquare,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <div
              key={index}
              className={`bg-white rounded-xl border ${stat.borderColor} p-4 hover:shadow-md transition-shadow duration-200`}
            >
              <div className="text-center">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-xs text-gray-600 leading-tight">{stat.title}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MentorStats;