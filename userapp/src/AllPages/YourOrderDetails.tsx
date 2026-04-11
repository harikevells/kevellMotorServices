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
    FlatList,
    RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { EVCar } from '../assets/EVIcons';
import { fetchUserBookings } from '../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type TabType = 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled';

const BookingHistory = () => {
    const navigation = useNavigation<NavigationProp>();
    const [selectedTab, setSelectedTab] = useState<TabType>('Pending');
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const res: any = await fetchUserBookings();
            if (res.success) {
                setBookings(res.data);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getFilteredBookings = () => {
        if (selectedTab === 'Pending') {
            return bookings.filter(b => b.status === 'pending');
        } else if (selectedTab === 'Confirmed') {
            return bookings.filter(b => ['confirmed', 'received', 'inspected', 'in_service', 'quality_check', 'ready'].includes(b.status));
        } else if (selectedTab === 'Delivered') {
            return bookings.filter(b => ['completed', 'delivered'].includes(b.status));
        } else {
            return bookings.filter(b => b.status === 'cancelled');
        }
    };

    const renderBookingCard = (booking: any) => (
        <View key={booking._id} style={styles.activeBookingCard}>
            <View style={styles.cardHeader}>
                <Text style={styles.bookingRef}>Ref: {booking.bookingRef}</Text>
                <View style={[
                  styles.statusBadge, 
                  booking.status === 'cancelled' && { backgroundColor: '#FFEEED' }
                ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      booking.status === 'cancelled' && { color: '#FF4444' }
                    ]}>
                      {booking.status === 'completed' || booking.status === 'delivered' ? 'Delivered' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace(/_/g, ' ')}
                    </Text>
                </View>
            </View>
            <View style={styles.cardRow}>
                <View style={styles.iconContainer}>
                    <EVCar width={40} height={40} />
                </View>
                <View style={styles.cardDetails}>
                    <Text style={styles.vehicleTitle}>
                      {booking.vehicle.brand} {booking.vehicle.model}
                    </Text>
                    <Text style={styles.serviceText} numberOfLines={1}>
                      {booking.services.map((s: any) => s.name).join(' • ')}
                    </Text>
                    <Text style={styles.bookingTime}>
                      📅 {new Date(booking.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {booking.timeSlot}
                    </Text>
                    <View style={styles.actionRow}>
                        <Text style={styles.priceText}>₹{booking.totalAmount}</Text>
                        {(selectedTab === 'Pending' || selectedTab === 'Confirmed') && (
                          <TouchableOpacity 
                              style={styles.trackButton}
                              onPress={() => navigation.navigate('LiveTracking', { bookingId: booking._id })}
                          >
                              <Text style={styles.trackButtonText}>Track Service</Text>
                          </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </View>
    );

    const renderTab = (type: TabType) => (
        <TouchableOpacity
            style={[styles.tabPill, selectedTab === type ? styles.tabSelected : styles.tabUnselected]}
            onPress={() => setSelectedTab(type)}
        >
            <Text style={[styles.tabText, selectedTab === type ? styles.tabTextSelected : styles.tabTextUnselected]}>
                {type}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Bookings</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                    {renderTab('Pending')}
                    {renderTab('Confirmed')}
                    {renderTab('Delivered')}
                    {renderTab('Cancelled')}
                </ScrollView>
            </View>

            <ScrollView 
              contentContainerStyle={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadBookings(); }} />
              }
            >
                {loading ? (
                  <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 100 }} />
                ) : getFilteredBookings().length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyTextTitle}>No {selectedTab} Bookings</Text>
                    <Text style={styles.emptyTextSub}>Your {selectedTab.toLowerCase()} service history will appear here.</Text>
                  </View>
                ) : (
                  getFilteredBookings().map(renderBookingCard)
                )}

                {/* {!loading && bookings.length > 0 && (selectedTab === 'Pending' || selectedTab === 'Confirmed') && (
                  <>
                    <Text style={styles.historyHeading}>Recent History</Text>
                    <View style={styles.historyList}>
                        {bookings.filter(b => ['completed', 'delivered'].includes(b.status)).slice(0, 3).map((item, index, array) => (
                           <View key={item._id} style={styles.historyRow}>
                              <View style={styles.indicatorColumn}>
                                  <View style={styles.indicatorCircle}>
                                      <Text style={styles.indicatorIcon}>{index === 0 ? '🎁' : index === 1 ? '🛠️' : '⚙️'}</Text>
                                  </View>
                                  {index < array.length - 1 && <View style={styles.dashedLine} />}
                              </View>
                              <View style={styles.historyContent}>
                                  <Text style={styles.historyDate}>
                                    {new Date(item.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </Text>
                                  <Text style={styles.historyTitle}>{item.services[0]?.name || 'Auto Service'}</Text>
                                  <Text style={styles.historyLocation}>{item.center.center_name}</Text>
                                  <Text style={styles.historyPrice}>₹{item.totalAmount} • {item.status === 'completed' || item.status === 'delivered' ? 'Delivered' : item.status.charAt(0).toUpperCase() + item.status.slice(1).replace(/_/g, ' ')}</Text>
                              </View>
                          </View>
                        ))}
                    </View>
                  </>
                )} */}
            </ScrollView>
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
        padding: 20,
        paddingTop:60,
        backgroundColor: COLORS.white,
        ...SHADOWS.light,
    },
    backButton: {
        marginRight: 15,
    },
    backIcon: {
        fontSize: 24,
        color: COLORS.text,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginVertical: 20,
        gap: 10,
    },
    tabPill: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 50,
        borderWidth: 1,
    },
    tabSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    tabUnselected: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.border,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
    },
    tabTextSelected: {
        color: COLORS.white,
    },
    tabTextUnselected: {
        color: COLORS.textSecondary,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    activeBookingCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        marginBottom: 30,
        ...SHADOWS.light,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    bookingRef: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '700',
    },
    statusBadge: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeText: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: '800',
    },
    cardRow: {
        flexDirection: 'row',
    },
    iconContainer: {
        width: 60,
        height: 60,
        backgroundColor: COLORS.lightGrey,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    cardDetails: {
        flex: 1,
    },
    vehicleTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    serviceText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    bookingTime: {
        fontSize: 13,
        color: COLORS.text,
        fontWeight: '600',
        marginTop: 8,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
    },
    priceText: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.text,
    },
    trackButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 15,
    },
    trackButtonText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '700',
    },
    historyHeading: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 15,
    },
    historyList: {
        marginTop: 5,
    },
    historyRow: {
        flexDirection: 'row',
        minHeight: 100,
    },
    indicatorColumn: {
        alignItems: 'center',
        marginRight: 15,
        width: 40,
    },
    indicatorCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.lightGrey,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    indicatorIcon: {
        fontSize: 18,
    },
    dashedLine: {
        flex: 1,
        width: 2,
        borderLeftWidth: 2,
        borderLeftColor: COLORS.border,
        borderStyle: 'dashed',
        marginTop: -5,
        marginBottom: -5,
    },
    historyContent: {
        flex: 1,
        paddingTop: 5,
    },
    historyDate: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    historyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 2,
    },
    historyLocation: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    historyPrice: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
        marginTop: 4,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 100,
    },
    emptyIcon: {
      fontSize: 50,
      marginBottom: 20,
    },
    emptyTextTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: COLORS.text,
    },
    emptyTextSub: {
      fontSize: 14,
      color: COLORS.textSecondary,
      textAlign: 'center',
      marginTop: 10,
      paddingHorizontal: 40,
    },
});

export default BookingHistory;

