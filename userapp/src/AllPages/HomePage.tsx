import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Image,
  TextInput,
  ImageBackground,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import RazorpayCheckout from 'react-native-razorpay';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { EVCar } from '../assets/EVIcons';
import { AgentIcon, VehicleIcon, ServiceIcon, SubscriptionIcon, PartsIcon, PaymentsIcon, FeedbackIcon, ReferralsIcon, DocumentsIcon } from '../assets/HomeIcons';
import { SafeStorage, fetchProfile, fetchServices, fetchUserVehicles, fetchNotifications, fetchActiveOffers, validateOffer, fetchSubscriptions, purchaseSubscription, fetchMySubscriptions } from '../services/api';
import { getImageUrl } from '../constants/config';

const { width } = Dimensions.get('window');

const V1 = require('../assets/banners/v1.png');
const V2 = require('../assets/banners/v2.png');
const V3 = require('../assets/banners/v3.png');
const V4 = require('../assets/banners/v4.png');
const V5 = require('../assets/banners/v5.png');
const V6 = require('../assets/banners/v6.png');
const OFFER_1 = require('../assets/offers/free_checkup.png');
const OFFER_2 = require('../assets/offers/battery_repair.png');
const SUB_BG = require('../assets/subscription_bg.jpg');
const MAIN_BG = require('../assets/vendorbackgroundimageAll.png');
const CATEGORIES = [
  { id: 'agent', title: 'Booking Agent', icon: <AgentIcon size={26} color="#f28b2c" /> },
  { id: 'vehicle', title: 'My Vehicle', icon: <VehicleIcon size={26} color="#f28b2c" /> },
  { id: 'General Service', title: 'Service', icon: <ServiceIcon size={26} color="#f28b2c" /> },
  { id: 'subscription', title: 'Subscription', icon: <SubscriptionIcon size={26} color="#f28b2c" /> },
  { id: 'parts', title: 'Spare Parts', icon: <PartsIcon size={26} color="#f28b2c" /> },
  { id: 'payments', title: 'Payments', icon: <PaymentsIcon size={26} color="#f28b2c" /> },
];

const OFFERS = [
  {
    id: '1',
    // title: 'Free Checkup',
    subtitle: 'On your first service',
    image: OFFER_1,
    discount: 'FREE',
  },
  {
    id: '2',
    // title: '',
    subtitle: 'On battery repair',
    image: OFFER_2,
    discount: '20%',
  }
];

