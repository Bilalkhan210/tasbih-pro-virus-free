import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../assets/color';
import { FONT, FONT_WEIGHT } from '../constants/typography';
import { useAppDirection } from '../hooks/useAppDirection';
import SettingsSwitch from './SettingsSwitch';

export const SettingsSection = ({ title, children }) => {
  const { textStyle } = useAppDirection();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, textStyle]}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
};

export const SettingsToggleRow = ({
  icon,
  label,
  value,
  onValueChange,
  isLast = false,
}) => {
  const { rowDirection, isRTL, textStyle } = useAppDirection();

  return (
    <View
      style={[
        styles.row,
        { flexDirection: rowDirection },
        !isLast && styles.rowBorder,
      ]}
    >
      <Ionicons
        name={icon}
        size={22}
        color={COLORS.gray}
        style={[styles.icon, isRTL && styles.iconRtl]}
      />
      <Text style={[styles.label, textStyle]}>{label}</Text>
      <SettingsSwitch value={value} onValueChange={onValueChange} />
    </View>
  );
};

export const SettingsLinkRow = ({
  icon,
  label,
  value,
  onPress,
  isLast = false,
}) => {
  const { rowDirection, isRTL, textStyle } = useAppDirection();

  return (
    <TouchableOpacity
      style={[
        styles.row,
        { flexDirection: rowDirection },
        !isLast && styles.rowBorder,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={22}
        color={COLORS.gray}
        style={[styles.icon, isRTL && styles.iconRtl]}
      />
      <Text style={[styles.label, textStyle]}>{label}</Text>
      <Text style={[styles.linkValue, textStyle]}>{value}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: FONT.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.gray,
    marginBottom: 8,
    marginStart: 4,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  row: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  icon: {
    width: 28,
    marginEnd: 12,
  },
  iconRtl: {
    marginEnd: 0,
    marginStart: 12,
  },
  label: {
    flex: 1,
    fontSize: FONT.body,
    fontWeight: FONT_WEIGHT.medium,
    color: '#111111',
  },
  linkValue: {
    fontSize: FONT.body,
    fontWeight: FONT_WEIGHT.medium,
    color: '#6B7280',
  },
});
