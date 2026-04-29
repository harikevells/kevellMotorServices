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
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { COLORS, SHADOWS } from '../constants/theme';
import { fetchUserBookings, addReview } from '../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Aligning with image tab names
type TabType = 'Upcoming' | 'Completed' | 'Canceled';

const BookingHistory = () => {
    const navigation = useNavigation<NavigationProp>();
    const [selectedTab, setSelectedTab] = useState<TabType>('Upcoming');
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Review Modal States
    const [isReviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedBookingForReview, setSelectedBookingForReview] = useState<any>(null);
    const [rating, setRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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

    const handleOpenReview = (booking: any) => {
        setSelectedBookingForReview(booking);
        // Pre-fill if review already exists
        if (booking.review && booking.review.rating) {
            setRating(booking.review.rating);
            setReviewComment(booking.review.comment || '');
        } else {
            setRating(5);
            setReviewComment('');
        }
        setReviewModalVisible(true);
    };

    const handleSubmitReview = async () => {
        if (!selectedBookingForReview) return;

        try {
            setIsSubmittingReview(true);
            const orderId = selectedBookingForReview._id;

            const res: any = await addReview({
                orderId: orderId,
                rating: rating,
                comment: reviewComment
            });

            if (res.success) {
                Alert.alert('Success', 'Thank you for your review!');
                setReviewModalVisible(false);
                loadBookings(); // Refresh bookings to get updated review
            }
        } catch (error: any) {
            console.error('Error submitting review:', error);
            Alert.alert('Oops', error || 'Failed to submit review');
            setReviewModalVisible(false);
        } finally {
            setIsSubmittingReview(false);
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
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                                style={styles.ratingButton}
                                onPress={() => handleOpenReview(booking)}
                            >
                                <Text style={styles.ratingText}>
                                    {booking.review && booking.review.rating ? '★ Rating' : '★ Rating'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.viewDetailsButton}
                                onPress={() => navigation.navigate('LiveTracking', { bookingId: booking._id })}
                            >
                                <Text style={styles.viewDetailsText}>View details</Text>
                            </TouchableOpacity>
                        </View>
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

            {/* Review Modal */}
            <Modal
                visible={isReviewModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setReviewModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Rate Your Experience</Text>
                            <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                                <Text style={styles.closeIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            How was the service at {selectedBookingForReview?.center?.shopName || selectedBookingForReview?.center?.ownerName || 'the service center'}?
                        </Text>

                        <View style={styles.starContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                    <Text style={[styles.starIcon, rating >= star && styles.starIconSelected]}>
                                        ★
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={styles.reviewInput}
                            placeholder="Share your experience (optional)..."
                            placeholderTextColor="#666"
                            multiline
                            numberOfLines={4}
                            value={reviewComment}
                            onChangeText={setReviewComment}
                        />

                        <TouchableOpacity
                            style={styles.submitReviewButton}
                            onPress={handleSubmitReview}
                            disabled={isSubmittingReview}
                        >
                            {isSubmittingReview ? (
                                <ActivityIndicator size="small" color="#000" />
                            ) : (
                                <Text style={styles.submitReviewText}>Submit Review</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        marginBottom: 40
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingTop: 50,


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
    ratingButton: {
        backgroundColor: '#f28b2c',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    ratingText: {
        color: '#000000',
        fontSize: 12,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        width: '100%',
        padding: 20,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    closeIcon: {
        fontSize: 20,
        color: '#888',
        padding: 5,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#AAAAAA',
        marginBottom: 20,
    },
    starContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        gap: 10,
    },
    starIcon: {
        fontSize: 40,
        color: '#444',
    },
    starIconSelected: {
        color: '#FFD700',
    },
    reviewInput: {
        backgroundColor: '#2A2A2A',
        borderRadius: 10,
        padding: 15,
        color: '#FFFFFF',
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    submitReviewButton: {
        backgroundColor: '#f28b2c',
        borderRadius: 10,
        paddingVertical: 15,
        alignItems: 'center',
    },
    submitReviewText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default BookingHistory;

