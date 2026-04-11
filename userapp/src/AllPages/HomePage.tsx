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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { EVCar } from '../assets/EVIcons';
import { SafeStorage, fetchProfile, fetchServices, fetchUserVehicles } from '../services/api';

const { width } = Dimensions.get('window');

// Import banner images
const BIKE_IMG = require('../assets/banners/bike.png');
const CAR_IMG = require('../assets/banners/car.png');
const HEAVY_IMG = require('../assets/banners/heavy.png');

const CATEGORIES = [
  { id: 'General Service', title: 'General\nService', icon: '🛠️', color: '#E8F5E9' },
  { id: 'Battery', title: 'Battery &\nCharging', icon: '⚡', color: '#FFFDE7' },
  { id: 'Engine', title: 'Engine &\nBrakes', icon: '⚙️', color: '#FFEBEE' },
  { id: 'RSA', title: 'Roadside\nAsst.', icon: '🆘', color: '#E3F2FD' },
  { id: 'AC', title: 'AC &\nHealth', icon: '❄️', color: '#E0F7FA' },
  { id: 'Body', title: 'Body &\nWash', icon: '🧼', color: '#F3E5F5' },
];

const BANNERS = [
  {
    id: '2',
    title: 'Car First Service',
    price: '2999',
    type: 'Car',
    color: '#0D47A1', // Royal Blue
    img: CAR_IMG,
  },
  {
    id: '1',
    title: 'Bike First Service',
    price: '999',
    type: 'Bike',
    color: '#0d7749ff',
    img: BIKE_IMG,
  },
  {
    id: '3',
    title: 'Heavy Vehicle Service',
    price: '5999',
    type: 'Heavy',
    color: '#4A148C', // Rich Purple
    img: HEAVY_IMG,
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

  // Reload user when coming back to home
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
      // 1. Quick load from storage for immediate feel
      const storedUser = await SafeStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // 2. Fetch fresh data from API to ensure avatar/details are latest
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
    }, 3000);
  };

  const stopAutoSlide = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const loadServicesByCategory = async (category: string) => {
    try {
      setLoadingServices(true);
      setSelectedCategory(category);
      const res: any = await fetchServices(category, 'car', 'electric');
      if (res.success) {
        setServices(res.data.slice(0, 4));
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleStartBooking = (type?: string) => {
    navigation.navigate('VehicleSelection', { category: selectedCategory });
  };

  const renderBanner = ({ item }: { item: typeof BANNERS[0] }) => (
    <View style={[styles.banner, { backgroundColor: item.color, width: width - 40, marginHorizontal: 0 }]}>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerText}>
          {item.title}{'\n'}checked for{'\n'}₹{item.price} only!
        </Text>
        <TouchableOpacity
          style={styles.bannerButton}
          onPress={() => handleStartBooking(item.type)}
        >
          <Text style={styles.bannerButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.illustrationContainer}>
        <Image source={item.img} style={styles.bannerImage} resizeMode="contain" />
      </View>
    </View>
  );

  const profileImageUrl = user?.profileImage
    ? (user.profileImage.startsWith('http') ? user.profileImage : `http://192.168.0.138:5000${user.profileImage}`)
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingTitle}>Hello {user?.name?.split(' ')[0] || 'User'},</Text>
            <Text style={styles.greetingSubtitle}>Your vehicle is in good hands</Text>
          </View>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => navigation.navigate('Profile' as any)}
          >
            <View style={styles.avatarMini}>
              {profileImageUrl ? (
                <Image
                  source={{ uri: profileImageUrl }}
                  style={{ width: '100%', height: '100%', borderRadius: 19 }}
                />
              ) : (
                <Text style={styles.avatarMiniText}>{user?.name?.charAt(0) || 'U'}</Text>
              )}
            </View>
          </TouchableOpacity>
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
              startAutoSlide(); // Reset timer after manual swipe
            }}
            onScrollBeginDrag={() => stopAutoSlide()}
            keyExtractor={(item) => item.id}
          />
          <View style={styles.pagination}>
            {BANNERS.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, activeSlide === i && styles.activeDot]}
              />
            ))}
          </View>
        </View>

        {/* Categories Section - Renamed to All Vehicle Service */}
        <Text style={styles.sectionTitle}>All Vehicle Service</Text>
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              onPress={() => {
                loadServicesByCategory(cat.id);
                navigation.navigate('VehicleSelection', { category: cat.id });
              }}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: cat.color },
                  selectedCategory === cat.id && { borderWidth: 2, borderColor: COLORS.primary }
                ]}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
              </View>
              <Text
                style={[
                  styles.categoryTitle,
                  selectedCategory === cat.id && { color: COLORS.primary, fontWeight: '700' }
                ]}
              >
                {cat.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Offers Section */}
        <View style={styles.offerHeader}>
          <Text style={styles.sectionTitle}>Exclusive Offers</Text>
          <TouchableOpacity>
            <Text style={styles.seeMoreText}>See More</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.offerList}>
          <View style={[styles.offerCard, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.offerCardText}>FREE Checkup</Text>
            <Text style={styles.offerSubText}>On your first service</Text>
          </View>
          <View style={[styles.offerCard, { backgroundColor: '#FF6D00' }]}>
            <Text style={styles.offerCardText}>Flat 15% OFF</Text>
            <Text style={styles.offerSubText}>On Body Work & Detailing</Text>
          </View>
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
    marginTop: 40,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  locationButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  avatarMini: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#C8E6C9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniText: {
    color: '#1B5E20',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bannerWrapper: {
    marginBottom: 30,
  },
  banner: {
    borderRadius: 24,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    minHeight: 160,
    ...SHADOWS.medium,
  },
  bannerContent: {
    flex: 1,
    zIndex: 2,
  },
  bannerText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 25,
    marginBottom: 15,
  },
  bannerButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  illustrationContainer: {
    paddingRight: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 130,
    height: '10%',
  },
  bannerImage: {
    width: 140,
    height: 140,
    marginRight: 10,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CCC',
    marginHorizontal: 3,
  },
  activeDot: {
    width: 20,
    backgroundColor: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 15,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  categoryCard: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 65,
    height: 65,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryTitle: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeMoreText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  offerList: {
    // marginBottom: 30,
  },
  offerCard: {
    width: 260,
    height: 130,
    borderRadius: 24,
    marginRight: 15,
    padding: 20,
    justifyContent: 'center',
  },
  offerCardText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  offerSubText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 5,
  },
});

export default HomeScreen;
