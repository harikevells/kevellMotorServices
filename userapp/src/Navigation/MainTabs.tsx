import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomePage from '../AllPages/HomePage';
import BookingHistory from '../AllPages/YourOrderDetails'; 
import LiveTrackingPage from '../AllPages/LiveTrackingPage';
import NotificationPage from '../AllPages/NotificationPage';
import ProfilePage from '../AllPages/ProfilePage';
import Footer from './footer';

export type BottomTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Tracking: { bookingId?: string };
  Bell: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <Footer {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Home"
    >
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen name="Bookings" component={BookingHistory} />
      <Tab.Screen name="Tracking" component={LiveTrackingPage} />
      <Tab.Screen name="Bell" component={NotificationPage} />
      <Tab.Screen name="Profile" component={ProfilePage} />
    </Tab.Navigator>
  );
};

export default MainTabs;

