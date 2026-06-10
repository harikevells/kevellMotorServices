import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { SafeStorage, fetchProfile, fetchMySubscriptions, fetchUserBookings, getMySparePartOrders } from '../services/api';
import { getImageUrl } from '../constants/config';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Path, Circle, Polyline } from 'react-native-svg';

const IconPackage = ({ color }: { color: string }) => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <Path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></Path>
    <Polyline points="3.27 6.96 12 12.01 20.73 6.96"></Polyline>
    <Path d="M12 22.08V12"></Path>
  </Svg>
);

const IconUser = ({ color }: { color: string }) => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></Path>
    <Circle cx="12" cy="7" r="4"></Circle>
  </Svg>
);

const IconStar = ({ color }: { color: string }) => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <Polyline points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></Polyline>
  </Svg>
);

const IconEdit = ({ color }: { color: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></Path>
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></Path>
  </Svg>
);

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const formatDate = (dateValue: any, fallbackDate?: Date) => {
  if (!dateValue || dateValue === 'null' || dateValue === 'undefined') {
    if (fallbackDate) dateValue = fallbackDate;
    else return 'N/A';
  }
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) {
    if (fallbackDate) {
      const fb = new Date(fallbackDate);
      const day = fb.getDate().toString().padStart(2, '0');
      const month = (fb.getMonth() + 1).toString().padStart(2, '0');
      const year = fb.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return 'N/A';
  }
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Component for gradient cards
const StatCard = ({ title, count, subtitle, type, onPress }: any) => {
  let colors = ['#222', '#222'];
  let tagColor = '#fff';
  if (type === 'Completed') {
    colors = ['#00E676', '#1a1a2e'];
    tagColor = '#00A000';
  } else if (type === 'Progress') {
    colors = ['#FF9800', '#1a1a2e'];
    tagColor = '#FF8C00';
  } else if (type === 'Cancel') {
    colors = ['#FF0000', '#1a1a2e'];
    tagColor = '#E50000';
  }

  const isSolidBtn = type === 'Progress' || type === 'Cancel';

  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.8}>
      <View style={StyleSheet.absoluteFill}>
        <Svg height="100%" width="100%" style={{ borderRadius: 24 }}>
          <Defs>
            <RadialGradient id={`grad-${type}`} cx="50%" cy="50%" rx="70%" ry="70%" fx="50%" fy="50%">
              <Stop offset="0%" stopColor="#1C1C1E" stopOpacity="1" />
              <Stop offset="40%" stopColor="#1C1C1E" stopOpacity="0.8" />
              <Stop offset="100%" stopColor={colors[0]} stopOpacity="1" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#grad-${type})`} rx="24" ry="24" />
        </Svg>
      </View>
      <View style={[styles.cardTag, { backgroundColor: tagColor }]}>
        <Text style={styles.cardTagText}>{title}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardCount}>{count.toString().padStart(2, '0')}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
        <View style={[styles.viewDetailsBtn, isSolidBtn && { backgroundColor: '#fff', borderColor: '#fff' }]}>
          <Text style={[styles.viewDetailsText, isSolidBtn && { color: '#000' }]}>VIEW DETAILS</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ProfilePage = () => {
  const navigation = useNavigation<NavigationProp>();
  const [user, setUser] = useState<any>(null);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('Profile');

  // Stats states
  const [orderStats, setOrderStats] = useState({ completed: 0, progress: 0, cancel: 0 });
  const [serviceStats, setServiceStats] = useState({ completed: 0, progress: 0, cancel: 0 });

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const storedUser = await SafeStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      const [res, subRes, bookRes, orderRes]: any = await Promise.all([
        fetchProfile().catch(() => null),
        fetchMySubscriptions().catch(() => null),
        fetchUserBookings().catch(() => ({ data: [] })),
        getMySparePartOrders().catch(() => ({ data: [] }))
      ]);

      if (res && res.success) {
        setUser(res.user);
        await SafeStorage.setItem('user', JSON.stringify(res.user));
      }

      if (subRes && subRes.success && subRes.active) {
        setActiveSub(subRes.active);
      } else {
        setActiveSub(null);
      }

      // Calculate Service Stats
      const bookings = bookRes?.data || [];
      const sStats = { completed: 0, progress: 0, cancel: 0 };
      bookings.forEach((b: any) => {
        if (b.status === 'completed' || b.status === 'delivered') sStats.completed++;
        else if (b.status === 'cancelled') sStats.cancel++;
        else sStats.progress++;
      });
      setServiceStats(sStats);

      // Calculate Order Stats
      const orders = orderRes?.data || [];
      const oStats = { completed: 0, progress: 0, cancel: 0 };
      orders.forEach((o: any) => {
        if (o.status === 'Delivered' || o.status === 'completed') oStats.completed++;
        else if (o.status === 'Cancelled' || o.status === 'cancelled') oStats.cancel++;
        else oStats.progress++;
      });
      setOrderStats(oStats);

    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await SafeStorage.removeItem('token');
            await SafeStorage.removeItem('user');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  if (!user && loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#F5A623" />
      <Text style={styles.loadingText}>Loading your profile...</Text>
    </View>
  );

  let calculatedPurchaseDateStr = 'N/A';
  let calculatedExpiryDateStr = 'N/A';
  let daysLeft = 0;

  if (activeSub) {
    try {
      if (activeSub.purchaseDate) {
        calculatedPurchaseDateStr = new Date(activeSub.purchaseDate).toLocaleDateString();
      }
      if (activeSub.expiryDate) {
        calculatedExpiryDateStr = new Date(activeSub.expiryDate).toLocaleDateString();
        daysLeft = Math.max(0, Math.ceil((new Date(activeSub.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24)));
      }
    } catch (e) {
      console.log('Date parsing error', e);
    }
  }

  const renderProfileInput = (label: string, value: string) => (
    <View style={styles.profileInputBox}>
      <Text style={styles.profileInputLabel}>{label}</Text>
      <View style={styles.profileInputBlock}>
        <Text style={styles.profileInputValue}>{value || 'N/A'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>MY PROFILE</Text>
        </View>
        <TouchableOpacity style={styles.headerEditBtn} onPress={() => navigation.navigate('EditProfile' as any)}>
          <IconEdit color="#F5A623" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {user?.profileImage ? (
              <Image source={{ uri: getImageUrl(user.profileImage) as string }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
              </View>
            )}
          </View>
          <Text style={styles.userName}>{user?.name || 'Tayyab Sohail'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'tayyab@example.com'}</Text>
          {activeSub ? (
            <Text style={styles.membershipText}>{activeSub.plan?.name || 'Golden'} Membership ⭐</Text>
          ) : (
            <Text style={styles.membershipTextBasic}>Standard Member</Text>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'Profile' && styles.tabBtnActive]}
            onPress={() => setActiveTab('Profile')}
          >
            <IconUser color={activeTab === 'Profile' ? '#fff' : '#aaa'} />
            <Text style={[styles.tabBtnText, activeTab === 'Profile' && styles.tabBtnTextActive]}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'Orders' && styles.tabBtnActive]}
            onPress={() => setActiveTab('Orders')}
          >
            <IconPackage color={activeTab === 'Orders' ? '#fff' : '#aaa'} />
            <Text style={[styles.tabBtnText, activeTab === 'Orders' && styles.tabBtnTextActive]}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'Subscription' && styles.tabBtnActive]}
            onPress={() => setActiveTab('Subscription')}
          >
            <IconStar color={activeTab === 'Subscription' ? '#fff' : '#aaa'} />
            <Text style={[styles.tabBtnText, activeTab === 'Subscription' && styles.tabBtnTextActive]}>Subscription</Text>
          </TouchableOpacity>
        </View>

        {/* Content based on Active Tab */}
        {activeTab === 'Profile' && (
          <View style={styles.tabContent}>
            <View style={styles.profileDetailsCard}>
              <Text style={styles.detailSectionTitle}>Personal Info</Text>
              {renderProfileInput('Full Name', user?.name)}
              {renderProfileInput('Phone', user?.phone)}
              {renderProfileInput('Email', user?.email)}
              {renderProfileInput('Gender', user?.gender)}

              <Text style={[styles.detailSectionTitle, { marginTop: 10 }]}>Address Details</Text>
              {renderProfileInput('Street / Area', user?.address?.street)}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  {renderProfileInput('District', user?.address?.city)}
                </View>
                <View style={{ flex: 1 }}>
                  {renderProfileInput('State', user?.address?.state)}
                </View>
              </View>
              {renderProfileInput('Pincode', user?.address?.pincode)}
            </View>
          </View>
        )}

        {activeTab === 'Orders' && (
          <View style={styles.tabContent}>

            {/* Orders Section */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Orders :</Text>
              <View style={styles.cardsRow}>
                <StatCard
                  title="Completed"
                  type="Completed"
                  count={orderStats.completed}
                  subtitle="ORDERS COMPLETE"
                  onPress={() => navigation.navigate('UserProductspare' as any)}
                />
                <StatCard
                  title="Progress"
                  type="Progress"
                  count={orderStats.progress}
                  subtitle="ORDER PROGRESS"
                  onPress={() => navigation.navigate('UserProductspare' as any)}
                />
                <StatCard
                  title="Cancel"
                  type="Cancel"
                  count={orderStats.cancel}
                  subtitle="ORDER CANCEL"
                  onPress={() => navigation.navigate('UserProductspare' as any)}
                />
              </View>
            </View>

            {/* Service Section */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Service :</Text>
              <View style={styles.cardsRow}>
                <StatCard
                  title="Completed"
                  type="Completed"
                  count={serviceStats.completed}
                  subtitle="SERVICE COMPLETE"
                  onPress={() => navigation.navigate('Bookings' as any)}
                />
                <StatCard
                  title="Progress"
                  type="Progress"
                  count={serviceStats.progress}
                  subtitle="SERVICE PROGRESS"
                  onPress={() => navigation.navigate('Bookings' as any)}
                />
                <StatCard
                  title="Cancel"
                  type="Cancel"
                  count={serviceStats.cancel}
                  subtitle="SERVICE CANCEL"
                  onPress={() => navigation.navigate('Bookings' as any)}
                />
              </View>
            </View>

          </View>
        )}

        {activeTab === 'Subscription' && (
          <View style={styles.tabContent}>
            {activeSub && activeSub.plan ? (
              <View style={styles.subscriptionBox}>
                <View style={styles.subHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.subIconWrapper}>
                      <Text style={styles.subIconStar}>✦</Text>
                    </View>
                    <Text style={styles.subTitle}>Your plan</Text>
                  </View>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                </View>
                <View style={{ marginLeft: 65 }}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceBig}>${activeSub.plan.price || '19'}</Text>
                    <View style={styles.priceStrikethroughBox}>
                      <Text style={styles.priceStrike}>${(activeSub.plan.price || 19) + 10}</Text>
                      <Text style={styles.pricePerMonth}>/per month</Text>
                    </View>
                  </View>
                  <Text style={styles.subDescription}>For solo entrepreneurs</Text>

                  <View style={styles.featuresList}>
                    {(activeSub.plan.features || []).map((feature: string, idx: number) => (
                      <View key={idx} style={styles.featureRow}>
                        <Text style={styles.checkIcon}>✓</Text>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                    {(!activeSub.plan.features || activeSub.plan.features.length === 0) && (
                      <>
                        <View style={styles.featureRow}><Text style={styles.checkIcon}>✓</Text><Text style={styles.featureText}>Up to 50 service requests/month</Text></View>
                        <View style={styles.featureRow}><Text style={styles.checkIcon}>✓</Text><Text style={styles.featureText}>Priority listing</Text></View>
                        <View style={styles.featureRow}><Text style={styles.checkIcon}>✓</Text><Text style={styles.featureText}>Service history management</Text></View>
                      </>
                    )}
                  </View>

                  <View style={styles.datesBox}>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={{ color: '#888', fontSize: 12, width: 100 }}>Purchase date: </Text>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{calculatedPurchaseDateStr}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: '#888', fontSize: 12, width: 100 }}>Expire date: </Text>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{calculatedExpiryDateStr}</Text>
                      </View>
                    </View>
                    <View style={styles.daysLeftBadge}>
                      <Text style={styles.daysLeftText}>{daysLeft} Days Left</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.subscriptionBox}>
                <Text style={[styles.subTitle, { textAlign: 'center', marginTop: 20 }]}>No Active Subscription</Text>
                <TouchableOpacity
                  style={{ backgroundColor: '#F5A623', padding: 15, borderRadius: 10, marginTop: 20 }}
                  onPress={() => navigation.navigate('SubscriptionViewpage' as any)}
                >
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Subscribe Now</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Footer Logout */}
        <TouchableOpacity style={styles.logoutFooter} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 10,
    color: '#F5A623',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 50,
    paddingBottom: 10,
    position: 'relative',
  },
  headerEditBtn: {
    position: 'absolute',
    right: 25,
    top: 50,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bellIcon: {
    fontSize: 22,
    color: '#fff',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 25,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 70,
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginBottom: 15,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#333',
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#aaa',
    fontSize: 14,
    width: '100%',
    alignSelf: 'center',
    textAlign: 'center',
    marginTop: 4,
  },
  membershipText: {
    color: '#F5A623',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  membershipTextBasic: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 20,
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabBtnActive: {
    backgroundColor: '#FF9800',
  },
  tabBtnText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabBtnTextActive: {
    color: '#fff',
  },
  tabContent: {
    paddingHorizontal: 15,
  },
  statsSection: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '31%',
    height: 115,
    borderRadius: 24,
    alignItems: 'center',
    position: 'relative',
    marginTop: 15,
  },
  cardTag: {
    position: 'absolute',
    top: -10,
    width: 80,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  cardTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginTop: 10,
  },
  cardCount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    color: '#aaa',
    fontSize: 9,
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  viewDetailsBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  viewDetailsText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  subscriptionBox: {
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  subIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  subIconStar: {
    color: '#fff',
    fontSize: 28,
  },
  subTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  priceBig: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    lineHeight: 50,
  },
  priceStrikethroughBox: {
    marginLeft: 15,
    marginBottom: 5,
  },
  priceStrike: {
    color: '#888',
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  pricePerMonth: {
    color: '#555',
    fontSize: 12,
  },
  subDescription: {
    color: '#CCC',
    fontSize: 14,
    marginBottom: 25,
  },
  featuresList: {
    marginTop: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkIcon: {
    color: '#000',
    fontSize: 12,
    marginRight: 10,
    fontWeight: 'bold',
    backgroundColor: '#FF9800',
    width: 18,
    height: 18,
    textAlign: 'center',
    borderRadius: 9,
    lineHeight: 18,
    overflow: 'hidden',
  },
  activeBadge: {
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#28a745',
  },
  activeBadgeText: {
    color: '#28a745',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  datesBox: {
    marginTop: 15,
    paddingTop: 15,
    paddingBottom: 58,
    borderTopWidth: 1,
    borderTopColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTextLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 6,
  },
  dateTextValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  daysLeftBadge: {
    backgroundColor: 'rgba(245, 166, 35, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F5A623',
  },
  daysLeftText: {
    color: '#F5A623',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  featureText: {
    color: '#fff',
    fontSize: 14,
    width:'100%'
  },
  logoutFooter: {
    alignSelf: 'center',
    paddingBottom: 10,
    paddingTop: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileDetailsCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  detailSectionTitle: {
    color: '#F5A623',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },
  profileInputBox: {
    marginBottom: 15,
  },
  profileInputLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 6,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileInputBlock: {
    backgroundColor: '#111122',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    padding: 14,
  },
  profileInputValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  }
});

export default ProfilePage;
