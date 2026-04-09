import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AddressPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isDefault, setIsDefault] = useState<boolean>(true);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    doorNo: '',
    area: '',
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Address</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.subTitle}>Please fill in your delivery information</Text>

        {/* Form Fields */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#888"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Mobile Number"
            placeholderTextColor="#888"
            keyboardType="phone-pad"
            value={formData.mobile}
            onChangeText={(text) => setFormData({ ...formData, mobile: text })}
          />
          <TextInput
            style={[styles.input, styles.activeInput]}
            placeholder="Enter Door No"
            placeholderTextColor="#888"
            value={formData.doorNo}
            onChangeText={(text) => setFormData({ ...formData, doorNo: text })}
            autoFocus
          />
          <TextInput
            style={styles.input}
            placeholder="Area/Street"
            placeholderTextColor="#888"
            value={formData.area}
            onChangeText={(text) => setFormData({ ...formData, area: text })}
          />
        </View>

        {/* Toggle Row */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Set to default address</Text>
          <Switch
            value={isDefault}
            onValueChange={setIsDefault}
            trackColor={{ false: '#ddd', true: '#1B5E3B' }}
            thumbColor={Platform.OS === 'ios' ? undefined : '#fff'}
          />
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => navigation.navigate('Payment')}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backIcon: {
    fontSize: 28,
    color: '#333',
    paddingTop:40, 
  },
  headerTitle: {
    fontSize: 22,
    paddingTop:40,  
    fontWeight: '900',
    color: '#2C3333',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  subTitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
    fontWeight: '500',
  },
  form: {
    gap: 16,
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#fcfcfc',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 14,
    color: '#333',
  },
  activeInput: {
    borderColor: '#2196F3',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  footer: {
    padding: 24,
    marginTop: 'auto',
  },
  continueButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    width: '100%',
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddressPage;
