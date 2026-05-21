import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
    Image,
    Modal,
    TextInput,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeStorage, fetchProfile, fetchSpareParts, createSparePartOrder, getMySparePartOrders, updateSparePartOrderPayment, cancelSparePartOrder } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { getImageUrl } from '../constants/config';
import RazorpayCheckout from 'react-native-razorpay';

const UserProductspare = () => {
    const navigation = useNavigation();

    // Tab State
    const [activeTab, setActiveTab] = useState<'parts' | 'orders'>('parts');

    // Parts State
    const [parts, setParts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPart, setSelectedPart] = useState<any>(null);
    const [orderModalVisible, setOrderModalVisible] = useState(false);
    const [quantity, setQuantity] = useState('1');

    // View Order State
    const [viewOrderModalVisible, setViewOrderModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    // Cancel Order State
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<any>(null);
    const [cancelReason, setCancelReason] = useState('');

    // Orders State
    const [myOrders, setMyOrders] = useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

    // User Form Details
    const [userName, setUserName] = useState('');
    const [userPhone, setUserPhone] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userAddress, setUserAddress] = useState('');

    useEffect(() => {
        loadUserDetails();
        loadSpareParts();
    }, []);

    useEffect(() => {
        if (activeTab === 'orders') {
            loadMyOrders();
        }
    }, [activeTab]);

    const loadSpareParts = async () => {
        try {
            setLoading(true);
            const res: any = await fetchSpareParts();
            if (res.success) {
                setParts(res.data);
            }
        } catch (error) {
            console.warn('Failed to load spare parts:', error);
            Alert.alert('Error', 'Failed to load spare parts from the server.');
        } finally {
            setLoading(false);
        }
    };

    const loadMyOrders = async () => {
        try {
            setOrdersLoading(true);
            const res: any = await getMySparePartOrders();
            if (res.success) {
                setMyOrders(res.data);
            }
        } catch (error) {
            console.warn('Failed to load orders:', error);
        } finally {
            setOrdersLoading(false);
        }
    };

    const loadUserDetails = async () => {
        try {
            const storedUserStr = await SafeStorage.getItem('user');
            if (storedUserStr) {
                const storedUser = JSON.parse(storedUserStr);
                setUserName(storedUser.name || '');
                setUserPhone(storedUser.phone || '');
                setUserEmail(storedUser.email || '');
                setUserAddress(storedUser.address || '');
            }

            const res: any = await fetchProfile();
            if (res.success && res.user) {
                setUserName(res.user.name || userName);
                setUserPhone(res.user.phone || userPhone);
                setUserEmail(res.user.email || userEmail);
                setUserAddress(res.user.address || userAddress);
            }
        } catch (e) {
            console.warn('Could not load user details for order:', e);
        }
    };

    const openOrderDetails = (order: any) => {
        setSelectedOrder(order);
        setViewOrderModalVisible(true);
    };

    const openCancelModal = (order: any) => {
        setOrderToCancel(order);
        setCancelReason('');
        setCancelModalVisible(true);
    };

    const handleCancelOrder = async () => {
        if (!cancelReason || cancelReason.trim() === '') {
            Alert.alert('Error', 'Please provide a reason for cancellation.');
            return;
        }

        try {
            const res: any = await cancelSparePartOrder(orderToCancel._id, cancelReason);

            if (res.success) {
                setCancelModalVisible(false);
                Alert.alert(
                    'Order Cancelled',
                    'Your order has been cancelled successfully.',
                    [{ text: 'OK', onPress: () => { setCancelReason(''); loadMyOrders(); } }]
                );
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to cancel order. Please try again.');
        }
    };

    const openOrderModal = (part: any) => {
        setSelectedPart(part);
        setQuantity('1');
        setOrderModalVisible(true);
    };

    const handlePlaceOrder = async () => {
        if (!userName || !userPhone || !userAddress) {
            Alert.alert('Error', 'Please fill in all mandatory details (Name, Phone, Address).');
            return;
        }

        try {
            const orderData = {
                sparePartId: selectedPart._id,
                quantity: parseInt(quantity, 10) || 1,
                shippingAddress: {
                    name: userName,
                    phone: userPhone,
                    address: userAddress,
                    city: '', // Optional fields that could be added later
                    pincode: ''
                }
            };

            const res: any = await createSparePartOrder(orderData);

            if (res.success) {
                // Calculate amount
                const amount = selectedPart.amount * (parseInt(quantity, 10) || 1);

                const options = {
                    description: `Payment for ${selectedPart.name}`,
                    image: 'https://i.imgur.com/3g7nmJC.png',
                    currency: 'INR',
                    key: 'rzp_test_SfkV0cySd3CwyQ',
                    amount: amount * 100, // amount in paise
                    name: 'Kevell Motor Services',
                    theme: { color: '#f28b2c' },
                    prefill: {
                        email: userEmail || 'customer@example.com',
                        contact: userPhone || '9999999999',
                        name: userName || 'Customer'
                    }
                };

                const orderId = res.data._id;

                RazorpayCheckout.open(options).then(async (data: any) => {
                    try {
                        // Update backend with payment details
                        const paymentUpdateRes: any = await updateSparePartOrderPayment(orderId, {
                            paymentId: data.razorpay_payment_id,
                            paymentStatus: 'Paid'
                        });

                        setOrderModalVisible(false);
                        Alert.alert(
                            'Order & Payment Successful!',
                            `Your order for ${selectedPart?.name} has been placed. Payment ID: ${data.razorpay_payment_id}`,
                            [{ text: 'OK', onPress: () => { setSelectedPart(null); loadMyOrders(); setActiveTab('orders'); } }]
                        );
                        loadSpareParts(); // Refresh stock
                    } catch (updateError: any) {
                        console.warn('Error updating payment status:', updateError);
                        Alert.alert(
                            'Partial Success',
                            'Payment successful but failed to update order status. Please contact support.',
                            [{ text: 'OK', onPress: () => { setSelectedPart(null); loadMyOrders(); setActiveTab('orders'); } }]
                        );
                    }
                }).catch(async (error: any) => {
                    try {
                        // Update backend with failed payment status
                        await updateSparePartOrderPayment(orderId, {
                            paymentStatus: 'Failed'
                        });
                    } catch (updateError) {
                        console.warn('Error updating failed payment status:', updateError);
                    }

                    setOrderModalVisible(false);
                    Alert.alert('Payment Cancelled/Failed', 'Your order was created but payment was not completed.');
                    loadSpareParts();
                    loadMyOrders();
                });
            }
        } catch (error: any) {
            Alert.alert('Error', error.toString() || 'Failed to place order. Please try again.');
        }
    };

    // Filtered and Searched Parts
    const filteredParts = parts.filter(part => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = part.name.toLowerCase().includes(searchLower) ||
            (part.category && part.category.toLowerCase().includes(searchLower)) ||
            (part.brand && part.brand.toLowerCase().includes(searchLower));
        const matchesFilter = filterCategory === 'All' || part.category === filterCategory;
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return '#f59e0b';
            case 'Confirmed': return '#3b82f6';
            case 'Shipped': return '#8b5cf6';
            case 'Out for Delivery': return '#00bcd4';
            case 'Delivered': return '#10b981';
            case 'Cancelled': return '#ef4444';
            default: return '#f28b2c';
        }
    };

    const renderOrderItem = ({ item }: { item: any }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeaderRow}>
                <Text style={styles.orderIdText}>Order #{item._id.substring(0, 8).toUpperCase()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
            </View>
            <View style={styles.orderBody}>
                <Image
                    source={{ uri: getImageUrl(item.sparePart?.image) || 'https://via.placeholder.com/150/111111/f28b2c?text=No+Image' }}
                    style={styles.orderImage}
                />
                <View style={styles.orderDetails}>
                    <Text style={styles.orderPartName} numberOfLines={2}>{item.sparePart?.name || 'Unknown Part'}</Text>
                    <Text style={styles.orderPartBrand}>{item.sparePart?.brand || 'Generic'}</Text>
                    <Text style={styles.orderQtyText}>Qty: <Text style={{ color: '#fff', fontWeight: 'bold' }}>{item.quantity}</Text></Text>
                    <Text style={styles.orderPriceText}>Total: ₹{item.totalAmount}</Text>
                </View>
            </View>
            <View style={styles.orderFooter}>
                <Text style={styles.orderDateText}>Placed on {new Date(item.createdAt).toLocaleDateString()}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => openOrderDetails(item)} style={styles.footerButton}>
                        <Text style={styles.footerButtonText}>👁️ View</Text>
                    </TouchableOpacity>
                    {item.status === 'Pending' || item.status === 'Confirmed' ? (
                        <TouchableOpacity onPress={() => openCancelModal(item)} style={[styles.footerButton, { backgroundColor: '#ef4444' }]}>
                            <Text style={styles.footerButtonText}>✕ Cancel</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        </View>
    );

    const renderProductItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <Image source={{ uri: getImageUrl(item.image) || 'https://via.placeholder.com/150/111111/f28b2c?text=No+Image' }} style={styles.productImage} />
            <View style={styles.cardContent}>
                <View style={styles.categoryBrandRow}>
                    <Text style={styles.categoryText} numberOfLines={1}>{item.category || 'Spare'}</Text>
                    <Text style={styles.brandText} numberOfLines={1}>{item.brand || 'Generic'}</Text>
                </View>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.priceRatingRow}>
                    <View style={styles.ratingContainer}>
                        <Text style={styles.starIcon}>⭐</Text>
                        <Text style={styles.ratingText}>{item.rating || '4.5'}</Text>
                    </View>
                    <Text style={styles.productPrice}>₹{item.amount}</Text>
                </View>
                <Text style={[styles.stockText, { color: item.status === 'Out of Stock' ? '#ff5252' : '#4caf50' }]} numberOfLines={1}>
                    {item.status === 'Out of Stock' ? 'Out of Stock' : `${item.stockQty} left`}
                </Text>
                <TouchableOpacity
                    style={[styles.buyButton, item.status === 'Out of Stock' && { backgroundColor: '#555' }]}
                    onPress={() => openOrderModal(item)}
                    disabled={item.status === 'Out of Stock'}
                >
                    <Text style={styles.buyButtonText}>Buy Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Spare Parts</Text>
            </View>

            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleButton, activeTab === 'parts' && styles.toggleButtonActive]}
                    onPress={() => setActiveTab('parts')}
                >
                    <Text style={[styles.toggleText, activeTab === 'parts' && styles.toggleTextActive]}>Parts</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, activeTab === 'orders' && styles.toggleButtonActive]}
                    onPress={() => setActiveTab('orders')}
                >
                    <Text style={[styles.toggleText, activeTab === 'orders' && styles.toggleTextActive]}>My Orders</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'parts' ? (
                <>
                    <View style={styles.searchRow}>
                        <View style={styles.searchContainer}>
                            <Text style={styles.searchIcon}>🔍</Text>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search spare parts..."
                                placeholderTextColor="#666"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsContainer} contentContainerStyle={{ paddingHorizontal: 20 }}>
                        {['All', 'Bike', 'Car', 'Heavy'].map(cat => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]}
                                onPress={() => setFilterCategory(cat)}
                            >
                                <Text style={[styles.filterChipText, filterCategory === cat && styles.filterChipTextActive]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <FlatList
                        data={filteredParts}
                        keyExtractor={(item) => item._id}
                        renderItem={renderProductItem}
                        numColumns={3}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            !loading ? <Text style={styles.emptyText}>No spare parts found.</Text> : null
                        }
                    />
                </>
            ) : (
                <FlatList
                    data={myOrders}
                    keyExtractor={(item) => item._id}
                    renderItem={renderOrderItem}
                    contentContainerStyle={[styles.listContainer, { paddingTop: 20 }]}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        !ordersLoading ? <Text style={styles.emptyText}>You haven't placed any orders yet.</Text> : <Text style={styles.emptyText}>Loading orders...</Text>
                    }
                />
            )}

            {/* Order Modal */}
            <Modal
                visible={orderModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setOrderModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContent}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Complete Your Order</Text>
                            <TouchableOpacity onPress={() => setOrderModalVisible(false)}>
                                <Text style={styles.closeIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {selectedPart && (
                                <View style={styles.orderSummary}>
                                    <Text style={styles.summaryTitle}>Item: {selectedPart.name}</Text>
                                    <Text style={styles.summaryPrice}>Total: ₹{selectedPart.amount}</Text>
                                </View>
                            )}

                            <Text style={styles.inputLabel}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                value={userName}
                                onChangeText={setUserName}
                                placeholder="Enter your name"
                                placeholderTextColor="#666"
                            />

                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                value={userPhone}
                                onChangeText={setUserPhone}
                                placeholder="Enter your phone"
                                placeholderTextColor="#666"
                                keyboardType="phone-pad"
                            />

                            <Text style={styles.inputLabel}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                value={userEmail}
                                onChangeText={setUserEmail}
                                placeholder="Enter your email"
                                placeholderTextColor="#666"
                                keyboardType="email-address"
                            />

                            <Text style={styles.inputLabel}>Delivery Address</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={userAddress}
                                onChangeText={setUserAddress}
                                placeholder="Enter delivery address"
                                placeholderTextColor="#666"
                                multiline
                                numberOfLines={3}
                            />

                            <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
                                <Text style={styles.placeOrderText}>Confirm Order</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* View Order Details Modal */}
            <Modal
                visible={viewOrderModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setViewOrderModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Order Details</Text>
                            <TouchableOpacity onPress={() => setViewOrderModalVisible(false)}>
                                <Text style={styles.closeIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {selectedOrder && (
                                <>
                                    <View style={styles.detailsSection}>
                                        <Text style={styles.sectionHeading}>Product Info</Text>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Name:</Text>
                                            <Text style={styles.infoValue}>{selectedOrder.sparePart?.name}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Brand:</Text>
                                            <Text style={styles.infoValue}>{selectedOrder.sparePart?.brand}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Category:</Text>
                                            <Text style={styles.infoValue}>{selectedOrder.sparePart?.category}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Quantity:</Text>
                                            <Text style={styles.infoValue}>{selectedOrder.quantity}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailsSection}>
                                        <Text style={styles.sectionHeading}>Payment Info</Text>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Order ID:</Text>
                                            <Text style={styles.infoValue}>{selectedOrder._id}</Text>
                                        </View>
                                        {selectedOrder.paymentId && (
                                            <View style={styles.infoRow}>
                                                <Text style={styles.infoLabel}>Payment ID:</Text>
                                                <Text style={styles.infoValue}>{selectedOrder.paymentId}</Text>
                                            </View>
                                        )}
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Total Amount:</Text>
                                            <Text style={[styles.infoValue, { color: '#10b981' }]}>₹{selectedOrder.totalAmount}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Status:</Text>
                                            <Text style={[styles.infoValue, { color: getStatusColor(selectedOrder.status) }]}>{selectedOrder.status}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailsSection}>
                                        <Text style={styles.sectionHeading}>Shipping Address</Text>
                                        <Text style={styles.addressText}>{selectedOrder.shippingAddress?.name}</Text>
                                        <Text style={styles.addressText}>{selectedOrder.shippingAddress?.phone}</Text>
                                        <Text style={styles.addressText}>{selectedOrder.shippingAddress?.address}</Text>
                                        {selectedOrder.shippingAddress?.city ? <Text style={styles.addressText}>{selectedOrder.shippingAddress.city} - {selectedOrder.shippingAddress.pincode}</Text> : null}
                                    </View>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Cancel Order Modal */}
            <Modal
                visible={cancelModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setCancelModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContent}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Cancel Order</Text>
                            <TouchableOpacity onPress={() => setCancelModalVisible(false)}>
                                <Text style={styles.closeIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.orderSummary}>
                                <Text style={styles.summaryTitle}>Order #{orderToCancel?._id?.substring(0, 8).toUpperCase()}</Text>
                                <Text style={[styles.summaryPrice, { color: '#ef4444', marginTop: 5 }]}>Are you sure you want to cancel?</Text>
                            </View>

                            <Text style={styles.inputLabel}>Reason for Cancellation</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={cancelReason}
                                onChangeText={setCancelReason}
                                placeholder="Please provide a reason for cancellation..."
                                placeholderTextColor="#666"
                                multiline
                                numberOfLines={4}
                            />

                            <TouchableOpacity style={[styles.placeOrderButton, { backgroundColor: '#ef4444' }]} onPress={handleCancelOrder}>
                                <Text style={styles.placeOrderText}>Confirm Cancellation</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#111',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#1a1a1c',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 12,
        padding: 5,
        borderWidth: 1,
        borderColor: '#2a2a2c',
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    toggleButtonActive: {
        backgroundColor: '#f28b2c',
    },
    toggleText: {
        color: '#888',
        fontWeight: 'bold',
        fontSize: 14,
    },
    toggleTextActive: {
        color: '#fff',
    },
    searchRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: 15,
        marginBottom: 15,
        alignItems: 'center',
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#222',
        paddingHorizontal: 15,
        height: 45,
    },
    searchIcon: {
        fontSize: 16,
        color: '#666',
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
    },
    filterChipsContainer: {
        marginBottom: 15,
        height: 40,
        flexGrow: 0,
    },
    filterChip: {
        paddingHorizontal: 25,
        height: 40,
        borderRadius: 50,
        backgroundColor: '#111',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterChipActive: {
        backgroundColor: '#f28b2c',
        borderColor: '#f28b2c',
    },
    filterChipText: {
        color: '#ccc',
        fontSize: 13,
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    listContainer: {
        paddingHorizontal: 10,
        paddingBottom: 120, // Leave space for bottom tabs
    },
    card: {
        backgroundColor: '#111',
        borderRadius: 12,
        marginBottom: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#222',
        width: '31%',
        marginHorizontal: '1.15%',
    },
    productImage: {
        width: '100%',
        height: 130,
        resizeMode: 'cover',
    },
    cardContent: {
        padding: 8,
    },
    categoryBrandRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 3,
    },
    categoryText: {
        color: '#f28b2c',
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        flex: 1,
    },
    brandText: {
        color: '#aaa',
        fontSize: 9,
        fontWeight: '600',
        textAlign: 'right',
        flex: 1,
    },
    productName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
        height: 19,
    },
    priceRatingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starIcon: {
        fontSize: 10,
        marginRight: 3,
    },
    ratingText: {
        fontSize: 10,
        color: '#ccc',
        fontWeight: 'bold',
    },
    productPrice: {
        fontSize: 13,
        color: '#ccc',
        fontWeight: '600',
    },
    buyButton: {
        backgroundColor: '#f28b2c',
        paddingVertical: 6,
        borderRadius: 6,
        alignItems: 'center',
    },
    buyButtonText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    stockText: {
        fontSize: 9,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptyText: {
        color: '#888',
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
    },

    // Order Cards Styles
    orderCard: {
        backgroundColor: '#151517',
        borderRadius: 16,
        marginBottom: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: '#222',
        marginHorizontal: 10,
    },
    orderHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        paddingBottom: 10,
    },
    orderIdText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    orderBody: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderImage: {
        width: 70,
        height: 70,
        borderRadius: 10,
        backgroundColor: '#09090b',
        marginRight: 15,
        borderWidth: 1,
        borderColor: '#222',
    },
    orderDetails: {
        flex: 1,
    },
    orderPartName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    orderPartBrand: {
        color: '#f28b2c',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    orderQtyText: {
        color: '#aaa',
        fontSize: 13,
        marginBottom: 3,
    },
    orderPriceText: {
        color: '#10b981',
        fontSize: 15,
        fontWeight: 'bold',
        marginTop: 2,
    },
    orderFooter: {
        borderTopWidth: 1,
        borderTopColor: '#222',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderDateText: {
        color: '#666',
        fontSize: 11,
        fontWeight: '600',
    },
    footerButton: {
        backgroundColor: '#222',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerButtonText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 25,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    closeIcon: {
        fontSize: 24,
        color: '#888',
        padding: 5,
    },
    orderSummary: {
        backgroundColor: '#222',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#f28b2c',
    },
    summaryTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    summaryPrice: {
        color: '#f28b2c',
        fontSize: 16,
        fontWeight: '700',
    },
    inputLabel: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 10,
        color: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 15,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    placeOrderButton: {
        backgroundColor: '#f28b2c',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    placeOrderText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    viewIconContainer: {
        padding: 4,
        backgroundColor: '#222',
        borderRadius: 6,
    },
    viewIcon: {
        fontSize: 14,
    },
    detailsSection: {
        marginBottom: 20,
        backgroundColor: '#222',
        padding: 15,
        borderRadius: 12,
    },
    sectionHeading: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f28b2c',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingBottom: 5,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    infoLabel: {
        color: '#888',
        fontSize: 14,
        flex: 1,
    },
    infoValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        flex: 2,
        textAlign: 'right',
    },
    addressText: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 4,
        lineHeight: 20,
    },
});

export default UserProductspare;
