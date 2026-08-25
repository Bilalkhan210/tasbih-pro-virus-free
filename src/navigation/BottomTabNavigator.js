import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/Home';
import Statistics from '../screens/Statistics';
import Tasbih from '../screens/Tasbih';
import CustomTabBar from '../components/CustomTabBar';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Tasbih" component={Tasbih} />
      <Tab.Screen name="Statistics" component={Statistics} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
