import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PAYMENT_OPTIONS = [
  { id: 'paypal', label: 'Paypal', icon: '🅿️' },
  { id: 'googlepay', label: 'Google Pay', icon: '🌀' },
  { id: 'applepay', label: 'Apple Pay', icon: '🍎' },
];

const PaymentPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedMethod, setSelectedMethod] = useState<string>('googlepay');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Order Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <View style={styles.imagePlaceholder}>
                <Text style={styles.printerIcon}>🖨️</Text>
            </View>
          </View>
          <View style={styles.summaryRight}>
            <Text style={styles.productTitle}>Double Side Xerox</Text>
            <Text style={styles.productCopies}>25 copies</Text>
            <Text style={styles.productPrice}>Rs 150</Text>
          </View>
        </View>

        {/* Cash Section */}
        <Text style={styles.sectionLabel}>Cash</Text>
        <TouchableOpacity 
          style={styles.paymentRow}
          onPress={() => setSelectedMethod('cash')}
        >
          <View style={styles.rowLeft}>
            <Text style={styles.methodIcon}>💚</Text>
            <Text style={styles.methodLabel}>Cash</Text>
          </View>
          <View style={[styles.radioButton, selectedMethod === 'cash' && styles.radioSelected]}>
            {selectedMethod === 'cash' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        {/* Payment Options Section */}
        <Text style={styles.sectionLabel}>Payment option</Text>
        {PAYMENT_OPTIONS.map((method) => (
          <TouchableOpacity 
            key={method.id}
            style={styles.paymentRow}
            onPress={() => setSelectedMethod(method.id)}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.methodIcon}>{method.icon}</Text>
              <Text style={styles.methodLabel}>{method.label}</Text>
            </View>
            <View style={[styles.radioButton, selectedMethod === method.id && styles.radioSelected]}>
              {selectedMethod === method.id && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={() => navigation.navigate('OrderCompleted')}
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
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    paddingTop: 40,
  },
  scrollContent: {
    padding: 24,
  },
  summaryCard: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 14,
    padding: 12,
    marginBottom: 24,
  },
  summaryLeft: {
    marginRight: 16,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#333',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  printerIcon: {
    fontSize: 30,
  },
  summaryRight: {
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  productCopies: {
    fontSize: 14,
    color: '#888',
    marginVertical: 2,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F5A623',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
    textAlign: 'left',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  methodLabel: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    textAlign: 'left',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#F5A623',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F5A623',
  },
  footer: {
    padding: 24,
  },
  continueButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaymentPage;
