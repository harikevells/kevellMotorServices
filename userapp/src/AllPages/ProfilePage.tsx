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
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { SafeStorage, fetchProfile } from '../services/api';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProfilePage = () => {
  const navigation = useNavigation<NavigationProp>();
  const [user, setUser] = useState<any>(null);

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

      const res: any = await fetchProfile();
      if (res.success) {
        setUser(res.user);
        await SafeStorage.setItem('user', JSON.stringify(res.user));
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
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

  const AddressItem = ({ title, address }: { title: string; address: string }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.addressTitleRow}>
          <View style={styles.pinIconSmall}>
            <Text style={{ fontSize: 13 }}>📍</Text>
          </View>
          <Text style={styles.addressTitle}>{title}</Text>
        </View>
        <View style={styles.addressActions}>
          <TouchableOpacity><Text style={styles.actionText}>✏️</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.actionText}>🗑️</Text></TouchableOpacity>
        </View>
      </View>
      <Text style={styles.addressContent}>{address}</Text>
    </View>
  );

  const MenuRow = ({ title, icon, color, onPress }: { title: string; icon: string; color?: string; onPress?: () => void }) => (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <View style={styles.menuIconBox}>
        <Text style={styles.menuIconText}>{icon}</Text>
      </View>
      <Text style={[styles.menuTitle, color ? { color } : null]}>{title}</Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  if (!user) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1B5E20" />
      <Text style={styles.loadingText}>Loading your profile...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background Gradient - Green Themed */}
      <View style={StyleSheet.absoluteFill}>
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="bg_grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#1B5E20" stopOpacity="0.9" />
              <Stop offset="0.3" stopColor="#E8F5E9" stopOpacity="1" />
              <Stop offset="1" stopColor="#F1F8E9" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#bg_grad)" />
        </Svg>
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity
            style={styles.settingsCircle}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.settingsIconBold}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Profile Card */}
          <View style={styles.profileTopContainer}>
            <View style={styles.avatarPillWrapper}>
              <View style={styles.avatarBorderOuter}>
                <View style={styles.avatarInternal}>
                  {user.profileImage ? (
                    <Image
                      source={{ uri: user.profileImage.startsWith('http') ? user.profileImage : `http://192.168.0.137:5000${user.profileImage}` }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <Text style={styles.avatarLetterBig}>{user.name?.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
              </View>
              <View style={styles.completionPill}>
                <Text style={styles.completionText}>100% Complete</Text>
              </View>
            </View>

            <View style={styles.userInfoSide}>
              <View style={styles.nameActionRow}>
                <Text style={styles.userNameText}>{user.name || 'User'}</Text>
                <TouchableOpacity>
                  {/* <Text style={styles.inlineEditIcon}>✏️</Text> */}
                </TouchableOpacity>
              </View>
              <Text style={styles.userEmailText}>{user.email?.toLowerCase() || 'user@example.com'}</Text>
            </View>
          </View>

          {/* Main Content Area */}
          <View style={styles.mainWhiteCard}>
            <Text style={styles.sectionLabel}>Address</Text>

            {/* Dynamic Address Item */}
            {user.address ? (
              <AddressItem
                title="Primary Address"
                address={`${user.address.street}, ${user.address.city}, ${user.address.state} - ${user.address.pincode}`}
              />
            ) : (
              <Text style={styles.emptyText}>No address provided.</Text>
            )}

            {/* Quick Menu Section */}
            <View style={styles.menuSection}>
              <MenuRow
                title="Your Booking"
                icon="📅"
                onPress={() => navigation.navigate('Bookings' as any)}
              />
              <View style={styles.menuDivider} />
              <MenuRow
                title="Notification"
                icon="🔔"
                onPress={() => navigation.navigate('Notifications' as any)}
              />
              <View style={styles.menuDivider} />
              <MenuRow title="Rating" icon="⭐" />
              <View style={styles.menuDivider} />
              <MenuRow title="Services" icon="🛠️" onPress={() => navigation.navigate('VehicleSelection', {})} />
              <View style={styles.menuDivider} />
              <MenuRow title="Logout" icon="🚪" color="#FF5252" onPress={handleLogout} />
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
  },
  loadingText: {
    marginTop: 10,
    color: '#2E7D32',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    paddingTop: 45,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  settingsCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIconBold: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  profileTopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    marginTop: 10,
    marginBottom: 40,
  },
  avatarPillWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  avatarBorderOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInternal: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    backgroundColor: '#C8E6C9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarLetterBig: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  completionPill: {
    position: 'absolute',
    bottom: -15,
    backgroundColor: '#388E3C', // Forest Green
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: '#FFF',
    ...SHADOWS.light,
  },
  completionText: {
    color: '#FFF',
    fontSize: 10,
    width: 79,
    fontWeight: '800',
  },
  userInfoSide: {
    marginLeft: 25,
    flex: 1,
  },
  nameActionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  userNameText: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
  },
  inlineEditIcon: {
    fontSize: 16,
    marginLeft: 10,
    color: COLORS.white,
  },
  userEmailText: {
    fontSize: 14,
    color: COLORS.white,
    marginTop: 4,
    fontWeight: '500',
    opacity: 0.9,
  },
  mainWhiteCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 25,
    ...SHADOWS.medium,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1B5E20',
    marginBottom: 20,
  },
  addressCard: {
    backgroundColor: '#F1F8E9',
    borderRadius: 20,
    padding: 15,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B5E20',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionText: {
    fontSize: 16,
  },
  addressContent: {
    fontSize: 13,
    color: '#4CAF50',
    lineHeight: 18,
    paddingLeft: 34,
    fontWeight: '500',
  },
  menuSection: {
    marginTop: 10,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  menuIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuIconText: {
    fontSize: 20,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  chevron: {
    fontSize: 24,
    color: '#CCC',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 57,
  },
  emptyText: {
    color: '#757575',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
});

export default ProfilePage;
