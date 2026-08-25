import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ImageBackground,
  Platform,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../assets/color';
import { BG_IMAGE_OPACITY } from '../constants/theme';
import { FONT, FONT_WEIGHT } from '../constants/typography';
import { useCounter } from '../context/CounterContext';
import {
  getCounterDailyTotals,
  getDailyTotals,
} from '../storage/tasbihProStorage';
import {
  buildBarChartData,
  computeCounterTotalsForPeriod,
  computeOverview,
  computePeriodChartMaxValue,
  extractCounterDailyTotals,
  hasBarData,
} from '../utils/statisticsHelpers';
import { useAppDirection } from '../hooks/useAppDirection';
import LocalizedText from '../components/LocalizedText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACTIVE_BAR = '#477F4E';
const PIE_COLORS = ['#477F4E', '#7EB8D4', '#7A9A7D', '#0F4A28', '#C4A35A'];

const formatPercent = (value) => `${(Math.round(value * 10) / 10).toFixed(1)}%`;

const OverviewCard = ({ icon, label, value }) => {
  const { textStyle } = useAppDirection();

  return (
    <View style={styles.overviewCard}>
      <Ionicons name={icon} size={22} color={COLORS.primary} />
      <LocalizedText style={[styles.overviewLabel, textStyle]}>{label}</LocalizedText>
      <Text style={styles.overviewValue}>{value}</Text>
    </View>
  );
};

