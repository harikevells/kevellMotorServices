import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { useVendorNav } from './VendorSidebarNavigator';
import { fetchVendorOrders, fetchSpareParts } from '../services/api';
import RNFS from 'react-native-fs';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNPrint from 'react-native-print';

interface SparePart {
  id: number;
  name: string;
  amount: string;
}

interface LaborCharge {
  id: number;
  name: string;
  amount: string;
}

const ChallenBooking = () => {
  const navigation = useNavigation();
  const { setActiveTab } = useVendorNav();
  const [category, setCategory] = useState('Bike');
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [laborCharges, setLaborCharges] = useState<LaborCharge[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleDetails, setVehicleDetails] = useState({
    brand: '',
    model: '',
    year: '',
    category: 'Bike'
  });

  const [bookings, setBookings] = useState<any[]>([]);
  const [inventorySpareParts, setInventorySpareParts] = useState<any[]>([]);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [spareModalVisible, setSpareModalVisible] = useState(false);
  const [spareDropdownOpen, setSpareDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const [newSparePart, setNewSparePart] = useState({ name: '', amount: '' });
  const [newLaborCharge, setNewLaborCharge] = useState({ name: '', amount: '' });
  const [spareSearch, setSpareSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, spareRes]: any = await Promise.all([
        fetchVendorOrders(),
        fetchSpareParts()
      ]);

      if (ordersRes.success) setBookings(ordersRes.orders);
      if (spareRes.success) setInventorySpareParts(spareRes.data);
    } catch (error) {
      console.warn('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBooking = (booking: any) => {
    console.log('Selected Booking:', booking);
    setSelectedBooking(booking);

    // Auto-fill customer info
    setCustomerName(booking.userDetails?.name || '');
    setVehicleNumber(booking.vehicleDetails?.registration_no || '');
    // Map backend category to UI category
    let uiCategory = 'Bike';
    const backendCat = booking.vehicleDetails?.vehicle_category;
    if (backendCat === '2_wheeler') uiCategory = 'Bike';
    else if (backendCat === '4_wheeler') uiCategory = 'Car';
    else if (backendCat === 'Heavy') uiCategory = 'Heavy';
    else uiCategory = backendCat || 'Bike';

    setCategory(uiCategory);

    // Auto-fill vehicle details
    setVehicleDetails({
      brand: booking.vehicleDetails?.brand || '',
      model: booking.vehicleDetails?.model || '',
      year: booking.vehicleDetails?.year?.toString() || '',
      category: uiCategory
    });

    setBookingModalVisible(false);
  };

  const handleAddSparePart = () => {
    if (newSparePart.name && newSparePart.amount) {
      setSpareParts([...spareParts, {
        id: Date.now(),
        name: newSparePart.name,
        amount: newSparePart.amount
      }]);
      setNewSparePart({ name: '', amount: '' });
      setSpareModalVisible(false);
      setSpareDropdownOpen(false);
    }
  };

  const addSparePart = () => {
    setSpareParts([...spareParts, { id: Date.now(), name: '', amount: '' }]);
  };

  const addLaborCharge = () => {
    if (newLaborCharge.name && newLaborCharge.amount) {
      setLaborCharges([...laborCharges, {
        id: Date.now(),
        name: newLaborCharge.name,
        amount: newLaborCharge.amount
      }]);
      setNewLaborCharge({ name: '', amount: '' });
    }
  };

  const removeLaborCharge = (id: number) => {
    setLaborCharges(laborCharges.filter(charge => charge.id !== id));
  };

  const removeSparePart = (id: number) => {
    setSpareParts(spareParts.filter(part => part.id !== id));
  };

  const calculateTotal = () => {
    const spareTotal = spareParts.reduce((sum, part) => sum + (parseFloat(part.amount) || 0), 0);
    const laborTotal = laborCharges.reduce((sum, charge) => sum + (parseFloat(charge.amount) || 0), 0);
    return (spareTotal + laborTotal).toFixed(2);
  };

  const generatePDF = async () => {
    try {
      // 1. Prepare Data
      const total = calculateTotal();
      const safeCustomerName = (customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');

      // Vendor info from selected booking or defaults
      const vendorName = selectedBooking?.vendorDetails?.shopName || 'Kevell Motor Services';
      const vendorPhone = selectedBooking?.vendorDetails?.phone || 'N/A';
      const vendorEmail = selectedBooking?.vendorDetails?.email || 'N/A';
      const vendorAddress = selectedBooking?.vendorDetails?.address || 'N/A';

      // 2. Read Logo as Base64
      let logoBase64 = '';
      try {
        const logoPath = `${RNFS.MainBundlePath}/assets/src/assets/logo1-removebg-preview.png`;
        // Note: MainBundlePath might vary, if it fails we'll just skip the logo
        logoBase64 = await RNFS.readFile(logoPath, 'base64');
      } catch (e) {
        console.log('Logo path error, trying direct path:', e);
        try {
          logoBase64 = await RNFS.readFile('d:/motorservice/kevellMotorServices/userapp/src/assets/logo1-removebg-preview.png', 'base64');
        } catch (err) {
          console.error('Failed to read logo file:', err);
        }
      }

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; line-height: 1.4; }
              .shop-name { font-size: 28px; font-weight: bold; color: #f28b2c; text-align: center; margin-bottom: 5px; }
              .logo-container { text-align: center; margin-bottom: 20px; }
              .logo { width: 150px; height: auto; }
              
              .details-container { display: flex; flex-direction: row; justify-content: space-between; margin-bottom: 30px; border-top: 2px solid #f28b2c; padding-top: 15px; }
              .details-column { width: 45%; }
              .column-title { font-weight: bold; font-size: 14px; color: #f28b2c; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #eee; }
              .info-text { font-size: 13px; margin-bottom: 3px; }
              
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #f28b2c; color: white; padding: 12px 10px; text-align: left; font-size: 14px; }
              td { padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; }
              
              .total-container { margin-top: 20px; text-align: right; border-top: 2px solid #f28b2c; padding-top: 10px; }
              .total-label { font-size: 16px; font-weight: normal; }
              .total-amount { font-size: 22px; font-weight: bold; color: #f28b2c; }
              
              .footer { text-align: center; margin-top: 50px; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="shop-name">${vendorName}</div>
            <div class="logo-container">
              ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" class="logo" />` : '<div class="logo">DR. CHARLIE</div>'}
            </div>

            <div class="details-container">
              <div class="details-column">
                <div class="column-title">CUSTOMER & VEHICLE DETAILS</div>
                <div class="info-text"><b>Name:</b> ${customerName || 'N/A'}</div>
                <div class="info-text"><b>Reg No:</b> ${vehicleNumber || 'N/A'}</div>
                <div class="info-text"><b>Vehicle:</b> ${vehicleDetails.brand} ${vehicleDetails.model}</div>
                <div class="info-text"><b>Year:</b> ${vehicleDetails.year || 'N/A'}</div>
              </div>
              
              <div class="details-column">
                <div class="column-title">VENDOR DETAILS</div>
                <div class="info-text"><b>Shop Name:</b> ${vendorName}</div>
                <div class="info-text"><b>Phone:</b> ${vendorPhone}</div>
                <div class="info-text"><b>Email:</b> ${vendorEmail}</div>
                <div class="info-text"><b>Address:</b> ${vendorAddress}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 70%;">DESCRIPTION</th>
                  <th style="text-align: right; width: 30%;">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                ${spareParts.map(part => `
                  <tr>
                    <td>${part.name} (Spare Part)</td>
                    <td style="text-align: right;">₹${part.amount}</td>
                  </tr>
                `).join('')}
                ${laborCharges.map(charge => `
                  <tr>
                    <td>${charge.name} (Labor)</td>
                    <td style="text-align: right;">₹${charge.amount}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="total-container">
              <span class="total-label">Grand Total: </span>
              <span class="total-amount">₹${total}</span>
            </div>

            <div class="footer">
              Thank you for choosing Dr. Charlie Service!<br/>
              This is a digital invoice. No signature required.
            </div>
          </body>
        </html>
      `;

      const printer = RNPrint?.print ? RNPrint : (RNPrint as any)?.default || require('react-native-print');

      if (!printer || typeof printer.print !== 'function') {
        throw new Error('Print module not found. Please ensure npx react-native run-android was successful.');
      }

      await printer.print({
        html: htmlContent,
        jobName: `Bill_${safeCustomerName}`
      });

    } catch (error: any) {
      console.error('Print Error:', error);
      alert('Print Error: ' + (error.message || 'Check native module installation'));
    }
  };

  const updateSparePart = (id: number, field: keyof SparePart, value: string) => {
    setSpareParts(spareParts.map(part =>
      part.id === id ? { ...part, [field]: value } : part
    ));
  };



  const categories = [
    { id: 'Bike', icon: '🏍️' },
    { id: 'Car', icon: '🚗' },
    { id: 'Heavy', icon: '🚛' }
  ];

  if (showQR) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowQR(false)}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan to Pay</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.qrContainer}>
          <View style={styles.billSummary}>
            <Text style={styles.billId}>Bill #INV-{Math.floor(Math.random() * 10000)}</Text>
            <Text style={styles.billTotal}>₹{calculateTotal()}</Text>
            <Text style={styles.billDetail}>{category} Service - {vehicleNumber}</Text>
          </View>

          <View style={styles.qrWrapper}>
            <Image
              source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ServiceBill' }}
              style={styles.qrCode}
            />
            <Text style={styles.qrText}>Please scan the QR code to complete payment</Text>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => setActiveTab('Dashboard')}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setActiveTab('Dashboard')}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Bill</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Booking Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Booking ID</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setBookingModalVisible(true)}
            >
              <Text style={selectedBooking ? styles.dropdownTextActive : styles.dropdownText}>
                {selectedBooking ? selectedBooking.bookingRef : 'Select Booking ID'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Category Selection */}
          <Text style={styles.sectionTitle}>Select Category</Text>
          <View style={styles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  category === cat.id && styles.categoryCardActive
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[
                  styles.categoryLabel,
                  category === cat.id && styles.categoryLabelActive
                ]}>{cat.id}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Customer Info */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Customer Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name"
              value={customerName}
              onChangeText={setCustomerName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Vehicle Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. TN 01 AB 1234"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              autoCapitalize="characters"
            />
          </View>

          {/* Vehicle Details */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.inputLabel}>Brand</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Honda"
                value={vehicleDetails.brand}
                onChangeText={(val) => setVehicleDetails({ ...vehicleDetails, brand: val })}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Model</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Activa"
                value={vehicleDetails.model}
                onChangeText={(val) => setVehicleDetails({ ...vehicleDetails, model: val })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Year</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2022"
              keyboardType="numeric"
              value={vehicleDetails.year}
              onChangeText={(val) => setVehicleDetails({ ...vehicleDetails, year: val })}
            />
          </View>

          {/* Spare Parts Section */}
          <View style={styles.spareHeader}>
            <Text style={styles.sectionTitle}>Spare Parts & Services</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setSpareModalVisible(true)}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {spareParts.length === 0 && (
            <View style={styles.emptyParts}>
              <Text style={styles.emptyText}>No spare parts added yet</Text>
            </View>
          )}

          {spareParts.map((part, index) => (
            <View key={part.id} style={styles.partRow}>
              <View style={[styles.partInfo, { flex: 2 }]}>
                <Text style={styles.partNameText}>{part.name}</Text>
              </View>
              <View style={[styles.partInfo, { flex: 1, alignItems: 'flex-end' }]}>
                <Text style={styles.partAmountText}>₹{part.amount}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeSparePart(part.id)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Labor Charges Section */}
          <View style={[styles.spareHeader, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>Labor Charges</Text>
            <TouchableOpacity style={styles.addButton} onPress={addLaborCharge}>
              <Text style={styles.addButtonText}>+ Add Labor</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.laborInputRow}>
            <TextInput
              style={[styles.laborInput, { flex: 2 }]}
              placeholder="Labor Description"
              placeholderTextColor="#999"
              value={newLaborCharge.name}
              onChangeText={(val) => setNewLaborCharge({ ...newLaborCharge, name: val })}
            />
            <TextInput
              style={[styles.laborInput, { flex: 1, marginLeft: 10 }]}
              placeholder="Amount"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={newLaborCharge.amount}
              onChangeText={(val) => setNewLaborCharge({ ...newLaborCharge, amount: val })}
            />
            <TouchableOpacity
              style={[styles.addButton, { marginLeft: 10, alignSelf: 'center' }]}
              onPress={addLaborCharge}
            >
              <Text style={styles.addButtonText}>ADD</Text>
            </TouchableOpacity>
          </View>

          {laborCharges.map((charge) => (
            <View key={charge.id} style={styles.partRow}>
              <View style={[styles.partInfo, { flex: 2 }]}>
                <Text style={styles.partNameText}>{charge.name}</Text>
              </View>
              <View style={[styles.partInfo, { flex: 1, alignItems: 'flex-end' }]}>
                <Text style={styles.partAmountText}>₹{charge.amount}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeLaborCharge(charge.id)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{calculateTotal()}</Text>
          </View>

          <TouchableOpacity
            style={styles.generateButton}
            onPress={generatePDF}
          >
            <Text style={styles.generateButtonText}>Challen Done & Print Bill</Text>
          </TouchableOpacity>
          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Booking Selection Modal */}
      <Modal
        visible={bookingModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBookingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Booking</Text>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.modalInput}
                placeholder="Search Booking ID or Customer..."
                value={bookingSearch}
                onChangeText={setBookingSearch}
              />
            </View>
            <FlatList
              data={Array.isArray(bookings) ? bookings.filter(b =>
                b.bookingRef?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                b.userDetails?.name?.toLowerCase().includes(bookingSearch.toLowerCase())
              ) : []}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.selectionItem}
                  onPress={() => handleSelectBooking(item)}
                >
                  <View>
                    <Text style={styles.selectionTitle}>{item.bookingRef}</Text>
                    <Text style={styles.selectionSubTitle}>{item.userDetails?.name} • {item.vehicleDetails?.registration_no}</Text>
                  </View>
                  <Text style={styles.selectionArrow}>→</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  {loading ? <ActivityIndicator color={COLORS.primary} /> : <Text>No bookings match your search</Text>}
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Spare Part Add Modal */}
      <Modal
        visible={spareModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSpareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.spareModalContent}>
            <Text style={styles.modalTitle}>Add Spare Part</Text>

            <View style={styles.modalInputGroup}>
              <Text style={styles.inputLabel}>Select Part from Inventory</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setSpareDropdownOpen(!spareDropdownOpen)}
              >
                <Text style={newSparePart.name ? styles.dropdownTextActive : styles.dropdownText}>
                  {newSparePart.name || 'Choose a spare part'}
                </Text>
                <Text style={styles.dropdownArrow}>{spareDropdownOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {spareDropdownOpen && (
                <View style={styles.spareDropdownList}>
                  <View style={styles.searchContainer}>
                    <TextInput
                      style={styles.modalInputSmall}
                      placeholder="Search inventory..."
                      placeholderTextColor="#999"
                      value={spareSearch}
                      onChangeText={setSpareSearch}
                    />
                  </View>
                  <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled={true}>
                    {Array.isArray(inventorySpareParts) && inventorySpareParts
                      .filter(p => p.category === category && p.name?.toLowerCase().includes(spareSearch.toLowerCase()))
                      .map((p) => (
                        <TouchableOpacity
                          key={p._id}
                          style={[
                            styles.spareSelectItem,
                            newSparePart.name === p.name && styles.spareSelectItemActive
                          ]}
                          onPress={() => {
                            setNewSparePart({ name: p.name, amount: p.amount.toString() });
                            setSpareDropdownOpen(false);
                          }}
                        >
                          <Text style={[
                            styles.spareSelectText,
                            newSparePart.name === p.name && styles.spareSelectTextActive
                          ]}>{p.name}</Text>
                          <Text style={styles.spareSelectAmount}>₹{p.amount}</Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.inputLabel}>Final Item Details</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Part Name"
                placeholderTextColor="#999"
                value={newSparePart.name}
                onChangeText={(val) => setNewSparePart({ ...newSparePart, name: val })}
              />
              <TextInput
                style={[styles.modalInput, { marginTop: 10 }]}
                placeholder="Amount"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={newSparePart.amount}
                onChangeText={(val) => setNewSparePart({ ...newSparePart, amount: val })}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSpareModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalAddBtn}
                onPress={handleAddSparePart}
              >
                <Text style={styles.modalAddText}>Add to Bill</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B4D6B',
    marginBottom: 15,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#EEE',
    ...SHADOWS.light,
  },
  categoryCardActive: {
    borderColor: '#1B4D6B',
    backgroundColor: '#F0F7FF',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  categoryLabelActive: {
    color: '#1B4D6B',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#333',
  },
  spareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#1B4D6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  partInputContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
  },
  partInput: {
    padding: 10,
    fontSize: 14,
    color: '#333',
  },
  removeButton: {
    marginLeft: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1B4D6B',
    padding: 20,
    borderRadius: 12,
    marginTop: 25,
    ...SHADOWS.medium,
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  generateButton: {
    backgroundColor: '#00E676',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    ...SHADOWS.light,
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  qrContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 30,
  },
  billSummary: {
    alignItems: 'center',
    marginBottom: 40,
  },
  billId: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  billTotal: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1B4D6B',
  },
  billDetail: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  qrWrapper: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  qrCode: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  qrText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  doneButton: {
    marginTop: 'auto',
    width: '100%',
    backgroundColor: '#1B4D6B',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dropdownButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    color: '#999',
    fontSize: 15,
  },
  dropdownTextActive: {
    color: '#333',
    fontSize: 15,
    fontWeight: 'bold',
  },
  dropdownArrow: {
    color: '#1B4D6B',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '80%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B4D6B',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  closeIcon: {
    fontSize: 20,
    color: '#666',
  },
  selectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  selectionSubTitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  selectionArrow: {
    fontSize: 20,
    color: '#CCC',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  spareModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    margin: 20,
    padding: 20,
    ...SHADOWS.medium,
  },
  modalInputGroup: {
    marginTop: 20,
  },
  modalInput: {
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  modalAddBtn: {
    flex: 2,
    backgroundColor: '#1B4D6B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontWeight: 'bold',
  },
  modalAddText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  spareSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  spareSelectItemActive: {
    backgroundColor: '#F0F7FF',
  },
  spareSelectText: {
    fontSize: 14,
    color: '#333',
  },
  spareSelectTextActive: {
    color: '#1B4D6B',
    fontWeight: 'bold',
  },
  spareSelectAmount: {
    fontSize: 14,
    color: '#1B4D6B',
    fontWeight: 'bold',
  },
  emptyParts: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#CCC',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  partInfo: {
    justifyContent: 'center',
  },
  partNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  partAmountText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1B4D6B',
  },
  searchContainer: {
    marginBottom: 5,
  },
  spareDropdownList: {
    marginTop: 5,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 10,
    overflow: 'hidden',
    ...SHADOWS.light,
  },
  modalInputSmall: {
    backgroundColor: '#F8F9FB',
    padding: 8,
    fontSize: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  laborInputRow: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  laborInput: {
    backgroundColor: '#F8F9FB',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  removeIcon: {
    fontSize: 18,
    color: '#FF5252',
    padding: 5,
  }
});

export default ChallenBooking;
