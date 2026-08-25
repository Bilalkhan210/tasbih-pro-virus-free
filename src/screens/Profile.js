import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../assets/color';

const Profile = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile Screen</Text>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  text: {
    fontSize: 16,
    color: COLORS.primary,
  },
});
