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
} from 'react-native';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';
import { fetchVendorOrders, updateOrderStatus } from '../services/api';

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
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled'>('Pending');

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

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.label}>TOTAL BILL</Text>
            <Text style={styles.totalAmount}>₹{item.totalAmount}</Text>
          </View>
          {updatingId === item._id ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <TouchableOpacity 
              style={styles.updateButton}
              onPress={() => {
                setSelectedOrder(item);
                setShowStatusModal(true);
              }}
            >
              <Text style={styles.updateButtonText}>Update Status</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered': return '#2E7D32';
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
});

export default VendorOrderList;
