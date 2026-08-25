import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import en from './locales/en.json';
import ar from './locales/ar.json';
import ur from './locales/ur.json';

export const SUPPORTED_LANGUAGES = ['en', 'ar', 'ur'];

export const getDeviceLanguage = () => {
  const best = RNLocalize.findBestLanguageTag(SUPPORTED_LANGUAGES);
  return best?.languageTag?.split('-')[0] || 'en';
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    ur: { translation: ur },
  },
  lng: 'en',
  fallbackLng: 'en',
  compatibilityJSON: 'v4',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
