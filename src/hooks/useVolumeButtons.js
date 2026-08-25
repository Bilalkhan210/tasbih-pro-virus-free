import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { VolumeManager } from 'react-native-volume-manager';

const VOLUME_STEP_THRESHOLD = 0.001;
/** Minimum gap between counts so each bead step can finish smoothly. */
const VOLUME_COUNT_INTERVAL_MS = 320;
/** Continuous volume events longer than this count as a long-press. */
const LONG_PRESS_MS = 550;
/** Quiet gap that means the key was released. */
const RELEASE_GAP_MS = 280;

export const useVolumeButtons = (
  onVolumeUp,
  onVolumeDown,
  enabled = true,
  onLongPress,
) => {
  const lastVolumeRef = useRef(null);
  const isRestoringRef = useRef(false);
  const onVolumeUpRef = useRef(onVolumeUp);
  const onVolumeDownRef = useRef(onVolumeDown);
  const onLongPressRef = useRef(onLongPress);
  const lastCountAtRef = useRef(0);
  const lastEventAtRef = useRef(0);
  const pressStartedAtRef = useRef(0);
  const longPressFiredRef = useRef(false);

  onVolumeUpRef.current = onVolumeUp;
  onVolumeDownRef.current = onVolumeDown;
  onLongPressRef.current = onLongPress;

  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
        return undefined;
      }

      let subscription = null;
      let cancelled = false;

      const setup = async () => {
        if (Platform.OS === 'ios') {
          try {
            await VolumeManager.enableInSilenceMode(true);
          } catch {
            // Ignore if silent mode handling is unavailable.
          }
        }

        await VolumeManager.showNativeVolumeUI({ enabled: false });

        const { volume } = await VolumeManager.getVolume();
        if (cancelled) {
          return;
        }

        lastVolumeRef.current = volume;

        subscription = VolumeManager.addVolumeListener(async (result) => {
          if (isRestoringRef.current) {
            return;
          }

          const current = result.volume;
          const previous = lastVolumeRef.current;

          if (previous === null) {
            lastVolumeRef.current = current;
            return;
          }

          const wentUp = current > previous + VOLUME_STEP_THRESHOLD;
          const wentDown = current < previous - VOLUME_STEP_THRESHOLD;

          if (!wentUp && !wentDown) {
            return;
          }

          const now = Date.now();
          const gap = now - lastEventAtRef.current;

          if (gap > RELEASE_GAP_MS) {
            pressStartedAtRef.current = now;
            longPressFiredRef.current = false;
          }

          lastEventAtRef.current = now;

          const holdMs = now - pressStartedAtRef.current;
          if (
            !longPressFiredRef.current &&
            holdMs >= LONG_PRESS_MS &&
            gap <= RELEASE_GAP_MS
          ) {
            longPressFiredRef.current = true;
            onLongPressRef.current?.();
          }

          const shouldCount =
            !longPressFiredRef.current &&
            now - lastCountAtRef.current >= VOLUME_COUNT_INTERVAL_MS;

          if (shouldCount) {
            lastCountAtRef.current = now;
            if (wentUp) {
              onVolumeUpRef.current?.();
            } else {
              onVolumeDownRef.current?.();
            }
          }

          isRestoringRef.current = true;
          try {
            await VolumeManager.setVolume(previous, { showUI: false });
            lastVolumeRef.current = previous;
          } catch {
            lastVolumeRef.current = current;
          } finally {
            isRestoringRef.current = false;
          }
        });
      };

      setup();

      return () => {
        cancelled = true;
        subscription?.remove();
        VolumeManager.showNativeVolumeUI({ enabled: true });
      };
    }, [enabled]),
  );
};

export const VOLUME_BEAD_ANIM_MS = VOLUME_COUNT_INTERVAL_MS;
