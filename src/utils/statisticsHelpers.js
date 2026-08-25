import { getLocalDateKey } from '../storage/tasbihProStorage';
import i18n from '../i18n';

const getDayLabels = () => [
  i18n.t('days.mon'),
  i18n.t('days.tue'),
  i18n.t('days.wed'),
  i18n.t('days.thu'),
  i18n.t('days.fri'),
  i18n.t('days.sat'),
  i18n.t('days.sun'),
];

const getMonthLabels = () => [
  i18n.t('months.jan'),
  i18n.t('months.feb'),
  i18n.t('months.mar'),
  i18n.t('months.apr'),
  i18n.t('months.may'),
  i18n.t('months.jun'),
  i18n.t('months.jul'),
  i18n.t('months.aug'),
  i18n.t('months.sep'),
  i18n.t('months.oct'),
  i18n.t('months.nov'),
  i18n.t('months.dec'),
];

const ACTIVE_BAR = '#477F4E';

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const parseDateKey = (key) => {
  const [y, m, d] = String(key).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const isDateInPeriod = (date, period, now = new Date()) => {
  if (period === 'week') {
    const dayOfWeek = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - dayOfWeek);
    const sunday = addDays(monday, 6);
    sunday.setHours(23, 59, 59, 999);
    return date >= monday && date <= sunday;
  }

  if (period === 'month') {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }

  return date.getFullYear() === now.getFullYear();
};

const keysInPeriod = (dailyTotals, period, now = new Date()) =>
  Object.keys(dailyTotals).filter((key) => {
    const date = parseDateKey(key);
    if (!date) return false;
    return isDateInPeriod(date, period, now);
  });

export const buildBarChartData = (dailyTotals, period) => {
  const now = new Date();

  // Labels always show; bars render only when value > 0.
  const toBarItem = (value, label) => ({
    value: value > 0 ? value : 0,
    label,
    frontColor: value > 0 ? ACTIVE_BAR : 'transparent',
    rawValue: value,
  });

  if (period === 'week') {
    const dayOfWeek = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - dayOfWeek);

    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(monday, i);
      const key = getLocalDateKey(d);
      const value = Number(dailyTotals[key] || 0);
      return toBarItem(value, getDayLabels()[i]);
    });
  }

  if (period === 'month') {
    const currentYear = now.getFullYear();
    const monthLabels = getMonthLabels();
    const monthValues = monthLabels.map((_, monthIndex) => {
      const monthNumber = monthIndex + 1;
      let sum = 0;
      for (const [key, rawValue] of Object.entries(dailyTotals)) {
        const [y, m] = key.split('-');
        if (Number(y) === currentYear && Number(m) === monthNumber) {
          sum += Number(rawValue || 0);
        }
      }
      return sum;
    });

    return monthValues.map((value, idx) => toBarItem(value, monthLabels[idx]));
  }

  if (period === 'year') {
    const yearsFromData = Object.keys(dailyTotals)
      .map((k) => Number(String(k).slice(0, 4)))
      .filter((y) => Number.isFinite(y));
    const currentYear = now.getFullYear();
    const earliestYear =
      yearsFromData.length > 0 ? Math.min(...yearsFromData) : currentYear;
    const startYear = Math.min(earliestYear, currentYear - 4);

    const allYears = [];
    for (let year = startYear; year <= currentYear; year += 1) {
      allYears.push(year);
    }

    return allYears.map((year) => {
      let sum = 0;
      for (const [key, rawValue] of Object.entries(dailyTotals)) {
        const y = Number(String(key).slice(0, 4));
        if (y === year) sum += Number(rawValue || 0);
      }
      return toBarItem(sum, String(year));
    });
  }

  return [];
};

export const computeOverview = (dailyTotals) => {
  const todayKey = getLocalDateKey();
  const entries = Object.entries(dailyTotals);
  const totalCount = entries.reduce(
    (sum, [, value]) => sum + Number(value || 0),
    0,
  );
  const today = Number(dailyTotals[todayKey] || 0);

  const activeDays = entries.filter(([, value]) => Number(value || 0) > 0);
  const dailyAvg =
    activeDays.length > 0
      ? Math.round(totalCount / activeDays.length)
      : 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (true) {
    const key = getLocalDateKey(cursor);
    if (Number(dailyTotals[key] || 0) > 0) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return { totalCount, today, dailyAvg, streak };
};

export const extractCounterDailyTotals = (counterDailyTotals, counterId) => {
  if (!counterId) return {};

  const result = {};
  for (const [dateKey, counters] of Object.entries(counterDailyTotals)) {
    result[dateKey] = Number(counters?.[counterId] || 0);
  }
  return result;
};

export const computeCounterTotalsForPeriod = (
  counterDailyTotals,
  period,
  allCounters,
  { includeZero = false } = {},
) => {
  const now = new Date();
  const totalsById = {};

  for (const counter of allCounters) {
    totalsById[counter.id] = 0;
  }

  for (const [dateKey, counters] of Object.entries(counterDailyTotals)) {
    const date = parseDateKey(dateKey);
    if (!date || !isDateInPeriod(date, period, now)) continue;

    for (const [counterId, rawValue] of Object.entries(counters || {})) {
      totalsById[counterId] =
        (totalsById[counterId] || 0) + Number(rawValue || 0);
    }
  }

  const items = allCounters.map((counter) => ({
    id: counter.id,
    label: counter.label,
    arabic: counter.arabic || counter.label,
    value: totalsById[counter.id] || 0,
  }));

  const filtered = includeZero
    ? items
    : items.filter((item) => item.value > 0);

  return filtered.sort((a, b) => b.value - a.value);
};

export const computePeriodChartMaxValue = (
  counterDailyTotals,
  period,
  allCounters,
) => {
  let max = 0;

  for (const counter of allCounters) {
    const dailyTotals = extractCounterDailyTotals(
      counterDailyTotals,
      counter.id,
    );
    const chartData = buildBarChartData(dailyTotals, period);
    const counterMax = Math.max(
      0,
      ...chartData.map((item) => Number(item.rawValue || 0)),
    );
    max = Math.max(max, counterMax);
  }

  return max > 0 ? max : 10;
};

export const hasBarData = (dailyTotals, period) => {
  const now = new Date();

  if (period === 'week') {
    const keys = keysInPeriod(dailyTotals, period, now);
    return keys.some((key) => Number(dailyTotals[key] || 0) > 0);
  }

  if (period === 'month') {
    const currentYear = now.getFullYear();
    return Object.entries(dailyTotals).some(([key, value]) => {
      const [y] = key.split('-');
      return Number(y) === currentYear && Number(value || 0) > 0;
    });
  }

  return Object.entries(dailyTotals).some(([, value]) => Number(value || 0) > 0);
};
