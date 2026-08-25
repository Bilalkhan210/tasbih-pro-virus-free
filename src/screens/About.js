import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../assets/color';
import { FONT, FONT_WEIGHT } from '../constants/typography';

const About = () => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('about.title')}</Text>
      <Text style={styles.text}>{t('about.description')}</Text>
    </View>
  );
};

export default About;

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
