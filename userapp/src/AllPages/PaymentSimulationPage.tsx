import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { COLORS, SHADOWS } from '../constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type PaymentRouteProp = RouteProp<RootStackParamList, 'PaymentSimulation'>;

const PaymentSimulationPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PaymentRouteProp>();
  const { amount, bookingData } = route.params;

  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      // Brief delay before confirmation
      setTimeout(() => {
        navigation.navigate('BookingConfirmation', { bookingRef: 'BK' + Math.floor(Math.random() * 1000000) });
      }, 1500);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Secure Payment</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Payable Amount</Text>
          <Text style={styles.amountValue}>₹{amount}</Text>
        </View>

        {!success ? (
          <>
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
            
            <TouchableOpacity style={styles.methodCard} onPress={handlePay} disabled={processing}>
              <Text style={styles.methodIcon}>💳</Text>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>Credit / Debit Card</Text>
                <Text style={styles.methodDesc}>Pay using any secure card</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.methodCard} onPress={handlePay} disabled={processing}>
              <Text style={styles.methodIcon}>📱</Text>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>UPI (GPay / PhonePe)</Text>
                <Text style={styles.methodDesc}>Instant payment via UPI apps</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.methodCard} onPress={handlePay} disabled={processing}>
              <Text style={styles.methodIcon}>💵</Text>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>Cash at Center</Text>
                <Text style={styles.methodDesc}>Pay after service completion</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            {processing && (
              <View style={styles.overlay}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.processingText}>Processing secure payment...</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.successContainer}>
            <View style={styles.successCircle}>
              <Text style={styles.successCheck}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSubtitle}>Redirecting to confirmation...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    ...SHADOWS.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  amountCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
    ...SHADOWS.medium,
  },
  amountLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 5,
  },
  amountValue: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 15,
    marginLeft: 5,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 18,
    marginBottom: 12,
    ...SHADOWS.light,
  },
  methodIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  methodDesc: {
    fontSize: 12,
    color: COLORS.grey,
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: COLORS.grey,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  processingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successCheck: {
    color: COLORS.white,
    fontSize: 50,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 14,
    color: COLORS.grey,
  },
});

export default PaymentSimulationPage;
