import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../assets/color';
import { FONT, FONT_WEIGHT } from '../constants/typography';

const Theme = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Theme</Text>
      <Text style={styles.text}>Theme options will go here.</Text>
    </View>
  );
};

export default Theme;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: FONT.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
    marginBottom: 8,
  },
  text: {
    fontSize: FONT.body,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.primary,
    textAlign: 'center',
  },
});
