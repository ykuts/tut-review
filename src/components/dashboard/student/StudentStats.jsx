import React from 'react';
import { 
  HiBookOpen, 
  HiClock, 
  HiTrophy, 
  HiAcademicCap,
  HiFire 
} from 'react-icons/hi2';

const StudentStats = ({ stats }) => {
  const statCards = [
    {
      title: 'Courses Completed',
      value: stats.coursesCompleted,
      icon: HiTrophy,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'In Progress',
      value: stats.coursesInProgress,
      icon: HiBookOpen,
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Hours Learned',
      value: `${stats.totalHoursLearned}h`,
      icon: HiClock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50', 
      borderColor: 'border-purple-200'
    },
    {
      title: 'Certificates',
      value: stats.certificatesEarned,
      icon: HiAcademicCap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Current Streak',
      value: `${stats.currentStreak} days`,
      icon: HiFire,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <div
              key={index}
              className={`bg-white rounded-xl border ${stat.borderColor} p-4 hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-center">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.title}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentStats;