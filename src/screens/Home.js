import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Platform,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ImageBackground,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../assets/color';
import { BG_IMAGE_OPACITY } from '../constants/theme';
import { FONT, FONT_WEIGHT } from '../constants/typography';
import TasbihThread from '../components/TasbihThread';
import TasbihCounter from '../components/TasbihCounter';
import ProfileMenu from '../components/ProfileMenu';
import AutoCounterModal from '../components/AutoCounterModal';
import {
  initTasbihSounds,
  playTapBackward,
  playTapForward,
  playRoundComplete,
  setTasbihSoundEnabled,
} from '../utils/tasbihSounds';
import { useCounter } from '../context/CounterContext';
import { useSettings } from '../context/SettingsContext';
import { DEFAULT_COUNTER } from '../constants/counters';
import {
  useVolumeButtons,
  VOLUME_BEAD_ANIM_MS,
} from '../hooks/useVolumeButtons';
import { useTranslation } from 'react-i18next';
import { useAppDirection } from '../hooks/useAppDirection';
import LocalizedText from '../components/LocalizedText';
import { addDailyTap, getLocalDateKey } from '../storage/tasbihProStorage';
import i18n from '../i18n';
import KeepAwake from '@sayem314/react-native-keep-awake';

const DEFAULT_TARGET = DEFAULT_COUNTER.target;
const BEAD_ANIM_MIN_MS = 240;
const BEAD_ANIM_MAX_MS = 520;
const BEAD_ANIM_MS_PER_STEP = 420;
const HAPTIC_MIN_INTERVAL_MS = 55;
const TOUCH_CALIBRATION_TAPS = 3;
const MIN_TOUCH_INTERVAL_MS = 80;
const MAX_TOUCH_INTERVAL_MS = 2500;

const formatTimer = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const CONTROL_ICONS = {
  sound: require('../assets/images/sound.png'),
  vibrate: require('../assets/images/vibrate.png'),
  auto: require('../assets/images/auto.png'),
  subtract: require('../assets/images/subtract.png'),
  reset: require('../assets/images/reset.png'),
};

const ControlButton = ({ source, onPress, active = true, tintColor }) => (
  <TouchableOpacity
    style={styles.controlButton}
    onPress={onPress}
    activeOpacity={0.7}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  >
    <Image
      source={source}
      style={[styles.controlIcon, !active && styles.controlIconMuted]}
      resizeMode="contain"
      tintColor={tintColor}
    />
  </TouchableOpacity>
);

