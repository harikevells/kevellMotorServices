import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import VendorDashboard from './VendorDashboard';
import VendorOrderList from './VendorOrderList';
import VendorDeliveryCreate from './VendorDeliveryCreate';
import VendorDeliveryList from './VendorDeliveryList';
import VendorProfile from './VendorProfile';
import api from '../services/api';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

// Create a context so children can trigger navigation
export const VendorNavContext = createContext<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleDrawer: () => void;
} | null>(null);

export const useVendorNav = () => {
  const ctx = useContext(VendorNavContext);
  if (!ctx) throw new Error('useVendorNav must be used within VendorSidebarNavigator');
  return ctx;
};

const VendorSidebarNavigator = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [shopName, setShopName] = useState('Vendor Portal');
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    fetchVendorProfile();
  }, []);

  const fetchVendorProfile = async () => {
    try {
      const res: any = await api.get('/vendor/profile');
      if (res.success && res.vendor) {
        setShopName(res.vendor.shopName);
      }
    } catch (e) {
      console.warn('Sidebar failed to fetch shop name:', e);
    }
  };

  const toggleDrawer = () => {
    const toValue = isDrawerOpen ? -DRAWER_WIDTH : 0;
    Animated.timing(drawerAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsDrawerOpen(!isDrawerOpen);
  };

  const menuItems = [
    { id: 'Dashboard', title: 'Dashboard', icon: '📊' },
    { id: 'Orders', title: 'Orders', icon: '📦' },
    { id: 'DeliveryCreate', title: 'Add Delivery Boy', icon: '👤+' },
    { id: 'DeliveryList', title: 'Delivery Boys', icon: '👥' },
    { id: 'Profile', title: 'Profile', icon: '👤' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard': return <VendorDashboard />;
      case 'Orders': return <VendorOrderList />;
      case 'DeliveryCreate': return <VendorDeliveryCreate />;
      case 'DeliveryList': return <VendorDeliveryList />;
      case 'Profile': return <VendorProfile />;
      default: return <VendorDashboard />;
    }
  };

  return (
    <VendorNavContext.Provider value={{ activeTab, setActiveTab, toggleDrawer }}>
      <View style={styles.container}>
        {activeTab !== 'Dashboard' && (
          <SafeAreaView style={styles.header}>
            <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton}>
              <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{menuItems.find(i => i.id === activeTab)?.title || activeTab}</Text>
            <View style={{ width: 40 }} />
          </SafeAreaView>
        )}

        <View style={styles.content}>
          {renderContent()}
        </View>

        {/* Backdrop */}
        {isDrawerOpen && (
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={toggleDrawer}
          />
        )}

        {/* Sidebar */}
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: drawerAnim }] }]}>
          <SafeAreaView style={styles.sidebarContent}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>{shopName}</Text>
              <Text style={styles.sidebarSubtitle}>Shop Management</Text>
            </View>
            <View style={styles.menuList}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    activeTab === item.id && styles.activeMenuItem,
                  ]}
                  onPress={() => {
                    setActiveTab(item.id);
                    toggleDrawer();
                  }}
                >
                  <Text style={styles.itemIcon}>{item.icon}</Text>
                  <Text style={[
                    styles.itemTitle,
                    activeTab === item.id && styles.activeItemTitle,
                  ]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </VendorNavContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 45,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 15,
    ...SHADOWS.light,
    zIndex: 10,
  },
  menuButton: { padding: 10 },
  menuIcon: { fontSize: 24, color: '#1B4D6B', fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  content: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 20,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: COLORS.white,
    zIndex: 30,
    ...SHADOWS.medium,
  },
  sidebarContent: { flex: 1 },
  sidebarHeader: {
    padding: 20,
    backgroundColor: '#1B4D6B', // Premium Navy Blue
    marginBottom: 20,
    paddingTop: 60,
  },
  sidebarTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  sidebarSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  menuList: { paddingHorizontal: 10 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
  },
  activeMenuItem: {
    backgroundColor: '#1B4D6B' + '15',
  },
  itemIcon: { fontSize: 20, marginRight: 15 },
  itemTitle: { fontSize: 16, color: '#666', fontWeight: '600' },
  activeItemTitle: { color: '#1B4D6B', fontWeight: '700' },
});

export default VendorSidebarNavigator;
