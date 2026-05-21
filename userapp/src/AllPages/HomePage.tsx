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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { EVCar } from '../assets/EVIcons';
import { SafeStorage, fetchProfile, fetchServices, fetchUserVehicles, fetchNotifications, fetchActiveOffers, validateOffer } from '../services/api';
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

const CATEGORIES = [
  { id: 'General Service', title: 'Periodic Service', icon: '🛠️', color: '#111' },
  { id: 'Battery', title: 'Battery Health', icon: '⚡', color: '#111' },
  { id: 'Engine', title: 'Brake Check', icon: '⚙️', color: '#111' },
  { id: 'RSA', title: 'Roadside Asst.', icon: '🆘', color: '#111' },
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
    title: 'Get your checked for 999 only!',
    price: '999',
    type: 'Bike',
    color: '#ff8c00',
    img: V1,
  },
  {
    id: '2',
    title: 'Car First Service checked for 2999 only!',
    price: '2999',
    type: 'Car',
    color: '#ff8c00',
    img: V2,
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
  const [liveOffers, setLiveOffers] = useState<any[]>([]);
  const [usedOfferIds, setUsedOfferIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<FlatList>(null);
  const intervalRef = useRef<any>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadUser();
      loadNotifications();
    }, [])
  );

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
    loadActiveOffers();
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
    <View style={[styles.banner, { backgroundColor: item.color, width: width - 40 }]}>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerText}>{item.title}</Text>
        <TouchableOpacity
          style={styles.bannerButton}
          onPress={() => handleStartBooking(item.type)}
        >
          <Text style={styles.bannerButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bannerRightImages}>
        <Image source={V3} style={styles.floatImg1} />
        <Image source={V2} style={styles.floatImg2} />
        <Image source={V4} style={styles.floatImg3} />
        <Image source={V1} style={styles.floatImg4} />
        <Image source={V5} style={styles.floatImg5} />
        <Image source={V6} style={styles.floatImg6} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Premium Dark Style */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarMini}>
              {profileImageUrl ? (
                <Image source={{ uri: profileImageUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarLetter}>{user?.name?.charAt(0) || 'U'}</Text>
              )}
            </View>
            <View style={styles.greetingBox}>
              <Text style={styles.greetingTitle}>
                {`${(() => {
                  const hour = new Date().getHours();
                  if (hour < 12) return 'Good Morning';
                  if (hour < 17) return 'Good Afternoon';
                  return 'Good Evening';
                })()}${user?.name ? `, ${user.name}` : ''}`}
              </Text>
              <Text style={styles.dateText}>{dateString}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.locationCircle}
            onPress={() => navigation.navigate('Notifications' as any)}
          >
            <Text style={{ fontSize: 18 }}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search your services"
            placeholderTextColor="#666"
            style={styles.searchInput}
          />
          <Text style={styles.searchIcon}>🔍</Text>
        </View>

        {/* Sliding Promotional Banners */}
        <View style={styles.bannerWrapper}>
          <FlatList
            ref={scrollRef}
            data={BANNERS}
            renderItem={renderBanner}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / (width - 40));
              setActiveSlide(newIndex);
              startAutoSlide();
            }}
            onScrollBeginDrag={() => stopAutoSlide()}
            keyExtractor={(item) => item.id}
          />
          <View style={styles.pagination}>
            {BANNERS.map((_, i) => (
              <View key={i} style={[styles.dot, activeSlide === i && styles.activeDot]} />
            ))}
          </View>
        </View>

        {/* Services Section */}
        <Text style={styles.sectionTitle}>Services</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.servicesScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.serviceCard,
                selectedCategory === cat.id && styles.serviceCardActive
              ]}
              onPress={() => {
                loadServicesByCategory(cat.id);
                navigation.navigate('VehicleSelection', { category: cat.id });
              }}
            >
              <Text style={styles.serviceIcon}>{cat.icon}</Text>
              <Text style={styles.serviceTitle}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Exclusive Offers Section */}
        {(liveOffers.length > 0 || OFFERS.length > 0) && (
          <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Exclusive Offers</Text>
        )}
        {liveOffers.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {liveOffers.map((offer: any, idx: number) => {
              const bgImages = [OFFER_1, OFFER_2];
              const bgImage = bgImages[idx % bgImages.length];
              const isUsed = usedOfferIds.has(offer._id);

              return (
                <ImageBackground
                  key={offer._id}
                  source={bgImage}
                  style={[styles.liveOfferCard, isUsed && { opacity: 0.6 }]}
                  imageStyle={{ borderRadius: 18 }}
                >
                  <View style={[styles.liveOfferOverlay, isUsed && { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
                    <View style={styles.liveOfferBadge}>
                      <Text style={styles.liveOfferDiscount}>
                        {offer.discountType === 'percentage' ? `${offer.discount}% OFF` : `₹${offer.discount} OFF`}
                      </Text>
                    </View>

                    {isUsed && (
                      <View style={{ position: 'absolute', top: '40%', left: 0, right: 0, alignItems: 'center' }}>
                        <View style={{ backgroundColor: '#1a1a1a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#333' }}>
                          <Text style={{ color: '#aaa', fontWeight: 'bold', fontSize: 13 }}>✓ Already Used</Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.liveOfferFooter}>
                      <Text style={[styles.liveOfferTitle, isUsed && { color: '#888' }]} numberOfLines={2}>{offer.offerTitle}</Text>
                      <Text style={[styles.offerShop, isUsed && { color: '#555' }]} numberOfLines={1}>🏪 {offer.shopName}</Text>
                      <Text style={[styles.offerExpiry, isUsed && { color: '#555' }]}>Expires: {new Date(offer.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                    </View>
                  </View>
                </ImageBackground>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.offersGrid}>
            {OFFERS.map(offer => (
              <ImageBackground
                key={offer.id}
                source={offer.image}
                style={styles.offerCardNew}
                imageStyle={{ borderRadius: 20 }}
              >
                <View style={styles.offerOverlay}>
                  <View style={styles.offerBadge}>
                    <Text style={styles.badgeText}>{offer.title}</Text>
                  </View>
                  <View style={styles.offerFooter}>
                    <Text style={styles.offerSubtitle}>{offer.subtitle}</Text>
                  </View>
                </View>
              </ImageBackground>
            ))}
          </View>
        )}
      </ScrollView>
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
    marginTop: 50,
    marginBottom: 15,
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
    borderWidth: 1,
    borderColor: '#444',
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
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
    marginTop: 2,
  },
  locationCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  badge: {
    position: 'absolute',
    top: -4,
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
  searchContainer: {
    backgroundColor: '#111',
    borderRadius: 15,
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#222',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  searchIcon: {
    fontSize: 18,
    color: '#666',
  },
  bannerWrapper: {
    marginBottom: 35,
  },
  banner: {
    borderRadius: 30,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    height: 180,
    position: 'relative',
    // overflow: 'hidden', // Allowed bleed as per screenshot
  },
  bannerContent: {
    flex: 1.2,
    zIndex: 10,
  },
  bannerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 20,
  },
  bannerButton: {
    backgroundColor: '#f28b2c',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bannerRightImages: {
    flex: 1,
    position: 'relative',
    height: '100%',
  },
  floatImg1: { width: 75, height: 75, borderRadius: 37.5, position: 'absolute', bottom: -10, left: -15, borderWidth: 1.5, borderColor: '#fff', zIndex: 6 },
  floatImg2: { width: 45, height: 45, borderRadius: 22.5, position: 'absolute', top: 5, left: 3, borderWidth: 1.5, borderColor: '#fff', zIndex: 5 },
  floatImg3: { width: 65, height: 65, borderRadius: 32.5, position: 'absolute', top: -20, right: 25, borderWidth: 1.5, borderColor: '#fff', zIndex: 4 },
  floatImg4: { width: 35, height: 35, borderRadius: 17.5, position: 'absolute', top: 60, right: 50, borderWidth: 1.5, borderColor: '#fff', zIndex: 3 },
  floatImg5: { width: 40, height: 40, borderRadius: 20, position: 'absolute', top: 35, right: -15, borderWidth: 1.5, borderColor: '#fff', zIndex: 2 },
  floatImg6: { width: 55, height: 55, borderRadius: 27.5, position: 'absolute', bottom: -5, right: -15, borderWidth: 1.5, borderColor: '#fff', zIndex: 1 },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
    backgroundColor: '#f28b2c',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 20,
  },
  servicesScroll: {
    flexDirection: 'row',
  },
  serviceCard: {
    width: 180,
    height: 60,
    backgroundColor: '#000',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  serviceCardActive: {
    borderColor: '#f28b2c',
    backgroundColor: '#0a0a0a',
  },
  serviceIcon: {
    fontSize: 22,
    marginRight: 17, // Added 5px padding/margin right
  },
  serviceTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  offersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  offerCardNew: {
    width: (width - 55) / 2,
    height: 240,
    overflow: 'hidden',
  },
  offerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
    padding: 15,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f28b2c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  offerFooter: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 12,
  },
  offerSubtitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Live offer card styles
  liveOfferCard: {
    width: 200,
    height: 240,
    borderRadius: 18,
    marginRight: 14,
    overflow: 'hidden',
  },
  liveOfferOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'space-between',
    padding: 14,
  },
  liveOfferBadge: {
    backgroundColor: '#f28b2c',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveOfferDiscount: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
  },
  liveOfferFooter: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12,
    padding: 10,
  },
  liveOfferTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 5,
    lineHeight: 18,
  },
  offerShop: {
    color: '#ccc',
    fontSize: 11,
    marginBottom: 3,
  },
  offerExpiry: {
    color: '#aaa',
    fontSize: 10,
  },
});

export default HomeScreen;
