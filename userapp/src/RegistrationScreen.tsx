import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { COLORS, SIZES, SHADOWS } from './constants/theme';
import { register, SafeStorage } from './services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const RegistrationScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [role, setRole] = useState<'user' | 'vendor'>('user');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', // For User: Full Name, For Vendor: Owner Name
    shopName: '',
    email: '',
    password: '',
    phone: '',
    gender: 'Male', // Default
    street: '', // For User: Street, For Vendor: Location
    city: '',
    state: '',
    pincode: '',
  });

  const handleRegister = async () => {
    const { name, email, password, phone, street, city, state, pincode, shopName } = form;

    if (role === 'user') {
      if (!name || !email || !password || !phone || !street || !city || !state || !pincode) {
        Alert.alert('Error', 'Please fill all fields');
        return;
      }
    } else {
      // Vendor validation
      if (!shopName || !name || !email || !password || !phone || !street) {
        Alert.alert('Error', 'Please fill all vendor required fields (Shop Name, Owner Name, Email, Password, Phone, Location)');
        return;
      }
    }

    if (phone.length !== 10) {
      Alert.alert('Error', 'Invalid phone number');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...form,
        role,
        ownerName: role === 'vendor' ? name : undefined,
        location: role === 'vendor' ? street : undefined,
      };

      const res: any = await register(payload);

      if (res.token) {
        await SafeStorage.setItem('token', res.token);
        await SafeStorage.setItem('user', JSON.stringify(res.user));
        Alert.alert('Success', 'Registration successful!', [
          { 
            text: 'OK', 
            onPress: () => {
              if (res.user.role === 'vendor') {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'VendorDrawer' }],
                });
              } else {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'HomeTabs' }],
                });
              }
            }
          }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.formSection}>
            <Text style={styles.label}>Register As</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleOption, role === 'user' && styles.roleSelected]}
                onPress={() => setRole('user')}
              >
                <Text style={[styles.roleText, role === 'user' && styles.roleTextSelected]}>User</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleOption, role === 'vendor' && styles.roleSelected]}
                onPress={() => setRole('vendor')}
              >
                <Text style={[styles.roleText, role === 'vendor' && styles.roleTextSelected]}>Vendor</Text>
              </TouchableOpacity>
            </View>

            {role === 'vendor' && (
              <>
                <Text style={styles.label}>Shop Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter shop name"
                  placeholderTextColor="#555"
                  value={form.shopName}
                  onChangeText={(text) => setForm({ ...form, shopName: text })}
                />
              </>
            )}

            <Text style={styles.label}>{role === 'vendor' ? 'Owner Name' : 'Full Name'}</Text>
            <TextInput
              style={styles.input}
              placeholder={role === 'vendor' ? "Enter owner name" : "Enter full name"}
              placeholderTextColor="#555"
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="example@mail.com"
              placeholderTextColor="#555"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Minimum 6 characters"
              placeholderTextColor="#555"
              secureTextEntry
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
            />

            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="10-digit mobile number"
                placeholderTextColor="#555"
                keyboardType="phone-pad"
                maxLength={10}
                value={form.phone}
                onChangeText={(text) => setForm({ ...form, phone: text })}
              />
            </View>

            {role === 'user' && (
              <>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderContainer}>
                  {['Male', 'Female', 'Other'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderOption, form.gender === g && styles.genderSelected]}
                      onPress={() => setForm({ ...form, gender: g })}
                    >
                      <Text style={[styles.genderText, form.gender === g && styles.genderTextSelected]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.label}>{role === 'vendor' ? 'Location' : 'Address Details'}</Text>
            <TextInput
              style={styles.input}
              placeholder={role === 'vendor' ? "Enter shop location" : "Street / Area"}
              placeholderTextColor="#555"
              value={form.street}
              onChangeText={(text) => setForm({ ...form, street: text })}
            />

            {role === 'user' && (
              <>
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 10 }]}
                    placeholder="City"
                    placeholderTextColor="#555"
                    value={form.city}
                    onChangeText={(text) => setForm({ ...form, city: text })}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 10 }]}
                    placeholder="State"
                    placeholderTextColor="#555"
                    value={form.state}
                    onChangeText={(text) => setForm({ ...form, state: text })}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Pincode"
                  placeholderTextColor="#000"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={form.pincode}
                  onChangeText={(text) => setForm({ ...form, pincode: text })}
                />
              </>
            )}
          </View>

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.registerButtonText}>Register Now</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  formSection: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.light,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#EEE',
    fontSize: 15,
    color: '#333',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  countryCode: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#F5F5F5',
  },
  roleSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  roleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  roleTextSelected: {
    color: COLORS.primary,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#F5F5F5',
  },
  genderSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  genderText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  genderTextSelected: {
    color: COLORS.primary,
  },
  row: {
    flexDirection: 'row',
    marginTop: 10,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  disabledButton: {
    backgroundColor: COLORS.grey,
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default RegistrationScreen;
