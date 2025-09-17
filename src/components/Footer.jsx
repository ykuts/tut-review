import React from "react";
import { FaGithub, FaTwitter, FaLinkedin, FaDiscord } from "react-icons/fa";
import { HiSparkles, HiHeart } from "react-icons/hi2";
import { MdEmail } from "react-icons/md";
import clsx from "clsx";
import { useTranslation } from 'react-i18next'; 
import TranslatedText from './TranslatedText'; // ⬅️ NEW: imported RTL-safe component

const Footer = () => {
  const { t, i18n } = useTranslation(); 

  const footerLinks = {
    quickLinks: [
      { name: "home", href: "/" },
      { name: "ai_courses", href: "/courses" },
      { name: "ai_tutor", href: "/tutor" },
      { name: "progress_tracking", href: "/progress" },
      { name: "about_us", href: "/about" },
    ],
    learning: [
      { name: "beginner_courses", href: "/courses/beginner" },
      { name: "advanced_topics", href: "/courses/advanced" },
      { name: "practice_problems", href: "/practice" },
      { name: "community", href: "/community" },
      { name: "learning_blog", href: "/blog" },
    ],
    support: [
      { name: "help_center", href: "/help" },
      { name: "contact_us", href: "/contact" },
      { name: "faq", href: "/faq" },
      { name: "privacy_policy", href: "/privacy" },
      { name: "terms_of_service", href: "/terms" },
    ],
  };

  const socialLinks = [
    { name: "GitHub", icon: FaGithub, href: "#", color: "hover:text-gray-900" },
    { name: "Twitter", icon: FaTwitter, href: "#", color: "hover:text-blue-400" },
    { name: "LinkedIn", icon: FaLinkedin, href: "#", color: "hover:text-blue-600" },
    { name: "Discord", icon: FaDiscord, href: "#", color: "hover:text-indigo-500" },
  ];

  const badges = [
    t("footer.ai_powered"),
    t("footer.open_source"),
    t("footer.community_supported"),
    t("footer.not_for_profit")
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="flex items-center mb-4">
                <HiSparkles className="h-8 w-8 text-[#FF5F90] animate-pulse mx-2" />
                <span className="font-bold text-4xl text-gray-400">AI-</span>
                <span className="font-bold text-4xl text-[#FF5F90]">Tutor</span>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed text-left">
                <TranslatedText keyName="footer.company_description" /> {/* ⬅️ RTL FIX */}
              </p>
              <div className="flex space-x-4">
                {socialLinks.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      "flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 text-gray-400 transition-all duration-200 transform hover:scale-110",
                      item.color
                    )}
                    aria-label={item.name}
                  >
                    <item.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Sections remain unchanged, we only adjust RTL for Arabic descriptions */}

            <div>
              <h3 className="text-[#FF5F90] font-semibold text-lg mb-4">
                <TranslatedText keyName="footer.quick_links_title" /> {/* ⬅️ */}
              </h3>
              <ul className="space-y-3">
                {footerLinks.quickLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-[#FF5F90] transition-colors duration-200"
                    >
                      <TranslatedText keyName={`footer.${link.name}`} /> {/* ⬅️ */}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[#FF5F90] font-semibold text-lg mb-4">
                <TranslatedText keyName="footer.learning_title" /> {/* ⬅️ */}
              </h3>
              <ul className="space-y-3">
                {footerLinks.learning.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-[#FF5F90] transition-colors duration-200"
                    >
                      <TranslatedText keyName={`footer.${link.name}`} /> {/* ⬅️ */}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[#FF5F90] font-semibold text-lg mb-4">
                <TranslatedText keyName="footer.support_title" /> {/* ⬅️ */}
              </h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-[#FF5F90] transition-colors duration-200"
                    >
                      <TranslatedText keyName={`footer.${link.name}`} /> {/* ⬅️ */}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="py-8 border-t border-gray-700">
          <div className="bg-gradient-to-r from-[#FF5F90]/10 to-red-500/10 rounded-2xl p-8 border border-[#FF5F90]/20">
            <div className="text-center">
              <h3 className="text-[#FF5F90] font-semibold text-xl mb-2">
                <TranslatedText keyName="footer.stay_updated" /> {/* ⬅️ */}
              </h3>
              <p className="text-gray-400 mb-6">
                <TranslatedText keyName="footer.newsletter_description" /> {/* ⬅️ */}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <div className="flex-1 relative">
                  <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder={t("footer.email_placeholder")}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-full text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF5F90] focus:border-transparent transition-all duration-200"
                  />
                </div>
                <button className="px-6 py-3 bg-[#FF5F90] text-white font-medium rounded-full hover:bg-[#FF5F90]/20 transition-all duration-200 transform hover:scale-105 whitespace-nowrap">
                  <TranslatedText keyName="footer.subscribe" /> {/* ⬅️ */}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="py-6 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-gray-400">
              <span>
                © 2025 AI-Tutor. <TranslatedText keyName="footer.all_rights_reserved" /> {/* ⬅️ */}
              </span>
              <HiHeart className="w-4 h-4 text-red-500 animate-pulse" />
              <span><TranslatedText keyName="footer.for_learners_worldwide" /></span> {/* ⬅️ */}
            </div>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-[#FF5F90]/20 text-[#FF5F90] rounded-full text-sm font-medium border border-[#FF5F90]/30"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;