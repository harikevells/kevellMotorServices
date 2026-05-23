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
  PermissionsAndroid,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { fetchCenterDetails, fetchServices, createBooking, fetchUserVehicles, validateOffer, fetchActiveOffers, fetchMySubscriptions } from '../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type SummaryRouteProp = RouteProp<RootStackParamList, 'BookingSummary'>;

const BookingSummaryPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SummaryRouteProp>();
  const {
    centerId, serviceIds, serviceNames, slotDate, slotTime, vehicleId,
    category, fuel, vehicleCategory,
    userName, userPhone, userAddress, latitude, longitude
  } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Razorpay'>('Cash');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedOffer, setAppliedOffer] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [subDiscountAmount, setSubDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [liveOffers, setLiveOffers] = useState<any[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [usedOfferIds, setUsedOfferIds] = useState<Set<string>>(new Set()); // offers already used by this user

  // API expects "2 Wheeler" instead of "2_wheeler"
  const getApiVehicleCat = (cat: string) => {
    if (cat === '2_wheeler') return '2 Wheeler';
    if (cat === '4_wheeler') return '4 Wheeler';
    if (cat === 'heavy') return 'Heavy';
    return cat;
  };

  useEffect(() => {
    loadSummary();
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const res: any = await fetchActiveOffers();
      if (res.success && res.offers) {
        const offers = res.offers;
        setLiveOffers(offers);

        // Silently pre-check which offers this user has already used
        const usedIds = new Set<string>();
        await Promise.all(
          offers
            .filter((o: any) => o.couponCode) // only offers with coupon codes
            .map(async (o: any) => {
              try {
                await validateOffer(o.couponCode, 0);
                // 0 subtotal - if backend rejects due to usage limit, mark as used
              } catch (errMsg: any) {
                const msg = errMsg?.toString() || '';
                if (msg.includes('already used') || msg.includes('maximum allowed')) {
                  usedIds.add(o._id);
                }
              }
            })
        );
        setUsedOfferIds(usedIds);
      }
    } catch (e) {
      console.warn('Failed to load offers:', e);
    }
  };

  const calcDiscount = (offer: any, subtotal: number) => {
    let discount = 0;
    if (offer.discountType === 'percentage') {
      discount = Math.round((subtotal * offer.discount) / 100 * 100) / 100;
    } else {
      discount = offer.discount;
    }
    return Math.min(discount, subtotal);
  };

  const loadSummary = async () => {
    try {
      setLoading(true);

      // 1. Fetch Center
      const centerRes = await fetchCenterDetails(centerId);

      // 2. Fetch Services (and filter by selected IDs)
      const servicesRes = await fetchServices('', getApiVehicleCat(vehicleCategory), fuel);
      const selectedServices = servicesRes.data.filter((s: any) => serviceIds.includes(s._id));

      // 3. Fetch Vehicle
      const vehiclesRes = await fetchUserVehicles();
      const selectedVehicle = vehiclesRes.data.find((v: any) => v._id === vehicleId);

      const subtotal = selectedServices.reduce((sum: number, s: any) => sum + (s.price || 0), 0);
      let calculatedSubDiscount = 0;

      // 4. Check for active subscription discount
      try {
        const mySub: any = await fetchMySubscriptions();
        if (mySub.success && mySub.active && mySub.active.plan && mySub.active.plan.features) {
          const activeSub = mySub.active;
          let limit = 0;
          let subDiscPct = 0;
          for (const feature of activeSub.plan.features) {
            const match = feature.match(/(\d+)\s*service[^\d]*(\d+)%/i);
            if (match) {
              limit = parseInt(match[1], 10);
              subDiscPct = parseInt(match[2], 10);
              break;
            }
          }
          if (subDiscPct > 0) {
            const currentUsage = activeSub.usageTrackers?.servicesUsed || 0;
            if (currentUsage < limit) {
              calculatedSubDiscount = Math.round((subtotal * subDiscPct) / 100 * 100) / 100;
              setSubDiscountAmount(calculatedSubDiscount);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch subscription for discount', e);
      }

      const tax = Math.round((subtotal - calculatedSubDiscount) * 0.18 * 100) / 100;

      setSummaryData({
        vehicle: selectedVehicle,
        center: centerRes.data,
        services: selectedServices,
        subtotal,
        tax,
        total: subtotal - calculatedSubDiscount + tax,
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load booking summary.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOffer = async (offer: any) => {
    // Don't allow selecting used offers
    if (usedOfferIds.has(offer._id)) return;

    // Deselect if already selected
    if (selectedOfferId === offer._id) {
      setSelectedOfferId(null);
      setAppliedOffer(null);
      setDiscountAmount(0);
      setCouponError('');
      return;
    }
    if (!offer.couponCode) {
      // No coupon code — just apply directly based on offer data
      const discount = calcDiscount(offer, summaryData?.subtotal || 0);
      setSelectedOfferId(offer._id);
      setAppliedOffer(offer);
      setDiscountAmount(discount);
      setCouponError('');
      return;
    }
    try {
      setCouponLoading(true);
      setCouponError('');
      const res: any = await validateOffer(offer.couponCode, summaryData?.subtotal || 0);
      if (res.success && res.offer) {
        const discount = calcDiscount(res.offer, summaryData.subtotal);
        setSelectedOfferId(offer._id);
        setAppliedOffer(res.offer);
        setDiscountAmount(discount);
        setCouponError('');
      }
    } catch (err: any) {
      const errMsg = err?.toString() || '';
      if (errMsg.includes('already used') || errMsg.includes('maximum allowed')) {
        // Mark this offer as used for this user in the UI
        setUsedOfferIds(prev => new Set([...prev, offer._id]));
        setCouponError('You have already used this offer.');
      } else {
        setCouponError(errMsg || 'Offer not applicable for your booking.');
      }
      setSelectedOfferId(null);
      setAppliedOffer(null);
      setDiscountAmount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    try {
      setCouponLoading(true);
      setCouponError('');
      setCouponSuccess('');
      const res: any = await validateOffer(couponInput.trim(), summaryData?.subtotal || 0);
      if (res.success && res.offer) {
        const discount = calcDiscount(res.offer, summaryData.subtotal);
        setSelectedOfferId(res.offer._id);
        setAppliedOffer(res.offer);
        setDiscountAmount(discount);
        setCouponSuccess(`✔ "${res.offer.offerTitle}" applied! You save ₹${discount}`);
        setShowManualInput(false);
      }
    } catch (err: any) {
      setCouponError(err?.toString() || 'Invalid coupon code');
      setAppliedOffer(null);
      setDiscountAmount(0);
      setSelectedOfferId(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedOffer(null);
    setDiscountAmount(0);
    setCouponInput('');
    setCouponError('');
    setCouponSuccess('');
    setSelectedOfferId(null);
    setShowManualInput(false);
  };

  const handleConfirmBooking = async () => {
    try {
      setSubmitting(true);
      const finalTotal = summaryData.total - discountAmount;
      const res = await createBooking({
        vehicle: vehicleId,
        center: centerId,
        services: serviceIds,
        serviceNames: serviceNames,
        bookingDate: slotDate,
        timeSlot: slotTime,
        paymentMethod: paymentMethod,
        userName,
        userPhone,
        userAddress,
        latitude,
        longitude,
        couponCode: appliedOffer ? appliedOffer.couponCode : undefined,
      });

      if (paymentMethod === 'Cash') {
        navigation.navigate('BookingConfirmation', { bookingRef: res.data.bookingRef });
      } else {
        navigation.navigate('PaymentSimulation', {
          amount: summaryData.total - discountAmount,
          bookingData: res.data
        });
      }
    } catch (error: any) {
      Alert.alert('Booking Failed', error.toString());
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !summaryData) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Preparing your summary...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Customer</Text>
              <Text style={styles.infoValue}>{userName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{userPhone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={[styles.infoValue, { fontSize: 13 }]}>{userAddress}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Live Location</Text>
              <Text style={[styles.infoValue, { color: '#00d084' }]}>📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle & Center</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vehicle</Text>
              <Text style={styles.infoValue}>{summaryData.vehicle.brand} {summaryData.vehicle.model}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reg No</Text>
              <Text style={styles.infoValue}>{summaryData.vehicle.registration_no}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Center</Text>
              <Text style={styles.infoValue}>{summaryData.center.center_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={[styles.infoValue, { fontSize: 12 }]}>{summaryData.center.address}, {summaryData.center.city}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{new Date(slotDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Time Slot</Text>
              <Text style={styles.infoValue}>{slotTime}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services Selected</Text>
          <View style={styles.card}>
            {summaryData.services.map((service: any, index: number) => (
              <View key={index} style={styles.serviceRow}>
                <Text style={styles.serviceName}>{service.serviceName}</Text>
                <Text style={styles.servicePrice}>₹{service.price}</Text>
              </View>
            ))}
            {serviceNames && serviceNames.length > 0 && serviceNames.map((name: string, index: number) => (
              <View key={`manual-${index}`} style={styles.serviceRow}>
                <Text style={styles.serviceName}>{name} (Manual)</Text>
                <Text style={styles.servicePrice}>₹0</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>₹{summaryData.subtotal}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>GST (18%)</Text>
              <Text style={styles.priceValue}>₹{summaryData.tax}</Text>
            </View>
            {discountAmount > 0 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: '#00d084' }]}>Coupon Discount</Text>
                <Text style={[styles.priceValue, { color: '#00d084' }]}>- ₹{discountAmount}</Text>
              </View>
            )}
            {subDiscountAmount > 0 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: '#F5A623', width: 140 }]}>⭐ Sub Discount</Text>
                <Text style={[styles.priceValue, { color: '#F5A623' }]}>- ₹{subDiscountAmount}</Text>
              </View>
            )}
            <View style={[styles.priceRow, { marginTop: 10 }]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{Math.max(0, summaryData.total - discountAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Offer Section - Radio Button Style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎁 Apply Offer</Text>

          {/* Applied offer summary bar */}
          {appliedOffer && (
            <View style={styles.appliedOfferBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.appliedOfferTitle}>✔ {appliedOffer.offerTitle}</Text>
                <Text style={styles.appliedOfferSave}>You save ₹{discountAmount}</Text>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon} style={styles.removeCouponBtn}>
                <Text style={styles.removeCouponText}>✕ Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Live Offers Radio List */}
          {liveOffers.filter((o: any) => !usedOfferIds.has(o._id)).length > 0 && (
            <View style={styles.offerListCard}>
              {liveOffers.filter((o: any) => !usedOfferIds.has(o._id)).map((offer: any, idx: number, arr: any[]) => {
                const isSelected = selectedOfferId === offer._id;
                const savingsAmt = summaryData ? calcDiscount(offer, summaryData.subtotal) : 0;
                const isLast = idx === arr.length - 1;
                return (
                  <TouchableOpacity
                    key={offer._id}
                    style={[
                      styles.offerRadioRow,
                      isSelected && styles.offerRadioRowActive,
                      !isLast && styles.offerRadioDivider,
                    ]}
                    onPress={() => handleSelectOffer(offer)}
                    activeOpacity={0.8}
                  >
                    {/* Radio circle */}
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>

                    {/* Offer details */}
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                        <View style={styles.discountPill}>
                          <Text style={styles.discountPillText}>
                            {offer.discountType === 'percentage' ? `${offer.discount}% OFF` : `\u20b9${offer.discount} OFF`}
                          </Text>
                        </View>
                        {offer.usageLimitPerUser === 1 && (
                          <View style={styles.oneTimePill}>
                            <Text style={styles.oneTimePillText}>1\u00d7 Only</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.offerRadioTitle}>{offer.offerTitle}</Text>
                      {offer.couponCode ? (
                        <View style={styles.couponCodeChip}>
                          <Text style={styles.couponCodeChipLabel}>CODE: </Text>
                          <Text style={styles.couponCodeChipVal}>{offer.couponCode}</Text>
                        </View>
                      ) : null}
                      {offer.minimumBookingValue > 0 && (
                        <Text style={styles.offerMinText}>Min. booking \u20b9{offer.minimumBookingValue}</Text>
                      )}
                    </View>

                    {/* Savings or Used tag */}
                    <View style={styles.savingsTag}>
                      <Text style={styles.savingsTagText}>Save</Text>
                      <Text style={styles.savingsTagAmount}>\u20b9{savingsAmt}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {couponError ? (
            <Text style={[styles.couponMsg, { marginTop: 10 }]}>{couponError}</Text>
          ) : null}

          {/* Manual coupon toggle */}
          <TouchableOpacity
            style={styles.manualToggleBtn}
            onPress={() => { setShowManualInput(v => !v); setCouponError(''); }}
          >
            <Text style={styles.manualToggleText}>
              {showManualInput ? '▲ Hide coupon input' : '+ Have a coupon code?'}
            </Text>
          </TouchableOpacity>

          {showManualInput && !appliedOffer && (
            <View style={{ marginTop: 12 }}>
              <View style={styles.couponInputRow}>
                <TextInput
                  style={styles.couponTextInput}
                  placeholder="Enter coupon code"
                  placeholderTextColor="#555"
                  value={couponInput}
                  onChangeText={(t) => { setCouponInput(t); setCouponError(''); setCouponSuccess(''); }}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.applyBtn, couponLoading && { opacity: 0.6 }]}
                  onPress={handleApplyCoupon}
                  disabled={couponLoading}
                >
                  {couponLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.applyBtnText}>Apply</Text>
                  )}
                </TouchableOpacity>
              </View>
              {couponSuccess ? <Text style={[styles.couponMsg, { color: '#00d084', marginTop: 8 }]}>{couponSuccess}</Text> : null}
            </View>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity
            style={styles.paymentCard}
            onPress={() => setShowPaymentModal(true)}
          >
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentIcon}>
                {paymentMethod === 'Cash' ? '💵' : paymentMethod === 'GPay' ? '📱' : '💳'}
              </Text>
              <Text style={styles.paymentText}>
                {paymentMethod === 'Cash' ? 'Pay at Center (Cash)' :
                  paymentMethod === 'GPay' ? 'Google Pay (UPI)' : 'Credit / Debit Card'}
              </Text>
            </View>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showPaymentModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPaymentModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Payment Method</Text>
                <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.optionItem, paymentMethod === 'Cash' && styles.selectedOption]}
                onPress={() => { setPaymentMethod('Cash'); setShowPaymentModal(false); }}
              >
                <Text style={styles.optionIcon}>💵</Text>
                <View>
                  <Text style={styles.optionLabel}>Pay at Center (Cash)</Text>
                  <Text style={styles.optionSubLabel}>Pay after service completion</Text>
                </View>
              </TouchableOpacity>



              <TouchableOpacity
                style={[styles.optionItem, paymentMethod === 'Razorpay' && styles.selectedOption]}
                onPress={() => { setPaymentMethod('Razorpay'); setShowPaymentModal(false); }}
              >
                <Text style={styles.optionIcon}>💳</Text>
                <View>
                  <Text style={styles.optionLabel}>Razorpay (Online Payment)</Text>
                  <Text style={styles.optionSubLabel}>Secure payment gateway checkout</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, submitting && styles.disabledButton]}
          onPress={handleConfirmBooking}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060606',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#060606',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#f28b2c',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 30,
    backgroundColor: '#060606',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f28b2c',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#121212',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    width: 100,
    color: '#AAAAAA',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 15,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    fontWeight: '600',
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f28b2c',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    width: 100,
    color: '#AAAAAA',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f28b2c',
  },
  paymentSection: {
    marginBottom: 120,
  },
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 15,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f28b2c33',
  },
  paymentText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f28b2c',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#121212',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  confirmButton: {
    backgroundColor: '#f28b2c',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#f28b2c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#333333',
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 25,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  closeButton: {
    fontSize: 24,
    color: '#AAAAAA',
    padding: 5,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  selectedOption: {
    borderColor: '#f28b2c',
    backgroundColor: '#f28b2c15',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  optionSubLabel: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 2,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  // Coupon styles
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponTextInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#333',
    letterSpacing: 1,
  },
  applyBtn: {
    backgroundColor: '#f28b2c',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  couponMsg: {
    marginTop: 10,
    fontSize: 13,
    color: '#ff5252',
    fontWeight: '600',
  },
  appliedOfferBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00d08415',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#00d08440',
  },
  appliedOfferTitle: {
    color: '#00d084',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 4,
  },
  appliedOfferSave: {
    color: '#00d084',
    fontSize: 12,
    fontWeight: '600',
  },
  removeCouponBtn: {
    backgroundColor: '#ff525220',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  removeCouponText: {
    color: '#ff5252',
    fontWeight: '700',
    fontSize: 12,
  },
  // Radio offer list styles
  offerListCard: {
    backgroundColor: '#121212',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 12,
    overflow: 'hidden',
  },
  offerRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  offerRadioRowActive: {
    backgroundColor: '#f28b2c12',
  },
  offerRadioDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#f28b2c',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f28b2c',
  },
  discountPill: {
    backgroundColor: '#f28b2c22',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 8,
  },
  discountPillText: {
    color: '#f28b2c',
    fontSize: 11,
    fontWeight: '900',
  },
  oneTimePill: {
    backgroundColor: '#7c5cfc22',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  oneTimePillText: {
    color: '#9b7dff',
    fontSize: 10,
    fontWeight: '800',
  },
  offerRadioTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 5,
  },
  couponCodeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  couponCodeChipLabel: {
    color: '#666',
    fontSize: 10,
    fontWeight: '700',
  },
  couponCodeChipVal: {
    color: '#f28b2c',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  offerMinText: {
    color: '#555',
    fontSize: 10,
    marginTop: 2,
  },
  savingsTag: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00d08415',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10,
    minWidth: 52,
  },
  savingsTagText: {
    color: '#00d084',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  savingsTagAmount: {
    color: '#00d084',
    fontSize: 14,
    fontWeight: '900',
  },
  manualToggleBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  manualToggleText: {
    color: '#f28b2c',
    fontSize: 13,
    fontWeight: '700',
  },
  // Used offer state styles
  offerRadioRowUsed: {
    backgroundColor: '#0d0d0d',
  },
  radioCircleUsed: {
    borderColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  alreadyUsedPill: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  alreadyUsedPillText: {
    color: '#555',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default BookingSummaryPage;
