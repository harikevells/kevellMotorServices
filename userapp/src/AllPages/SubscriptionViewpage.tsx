import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Alert,
  StatusBar,
  ScrollView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { fetchSubscriptions, purchaseSubscription, SafeStorage, fetchProfile, fetchMySubscriptions } from '../services/api';
import Svg, { Path, LinearGradient, Defs, Stop, Rect, Polyline } from 'react-native-svg';

const { width } = Dimensions.get('window');

// --- SVG Icons ---
const IconCheck = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f28b2c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}>
    <Polyline points="20 6 9 17 4 12"></Polyline>
  </Svg>
);

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const formatDuration = (cycle: any) => {
  if (!cycle || typeof cycle !== 'string' || cycle.trim() === '') return 'monthly';
  const lower = cycle.toLowerCase();
  if (lower.includes('year')) return 'yearly';
  if (lower.includes('day')) return 'days';
  if (lower.includes('month')) return 'monthly';
  if (lower === 'custom') return 'monthly';
  return cycle;
};

const formatDate = (dateVal: any) => {
  if (!dateVal) return '--';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '--';
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  } catch (e) {
    return '--';
  }
};

const SubscriptionViewpage = () => {
  const navigation = useNavigation<NavigationProp>();
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [myActiveSubscription, setMyActiveSubscription] = useState<any>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'myplan'>('available');

  useEffect(() => {
    loadUser();
    loadSubscriptions();
    loadMySubscription();
  }, []);

  useEffect(() => {
    if (subscriptionPlans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(subscriptionPlans[0]._id || subscriptionPlans[0].id);
    }
  }, [subscriptionPlans]);

  const loadUser = async () => {
    try {
      const storedUser = await SafeStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
      const res: any = await fetchProfile();
      if (res?.success) {
        setUser(res.user);
        await SafeStorage.setItem('user', JSON.stringify(res.user));
      }
    } catch (e) {
      console.warn('[Subscription-User-Load-Error]:', e);
    }
  };

  const loadMySubscription = async () => {
    try {
      const res: any = await fetchMySubscriptions();
      if (res.success && res.active && res.active.plan) {
        setActivePlanId(res.active.plan._id || res.active.plan.id);
        setMyActiveSubscription(res.active);
      }
    } catch (e) {
      console.warn('Failed to load my subscriptions', e);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const res: any = await fetchSubscriptions();
      if (res.success && res.data) {
        const activePlans = res.data.filter((p: any) => p.isActive !== false);
        if (activePlans.length === 0) {
          setSubscriptionPlans([
            { _id: '1', name: 'Basic Plan', price: 499, billingCycle: 'monthly', features: ['1 Free Checkup', '10% Off on Parts', 'Priority Support'] },
            { _id: '2', name: 'Premium Plan', price: 999, billingCycle: 'monthly', features: ['2 Free Checkups', '20% Off on Parts', 'Free Roadside Asst.', 'Priority Support'] }
          ]);
        } else {
          setSubscriptionPlans(activePlans);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch subscriptions', e);
      setSubscriptionPlans([
        { _id: '1', name: 'Basic Plan', price: 499, billingCycle: 'monthly', features: ['1 Free Checkup', '10% Off on Parts', 'Priority Support'] },
      ]);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      if (planId === '1' || planId === '2') {
        Alert.alert('Success', 'Successfully subscribed!');
        navigation.goBack();
        return;
      }
      
      const selectedPlan = subscriptionPlans.find(p => (p._id || p.id) === planId);
      if (!selectedPlan) return;

      const amount = selectedPlan.price;

      const options = {
        description: `Subscription for ${selectedPlan.name}`,
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: 'INR',
        key: 'rzp_test_SfkV0cySd3CwyQ',
        amount: Math.round(amount * 100),
        name: 'Kevell Motor Services',
        theme: { color: '#f28b2c' },
        prefill: {
          email: user?.email || 'customer@example.com',
          contact: user?.phone || '9999999999',
          name: user?.name || 'Customer'
        }
      };

      RazorpayCheckout.open(options).then(async (data: any) => {
        try {
          const res: any = await purchaseSubscription(planId);
          if (res.success) {
            Alert.alert('Success', 'Successfully subscribed! Your plan is now active.');
            navigation.goBack();
          } else {
            Alert.alert('Error', res.message || 'Failed to activate plan after payment.');
          }
        } catch (e) {
            Alert.alert('Error', 'Failed to activate plan after payment.');
        }
      }).catch((error: any) => {
        Alert.alert('Payment Cancelled/Failed', 'Payment was not completed. Plan is not active.');
      });

    } catch (e) {
      Alert.alert('Error', 'An error occurred while initiating subscription payment.');
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 18l-6-6 6-6"></Path>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscriptions</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => setActiveTab('available')} style={styles.tabButton}>
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>Available plan</Text>
          {activeTab === 'available' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('myplan')} style={styles.tabButton}>
          <Text style={[styles.tabText, activeTab === 'myplan' && styles.activeTabText]}>My Plan</Text>
          {activeTab === 'myplan' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.descriptionText}>
          Mechanive is a smart vehicle service and spare parts platform designed for car, bike, and heavy vehicle owners
        </Text>

        {activeTab === 'available' ? (
          subscriptionPlans.map((plan, index) => {
            const isCurrent = (plan._id || plan.id) === activePlanId;
            return (
              <View key={index} style={styles.cardContainer}>
                <View style={styles.cardGradientWrapper}>
                  <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
                    <Defs>
                      <LinearGradient id={`gradAvailable${index}`} x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor="#4A2E15" stopOpacity="1" />
                        <Stop offset="0.6" stopColor="#222222" stopOpacity="1" />
                        <Stop offset="1" stopColor="#1C1C1C" stopOpacity="1" />
                      </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill={`url(#gradAvailable${index})`} rx={20} />
                  </Svg>
                  <View style={styles.cardContent}>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceValue}>
                        <Text style={styles.priceSymbol}>$</Text>
                        {plan.price}
                        <Text style={styles.priceDuration}> /{formatDuration(plan.billingCycle || plan.duration || plan.validity)}</Text>
                      </Text>
                    </View>
                    <Text style={styles.planTitle}>{plan.name}{plan.name?.toLowerCase().includes('plan') ? '' : ' Plan'}</Text>
                    <Text style={styles.planSubtitle}>Perfect for regular vehicle maintenance.</Text>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.featuresList}>
                      {plan.features?.map((feat: string, i: number) => (
                        <View key={i} style={styles.featureRow}>
                          <IconCheck />
                          <Text style={styles.featureText}>{feat}</Text>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity 
                      style={[styles.actionButton, isCurrent ? styles.currentPlanButton : styles.upgradeButton]}
                      onPress={() => {
                        if (!isCurrent) handleSubscribe(plan._id || plan.id);
                      }}
                      disabled={isCurrent}
                    >
                      <Text style={styles.actionButtonText}>
                        {isCurrent ? 'YOUR CURRENT PLAN' : 'UPGRADE TO PREMIUM'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          subscriptionPlans.filter(p => (p._id || p.id) === activePlanId).length > 0 ? (
            subscriptionPlans.filter(p => (p._id || p.id) === activePlanId).map((plan, index) => {
              const pDate = formatDate(myActiveSubscription?.purchaseDate);
              const eDate = formatDate(myActiveSubscription?.expiryDate);
              
              return (
              <View key={index} style={styles.cardContainer}>
                <View style={styles.cardGradientWrapper}>
                  <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
                    <Defs>
                      <LinearGradient id={`gradMyPlan${index}`} x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor="#4A2E15" stopOpacity="1" />
                        <Stop offset="0.6" stopColor="#222222" stopOpacity="1" />
                        <Stop offset="1" stopColor="#1C1C1C" stopOpacity="1" />
                      </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill={`url(#gradMyPlan${index})`} rx={20} />
                  </Svg>
                  <View style={styles.cardContent}>
                    <View style={styles.myPlanHeader}>
                      <Text style={styles.planTitle}>{plan.name}{plan.name?.toLowerCase().includes('plan') ? '' : ' Plan'}</Text>
                      <Text style={styles.activeBadge}>ACTIVE</Text>
                    </View>
                    <Text style={styles.chassisText}>Chassis Model: 72748837963793</Text>
                    
                    <View style={styles.myPlanPriceRow}>
                      <Text style={styles.myPlanPriceValue}>
                        <Text style={styles.priceSymbol}>$</Text>
                        {plan.price}
                        <Text style={styles.priceDuration}> /{formatDuration(plan.billingCycle || plan.duration || plan.validity)}</Text>
                      </Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.featuresList}>
                      {plan.features?.map((feat: string, i: number) => (
                        <View key={i} style={styles.featureRow}>
                          <IconCheck />
                          <Text style={styles.featureText}>{feat}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={[styles.divider, { marginTop: 10 }]} />

                    <View style={styles.dateContainer}>
                      <Text style={styles.dateLabel}>Purchased:</Text>
                      <Text style={styles.dateValue}>{pDate}</Text>
                    </View>
                    <View style={styles.dateContainer}>
                      <Text style={styles.dateLabel}>Expires:</Text>
                      <Text style={styles.dateValue}>{eDate}</Text>
                    </View>
                  </View>
                </View>
              </View>
              );
            })
          ) : (
            <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 40, fontSize: 16 }}>No active plan found.</Text>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 0,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: 10,
    marginBottom: 20,
    gap: 40,
  },
  tabButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 2,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  descriptionText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  cardContainer: {
    marginBottom: 25,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardGradientWrapper: {
    width: '100%',
    borderRadius: 20,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#333',
  },
  cardContent: {
    padding: 25,
    zIndex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  priceSymbol: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 2,
  },
  priceValue: {
    color: '#FFF',
    fontSize: 42,
    fontWeight: 'bold',
  },
  priceDuration: {
    color: '#aaa',
    fontSize: 14,
    marginLeft: 5,
  },
  planTitle: {
    color: '#f28b2c',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planSubtitle: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 20,
  },
  featuresList: {
    marginBottom: 15,
    
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    color: '#ccc',
    fontSize: 14,
    flex: 1,
  },
  actionButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  currentPlanButton: {
    backgroundColor: '#f28b2c',
  },
  upgradeButton: {
    backgroundColor: '#f28b2c',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  myPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeBadge: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  chassisText: {
    color: '#888',
    fontSize: 12,
    marginBottom: 20,
  },
  myPlanPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  myPlanPriceValue: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    color: '#888',
    fontSize: 13,
    width: 80,
  },
  dateValue: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

export default SubscriptionViewpage;

