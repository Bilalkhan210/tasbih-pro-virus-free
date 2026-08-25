import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Splash from '../screens/splash';
import BottomTabNavigator from './BottomTabNavigator';
import Settings from '../screens/Settings';
import Theme from '../screens/Theme';
import ChangeLanguage from '../screens/ChangeLanguage';
import About from '../screens/About';

const Stack = createNativeStackNavigator();

const RootStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="Theme" component={Theme} />
      <Stack.Screen name="ChangeLanguage" component={ChangeLanguage} />
      <Stack.Screen name="About" component={About} />
    </Stack.Navigator>
  );
};

export default RootStack;
