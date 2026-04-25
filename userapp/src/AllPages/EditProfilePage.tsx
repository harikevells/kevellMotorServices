import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { COLORS, SHADOWS } from '../constants/theme';
import { SafeStorage, updateProfile, uploadAvatar } from '../services/api';
import { getImageUrl } from '../constants/config';
// --- Safer Import for Native Modules (Handles 'uncaught' errors if rebuild is missing) ---
let launchImageLibrary: any = null;
try {
  const pickerModule = require('react-native-image-picker');
  launchImageLibrary = pickerModule?.launchImageLibrary;
} catch (e) {
  console.warn('[NATIVE-MODULE-ERROR]: Image Picker package not found in node_modules');
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// --- Helper Components (Defined outside to prevent re-mounting on every keystroke) ---
const InputField = ({ label, value, onChangeText, keyboardType = 'default', placeholder }: any) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      placeholder={placeholder}
      placeholderTextColor="#999"
      autoCapitalize="sentences"
    />
  </View>
);

const EditProfilePage = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gender: 'Other',
    profileImage: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const storedUser = await SafeStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setFormData({
          name: user.name || '',
          phone: user.phone || '',
          gender: user.gender || 'Other',
          profileImage: user.profileImage || '',
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          pincode: user.address?.pincode || '',
        });
      }
    } catch (e) {
      console.error('Failed to load user for edit:', e);
    }
  };

  const handlePickImage = () => {
    // Definitive check for native bridge availability
    if (!launchImageLibrary || typeof launchImageLibrary !== 'function') {
      Alert.alert(
        'Bridge Problem',
        'Image Picker is not properly linked to the native app. You MUST run "npx react-native run-android" again to fix this.',
        [{ text: 'OK' }]
      );
      return;
    }

    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async (response: any) => {
      try {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Image Picker Error', response.errorMessage || 'Something went wrong while picking the image');
          return;
        }
        if (!response.assets || response.assets.length === 0) return;

        const asset = response.assets[0];
        const data = new FormData();
        data.append('avatar', {
          uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `avatar-${Date.now()}.jpg`,
        } as any);

        setUploading(true);
        const res: any = await uploadAvatar(data);
        if (res.success) {
          setFormData({ ...formData, profileImage: res.profileImage || '' });
          Alert.alert('Success', 'Profile picture updated instantly!');
        } else {
          Alert.alert('Server Error', `Avatar upload failed: ${res.message || 'Unknown error code'}`);
        }
      } catch (err: any) {
        console.error('[IMAGE-PICK-CRASH]:', err);
        // Better diagnostic alert for the 404 error
        const errorDetail = err?.response?.data?.message || err?.message || JSON.stringify(err);
        Alert.alert(
          'Upload Problem',
          `The server returned an error: ${errorDetail}\n\nTIP: If you see a 404, please RESTART your backend server terminal.`,
          [{ text: 'OK' }]
        );
      } finally {
        setUploading(false);
      }
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      Alert.alert('Error', 'Name and Phone are required');
      return;
    }

    setLoading(true);
    try {
      // Synthesize strict address for backend to ensure 100% sync
      const addressPayload = {
        street: (formData.street || '').trim(),
        city: (formData.city || '').trim(),
        state: (formData.state || '').trim(),
        pincode: (formData.pincode || '').trim(),
        country: 'India'
      };

      const updateData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender,
        profileImage: formData.profileImage, // Keep as relative path from server
        address: addressPayload
      };

      console.log('[SYNC-DEBUG] 📤 Sending Payload:', JSON.stringify(updateData));
      const res: any = await updateProfile(updateData);

      if (res.success) {
        // Essential: Update local cache so OTHER pages see the change immediately
        await SafeStorage.setItem('user', JSON.stringify(res.user));
        Alert.alert('Success', 'Profile details saved successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error: any) {
      console.error('[SYNC-ERROR] ❌ Save Failed:', error);
      Alert.alert('Save Failed', error?.message || 'Could not update profile. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fullImageUrl = getImageUrl(formData.profileImage);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header - Simpler now */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>

          {/* Avatar Section */}
          <View style={styles.avatarPickerContainer}>
            <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrapper}>
              {fullImageUrl ? (
                <Image source={{ uri: fullImageUrl }} style={styles.avatarImage as any} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>{formData.name?.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.editIconBadge}>
                <Text style={styles.editIconText}>📷</Text>
              </View>
            </TouchableOpacity>
            {uploading && <ActivityIndicator style={{ marginTop: 10 }} color="#1B5E20" />}
          </View>

          <Text style={styles.sectionTitle}>Personal Details</Text>
          <InputField
            label="Full Name"
            value={formData.name}
            onChangeText={(t: string) => setFormData({ ...formData, name: t })}
            placeholder="Enter your name"
          />
          <InputField
            label="Phone Number"
            value={formData.phone}
            onChangeText={(t: string) => setFormData({ ...formData, phone: t })}
            keyboardType="phone-pad"
            placeholder="Enter phone number"
          />

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {['Male', 'Female', 'Other'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtn, formData.gender === g && styles.genderBtnActive]}
                  onPress={() => setFormData({ ...formData, gender: g })}
                >
                  <Text style={[styles.genderBtnText, formData.gender === g && styles.genderBtnTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Address Details</Text>
          <InputField
            label="Street / Area"
            value={formData.street}
            onChangeText={(t: string) => setFormData({ ...formData, street: t })}
            placeholder="Street name"
          />
          <InputField
            label="City"
            value={formData.city}
            onChangeText={(t: string) => setFormData({ ...formData, city: t })}
            placeholder="City"
          />
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <InputField
                label="State"
                value={formData.state}
                onChangeText={(t: string) => setFormData({ ...formData, state: t })}
                placeholder="State"
              />
            </View>
            <View style={{ flex: 1 }}>
              <InputField
                label="Pincode"
                value={formData.pincode}
                onChangeText={(t: string) => setFormData({ ...formData, pincode: t })}
                keyboardType="numeric"
                placeholder="600xxx"
              />
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Sticky Save Button at Bottom */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 40,
    backgroundColor: '#FFF',
    ...SHADOWS.light,
    zIndex: 10,
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
  },
  form: {
    padding: 20,
  },
  avatarPickerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  avatarWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...SHADOWS.medium,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#1B5E20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#FFF',
    fontSize: 40,
    fontWeight: 'bold',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1B5E20',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconText: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  row: {
    flexDirection: 'row',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  genderBtnActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#1B5E20',
  },
  genderBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  genderBtnTextActive: {
    color: '#1B5E20',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  saveButton: {
    backgroundColor: '#1B5E20',
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default EditProfilePage;
