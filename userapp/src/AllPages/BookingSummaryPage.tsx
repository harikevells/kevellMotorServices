import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  PermissionsAndroid,
  Platform,
  Alert,
  ActivityIndicator,
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
  const { 
    centerId, serviceIds, serviceNames, slotDate, slotTime, vehicleId, 
    category, fuel, vehicleCategory,
    userName, userPhone, userAddress, latitude, longitude 
  } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'GPay' | 'Card'>('Cash');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // API expects "2 Wheeler" instead of "2_wheeler"
  const getApiVehicleCat = (cat: string) => {
    if (cat === '2_wheeler') return '2 Wheeler';
    if (cat === '4_wheeler') return '4 Wheeler';
    if (cat === 'heavy') return 'Heavy';
    return cat;
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Center
      const centerRes = await fetchCenterDetails(centerId);
      
      // 2. Fetch Services (and filter by selected IDs)
      const servicesRes = await fetchServices('', getApiVehicleCat(vehicleCategory), fuel); 
      const selectedServices = servicesRes.data.filter((s: any) => serviceIds.includes(s._id));
      
      // 3. Fetch Vehicle
      const vehiclesRes = await fetchUserVehicles();
      const selectedVehicle = vehiclesRes.data.find((v: any) => v._id === vehicleId);

      const subtotal = selectedServices.reduce((sum: number, s: any) => sum + (s.price || 0), 0);
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
        serviceNames: serviceNames,
        bookingDate: slotDate,
        timeSlot: slotTime,
        paymentMethod: paymentMethod,
        userName,
        userPhone,
        userAddress,
        latitude,
        longitude
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
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Customer</Text>
              <Text style={styles.infoValue}>{userName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{userPhone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={[styles.infoValue, { fontSize: 13 }]}>{userAddress}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Live Location</Text>
              <Text style={[styles.infoValue, { color: '#00d084' }]}>📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}</Text>
            </View>
          </View>
        </View>

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
                <Text style={styles.serviceName}>{service.serviceName}</Text>
                <Text style={styles.servicePrice}>₹{service.price}</Text>
              </View>
            ))}
            {serviceNames && serviceNames.length > 0 && serviceNames.map((name: string, index: number) => (
              <View key={`manual-${index}`} style={styles.serviceRow}>
                <Text style={styles.serviceName}>{name} (Manual)</Text>
                <Text style={styles.servicePrice}>₹0</Text>
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
    backgroundColor: '#060606',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#060606',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#f28b2c',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#060606',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
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
    fontWeight: '800',
    color: '#f28b2c',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#121212',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 15,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    fontWeight: '600',
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f28b2c',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f28b2c',
  },
  paymentSection: {
    marginBottom: 120,
  },
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 15,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f28b2c33',
  },
  paymentText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f28b2c',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#121212',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  confirmButton: {
    backgroundColor: '#f28b2c',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#f28b2c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#333333',
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 25,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  closeButton: {
    fontSize: 24,
    color: '#AAAAAA',
    padding: 5,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  selectedOption: {
    borderColor: '#f28b2c',
    backgroundColor: '#f28b2c15',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  optionSubLabel: {
    fontSize: 12,
    color: '#AAAAAA',
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
