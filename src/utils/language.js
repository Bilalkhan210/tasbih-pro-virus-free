import { Alert, I18nManager, Platform } from 'react-native';
import i18n from '../i18n';

export const RTL_LANGUAGES = ['ar', 'ur'];

export const LANGUAGE_OPTIONS = [
  {
    code: 'en',
    labelKey: 'languages.english',
    nativeName: 'English',
    isRTL: false,
  },
  {
    code: 'ar',
    labelKey: 'languages.arabic',
    nativeName: 'العربية',
    isRTL: true,
  },
  {
    code: 'ur',
    labelKey: 'languages.urdu',
    nativeName: 'اردو',
    isRTL: true,
  },
];

export const normalizeLanguageCode = (code) => {
  if (!code || code === 'Default') {
    return 'en';
  }
  const short = String(code).split('-')[0];
  return LANGUAGE_OPTIONS.some((item) => item.code === short) ? short : 'en';
};

export const isRtlLanguage = (code) =>
  RTL_LANGUAGES.includes(normalizeLanguageCode(code));

export const getLanguageNativeName = (code) => {
  const option = LANGUAGE_OPTIONS.find(
    (item) => item.code === normalizeLanguageCode(code),
  );
  return option?.nativeName || 'English';
};

export const applyAppLanguage = async (code, options = {}) => {
  const normalized = normalizeLanguageCode(code);
  const shouldBeRTL = isRtlLanguage(normalized);
  const rtlChanged = I18nManager.isRTL !== shouldBeRTL;

  await i18n.changeLanguage(normalized);

  if (rtlChanged) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(shouldBeRTL);

    if (!options.skipReload && Platform.OS === 'android') {
      try {
        const { DevSettings } = require('react-native');
        Alert.alert(
          i18n.t('languages.restartTitle'),
          i18n.t('languages.restartHint'),
          [
            { text: i18n.t('common.cancel'), style: 'cancel' },
            {
              text: 'OK',
              onPress: () => DevSettings.reload(),
            },
          ],
        );
      } catch {
        Alert.alert(
          i18n.t('languages.restartTitle'),
          i18n.t('languages.restartHint'),
        );
      }
    } else if (!options.skipReload && Platform.OS === 'ios') {
      Alert.alert(
        i18n.t('languages.restartTitle'),
        i18n.t('languages.restartHint'),
      );
    }
  }

  return normalized;
};
