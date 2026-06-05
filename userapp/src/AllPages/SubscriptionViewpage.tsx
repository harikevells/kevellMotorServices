import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ImageBackground,
  Alert,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { fetchSubscriptions, purchaseSubscription, SafeStorage, fetchProfile, fetchMySubscriptions } from '../services/api';

const { width } = Dimensions.get('window');
const SUB_BG = require('../assets/subscription_bg.jpg');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SubscriptionViewpage = () => {
  const navigation = useNavigation<NavigationProp>();
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
    loadSubscriptions();
    loadMySubscription();
  }, []);

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <View style={styles.pageBackground}>
        <View style={styles.darkOverlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Subscription</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SubscriptionDetails' as any)} style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subtitle}>Choose a subscription plan and save big on every service.</Text>

          <FlatList
            data={subscriptionPlans}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id || item.id}
            contentContainerStyle={{ alignItems: 'center' }}
            renderItem={({ item }) => (
              <View style={styles.planCardContainer}>
                <ImageBackground 
                  source={SUB_BG} 
                  style={styles.planCardInner}
                  imageStyle={{ borderRadius: 24 }}
                >
                  <View style={styles.planCardOverlay}>
                    <Text style={styles.planName}>{item.name}</Text>
                    <Text style={styles.planPrice}>₹{item.price}/{item.billingCycle === 'yearly' ? 'yr' : 'mo'}</Text>
                    <View style={styles.planBenefits}>
                      {(item.features || item.benefits || []).map((b: string, i: number) => (
                        <Text key={i} style={styles.planBenefitText}>✓ {b}</Text>
                      ))}
                    </View>
                    <TouchableOpacity 
                      style={[
                        styles.planButton, 
                        (item._id || item.id) === activePlanId && { backgroundColor: '#444' }
                      ]} 
                      onPress={() => handleSubscribe(item._id || item.id)}
                      disabled={(item._id || item.id) === activePlanId}
                    >
                      <Text style={[
                        styles.planButtonText,
                        (item._id || item.id) === activePlanId && { color: '#aaa' }
                      ]}>
                        {(item._id || item.id) === activePlanId ? 'Active Plan' : 'Subscribe Now'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ImageBackground>
              </View>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  pageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF',
  },
  darkOverlay: {
    flex: 1,
    paddingTop: 50,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  backText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#f28b2c',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  viewButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(242, 139, 44, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f28b2c',
  },
  viewButtonText: {
    color: '#f28b2c',
    fontSize: 14,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#555',
    fontSize: 18,
    textAlign: 'center',
    paddingTop:'20%',
    // marginBottom: 20,
    paddingHorizontal: 30,
  },
  planCardContainer: {
    width: width,
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  planCardInner: {
    width: '100%',
    height: 450,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f28b2c',
    shadowColor: '#f28b2c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  planCardOverlay: {
    width: '100%',
    height: '100%',
    padding: 25,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 24,
  },
  planName: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  planPrice: {
    color: '#f28b2c',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 25,
  },
  planBenefits: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 30,
  },
  planBenefitText: {
    color: '#DDD',
    fontSize: 16,
    marginBottom: 12,
  },
  planButton: {
    backgroundColor: '#f28b2c',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  planButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SubscriptionViewpage;