const BANNERS = [
  {
    id: '1',
    title: 'Car Service\n& Spare Parts',
    price: '2999',
    type: 'Car',
    color: '#444',
    img: V1,
  },
  {
    id: '2',
    title: 'Bike Service\n& Spare Parts',
    price: '999',
    type: 'Bike',
    color: '#444',
    img: V2,
  },
  {
    id: '3',
    title: 'Commercial\n& Spare Parts',
    price: '3999',
    type: 'Commercial',
    color: '#444',
    img: V3,
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [user, setUser] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('General Service');
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [liveOffers, setLiveOffers] = useState<any[]>([]);
  const [usedOfferIds, setUsedOfferIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<FlatList>(null);
  const intervalRef = useRef<any>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUser();
      loadNotifications();
      loadActiveOffers(); // Fetch active offers on focus to update used status

      const timer = setTimeout(async () => {
        try {
          const mySub: any = await fetchMySubscriptions();
          if (mySub.success && mySub.active) {
            // User already has an active subscription, do not show popup
            return;
          }
        } catch (e) {
          console.warn('Failed to check active subscription for popup', e);
        }

        loadSubscriptions();
        setShowAdPopup(true);
      }, 1500);

      return () => clearTimeout(timer);
    }, [])
  );

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
        // Mock fallback for dummy plans
        Alert.alert('Success', 'Successfully subscribed!');
        setShowAdPopup(false);
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
            setShowAdPopup(false);
            loadSubscriptions();
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

  const loadNotifications = async () => {
    try {
      const res: any = await fetchNotifications();
      if (res.success && res.data) {
        const unread = res.data.filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.warn('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    loadServicesByCategory('General Service');
    startAutoSlide();
    return () => stopAutoSlide();
  }, []);

  const loadActiveOffers = async () => {
    try {
      const res: any = await fetchActiveOffers();
      if (res.success && res.offers) {
        const offers = res.offers;
        // Pre-check which offers this user has already used, silently
        const usedIds = new Set<string>();
        await Promise.all(
          offers
            .filter((o: any) => o.couponCode)
            .map(async (o: any) => {
              try {
                await validateOffer(o.couponCode, 0);
              } catch (errMsg: any) {
                const msg = errMsg?.toString() || '';
                if (msg.includes('already used') || msg.includes('maximum allowed')) {
                  usedIds.add(o._id);
                }
              }
            })
        );
        setUsedOfferIds(usedIds);
        // Show all offers, but we will visually disable the used ones in the UI
        setLiveOffers(offers);
      }
    } catch (e) {
      console.warn('Failed to fetch offers:', e);
    }
  };

  const loadUser = async () => {
    try {
      const storedUser = await SafeStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
      const res: any = await fetchProfile();
      if (res.success) {
        setUser(res.user);
        await SafeStorage.setItem('user', JSON.stringify(res.user));
      }
    } catch (e) {
      console.warn('[Home-User-Load-Error]:', e);
    }
  };

  const startAutoSlide = () => {
    stopAutoSlide();
    intervalRef.current = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % BANNERS.length;
        scrollRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
  };

  const stopAutoSlide = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const loadServicesByCategory = async (category: string) => {
    try {
      setLoadingServices(true);
      setSelectedCategory(category);
      const res: any = await fetchServices(category, 'car', 'electric');
      if (res.success) setServices(res.data.slice(0, 4));
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleStartBooking = (type?: string) => {
    navigation.navigate('VehicleSelection', { category: selectedCategory });
  };

  const profileImageUrl = getImageUrl(user?.profileImage);

  // Get current day/date for the header
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const renderBanner = ({ item }: { item: typeof BANNERS[0] }) => (
    <View style={styles.bannerCardNew}>
      <Text style={styles.bannerCardTitle}>{item.title}</Text>
      <Text style={styles.bannerCardSubtitle} numberOfLines={3}>
        Professional car maintenance, repairs, and genuine spare parts for safe and smooth driving.
      </Text>
      <View style={styles.bannerCardFooter}>
        <TouchableOpacity onPress={() => navigation.navigate('VehicleSelection' as any)}>
          <Text style={styles.bannerCardViewText}>View Service</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bannerCardShopBtn}
          onPress={() => navigation.navigate('Spares' as any)}
        >
          <Text style={styles.bannerCardShopText}>shop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 2-Color Linear Gradient & Cave Line */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Top Linear Gradient */}
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="topGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#633C00" stopOpacity="1" />
              <Stop offset="0.35" stopColor="#000000" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#topGrad)" />
        </Svg>
        
        {/* Bottom Cave Line (Curve) */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: -150,
          right: -150,
          height: 350,
          backgroundColor: '#000',
          borderTopLeftRadius: 500,
          borderTopRightRadius: 500,
          borderTopWidth: 2,
          borderTopColor: 'rgba(242, 139, 44, 0.35)',
        }} />
      </View>

      <StatusBar barStyle="light-content" backgroundColor="#000" translucent={false} />

      {/* Header - Fixed at top */}
      <View style={[styles.header, { paddingHorizontal: 20 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarMini}>
            {profileImageUrl ? (
              <Image source={{ uri: profileImageUrl }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarLetter}>{user?.name?.charAt(0) || 'U'}</Text>
            )}
          </View>
          <View style={styles.greetingBox}>
            <Text style={styles.greetingTitle}>Welcome</Text>
            <Text style={styles.dateText}>{user?.name || 'Tayyab Sohail'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.locationCircleNoBg}
          onPress={() => navigation.navigate('Notifications' as any)}
        >
          <Text style={{ fontSize: 22, color: '#fff' }}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Big Title */}
        <View style={styles.heroTitleContainer}>
          <Text style={styles.heroTitle}>Smart Buy And Service</Text>
          <Text style={styles.heroTitle}>With IWS</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search Service"
            placeholderTextColor="#666"
            style={styles.searchInput}
          />
        </View>

        {/* Sliding Promotional Banners */}
        <View style={styles.bannerWrapper}>
          <FlatList
            ref={scrollRef}
            data={BANNERS}
            renderItem={renderBanner}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
            onScrollBeginDrag={() => stopAutoSlide()}
            keyExtractor={(item) => item.id}
          />
        </View>

        {/* Services Section */}
        <Text style={[styles.sectionTitle, { textTransform: 'uppercase' }]}>SERVICE</Text>
        <Animated.View style={[styles.servicesGrid, { opacity: fadeAnim, transform: [{ translateY }] }]}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.serviceGridItem}
              onPress={() => {
                if (cat.id === 'General Service') {
                  loadServicesByCategory(cat.id);
                  navigation.navigate('VehicleSelection', { category: cat.id });
                } else if (cat.id === 'subscription') {
                  navigation.navigate('Subscription' as any);
                } else if (cat.id === 'parts') {
                  navigation.navigate('Spares' as any);
                } else if (cat.id === 'vehicle') {
                  navigation.navigate('VehicleSelection' as any);
                } else {
                  Alert.alert('Coming Soon', `${cat.title} will be available shortly.`);
                }
              }}
            >
              <View style={[styles.serviceIconBox, selectedCategory === cat.id && styles.serviceIconBoxActive]}>
                {cat.icon}
              </View>
              <Text style={styles.serviceTitleText} numberOfLines={1} adjustsFontSizeToFit>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Exclusive Offers Section */}
        {(liveOffers.filter((o: any) => !usedOfferIds.has(o._id)).length > 0 || OFFERS.length > 0) && (
          <Text style={[styles.sectionTitle, { marginTop: 15 }]}>EXCLUSIVE OFFERS</Text>
        )}
        {liveOffers.filter((o: any) => !usedOfferIds.has(o._id)).length > 0 ? (
          <View style={styles.offersGrid}>
            {liveOffers.filter((o: any) => !usedOfferIds.has(o._id)).map((offer: any, idx: number) => {
              const bgImages = [OFFER_1, OFFER_2];
              const bgImage = bgImages[idx % bgImages.length];

              return (
                <ImageBackground
                  key={offer._id}
                  source={bgImage}
                  style={styles.offerCardNewStyle}
                  imageStyle={{ borderRadius: 16 }}
                >
                  <View style={styles.offerDiscountBadge}>
                    <Text style={styles.offerDiscountText}>
                      {offer.discountType === 'percentage' ? `${offer.discount}% OFF` : `₹${offer.discount} OFF`}
                    </Text>
                  </View>
                  <View style={styles.offerOverlayNew}>
                    <View style={styles.offerPill}>
                      <Text style={styles.offerPillText} numberOfLines={1}>
                        {offer.offerTitle || offer.title || (offer.discountType === 'percentage' ? `${offer.discount}% OFF` : `₹${offer.discount} OFF`)}
                      </Text>
                    </View>
                  </View>
                </ImageBackground>
              );
            })}
          </View>
        ) : (
          <View style={styles.offersGrid}>
            {OFFERS.map(offer => (
              <ImageBackground
                key={offer.id}
                source={offer.image}
                style={styles.offerCardNewStyle}
                imageStyle={{ borderRadius: 16 }}
              >
                {offer.discount && (
                  <View style={styles.offerDiscountBadge}>
                    <Text style={styles.offerDiscountText}>{offer.discount}</Text>
                  </View>
                )}
                <View style={styles.offerOverlayNew}>
                  <View style={styles.offerPill}>
                    <Text style={styles.offerPillText}>{offer.subtitle}</Text>
                  </View>
                </View>
              </ImageBackground>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Subscription Ad Popup */}
      <Modal
        visible={showAdPopup}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdPopup(false)}
      >
        <View style={styles.adModalOverlay}>
          <ImageBackground source={SUB_BG} style={styles.adModalContainer} imageStyle={{ borderRadius: 20 }}>
            <View style={styles.adModalDarkOverlay}>
              <TouchableOpacity style={styles.adModalCloseBtn} onPress={() => setShowAdPopup(false)}>
                <Text style={styles.adModalCloseText}>✕</Text>
              </TouchableOpacity>

              <Text style={styles.adModalTitle}>Subscription Plan</Text>
              <Text style={styles.adModalSubtitle}>Choose a subscription plan and save big on every service.</Text>

              <FlatList
                data={subscriptionPlans}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item._id || item.id}
                renderItem={({ item }) => (
                  <View style={styles.adPlanCard}>
                    <Text style={styles.adPlanName}>{item.name}</Text>
                    <Text style={styles.adPlanPrice}>₹{item.price}/{item.billingCycle === 'yearly' ? 'yr' : 'mo'}</Text>
                    <View style={styles.adPlanBenefits}>
                      {(item.features || item.benefits || []).map((b: string, i: number) => (
                        <Text key={i} style={styles.adPlanBenefitText}>✓ {b}</Text>
                      ))}
                    </View>
                    <TouchableOpacity style={styles.adPlanButton} onPress={() => handleSubscribe(item._id || item.id)}>
                      <Text style={styles.adPlanButtonText}>Subscribe Now</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          </ImageBackground>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMini: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  greetingBox: {
    marginLeft: 12,
  },
  greetingTitle: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '400',
  },
  dateText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 2,
  },
  locationCircleNoBg: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: -4,
    backgroundColor: '#FF5252',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  heroTitleContainer: {
    marginBottom: 25,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 30,
  },
  searchContainer: {
    backgroundColor: '#1c1c1e',
    borderRadius: 30,
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#f28b2c',
  },
  searchIcon: {
    fontSize: 18,
    color: '#666',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  bannerWrapper: {
    marginBottom: 35,
  },
  bannerCardNew: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 16,
    width: width * 0.42,
    marginRight: 15,
    justifyContent: 'space-between',
    minHeight: 180,
  },
  bannerCardTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bannerCardSubtitle: {
    color: '#aaa',
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 15,
  },
  bannerCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  bannerCardViewText: {
    color: '#ccc',
    fontSize: 11,
    fontWeight: '600',
  },
  bannerCardShopBtn: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  bannerCardShopText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 20,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  serviceGridItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 25,
  },
  serviceIconBox: {
    width: 65,
    height: 65,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f28b2c',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceIconBoxActive: {
    borderColor: '#f28b2c',
    backgroundColor: '#111',
  },
  serviceTitleText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  offersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  offerCardNewStyle: {
    width: (width - 55) / 2,
    height: 160,
    overflow: 'hidden',
    marginBottom: 15,
  },
  liveOfferCard: {
    width: 200,
    height: 160,
    marginRight: 14,
    overflow: 'hidden',
  },
  offerOverlayNew: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  offerPill: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  offerPillText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 12,
  },
  offerDiscountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#000',
    borderColor: '#f28b2c',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  offerDiscountText: {
    color: '#f28b2c',
    fontWeight: 'bold',
    fontSize: 12,
  },
  // Subscription Ad Popup Styles
  adModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adModalContainer: {
    width: width * 0.85,
    height: 480, // Fixed height to prevent collapse
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  adModalDarkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 20,
    alignItems: 'center',
    borderRadius: 20,
  },
  adModalCloseBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    backgroundColor: '#333',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adModalCloseText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adModalTitle: {
    color: '#f28b2c',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  adModalSubtitle: {
    color: '#CCC',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  adPlanCard: {
    width: width * 0.85, // Same as container to allow paging
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  adPlanName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  adPlanPrice: {
    color: '#f28b2c',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 15,
  },
  adPlanBenefits: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 20,
  },
  adPlanBenefitText: {
    color: '#DDD',
    fontSize: 14,
    marginBottom: 8,
  },
  adPlanButton: {
    backgroundColor: '#f28b2c',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  adPlanButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
