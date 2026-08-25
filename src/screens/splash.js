import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../assets/color';
import { FONT, FONT_WEIGHT } from '../constants/typography';

const Splash = ({ navigation }) => {
  useEffect(() => {
    setTimeout(() => {
      navigation.replace('MainTabs');
    }, 2000);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Noor Tasbih</Text>
      {/* <ActivityIndicator size="large" color={COLORS.primary} /> */}
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  logo: {
    fontSize: FONT.xxl,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: 15,
    color: COLORS.primary,
  },
});
