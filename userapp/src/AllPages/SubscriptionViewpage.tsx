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
  ScrollView
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
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f28b2c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}>
    <Polyline points="20 6 9 17 4 12"></Polyline>
  </Svg>
);

const IconClose = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6L6 18M6 6l12 12"></Path>
  </Svg>
);

const IconSparkle = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
    <Path d="M12 0l2.5 8.5L23 12l-8.5 2.5L12 24l-2.5-8.5L1 12l8.5-2.5z" />
  </Svg>
);

const IconSmallCheck = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="20 6 9 17 4 12"></Polyline>
  </Svg>
);

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SubscriptionViewpage = () => {
  const navigation = useNavigation<NavigationProp>();
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

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

  const selectedPlan = subscriptionPlans.find(p => (p._id || p.id) === selectedPlanId);
  const planFeatures = selectedPlan?.features || selectedPlan?.benefits || ['Up to 50 service requests', 'Customer chat support', 'Service history', 'Earnings dashboard', 'Performance analytics'];
  const isCurrentlyActive = selectedPlanId === activePlanId;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Absolute SVG Gradient Background */}
      <View style={StyleSheet.absoluteFillObject}>
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#b85c00" stopOpacity="1" />
              <Stop offset="0.65" stopColor="#1a0c00" stopOpacity="1" />
              <Stop offset="0.85" stopColor="#000000" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
        </Svg>
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header Close Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 15 }}>
            <IconClose />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 180 }} showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', marginBottom: 30 }}>
            <Text style={styles.mainTitle}>Choose Your Plan</Text>
            <Text style={styles.subtitle}>Choose the right plan for your workshop.</Text>
          </View>

          {/* Global Features List */}
          <View style={styles.globalFeaturesBox}>
            {planFeatures.map((feat: string, idx: number) => (
              <View key={idx} style={styles.globalFeatureRow}>
                <IconCheck />
                <Text style={styles.globalFeatureText}>{feat}</Text>
              </View>
            ))}
          </View>

          {/* Plan Cards Horizontal Scroll */}
          <FlatList
            data={subscriptionPlans}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id || item.id}
            contentContainerStyle={{ paddingHorizontal: 25, gap: 15, paddingVertical: 10 }}
            renderItem={({ item }) => {
              const isSelected = (item._id || item.id) === selectedPlanId;
              const titleMonths = item.billingCycle === 'yearly' ? '1 Year' : '1 Month';
              
              return (
                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={() => setSelectedPlanId(item._id || item.id)}
                  style={[styles.planCard, isSelected ? styles.planCardSelected : styles.planCardUnselected]}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardPlanName}>{item.name || 'Plan'}</Text>
                    {isSelected && <IconSmallCheck />}
                  </View>
                  <Text style={styles.cardDurationTitle}>{titleMonths}</Text>
                  
                  <View style={[styles.cardSparkleBadge, { backgroundColor: isSelected ? '#f28b2c' : '#fff' }]}>
                    <IconSparkle color={isSelected ? '#fff' : '#f28b2c'} />
                  </View>
                  
                  <View style={{ marginTop: 'auto' }}>
                    <Text style={styles.cardPrice}>₹{item.price}/{item.billingCycle === 'yearly' ? 'yr' : 'mo'}</Text>
                  </View>
                </TouchableOpacity>
              )
            }}
          />
        </ScrollView>

        {/* Floating Bottom Button */}
        <View style={styles.bottomButtonContainer}>
          {activePlanId && (
            <TouchableOpacity 
              style={styles.viewActiveBtn} 
              onPress={() => navigation.navigate('SubscriptionDetails' as any)}
            >
              <Text style={styles.viewActiveBtnText}>View Active Plan</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[
              styles.subscribeBtn, 
              (!selectedPlanId || isCurrentlyActive) && { opacity: 0.5, backgroundColor: isCurrentlyActive ? '#444' : '#f28b2c' }
            ]} 
            onPress={() => {
              if (selectedPlanId && !isCurrentlyActive) handleSubscribe(selectedPlanId);
            }}
            disabled={!selectedPlanId || isCurrentlyActive}
          >
            <Text style={styles.subscribeBtnText}>
              {isCurrentlyActive ? 'Active Plan' : 'Subscribe >'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 20,
    alignItems: 'flex-end',
  },
  mainTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#ddd',
    fontSize: 14,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 50,
  },
  globalFeaturesBox: {
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  globalFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  globalFeatureText: {
    color: '#FFF',
    fontSize: 16,
    width: '100%',
    letterSpacing: 0.5, 
  },
  planCard: {
    width: 160,
    height: 180,
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 15,
  },
  planCardSelected: {
    borderWidth: 1.5,
    borderColor: '#f28b2c',
  },
  planCardUnselected: {
    borderWidth: 1,
    borderColor: '#444',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardPlanName: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
  },
  cardDurationTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  cardSparkleBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardPrice: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    paddingHorizontal: 25,
    backgroundColor: 'transparent',
  },
  viewActiveBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  viewActiveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  subscribeBtn: {
    backgroundColor: '#f28b2c',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  subscribeBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default SubscriptionViewpage;
