import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { fetchUserBookings } from '../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TrackingRouteProp = RouteProp<RootStackParamList, 'LiveTracking'>;

const STAGES = [
  { id: 'pending', label: 'Booking Pending', icon: '⏳', desc: 'Awaiting confirmation.' },
  { id: 'confirmed', label: 'Booking Confirmed', icon: '📝', desc: 'Your booking has been confirmed.' },
  { id: 'on_the_way', label: 'On The Way', icon: '🛵', desc: 'Executive is on the way.' },
  { id: 'received', label: 'Vehicle Received', icon: '📥', desc: 'Your vehicle has reached the center.' },
  { id: 'inspected', label: 'Inspected', icon: '🔍', desc: 'Initial inspection complete.' },
  { id: 'in_service', label: 'In Service', icon: '🛠️', desc: 'Services are being performed.' },
  { id: 'quality_check', label: 'Quality Check', icon: '✅', desc: 'Final testing in progress.' },
  { id: 'ready', label: 'Ready', icon: '🎁', desc: 'Vehicle is ready for pickup/delivery.' },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: '🚀', desc: 'Vehicle is out for delivery.' },
  { id: 'delivered', label: 'Delivered', icon: '🏁', desc: 'Vehicle has been securely delivered.' },
];

const LiveTrackingPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<TrackingRouteProp>();
  const { bookingId } = route.params;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [currentStage, setCurrentStage] = useState('pending');
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    let simInterval: any;
    if (simulating) {
      simInterval = setInterval(() => {
        setCurrentStage(prev => {
          const currentIndex = STAGES.findIndex(s => s.id === prev);
          if (currentIndex < STAGES.length - 1) {
            return STAGES[currentIndex + 1].id;
          }
          setSimulating(false);
          return prev;
        });
      }, 5000);
    }
    return () => clearInterval(simInterval);
  }, [simulating]);

  useEffect(() => {
    if (!simulating) {
      loadTrackingData();
      const interval = setInterval(loadTrackingData, 10000);
      return () => clearInterval(interval);
    }
  }, [simulating]);

  const loadTrackingData = async () => {
    try {
      const res = await fetchUserBookings();
      const currentBooking = res.data.find((b: any) => b._id === bookingId || b.bookingRef === bookingId);
      
      if (currentBooking) {
        setBooking(currentBooking);
        if (currentBooking.status === 'completed') {
          setCurrentStage('delivered');
        } else {
          setCurrentStage(currentBooking.status || 'pending');
        }
      }
    } catch (error) {
      console.error('Tracking fetch error:', error);
    } finally {
      if (loading) setLoading(false);
    }
  };

  if (loading || !booking) return (
    <View style={styles.loadingContainer}>
       <ActivityIndicator size="large" color={COLORS.primary} />
       <Text style={styles.loadingText}>Loading tracking details...</Text>
    </View>
  );

  const currentStageIndex = STAGES.findIndex(s => s.id === currentStage);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Tracking</Text>
        <TouchableOpacity 
           style={[styles.demoButton, simulating && { backgroundColor: COLORS.primary }]} 
           onPress={() => setSimulating(!simulating)}
        >
          <Text style={[styles.demoButtonText, simulating && { color: COLORS.white }]}>
             {simulating ? 'Simulating...' : 'Demo Mode'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Current Status</Text>
          <Text style={styles.statusTitle}>
             {STAGES[currentStageIndex]?.label || (currentStage.charAt(0).toUpperCase() + currentStage.slice(1).replace(/_/g, ' '))}
          </Text>
          <Text style={styles.estimatedTime}>
             Booking ID: {booking.bookingRef}
          </Text>
        </View>

        <View style={styles.stepperContainer}>
          {STAGES.map((stage, index) => {
            const isCompleted = currentStageIndex > index;
            const isCurrent = currentStage === stage.id;
            
            return (
              <View key={stage.id} style={styles.stepRow}>
                <View style={styles.stepIndicator}>
                  <View style={[
                    styles.stepCircle,
                    isCompleted && styles.stepCompleted,
                    isCurrent && styles.stepCurrent,
                  ]}>
                    <Text style={styles.stepIcon}>{stage.icon}</Text>
                  </View>
                  {index < STAGES.length - 1 && (
                    <View style={[
                      styles.stepLine,
                      isCompleted && styles.stepLineCompleted,
                    ]} />
                  )}
                </View>
                <View style={styles.stepInfo}>
                  <Text style={[
                    styles.stepLabel,
                    isCurrent && styles.stepLabelCurrent,
                    isCompleted && styles.stepLabelCompleted,
                  ]}>
                    {stage.label}
                  </Text>
                  {isCurrent && (
                    <Text style={styles.stepDesc}>{stage.desc}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.infoCard}>
          {/* Vendor Details */}
          <Text style={styles.sectionHeading}>Vendor Details</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Shop</Text>
              <Text style={styles.infoValue}>{booking.vendorDetails?.shopName || booking.center?.shopName || booking.center?.center_name || 'N/A'}</Text>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <Text style={styles.callButtonText}>📞 Call {booking.vendorDetails?.phone || 'Vendor'}</Text>
            </TouchableOpacity>
          </View>
          {booking.vendorDetails?.address ? <Text style={styles.addressText}>{booking.vendorDetails.address}</Text> : null}

          <View style={styles.divider} />

          {/* User & Vehicle Details */}
          <Text style={styles.sectionHeading}>Service Target</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Vehicle</Text>
              <Text style={styles.infoValue}>
                {booking.vehicleDetails?.brand || booking.vehicle?.brand} {booking.vehicleDetails?.model || booking.vehicle?.model}
              </Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Reg No</Text>
              <Text style={styles.infoValue}>{booking.vehicleDetails?.registration_no || booking.vehicle?.registration_no}</Text>
            </View>
          </View>
          <Text style={styles.addressText}>Address: {booking.userDetails?.address || 'N/A'}</Text>

          <View style={styles.divider} />

          {/* Services & Payment Details */}
          <Text style={styles.sectionHeading}>Payment & Services</Text>
          <View style={styles.servicesBox}>
            {(booking.serviceNames || []).length > 0 ? (
              booking.serviceNames.map((sName: string, i: number) => (
                <Text key={i} style={styles.bulletItem}>• {sName}</Text>
              ))
            ) : (
              (booking.services || []).map((sArr: any, i: number) => (
                <Text key={i} style={styles.bulletItem}>• {sArr.name}</Text>
              ))
            )}
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Method</Text>
              <Text style={styles.infoValue}>{booking.paymentMethod} ({booking.paymentStatus})</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Total Billed</Text>
              <Text style={[styles.infoValue, { color: COLORS.primary }]}>₹{booking.totalAmount}</Text>
            </View>
          </View>

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('HomeTabs')}>
          <Text style={styles.homeButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
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
  demoButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.lightGrey,
    borderRadius: 8,
  },
  demoButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    ...SHADOWS.medium,
  },
  statusLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  estimatedTime: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },
  stepperContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    ...SHADOWS.light,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  stepIndicator: {
    width: 50,
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  stepCurrent: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary,
    transform: [{ scale: 1.2 }],
    ...SHADOWS.light,
  },
  stepCompleted: {
    backgroundColor: COLORS.primary,
  },
  stepIcon: {
    fontSize: 18,
  },
  stepLine: {
    width: 3,
    height: 45,
    backgroundColor: COLORS.lightGrey,
    marginTop: -5,
    marginBottom: -5,
    zIndex: 1,
  },
  stepLineCompleted: {
    backgroundColor: COLORS.primary,
  },
  stepInfo: {
    flex: 1,
    marginLeft: 15,
    paddingTop: 8,
    paddingBottom: 25,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.grey,
  },
  stepLabelCurrent: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  stepLabelCompleted: {
    color: COLORS.text,
  },
  stepDesc: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 100,
    ...SHADOWS.light,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.grey,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGrey,
    marginVertical: 15,
  },
  callButton: {
    backgroundColor: COLORS.primary + '15',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  callButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
    marginTop: 5,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  servicesBox: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  bulletItem: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.grey,
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    ...SHADOWS.medium,
  },
  homeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  homeButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LiveTrackingPage;
