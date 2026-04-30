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
import { useVendorNav } from './VendorSidebarNavigator';

const VendorDeliveryList = () => {
  const { setActiveTab } = useVendorNav();
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveryBoys();
  }, []);

  const fetchDeliveryBoys = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/vendor/delivery-boys');
      if (res.success) {
        setDeliveryBoys(res.deliveryBoys);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.detail}>{item.phone}</Text>
        <Text style={styles.detail}>{item.email}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: item.status === 'active' ? '#1B4D6B20' : '#F4433620' }]}>
        <Text style={[styles.badgeText, { color: item.status === 'active' ? '#1B4D6B' : '#F44336' }]}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={'#1B4D6B'} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header handled by Navigator */}
      <FlatList
        data={deliveryBoys}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No delivery boys added yet.</Text>}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingVertical: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1B4D6B15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#1B4D6B' },
  info: { flex: 1, marginLeft: 15 },
  name: { fontSize: 16, fontWeight: '700', color: '#333' },
  detail: { fontSize: 13, color: '#666', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontSize: 16 }
});

export default VendorDeliveryList;
