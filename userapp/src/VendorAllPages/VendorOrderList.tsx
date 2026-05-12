import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  StatusBar,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { pick, isCancel, types } from '@react-native-documents/picker';
import { useNavigation } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import { COLORS, SHADOWS } from '../constants/theme';
import { fetchVendorOrders, updateOrderStatus, uploadBookingBill, updateOrderPaymentStatus } from '../services/api';
import { startVendorBackgroundLocation } from '../services/backgroundLocation';

const STAGES = [
  { id: 'pending', label: 'Booking Pending', icon: '⏳', desc: 'Awaiting confirmation' },
  { id: 'confirmed', label: 'Booking Confirmed', icon: '📝', desc: 'Confirm availability' },
  { id: 'on_the_way', label: 'On The Way', icon: '🛵', desc: 'Pickup in progress' },
  { id: 'received', label: 'Vehicle Received', icon: '📥', desc: 'Arrived at shop' },
  { id: 'inspected', label: 'Inspected', icon: '🔍', desc: 'Inspection complete' },
  { id: 'in_service', label: 'In Service', icon: '🛠️', desc: 'Servicing started' },
  { id: 'quality_check', label: 'Quality Check', icon: '✅', desc: 'Final testing' },
  { id: 'ready', label: 'Ready', icon: '🎁', desc: 'Ready for delivery' },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: '🚀', desc: 'Delivery in progress' },
  { id: 'delivered', label: 'Delivered', icon: '🏁', desc: 'Service completed' },
  { id: 'cancelled', label: 'Cancelled', icon: '❌', desc: 'Order rejected' },
];

