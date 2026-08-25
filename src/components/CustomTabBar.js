import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../assets/color';
import AdBanner from './AdBanner';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Scaled down dimensions
const HORIZONTAL_MARGIN = 20; // Decreased margin for a longer bar
const TAB_HEIGHT = 54;
const TAB_RADIUS = 27;
const BAR_WIDTH = SCREEN_WIDTH - HORIZONTAL_MARGIN * 2;
const FAB_SIZE = 50;
const NOTCH_WIDTH = 84;
const DIP_DEPTH = 28;

const createTabBarPath = (width, height, radius, notchWidth, dipDepth) => {
  const centerX = width / 2;
  const notchRadius = notchWidth / 2;

  return `
    M ${radius} 0
    L ${centerX - notchRadius} 0
    C ${centerX - notchRadius + 12} 0, ${centerX - notchRadius + 8} ${dipDepth}, ${centerX} ${dipDepth}
    S ${centerX + notchRadius - 12} 0, ${centerX + notchRadius} 0
    L ${width - radius} 0
    Q ${width} 0 ${width} ${radius}
    L ${width} ${height - radius}
    Q ${width} ${height} ${width - radius} ${height}
    L ${radius} ${height}
    Q 0 ${height} 0 ${height - radius}
    L 0 ${radius}
    Q 0 0 ${radius} 0
    Z
  `;
};

const TAB_BAR_PATH = createTabBarPath(
  BAR_WIDTH,
  TAB_HEIGHT,
  TAB_RADIUS,
  NOTCH_WIDTH,
  DIP_DEPTH,
);

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const getRoute = (name) => state.routes.find((route) => route.name === name);

  const handlePress = (route, isFocused) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const renderSideTab = (routeName, focusedIcon, outlineIcon) => {
    const route = getRoute(routeName);
    if (!route) {
      return null;
    }

    const isFocused = state.index === state.routes.indexOf(route);

    return (
      <TouchableOpacity
        key={route.key}
        onPress={() => handlePress(route, isFocused)}
        style={styles.sideTab}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isFocused ? focusedIcon : outlineIcon}
          size={24}
          color={COLORS.primary}
          style={!isFocused && styles.inactiveIcon}
        />
      </TouchableOpacity>
    );
  };

  const tasbihRoute = getRoute('Tasbih');
  const isTasbihFocused =
    tasbihRoute && state.index === state.routes.indexOf(tasbihRoute);

  return (
    <View style={[styles.tabContainer, { bottom: Math.max(insets.bottom, 20) }]} pointerEvents="box-none">
      <AdBanner style={styles.adBanner} />
      <View style={styles.barWrapper} pointerEvents="box-none">
        {/* Icons must live inside the elevated bar; Android elevation can hide sibling views. */}
        <View style={styles.barShadow}>
          <Svg
            width={BAR_WIDTH}
            height={TAB_HEIGHT}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            <Path d={TAB_BAR_PATH} fill={COLORS.white} />
          </Svg>

          <View style={styles.tabsRow} pointerEvents="box-none">
            {renderSideTab('Home', 'home', 'home-outline')}
            <View style={styles.centerSpacer} />
            {renderSideTab('Statistics', 'pie-chart', 'pie-chart-outline')}
          </View>
        </View>

        {tasbihRoute && (
          <TouchableOpacity
            onPress={() => handlePress(tasbihRoute, isTasbihFocused)}
            style={styles.centerButton}
            activeOpacity={0.9}
          >
            <Ionicons name="add" size={30} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  adBanner: {
    marginBottom: 12,
    width: SCREEN_WIDTH,
    alignItems: 'center',
  },
  barWrapper: {
    width: BAR_WIDTH,
    height: TAB_HEIGHT + FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barShadow: {
    position: 'absolute',
    bottom: 0,
    width: BAR_WIDTH,
    height: TAB_HEIGHT,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabsRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  sideTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  centerSpacer: {
    width: NOTCH_WIDTH - 20,
  },
  inactiveIcon: {
    opacity: 0.4,
  },
  centerButton: {
    position: 'absolute',
    bottom: 24, // Adjusted for smaller dimensions
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        // Above the bar so the FAB is never covered by bar elevation.
        elevation: 12,
      },
    }),
  },
});

export default CustomTabBar;
