import React, { useEffect, useRef } from 'react';
import { AppState, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AdEventType, AppOpenAd } from 'react-native-google-mobile-ads';
import RootStack from './src/navigation/rootStack';
import { CounterProvider } from './src/context/CounterContext';
import {
  SettingsProvider,
  useSettings,
} from './src/context/SettingsContext';
import { useAppDirection } from './src/hooks/useAppDirection';
import { useTranslation } from 'react-i18next';
import {
  cancelPrayerNotifications,
  schedulePrayerNotifications,
} from './src/services/prayerNotifications';
import { AD_UNIT_IDS, initializeMobileAds } from './src/services/admob';

// Avoid back-to-back app-open ads (AdActivity pause was re-triggering shows).
const APP_OPEN_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

const AppShell = () => {
  const { direction, isRTL } = useAppDirection();
  const { i18n } = useTranslation();
  const { settings } = useSettings();
  const appOpenAdRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const appOpenLoadedRef = useRef(false);
  const isShowingAppOpenAdRef = useRef(false);
  const lastAppOpenShownAtRef = useRef(0);
  const pendingColdStartShowRef = useRef(true);

  const showAppOpenAd = () => {
    const ad = appOpenAdRef.current;
    if (
      !ad ||
      !appOpenLoadedRef.current ||
      isShowingAppOpenAdRef.current
    ) {
      return;
    }

    const elapsed = Date.now() - lastAppOpenShownAtRef.current;
    if (
      lastAppOpenShownAtRef.current > 0 &&
      elapsed < APP_OPEN_COOLDOWN_MS
    ) {
      return;
    }

    isShowingAppOpenAdRef.current = true;
    pendingColdStartShowRef.current = false;
    lastAppOpenShownAtRef.current = Date.now();
    ad.show().catch(() => {
      isShowingAppOpenAdRef.current = false;
    });
  };

  useEffect(() => {
    initializeMobileAds().catch(() => {});

    const appOpenAd = AppOpenAd.createForAdRequest(AD_UNIT_IDS.appOpen);
    appOpenAdRef.current = appOpenAd;

    const unsubscribeLoaded = appOpenAd.addAdEventListener(
      AdEventType.LOADED,
      () => {
        appOpenLoadedRef.current = true;
        // Cold start only — never auto-show just because a preload finished.
        if (pendingColdStartShowRef.current) {
          showAppOpenAd();
        }
      },
    );
    const unsubscribeClosed = appOpenAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        isShowingAppOpenAdRef.current = false;
        appOpenLoadedRef.current = false;
        // Preload for a later real foreground; do not show immediately.
        appOpenAd.load();
      },
    );
    const unsubscribeError = appOpenAd.addAdEventListener(
      AdEventType.ERROR,
      () => {
        appOpenLoadedRef.current = false;
        isShowingAppOpenAdRef.current = false;
      },
    );

    appOpenAd.load();

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      const previousState = appStateRef.current;
      appStateRef.current = state;

      // Ignore inactive/background caused by the AdActivity itself.
      if (isShowingAppOpenAdRef.current) {
        return;
      }

      if (
        previousState.match(/inactive|background/) &&
        state === 'active'
      ) {
        showAppOpenAd();
      }
    });

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
      appStateSubscription.remove();
      appOpenAd.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    const syncNotifications = () => {
      if (settings.notificationReminder) {
        schedulePrayerNotifications(settings.language).catch(() => {});
      } else {
        cancelPrayerNotifications().catch(() => {});
      }
    };

    syncNotifications();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        syncNotifications();
      }
    });

    return () => subscription.remove();
  }, [settings.language, settings.notificationReminder]);

  return (
    <View style={{ flex: 1, direction }}>
      <NavigationContainer
        key={i18n.language}
        direction={isRTL ? 'rtl' : 'ltr'}
      >
        <RootStack />
      </NavigationContainer>
    </View>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <CounterProvider>
            <AppShell />
          </CounterProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
