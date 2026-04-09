import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { EVCharging } from '../assets/EVIcons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ConfirmationRouteProp = RouteProp<RootStackParamList, 'BookingConfirmation'>;

const BookingConfirmationPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ConfirmationRouteProp>();
  const { bookingRef } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.content}>
        <View style={styles.successIconContainer}>
          <Text style={styles.successEmoji}>✅</Text>
        </View>
        
        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>Your EV service has been scheduled successfully.</Text>
        
        <View style={styles.refCard}>
          <Text style={styles.refLabel}>Booking Reference</Text>
          <Text style={styles.refValue}>{bookingRef}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>📍 Please arrive 10 minutes early at the service center.</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.trackButton}
            onPress={() => navigation.navigate('LiveTracking', { bookingId: 'mock-id' })}
          >
            <Text style={styles.trackButtonText}>Track Service</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => navigation.navigate('HomeTabs')}
          >
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  successEmoji: {
    fontSize: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  refCard: {
    backgroundColor: COLORS.background,
    padding: 20,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  refLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  refValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  infoBox: {
    backgroundColor: '#FFF9C4',
    padding: 15,
    borderRadius: 12,
    width: '100%',
    marginBottom: 40,
  },
  infoText: {
    fontSize: 14,
    color: '#F57F17',
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  trackButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  trackButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  homeButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  homeButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BookingConfirmationPage;
