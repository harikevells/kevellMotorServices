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
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { COLORS, SIZES, SHADOWS } from './constants/theme';
import { register, SafeStorage } from './services/api';

const { width } = Dimensions.get('window');
const ORANGE = '#f28b2c';
const BG = '#060606';
const CARD_BG = '#111';
const INPUT_BG = '#1A1A1A';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const EyeIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

const EyeOffIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </Svg>
);

const RegistrationScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [role, setRole] = useState<'user' | 'vendor'>('user');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      if (!shopName || !name || !email || !password || !phone || !street || !city || !state || !pincode) {
        Alert.alert('Error', 'Please fill all vendor required fields');
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
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login', params: { role } }],
              });
            },
          },
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
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Minimum 6 characters"
                placeholderTextColor="#555"
                secureTextEntry={!showPassword}
                value={form.password}
                onChangeText={(text) => setForm({ ...form, password: text })}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                {showPassword ? <EyeIcon color={ORANGE} /> : <EyeOffIcon color="#555" />}
              </TouchableOpacity>
            </View>

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

            <Text style={styles.label}>Address Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Street / Area"
              placeholderTextColor="#555"
              value={form.street}
              onChangeText={(text) => setForm({ ...form, street: text })}
            />

            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 10 }]}
                placeholder="City"
                placeholderTextColor="#555"
                value={form.city}
                onChangeText={(text) => setForm({ ...form, city: text })}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="State"
                placeholderTextColor="#555"
                value={form.state}
                onChangeText={(text) => setForm({ ...form, state: text })}
              />
            </View>
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              placeholder="Pincode"
              placeholderTextColor="#555"
              keyboardType="number-pad"
              maxLength={6}
              value={form.pincode}
              onChangeText={(text) => setForm({ ...form, pincode: text })}
            />
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
    backgroundColor: BG,
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
    color: '#FFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  formSection: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.light,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#222',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#777',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 15,
    color: '#FFF',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#333',
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFF',
  },
  eyeButton: {
    padding: 5,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#333',
  },
  countryCode: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFF',
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
    borderColor: '#333',
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: INPUT_BG,
  },
  roleSelected: {
    borderColor: ORANGE,
    backgroundColor: ORANGE + '15',
  },
  roleText: {
    fontSize: 14,
    color: '#777',
    fontWeight: '600',
  },
  roleTextSelected: {
    color: ORANGE,
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
    borderColor: '#333',
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: INPUT_BG,
  },
  genderSelected: {
    borderColor: ORANGE,
    backgroundColor: ORANGE + '15',
  },
  genderText: {
    fontSize: 14,
    color: '#777',
    fontWeight: '600',
  },
  genderTextSelected: {
    color: ORANGE,
  },
  row: {
    flexDirection: 'row',
    marginTop: 10,
  },
  registerButton: {
    backgroundColor: ORANGE,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  disabledButton: {
    backgroundColor: '#333',
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
    color: '#777',
    fontSize: 14,
    width: '55%',
    textAlign: 'center',
  },
  loginLink: {
    color: ORANGE,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default RegistrationScreen;

