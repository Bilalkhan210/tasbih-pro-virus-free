import React, { memo, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';
import WoodBead from './WoodBead';
import { COLORS } from '../assets/color';
import {
  BEAD_ROLE_COUNT,
  MAX_PATH_POSITION,
  createTasbihCurve,
  getQuadraticPathD,
} from '../utils/bezierPath';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THREAD_WIDTH = SCREEN_WIDTH - 12;
const THREAD_HEIGHT = 200;
const BEAD_SIZE = 40;
const ENTRY_OFFSET = 0.35;
const EXIT_TRAVEL = 1.0;

const stepToT = (step, leftBeadT, rightBeadT, gapTMid) => {
  'worklet';
  if (step <= 3) {
    return leftBeadT[step];
  }
  if (step >= 5 && step <= 8) {
    return rightBeadT[step - 5];
  }
  return gapTMid;
};

const positionToT = (pos, leftBeadT, rightBeadT, gapTMid, entryT, exitT) => {
  'worklet';
  if (pos <= 0) {
    const startT = leftBeadT[0];
    return entryT + (pos / ENTRY_OFFSET) * (startT - entryT);
  }
  if (pos >= MAX_PATH_POSITION) {
    if (pos <= MAX_PATH_POSITION + EXIT_TRAVEL) {
      const exitFrac = (pos - MAX_PATH_POSITION) / EXIT_TRAVEL;
      const t0 = stepToT(MAX_PATH_POSITION, leftBeadT, rightBeadT, gapTMid);
      return t0 * (1 - exitFrac) + exitT * exitFrac;
    }
    return exitT;
  }
  if (pos < 3) {
    const lo = Math.floor(pos);
    const frac = pos - lo;
    const t0 = stepToT(lo, leftBeadT, rightBeadT, gapTMid);
    const t1 = stepToT(lo + 1, leftBeadT, rightBeadT, gapTMid);
    return t0 * (1 - frac) + t1 * frac;
  }
  if (pos < 5) {
    const gapFrac = (pos - 3) / 2;
    if (gapFrac < 0.5) {
      const f = gapFrac / 0.5;
      const fromT = stepToT(3, leftBeadT, rightBeadT, gapTMid);
      return fromT * (1 - f) + gapTMid * f;
    }
    const f = (gapFrac - 0.5) / 0.5;
    const toT = stepToT(5, leftBeadT, rightBeadT, gapTMid);
    return gapTMid * (1 - f) + toT * f;
  }
  const lo = Math.floor(pos);
  const frac = pos - lo;
  const t0 = stepToT(lo, leftBeadT, rightBeadT, gapTMid);
  const t1 = stepToT(
    Math.min(lo + 1, MAX_PATH_POSITION),
    leftBeadT,
    rightBeadT,
    gapTMid,
  );
  return t0 * (1 - frac) + t1 * frac;
};

// 0 → 1 while a count animates. At rest after a count, hold 1 (bead exited).
const getCycleFrac = (progress) => {
  'worklet';
  const count = Math.floor(progress + 1e-5);
  const raw = progress - count;
  if (raw < 0.001) {
    return count === 0 ? 0 : 1;
  }
  return raw;
};

const getRolePathPosition = (role, cycleFrac) => {
  'worklet';

  if (role === 0) {
    return -ENTRY_OFFSET + cycleFrac * ENTRY_OFFSET;
  }
  if (role === 1) {
    return cycleFrac;
  }
  if (role === 2) {
    return 1 + cycleFrac;
  }
  if (role === 3) {
    return 2 + cycleFrac;
  }
  if (role === 4) {
    return 3 + cycleFrac * 2;
  }
  if (role === 5) {
    return 5 + cycleFrac;
  }
  if (role === 6) {
    return 6 + cycleFrac;
  }
  if (role === 7) {
    return 7 + cycleFrac;
  }
  // Last bead: slides off the right from the first frame of the cycle.
  return MAX_PATH_POSITION + cycleFrac * EXIT_TRAVEL;
};

const isRoleVisible = (role, pathPos, cycleFrac) => {
  'worklet';
  if (role === 0 && cycleFrac <= 0.02) {
    return false;
  }
  if (role === 8) {
    if (pathPos < 5) {
      return false;
    }
    if (pathPos > MAX_PATH_POSITION + EXIT_TRAVEL * 0.72) {
      return false;
    }
    return true;
  }
  if (pathPos < -0.15) {
    return false;
  }
  return pathPos <= MAX_PATH_POSITION + 0.15;
};

const getQuadraticPoint = (t, p0, p1, p2) => {
  'worklet';
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
};

const BeadOnThread = memo(({
  role,
  progress,
  p0,
  p1,
  p2,
  leftBeadT,
  rightBeadT,
  gapTMid,
  entryT,
  exitT,
  id,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const cycleFrac = getCycleFrac(progress.value);
    const pathPos = getRolePathPosition(role, cycleFrac);
    const visible = isRoleVisible(role, pathPos, cycleFrac);
    const t = positionToT(
      pathPos,
      leftBeadT,
      rightBeadT,
      gapTMid,
      entryT,
      exitT,
    );
    const point = getQuadraticPoint(t, p0, p1, p2);

    return {
      position: 'absolute',
      left: point.x - BEAD_SIZE / 2,
      top: point.y - BEAD_SIZE / 2,
      width: BEAD_SIZE,
      height: BEAD_SIZE,
      opacity:
        visible && role === 8 && cycleFrac > 0.65
          ? Math.max(0, 1 - (cycleFrac - 0.65) / 0.35)
          : visible
            ? 1
            : 0,
    };
  });

  return (
    <Reanimated.View style={animatedStyle}>
      <WoodBead size={BEAD_SIZE} id={id} />
    </Reanimated.View>
  );
});

const TasbihThread = ({ progress }) => {
  const curve = useMemo(
    () => createTasbihCurve(THREAD_WIDTH, THREAD_HEIGHT),
    [],
  );
  const {
    p0,
    p1,
    p2,
    leftBeadT,
    rightBeadT,
    gapTMid,
    entryT,
    exitT,
  } = curve;
  const pathD = useMemo(() => getQuadraticPathD(p0, p1, p2), [p0, p1, p2]);
  const beadRoles = useMemo(
    () => Array.from({ length: BEAD_ROLE_COUNT }, (_, index) => index),
    [],
  );

  return (
    <View style={styles.container}>
      <Svg width={THREAD_WIDTH} height={THREAD_HEIGHT} style={styles.svg}>
        <Path
          d={pathD}
          stroke={COLORS.thread}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>

      <View style={styles.beadLayer} pointerEvents="none">
        {beadRoles.map((role) => (
          <BeadOnThread
            key={role}
            id={String(role)}
            role={role}
            progress={progress}
            p0={p0}
            p1={p1}
            p2={p2}
            leftBeadT={leftBeadT}
            rightBeadT={rightBeadT}
            gapTMid={gapTMid}
            entryT={entryT}
            exitT={exitT}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: THREAD_WIDTH + BEAD_SIZE,
    height: THREAD_HEIGHT,
    alignSelf: 'center',
    marginTop: 8,
    zIndex: 2,
    overflow: 'visible',
    direction: 'ltr',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: BEAD_SIZE / 2,
  },
  beadLayer: {
    position: 'absolute',
    top: 0,
    left: BEAD_SIZE / 2,
    width: THREAD_WIDTH,
    height: THREAD_HEIGHT,
    overflow: 'visible',
  },
});

export default memo(TasbihThread);
