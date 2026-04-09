import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { fetchCenterDetails, fetchServices, createBooking, fetchUserVehicles } from '../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type SummaryRouteProp = RouteProp<RootStackParamList, 'BookingSummary'>;

const BookingSummaryPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SummaryRouteProp>();
  const { centerId, serviceIds, slotDate, slotTime, vehicleId, category, fuel } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'GPay' | 'Card'>('Cash');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Center
      const centerRes = await fetchCenterDetails(centerId);
      
      // 2. Fetch Services (and filter by selected IDs)
      const servicesRes = await fetchServices('', fuel); 
      const selectedServices = servicesRes.data.filter((s: any) => serviceIds.includes(s._id));
      
      // 3. Fetch Vehicle
      const vehiclesRes = await fetchUserVehicles();
      const selectedVehicle = vehiclesRes.data.find((v: any) => v._id === vehicleId);

      const subtotal = selectedServices.reduce((sum: number, s: any) => sum + s.base_price, 0);
      const tax = Math.round(subtotal * 0.18 * 100) / 100;

      setSummaryData({
        vehicle: selectedVehicle,
        center: centerRes.data,
        services: selectedServices,
        subtotal,
        tax,
        total: subtotal + tax,
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load booking summary.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    try {
      setSubmitting(true);
      const res = await createBooking({
        vehicle: vehicleId,
        center: centerId,
        services: serviceIds,
        bookingDate: slotDate,
        timeSlot: slotTime,
        paymentMethod: paymentMethod,
      });
      
      if (paymentMethod === 'Cash') {
        navigation.navigate('BookingConfirmation', { bookingRef: res.data.bookingRef });
      } else {
        navigation.navigate('PaymentSimulation', { 
          amount: summaryData.total, 
          bookingData: res.data 
        });
      }
    } catch (error: any) {
      Alert.alert('Booking Failed', error.toString());
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !summaryData) return (
    <View style={styles.loadingContainer}>
       <ActivityIndicator size="large" color={COLORS.primary} />
       <Text style={styles.loadingText}>Preparing your summary...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle & Center</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vehicle</Text>
              <Text style={styles.infoValue}>{summaryData.vehicle.brand} {summaryData.vehicle.model}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reg No</Text>
              <Text style={styles.infoValue}>{summaryData.vehicle.registration_no}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Center</Text>
              <Text style={styles.infoValue}>{summaryData.center.center_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={[styles.infoValue, { fontSize: 12 }]}>{summaryData.center.address}, {summaryData.center.city}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{new Date(slotDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Time Slot</Text>
              <Text style={styles.infoValue}>{slotTime}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services Selected</Text>
          <View style={styles.card}>
            {summaryData.services.map((service: any, index: number) => (
              <View key={index} style={styles.serviceRow}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.servicePrice}>₹{service.base_price}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>₹{summaryData.subtotal}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>GST (18%)</Text>
              <Text style={styles.priceValue}>₹{summaryData.tax}</Text>
            </View>
            <View style={[styles.priceRow, { marginTop: 10 }]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{summaryData.total}</Text>
            </View>
          </View>
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity 
            style={styles.paymentCard}
            onPress={() => setShowPaymentModal(true)}
          >
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentIcon}>
                {paymentMethod === 'Cash' ? '💵' : paymentMethod === 'GPay' ? '📱' : '💳'}
              </Text>
              <Text style={styles.paymentText}>
                {paymentMethod === 'Cash' ? 'Pay at Center (Cash)' : 
                 paymentMethod === 'GPay' ? 'Google Pay (UPI)' : 'Credit / Debit Card'}
              </Text>
            </View>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method Modal */}
        <Modal
          visible={showPaymentModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPaymentModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Payment Method</Text>
                <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.optionItem, paymentMethod === 'Cash' && styles.selectedOption]}
                onPress={() => { setPaymentMethod('Cash'); setShowPaymentModal(false); }}
              >
                <Text style={styles.optionIcon}>💵</Text>
                <View>
                  <Text style={styles.optionLabel}>Pay at Center (Cash)</Text>
                  <Text style={styles.optionSubLabel}>Pay after service completion</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.optionItem, paymentMethod === 'GPay' && styles.selectedOption]}
                onPress={() => { setPaymentMethod('GPay'); setShowPaymentModal(false); }}
              >
                <Text style={styles.optionIcon}>📱</Text>
                <View>
                  <Text style={styles.optionLabel}>Google Pay (UPI)</Text>
                  <Text style={styles.optionSubLabel}>Fast and secure UPI payment</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.optionItem, paymentMethod === 'Card' && styles.selectedOption]}
                onPress={() => { setPaymentMethod('Card'); setShowPaymentModal(false); }}
              >
                <Text style={styles.optionIcon}>💳</Text>
                <View>
                  <Text style={styles.optionLabel}>Credit / Debit Card</Text>
                  <Text style={styles.optionSubLabel}>Visa, Mastercard, RuPay</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.confirmButton, submitting && styles.disabledButton]} 
          onPress={handleConfirmBooking}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.light,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGrey,
    marginVertical: 15,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  paymentSection: {
    marginBottom: 120,
  },
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 18,
    ...SHADOWS.light,
  },
  paymentText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    ...SHADOWS.medium,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.grey,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.textSecondary,
    padding: 5,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 15,
    backgroundColor: COLORS.background,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  optionSubLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    fontSize: 20,
    marginRight: 12,
  },
});

export default BookingSummaryPage;
