import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../assets/color';
import { FONT, FONT_WEIGHT } from '../constants/typography';
import { useAppDirection } from '../hooks/useAppDirection';
import LocalizedText from '../components/LocalizedText';

const MIN_DELAY = 0.1;
const MAX_DELAY = 10;
const FINE_STEP = 0.1;
const COARSE_STEP = 1;
const TOUCH_TAPS_REQUIRED = 3;

const clampDelay = (value) =>
  Math.min(MAX_DELAY, Math.max(MIN_DELAY, Number(value.toFixed(1))));

const formatDelay = (value) => value.toFixed(1);

const AutoCounterModal = ({
  visible,
  onClose,
  onStart,
  initialMode = 'touch',
  initialDelay = 1,
}) => {
  const { t } = useTranslation();
  const { centerTextStyle, inputTextStyle } = useAppDirection();
  const [mode, setMode] = useState(initialMode);
  const [delay, setDelay] = useState(initialDelay);
  const [touchCount, setTouchCount] = useState(0);
  const touchCountRef = useRef(0);
  const touchTimestampsRef = useRef([]);

  useEffect(() => {
    if (visible) {
      setMode(initialMode);
      setDelay(initialDelay);
      setTouchCount(0);
      touchCountRef.current = 0;
      touchTimestampsRef.current = [];
    }
  }, [visible, initialMode, initialDelay]);

  const decreaseFine = () => {
    setDelay((prev) => clampDelay(prev - FINE_STEP));
  };

  const decreaseCoarse = () => {
    setDelay((prev) => clampDelay(prev - COARSE_STEP));
  };

  const increaseCoarse = () => {
    setDelay((prev) => clampDelay(prev + COARSE_STEP));
  };

  const increaseFine = () => {
    setDelay((prev) => clampDelay(prev + FINE_STEP));
  };

  const handleStart = () => {
    onStart({ mode, delay });
    onClose();
  };

  const handleTouchAreaPress = () => {
    const now = Date.now();
    const nextCount = touchCountRef.current + 1;
    touchCountRef.current = nextCount;
    touchTimestampsRef.current = [...touchTimestampsRef.current, now];
    setTouchCount(nextCount);

    if (nextCount >= TOUCH_TAPS_REQUIRED) {
      onStart({
        mode: 'touch',
        calibrationTimestamps: touchTimestampsRef.current,
      });
      onClose();
    }
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setTouchCount(0);
    touchCountRef.current = 0;
    touchTimestampsRef.current = [];
  };

  const subtitle =
    mode === 'touch'
      ? t('autoCounter.touchSubtitle')
      : t('autoCounter.timerSubtitle');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={() => {}} style={styles.card}>
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, mode === 'touch' && styles.tabActive]}
              onPress={() => handleModeChange('touch')}
              activeOpacity={0.8}
            >
              <LocalizedText
                center
                style={[styles.tabText, mode === 'touch' && styles.tabTextActive]}
              >
                {t('autoCounter.touch')}
              </LocalizedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'timer' && styles.tabActive]}
              onPress={() => handleModeChange('timer')}
              activeOpacity={0.8}
            >
              <LocalizedText
                center
                style={[styles.tabText, mode === 'timer' && styles.tabTextActive]}
              >
                {t('autoCounter.timer')}
              </LocalizedText>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <LocalizedText center style={styles.title}>
            {t('autoCounter.title')}
          </LocalizedText>
          <LocalizedText center style={styles.subtitle}>
            {subtitle}
          </LocalizedText>

          {mode === 'touch' ? (
            <TouchableOpacity
              style={styles.touchArea}
              onPress={handleTouchAreaPress}
              activeOpacity={0.85}
            >
              <Ionicons name="hand-left-outline" size={36} color={COLORS.primary} />
              <LocalizedText center style={styles.touchAreaTitle}>
                {t('autoCounter.tapHere')}
              </LocalizedText>
              <Text style={styles.touchAreaCount}>
                {touchCount} / {TOUCH_TAPS_REQUIRED}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.counterRow}>
              <TouchableOpacity
                style={styles.minusButton}
                onPress={decreaseFine}
                activeOpacity={0.8}
              >
                <Ionicons name="remove" size={22} color={COLORS.primaryDark} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.minusButton}
                onPress={decreaseCoarse}
                activeOpacity={0.8}
              >
                <Ionicons name="remove" size={22} color={COLORS.primaryDark} />
              </TouchableOpacity>

              <View style={styles.valueBlock}>
                <Text style={styles.valueText}>{formatDelay(delay)}</Text>
                <Text style={styles.valueLabel}>{t('autoCounter.seconds')}</Text>
              </View>

              <TouchableOpacity
                style={styles.plusButton}
                onPress={increaseCoarse}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={24} color={COLORS.white} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.plusButton}
                onPress={increaseFine}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                mode === 'touch' && styles.cancelButtonFull,
              ]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            {mode === 'timer' ? (
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStart}
                activeOpacity={0.8}
              >
                <Text style={styles.startText}>{t('common.start')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default AutoCounterModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(71,127,78,0.18)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabRow: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: COLORS.white,
  },
  tabActive: {
    backgroundColor: '#E8F3EB',
  },
  tabText: {
    fontSize: FONT.body,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primaryDark,
  },
  tabTextActive: {
    color: COLORS.primaryDark,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(71,127,78,0.2)',
  },
  title: {
    fontSize: FONT.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primaryDark,
    marginTop: 22,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: FONT.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.gray,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  touchArea: {
    marginHorizontal: 20,
    marginBottom: 28,
    minHeight: 140,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(71,127,78,0.25)',
    backgroundColor: '#E8F3EB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  touchAreaTitle: {
    fontSize: FONT.body,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primaryDark,
  },
  touchAreaCount: {
    fontSize: FONT.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.gray,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  minusButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  plusButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDark,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  valueBlock: {
    alignItems: 'center',
    minWidth: 72,
  },
  valueText: {
    fontSize: 34,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
    lineHeight: 46,
  },
  valueLabel: {
    fontSize: FONT.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.gray,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.primaryDark,
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  cancelButtonFull: {
    flex: 1,
  },
  cancelText: {
    fontSize: FONT.body,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primaryDark,
  },
  startButton: {
    flex: 1,
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
  },
  startText: {
    fontSize: FONT.body,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.white,
  },
});
