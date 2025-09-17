// src/components/dashboard/WelcomeHeader.jsx
import React from 'react';
import { HiUser } from 'react-icons/hi2';

const WelcomeHeader = ({ user }) => {
  return (
    <div className="bg-gradient-to-r from-[#FF6B6B] to-red-500 rounded-2xl p-6 sm:p-8 text-white mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Welcome back, {user.name?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="text-red-100 text-base sm:text-lg">Ready to continue your coding journey?</p>
        </div>
        <div className="flex justify-center sm:justify-end">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            {user.picture || user.avatar ? (
              <img 
                src={user.picture || user.avatar} 
                alt={user.name}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover"
                onError={(e) => {
                  console.error('Avatar failed to load:', e.target.src);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center ${user.picture || user.avatar ? 'hidden' : 'flex'}`}>
              <span className="text-white text-lg sm:text-xl font-bold">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHeader;