import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import { COLORS } from '../assets/color';

const TILE = 48;

const IslamicPatternBackground = () => {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <Pattern
          id="islamicStar"
          patternUnits="userSpaceOnUse"
          width={TILE}
          height={TILE}
        >
          <Path
            d={`M ${TILE / 2} 2 L ${TILE * 0.62} ${TILE * 0.38} L ${TILE - 2} ${TILE / 2} L ${TILE * 0.62} ${TILE * 0.62} L ${TILE / 2} ${TILE - 2} L ${TILE * 0.38} ${TILE * 0.62} L 2 ${TILE / 2} L ${TILE * 0.38} ${TILE * 0.38} Z`}
            fill={COLORS.primary}
            fillOpacity={0.045}
          />
          <Path
            d={`M ${TILE / 2} ${TILE * 0.28} L ${TILE * 0.56} ${TILE * 0.44} L ${TILE * 0.72} ${TILE / 2} L ${TILE * 0.56} ${TILE * 0.56} L ${TILE / 2} ${TILE * 0.72} L ${TILE * 0.44} ${TILE * 0.56} L ${TILE * 0.28} ${TILE / 2} L ${TILE * 0.44} ${TILE * 0.44} Z`}
            fill={COLORS.primary}
            fillOpacity={0.03}
          />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={COLORS.offWhite} />
      <Rect width="100%" height="100%" fill="url(#islamicStar)" />
    </Svg>
  );
};

export default IslamicPatternBackground;
