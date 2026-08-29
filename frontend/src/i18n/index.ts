

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ukTranslation from './locales/uk.json';
import deTranslation from './locales/de.json';
import enTranslation from './locales/en.json';

const resources = {
  uk: {
    translation: ukTranslation,
  },
  de: {
    translation: deTranslation,
  },
  en: {
    translation: enTranslation,
  },
};

const savedLanguage = localStorage.getItem('lang') || 'uk';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'uk',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'lang',
    },
  });

export default i18n;