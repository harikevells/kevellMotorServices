/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from './src/OnboardingScreen';
import LoginScreen from './src/LoginScreen';
import RegistrationScreen from './src/RegistrationScreen';
import MainTabs from './src/Navigation/MainTabs';
import VehicleSelectionPage from './src/AllPages/VehicleSelectionPage';
import ServiceSelectionPage from './src/AllPages/ServiceSelectionPage';
import CenterSelectionPage from './src/AllPages/CenterSelectionPage';
import SlotBookingPage from './src/AllPages/SlotBookingPage';
import BookingSummaryPage from './src/AllPages/BookingSummaryPage';
import BookingConfirmationPage from './src/AllPages/BookingConfirmationPage';
import LiveTrackingPage from './src/AllPages/LiveTrackingPage';
import ReviewsRatingsPage from './src/AllPages/ReviewsAndRating';
import NotificationPage from './src/AllPages/NotificationPage';
import PaymentSimulationPage from './src/AllPages/PaymentSimulationPage';


export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Registration: undefined;
  HomeTabs: undefined;
  VehicleSelection: { category?: string };
  ServiceSelection: { vehicleId: string; category: string; fuel: string };

  CenterSelection: { serviceIds: string[]; vehicleId: string; category: string; fuel: string };
  SlotBooking: { centerId: string; serviceIds: string[]; vehicleId: string; category: string; fuel: string };

  BookingSummary: { centerId: string; serviceIds: string[]; slotDate: string; slotTime: string; vehicleId: string; category: string; fuel: string };

  BookingConfirmation: { bookingRef: string };
  LiveTracking: { bookingId: string };
  Reviews: { bookingId: string };
  Notifications: undefined;
  PaymentSimulation: { amount: number; bookingData: any };
  EditProfile: undefined;
  VendorDrawer: undefined;
};



const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Onboarding">
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Registration" component={RegistrationScreen} />
          <Stack.Screen name="HomeTabs" component={MainTabs} />
          <Stack.Screen name="VehicleSelection" component={VehicleSelectionPage} />
          <Stack.Screen name="ServiceSelection" component={ServiceSelectionPage} />
          <Stack.Screen name="CenterSelection" component={CenterSelectionPage} />
          <Stack.Screen name="SlotBooking" component={SlotBookingPage} />
          <Stack.Screen name="BookingSummary" component={BookingSummaryPage} />
          <Stack.Screen name="BookingConfirmation" component={BookingConfirmationPage} />
          <Stack.Screen name="LiveTracking" component={LiveTrackingPage} />
          <Stack.Screen name="Reviews" component={ReviewsRatingsPage} />
          <Stack.Screen name="Notifications" component={NotificationPage} />
          <Stack.Screen name="PaymentSimulation" component={PaymentSimulationPage} />
          <Stack.Screen name="EditProfile" component={require('./src/AllPages/EditProfilePage').default} />
          <Stack.Screen name="VendorDrawer" component={require('./src/VendorAllPages/VendorSidebarNavigator').default} />
        </Stack.Navigator>

      </NavigationContainer>
    </SafeAreaProvider>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
