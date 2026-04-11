import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import api from '../services/api';

const VendorOrderList = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/vendor/orders');
      if (res.success) {
        setOrders(res.orders);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const renderOrderItem = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item._id.slice(-6).toUpperCase()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <Text style={styles.customerName}>{item.user?.name || 'Unknown Customer'}</Text>
      <Text style={styles.vehicleInfo}>{item.vehicle?.brand} {item.vehicle?.model} ({item.vehicle?.number})</Text>
      <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      <View style={styles.footerRow}>
        <Text style={styles.totalAmount}>₹{item.totalAmount}</Text>
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#1B4D6B';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#F44336';
      default: return '#2196F3';
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
      <View style={styles.header}>
        <Text style={styles.title}>All Orders</Text>
        <TouchableOpacity onPress={fetchOrders}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No orders yet.</Text>}
        showsVerticalScrollIndicator={false}
      />
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
    padding: 20
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  refreshText: { color: '#1B4D6B', fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    ...SHADOWS.light,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 16, fontWeight: '800', color: '#333' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  customerName: { fontSize: 15, fontWeight: '600', color: '#333' },
  vehicleInfo: { fontSize: 13, color: '#666', marginTop: 4 },
  orderDate: { fontSize: 12, color: '#999', marginTop: 4 },
  footerRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  totalAmount: { fontSize: 18, fontWeight: '800', color: '#1B4D6B' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontSize: 16 }
});

export default VendorOrderList;
