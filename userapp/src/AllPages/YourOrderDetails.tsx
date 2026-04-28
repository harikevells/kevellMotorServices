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
    RefreshControl,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { COLORS, SHADOWS } from '../constants/theme';
import { fetchUserBookings } from '../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Aligning with image tab names
type TabType = 'Upcoming' | 'Completed' | 'Canceled';

const BookingHistory = () => {
    const navigation = useNavigation<NavigationProp>();
    const [selectedTab, setSelectedTab] = useState<TabType>('Upcoming');
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
        if (selectedTab === 'Upcoming') {
            return bookings.filter(b => ['pending', 'confirmed', 'received', 'inspected', 'in_service', 'quality_check', 'ready'].includes(b.status));
        } else if (selectedTab === 'Completed') {
            return bookings.filter(b => ['completed', 'delivered'].includes(b.status));
        } else {
            return bookings.filter(b => b.status === 'cancelled');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#F5A623'; 
            case 'confirmed': return '#2196F3'; 
            case 'received': return '#9C27B0'; 
            case 'inspected': return '#00BCD4'; 
            case 'in_service': return '#FF9800'; 
            case 'quality_check': return '#3F51B5'; 
            case 'ready': return '#8BC34A'; 
            case 'completed': return '#4CAF50'; 
            case 'delivered': return '#4CAF50'; 
            case 'cancelled': return '#f44336'; 
            default: return '#1a1a2e'; 
        }
    };

    const renderBookingCard = (booking: any) => {
        const isUpcoming = ['pending', 'confirmed', 'received', 'inspected', 'in_service', 'quality_check', 'ready'].includes(booking.status);
        
        return (
            <View key={booking._id} style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.bookingRef}>Ref :-{booking.bookingRef}</Text>
                    <View style={styles.statusContainer}>
                        <View style={[
                            styles.statusDot, 
                            { backgroundColor: getStatusColor(booking.status) }
                        ]} />
                        <Text style={[
                            styles.statusText,
                            { color: getStatusColor(booking.status) }
                        ]}>
                            {booking.status === 'completed' || booking.status === 'delivered' ? 'Completed' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace(/_/g, ' ')}
                        </Text>
                    </View>
                </View>

                <Text style={styles.vehicleTitle}>
                    {booking.vehicle.brand} {booking.vehicle.model}
                </Text>
                
                <Text style={styles.serviceText} numberOfLines={1}>
                    {booking.services.map((s: any) => s.name).join(' • ')}
                </Text>
                
                <Text style={styles.bookingTime}>
                    {new Date(booking.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}-{booking.timeSlot}
                </Text>

                <View style={styles.actionRow}>
                    <Text style={styles.priceText}>₹ {booking.totalAmount}</Text>
                    {isUpcoming ? (
                        <TouchableOpacity 
                            style={styles.trackButton}
                            onPress={() => navigation.navigate('LiveTracking', { bookingId: booking._id })}
                        >
                            <Text style={styles.trackButtonText}>View Details</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            style={styles.viewDetailsButton}
                            onPress={() => navigation.navigate('LiveTracking', { bookingId: booking._id })}
                        >
                            <Text style={styles.viewDetailsText}>View details</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const renderTab = (type: TabType) => (
        <TouchableOpacity
            style={[styles.tabItem, selectedTab === type && styles.tabItemActive]}
            onPress={() => setSelectedTab(type)}
        >
            <Text style={[styles.tabText, selectedTab === type && styles.tabTextActive]}>
                {type}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Bookings</Text>
            </View>

            <View style={styles.tabWrapper}>
                <View style={styles.tabContainer}>
                    {renderTab('Upcoming')}
                    {renderTab('Completed')}
                    {renderTab('Canceled')}
                </View>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={() => { setRefreshing(true); loadBookings(); }}
                        tintColor="#f28b2c"
                    />
                }
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#f28b2c" style={{ marginTop: 100 }} />
                ) : getFilteredBookings().length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyTextTitle}>No {selectedTab} Bookings</Text>
                        <Text style={styles.emptyTextSub}>Your {selectedTab.toLowerCase()} service history will appear here.</Text>
                    </View>
                ) : (
                    getFilteredBookings().map(renderBookingCard)
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
paddingTop:50,

    },
    backButton: {
        marginRight: 15,
    },
    backIcon: {
        fontSize: 26,
        color: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    tabWrapper: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#1A1A1A',
        borderRadius: 15,
        padding: 5,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabItemActive: {
        borderBottomColor: '#f28b2c',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#888888',
    },
    tabTextActive: {
        color: '#f28b2c',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#121212',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    bookingRef: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    vehicleTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    serviceText: {
        fontSize: 13,
        color: '#AAAAAA',
        marginTop: 5,
    },
    bookingTime: {
        fontSize: 13,
        color: '#AAAAAA',
        marginTop: 5,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
    },
    priceText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    trackButton: {
        backgroundColor: '#f28b2c',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    trackButtonText: {
        color: '#000000',
        fontSize: 12,
        fontWeight: '700',
    },
    viewDetailsButton: {
        backgroundColor: 'transparent',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#333333',
    },
    viewDetailsText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
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
        color: '#FFFFFF',
    },
    emptyTextSub: {
        fontSize: 14,
        color: '#888888',
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 40,
    },
});

export default BookingHistory;

