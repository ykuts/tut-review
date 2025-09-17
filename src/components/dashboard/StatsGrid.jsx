import React from 'react';
import { 
  HiTrophy, 
  HiBookOpen, 
  HiClock,
  HiSparkles
} from 'react-icons/hi2';
import { FaCertificate } from 'react-icons/fa';

const StatsGrid = ({ stats }) => {
  const statsConfig = [
    {
      icon: HiTrophy,
      value: stats.coursesCompleted,
      label: "Courses Completed",
      color: "text-yellow-500",
      bgColor: "bg-yellow-50"
    },
    {
      icon: HiBookOpen,
      value: stats.coursesInProgress,
      label: "In Progress",
      color: "text-[#FF6B6B]",
      bgColor: "bg-red-50"
    },
    {
      icon: HiClock,
      value: stats.totalHoursLearned,
      label: "Hours Learned",
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      icon: FaCertificate,
      value: stats.certificatesEarned,
      label: "Certificates",
      color: "text-purple-500",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="space-y-6 mb-6 sm:mb-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statsConfig.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</span>
            </div>
            <h3 className="text-gray-600 font-medium text-sm sm:text-base">{stat.label}</h3>
          </div>
        ))}
      </div>
      
      {/* Current Streak Card */}
      <div className="bg-gradient-to-br from-[#FF6B6B] to-red-500 rounded-2xl p-4 sm:p-6 shadow-lg text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <HiSparkles className="w-6 h-6 sm:w-8 sm:h-8 mr-3" />
            <div>
              <h3 className="text-base sm:text-lg font-semibold">Learning Streak</h3>
              <p className="text-red-100 text-sm sm:text-base">Keep up the great work!</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl sm:text-4xl font-bold">{stats.currentStreak}</div>
            <div className="text-red-100 text-sm sm:text-base">Days</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsGrid;