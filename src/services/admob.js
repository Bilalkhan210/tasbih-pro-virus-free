import mobileAds, {
  AppOpenAd,
  TestIds,
} from 'react-native-google-mobile-ads';

export const AD_UNIT_IDS = {
  appOpen: TestIds.APP_OPEN,
  banner: TestIds.ADAPTIVE_BANNER,
  /* Real IDs - use when app is live
  appOpen: 'ca-app-pub-9147526779932681/1877277735',
  banner: 'ca-app-pub-9147526779932681/8846397806',
  */
};

export const initializeMobileAds = () => mobileAds().initialize();

export const createAppOpenAd = () =>
  AppOpenAd.createForAdRequest(AD_UNIT_IDS.appOpen);
