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
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { COLORS, SHADOWS } from '../constants/theme';
import { createRazorpayOrder, verifyRazorpayPayment } from '../services/api';

import RazorpayCheckout from 'react-native-razorpay';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type PaymentRouteProp = RouteProp<RootStackParamList, 'PaymentSimulation'>;

const PaymentSimulationPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PaymentRouteProp>();
  const { amount, bookingData } = route.params;

  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePay = async (methodName: string) => {
    setProcessing(true);
    try {
      console.log('Creating Razorpay order on backend for booking:', bookingData?._id);
      const orderRes: any = await createRazorpayOrder(bookingData?._id);
      
      if (!orderRes || !orderRes.success || !orderRes.razorpayOrder) {
        throw new Error('Failed to initiate Razorpay order on backend.');
      }
      
      const razorpayOrderId = orderRes.razorpayOrder.id;
      console.log('Razorpay Order Created:', razorpayOrderId);

      const options = {
        description: 'Payment for EV Service Booking',
        image: 'https://i.imgur.com/3g7nmJC.png', // Optional Kevell Logo
        currency: 'INR',
        key: 'rzp_test_SfkV0cySd3CwyQ', // Embedded Test Key requested by USER
        amount: orderRes.razorpayOrder.amount, // amount in paise
        name: 'Kevell Motor Services',
        order_id: razorpayOrderId,
        theme: { color: COLORS.primary },
        prefill: {
          email: bookingData?.user?.email || 'test@example.com',
          contact: bookingData?.userDetails?.phone || '9999999999',
          name: bookingData?.userDetails?.name || 'Customer'
        }
      };

      RazorpayCheckout.open(options).then(async (data: any) => {
        // Success callback from Razorpay
        console.log('Razorpay Payment Success:', data.razorpay_payment_id);
        try {
          const verifyRes: any = await verifyRazorpayPayment({
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_signature: data.razorpay_signature,
            orderId: bookingData?._id
          });

          if (verifyRes && verifyRes.success) {
            setSuccess(true);
            setTimeout(() => {
              navigation.navigate('BookingConfirmation', { bookingRef: bookingData?.bookingRef });
            }, 1500);
          } else {
            throw new Error(verifyRes?.message || 'Payment signature verification failed.');
          }
        } catch (verifyErr: any) {
          Alert.alert('Verification Error', verifyErr.toString());
          setProcessing(false);
        }
      }).catch((error: any) => {
        // Error / Cancel callback from Razorpay
        console.error('Razorpay Checkout Error:', error);
        Alert.alert('Payment Failed or Cancelled', `Code: ${error.code} | Description: ${error.description}`);
        setProcessing(false);
      });
      
    } catch (error: any) {
      console.error('Payment Flow Error:', error);
      Alert.alert('Payment Initialization Failed', error.toString() || 'Something went wrong while starting payment.');
      setProcessing(false);
    }
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
            <TouchableOpacity style={styles.razorpayButton} onPress={() => handlePay('Razorpay')} disabled={processing}>
              <Text style={styles.razorpayButtonText}>Open Razorpay Checkout</Text>
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
  razorpayButton: {
    backgroundColor: '#3399cc',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
    ...SHADOWS.medium,
  },
  razorpayButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
