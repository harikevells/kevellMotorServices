import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../constants/theme';
import api from '../services/api';
import { useVendorNav } from './VendorSidebarNavigator';

const VendorDeliveryCreate = () => {
  const { setActiveTab } = useVendorNav();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    aadharNo: '',
  });

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.phone || !form.password || !form.address || !form.aadharNo) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (form.phone.length !== 10) {
      Alert.alert('Error', 'Phone number must be 10 digits');
      return;
    }

    if (form.aadharNo.length !== 12) {
      Alert.alert('Error', 'Aadhar number must be 12 digits');
      return;
    }

    try {
      setLoading(true);
      const res: any = await api.post('/vendor/delivery-boys', form);
      if (res.success) {
        Alert.alert('Success', 'Delivery Boy created successfully!', [
          { text: 'OK', onPress: () => setActiveTab('DeliveryList') }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.toString());
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
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Add Delivery Boy</Text>
          <Text style={styles.subtitle}>Create a new delivery boy account under your shop.</Text>

          <View style={styles.formCard}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name"
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="example@mail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(t) => setForm({ ...form, email: t })}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Minimum 6 characters"
              secureTextEntry
              value={form.password}
              onChangeText={(t) => setForm({ ...form, password: t })}
            />

            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="10-digit number"
                keyboardType="phone-pad"
                maxLength={10}
                value={form.phone}
                onChangeText={(t) => setForm({ ...form, phone: t })}
              />
            </View>

            <Text style={styles.label}>Aadhar Number</Text>
            <TextInput
              style={styles.input}
              placeholder="12-digit Aadhar number"
              keyboardType="numeric"
              maxLength={12}
              value={form.aadharNo}
              onChangeText={(t) => setForm({ ...form, aadharNo: t })}
            />

            <Text style={styles.label}>Home Address</Text>
            <TextInput
              style={[styles.input, { height: 100, paddingTop: 15 }]}
              placeholder="Enter full address"
              multiline
              numberOfLines={4}
              value={form.address}
              onChangeText={(t) => setForm({ ...form, address: t })}
            />

            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.7 }]}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 5, marginBottom: 25 },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.medium,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 15, marginBottom: 8 },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    height: 55,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 16,
    color: '#333',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    height: 55,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  countryCode: { fontSize: 16, fontWeight: 'bold', color: '#333', marginRight: 10 },
  phoneInput: { flex: 1, fontSize: 16, color: '#333' },
  btn: {
    backgroundColor: '#1B4D6B',
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    ...SHADOWS.light,
  },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});

export default VendorDeliveryCreate;