const PeriodToggle = ({ period, onChange, periods }) => {
  const { centerTextStyle } = useAppDirection();

  return (
    <View style={styles.periodRow}>
      {periods.map((item) => {
        const active = period === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onChange(item.id)}
            style={[styles.periodButton, active && styles.periodButtonActive]}
            activeOpacity={0.85}
          >
            <LocalizedText
              center
              style={[styles.periodText, active && styles.periodTextActive]}
            >
              {item.label}
            </LocalizedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const EmptyChartState = ({ icon, title, subtitle }) => {
  const { centerTextStyle } = useAppDirection();

  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={42} color="#C5C5C5" />
      <LocalizedText center style={styles.emptyTitle}>
        {title}
      </LocalizedText>
      <LocalizedText center style={styles.emptySubtitle}>
        {subtitle}
      </LocalizedText>
    </View>
  );
};

const StatisticsBarChart = ({
  dailyTotals,
  period,
  scrollable = false,
  maxValueOverride,
  chartKey,
}) => {
  const { t, i18n } = useTranslation();
  const { centerTextStyle } = useAppDirection();
  const rawChartData = useMemo(
    () => buildBarChartData(dailyTotals, period),
    [dailyTotals, period, i18n.language],
  );

  const maxValue = useMemo(() => {
    if (maxValueOverride != null) {
      return maxValueOverride;
    }
    const max = Math.max(
      0,
      ...rawChartData.map((item) => Number(item.rawValue || 0)),
    );
    return max > 0 ? max : 10;
  }, [maxValueOverride, rawChartData]);

  const barWidth =
    period === 'month' ? 30 : period === 'year' ? 40 : 22;
  const spacing = 25;
  const sidePadding = 16;

  const chartWidth = useMemo(() => {
    return (
      rawChartData.length * (barWidth + spacing) + sidePadding * 2
    );
  }, [barWidth, rawChartData.length, spacing, sidePadding]);

  const chartData = useMemo(() => {
    const activeMax = Math.max(
      0,
      ...rawChartData.map((item) => Number(item.rawValue || 0)),
    );
    const placeholder = activeMax > 0 ? activeMax * 0.02 : 1;

    return rawChartData.map((item) => {
      const hasValue = item.rawValue > 0;
      return {
        ...item,
        value: hasValue ? item.rawValue : placeholder,
        frontColor: hasValue ? ACTIVE_BAR : 'transparent',
      };
    });
  }, [rawChartData]);

  if (!hasBarData(dailyTotals, period)) {
    return (
      <EmptyChartState
        icon="bar-chart-outline"
        title={t('statistics.noData')}
        subtitle={t('statistics.noDataProgress')}
      />
    );
  }

  const chart = (
    <BarChart
      key={chartKey}
      data={chartData}
      width={chartWidth}
      height={180}
      barWidth={barWidth}
      barBorderRadius={8}
      barBorderTopLeftRadius={8}
      barBorderTopRightRadius={8}
      spacing={spacing}
      noOfSections={4}
      maxValue={maxValue}
      yAxisThickness={0}
      xAxisThickness={0}
      hideRules
      hideYAxisText
      xAxisLabelTextStyle={[styles.xAxisLabelCentered, centerTextStyle]}
      labelWidth={barWidth}
      initialSpacing={sidePadding}
      endSpacing={sidePadding}
      isAnimated
    />
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartScrollContent}
      >
        {chart}
      </ScrollView>
    );
  }

  return <View style={styles.chartCenter}>{chart}</View>;
};

const Statistics = () => {
  const { t } = useTranslation();
  const { centerTextStyle, textStyle, rowDirection } = useAppDirection();
  const insets = useSafeAreaInsets();
  const { allCounters } = useCounter();
  const [progressTimePeriod, setProgressTimePeriod] = useState('week');
  const [tasbihProgressPeriod, setTasbihProgressPeriod] = useState('week');
  const [selectedProgressCounterId, setSelectedProgressCounterId] =
    useState(null);
  const [focusedPieIndex, setFocusedPieIndex] = useState(-1);
  const [dailyTotals, setDailyTotals] = useState({});
  const [counterDailyTotals, setCounterDailyTotals] = useState({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      Promise.all([getDailyTotals(), getCounterDailyTotals()])
        .then(([daily, counterDaily]) => {
          if (cancelled) return;
          setDailyTotals(daily || {});
          setCounterDailyTotals(counterDaily || {});
        })
        .catch(() => {
          if (cancelled) return;
          setDailyTotals({});
          setCounterDailyTotals({});
        });

      return () => {
        cancelled = true;
      };
    }, []),
  );

  const periods = useMemo(
    () => [
      { id: 'week', label: t('common.week') },
      { id: 'month', label: t('common.month') },
      { id: 'year', label: t('common.year') },
    ],
    [t],
  );

  const overview = useMemo(
    () => computeOverview(dailyTotals),
    [dailyTotals],
  );

  const distributionItems = useMemo(
    () =>
      computeCounterTotalsForPeriod(
        counterDailyTotals,
        progressTimePeriod,
        allCounters,
      ),
    [allCounters, counterDailyTotals, progressTimePeriod],
  );

  const distributionTotal = useMemo(
    () => distributionItems.reduce((sum, item) => sum + item.value, 0),
    [distributionItems],
  );

  const distributionWithPercent = useMemo(
    () =>
      distributionItems.map((item, index) => {
        const percent =
          distributionTotal > 0 ? (item.value / distributionTotal) * 100 : 0;
        return {
          ...item,
          color: PIE_COLORS[index % PIE_COLORS.length],
          percent,
        };
      }),
    [distributionItems, distributionTotal],
  );

  const pieData = useMemo(
    () =>
      distributionWithPercent.map((item, index) => ({
        value: item.value,
        color: item.color,
        text: formatPercent(item.percent),
        focused: index === focusedPieIndex,
      })),
    [distributionWithPercent, focusedPieIndex],
  );

  useEffect(() => {
    setFocusedPieIndex(-1);
  }, [distributionItems]);

  const progressItems = useMemo(
    () =>
      computeCounterTotalsForPeriod(
        counterDailyTotals,
        tasbihProgressPeriod,
        allCounters,
      ),
    [allCounters, counterDailyTotals, tasbihProgressPeriod],
  );

  const selectedCounterDailyTotals = useMemo(
    () =>
      extractCounterDailyTotals(
        counterDailyTotals,
        selectedProgressCounterId,
      ),
    [counterDailyTotals, selectedProgressCounterId],
  );

  const tasbihProgressChartMax = useMemo(
    () =>
      computePeriodChartMaxValue(
        counterDailyTotals,
        tasbihProgressPeriod,
        allCounters,
      ),
    [allCounters, counterDailyTotals, tasbihProgressPeriod],
  );

  useEffect(() => {
    if (progressItems.length === 0) {
      setSelectedProgressCounterId(null);
      return;
    }

    const stillValid = progressItems.some(
      (item) => item.id === selectedProgressCounterId,
    );
    if (!stillValid) {
      setSelectedProgressCounterId(progressItems[0].id);
    }
  }, [progressItems, selectedProgressCounterId]);

  return (
    <ImageBackground
      source={require('../assets/images/bg.png')}
      style={styles.root}
      imageStyle={styles.bgImage}
      resizeMode="cover"
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 175,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <LocalizedText center style={styles.title}>
            {t('statistics.title')}
          </LocalizedText>
          <View style={styles.headerLine} />
        </View>

        <LocalizedText style={[styles.sectionTitle, textStyle]}>
          {t('statistics.overview')}
        </LocalizedText>
        <View style={styles.overviewGrid}>
          <OverviewCard
            icon="grid-outline"
            label={t('statistics.totalCount')}
            value={String(overview.totalCount)}
          />
          <OverviewCard
            icon="calendar-outline"
            label={t('statistics.today')}
            value={String(overview.today)}
          />
          <OverviewCard
            icon="stats-chart-outline"
            label={t('statistics.dailyAvg')}
            value={String(overview.dailyAvg)}
          />
          <OverviewCard
            icon="flame-outline"
            label={t('statistics.streak')}
            value={`${overview.streak} ${t('common.days')}`}
          />
        </View>

        <LocalizedText style={[styles.sectionTitle, textStyle]}>
          {t('statistics.progressOverTime')}
        </LocalizedText>
        <View style={styles.card}>
          <StatisticsBarChart
            dailyTotals={dailyTotals}
            period={progressTimePeriod}
            scrollable={
              progressTimePeriod === 'month' || progressTimePeriod === 'year'
            }
          />
          <PeriodToggle
            period={progressTimePeriod}
            onChange={setProgressTimePeriod}
            periods={periods}
          />
        </View>

        <LocalizedText style={[styles.sectionTitle, textStyle]}>
          {t('statistics.tasbeehDistribution')}
        </LocalizedText>
        <View style={styles.card}>
          {distributionItems.length === 0 ? (
            <EmptyChartState
              icon="pie-chart-outline"
              title={t('statistics.noData')}
              subtitle={t('statistics.noDataDistribution')}
            />
          ) : (
            <>
              <View style={styles.pieWrap}>
                <PieChart
                  data={pieData}
                  donut
                  radius={78}
                  innerRadius={52}
                  innerCircleColor={COLORS.white}
                  focusOnPress
                  extraRadius={10}
                  focusedPieIndex={focusedPieIndex}
                  onPress={(_item, index) => {
                    setFocusedPieIndex((prev) =>
                      prev === index ? -1 : index,
                    );
                  }}
                  centerLabelComponent={() => {
                    const focused =
                      focusedPieIndex >= 0
                        ? distributionWithPercent[focusedPieIndex]
                        : null;
                    if (focused) {
                      return (
                        <Text style={styles.piePercent}>
                          {formatPercent(focused.percent)}
                        </Text>
                      );
                    }
                    return null;
                  }}
                />
              </View>
              <View style={styles.distributionList}>
                {distributionWithPercent.map((item, index) => {
                  const selected = index === focusedPieIndex;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() =>
                        setFocusedPieIndex((prev) =>
                          prev === index ? -1 : index,
                        )
                      }
                      activeOpacity={0.85}
                      style={[
                        styles.distributionRow,
                        selected && styles.distributionRowSelected,
                        { flexDirection: rowDirection },
                      ]}
                    >
                      <View
                        style={[
                          styles.distributionDot,
                          { backgroundColor: item.color },
                        ]}
                      />
                      <Text
                        style={[textStyle, styles.distributionLabel]}
                        numberOfLines={1}
                      >
                        {item.arabic}
                      </Text>
                      <Text style={styles.distributionPercent}>
                        {formatPercent(item.percent)}
                      </Text>
                      <Text
                        style={[
                          styles.distributionCount,
                          { color: item.color },
                        ]}
                      >
                        {item.value}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>

        <LocalizedText style={[styles.sectionTitle, textStyle]}>
          {t('statistics.tasbeehProgress')}
        </LocalizedText>
        <View style={styles.card}>
          <StatisticsBarChart
            chartKey={`${selectedProgressCounterId}-${tasbihProgressPeriod}`}
            dailyTotals={selectedCounterDailyTotals}
            period={tasbihProgressPeriod}
            maxValueOverride={tasbihProgressChartMax}
            scrollable={
              tasbihProgressPeriod === 'month' ||
              tasbihProgressPeriod === 'year'
            }
          />
          <PeriodToggle
            period={tasbihProgressPeriod}
            onChange={setTasbihProgressPeriod}
            periods={periods}
          />

          {progressItems.length > 0 ? (
            <View style={styles.progressList}>
              {progressItems.map((item) => {
                const selected = item.id === selectedProgressCounterId;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setSelectedProgressCounterId(item.id)}
                    activeOpacity={0.85}
                    style={[
                      styles.progressRow,
                      selected
                        ? styles.progressRowSelected
                        : styles.progressRowDone,
                      { flexDirection: rowDirection },
                    ]}
                  >
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'ellipse-outline'}
                      size={20}
                      color={selected ? COLORS.primary : COLORS.gray}
                    />
                    <Text
                      style={[
                        styles.progressArabic,
                        selected
                          ? styles.progressArabicDone
                          : styles.progressArabicActive,
                        centerTextStyle,
                      ]}
                      numberOfLines={1}
                    >
                      {item.arabic}
                    </Text>
                    <Text style={styles.progressCount}>{item.value}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
        </View>

      </ScrollView>
    </ImageBackground>
  );
};

export default Statistics;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  bgImage: {
    opacity: BG_IMAGE_OPACITY,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: FONT.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },
  headerLine: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(71,127,78,0.15)',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: FONT.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
    marginTop: 4,
    marginBottom: 2,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(71,127,78,0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  overviewLabel: {
    fontSize: FONT.caption,
    fontWeight: FONT_WEIGHT.medium,
    color: '#6B7280',
  },
  overviewValue: {
    fontSize: FONT.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(71,127,78,0.12)',
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  periodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  periodButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.primaryDark,
    borderRadius: 24,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  periodText: {
    fontSize: FONT.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primaryDark,
  },
  periodTextActive: {
    color: COLORS.white,
  },
  xAxisLabelCentered: {
    fontSize: FONT.caption,
    color: '#6B7280',
  },
  chartCenter: {
    alignItems: 'center',
  },
  chartScrollContent: {
    paddingRight: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  emptyTitle: {
    fontSize: FONT.body,
    fontWeight: FONT_WEIGHT.semibold,
    color: '#6B7280',
  },
  emptySubtitle: {
    fontSize: FONT.caption,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  pieWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  piePercent: {
    fontSize: FONT.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },
  distributionList: {
    gap: 8,
    width: '100%',
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F7FAF8',
    borderWidth: 1,
    borderColor: 'rgba(71,127,78,0.1)',
  },
  distributionRowSelected: {
    backgroundColor: '#E8F3EB',
    borderColor: COLORS.primary,
  },
  distributionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  distributionLabel: {
    flex: 1,
    fontSize: FONT.sm,
    color: COLORS.primaryDark,
    writingDirection: 'rtl',
  },
  distributionPercent: {
    fontSize: FONT.caption,
    fontWeight: FONT_WEIGHT.medium,
    color: '#6B7280',
    minWidth: 48,
    textAlign: 'right',
  },
  distributionCount: {
    fontSize: FONT.sm,
    fontWeight: FONT_WEIGHT.semibold,
    minWidth: 28,
    textAlign: 'right',
  },
  progressList: {
    gap: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: 'rgba(71,127,78,0.12)',
  },
  progressRowDone: {
    backgroundColor: '#E8F3EB',
    borderColor: 'rgba(71,127,78,0.2)',
  },
  progressRowSelected: {
    backgroundColor: '#D4E9DA',
    borderColor: COLORS.primaryDark,
    borderWidth: 1.5,
  },
  progressArabic: {
    flex: 1,
    fontSize: FONT.body,
    color: '#6B7280',
    writingDirection: 'rtl',
  },
  progressArabicActive: {
    color: COLORS.primaryDark,
  },
  progressArabicDone: {
    color: COLORS.primaryDark,
    fontWeight: FONT_WEIGHT.medium,
  },
  progressCount: {
    fontSize: FONT.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
  },
  bannerSpacing: {
    marginTop: 8,
    marginBottom: 4,
  },
});
