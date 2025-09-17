import React from "react";
import { Disclosure, Menu } from "@headlessui/react";
import { Link, useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { useAuth } from '../contexts/AuthContext';
import { HiSparkles, HiArrowRightOnRectangle, HiUserCircle } from "react-icons/hi2";
import { GlobeAltIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import clsx from "clsx";
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'tl', label: 'Tagalog', nativeLabel: 'Tagalog' },
  { code: 'uk', label: 'Ukrainian', nativeLabel: 'Українська' },
  { code: 'sa', label: 'Sanskrit', nativeLabel: 'संस्कृतम्' },
  { code: 'ny', label: 'Chichewa', nativeLabel: 'Chicheŵa' }
];

const navigation = [
  { name: "Home", href: "/", current: false },
  { name: "AI Courses", href: "/courses", current: false },
  { name: "AI Tutor", href: "/tutor", current: false },
  { name: "Progress", href: "/progress", current: false },
  { name: "About", href: "/about", current: false },
  { name: "Contact", href: "/contact", current: false },
];

const Header = () => {
  const { instance } = useMsal();
  const { user, isAuthenticated, authProvider, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Handle logout
  const handleSignOut = () => {
    if (authProvider === 'microsoft') {
      instance.logoutPopup().then(() => {
        logout();
        navigate('/');
      }).catch(error => {
        console.error('Microsoft logout failed:', error);
        logout();
        navigate('/');
      });
    } else {
      logout();
      navigate('/');
    }
  };

  // Replace static navigation names with translations
  const translatedNavigation = navigation.map((item) => ({
    ...item,
    name: t(`nav.${item.name.replace(/\s/g, '').toLowerCase()}`),
  }));

  return (
    <Disclosure as="nav" className="bg-white shadow-sm border-b border-gray-100">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <Link to="/" className="flex items-center space-x-2">
                  <HiSparkles className="w-8 h-8 text-[#FF5F90] mr-1 animate-pulse" />
                  <span className="text-xl font-bold text-gray-900">
                    {t('header.title')}
                  </span>
                </Link>
              </div>

              {/* Navigation and Auth Section */}
              <div className="hidden md:flex items-center space-x-8">
                {/* Navigation Links */}
                <div className="flex items-center space-x-8">
                  {translatedNavigation.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="text-gray-700 hover:text-[#FF5F90] px-3 py-2 text-sm font-medium transition-colors duration-200"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>

                {/* Language Dropdown */}
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#FF5F90] transition-colors duration-200">
                    <GlobeAltIcon className="w-4 h-4" />
                    <span>{LANGUAGES.find(lang => lang.code === i18n.language)?.nativeLabel || 'English'}</span>
                    <ChevronDownIcon className="w-3 h-3" />
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      {LANGUAGES.map((language) => (
                        <Menu.Item key={language.code}>
                          {({ active }) => (
                            <button
                              onClick={() => i18n.changeLanguage(language.code)}
                              className={clsx(
                                active ? 'bg-gray-100' : '',
                                i18n.language === language.code ? 'text-[#FF5F90] font-medium' : 'text-gray-700',
                                'block px-4 py-2 text-sm w-full text-left'
                              )}
                            >
                              {language.nativeLabel}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </div>
                  </Menu.Items>
                </Menu>

                {/* Auth Section */}
                {isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    {/* Dashboard Link */}
                    <Link
                      to="/dashboard"
                      className="flex items-center space-x-2 px-4 py-2 bg-[#FF5F90] text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                    >
                      <HiUserCircle className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>

                    {/* User Menu */}
                    <Menu as="div" className="relative">
                      <Menu.Button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#FF5F90] to-red-500 rounded-full flex items-center justify-center">
                          {user?.picture ? (
                            <img 
                              src={user.picture} 
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-sm font-medium">
                              {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </span>
                          )}
                        </div>
                        <span className="hidden lg:block">{user?.name || 'User'}</span>
                        <ChevronDownIcon className="w-3 h-3" />
                      </Menu.Button>
                      
                      <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                        <div className="py-1">
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                            {user?.role?.includes('mentor') && (
                              <span className="inline-flex items-center px-2 py-1 mt-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                Mentor
                              </span>
                            )}
                          </div>
                          
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/dashboard"
                                className={clsx(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                <HiUserCircle className="w-4 h-4 inline mr-2" />
                                Dashboard
                              </Link>
                            )}
                          </Menu.Item>
                          
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={handleSignOut}
                                className={clsx(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700 w-full text-left'
                                )}
                              >
                                <HiArrowRightOnRectangle className="w-4 h-4 inline mr-2" />
                                Sign Out
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Menu>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link
                      to="/login"
                      className="text-gray-700 hover:text-[#FF5F90] px-3 py-2 text-sm font-medium transition-colors duration-200"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="px-4 py-2 bg-[#FF5F90] text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#FF5F90]">
                  <span className="sr-only">Open main menu</span>
                  {/* Add mobile menu icon here if needed */}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <Disclosure.Panel className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {translatedNavigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-gray-700 hover:text-[#FF5F90] block px-3 py-2 text-base font-medium"
                >
                  {item.name}
                </Link>
              ))}
              
              {isAuthenticated ? (
                <div className="border-t border-gray-200 pt-4 pb-3">
                  <div className="flex items-center px-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#FF5F90] to-red-500 rounded-full flex items-center justify-center">
                        {user?.picture ? (
                          <img 
                            src={user.picture} 
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-medium">
                            {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">{user?.name}</div>
                      <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                    </div>
                  </div>
                  <div className="mt-3 px-2 space-y-1">
                    <Link
                      to="/dashboard"
                      className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-[#FF5F90]"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-[#FF5F90] w-full text-left"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4 pb-3">
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-[#FF5F90]"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-[#FF5F90]"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Header;
