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
  ImageBackground,
  StatusBar,
  Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../constants/theme';
import api, { SafeStorage, updateProfile, uploadAvatar } from '../services/api';
import { useVendorNav } from './VendorSidebarNavigator';
import { getImageUrl } from '../constants/config';

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
      const [authRes, vendorRes]: any = await Promise.all([
        api.get('/auth/profile'),
        api.get('/vendor/profile')
      ]);

      if (authRes.success) {
        // Merge vendor details into user for easy access in UI
        const mergedUser = {
          ...authRes.user,
          ...(vendorRes?.success ? vendorRes.vendor : {})
        };
        setUser(mergedUser);
        setEditForm({
          name: mergedUser.name || '',
          email: mergedUser.email || '',
          phone: mergedUser.phone || '',
          gender: mergedUser.gender || 'Other',
          address: {
            street: mergedUser.address?.street || '',
            city: mergedUser.address?.city || '',
            state: mergedUser.address?.state || '',
            pincode: mergedUser.address?.pincode || '',
            country: mergedUser.address?.country || 'India'
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
    <View style={styles.container}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

        {/* Custom Header */}
        <View style={[styles.customHeader, { justifyContent: 'center' }]}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Profile Info */}
          <View style={styles.profileInfoSection}>
            <View style={styles.avatarWrapper}>
              <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
                <View style={styles.avatarContainer}>
                  {user?.profileImage ? (
                    <Image source={{ uri: getImageUrl(user.profileImage) as string }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarPlaceholder}>{user?.name?.charAt(0) || 'V'}</Text>
                  )}
                  <TouchableOpacity style={styles.editBadge} onPress={() => setEditModalVisible(true)}>
                    <Text style={styles.editBadgeText}>✎</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{user?.name || 'Vendor Name'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'vendor@example.com'}</Text>
          </View>

          {/* Profile Information Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Profile Information</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Owner Name</Text>
              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>🪪</Text>
                <TextInput
                  style={styles.inputText}
                  value={user?.name || ''}
                  editable={false}
                  placeholder="Owner Name"
                  placeholderTextColor="#888"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Shop Name</Text>
              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>🏪</Text>
                <TextInput
                  style={styles.inputText}
                  value={user?.shopName || user?.businessName || ''}
                  editable={false}
                  placeholder="Shop Name"
                  placeholderTextColor="#888"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Your Email</Text>
              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.inputText}
                  value={user?.email || ''}
                  editable={false}
                  placeholder="Email"
                  placeholderTextColor="#888"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>📞</Text>
                <TextInput
                  style={styles.inputText}
                  value={user?.phone || ''}
                  editable={false}
                  placeholder="Phone"
                  placeholderTextColor="#888"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Street / Area</Text>
              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>🛣️</Text>
                <TextInput
                  style={styles.inputText}
                  value={user?.address?.street || ''}
                  editable={false}
                  placeholder="Street"
                  placeholderTextColor="#888"
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row' }}>
              <View style={[styles.inputWrapper, { flex: 1, marginRight: 5 }]}>
                <Text style={styles.fieldLabel}>District</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.inputIcon}>🏙️</Text>
                  <TextInput
                    style={styles.inputText}
                    value={user?.address?.city || ''}
                    editable={false}
                    placeholder="District"
                    placeholderTextColor="#888"
                  />
                </View>
              </View>

              <View style={[styles.inputWrapper, { flex: 1, marginLeft: 5 }]}>
                <Text style={styles.fieldLabel}>State</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.inputIcon}>🗺️</Text>
                  <TextInput
                    style={styles.inputText}
                    value={user?.address?.state || ''}
                    editable={false}
                    placeholder="State"
                    placeholderTextColor="#888"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Pincode</Text>
              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>📮</Text>
                <TextInput
                  style={styles.inputText}
                  value={user?.address?.pincode || ''}
                  editable={false}
                  placeholder="Pincode"
                  placeholderTextColor="#888"
                />
              </View>
            </View>
          </View>

          {/* Business Information Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Business Information</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>GST Number</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={[styles.inputText, { marginLeft: 0 }]}
                  value={user?.gstNumber || user?.gstNo || ''}
                  editable={false}
                  placeholder="GSTINXXXXXXXXX"
                  placeholderTextColor="#888"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Service Type</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={[styles.inputText, { marginLeft: 0 }]}
                  value={user?.serviceType || user?.serviceCategory || 'Bike Repair & Maintenance'}
                  editable={false}
                  placeholder="Service Type"
                  placeholderTextColor="#888"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 15,
  },
  backBtn: { padding: 10, marginLeft: -10 },
  backBtnText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  scroll: { paddingBottom: 10, paddingHorizontal: 20 },
  profileInfoSection: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
  avatarWrapper: { marginBottom: 15 },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { fontSize: 36, fontWeight: 'bold', color: '#FFF' },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF6C00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  editBadgeText: { color: '#FFF', fontSize: 14 },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#FFF', width: '100%', textAlign: 'center' },
  userEmail: { fontSize: 14, color: '#AAA', marginTop: 5, width: '100%', textAlign: 'center' },

  sectionContainer: { marginTop: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 15 },
  inputWrapper: { marginBottom: 15 },
  fieldLabel: { color: '#FFF', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 15,
  },
  inputIcon: { fontSize: 16, marginRight: 10, color: '#FFF' },
  inputText: { flex: 1, color: '#FFF', fontSize: 14 },
  logoutBtn: {
    marginTop: 30,
    backgroundColor: 'rgba(255,50,50,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,50,50,0.5)',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtnText: { color: '#FF5252', fontSize: 16, fontWeight: 'bold' },

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
    backgroundColor: '#EF6C00',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    ...SHADOWS.light,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default VendorProfile;
