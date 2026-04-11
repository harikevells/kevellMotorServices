import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../constants/theme';
import api, { SafeStorage, updateProfile, uploadAvatar } from '../services/api';
import { useVendorNav } from './VendorSidebarNavigator';

const { width } = Dimensions.get('window');

const VendorProfile = () => {
  const navigation = useNavigation<any>();
  const { setActiveTab } = useVendorNav();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Edit State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Other',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    }
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchStats()]);
    setLoading(false);
  };

  const fetchProfile = async () => {
    try {
      const res: any = await api.get('/auth/profile');
      if (res.success) {
        setUser(res.user);
        setEditForm({
          name: res.user.name || '',
          email: res.user.email || '',
          phone: res.user.phone || '',
          gender: res.user.gender || 'Other',
          address: {
            street: res.user.address?.street || '',
            city: res.user.address?.city || '',
            state: res.user.address?.state || '',
            pincode: res.user.address?.pincode || '',
            country: res.user.address?.country || 'India'
          }
        });
      }
    } catch (e) {
      console.warn('Profile fetch error:', e);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const currentYear = new Date().getFullYear();
      const res: any = await api.get(`/vendor/orders/statistics?year=${currentYear}`);
      if (res.success) {
        setStats(res.statistics);
      }
    } catch (e) {
      console.warn('Stats fetch error:', e);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await SafeStorage.removeItem('token');
          await SafeStorage.removeItem('user');
          // Navigate to Login and reset stack
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            })
          );
        },
      },
    ]);
  };

  const handleUpdateProfile = async () => {
    if (!editForm.name || !editForm.email) {
      Alert.alert('Error', 'Name and Email are required');
      return;
    }
    try {
      setUpdating(true);
      const res: any = await updateProfile(editForm);
      if (res.success) {
        setUser(res.user);
        setEditModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (e: any) {
      Alert.alert('Update Failed', e.toString());
    } finally {
      setUpdating(false);
    }
  };

  const handlePickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
    });

    if (result.assets && result.assets[0]) {
      const photo = result.assets[0];
      const formData = new FormData();
      // Use 'avatar' field name as required by backend
      formData.append('avatar', {
        uri: photo.uri,
        type: photo.type,
        name: photo.fileName || 'avatar.jpg',
      } as any);

      try {
        setUpdating(true);
        const res: any = await uploadAvatar(formData);
        if (res.success) {
          setUser({ ...user, profileImage: res.profileImage });
          Alert.alert('Success', 'Avatar updated!');
        }
      } catch (e: any) {
        Alert.alert('Upload Error', e.toString());
      } finally {
        setUpdating(false);
      }
    }
  };

  const StatCard = ({ label, value, color, isActive }: any) => (
    <View style={[styles.statCard, isActive && { backgroundColor: '#B8A9E6' }]}>
      <Text style={[styles.statValue, isActive && { color: '#FFF' }]}>{value || '0'}</Text>
      <Text style={[styles.statLabel, isActive && { color: '#FFF' }]}>{label}</Text>
    </View>
  );

  const ListItem = ({ title, subtitle, icon, onPress }: any) => (
    <TouchableOpacity style={styles.listItem} onPress={onPress}>
      <View style={styles.listIconContainer}>
        <Text style={styles.listIconEmoji}>{icon}</Text>
      </View>
      <View style={styles.listTextContainer}>
        <Text style={styles.listTitle}>{title}</Text>
        <Text style={styles.listSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B4D6B" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setActiveTab('Dashboard')}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileInfoSection}>
          <View style={styles.avatarWrapper}>
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
              <View style={styles.avatarContainer}>
                {user?.profileImage ? (
                  <Image source={{ uri: `http://192.168.0.137:5000${user.profileImage}` }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarPlaceholder}>{user?.name?.charAt(0) || 'V'}</Text>
                )}
                <View style={styles.editBadge}>
                  <Text style={styles.editBadgeText}>✎</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard label="Active" style={styles.statCard1} value={stats?.totalOrders || 0} isActive />
          <StatCard label="Pending" style={styles.statCard1} value={stats?.pendingOrders || 0} />
          <StatCard label="Complete" style={styles.statCard1} value={stats?.completedOrders || 0} />
        </View>

        {/* Menu Section */}
        <View style={styles.menuCard}>
          <ListItem
            title="Edit Profile"
            subtitle="Update your personal details"
            icon="✏️"
            onPress={() => setEditModalVisible(true)}
          />
          <View style={styles.divider} />
          <ListItem
            title="Order History"
            subtitle="View all past and current orders"
            icon="🕒"
            onPress={() => setActiveTab('Orders')}
          />
          <View style={styles.divider} />
          <ListItem
            title="Notifications"
            subtitle="Mute, Push, Email"
            icon="🔔"
            onPress={() => { }}
          />
          <View style={styles.divider} />
          <ListItem
            title="Logout"
            subtitle="Sign out of your account"
            icon="🚪"
            onPress={handleLogout}
          />
        </View>
      </ScrollView>

      {/* Expanded Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.closeModal}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalFormScroll}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editForm.name}
                onChangeText={(t) => setEditForm({ ...editForm, name: t })}
                placeholder="Name"
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={editForm.email}
                onChangeText={(t) => setEditForm({ ...editForm, email: t })}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={editForm.phone}
                onChangeText={(t) => setEditForm({ ...editForm, phone: t })}
                placeholder="Phone"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {['Male', 'Female', 'Other'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, editForm.gender === g && styles.genderBtnActive]}
                    onPress={() => setEditForm({ ...editForm, gender: g })}
                  >
                    <Text style={[styles.genderText, editForm.gender === g && styles.genderTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionDivider}>Address Details</Text>

              <Text style={styles.inputLabel}>Street / Area</Text>
              <TextInput
                style={styles.input}
                value={editForm.address.street}
                onChangeText={(t) => setEditForm({ ...editForm, address: { ...editForm.address, street: t } })}
                placeholder="Street"
              />

              <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.address.city}
                    onChangeText={(t) => setEditForm({ ...editForm, address: { ...editForm.address, city: t } })}
                    placeholder="City"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>State</Text>
                  <TextInput
                    style={styles.input}
                    value={editForm.address.state}
                    onChangeText={(t) => setEditForm({ ...editForm, address: { ...editForm.address, state: t } })}
                    placeholder="State"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Pincode</Text>
              <TextInput
                style={styles.input}
                value={editForm.address.pincode}
                onChangeText={(t) => setEditForm({ ...editForm, address: { ...editForm.address, pincode: t } })}
                placeholder="Pincode"
                keyboardType="numeric"
              />

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile} disabled={updating}>
                {updating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  iconBtn: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  statCard1: {
    width: '100%',
    // height: 110,

  },
  backArrow: { fontSize: 24, color: '#333' },
  logoutIcon: { fontSize: 24, color: '#333' },
  scroll: { paddingBottom: 40 },
  profileInfoSection: { alignItems: 'center', marginTop: 10 },
  avatarWrapper: { marginBottom: 20 },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...SHADOWS.medium,
  },
  avatarImage: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: { fontSize: 40, fontWeight: 'bold', color: '#1B4D6B' },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1B4D6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  editBadgeText: { color: '#FFF', fontSize: 14 },
  userName: { fontSize: 26, fontWeight: '800', color: '#1A1A1A', width: '100%', textAlign: 'center' },
  userEmail: { fontSize: 14, color: '#A0A0A0', marginTop: 5, width: '100%', textAlign: 'center' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 30,
  },
  statCard: {
    width: (width - 60) / 3,
    height: 110,
    backgroundColor: '#F1F3F9',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
  statLabel: { fontSize: 14, color: '#A0A0A0', marginTop: 5, width: '100%', textAlign: 'center' },
  menuCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 40,
    borderRadius: 30,
    padding: 10,
    ...SHADOWS.medium,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  listIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F9FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listIconEmoji: { fontSize: 22 },
  listTextContainer: { flex: 1, marginLeft: 15 },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  listSubtitle: { fontSize: 13, color: '#A0A0A0', marginTop: 2 },
  chevron: { fontSize: 28, color: '#E0E0E0', fontWeight: '300' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 20 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1B4D6B' },
  closeModal: { fontSize: 20, color: '#999' },
  modalFormScroll: { flex: 1 },
  sectionDivider: { fontSize: 16, fontWeight: 'bold', color: '#1B4D6B', marginTop: 25, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginTop: 15, marginBottom: 8 },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 16,
    color: '#333',
  },
  inputRow: { flexDirection: 'row' },
  genderRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  genderBtn: {
    flex: 1,
    height: 45,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#eee',
  },
  genderBtnActive: { backgroundColor: '#1B4D6B', borderColor: '#1B4D6B' },
  genderText: { fontSize: 14, color: '#666', fontWeight: '600' },
  genderTextActive: { color: '#FFF' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
  cancelBtn: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { color: '#FF5252', fontSize: 16, fontWeight: '600' },
  saveBtn: {
    flex: 2,
    height: 50,
    backgroundColor: '#1B4D6B',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    ...SHADOWS.light,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default VendorProfile;
