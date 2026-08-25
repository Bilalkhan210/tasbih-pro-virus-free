import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyAppLanguage, normalizeLanguageCode } from '../utils/language';

const SETTINGS_STORAGE_KEY = 'tasbihpro/settings_v1';

const DEFAULT_SETTINGS = {
  notificationReminder: true,
  roundCompleteSound: true,
  countSound: true,
  roundCompleteVibration: true,
  countVibration: true,
  volumeButtonControl: true,
  roundCompleteAlert: true,
  showTimer: true,
  showAutoCounter: true,
  autoCounterMode: 'touch',
  autoCounterDelay: 1,
  showCounterName: true,
  showRounds: true,
  showLapLimit: true,
  language: 'en',
};

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_STORAGE_KEY)
      .then(async (raw) => {
        if (!raw) {
          await applyAppLanguage(DEFAULT_SETTINGS.language, { skipReload: true });
          setReady(true);
          return;
        }
        const saved = JSON.parse(raw);
        const language = normalizeLanguageCode(saved.language);
        const next = {
          ...DEFAULT_SETTINGS,
          ...saved,
          showAutoCounter: saved.showAutoCounter ?? true,
          language,
        };
        setSettings(next);
        await applyAppLanguage(language, { skipReload: true });
        setReady(true);
      })
      .catch(async () => {
        await applyAppLanguage(DEFAULT_SETTINGS.language, { skipReload: true });
        setReady(true);
      });
  }, []);

  const updateSetting = useCallback((key, value) => {
    if (key === 'language') {
      applyAppLanguage(value).then((normalized) => {
        setSettings((prev) => {
          const next = { ...prev, language: normalized };
          AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next)).catch(
            () => {},
          );
          return next;
        });
      });
      return;
    }

    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next)).catch(
        () => {},
      );
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      settings,
      updateSetting,
      ready,
    }),
    [settings, updateSetting, ready],
  );

  if (!ready) {
    return null;
  }

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
