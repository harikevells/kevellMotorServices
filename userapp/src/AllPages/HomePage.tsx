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
import { SafeStorage, fetchProfile, fetchServices, fetchUserVehicles } from '../services/api';
import { getImageUrl } from '../constants/config';

const { width } = Dimensions.get('window');

// Import banner images (Keeping original imports as requested)
const BIKE_IMG = require('../assets/banners/bike.png');
const CAR_IMG = require('../assets/banners/car.png');
const HEAVY_IMG = require('../assets/banners/heavy.png');

// Unique images for the banner floating circles
const CIRCLE_IMG_1 = "https://images.unsplash.com/photo-1558981403-c5f91cbba527?q=80&w=200&auto=format&fit=crop"; // Bike
const CIRCLE_IMG_2 = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=200&auto=format&fit=crop"; // Car
const CIRCLE_IMG_3 = "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?q=80&w=200&auto=format&fit=crop"; // Bike 2
const CIRCLE_IMG_4 = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=200&auto=format&fit=crop"; // Car 2

const CATEGORIES = [
  { id: 'General Service', title: 'Periodic Service', icon: '🛠️', color: '#111' },
  { id: 'Battery', title: 'Battery Health', icon: '⚡', color: '#111' },
  { id: 'Engine', title: 'Brake Check', icon: '⚙️', color: '#111' },
  { id: 'RSA', title: 'Roadside Asst.', icon: '🆘', color: '#111' },
];

const OFFERS = [
  {
    id: '1',
    title: 'Free Checkup',
    subtitle: 'On your first service',
    image: 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?q=80&w=500&auto=format&fit=crop',
    discount: 'FREE',
  },
  {
    id: '2',
    title: '20% Offer',
    subtitle: 'On battery repair',
    image: 'https://images.unsplash.com/photo-1597766353915-d729e24f468b?q=80&w=500&auto=format&fit=crop',
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
    img: BIKE_IMG,
  },
  {
    id: '2',
    title: 'Car First Service checked for 2999 only!',
    price: '2999',
    type: 'Car',
    color: '#ff8c00',
    img: CAR_IMG,
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
  const scrollRef = useRef<FlatList>(null);
  const intervalRef = useRef<any>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadUser();
    }, [])
  );

  useEffect(() => {
    loadServicesByCategory('General Service');
    startAutoSlide();
    return () => stopAutoSlide();
  }, []);

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
         {/* Circular Floating Images with staggered alignment */}
         <Image source={{ uri: CIRCLE_IMG_1 }} style={styles.floatImg1} />
         <Image source={{ uri: CIRCLE_IMG_2 }} style={styles.floatImg2} />
         <Image source={{ uri: CIRCLE_IMG_3 }} style={styles.floatImg3} />
         <Image source={{ uri: CIRCLE_IMG_4 }} style={styles.floatImg4} />
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
               <Text style={styles.greetingTitle}>Good Morning</Text>
               <Text style={styles.dateText}>{dateString}</Text>
            </View>
          </View>
          <TouchableOpacity 
             style={styles.locationCircle}
             onPress={() => navigation.navigate('Profile' as any)}
          >
            <Text style={{fontSize: 18}}>📍</Text>
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
        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Exclusive Offers</Text>
        <View style={styles.offersGrid}>
           {OFFERS.map(offer => (
              <ImageBackground 
                key={offer.id}
                source={{ uri: offer.image }} 
                style={styles.offerCardNew}
                imageStyle={{ borderRadius: 20 }}
              >
                <View style={styles.offerOverlay}>
                  <View style={styles.offerBadge}>
                     <View style={styles.badgeIconBox}>
                        <Text style={{fontSize: 12, color: '#fff'}}>%</Text>
                     </View>
                     <Text style={styles.badgeText}>{offer.title}</Text>
                  </View>
                  <View style={styles.offerFooter}>
                     <Text style={styles.offerSubtitle}>{offer.subtitle}</Text>
                  </View>
                </View>
              </ImageBackground>
           ))}
        </View>
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
    marginTop: 20,
    marginBottom: 25,
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
    overflow: 'hidden',
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
  floatImg1: { width: 85, height: 85, borderRadius: 42.5, position: 'absolute', bottom: 0, left: 10, borderWidth: 3, borderColor: '#fff', zIndex: 5 },
  floatImg2: { width: 60, height: 60, borderRadius: 30, position: 'absolute', top: 5, right: 15, borderWidth: 3, borderColor: '#fff', zIndex: 4 },
  floatImg3: { width: 45, height: 45, borderRadius: 22.5, position: 'absolute', top: 50, left: 40, borderWidth: 2, borderColor: '#fff', zIndex: 3 },
  floatImg4: { width: 40, height: 40, borderRadius: 20, position: 'absolute', bottom: 45, right: 0, borderWidth: 2, borderColor: '#fff', zIndex: 2 },
  
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
    width: 160,
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
    marginRight: 12,
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
  badgeIconBox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
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
});

export default HomeScreen;
