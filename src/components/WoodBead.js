import React, { memo } from 'react';
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
  Ellipse,
} from 'react-native-svg';

const WoodBead = memo(({ size = 38, id = '0' }) => {
  const r = size / 2;
  const baseId = `beadBase-${id}`;
  const shineId = `beadShine-${id}`;
  const veinId = `beadVein-${id}`;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id={baseId} cx="38%" cy="32%" rx="62%" ry="62%">
          <Stop offset="0%" stopColor="#7BC89A" />
          <Stop offset="28%" stopColor="#3D9B6C" />
          <Stop offset="55%" stopColor="#2A7A52" />
          <Stop offset="78%" stopColor="#1F6342" />
          <Stop offset="100%" stopColor="#134830" />
        </RadialGradient>
        <RadialGradient id={veinId} cx="62%" cy="68%" rx="45%" ry="45%">
          <Stop offset="0%" stopColor="#0F3D28" stopOpacity="0.45" />
          <Stop offset="100%" stopColor="#0F3D28" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id={shineId} cx="30%" cy="24%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.72" />
          <Stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.18" />
          <Stop offset="100%" stopColor="#000000" stopOpacity="0.28" />
        </RadialGradient>
      </Defs>
      <Circle cx={r} cy={r} r={r - 0.5} fill={`url(#${baseId})`} />
      <Ellipse
        cx={r * 0.62}
        cy={r * 0.68}
        rx={r * 0.34}
        ry={r * 0.24}
        fill={`url(#${veinId})`}
      />
      <Circle cx={r} cy={r} r={r - 0.5} fill={`url(#${shineId})`} />
    </Svg>
  );
});

export default WoodBead;
