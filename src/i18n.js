import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en/translation.json';
import arTranslation from './locales/ar/translation.json';
import frTranslation from './locales/fr/translation.json';
import hiTranslation from './locales/hi/translation.json';
import tlTranslation from './locales/tl/translation.json';
import ukTranslation from './locales/uk/translation.json';
import saTranslation from './locales/sa/translation.json';
import nyTranslation from './locales/ny/translation.json'; 

i18n
.use(LanguageDetector) // Automatically detects user's language
.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslation },
    ar: { translation: arTranslation },
    fr: { translation: frTranslation },
    hi: { translation: hiTranslation },
    tl: { translation: tlTranslation },
    uk: { translation: ukTranslation },
    sa: { translation: saTranslation },
    ny: { translation: nyTranslation },
  },

  fallbackLng: 'en', // Fallback language if missing translation
  interpolation: { escapeValue: false },

  detection: {
      order: ['localStorage', 'navigator'], // ⬅️ PRIORITY: saved first, browser fallback second
      caches: ['localStorage'] // ⬅️ STORE in localStorage
    }
});

export default i18n;