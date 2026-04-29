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
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { fetchUserBookings } from '../services/api';
import carImage from '../assets/leftcare1.png';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TrackingRouteProp = RouteProp<RootStackParamList, 'LiveTracking'>;

const STAGES = [
  { id: 'pending', label: 'Booking pending' },
  { id: 'confirmed', label: 'Booking confirmed' },
  { id: 'on_the_way', label: 'On the way' },
  { id: 'received', label: 'Vehicle received' },
  { id: 'inspected', label: 'Initial inspection' },
  { id: 'in_service', label: 'Service inprogress' },
  { id: 'quality_check', label: 'Quality check' },
  { id: 'ready', label: 'Ready for pickup' },
  { id: 'out_for_delivery', label: 'Out for delivery' },
  { id: 'delivered', label: 'Delivery' },
  { id: 'cancelled', label: 'Cancelled' },
];

const LiveTrackingPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<TrackingRouteProp>();
  const { bookingId } = route.params;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [currentStage, setCurrentStage] = useState('pending');

  useEffect(() => {
    loadTrackingData();
    const interval = setInterval(loadTrackingData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadTrackingData = async () => {
    try {
      const res = await fetchUserBookings();
      const currentBooking = res.data.find((b: any) => b._id === bookingId || b.bookingRef === bookingId);
      
      if (currentBooking) {
        setBooking(currentBooking);
        let status = currentBooking.status || 'pending';
        if (status === 'completed') status = 'delivered';
        setCurrentStage(status);
      }
    } catch (error) {
      console.error('Tracking fetch error:', error);
    } finally {
      if (loading) setLoading(false);
    }
  };

  if (loading || !booking) return (
    <View style={styles.loadingContainer}>
       <ActivityIndicator size="large" color="#f28b2c" />
    </View>
  );

  const currentStageIndex = STAGES.findIndex(s => s.id === currentStage);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Tracking</Text>
        </View>
        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Status Heading */}
        <View style={styles.statusHeadingContainer}>
          <Text style={styles.statusHeading}>Service Status</Text>
          <Text style={styles.completionTime}>Completion: 04:30 PM</Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Vehicle</Text>
              <Text style={styles.infoValue}>
                {booking.vehicleDetails?.brand || booking.vehicle?.brand} {booking.vehicleDetails?.model || booking.vehicle?.model}
              </Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Booking Id</Text>
              <Text style={styles.infoValue}>#{booking.bookingRef}</Text>
            </View>
          </View>
          
          <View style={[styles.infoRow, { marginTop: 20 }]}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Center</Text>
              <Text style={styles.infoValue}>{booking.vendorDetails?.shopName || booking.center?.center_name || 'N/A'}</Text>
            </View>
            <View style={styles.infoCol}>
              <TouchableOpacity style={[styles.callCenterBtn, { marginLeft: 0, marginBottom: 10 }]}>
                <Text style={styles.callCenterText}>📞 {booking.vendorDetails?.phone || booking.center?.phone || 'N/A'}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ 
                  backgroundColor: currentStage === 'delivered' || currentStage === 'cancelled' || currentStage === 'pending' ? '#555555' : '#f28b2c', 
                  paddingHorizontal: 16, 
                  paddingVertical: 8, 
                  borderRadius: 20, 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  opacity: currentStage === 'delivered' || currentStage === 'cancelled' || currentStage === 'pending' ? 0.6 : 1
                }}
                disabled={currentStage === 'delivered' || currentStage === 'cancelled' || currentStage === 'pending'}
                onPress={() => navigation.navigate('TrackingPage', { bookingId: booking._id })}
              >
                <Text style={{ color: currentStage === 'delivered' || currentStage === 'cancelled' || currentStage === 'pending' ? '#cccccc' : '#000', fontWeight: 'bold', fontSize: 13 }}>Track Live </Text>
                <Text style={{ fontSize: 13 }}>📍</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tracking Section */}
        <View style={styles.trackingSection}>
          {/* Left Side Car Image */}
          <View style={styles.carContainer}>
            <Image 
              source={carImage} 
              style={styles.carImage} 
              resizeMode="contain"
            />
          </View>

          {/* Right Side Stepper */}
          <View style={styles.stepperWrapper}>
            <View style={styles.stepperContainer}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {STAGES.map((stage, index) => {
                  const isCompleted = currentStageIndex > index;
                  const isCurrent = currentStage === stage.id;
                  
                  return (
                    <View key={stage.id} style={styles.stepRow}>
                      <View style={styles.indicatorContainer}>
                        <View style={[
                          styles.dot,
                          isCompleted && styles.dotCompleted,
                          isCurrent && (
                            stage.id === 'cancelled' ? styles.dotCanceled : 
                            stage.id === 'delivered' ? styles.dotCompleted : // Make delivery green when active
                            styles.dotCurrent
                          ),
                          !isCompleted && !isCurrent && styles.dotPending
                        ]} />
                        {index < STAGES.length - 1 && (
                          <View style={[
                            styles.line,
                            isCompleted && styles.lineCompleted,
                            isCurrent && styles.lineCurrent
                          ]} />
                        )}
                      </View>
                      <View style={styles.stepInfo}>
                        <Text style={[
                          styles.stepLabel,
                          (isCompleted || isCurrent) && styles.stepLabelActive
                        ]}>
                          {stage.label}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Vendor Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Vendor Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Shop Name</Text>
              <Text style={styles.detailValue}>{booking.vendorDetails?.shopName || booking.center?.center_name || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Owner Name</Text>
              <Text style={styles.detailValue}>{booking.vendorDetails?.vendorName || booking.center?.ownerName || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{booking.vendorDetails?.email || booking.center?.email || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone No</Text>
              <Text style={styles.detailValue}>{booking.vendorDetails?.phone || booking.center?.phone || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={[styles.detailValue, { flex: 1, textAlign: 'right', marginLeft: 20 }]} numberOfLines={2}>{booking.vendorDetails?.address || booking.center?.address || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Booking Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={styles.detailsCard}>
            <Text style={styles.detailLabel}>Services Selected:</Text>
            <View style={styles.servicesList}>
              {(booking.serviceNames || []).map((name: string, i: number) => (
                <Text key={i} style={styles.serviceItem}>• {name}</Text>
              )) || (booking.services || []).map((s: any, i: number) => (
                <Text key={i} style={styles.serviceItem}>• {s.name}</Text>
              ))}
            </View>
            
            <View style={styles.detailDivider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>{booking.paymentMethod}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Status</Text>
              <Text style={[styles.detailValue, { color: booking.paymentStatus === 'paid' ? '#F5A623' : '#f28b2c' }]}>
                {booking.paymentStatus.toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹ {booking.totalAmount}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.dashboardBtn} onPress={() => navigation.navigate('HomeTabs')}>
          <Text style={styles.dashboardBtnText}>Back to dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  helpButton: {
    backgroundColor: '#f28b2c',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  helpText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  statusHeadingContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 25,
  },
  statusHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f28b2c',
    marginBottom: 5,
  },
  completionTime: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  infoCard: {
    backgroundColor: '#121212',
    borderRadius: 20,
    padding: 25,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#f28b2c',
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 13,
    color: '#AAAAAA',
  },
  callCenterBtn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    // marginLeft: -55,
  },
  callCenterText: {
    color: '#F5A623',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  trackingSection: {
    flexDirection: 'row',
    height: 560,
    marginTop: 20,
  },
  carContainer: {
    width: '50%',
    justifyContent: 'center',
    alignItems: 'flex-end',
    position: 'relative',
  },
  carImage: {
    width: width * 1.1,
    height: 555,
    position: 'absolute',
    right: -110,
    zIndex: 1,
  },
  stepperWrapper: {
    width: '50%',
    paddingLeft: 10,
    zIndex: 2,
  },
  stepperContainer: {
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderRadius: 25,
    padding: 12,
    paddingVertical: 20,
    height: '100%',
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 50,
  },
  indicatorContainer: {
    alignItems: 'center',
    width: 20,
    marginRight: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    zIndex: 2,
  },
  dotCompleted: {
    backgroundColor: '#00c853',
    borderColor: '#00c853',
  },
  dotCurrent: {
    backgroundColor: '#00c853',
    borderColor: '#00c853',
  },
  dotCanceled: {
    backgroundColor: '#ff4444',
    borderColor: '#ff4444',
  },
  dotPending: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#444444',
    marginVertical: 4,
  },
  lineCompleted: {
    backgroundColor: '#00c853',
  },
  lineCurrent: {
    backgroundColor: '#444444',
  },
  stepInfo: {
    flex: 1,
    marginTop: -2,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
  },
  stepLabelActive: {
    color: '#FFFFFF',
  },
  detailsSection: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f28b2c',
    marginBottom: 15,
  },
  detailsCard: {
    backgroundColor: '#121212',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  detailLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 5,
    width:'50%'
  },
  servicesList: {
    marginTop: 5,
    marginBottom: 15,
  },
  serviceItem: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 4,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailValue: {
    color: '#FFFFFF',
    fontWeight: '700',
  
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#f28b2c',
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  dashboardBtn: {
    backgroundColor: '#f28b2c',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  dashboardBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default LiveTrackingPage;

