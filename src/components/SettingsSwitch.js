import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import { COLORS } from '../assets/color';

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 30;
const THUMB_SIZE = 24;
const THUMB_PADDING = 3;

export const SettingsSwitch = ({ value, onValueChange }) => {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [anim, value]);

  const thumbLeft = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [THUMB_PADDING, TRACK_WIDTH - THUMB_SIZE - THUMB_PADDING],
  });

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={[styles.track, value ? styles.trackOn : styles.trackOff]}
    >
      <View style={styles.symbolSlot} pointerEvents="none">
        {value ? (
          <View style={styles.onSymbol} />
        ) : (
          <View style={styles.offSymbol} />
        )}
      </View>

      <Animated.View style={[styles.thumb, { left: thumbLeft }]} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: '#589F7D',
  },
  trackOff: {
    backgroundColor: '#D9D9D9',
  },
  symbolSlot: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onSymbol: {
    position: 'absolute',
    left: 11,
    width: 2,
    height: 11,
    borderRadius: 1,
    backgroundColor: COLORS.white,
  },
  offSymbol: {
    position: 'absolute',
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#B8B8B8',
    backgroundColor: 'transparent',
  },
  thumb: {
    position: 'absolute',
    top: THUMB_PADDING,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});

export default SettingsSwitch;
