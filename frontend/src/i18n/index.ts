
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 1. Importing Day.js and language packs
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/uk';
import 'dayjs/locale/de';
import 'dayjs/locale/en';

import ukTranslation from './locales/uk.json';
import deTranslation from './locales/de.json';
import enTranslation from './locales/en.json';

// 2. Enable the plugin for phrases like "vor 2 Jahren" / "2 years ago"
dayjs.extend(relativeTime);

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

// 3. Set the date language at the first start
dayjs.locale(savedLanguage);

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

// 4. Listen to the language change in the application and immediately switch Day.js
i18n.on('languageChanged', (lng) => {
  const currentLang = lng ? lng.split('-')[0] : 'uk';
  dayjs.locale(currentLang);
});

export default i18n;