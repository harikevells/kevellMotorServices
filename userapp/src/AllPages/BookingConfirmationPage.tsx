import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ConfirmationRouteProp = RouteProp<RootStackParamList, 'BookingConfirmation'>;

const BookingConfirmationPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ConfirmationRouteProp>();
  const { bookingRef } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.content}>
        <View style={styles.successIconContainer}>
          <Text style={styles.checkIcon}>✔</Text>
        </View>

        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>Your Ev service has been scheduled</Text>

        <View style={styles.refCard}>
          <Text style={styles.refLabel}>Booking Id</Text>
          <Text style={styles.refValue}>{bookingRef}</Text>

          <View style={styles.reminderRow}>
            <View style={styles.infoCircle}>
              <Text style={styles.infoIcon}>i</Text>
            </View>
            <Text style={styles.reminderTitle}>IMPORTANT REMINDER</Text>
          </View>

          <Text style={styles.reminderDesc}>
            Please arrive 10 minutes early at the service center to complete initial inspection.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => navigation.navigate('LiveTracking', { bookingId: bookingRef })}
        >
          <Text style={styles.trackButtonText}>Track service</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('HomeTabs')}
        >
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 80,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5A623',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkIcon: {
    fontSize: 60,
    color: '#000000',
    fontWeight: '900',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F5A623',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 40,
  },
  refCard: {
    backgroundColor: '#1A1A1A',
    padding: 30,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  refLabel: {
    fontSize: 12,
    color: '#AAAAAA',
    marginBottom: 8,
  },
  refValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F5A623',
    letterSpacing: 1,
    marginBottom: 35,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoIcon: {
    fontSize: 14,
    color: '#000000',
    fontWeight: 'bold',
  },
  reminderTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  reminderDesc: {
    color: '#F5A623',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  footer: {
    padding: 30,
    paddingBottom: 50,
  },
  trackButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  trackButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  homeButton: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: '#F5A623',
  },
  homeButtonText: {
    color: '#F5A623',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BookingConfirmationPage;
