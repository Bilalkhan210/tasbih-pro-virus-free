import { I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { isRtlLanguage } from '../utils/language';

export const useAppDirection = () => {
  const { i18n } = useTranslation();
  const isRTL = isRtlLanguage(i18n.language) || I18nManager.isRTL;
  const writingDirection = isRTL ? 'rtl' : 'ltr';

  return {
    isRTL,
    language: i18n.language,
    direction: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left',
    rowDirection: isRTL ? 'row-reverse' : 'row',
    backIcon: isRTL ? 'chevron-forward' : 'chevron-back',
    writingDirection,
    textStyle: {
      writingDirection,
      textAlign: isRTL ? 'right' : 'left',
    },
    centerTextStyle: {
      writingDirection,
      textAlign: 'center',
    },
    inputTextStyle: {
      writingDirection,
      textAlign: isRTL ? 'right' : 'left',
    },
  };
};