const Home = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { rowDirection, centerTextStyle, inputTextStyle } = useAppDirection();
  const { activeCounter, updateCounter } = useCounter();
  const { settings, updateSetting } = useSettings();
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(DEFAULT_TARGET);
  const settingsRef = useRef(settings);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [autoModalVisible, setAutoModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [targetInput, setTargetInput] = useState(String(DEFAULT_TARGET));
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const progress = useSharedValue(0);
  const targetCount = useSharedValue(0);
  const lastHapticAt = useRef(0);
  const timerRef = useRef(null);
  const autoIntervalRef = useRef(null);
  const touchAutoCalibratingRef = useRef(false);
  const touchTapTimestampsRef = useRef([]);
  const lastTouchTapRef = useRef(0);
  const touchIntervalRef = useRef(500);
  const autoRunningRef = useRef(false);
  const autoPausedRef = useRef(false);
  const autoCounterModeRef = useRef(settings.autoCounterMode);
  const pauseAutoCounterRef = useRef(() => {});
  const resumeAutoCounterRef = useRef(() => {});
  const stopAutoCounterRef = useRef(() => {});
  const activeCounterRef = useRef(activeCounter);
  const [isAutoActive, setIsAutoActive] = useState(false);
  const [isAutoPaused, setIsAutoPaused] = useState(false);

  useEffect(() => {
    activeCounterRef.current = activeCounter;
  }, [activeCounter]);

  useEffect(() => {
    settingsRef.current = settings;
    autoCounterModeRef.current = settings.autoCounterMode;
    setTasbihSoundEnabled(settings.countSound);
  }, [settings]);

  useEffect(() => {
    initTasbihSounds();
  }, []);

  useEffect(() => {
    const nextTarget = activeCounter.target;
    const nextCount = activeCounter.initialCount ?? 0;
    setTarget(nextTarget);
    setTargetInput(String(nextTarget));
    setCount(nextCount);
    cancelAnimation(progress);
    targetCount.value = nextCount;
    progress.value = nextCount;
    setTimerRunning(false);
    setElapsedSeconds(0);
  }, [
    activeCounter.id,
    activeCounter.target,
    progress,
    targetCount,
  ]);

  useEffect(() => {
    if (!timerRunning) {
      return undefined;
    }
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerRunning]);

  useEffect(() => {
    if (!settings.showTimer) {
      setTimerRunning(false);
      setElapsedSeconds(0);
    }
  }, [settings.showTimer]);

  const triggerHaptic = useCallback(() => {
    if (!settingsRef.current.countVibration) {
      return;
    }
    const now = Date.now();
    if (now - lastHapticAt.current < HAPTIC_MIN_INTERVAL_MS) {
      return;
    }
    lastHapticAt.current = now;
    try {
      if (Platform.OS === 'android') {
        Vibration.vibrate(40);
      } else {
        Vibration.vibrate(10);
      }
    } catch {
      // Ignore if vibration is unavailable on the device.
    }
  }, []);

  const persistActiveCount = useCallback(
    (nextCount) => {
      const c = activeCounterRef.current;
      if (!c) return;

      const safeNext = Math.max(0, Math.floor(nextCount));
      const current = Number(c.initialCount ?? 0);
      if (current === safeNext) return;

      updateCounter(c.id, {
        label: c.label,
        target: c.target,
        initialCount: safeNext,
        arabic: c.arabic || '',
      });
    },
    [updateCounter],
  );

  useAnimatedReaction(
    () => targetCount.value,
    (value, previous) => {
      if (value !== previous) {
        runOnJS(setCount)(value);
        runOnJS(persistActiveCount)(value);
      }
    },
  );

  const bumpCount = useCallback(
    (delta, beadAnimMs) => {
      'worklet';
      const next = Math.max(0, targetCount.value + delta);
      targetCount.value = next;
      cancelAnimation(progress);
      const remaining = Math.abs(next - progress.value);
      const duration =
        beadAnimMs != null
          ? Math.min(2000, Math.max(MIN_TOUCH_INTERVAL_MS, beadAnimMs))
          : Math.min(
              BEAD_ANIM_MAX_MS,
              Math.max(BEAD_ANIM_MIN_MS, remaining * BEAD_ANIM_MS_PER_STEP),
            );
      const easing =
        remaining < 1.05 ? Easing.linear : Easing.out(Easing.cubic);
      progress.value = withTiming(
        next,
        { duration, easing },
        (finished) => {
          if (finished) {
            progress.value = next;
          }
        },
      );
    },
    [progress, targetCount],
  );

  const resetCount = useCallback(() => {
    'worklet';
    targetCount.value = 0;
    cancelAnimation(progress);
    progress.value = 0;
  }, [progress, targetCount]);

  const decrement = useCallback(() => {
    bumpCount(-1);
    if (settingsRef.current.countVibration) {
      triggerHaptic();
    }
    if (settingsRef.current.countSound) {
      playTapBackward();
    }
  }, [bumpCount, triggerHaptic]);

  const reset = useCallback(() => {
    resetCount();
    setCount(0);
    if (settingsRef.current.countVibration) {
      triggerHaptic();
    }
  }, [resetCount, triggerHaptic]);

  const resetTimer = useCallback(() => {
    setTimerRunning(false);
    setElapsedSeconds(0);
  }, []);

  const startTimer = useCallback(() => {
    setTimerRunning(true);
  }, []);

  const triggerRoundComplete = useCallback((roundNumber) => {
    if (settingsRef.current.roundCompleteVibration) {
      try {
        if (Platform.OS === 'android') {
          Vibration.vibrate(60);
        } else {
          Vibration.vibrate(30);
        }
      } catch {
        // Ignore if vibration is unavailable.
      }
    }
    if (settingsRef.current.roundCompleteSound) {
      playRoundComplete();
    }

    if (!settingsRef.current.roundCompleteAlert) {
      return;
    }

    const isAutoActive =
      autoRunningRef.current && !autoPausedRef.current;

    if (isAutoActive) {
      pauseAutoCounterRef.current();
      Alert.alert(
        i18n.t('home.roundComplete'),
        i18n.t('home.roundCompleteAutoMessage', { round: roundNumber }),
        [
          {
            text: i18n.t('home.stopAuto'),
            style: 'cancel',
            onPress: () => stopAutoCounterRef.current(),
          },
          {
            text: i18n.t('home.continueAuto'),
            onPress: () => resumeAutoCounterRef.current(),
          },
        ],
        { cancelable: false },
      );
      return;
    }

    Alert.alert(
      i18n.t('home.roundComplete'),
      i18n.t('home.roundCompleteMessage', { round: roundNumber }),
    );
  }, []);

  const incrementFromTap = useCallback(
    (options = {}) => {
      const { beadAnimMs } = options;
      const previous = targetCount.value;
      const next = previous + 1;
      bumpCount(1, beadAnimMs);
      addDailyTap(getLocalDateKey(), 1, activeCounterRef.current?.id).catch(
        () => {},
      );
      if (settingsRef.current.countVibration) {
        triggerHaptic();
      }
      if (settingsRef.current.countSound) {
        playTapForward();
      }
      if (next > 0 && next % target === 0) {
        triggerRoundComplete(next / target);
      }
      if (settingsRef.current.showTimer) {
        startTimer();
      }
    },
    [
      bumpCount,
      target,
      targetCount,
      triggerHaptic,
      triggerRoundComplete,
      startTimer,
    ],
  );

  const clearAutoInterval = useCallback(() => {
    if (autoIntervalRef.current != null) {
      clearTimeout(autoIntervalRef.current);
      clearInterval(autoIntervalRef.current);
      autoIntervalRef.current = null;
    }
  }, []);

  const clampTouchInterval = useCallback(
    (ms) =>
      Math.min(MAX_TOUCH_INTERVAL_MS, Math.max(MIN_TOUCH_INTERVAL_MS, ms)),
    [],
  );

  const computeTouchInterval = useCallback(
    (timestamps) => {
      if (timestamps.length < 2) {
        return touchIntervalRef.current;
      }
      let sum = 0;
      for (let i = 1; i < timestamps.length; i += 1) {
        sum += timestamps[i] - timestamps[i - 1];
      }
      return clampTouchInterval(sum / (timestamps.length - 1));
    },
    [clampTouchInterval],
  );

  const scheduleTouchAutoIncrement = useCallback(() => {
    if (!autoRunningRef.current || autoPausedRef.current) {
      return;
    }
    clearAutoInterval();
    const interval = touchIntervalRef.current;
    autoIntervalRef.current = setTimeout(() => {
      if (!autoRunningRef.current || autoPausedRef.current) {
        return;
      }
      incrementFromTap({ beadAnimMs: interval });
      scheduleTouchAutoIncrement();
    }, interval);
  }, [clearAutoInterval, incrementFromTap]);

  const scheduleTimerAutoIncrement = useCallback((delaySeconds) => {
    if (!autoRunningRef.current || autoPausedRef.current) {
      return;
    }
    clearAutoInterval();
    const delayMs =
      (delaySeconds ?? settingsRef.current.autoCounterDelay) * 1000;
    autoIntervalRef.current = setInterval(() => {
      if (!autoRunningRef.current || autoPausedRef.current) {
        return;
      }
      incrementFromTap();
    }, delayMs);
  }, [clearAutoInterval, incrementFromTap]);

  const stopAutoCounter = useCallback(() => {
    autoRunningRef.current = false;
    autoPausedRef.current = false;
    setIsAutoActive(false);
    setIsAutoPaused(false);
    clearAutoInterval();
    touchAutoCalibratingRef.current = false;
    touchTapTimestampsRef.current = [];
    lastTouchTapRef.current = 0;
  }, [clearAutoInterval]);

  const pauseAutoCounter = useCallback(() => {
    if (!autoRunningRef.current || autoPausedRef.current) {
      return;
    }
    autoPausedRef.current = true;
    setIsAutoPaused(true);
    clearAutoInterval();
  }, [clearAutoInterval]);

  const resumeAutoCounter = useCallback(() => {
    if (!autoRunningRef.current || !autoPausedRef.current) {
      return;
    }
    autoPausedRef.current = false;
    setIsAutoPaused(false);

    if (autoCounterModeRef.current === 'timer') {
      scheduleTimerAutoIncrement();
      return;
    }

    if (!touchAutoCalibratingRef.current) {
      scheduleTouchAutoIncrement();
    }
  }, [scheduleTimerAutoIncrement, scheduleTouchAutoIncrement]);

  pauseAutoCounterRef.current = pauseAutoCounter;
  resumeAutoCounterRef.current = resumeAutoCounter;
  stopAutoCounterRef.current = stopAutoCounter;

  const startAutoCounter = useCallback(
    ({ mode, delay, calibrationTimestamps }) => {
      stopAutoCounter();
      autoRunningRef.current = true;
      autoPausedRef.current = false;
      autoCounterModeRef.current = mode;
      setIsAutoActive(true);
      setIsAutoPaused(false);

      updateSetting('autoCounterMode', mode);

      if (mode === 'timer') {
        updateSetting('autoCounterDelay', delay);
        scheduleTimerAutoIncrement(delay);
      } else if (
        calibrationTimestamps &&
        calibrationTimestamps.length >= TOUCH_CALIBRATION_TAPS
      ) {
        touchTapTimestampsRef.current = calibrationTimestamps;
        touchAutoCalibratingRef.current = false;
        touchIntervalRef.current = computeTouchInterval(calibrationTimestamps);
        lastTouchTapRef.current =
          calibrationTimestamps[calibrationTimestamps.length - 1];
        scheduleTouchAutoIncrement();
      } else {
        touchAutoCalibratingRef.current = true;
      }
    },
    [
      computeTouchInterval,
      scheduleTimerAutoIncrement,
      scheduleTouchAutoIncrement,
      stopAutoCounter,
      updateSetting,
    ],
  );

  useEffect(() => {
    return () => {
      clearAutoInterval();
    };
  }, [clearAutoInterval]);

  useEffect(() => {
    if (!settings.showAutoCounter) {
      stopAutoCounter();
    }
  }, [settings.showAutoCounter, stopAutoCounter]);

  const handleManualIncrement = useCallback(() => {
    const now = Date.now();
    const isTouchAuto =
      autoRunningRef.current && autoCounterModeRef.current === 'touch';

    if (isTouchAuto && touchAutoCalibratingRef.current) {
      incrementFromTap();
      const timestamps = [...touchTapTimestampsRef.current, now];
      touchTapTimestampsRef.current = timestamps;
      lastTouchTapRef.current = now;

      if (timestamps.length >= TOUCH_CALIBRATION_TAPS) {
        touchAutoCalibratingRef.current = false;
        touchIntervalRef.current = computeTouchInterval(timestamps);
        scheduleTouchAutoIncrement();
      }
      return;
    }

    incrementFromTap();

    if (isTouchAuto && !touchAutoCalibratingRef.current) {
      if (lastTouchTapRef.current > 0) {
        const delta = now - lastTouchTapRef.current;
        touchIntervalRef.current = clampTouchInterval(delta);
        scheduleTouchAutoIncrement();
      }
      lastTouchTapRef.current = now;
    }
  }, [
    clampTouchInterval,
    computeTouchInterval,
    incrementFromTap,
    scheduleTouchAutoIncrement,
  ]);

  const incrementFromVolume = useCallback(() => {
    incrementFromTap({ beadAnimMs: VOLUME_BEAD_ANIM_MS });
  }, [incrementFromTap]);

  const decrementFromVolume = useCallback(() => {
    bumpCount(-1, VOLUME_BEAD_ANIM_MS);
    if (settingsRef.current.countVibration) {
      triggerHaptic();
    }
    if (settingsRef.current.countSound) {
      playTapBackward();
    }
  }, [bumpCount, triggerHaptic]);

  const handleVolumeLongPress = useCallback(() => {
    Alert.alert(
      i18n.t('home.volumeLongPressTitle'),
      i18n.t('home.volumeLongPressMessage'),
    );
  }, []);

  useVolumeButtons(
    incrementFromVolume,
    decrementFromVolume,
    settings.volumeButtonControl && !editModalVisible && !autoModalVisible,
    handleVolumeLongPress,
  );

  const openTargetEditor = () => {
    setTargetInput(String(target));
    setEditModalVisible(true);
  };

  const saveTarget = () => {
    const parsed = parseInt(targetInput, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setTarget(parsed);
      const c = activeCounterRef.current;
      if (c?.id) {
        updateCounter(c.id, {
          label: c.label,
          target: parsed,
          initialCount: count,
          arabic: c.arabic || '',
        });
      }
    }
    setEditModalVisible(false);
  };

  const openAutoModal = () => {
    if (autoRunningRef.current) {
      stopAutoCounter();
    }
    setAutoModalVisible(true);
  };

  const panGesture = Gesture.Pan().onEnd((event) => {
    if (event.translationX < -50) {
      runOnJS(decrement)();
    }
  });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      runOnJS(handleManualIncrement)();
    });

  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  return (
    <ImageBackground
      source={require('../assets/images/bg.png')}
      style={styles.root}
      imageStyle={styles.bgImage}
      resizeMode="cover"
    >
      {isAutoActive && !isAutoPaused ? <KeepAwake /> : null}
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 6,
            paddingBottom: insets.bottom + 175,
          },
        ]}
      >
        <View style={[styles.topBar, { flexDirection: rowDirection }]}>
            <TouchableOpacity
              onPress={openTargetEditor}
              style={styles.topIconButton}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil-outline" size={22} color="#1A1A1A" />
            </TouchableOpacity>

            {settings.showTimer ? (
              <View style={[styles.timerPill, { flexDirection: rowDirection }]}>
                <TouchableOpacity
                  onPress={() => setTimerRunning((v) => !v)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={timerRunning ? 'pause' : 'play'}
                    size={16}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
                <Text style={styles.timerText}>
                  {formatTimer(elapsedSeconds)}
                </Text>
                <TouchableOpacity
                  onPress={resetTimer}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="refresh" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.topBarCenter} />
            )}

            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              style={styles.topIconButton}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-vertical" size={22} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          {settings.showCounterName ? (
            <Text style={[styles.arabicText, centerTextStyle]}>
              {activeCounter.label}
            </Text>
          ) : null}

          <View style={[styles.controlRow, { flexDirection: rowDirection }]}>
            {isAutoActive ? (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={isAutoPaused ? resumeAutoCounter : pauseAutoCounter}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={isAutoPaused ? 'play' : 'pause'}
                  size={22}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            ) : null}
            {settings.showAutoCounter ? (
              <ControlButton
                source={CONTROL_ICONS.auto}
                onPress={openAutoModal}
                tintColor={COLORS.primary}
              />
            ) : null}
            <ControlButton
              source={CONTROL_ICONS.sound}
              onPress={() => updateSetting('countSound', !settings.countSound)}
              active={settings.countSound}
            />
            <ControlButton
              source={CONTROL_ICONS.vibrate}
              onPress={() =>
                updateSetting('countVibration', !settings.countVibration)
              }
              active={settings.countVibration}
            />
            <ControlButton
              source={CONTROL_ICONS.subtract}
              onPress={decrement}
            />
            <ControlButton source={CONTROL_ICONS.reset} onPress={reset} />
          </View>

          <GestureDetector gesture={composedGesture}>
            <View style={styles.tapZone}>
              <View style={styles.tasbihArea}>
                <View style={styles.tasbihWrap}>
                  <TasbihThread progress={progress} />
                </View>
                <LocalizedText center style={styles.hint}>
                  {t('home.tapHint')}
                </LocalizedText>
                {settings.volumeButtonControl ? (
                  <LocalizedText center style={styles.hintSub}>
                    {t('home.swipeHint')}
                  </LocalizedText>
                ) : (
                  <LocalizedText center style={styles.hintSub}>
                    {t('home.swipeHintNoVolume')}
                  </LocalizedText>
                )}
              </View>
              <View style={styles.bottomSpacer} />
            </View>
          </GestureDetector>

          {(settings.showRounds || settings.showLapLimit) ? (
            <View style={styles.statsWrap}>
              <TasbihCounter
                count={count}
                target={target}
                showRounds={settings.showRounds}
                showLapLimit={settings.showLapLimit}
              />
            </View>
          ) : null}
        </View>

      <ProfileMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />

      <AutoCounterModal
        visible={autoModalVisible}
        onClose={() => setAutoModalVisible(false)}
        onStart={startAutoCounter}
        initialMode={settings.autoCounterMode}
        initialDelay={settings.autoCounterDelay}
      />

      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalKeyboard}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setEditModalVisible(false)}
          >
            <Pressable onPress={() => {}} style={styles.modalCard}>
              <LocalizedText center style={styles.modalTitle}>
                {t('home.setTarget')}
              </LocalizedText>
              <TextInput
                style={[styles.modalInput, inputTextStyle]}
                value={targetInput}
                onChangeText={setTargetInput}
                keyboardType="number-pad"
                maxLength={4}
                autoFocus
              />
              <TouchableOpacity style={styles.modalSave} onPress={saveTarget}>
                <Text style={styles.modalSaveText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </ImageBackground>
  );
};

