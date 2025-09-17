import React from "react";
import { Disclosure, Menu } from "@headlessui/react";
import { Link, useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { useAuth } from '../contexts/AuthContext';
import { HiSparkles } from "react-icons/hi2";
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
  { name: "Home", href: "/", current: true },
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

              {/* Navigation and Language Dropdown in one flex row */}
              <div className="hidden md:flex items-center">
                <div className="ml-10 flex items-center space-x-8">
                  {translatedNavigation.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={clsx(
                        "relative px-3 py-2 text-sm font-medium transition-colors duration-200 group",
                        item.current
                          ? "text-[#FF5F90]"
                          : "text-gray-700 hover:text-[#FF5F90]"
                      )}
                    >
                      {item.name}
                      <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#FF5F90] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
                    </Link>
                  ))}

                  {/* Language Dropdown  */}
                  <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button className="inline-flex items-center px-3 py-2 rounded-full bg-white border border-gray-300 shadow-sm hover:shadow transition text-sm font-medium text-gray-900 ml-2">
                      <GlobeAltIcon className="w-5 h-5 text-[#FF5F90] mr-2" />
                      <span>
                        {LANGUAGES.find(l => l.code === i18n.language)?.label || 'Language'}
                      </span>
                      <ChevronDownIcon className="w-4 h-4 ml-2 text-gray-500" />
                    </Menu.Button>
                    <Menu.Items className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="py-1">
                        {LANGUAGES.map(lang => (
                          <Menu.Item key={lang.code}>
                            {({ active }) => (
                              <button
                                onClick={() => {
                                  i18n.changeLanguage(lang.code);
                                  localStorage.setItem('siteLanguage', lang.code);
                                }}
                                className={clsx(
                                  'flex items-center w-full px-4 py-2 text-sm text-left rounded-md transition',
                                  active
                                    ? 'bg-[#FF5F90]/10 text-[#FF5F90]'
                                    : 'text-gray-900',
                                  i18n.language === lang.code && 'font-bold'
                                )}
                              >
                                <span>{lang.label}</span>
                                {lang.nativeLabel !== lang.label && (
                                  <span className="ml-2 text-xs text-gray-400">{lang.nativeLabel}</span>
                                )}
                              </button>
                            )}
                          </Menu.Item>
                        ))}
                      </div>
                    </Menu.Items>
                  </Menu>
                </div>
              </div>

              {/* Desktop Action Buttons */}
              <div className="hidden md:flex items-center space-x-4">
                {/* ... any additional action buttons ... */}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-[#FF5F90] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#FF5F90]">
                  <span className="sr-only">Open main menu</span>
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Disclosure.Button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Panel */}
          <Disclosure.Panel className="md:hidden bg-white border-t border-gray-200">
            <div className="space-y-1 px-4 py-3">
              {translatedNavigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#FF5F90] hover:bg-[#FF5F90]/10"
                >
                  {item.name}
                </Link>
              ))}

              {/* Language Dropdown (Mobile) */}
              <div className="mt-4 border-t pt-3">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                      localStorage.setItem('siteLanguage', lang.code);
                    }}
                    className={clsx(
                      'flex items-center w-full px-3 py-2 text-sm rounded-md text-gray-700 hover:text-[#FF5F90]',
                      i18n.language === lang.code && 'font-bold text-[#FF5F90]'
                    )}
                  >
                    {lang.label}
                    {lang.nativeLabel !== lang.label && (
                      <span className="ml-2 text-xs text-gray-400">{lang.nativeLabel}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Header;