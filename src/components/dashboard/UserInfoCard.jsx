// src/components/dashboard/UserInfoCard.jsx
import React from 'react';
import { 
  HiUser, 
  HiInbox, 
  HiIdentification,
  HiTrophy
} from 'react-icons/hi2';

const UserInfoCard = ({ user, authProvider }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 mb-6 sm:mb-8 border border-gray-100">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
        <HiIdentification className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-[#FF5F90]" />
        Your Account Information
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-4">
          <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg">
            <HiInbox className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900 truncate">{user.email}</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div className="w-5 h-5 mr-3 flex items-center justify-center flex-shrink-0">
              {user.picture || user.avatar ? (
                <img 
                  src={user.picture || user.avatar} 
                  alt={user.name}
                  className="w-5 h-5 rounded-full object-cover"
                  onError={(e) => {
                    console.error('Avatar failed to load in UserInfo:', e.target.src);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <HiUser className={`w-5 h-5 text-gray-500 ${user.picture || user.avatar ? 'hidden' : 'block'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-medium text-gray-900 truncate">{user.name}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg">
            <HiIdentification className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">User ID</p>
              <p className="font-mono text-sm text-gray-900 truncate">{user.id}</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg">
            <HiTrophy className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">Auth Provider</p>
              <p className="font-medium text-green-600">
                ✅ {authProvider === 'microsoft' ? 'Microsoft' : 'Google'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Picture Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
          <p>Debug: Picture URL: {user.picture || 'No picture'}</p>
          <p>Debug: Avatar URL: {user.avatar || 'No avatar'}</p>
          <p>Debug: Final URL: {user.picture || user.avatar || 'No image'}</p>
        </div>
      )}
    </div>
  );
};

export default UserInfoCard;