import { PermissionsAndroid, Platform } from 'react-native';
import notifee, {
  AlarmType,
  AndroidImportance,
  AuthorizationStatus,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';
import Geolocation from 'react-native-geolocation-service';
import {
  CalculationMethod,
  Coordinates,
  PrayerTimes,
} from 'adhan';
import i18n from '../i18n';

const CHANNEL_ID = 'prayer-dhikr-reminders';
const NOTIFICATION_PREFIX = 'tasbihpro-prayer-';
const SCHEDULE_DAYS = 7;
const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

let syncPromise = null;

const requestLocationPermission = async () => {
  if (Platform.OS === 'ios') {
    return (await Geolocation.requestAuthorization('whenInUse')) === 'granted';
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: i18n.t('notifications.locationPermissionTitle'),
      message: i18n.t('notifications.locationPermissionMessage'),
      buttonPositive: i18n.t('common.continue'),
      buttonNegative: i18n.t('common.cancel'),
    },
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
};

const getCurrentCoordinates = () =>
  new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      ({ coords }) => resolve(new Coordinates(coords.latitude, coords.longitude)),
      reject,
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60 * 60 * 1000,
        showLocationDialog: true,
      },
    );
  });

const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const cancelPrayerTriggers = async () => {
  const ids = await notifee.getTriggerNotificationIds();
  const prayerIds = ids.filter((id) => id.startsWith(NOTIFICATION_PREFIX));
  if (prayerIds.length > 0) {
    await notifee.cancelTriggerNotifications(prayerIds);
  }
};

const scheduleForCoordinates = async (coordinates, language) => {
  const channelId = await notifee.createChannel({
    id: CHANNEL_ID,
    name: i18n.t('notifications.channelName', { lng: language }),
    importance: AndroidImportance.DEFAULT,
  });

  await cancelPrayerTriggers();

  const now = Date.now();
  const parameters = CalculationMethod.MuslimWorldLeague();
  const startDate = new Date();

  const createPrayerTrigger = async ({
    id,
    prayer,
    prayerTime,
    repeatFrequency,
  }) => {
    const prayerName = i18n.t(`notifications.prayers.${prayer}`, {
      lng: language,
    });

    await notifee.createTriggerNotification(
      {
        id,
        title: i18n.t('notifications.prayerTitle', {
          lng: language,
          prayer: prayerName,
        }),
        body: i18n.t('notifications.prayerBody', {
          lng: language,
          prayer: prayerName,
        }),
        data: { prayer },
        android: {
          channelId,
          pressAction: { id: 'default' },
        },
        ios: {
          sound: 'default',
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: prayerTime.getTime(),
        repeatFrequency,
        alarmManager:
          Platform.OS === 'android'
            ? { type: AlarmType.SET_AND_ALLOW_WHILE_IDLE }
            : undefined,
      },
    );
  };

  for (let dayOffset = 0; dayOffset < SCHEDULE_DAYS; dayOffset += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + dayOffset);
    const times = new PrayerTimes(coordinates, date, parameters);

    for (const prayer of PRAYERS) {
      const prayerTime = times[prayer];
      if (!(prayerTime instanceof Date) || prayerTime.getTime() <= now) {
        continue;
      }

      const id = `${NOTIFICATION_PREFIX}${dateKey(date)}-${prayer}`;

      await createPrayerTrigger({ id, prayer, prayerTime });
    }
  }

  // Keep reminders active if the app is not opened for over a week. The app
  // replaces these fallbacks with fresh, location-accurate times when reopened.
  const fallbackDate = new Date(startDate);
  fallbackDate.setDate(startDate.getDate() + SCHEDULE_DAYS);
  const fallbackTimes = new PrayerTimes(
    coordinates,
    fallbackDate,
    parameters,
  );

  for (const prayer of PRAYERS) {
    await createPrayerTrigger({
      id: `${NOTIFICATION_PREFIX}daily-${prayer}`,
      prayer,
      prayerTime: fallbackTimes[prayer],
      repeatFrequency: RepeatFrequency.DAILY,
    });
  }
};

export const schedulePrayerNotifications = async (language = 'en') => {
  if (syncPromise) {
    return syncPromise;
  }

  syncPromise = (async () => {
    const notificationSettings = await notifee.requestPermission();
    if (
      notificationSettings.authorizationStatus === AuthorizationStatus.DENIED
    ) {
      return { ok: false, reason: 'notification-permission' };
    }

    if (!(await requestLocationPermission())) {
      return { ok: false, reason: 'location-permission' };
    }

    try {
      const coordinates = await getCurrentCoordinates();
      await scheduleForCoordinates(coordinates, language);
      return { ok: true };
    } catch {
      return { ok: false, reason: 'location-unavailable' };
    }
  })();

  try {
    return await syncPromise;
  } finally {
    syncPromise = null;
  }
};

export const cancelPrayerNotifications = cancelPrayerTriggers;
