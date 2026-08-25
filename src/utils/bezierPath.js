'use strict';

// Reference layout: 4 beads left, 4 beads right, empty gap in center at rest.
export const LEFT_BEAD_COUNT = 4;
export const RIGHT_BEAD_COUNT = 4;
export const BEAD_ROLE_COUNT = 9;
export const MAX_PATH_POSITION = 8;

const LEFT_T_START = 0.02;
const LEFT_T_END = 0.3;
const GAP_T_START = 0.3;
const GAP_T_END = 0.64;
const RIGHT_T_START = 0.64;
const RIGHT_T_END = 0.98;
const GAP_T_MID = (GAP_T_START + GAP_T_END) / 2;

export const getQuadraticPathD = (p0, p1, p2) =>
  `M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`;

function quadPoint(t, p0, p1, p2) {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

function segmentArcLength(p0, p1, p2, tStart, tEnd, steps = 48) {
  let length = 0;
  let prev = quadPoint(tStart, p0, p1, p2);
  for (let i = 1; i <= steps; i += 1) {
    const t = tStart + ((tEnd - tStart) * i) / steps;
    const point = quadPoint(t, p0, p1, p2);
    length += Math.hypot(point.x - prev.x, point.y - prev.y);
    prev = point;
  }
  return length;
}

function tAtArcDistance(p0, p1, p2, tStart, tEnd, distance, steps = 96) {
  if (distance === 0) {
    return tStart;
  }

  if (distance < 0) {
    let accumulated = 0;
    let prev = quadPoint(tStart, p0, p1, p2);
    let prevT = tStart;
    const backwardEnd = Math.max(0, tStart - (tEnd - tStart));
    for (let i = 1; i <= steps; i += 1) {
      const t = tStart - ((tStart - backwardEnd) * i) / steps;
      const point = quadPoint(t, p0, p1, p2);
      const segment = Math.hypot(point.x - prev.x, point.y - prev.y);
      if (accumulated + segment >= Math.abs(distance)) {
        const ratio = segment > 0 ? (Math.abs(distance) - accumulated) / segment : 0;
        return prevT + (t - prevT) * ratio;
      }
      accumulated += segment;
      prev = point;
      prevT = t;
    }
    return backwardEnd;
  }

  let accumulated = 0;
  let prev = quadPoint(tStart, p0, p1, p2);
  let prevT = tStart;
  for (let i = 1; i <= steps; i += 1) {
    const t = tStart + ((tEnd - tStart) * i) / steps;
    const point = quadPoint(t, p0, p1, p2);
    const segment = Math.hypot(point.x - prev.x, point.y - prev.y);
    if (accumulated + segment >= distance) {
      const ratio = segment > 0 ? (distance - accumulated) / segment : 0;
      return prevT + (t - prevT) * ratio;
    }
    accumulated += segment;
    prev = point;
    prevT = t;
  }
  return tEnd;
}

function buildBeadLayout(p0, p1, p2) {
  const leftLength = segmentArcLength(p0, p1, p2, LEFT_T_START, LEFT_T_END);
  const rightLength = segmentArcLength(p0, p1, p2, RIGHT_T_START, RIGHT_T_END);

  const leftBeadT = Array.from({ length: LEFT_BEAD_COUNT }, (_, index) =>
    tAtArcDistance(
      p0,
      p1,
      p2,
      LEFT_T_START,
      LEFT_T_END,
      (index * leftLength) / (LEFT_BEAD_COUNT - 1),
    ),
  );

  const rightBeadT = Array.from({ length: RIGHT_BEAD_COUNT }, (_, index) =>
    tAtArcDistance(
      p0,
      p1,
      p2,
      RIGHT_T_START,
      RIGHT_T_END,
      (index * rightLength) / (RIGHT_BEAD_COUNT - 1),
    ),
  );

  const beadGap = Math.min(
    leftLength / (LEFT_BEAD_COUNT - 1),
    rightLength / (RIGHT_BEAD_COUNT - 1),
  );

  const entryT = tAtArcDistance(
    p0,
    p1,
    p2,
    LEFT_T_START,
    LEFT_T_END,
    -beadGap * 0.55,
  );

  const exitT = tAtArcDistance(
    p0,
    p1,
    p2,
    RIGHT_T_START,
    RIGHT_T_END,
    rightLength + beadGap * 1.1,
  );

  return {
    leftBeadT,
    rightBeadT,
    gapTMid: GAP_T_MID,
    entryT,
    exitT,
    beadGap,
  };
}

export const createTasbihCurve = (width, height) => {
  const p0 = { x: width * 0.005, y: height * 0.78 };
  const p1 = { x: width * 0.5, y: height * 0.12 };
  const p2 = { x: width * 0.995, y: height * 0.2 };
  const layout = buildBeadLayout(p0, p1, p2);
  return { p0, p1, p2, ...layout };
};

export const getQuadraticPoint = (t, p0, p1, p2) =>
  quadPoint(t, p0, p1, p2);

function stepToT(step, leftBeadT, rightBeadT, gapTMid) {
  if (step <= 3) {
    return leftBeadT[step];
  }
  if (step >= 5 && step <= 8) {
    return rightBeadT[step - 5];
  }
  return gapTMid;
}

export function computePositionToT(pos, layout) {
  const { leftBeadT, rightBeadT, gapTMid, entryT, exitT } = layout;

  if (pos <= 0) {
    const startT = leftBeadT[0];
    return entryT + (pos / 0.35) * (startT - entryT);
  }
  if (pos >= MAX_PATH_POSITION) {
    if (pos <= MAX_PATH_POSITION + 0.5) {
      const frac = (pos - MAX_PATH_POSITION) / 0.5;
      const t0 = stepToT(MAX_PATH_POSITION, leftBeadT, rightBeadT, gapTMid);
      return t0 * (1 - frac) + exitT * frac;
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
}
