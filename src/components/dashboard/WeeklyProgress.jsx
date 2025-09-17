// src/components/dashboard/WeeklyProgress.jsx
import React from 'react';

const WeeklyProgress = ({ weeklySchedule, weeklyProgress, weeklyGoal }) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Weekly Progress</h2>
        <div className="text-sm text-gray-600">
          {weeklyProgress}/{weeklyGoal} hours this week
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
        {weeklySchedule.map((day, index) => (
          <div key={index} className="text-center">
            <div className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">{day.day}</div>
            <div className="relative h-16 sm:h-20 bg-gray-100 rounded-lg overflow-hidden">
              <div 
                className="absolute bottom-0 w-full bg-gray-300 transition-all duration-500"
                style={{ height: `${(day.planned / 2) * 100}%` }}
              ></div>
              <div 
                className="absolute bottom-0 w-full bg-[#FF6B6B] transition-all duration-500"
                style={{ height: `${(day.completed / 2) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">{day.completed}h</div>
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-center space-x-4 sm:space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
          <span className="text-gray-600">Planned</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-[#FF6B6B] rounded-full mr-2"></div>
          <span className="text-gray-600">Completed</span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyProgress;