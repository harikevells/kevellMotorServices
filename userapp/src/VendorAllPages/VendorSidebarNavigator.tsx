import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  Image,
  Alert,
  BackHandler,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../constants/theme';
import VendorDashboard from './VendorDashboard';
import VendorOrderList from './VendorOrderList';
import VendorDeliveryCreate from './VendorDeliveryCreate';
import VendorDeliveryList from './VendorDeliveryList';
import VendorNotificationPage from './NotificationPage';
import VendorProfile from './VendorProfile';
import ChallenBooking from './ChallenBooking';
import api, { SafeStorage } from '../services/api';
import { getImageUrl } from '../constants/config';
import VendorFooter from './VendorFooter';

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
  const [tabHistory, setTabHistory] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [shopName, setShopName] = useState('Vendor Portal');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    fetchVendorProfile();
  }, []);

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      if (tabHistory.length > 0) {
        const previousTab = tabHistory[tabHistory.length - 1];
        const newHistory = tabHistory.slice(0, -1);
        setTabHistory(newHistory);
        setActiveTab(previousTab);
        return true; // Prevent default (exit app)
      }

      // If no history but on a tab other than Dashboard, go to Dashboard
      if (activeTab !== 'Dashboard') {
        setActiveTab('Dashboard');
        setTabHistory([]);
        return true;
      }

      return false; // Let default behavior happen (exit app)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [tabHistory, activeTab]);

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return;

    // Push current tab to history
    setTabHistory(prev => [...prev, activeTab]);
    setActiveTab(tab);
  };

  const fetchVendorProfile = async () => {
    try {
      const res: any = await api.get('/vendor/profile');
      if (res.success && res.vendor) {
        setShopName(res.vendor.shopName);

        // Handle image path correctly with BASE URL fallback
        const img = res.vendor.profilePicture || res.vendor.shopImage || res.vendor.user?.profileImage;
        if (img) {
          setProfileImage(getImageUrl(img));
        }
      }
    } catch (e) {
      console.warn('Sidebar failed to fetch vendor data:', e);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await SafeStorage.removeItem('token');
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            })
          );
        }
      },
    ]);
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
    { id: 'Notifications', title: 'Notifications', icon: '🔔' },
    { id: 'Profile', title: 'Profile', icon: '👤' },
    { id: 'ChallenBooking', title: 'Challen Service Bill', icon: '📝' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard': return <VendorDashboard />;
      case 'Orders': return <VendorOrderList />;
      case 'DeliveryCreate': return <VendorDeliveryCreate />;
      case 'DeliveryList': return <VendorDeliveryList />;
      case 'Notifications': return <VendorNotificationPage />;
      case 'Profile': return <VendorProfile />;
      case 'ChallenBooking': return <ChallenBooking />;
      default: return <VendorDashboard />;
    }
  };

  return (
    <VendorNavContext.Provider value={{ activeTab, setActiveTab: handleTabChange, toggleDrawer }}>
      <View style={styles.container}>
        {activeTab !== 'Dashboard' && (
          <SafeAreaView style={styles.header}>
            <View style={{ width: 40 }} />
            <Text style={styles.headerTitle}>{menuItems.find(i => i.id === activeTab)?.title || activeTab}</Text>
            {activeTab === 'DeliveryList' ? (
              <TouchableOpacity
                style={styles.headerAddBtn}
                onPress={() => handleTabChange('DeliveryCreate')}
              >
                <Text style={styles.headerAddBtnText}>Add +</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </SafeAreaView>
        )}

        <View style={styles.content}>
          {renderContent()}
        </View>

        <VendorFooter />
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
  headerAddBtn: {
    backgroundColor: '#1B4D6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerAddBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  content: { flex: 1, paddingBottom: 90 },
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
    backgroundColor: '#1B4D6B',
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
  },
  sidebarTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  sidebarSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  menuList: { paddingHorizontal: 10, flex: 1 },
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
  logoutContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
  },
  logoutIcon: { fontSize: 20, marginRight: 15 },
  logoutText: { fontSize: 16, color: '#FF4444', fontWeight: '700' },
});

export default VendorSidebarNavigator;
