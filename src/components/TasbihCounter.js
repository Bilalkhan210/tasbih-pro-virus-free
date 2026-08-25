import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../assets/color';
import { FONT, FONT_WEIGHT } from '../constants/typography';
import { useAppDirection } from '../hooks/useAppDirection';

const TasbihCounter = ({ count, target, showRounds = true, showLapLimit = true }) => {
  const { t } = useTranslation();
  const { rowDirection, textStyle, centerTextStyle } = useAppDirection();
  const safeTarget = Math.max(1, Number(target) || 1);
  const rounds = Math.floor(count / safeTarget);
  const lapCount = count % safeTarget;

  if (!showRounds && !showLapLimit) {
    return null;
  }

  return (
    <View style={[styles.row, { flexDirection: rowDirection }]}>
      {showRounds ? (
        <Text style={[styles.roundText, textStyle]}>
          {t('counter.round')}: <Text style={styles.roundValue}>{rounds}</Text>
        </Text>
      ) : null}
      {showLapLimit ? (
        <Text
          style={[
            styles.countText,
            textStyle,
            !showRounds && styles.countTextSolo,
            !showRounds && centerTextStyle,
          ]}
        >
          {t('counter.count')}:{' '}
          <Text style={styles.countValue}>
            {lapCount}/{safeTarget}
          </Text>
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  roundText: {
    fontSize: FONT.xl,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.primary,
  },
  roundValue: {
    fontSize: FONT.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  countText: {
    fontSize: FONT.xl,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.primary,
  },
  countTextSolo: {
    flex: 1,
  },
  countValue: {
    fontSize: FONT.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
});

export default TasbihCounter;
