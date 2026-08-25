import AsyncStorage from '@react-native-async-storage/async-storage';

export const COUNTERS_STORAGE_KEY = 'tasbihpro/counters_v1';
export const STATS_DAILY_TOTALS_KEY = 'tasbihpro/stats_daily_totals_v1';
export const STATS_COUNTER_DAILY_KEY = 'tasbihpro/stats_counter_daily_v1';

const pad2 = (n) => String(n).padStart(2, '0');

export const getLocalDateKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
};

export async function loadCountersState() {
  try {
    const raw = await AsyncStorage.getItem(COUNTERS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveCountersState(state) {
  try {
    await AsyncStorage.setItem(COUNTERS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore persistence errors (e.g., storage not available)
  }
}

let dailyTotalsCache = null;
let dailyTotalsWriteTimer = null;
let dailyTotalsPendingWrite = false;

async function loadDailyTotalsIntoCache() {
  if (dailyTotalsCache) return dailyTotalsCache;
  try {
    const raw = await AsyncStorage.getItem(STATS_DAILY_TOTALS_KEY);
    dailyTotalsCache = raw ? JSON.parse(raw) : {};
  } catch {
    dailyTotalsCache = {};
  }
  return dailyTotalsCache;
}

function scheduleDailyTotalsWrite() {
  if (dailyTotalsWriteTimer) {
    clearTimeout(dailyTotalsWriteTimer);
  }

  dailyTotalsPendingWrite = true;

  dailyTotalsWriteTimer = setTimeout(async () => {
    if (!dailyTotalsPendingWrite) return;
    dailyTotalsPendingWrite = false;
    try {
      await AsyncStorage.setItem(
        STATS_DAILY_TOTALS_KEY,
        JSON.stringify(dailyTotalsCache || {}),
      );
    } catch {
      // ignore write errors
    }
  }, 700);
}

let counterDailyCache = null;
let counterDailyWriteTimer = null;
let counterDailyPendingWrite = false;

async function loadCounterDailyIntoCache() {
  if (counterDailyCache) return counterDailyCache;
  try {
    const raw = await AsyncStorage.getItem(STATS_COUNTER_DAILY_KEY);
    counterDailyCache = raw ? JSON.parse(raw) : {};
  } catch {
    counterDailyCache = {};
  }
  return counterDailyCache;
}

function scheduleCounterDailyWrite() {
  if (counterDailyWriteTimer) {
    clearTimeout(counterDailyWriteTimer);
  }

  counterDailyPendingWrite = true;

  counterDailyWriteTimer = setTimeout(async () => {
    if (!counterDailyPendingWrite) return;
    counterDailyPendingWrite = false;
    try {
      await AsyncStorage.setItem(
        STATS_COUNTER_DAILY_KEY,
        JSON.stringify(counterDailyCache || {}),
      );
    } catch {
      // ignore write errors
    }
  }, 700);
}

export async function addDailyTap(dateKey, delta = 1, counterId = null) {
  if (!dateKey) return;
  const safeDelta = typeof delta === 'number' ? delta : Number(delta);
  if (!Number.isFinite(safeDelta) || safeDelta === 0) return;

  const cache = await loadDailyTotalsIntoCache();
  cache[dateKey] = (cache[dateKey] || 0) + safeDelta;
  if (cache[dateKey] < 0) cache[dateKey] = 0;
  scheduleDailyTotalsWrite();

  if (counterId) {
    const counterCache = await loadCounterDailyIntoCache();
    if (!counterCache[dateKey]) {
      counterCache[dateKey] = {};
    }
    counterCache[dateKey][counterId] =
      (counterCache[dateKey][counterId] || 0) + safeDelta;
    if (counterCache[dateKey][counterId] < 0) {
      counterCache[dateKey][counterId] = 0;
    }
    scheduleCounterDailyWrite();
  }
}

export async function getDailyTotals() {
  const cache = await loadDailyTotalsIntoCache();
  // Return a shallow copy so callers don't mutate the cache.
  return { ...(cache || {}) };
}

export async function getCounterDailyTotals() {
  const cache = await loadCounterDailyIntoCache();
  return JSON.parse(JSON.stringify(cache || {}));
}

