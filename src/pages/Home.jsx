import { useState } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from "@azure/msal-react";
import { useAuth } from '../contexts/AuthContext';
import {
  HiSparkles,
  HiRocketLaunch,
  HiPlayCircle,
  HiCpuChip,
  HiLightBulb,
  HiUserGroup,
  HiTrophy,
  HiChartBarSquare,
  HiClock
} from 'react-icons/hi2';
import {
  FaReact,
  FaPython,
  FaJsSquare,
  FaGitAlt
} from 'react-icons/fa';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next'; 
import TranslatedText from '../components/TranslatedText'; // ⬅️ Reusable RTL-safe wrapper

const Home = () => {
  const navigate = useNavigate();
  const { accounts } = useMsal();
  const { isAuthenticated, user } = useAuth();
  const { t, i18n } = useTranslation();

  const userIsAuthenticated = isAuthenticated || accounts.length > 0;

  const handleGetStarted = () => {
    if (userIsAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleWatchDemo = () => {
    console.log('Watch demo clicked');
  };

  const features = [
    {
      icon: HiCpuChip,
      title: <TranslatedText keyName="features.0.title" />,
      description: <TranslatedText keyName="features.0.description" />,
      color: 'text-blue-500'
    },
    {
      icon: HiLightBulb,
      title: <TranslatedText keyName="features.1.title" />,
      description: <TranslatedText keyName="features.1.description" />,
      color: 'text-yellow-500'
    },
    {
      icon: HiUserGroup,
      title: <TranslatedText keyName="features.2.title" />,
      description: <TranslatedText keyName="features.2.description" />,
      color: 'text-green-500'
    },
    {
      icon: HiTrophy,
      title: <TranslatedText keyName="features.3.title" />,
      description: <TranslatedText keyName="features.3.description" />,
      color: 'text-purple-500'
    },
    {
      icon: HiChartBarSquare,
      title: <TranslatedText keyName="features.4.title" />,
      description: <TranslatedText keyName="features.4.description" />,
      color: 'text-indigo-500'
    },
    {
      icon: HiClock,
      title: <TranslatedText keyName="features.5.title" />,
      description: <TranslatedText keyName="features.5.description" />,
      color: 'text-red-500'
    }
  ];

  const technologies = [
    { icon: FaReact, name: 'React', color: 'text-cyan-500' },
    { icon: FaPython, name: 'Python', color: 'text-yellow-500' },
    { icon: FaJsSquare, name: 'JavaScript', color: 'text-yellow-400' },
    { icon: FaGitAlt, name: 'Git', color: 'text-orange-500' }
  ];

  const pillars = [
    {
      icon: HiCpuChip,
      title: t('pillars.ai_title'),
      description: t('pillars.ai_desc'),
      color: 'text-blue-500'
    },
    {
      icon: HiUserGroup,
      title: t('pillars.mentor_title'),
      description: t('pillars.mentor_desc'),
      color: 'text-green-500'
    },
    {
      icon: FaGitAlt,
      title: t('pillars.opensource_title'),
      description: t('pillars.opensource_desc'),
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white py-20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FF5F90]/10 text-[#FF5F90] text-sm font-medium mb-6">
                <HiSparkles className="w-4 h-4 mr-2" />
                <TranslatedText keyName='hero.badge' />
              </div>

              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                {t('hero.heading.pre')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5F90] to-red-500">
                  {t('hero.heading.ai')}
                </span>{' '}
                {t('hero.heading.tutoring')}
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl">
                <TranslatedText keyName='hero.subheading' />
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={handleGetStarted}
                  className="group flex items-center justify-center px-8 py-4 bg-[#FF5F90] text-white font-semibold rounded-full hover:bg-[#FF5F90]/90 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <HiRocketLaunch className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                  {isAuthenticated ? t('buttons.dashboard') : t('buttons.startLearning')}
                </button>
                <button
                  onClick={handleWatchDemo}
                  className="group flex items-center justify-center px-8 py-4 bg-transparent text-gray-700 font-semibold rounded-full border-2 border-gray-200 hover:border-[#FF5F90] hover:text-[#FF5F90] transition-all duration-200"
                >
                  <HiPlayCircle className="w-5 h-5 mr-2" />
                  {t('buttons.demo')}
                </button>
              </div>

              {/* Pillars Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-gray-200">
                {pillars.map((pillar, index) => (
                  <div key={index} className="text-center">
                    <div className="flex justify-center items-center mb-4 w-16 h-16 bg-gray-100 rounded-full mx-auto">
                      <pillar.icon className={clsx("w-8 h-8", pillar.color)} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {pillar.title}
                    </h3>
                    <p className="text-gray-600">
                      {pillar.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-400 text-sm font-mono">
                    <TranslatedText keyName='hero.visualTitle' />
                  </span>
                </div>
                <div className="p-6 font-mono text-sm space-y-2">
                  <div className="text-gray-500">
                    <span className="text-green-400">{'// '}</span>
                    <TranslatedText keyName='hero.code.line1' />
                  </div>
                  <div>
                    <span className="text-purple-400">import</span>{' '}
                    <span className="text-white">React, {'{ useState }'}</span>{' '}
                    <span className="text-purple-400">from</span>{' '}
                    <span className="text-green-400">'react'</span>
                  </div>
                  <div>
                    <span className="text-purple-400">const</span>{' '}
                    <span className="text-blue-400">MyComponent</span>{' '}
                    <span className="text-white">= () =&gt; {'{'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-2">
                      {'// '} <TranslatedText keyName='hero.code.line2' />
                    </span>
                    <span className="w-2 h-5 bg-[#FF6B6B] animate-pulse"></span>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 space-y-4">
                {technologies.map((tech, index) => (
                  <div
                    key={tech.name}
                    className={clsx(
                      'w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center transform transition-all duration-300 hover:scale-110',
                      'animate-bounce'
                    )}
                  >
                    <tech.icon className={clsx('w-6 h-6', tech.color)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              <TranslatedText keyName='features.heading' />
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              <TranslatedText keyName='features.subheading' />
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br from-gray-50 to-gray-100">
                  <feature.icon className={clsx('w-8 h-8', feature.color)} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-[#FF5F90] to-red-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            <TranslatedText keyName='cta.heading' />
          </h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            <TranslatedText keyName='cta.subheading' />
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-white text-[#FF5F90] font-semibold rounded-full hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {isAuthenticated ? t('buttons.dashboard') : t('buttons.freeTrial')}
            </button>
            <button className="px-8 py-4 bg-transparent text-white font-semibold rounded-full border-2 border-white hover:bg-[#FF5F90]/80 hover:text-white transition-all duration-200 ">
              {t('buttons.pricing')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;