export default Home;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  bgImage: {
    opacity: BG_IMAGE_OPACITY,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    zIndex: 1,
    paddingBottom: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  topIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: {
    flex: 1,
    maxWidth: 160,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  timerText: {
    fontSize: FONT.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: '#1A1A1A',
    minWidth: 44,
    textAlign: 'center',
  },
  arabicText: {
    fontSize: 28,
    color: '#111111',
    marginTop: 8,
    marginBottom: 8,
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: 36,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  controlButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: {
    width: 22,
    height: 22,
  },
  controlIconMuted: {
    opacity: 0.35,
  },
  bannerSpacing: {
    marginTop: 12,
    marginBottom: 4,
  },
  tapZone: {
    flex: 1,
  },
  tasbihArea: {
    alignItems: 'center',
    marginTop: 16,
    direction: 'ltr',
  },
  tasbihWrap: {
    marginTop: 8,
    direction: 'ltr',
    alignSelf: 'center',
  },
  hint: {
    color: COLORS.primary,
    fontSize: FONT.body,
    fontWeight: FONT_WEIGHT.semibold,
    marginTop: 10,
  },
  hintSub: {
    color: COLORS.primary,
    fontSize: FONT.caption,
    marginTop: 2,
    opacity: 0.85,
  },
  bottomSpacer: {
    flex: 1,
    minHeight: 20,
  },
  statsWrap: {
    marginTop: 16,
    marginBottom: 4,
  },
  modalKeyboard: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: FONT.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: FONT.lg,
    color: '#111',
    marginBottom: 14,
  },
  modalSave: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: FONT.body,
  },
});