const VendorOrderList = () => {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled'>('Pending');
  const [uploading, setUploading] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  const handleUpdatePaymentStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    try {
      setUpdatingPayment(true);
      const res: any = await updateOrderPaymentStatus(selectedOrder._id, newStatus);
      if (res.success) {
        Alert.alert('Success', 'Payment status updated successfully');
        setSelectedOrder({ ...selectedOrder, paymentStatus: newStatus });
        // Update in list
        setOrders(orders.map(o => o._id === selectedOrder._id ? { ...o, paymentStatus: newStatus } : o));
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update payment status');
    } finally {
      setUpdatingPayment(false);
      setShowPaymentPicker(false);
    }
  };

  const PaymentStatusModal = () => (
    <Modal
      visible={showPaymentPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPaymentPicker(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowPaymentPicker(false)}
      >
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Update Payment Status</Text>
          {['pending', 'completed', 'Not Received'].map((status) => (
            <TouchableOpacity
              key={status}
              style={styles.pickerItem}
              onPress={() => handleUpdatePaymentStatus(status)}
            >
              <Text style={[
                styles.pickerItemText, 
                selectedOrder?.paymentStatus === status && { color: COLORS.primary, fontWeight: 'bold' }
              ]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await fetchVendorOrders();
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (e) {
      console.warn(e);
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      setShowStatusModal(false);
      setUpdatingId(orderId);
      const res = await updateOrderStatus(orderId, status);
      if (res.success) {
        // Update local state
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
      } else {
        Alert.alert('Error', res.message || 'Failed to update status');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setUpdatingId(orderId);
      
      // 1. Request location permission first
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "App needs access to your location for live tracking.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log("Location permission denied");
          Alert.alert("Permission Denied", "Location permission is required to accept orders.");
          setUpdatingId(null);
          return;
        }
      }

      // 2. Fetch location
      const position = await new Promise<any>((resolve, reject) => {
        Geolocation.getCurrentPosition(resolve, reject, { 
          enableHighAccuracy: true, 
          timeout: 15000, 
          maximumAge: 10000 
        });
      });

      const { latitude, longitude } = position.coords;

      // 3. Wait 3 seconds
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 4. Update status with location
      const res = await updateOrderStatus(orderId, 'confirmed', { latitude, longitude });
      
      if (!res.success) {
        Alert.alert('Error', res.message || 'Failed to accept order');
        setUpdatingId(null);
        return;
      }
      
      // 5. Update UI
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'confirmed' } : o));
      console.log('[VendorOrderList] starting background tracking for order:', orderId);
      const started = await startVendorBackgroundLocation(orderId);
      console.log('[VendorOrderList] background tracking start result:', started);
      if (!started) {
        Alert.alert('Warning', 'Order confirmed, but background location could not start. Please open the live tracking screen to continue sharing location.');
      } else {
        Alert.alert('Success', 'Booking confirmed and background tracking started.');
      }

    } catch (error: any) {
      console.error('[VendorOrderList] failed to confirm order or start background tracking:', error);
      Alert.alert('Error', error.message || 'Could not fetch location or update order');
    } finally {
      setUpdatingId(null);
    }
  };

  const getFilteredOrders = () => {
    switch (selectedTab) {
      case 'Pending':
        return orders.filter(o => o.status === 'pending');
      case 'Confirmed':
        // Show everything that isn't Pending, Delivered, or Cancelled (All active workshop stages)
        return orders.filter(o => !['pending', 'delivered', 'completed', 'cancelled'].includes(o.status));
      case 'Delivered':
        return orders.filter(o => ['delivered', 'completed'].includes(o.status));
      case 'Cancelled':
        return orders.filter(o => o.status === 'cancelled');
      default:
        return orders;
    }
  };

  const handleUploadBill = async () => {
    if (!selectedOrder || uploading) return;

    try {
      console.log('Opening document picker...');
      const results = await pick({
        type: [types.pdf, types.images],
      });

      if (!results || results.length === 0) return;
      const file = results[0];

      console.log('File selected:', JSON.stringify(file, null, 2));
      
      const formData = new FormData();
      formData.append('bill', {
        uri: file.uri,
        type: file.type || 'application/pdf',
        name: file.name || `bill_${Date.now()}.pdf`,
      } as any);

      console.log('FormData bill field:', {
        uri: file.uri,
        type: file.type || 'application/pdf',
        name: file.name || `bill_${Date.now()}.pdf`,
      });

      setUploading(true);
      const response: any = await uploadBookingBill(selectedOrder._id, formData);
      setUploading(false);

      if (response.success) {
        Alert.alert('Success', 'Bill uploaded successfully');
        // Update local state, keeping status unchanged.
        const updatedOrders = orders.map(o =>
          o._id === selectedOrder._id ? { ...o, bill: response.bill, status: response.status || o.status } : o
        );
        setOrders(updatedOrders);
        setSelectedOrder({
          ...selectedOrder,
          bill: response.bill,
          status: response.status || selectedOrder.status
        });
      } else {
        Alert.alert('Error', response.message || 'Failed to upload bill');
      }
    } catch (err: any) {
      setUploading(false);
      if (isCancel(err)) {
        console.log('User cancelled the picker');
      } else {
        console.error('Picker Error:', err);
        const errorMessage = err?.message || 'An unknown error occurred';
        Alert.alert('Error', `Upload failed: ${errorMessage}\n\nPlease try rebuilding the app if the error persists.`);
      }
    }
  };

  const renderOrderItem = ({ item }: { item: any }) => {
    const user = item.userDetails || item.user || {};
    const vehicle = item.vehicleDetails || item.vehicle || {};
    const services = item.serviceNames || (item.services || []).map((s: any) => s.name);
    
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>#{item.bookingRef || item._id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
          <TouchableOpacity 
             style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}
             onPress={() => {
               setSelectedOrder(item);
               setShowStatusModal(true);
             }}
          >
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.replace(/_/g, ' ').toUpperCase()} ▾
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoSection}>
          <Text style={styles.label}>CUSTOMER</Text>
          <Text style={styles.value}>{user.name || 'Anonymous'}</Text>
          <Text style={styles.subValue}>{user.phone || 'No phone'} • {user.address || 'No address'}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.label}>VEHICLE</Text>
          <Text style={styles.value}>
            {vehicle.brand} {vehicle.model} ({vehicle.registration_no || vehicle.number})
          </Text>
          <Text style={styles.subValue}>
            {vehicle.vehicle_category?.replace('_', ' ') || 'Vehicle'} • {vehicle.fuel_type || 'Fuel'}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.label}>SERVICES</Text>
          <View style={styles.servicesList}>
            {services.map((s: string, i: number) => (
              <Text key={i} style={styles.serviceName}>• {s}</Text>
            ))}
          </View>
        </View>

        {/* Review Box for Delivered/Completed Orders */}
        {['delivered', 'completed'].includes(item.status) && (
          <View style={[styles.reviewBox, { marginBottom: 15 }]}>
            {item.review && item.review.rating ? (
              <>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewTitle}>Customer Review</Text>
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Text key={star} style={{ color: star <= item.review.rating ? '#FFD700' : '#DDDDDD', fontSize: 16 }}>★</Text>
                    ))}
                  </View>
                </View>
                {item.review.comment ? (
                  <Text style={styles.reviewComment}>"{item.review.comment}"</Text>
                ) : (
                  <Text style={[styles.reviewComment, { color: '#999' }]}>No written feedback provided.</Text>
                )}
              </>
            ) : (
              <View style={styles.reviewHeader}>
                <Text style={[styles.reviewTitle, { color: '#888' }]}>No review yet</Text>
                <Text style={{ fontSize: 12, color: '#999' }}>Awaiting customer rating</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.label}>TOTAL BILL</Text>
            <Text style={styles.totalAmount}>₹{item.totalAmount}</Text>
          </View>
          {updatingId === item._id ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : item.status === 'pending' ? (
            <TouchableOpacity 
              style={[styles.updateButton, { backgroundColor: '#F5A623' }]}
              onPress={() => handleAcceptOrder(item._id)}
            >
              <Text style={styles.updateButtonText}>Accept</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity 
                style={[styles.updateButton, { backgroundColor: '#F0F0F0', borderColor: '#DDD', borderWidth: 1 }]}
                onPress={() => {
                  setSelectedOrder(item);
                  setShowDetailsModal(true);
                }}
              >
                <Text style={[styles.updateButtonText, { color: '#333' }]}>View Details</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.updateButton, 
                  { backgroundColor: ['delivered', 'completed'].includes(item.status) ? '#E0E0E0' : '#f28b2c' }
                ]}
                onPress={() => navigation.navigate('TrackingPageUs', { bookingId: item._id })}
                disabled={['delivered', 'completed'].includes(item.status)}
              >
                <Text style={[
                  styles.updateButtonText, 
                  { color: ['delivered', 'completed'].includes(item.status) ? '#888888' : '#000000' }
                ]}>
                  Track Live 📍
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered': return '#F5A623';
      case 'pending': return '#EF6C00';
      case 'cancelled': return '#C62828';
      case 'confirmed': return '#1565C0';
      case 'in_service': return '#6A1B9A';
      default: return '#1B4D6B';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={'#1B4D6B'} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.tabScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
          {['Pending', 'Confirmed', 'Delivered', 'Cancelled'].map((tab: any) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <FlatList
        data={getFilteredOrders()}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No {selectedTab} orders available.</Text>}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowStatusModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Order Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Text style={styles.closeModal}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {STAGES.map((stage) => (
                <TouchableOpacity
                  key={stage.id}
                  style={[
                    styles.statusOption,
                    selectedOrder?.status === stage.id && styles.activeOption
                  ]}
                  onPress={() => handleUpdateStatus(selectedOrder?._id, stage.id)}
                >
                  <Text style={styles.optionIcon}>{stage.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.optionLabel,
                      selectedOrder?.status === stage.id && styles.activeOptionLabel
                    ]}>{stage.label}</Text>
                    <Text style={styles.optionDesc}>{stage.desc}</Text>
                  </View>
                  {selectedOrder?.status === stage.id && (
                    <Text style={styles.checkIcon}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
          <View style={styles.detailsHeaderContainer}>
            <TouchableOpacity onPress={() => setShowDetailsModal(false)} style={{ padding: 10 }}>
              <Text style={{ fontSize: 24, color: COLORS.text, fontWeight: 'bold' }}>←</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text }}>Order Details</Text>
            <View style={{ width: 44 }} />
          </View>

          {selectedOrder && (
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
              
              <View style={styles.detailBox}>
                <Text style={styles.detailBoxTitle}>Booking Information</Text>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Reference</Text><Text style={styles.detailValue}>#{selectedOrder.bookingRef || selectedOrder._id.slice(-6).toUpperCase()}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Status</Text><Text style={[styles.detailValue, { color: getStatusColor(selectedOrder.status), fontWeight: 'bold' }]}>{selectedOrder.status.replace(/_/g, ' ').toUpperCase()}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Booking Date</Text><Text style={styles.detailValue}>{selectedOrder.bookingDate}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Time Slot</Text><Text style={styles.detailValue}>{selectedOrder.timeSlot}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Created At</Text><Text style={styles.detailValue}>{new Date(selectedOrder.createdAt).toLocaleString()}</Text></View>
              </View>

              <View style={styles.detailBox}>
                <Text style={styles.detailBoxTitle}>Customer Information</Text>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Name</Text><Text style={styles.detailValue}>{selectedOrder.userDetails?.name || selectedOrder.user?.name || 'Anonymous'}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Phone</Text><Text style={styles.detailValue}>{selectedOrder.userDetails?.phone || selectedOrder.user?.phone || 'N/A'}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Address</Text><Text style={styles.detailValue}>{selectedOrder.userDetails?.address || 'N/A'}</Text></View>
              </View>

              <View style={styles.detailBox}>
                <Text style={styles.detailBoxTitle}>Vehicle Information</Text>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Brand & Model</Text><Text style={styles.detailValue}>{(selectedOrder.vehicleDetails || selectedOrder.vehicle)?.brand} {(selectedOrder.vehicleDetails || selectedOrder.vehicle)?.model}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Category</Text><Text style={styles.detailValue}>{(selectedOrder.vehicleDetails || selectedOrder.vehicle)?.vehicle_category?.replace('_', ' ')}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Fuel Type</Text><Text style={styles.detailValue}>{(selectedOrder.vehicleDetails || selectedOrder.vehicle)?.fuel_type}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Reg Number</Text><Text style={styles.detailValue}>{(selectedOrder.vehicleDetails || selectedOrder.vehicle)?.registration_no || (selectedOrder.vehicleDetails || selectedOrder.vehicle)?.number}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Year</Text><Text style={styles.detailValue}>{(selectedOrder.vehicleDetails || selectedOrder.vehicle)?.year || 'N/A'}</Text></View>
              </View>

              <View style={styles.detailBox}>
                <Text style={styles.detailBoxTitle}>Services Requested</Text>
                {(selectedOrder.serviceNames || selectedOrder.services?.map((s: any) => s.name) || []).map((s: string, i: number) => (
                  <Text key={i} style={{ fontSize: 14, color: COLORS.text, marginBottom: 5 }}>• {s}</Text>
                ))}
                {selectedOrder.specialInstructions ? (
                  <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#EEE' }}>
                    <Text style={[styles.detailLabel, { marginBottom: 5 }]}>Special Instructions</Text>
                    <Text style={{ fontSize: 14, color: COLORS.text, fontStyle: 'italic' }}>{selectedOrder.specialInstructions}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.detailBox}>
                <Text style={styles.detailBoxTitle}>Payment Summary</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Method</Text>
                  <Text style={styles.detailValue}>{selectedOrder.paymentMethod || 'N/A'}</Text>
                </View>
                <View style={[styles.detailRow, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }]}>
                  <Text style={styles.detailLabel}>Payment Status</Text>
                  <TouchableOpacity 
                    style={[styles.paymentStatusDropdown, { width: '50%', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 12 }]}
                    onPress={() => setShowPaymentPicker(true)}
                    disabled={updatingPayment}
                  >
                    {updatingPayment ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <>
                        <Text style={[
                          styles.detailValue, 
                          { color: selectedOrder.paymentStatus === 'completed' ? '#28A745' : '#FFC107', textAlign: 'right', fontSize: 13 }
                        ]}>
                          {(selectedOrder.paymentStatus || 'pending').toUpperCase()}
                        </Text>
                        <Text style={{ fontSize: 10, color: COLORS.grey, marginLeft: 5 }}>▼</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                {selectedOrder.couponCode ? <View style={styles.detailRow}><Text style={styles.detailLabel}>Coupon Applied</Text><Text style={styles.detailValue}>{selectedOrder.couponCode}</Text></View> : null}
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Tax</Text><Text style={styles.detailValue}>₹{selectedOrder.tax || 0}</Text></View>
                <View style={[styles.detailRow, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EEE' }]}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text }}>Total Amount</Text>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.primary }}>₹{selectedOrder.totalAmount}</Text>
                </View>
              </View>

              <View style={styles.detailBox}>
                <Text style={styles.detailBoxTitle}>Bill Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bill Status</Text>
                  <Text style={[styles.detailValue, { color: selectedOrder.bill ? '#28A745' : '#DC3545', fontWeight: 'bold' }]}>
                    {selectedOrder.bill ? 'UPLOADED' : 'NOT UPLOADED'}
                  </Text>
                </View>
                {selectedOrder.bill && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>File</Text>
                    <Text style={[styles.detailValue, { color: COLORS.primary }]} numberOfLines={1}>
                      {selectedOrder.bill.split('/').pop()}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.uploadButton, uploading && { opacity: 0.7 }]}
                  onPress={handleUploadBill}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.uploadIcon}>📤</Text>
                      <Text style={styles.uploadButtonText}>
                        {selectedOrder.bill ? 'Update Bill' : 'Upload Bill (PDF/Image)'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      <PaymentStatusModal />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  refreshText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  list: { padding: 15, paddingBottom: 50 },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    ...SHADOWS.medium,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  orderDate: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '900' },
  divider: { height: 1, backgroundColor: COLORS.lightGrey, marginVertical: 15 },
  infoSection: { marginBottom: 15 },
  label: { fontSize: 10, fontWeight: '800', color: COLORS.grey, letterSpacing: 1, marginBottom: 4 },
  value: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  subValue: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  servicesList: { marginTop: 5 },
  serviceName: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2, fontWeight: '600' },
  footerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGrey,
  },
  totalAmount: { fontSize: 22, fontWeight: '900', color: COLORS.primary },
  updateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
  },
  updateButtonText: { color: COLORS.white, fontWeight: '800', fontSize: 13 },
  emptyText: { textAlign: 'center', marginTop: 100, color: COLORS.grey, fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  closeModal: { fontSize: 22, color: COLORS.grey },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    backgroundColor: COLORS.background,
  },
  activeOption: {
    backgroundColor: COLORS.primary + '10',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  optionIcon: { fontSize: 20, marginRight: 15 },
  optionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  activeOptionLabel: { color: COLORS.primary },
  optionDesc: { fontSize: 11, color: COLORS.grey, marginTop: 2 },
  checkIcon: { color: COLORS.primary, fontWeight: '900', fontSize: 18 },
  
  tabScrollContainer: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tabContainer: { paddingHorizontal: 15, paddingVertical: 12, gap: 10 },
  tab: { 
    paddingHorizontal: 20, 
    paddingVertical: 8, 
    borderRadius: 50, 
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EEEEEE'
  },
  activeTab: { backgroundColor: '#1B4D6B', borderColor: '#1B4D6B' },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.grey },
  activeTabText: { color: COLORS.white },
  
  reviewBox: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  reviewTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 5,
  },

  detailsHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  detailBox: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    ...SHADOWS.light,
  },
  detailBoxTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF8C00',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.grey,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  uploadButton: {
    backgroundColor: '#1B4D6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
  },
  uploadButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
    marginLeft: 10,
  },
  uploadIcon: {
    fontSize: 18,
  },
  pickerContainer: {
    width: '80%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    // marginTop:30,
    padding: 20,
    marginBottom:180,
    marginLeft:60,
    ...SHADOWS.medium,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  pickerItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  pickerItemText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  paymentStatusDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
});

export default VendorOrderList;

