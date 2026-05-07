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
  PermissionsAndroid,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { useVendorNav } from './VendorSidebarNavigator';
import { fetchVendorOrders, fetchSpareParts, uploadBookingBill } from '../services/api';
import RNFS from 'react-native-fs';
import { generatePDF } from 'react-native-html-to-pdf';
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

const getInvoiceHTML = (data: any) => {
  const {
    total, subTotal, vendorName, vendorPhone, vendorEmail, vendorAddress,
    logoBase64, logoUri, currentDate, customerName, vehicleNumber, vehicleDetails,
    spareParts, laborCharges, selectedBooking
  } = data;

  return `
    <html>
      <head>
        <style>
          @page { size: auto; margin: 0mm; }
          body { 
            font-family: 'Helvetica', 'Arial', sans-serif; 
            margin: 0; 
            padding: 40px; 
            color: #333; 
            background-color: #fff;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
          }
          
          .logo-section {
            display: flex;
            flex-direction: column;
          }
          
          .logo-circle {
            width: 80px;
            height: 80px;
            margin-left:40px;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 10px;
          }
          
          .logo-img {
            width: 200px;
            height: 100px;
            object-fit: contain;
          }

          .invoice-title-section {
            text-align: right;
          }

          .invoice-label {
            font-size: 48px;
            font-weight: 700;
            color: #C13D10;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 2px;
          }

          .invoice-number {
            font-size: 18px;
            font-weight: bold;
            margin-top: 5px;
          }

          .shop-details {
            margin-bottom: 40px;
          }

          .shop-name-styled {
            font-size: 20px;
            font-weight: bold;
            color: #C13D10;
            margin-bottom: 5px;
          }

          .address-text {
            font-size: 12px;
            color: #666;
            line-height: 1.5;
            max-width: 250px;
          }

          .billing-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
          }

          .bill-to-ship-to {
            width: 50%;
          }

          .info-group {
            margin-bottom: 25px;
          }

          .info-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
          }

          .info-value-name {
            font-size: 18px;
            font-weight: bold;
            color: #C13D10;
            margin-bottom: 5px;
          }

          .info-value-details {
            font-size: 12px;
            color: #666;
            line-height: 1.4;
          }

          .invoice-meta {
            width: 40%;
            text-align: right;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
          }

          .meta-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 10px;
          }

          .meta-label {
            font-size: 14px;
            color: #333;
            width: 120px;
            text-align: right;
            margin-right: 20px;
          }

          .meta-value {
            font-size: 14px;
            color: #333;
            font-weight: 500;
          }

          .balance-due-header {
            margin-top: 15px;
            text-align: right;
          }

          .balance-due-label {
            font-size: 12px;
            color: #666;
          }

          .balance-due-amount-header {
            font-size: 24px;
            font-weight: bold;
            color: #000;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }

          th {
            background-color: #C13D10;
            color: #fff;
            text-align: left;
            padding: 12px 15px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          td {
            padding: 15px;
            border-bottom: 1px solid #eee;
            font-size: 13px;
            vertical-align: top;
          }

          .item-desc {
            font-weight: bold;
            color: #333;
            margin-bottom: 4px;
          }

          .item-subtext {
            font-size: 11px;
            color: #888;
          }

          .summary-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }

          .summary-table {
            width: 300px;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
          }

          .summary-total {
            border-top: 1px solid #eee;
            padding-top: 15px;
            margin-top: 5px;
            font-weight: bold;
            font-size: 18px;
          }

          .balance-due-bar {
            background-color: #C13D10;
            color: #fff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 25px;
            border-radius: 4px;
            margin-top: 20px;
          }

          .bar-label {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
          }

          .bar-amount {
            font-size: 22px;
            font-weight: bold;
          }

          .footer-notes {
            margin-top: 40px;
          }

          .notes-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 8px;
          }

          .notes-text {
            font-size: 11px;
            color: #666;
            line-height: 1.5;
          }

          .terms-section {
            margin-top: 25px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-section">
            <div class="logo-circle">
              ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" class="logo-img" />` :
      (logoUri ? `<img src="${logoUri}" class="logo-img" />` : '<span style="color:white;font-weight:bold;font-size:40px;">Z</span>')}
            </div>
            <div class="shop-name-styled">${vendorName}</div>
            <div class="address-text">
              ${vendorAddress}<br/>
              Phone: ${vendorPhone}<br/>
              Email: ${vendorEmail}
            </div>
          </div>
          <div class="invoice-title-section">
            <h1 class="invoice-label">INVOICE</h1>
            <div class="invoice-number"># ${selectedBooking?.bookingRef || 'INV-000000'}</div>
            <div class="balance-due-header">
              <div class="balance-due-label">Balance Due</div>
              <div class="balance-due-amount-header">₹${total}</div>
            </div>
          </div>
        </div>

        <div class="billing-section">
          <div class="bill-to-ship-to">
            <div class="info-group">
              <div class="info-label">Bill To</div>
              <div class="info-value-name">${customerName || 'Valued Customer'}</div>
              <div class="info-value-details">
                Phone: ${selectedBooking?.userDetails?.phone || 'N/A'}<br/>
                Address: ${selectedBooking?.userDetails?.address || 'N/A'}<br/>
                Reg No: ${vehicleNumber || 'N/A'}<br/>
                Vehicle: ${(vehicleDetails?.brand || '')} ${(vehicleDetails?.model || '')}<br/>
                Year: ${vehicleDetails?.year || 'N/A'}
              </div>
            </div>
          </div>
          <div class="invoice-meta">
            <div class="meta-row">
              <div class="meta-label">Invoice Date:</div>
              <div class="meta-value">${currentDate}</div>
            </div>
            <div class="meta-row">
              <div class="meta-label">Terms:</div>
              <div class="meta-value">Due on Receipt</div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50px; text-align: center;">#</th>
              <th>Item & Description</th>
              <th style="width: 60px; text-align: center;">Qty</th>
              <th style="width: 100px; text-align: right;">Rate</th>
              <th style="width: 120px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${spareParts.map((part: any, index: number) => `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>
                  <div class="item-desc">${part.name}</div>
                  <div class="item-subtext">Automotive Spare Part</div>
                </td>
                <td style="text-align: center;">1.00</td>
                <td style="text-align: right;">${part.amount}</td>
                <td style="text-align: right;">${part.amount}</td>
              </tr>
            `).join('')}
            ${laborCharges.map((charge: any, index: number) => `
              <tr>
                <td style="text-align: center;">${spareParts.length + index + 1}</td>
                <td>
                  <div class="item-desc">${charge.name}</div>
                  <div class="item-subtext">Service Labor Charge</div>
                </td>
                <td style="text-align: center;">1.00</td>
                <td style="text-align: right;">${charge.amount}</td>
                <td style="text-align: right;">${charge.amount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary-section">
          <div class="summary-table">
            <div class="summary-row">
              <div style="color: #666;">Sub Total</div>
              <div>${subTotal}</div>
            </div>
            <div class="summary-row">
              <div style="color: #666;">Tax Rate</div>
              <div>0.00%</div>
            </div>
            <div class="summary-row summary-total">
              <div>Total</div>
              <div>₹${total}</div>
            </div>
          </div>
        </div>


        <div style="text-align: center; margin-top: 30px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 296 296">
            <path d="M32,236v-28h56v56H32V236L32,236z M80,236v-20H40v40h40V236L80,236z M48,236v-12h24v24H48V236L48,236z M104,260v-4h-8v-16h8v-24h8v-8H96v-8H64v-8h8v-8H56v16h-8v-8H32v-8h16v-16h-8v8h-8v-16h16v8h8v8h8v-8h8v8h16v-8h-8v-8H56v-8h24v-8H56v-8h-8v8H32v-24h8v8h48v-8h-8v-8H64v8h-8v-8H40V96h16v16h8v-8h16v-8h8v8h-8v8h8v8h8v-16h8v-8h-8V72h16v8h8v8h-8v8h8v48h-16v-8h-8v8h-8v8h-8v8h8v8h8v8h16v-8h-8v-8h-8v-8h16v16h8v-16h8v16h8v-24h8v-8h8v8h-8v8h8v8h24v-8h-8v-8h-8v-16h-8v-8h8v-8h8v-8h-8v-8h-8v16h-8v-8h-8v8h-8v-8h8v-8h-8V72h-8v-8h8v8h8V40h8v16h16v-8h-8V32h16v8h-8v8h16v-8h8v-8h16v24h-16v-8h-8v16h8v24h8v-8h8v40h16v-8h-8V96h16v24h16v-8h-8V96h8v16h8v-8h16v16h-8v-8h-8v8h-8v24h8v8h-8v8h-16v8h-8v8h-16v-8h-8v-8h-8v16h8v8h24v8h16v-8h-8v-8h8v-8h8v8h8v8h8v-16h-8v-8h16v24h-8v16h8v16h-8v24h8v8h-24v16h-24v-8h16v-8h-16v-16h-8v16h-8v8h8v8h-16v-24h-8v16h-8v-8h-8v-32h8v24h8v-24h8v-16h-8v-8h-8v-8h8v-8h-8v-8h-8v32h8v8h-16v16h-8v16h8v8h-8v8h16v8h-16v-8h-8v-8h-8v16h-32V260L104,260z M128,248v-8h8v-24h-16v8h8v8h-16v8h-8v8h8v8h16V248L128,248z M240,240v-8h8v-16h8v-8h-8v-24h-8v24h8v8h-8v8h-8v24h8V240L240,240z M200,236v-4h-8v8h8V236L200,236z M152,220v-4h-8v8h8V220L152,220z M224,212v-12h-24v24h24V212L224,212z M208,212v-4h8v8h-8V212L208,212z M144,204v-4h16v-8h-16v-8h-8v8h8v8h-16v-8h-8v8h-8v-8h-8v-8h-8v-8h-8v8h-8v8h8v-8h8v8h8v8h8v8h32V204L144,204z M120,180v-4h-8v8h8V180L120,180z M160,176v-8h-16v8h8v8h8V176L160,176z M208,164v-4h-8v8h8V164L208,164z M224,156v-4h8v-24h-8v8h-8v8h-8v-8h-16v-8h-8v-8h8V96h-8v-8h-8v-8h-8v8h-8V64h8v8h8v-8h-8v-8h-8v8h-8v24h8v8h8v-8h8v24h-8v8h-8v8h8v16h8v-8h16v8h8v8h16v8h8V156L224,156z M216,148v-4h8v8h-8V148L216,148z M88,140v-4h8v-8h-8v8h-8v8h8V140L88,140z M112,124v-4h-8v8h8V124L112,124z M112,84v-4h-8v8h8V84L112,84z M144,80v-8h-8v16h8V80L144,80z M192,44v-4h-8v8h8V44L192,44z M256,260v-4h8v8h-8V260L256,260z M256,144v-8h-8v-8h8v8h8v16h-8V144L256,144z M32,60V32h56v56H32V60L32,60zM80,60V40H40v40h40V60L80,60z M48,60V48h24v24H48V60L48,60z M208,60V32h56v56h-56V60L208,60z M256,60V40h-40v40h40V60L256,60zM224,60V48h24v24h-24V60L224,60z M96,60v-4h8v8h-8V60L96,60z M112,52v-4h-8V32h8v8h8v-8h8v8h-8v16h-8V52L112,52z" fill="#000"/>
          </svg>
          <div style="font-size: 12px; color: #666; margin-top: 5px; font-weight: bold;">SCAN TO PAY</div>
        </div>


      </body>
    </html>
  `;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
};

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
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleReset = () => {
    setSelectedBooking(null);
    setCustomerName('');
    setVehicleNumber('');
    setVehicleDetails({
      brand: '',
      model: '',
      year: '',
      category: 'Bike'
    });
    setSpareParts([]);
    setLaborCharges([]);
    setNewSparePart({ name: '', amount: '' });
    setNewLaborCharge({ name: '', amount: '' });
    setCategory('Bike');
    setBookingSearch('');
    setSpareSearch('');
    alert('Form cleared successfully!');
  };

  const requestStoragePermission = async () => {
    try {
      if (Platform.OS !== 'android') return true;

      // On Android 13 (API 33) and above, WRITE_EXTERNAL_STORAGE is deprecated and always returns denied.
      // We skip it and try to write directly.
      if (Number(Platform.Version) >= 33) return true;

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: "Storage Permission",
          message: "App needs access to your storage to download PDFs.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

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

    // Auto-fill labor charges from booking services
    const services = booking.serviceNames || (booking.services || []).map((s: any) => s.name || s.serviceName);
    const laborDescription = Array.isArray(services) && services.length > 0 ? services.join(', ') : 'Service Charge';

    // Calculate amount without tax
    const totalAmountValue = parseFloat(booking.totalAmount) || 0;
    const taxAmountValue = parseFloat(booking.tax) || 0;
    const amountWithoutTax = totalAmountValue - taxAmountValue;

    setLaborCharges([{
      id: Date.now(),
      name: laborDescription,
      amount: amountWithoutTax.toFixed(2)
    }]);

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


  const handlePrintPDF = async () => {
    try {
      const total = calculateTotal();
      const safeCustomerName = (customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
      const vendorName = selectedBooking?.vendorDetails?.shopName || 'Kevell Motor Services';
      const vendorPhone = selectedBooking?.vendorDetails?.phone || 'N/A';
      const vendorEmail = selectedBooking?.vendorDetails?.email || 'N/A';
      const vendorAddress = selectedBooking?.vendorDetails?.address || 'N/A';
      const logoAsset = Image.resolveAssetSource(require('../assets/logopdf.png'));
      const logoUri = logoAsset ? logoAsset.uri : '';
      let logoBase64 = '';
      if (Platform.OS === 'android' && !logoUri.startsWith('http')) {
        try {
          logoBase64 = await RNFS.readFile(logoUri.replace('file://', ''), 'base64');
        } catch (e) { }
      }
      if (!logoBase64 && Platform.OS === 'android') {
        const logoAssets = ['src_assets_logopdf.png', 'assets_src_assets_logopdf.png', 'logopdf.png'];
        for (const name of logoAssets) {
          try {
            logoBase64 = await RNFS.readFileAssets(name, 'base64');
            if (logoBase64) break;
          } catch (e) { }
        }
      }
      const currentDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const spareTotal = spareParts.reduce((sum, part) => sum + (parseFloat(part.amount) || 0), 0);
      const laborTotal = laborCharges.reduce((sum, charge) => sum + (parseFloat(charge.amount) || 0), 0);
      const subTotal = (spareTotal + laborTotal).toFixed(2);

      const htmlContent = getInvoiceHTML({
        total, subTotal, vendorName, vendorPhone, vendorEmail, vendorAddress,
        logoBase64, logoUri, currentDate, customerName, vehicleNumber, vehicleDetails,
        spareParts, laborCharges, selectedBooking
      });

      const printer = RNPrint?.print ? RNPrint : (RNPrint as any)?.default || require('react-native-print');

      if (!printer || typeof printer.print !== 'function') {
        throw new Error('Print module not found. Please ensure npx react-native run-android was successful.');
      }

      const safeBookingRef = selectedBooking?.bookingRef || 'Booking';
      await printer.print({
        html: htmlContent,
        jobName: `${safeCustomerName}_${safeBookingRef}`
      });
    } catch (error: any) {
      console.error('Print Error:', error);
      alert('Print Error: ' + (error.message || 'Check native module installation'));
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const total = calculateTotal();
      const safeCustomerName = (customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');

      const vendorName = selectedBooking?.vendorDetails?.shopName || 'Kevell Motor Services';
      const vendorPhone = selectedBooking?.vendorDetails?.phone || 'N/A';
      const vendorEmail = selectedBooking?.vendorDetails?.email || 'N/A';
      const vendorAddress = selectedBooking?.vendorDetails?.address || 'N/A';

      const logoAsset = Image.resolveAssetSource(require('../assets/logopdf.png'));
      const logoUri = logoAsset ? logoAsset.uri : '';
      let logoBase64 = '';

      if (Platform.OS === 'android' && !logoUri.startsWith('http')) {
        try {
          logoBase64 = await RNFS.readFile(logoUri.replace('file://', ''), 'base64');
        } catch (e) { }
      }

      if (!logoBase64 && Platform.OS === 'android') {
        const logoAssets = ['src_assets_logopdf.png', 'assets_src_assets_logopdf.png', 'logopdf.png'];
        for (const name of logoAssets) {
          try {
            logoBase64 = await RNFS.readFileAssets(name, 'base64');
            if (logoBase64) break;
          } catch (e) { }
        }
      }

      const currentDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      const spareTotal = spareParts.reduce((sum, part) => sum + (parseFloat(part.amount) || 0), 0);
      const laborTotal = laborCharges.reduce((sum, charge) => sum + (parseFloat(charge.amount) || 0), 0);
      const subTotal = (spareTotal + laborTotal).toFixed(2);

      const htmlContent = getInvoiceHTML({
        total, subTotal, vendorName, vendorPhone, vendorEmail, vendorAddress,
        logoBase64, logoUri, currentDate, customerName, vehicleNumber, vehicleDetails,
        spareParts, laborCharges, selectedBooking
      });

      const safeBookingRef = selectedBooking?.bookingRef || 'Booking';
      const safeFileName = `${safeCustomerName}_${safeBookingRef}`;

      const downloadOptions = {
        html: htmlContent,
        fileName: safeFileName,
        directory: 'Documents',
        base64: false,
      };

      if (typeof generatePDF !== 'function') {
        throw new Error('PDF conversion function not found. Please ensure the library is correctly installed.');
      }

      const pdfFile = await generatePDF(downloadOptions);

      if (!pdfFile || (!pdfFile.filePath && !pdfFile.base64)) {
        throw new Error('PDF generation failed to return a result.');
      }

      setDownloading(true);
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        alert('Storage permission is required to download the PDF.');
        setDownloading(false);
        return;
      }

      const finalFileName = `${safeFileName}.pdf`;
      const pathsToTry = [
        RNFS.DownloadDirectoryPath,
        '/storage/emulated/0/Download',
        '/storage/emulated/0/Downloads',
        `${RNFS.ExternalStorageDirectoryPath}/Download`,
        RNFS.ExternalDirectoryPath
      ];

      let savedPath = '';

      for (const dir of pathsToTry) {
        if (!dir) continue;
        try {
          const destPath = `${dir}/${finalFileName}`;

          if (pdfFile.base64) {
            await RNFS.writeFile(destPath, pdfFile.base64, 'base64');
          } else if (pdfFile.filePath) {
            await RNFS.copyFile(pdfFile.filePath, destPath);
          }

          await RNFS.scanFile(destPath).catch(() => { });
          savedPath = destPath;
          break;
        } catch (err: any) {
          console.log(`Failed to save to ${dir}:`, err.message);
        }
      }

      if (savedPath) {
        alert(`Invoice Downloaded!\n\nFile: ${finalFileName}\nLocation: ${savedPath}`);
      } else if (pdfFile.filePath) {
        alert('Could not move to Downloads. File is at: ' + pdfFile.filePath);
      } else {
        throw new Error('Could not save the PDF file to storage.');
      }
    } catch (error: any) {
      console.error('Download Error:', error);
      alert('Download Error: ' + (error.message || 'Check storage permissions.'));
    } finally {
      setDownloading(false);
    }
  };

  const updateSparePart = (id: number, field: keyof SparePart, value: string) => {
    setSpareParts(spareParts.map(part =>
      part.id === id ? { ...part, [field]: value } : part
    ));
  };

  const handleUploadBillAndDone = async () => {
    if (!selectedBooking) {
      alert('Please select a booking first');
      return;
    }

    setUploading(true);
    try {
      const total = calculateTotal();
      const safeCustomerName = (customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
      const vendorName = selectedBooking?.vendorDetails?.shopName || 'Kevell Motor Services';
      const vendorPhone = selectedBooking?.vendorDetails?.phone || 'N/A';
      const vendorEmail = selectedBooking?.vendorDetails?.email || 'N/A';
      const vendorAddress = selectedBooking?.vendorDetails?.address || 'N/A';

      const logoAsset = Image.resolveAssetSource(require('../assets/logopdf.png'));
      const logoUri = logoAsset ? logoAsset.uri : '';
      let logoBase64 = '';

      if (Platform.OS === 'android' && !logoUri.startsWith('http')) {
        try {
          logoBase64 = await RNFS.readFile(logoUri.replace('file://', ''), 'base64');
        } catch (e) { }
      }

      if (!logoBase64 && Platform.OS === 'android') {
        const logoAssets = ['src_assets_logopdf.png', 'assets_src_assets_logopdf.png', 'logopdf.png'];
        for (const name of logoAssets) {
          try {
            logoBase64 = await RNFS.readFileAssets(name, 'base64');
            if (logoBase64) break;
          } catch (e) { }
        }
      }

      const currentDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      const spareTotal = spareParts.reduce((sum, part) => sum + (parseFloat(part.amount) || 0), 0);
      const laborTotal = laborCharges.reduce((sum, charge) => sum + (parseFloat(charge.amount) || 0), 0);
      const subTotal = (spareTotal + laborTotal).toFixed(2);

      const htmlContent = getInvoiceHTML({
        total, subTotal, vendorName, vendorPhone, vendorEmail, vendorAddress,
        logoBase64, logoUri, currentDate, customerName, vehicleNumber, vehicleDetails,
        spareParts, laborCharges, selectedBooking
      });

      const safeBookingRef = selectedBooking?.bookingRef || 'Booking';
      const safeId = selectedBooking?._id || '';
      const safeFileName = `${safeCustomerName}_${safeBookingRef}`;

      const options = {
        html: htmlContent,
        fileName: safeFileName,
        directory: 'Documents',
        base64: true,
      };

      const pdfFile = await generatePDF(options);

      if (!pdfFile || (!pdfFile.filePath && !pdfFile.base64)) {
        throw new Error('PDF generation failed.');
      }

      const formData = new FormData();
      const fileName = `${safeFileName}.pdf`;

      formData.append('bill', {
        uri: Platform.OS === 'android' ? 'file://' + pdfFile.filePath : pdfFile.filePath,
        name: fileName,
        type: 'application/pdf',
      } as any);

      formData.append('totalAmount', total);
      formData.append('tax', '0'); // Assuming 0 for now as per UI

      console.log(`[UPLOAD] Starting upload for booking: ${safeId}, total: ${total}`);
      const response: any = await uploadBookingBill(safeId, formData);

      if (response.success) {
        alert('Bill generated and uploaded successfully!');
        handleReset();
      } else {
        alert('Upload failed: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Upload Error:', error);
      alert('Error: ' + (error.message || 'Failed to generate or upload bill'));
    } finally {
      setUploading(false);
    }
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
        {/* <View style={styles.header}>
          <TouchableOpacity onPress={() => setActiveTab('Dashboard')}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Challen Service Bill</Text>
          <View style={{ width: 24 }} />
        </View> */}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Booking Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Booking ID</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setBookingModalVisible(true)}
            >
              <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginRight: 10 }}>
                <Text style={selectedBooking ? styles.dropdownTextActive : styles.dropdownText}>
                  {selectedBooking ? selectedBooking.bookingRef : 'Select Booking ID'}
                </Text>
                {selectedBooking && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 13, color: '#F28B2C', fontWeight: 'bold' }}>
                      {formatDate(selectedBooking.bookingDate)}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#F28B2C', fontWeight: '500' }}>
                      {selectedBooking.timeSlot || selectedBooking.timeslot || selectedBooking.slotTime || selectedBooking.time}
                    </Text>
                  </View>
                )}
              </View>
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
              placeholderTextColor="#999"
              value={customerName}
              onChangeText={setCustomerName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Vehicle Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. TN 01 AB 1234"
              placeholderTextColor="#999"
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
                placeholderTextColor="#999"
                value={vehicleDetails.brand}
                onChangeText={(val) => setVehicleDetails({ ...vehicleDetails, brand: val })}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Model</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Activa"
                placeholderTextColor="#999"
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
              placeholderTextColor="#999"
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
              style={[styles.laborInput, { flex: 1 }]}
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

          <View style={{ marginTop: 20 }}>
            <TouchableOpacity
              style={[styles.generateButton, { backgroundColor: '#F28B2C' }]}
              onPress={handlePrintPDF}
            >
              <Text style={styles.generateButtonText}>Challen View & Download Bill</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.generateButton, { backgroundColor: '#000000', marginTop: 10 }]}
              onPress={handleUploadBillAndDone}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.generateButtonText}>Done</Text>
              )}
            </TouchableOpacity>
          </View>

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
                placeholderTextColor="#999"
                value={bookingSearch}
                onChangeText={setBookingSearch}
              />
            </View>
            <FlatList
              data={Array.isArray(bookings) ? bookings.filter(b => {
                const matchesSearch =
                  b.bookingRef?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                  b.userDetails?.name?.toLowerCase().includes(bookingSearch.toLowerCase());

                const status = b.status?.toLowerCase();
                const isExcludedStatus = status === 'delivered' || status === 'delivery' || status === 'cancelled';

                return matchesSearch && !isExcludedStatus;
              }) : []}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.selectionItem}
                  onPress={() => handleSelectBooking(item)}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.selectionTitle}>{item.bookingRef}</Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 12, color: '#F28B2C', fontWeight: 'bold' }}>{formatDate(item.bookingDate)}</Text>
                        <Text style={{ fontSize: 11, color: '#F28B2C', fontWeight: '500' }}>{item.timeSlot || item.timeslot || item.slotTime || item.time}</Text>
                      </View>
                    </View>
                    <Text style={styles.selectionSubTitle}>{item.userDetails?.name} • {item.vehicleDetails?.registration_no}</Text>
                  </View>
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
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
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
    backgroundColor: '#F28B2C',
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
    backgroundColor: '#000000',
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
    marginTop: 0,
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
    backgroundColor: '#F28B2C',
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
