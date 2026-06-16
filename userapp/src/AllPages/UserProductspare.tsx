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
import { SafeStorage, fetchProfile, fetchSpareParts, createSparePartOrder, getMySparePartOrders, updateSparePartOrderPayment, cancelSparePartOrder, addSparePartReview, fetchMySubscriptions } from '../services/api';
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

    // Review State
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [partToReview, setPartToReview] = useState<any>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [existingReview, setExistingReview] = useState<any>(null);

    // Orders State
    const [myOrders, setMyOrders] = useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [fullScreenItem, setFullScreenItem] = useState<any>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // User Form Details
    const [userId, setUserId] = useState('');
    const [userName, setUserName] = useState('');
    const [userPhone, setUserPhone] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userStreet, setUserStreet] = useState('');
    const [userDistrict, setUserDistrict] = useState('');
    const [userState, setUserState] = useState('');
    const [userPincode, setUserPincode] = useState('');

    const [subDiscountAmount, setSubDiscountAmount] = useState(0);

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
                setUserId(storedUser._id || storedUser.id || '');
                setUserName(storedUser.name || '');
                setUserPhone(storedUser.phone || '');
                setUserEmail(storedUser.email || '');
                setUserStreet(storedUser.address?.street || '');
                setUserDistrict(storedUser.address?.city || '');
                setUserState(storedUser.address?.state || '');
                setUserPincode(storedUser.address?.pincode || '');
            }

            const res: any = await fetchProfile();
            if (res.success && res.user) {
                setUserId(res.user._id || res.user.id || userId);
                setUserName(res.user.name || userName);
                setUserPhone(res.user.phone || userPhone);
                setUserEmail(res.user.email || userEmail);
                setUserStreet(res.user.address?.street || userStreet);
                setUserDistrict(res.user.address?.city || userDistrict);
                setUserState(res.user.address?.state || userState);
                setUserPincode(res.user.address?.pincode || userPincode);
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
                    [{ text: 'OK', onPress: () => { setCancelReason(''); loadMyOrders(); loadSpareParts(); } }]
                );
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to cancel order. Please try again.');
        }
    };

    const openReviewModal = (order: any) => {
        setPartToReview(order.sparePart);
        
        // Find if user already reviewed
        const userReview = order.sparePart?.reviews?.find((r: any) => r.user === userId || r.user?._id === userId);
        
        if (userReview) {
            setExistingReview(userReview);
            setReviewRating(userReview.rating || 5);
            setReviewComment(userReview.comment || '');
        } else {
            setExistingReview(null);
            setReviewRating(5);
            setReviewComment('');
        }
        
        setReviewModalVisible(true);
    };

    const handleSubmitReview = async () => {
        if (!reviewComment.trim()) {
            Alert.alert('Error', 'Please provide a comment for your review.');
            return;
        }

        try {
            const res: any = await addSparePartReview(partToReview._id, reviewRating, reviewComment);
            if (res.success) {
                setReviewModalVisible(false);
                Alert.alert('Success', 'Review submitted successfully!', [
                    { text: 'OK', onPress: () => loadMyOrders() }
                ]);
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to submit review.');
        }
    };

    const openOrderModal = async (part: any) => {
        setSelectedPart(part);
        setQuantity('1');
        setOrderModalVisible(true);
        setSubDiscountAmount(0);

        try {
            const mySub: any = await fetchMySubscriptions();
            if (mySub.success && mySub.active && mySub.active.plan && mySub.active.plan.features) {
                const activeSub = mySub.active;
                let discountPercentage = 0;
                for (const feature of activeSub.plan.features) {
                    const match = feature.match(/(\d+)%\s*off\s*on\s*spare\s*part/i);
                    if (match) {
                        discountPercentage = parseInt(match[1], 10);
                        break;
                    }
                }
                if (discountPercentage > 0) {
                    const calculatedSubDiscount = (part.amount * 1) * (discountPercentage / 100);
                    setSubDiscountAmount(calculatedSubDiscount);
                }
            }
        } catch (e) {
            console.warn('Failed to fetch subscription for discount', e);
        }
    };

    const handlePlaceOrder = async () => {
        if (!userName || !userPhone || !userStreet || !userDistrict || !userState || !userPincode) {
            Alert.alert('Error', 'Please fill in all mandatory details including full address.');
            return;
        }

        try {
            // Calculate amount with delivery charge
            let amount = (selectedPart.amount * (parseInt(quantity, 10) || 1));
            const calculatedSubDiscount = subDiscountAmount * (parseInt(quantity, 10) || 1); // scale discount with quantity if updated
            amount = amount - calculatedSubDiscount + 50; // subtotal - discount + delivery

            const orderData = {
                sparePartId: selectedPart._id,
                quantity: parseInt(quantity, 10) || 1,
                totalAmount: amount,
                shippingAddress: {
                    name: userName,
                    phone: userPhone,
                    street: userStreet,
                    district: userDistrict,
                    state: userState,
                    pincode: userPincode
                }
            };

            const res: any = await createSparePartOrder(orderData);

            if (res.success) {
                const options = {
                    description: `Payment for ${selectedPart.name}`,
                    image: 'https://i.imgur.com/3g7nmJC.png',
                    currency: 'INR',
                    key: 'rzp_test_SfkV0cySd3CwyQ',
                    amount: Math.round(amount * 100), // amount in paise, ensure integer
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
                    {item.status === 'Delivered' ? (
                        <TouchableOpacity onPress={() => openReviewModal(item)} style={[styles.footerButton, { backgroundColor: '#f59e0b' }]}>
                            <Text style={[styles.footerButtonText, { color: '#fff' }]}>⭐ Review</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        </View>
    );

    const renderProductItem = ({ item }: { item: any }) => {
        const isOutOfStock = item.stockQty <= 0;
        
        return (
            <View style={styles.card}>
                <TouchableOpacity style={styles.imageContainer} onPress={() => { setFullScreenItem(item); setCurrentImageIndex(0); }}>
                    <Image source={{ uri: getImageUrl(item.images && item.images.length > 0 ? item.images[0] : item.image) || 'https://via.placeholder.com/150/111111/f28b2c?text=No+Image' }} style={styles.productImage} />
                </TouchableOpacity>
                <View style={styles.cardContent}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                            {item.description ? (
                                <Text style={styles.productDescription} numberOfLines={2}>{item.description}</Text>
                            ) : null}
                        </View>
                        <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                            <Text style={styles.categoryText} numberOfLines={1}>{item.category || 'Spare'}</Text>
                            <Text style={styles.brandText} numberOfLines={1}>{item.brand || 'Generic'}</Text>
                        </View>
                    </View>
                    <View style={styles.priceRatingRow}>
                        <View style={styles.ratingContainer}>
                            <Text style={styles.starIcon}>⭐</Text>
                            <Text style={styles.ratingText}>{item.rating || '4.5'}</Text>
                        </View>
                        <Text style={[styles.stockText, { color: isOutOfStock ? '#ff5252' : '#ff4444' }]} numberOfLines={1}>
                            {isOutOfStock ? 'OUT OF STOCK' : `${item.stockQty} LEFT`}
                        </Text>
                    </View>
                    <Text style={styles.productPrice}>₹{item.amount}</Text>
                    <TouchableOpacity
                        style={[styles.buyButton, isOutOfStock && { backgroundColor: '#555' }]}
                        onPress={() => openOrderModal(item)}
                        disabled={isOutOfStock}
                    >
                        <Text style={styles.buyButtonText}>SHOP NOW</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Spare Shop</Text>
            </View>

            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={() => setActiveTab('parts')}
                >
                    <Text style={[styles.toggleText, activeTab === 'parts' && styles.toggleTextActive]}>SPARE PARTS</Text>
                    {activeTab === 'parts' && <View style={styles.activeTabLine} />}
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={() => setActiveTab('orders')}
                >
                    <Text style={[styles.toggleText, activeTab === 'orders' && styles.toggleTextActive]}>MY ORDERS</Text>
                    {activeTab === 'orders' && <View style={styles.activeTabLine} />}
                </TouchableOpacity>
            </View>

            {activeTab === 'parts' ? (
                <>
                    <View style={styles.searchRow}>
                        <View style={styles.searchContainer}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search..."
                                placeholderTextColor="#999"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            <View style={styles.searchIconInsideBtn}>
                                <Text style={styles.searchIconInsideText}>🔍</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.filterIconButton} onPress={() => setFilterModalVisible(true)}>
                            <Text style={styles.filterIconText}>⚙️</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        key={'single-column'}
                        data={filteredParts}
                        keyExtractor={(item) => item._id}
                        renderItem={renderProductItem}
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
                            <Text style={styles.modalTitle}>Your Order Details</Text>
                            <TouchableOpacity onPress={() => setOrderModalVisible(false)}>
                                <Text style={styles.closeIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {selectedPart && (
                                <View style={styles.orderSummary}>
                                    <Text style={styles.summaryTitle}>Item: {selectedPart.name}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 15, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                                        <Text style={{ color: '#CCC', fontSize: 14, fontWeight: 'bold' }}>QUANTITY</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <TouchableOpacity 
                                                onPress={() => setQuantity(String(Math.max(1, parseInt(quantity, 10) - 1)))}
                                                style={{ paddingHorizontal: 15, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 5 }}
                                            >
                                                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>-</Text>
                                            </TouchableOpacity>
                                            <Text style={{ color: '#FFF', fontSize: 16, marginHorizontal: 15, fontWeight: 'bold' }}>{quantity}</Text>
                                            <TouchableOpacity 
                                                onPress={() => setQuantity(String(Math.min(selectedPart.stockQty || 1, parseInt(quantity, 10) + 1)))}
                                                style={{ paddingHorizontal: 15, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 5 }}
                                                disabled={parseInt(quantity, 10) >= (selectedPart.stockQty || 1)}
                                            >
                                                <Text style={{ color: parseInt(quantity, 10) >= (selectedPart.stockQty || 1) ? '#666' : '#FFF', fontSize: 18, fontWeight: 'bold' }}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                                        <Text style={{ color: '#aaa', flex: 1 }}>Total:</Text>
                                        <Text style={{ color: '#fff', width:60 }}>₹{selectedPart.amount * (parseInt(quantity, 10) || 1)}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                                        <Text style={{ color: '#aaa', flex: 1 }}>Delivery Charge:</Text>
                                        <Text style={{ color: '#fff', width:60 }}>₹50</Text>
                                    </View>
                                    {subDiscountAmount > 0 && (
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                                            <Text style={{ color: '#F5A623', flex: 1 }}>⭐ Sub Discount:</Text>
                                            <Text style={{ color: '#F5A623', width:60 }}>-₹{(subDiscountAmount * (parseInt(quantity, 10) || 1)).toFixed(2)}</Text>
                                        </View>
                                    )}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 10 }}>
                                        <Text style={[styles.summaryPrice, { marginTop: 0, flex: 1 }]}>Sub Total:</Text>
                                        <Text style={[styles.summaryPrice, { marginTop: 0 }]}>₹{((selectedPart.amount * (parseInt(quantity, 10) || 1)) - (subDiscountAmount * (parseInt(quantity, 10) || 1)) + 50).toFixed(2)}</Text>
                                    </View>
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

                            <Text style={styles.inputLabel}>Street / Area</Text>
                            <TextInput
                                style={styles.input}
                                value={userStreet}
                                onChangeText={setUserStreet}
                                placeholder="Enter street or area"
                                placeholderTextColor="#666"
                            />

                            <Text style={styles.inputLabel}>District</Text>
                            <TextInput
                                style={styles.input}
                                value={userDistrict}
                                onChangeText={setUserDistrict}
                                placeholder="Enter district"
                                placeholderTextColor="#666"
                            />

                            <Text style={styles.inputLabel}>State</Text>
                            <TextInput
                                style={styles.input}
                                value={userState}
                                onChangeText={setUserState}
                                placeholder="Enter state"
                                placeholderTextColor="#666"
                            />

                            <Text style={styles.inputLabel}>Pincode</Text>
                            <TextInput
                                style={styles.input}
                                value={userPincode}
                                onChangeText={setUserPincode}
                                placeholder="Enter pincode"
                                placeholderTextColor="#666"
                                keyboardType="number-pad"
                                maxLength={6}
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
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Item Total:</Text>
                                            <Text style={styles.infoValue}>₹{selectedOrder.sparePart?.amount * selectedOrder.quantity}</Text>
                                        </View>
                                        {selectedOrder.vendorDiscount > 0 && (
                                            <View style={styles.infoRow}>
                                                <Text style={styles.infoLabel}>Vendor Discount:</Text>
                                                <Text style={[styles.infoValue, { color: '#10b981' }]}>-₹{selectedOrder.vendorDiscount.toFixed(2)}</Text>
                                            </View>
                                        )}
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Delivery Charge:</Text>
                                            <Text style={styles.infoValue}>₹{selectedOrder.deliveryCharge || 50}</Text>
                                        </View>
                                        <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: '#333', paddingTop: 8, marginTop: 4 }]}>
                                            <Text style={[styles.infoLabel, { fontWeight: 'bold' }]}>Grand Total:</Text>
                                            <Text style={[styles.infoValue, { color: '#10b981', fontWeight: 'bold' }]}>₹{selectedOrder.totalAmount}</Text>
                                        </View>
                                        {selectedOrder.paymentId && (
                                            <View style={styles.infoRow}>
                                                <Text style={styles.infoLabel}>Payment ID:</Text>
                                                <Text style={styles.infoValue}>{selectedOrder.paymentId}</Text>
                                            </View>
                                        )}
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Payment Status:</Text>
                                            <Text style={styles.infoValue}>{selectedOrder.paymentStatus || 'Pending'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Order Status:</Text>
                                            <Text style={[styles.infoValue, { color: getStatusColor(selectedOrder.status) }]}>{selectedOrder.status}</Text>
                                        </View>
                                        {selectedOrder.status === 'Cancelled' && selectedOrder.cancelReason && (
                                            <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: '#333', paddingTop: 8, marginTop: 4 }]}>
                                                <Text style={[styles.infoLabel, { color: '#ef4444' }]}>Cancel Reason:</Text>
                                                <Text style={[styles.infoValue, { color: '#ef4444' }]}>{selectedOrder.cancelReason}</Text>
                                            </View>
                                        )}
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

            {/* Review Modal */}
            <Modal
                visible={reviewModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setReviewModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContent}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Rate & Review</Text>
                            <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                                <Text style={styles.closeIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.inputLabel, { textAlign: 'center', marginBottom: 15 }]}>How was your experience with {partToReview?.name}?</Text>
                            
                            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 25 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => !existingReview && setReviewRating(star)} disabled={!!existingReview}>
                                        <Text style={{ fontSize: 35, color: star <= reviewRating ? '#f59e0b' : '#333', marginHorizontal: 5 }}>★</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Review Comment</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, existingReview && { backgroundColor: '#222', color: '#999' }]}
                                value={reviewComment}
                                onChangeText={setReviewComment}
                                placeholder="Share your experience with this part..."
                                placeholderTextColor="#666"
                                multiline
                                numberOfLines={4}
                                editable={!existingReview}
                            />

                            {existingReview && existingReview.vendorReply && (
                                <View style={{ backgroundColor: '#222', padding: 15, borderRadius: 10, marginTop: 10, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: '#f59e0b' }}>
                                    <Text style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: 5 }}>Vendor Response:</Text>
                                    <Text style={{ color: '#ddd' }}>{existingReview.vendorReply}</Text>
                                </View>
                            )}

                            <TouchableOpacity 
                                style={[styles.placeOrderButton, existingReview && { backgroundColor: '#555' }]} 
                                onPress={handleSubmitReview}
                                disabled={!!existingReview}
                            >
                                <Text style={styles.placeOrderText}>{existingReview ? 'Already Reviewed' : 'Submit Review'}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* Filter Modal */}
            <Modal
                visible={filterModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '50%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter by Category</Text>
                            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                <Text style={styles.closeIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {['All', 'Bike', 'Car', 'Heavy'].map(cat => (
                            <TouchableOpacity 
                                key={cat} 
                                style={[styles.filterModalOption, filterCategory === cat && styles.filterModalOptionActive]}
                                onPress={() => {
                                    setFilterCategory(cat);
                                    setFilterModalVisible(false);
                                }}
                            >
                                <Text style={[styles.filterModalOptionText, filterCategory === cat && styles.filterModalOptionTextActive]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>

            {/* Full Screen Image Modal */}
            <Modal
                visible={!!fullScreenItem}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setFullScreenItem(null)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity 
                        style={{ position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, right: 20, zIndex: 10, padding: 10 }}
                        onPress={() => setFullScreenItem(null)}
                    >
                        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>✕</Text>
                    </TouchableOpacity>

                    {fullScreenItem && (
                        <View style={{ width: '100%', height: '70%', justifyContent: 'center', alignItems: 'center' }}>
                            <Image 
                                source={{ uri: getImageUrl(fullScreenItem.images && fullScreenItem.images.length > 0 ? fullScreenItem.images[currentImageIndex] : fullScreenItem.image) || 'https://via.placeholder.com/150/111111/f28b2c?text=No+Image' }} 
                                style={{ width: '90%', height: '100%', resizeMode: 'contain' }} 
                            />

                            {fullScreenItem.images && fullScreenItem.images.length > 1 && (
                                <>
                                    <TouchableOpacity
                                        style={{ position: 'absolute', left: 10, top: '50%', padding: 15, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 25 }}
                                        onPress={() => setCurrentImageIndex(prev => prev === 0 ? fullScreenItem.images.length - 1 : prev - 1)}
                                    >
                                        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>{'<'}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{ position: 'absolute', right: 10, top: '50%', padding: 15, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 25 }}
                                        onPress={() => setCurrentImageIndex(prev => prev === fullScreenItem.images.length - 1 ? 0 : prev + 1)}
                                    >
                                        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>{'>'}</Text>
                                    </TouchableOpacity>

                                    <View style={{ position: 'absolute', bottom: -30, flexDirection: 'row', justifyContent: 'center', width: '100%' }}>
                                        {fullScreenItem.images.map((_: any, idx: number) => (
                                            <TouchableOpacity key={idx} onPress={() => setCurrentImageIndex(idx)}>
                                                <View
                                                    style={{
                                                        width: currentImageIndex === idx ? 12 : 8,
                                                        height: currentImageIndex === idx ? 12 : 8,
                                                        borderRadius: 6,
                                                        backgroundColor: currentImageIndex === idx ? '#f28b2c' : '#555',
                                                        marginHorizontal: 5
                                                    }}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}
                        </View>
                    )}
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
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 15,
        backgroundColor: '#000',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        paddingTop: 30,
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 10,
        backgroundColor: '#000',
    },
    toggleButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    toggleButtonActive: {
    },
    toggleText: {
        color: '#666',
        fontWeight: 'bold',
        fontSize: 14,
        textTransform: 'uppercase',
    },
    toggleTextActive: {
        color: '#fff',
    },
    activeTabLine: {
        height: 2,
        backgroundColor: '#f28b2c',
        width: '100%',
        marginTop: 5,
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
        backgroundColor: '#ffffff',
        borderRadius: 25,
        paddingLeft: 20,
        paddingRight: 5,
        height: 45,
    },
    searchInput: {
        flex: 1,
        color: '#333',
        fontSize: 15,
        height: '100%',
    },
    searchIconInsideBtn: {
        backgroundColor: '#f28b2c',
        width: 35,
        height: 35,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchIconInsideText: {
        color: '#fff',
        fontSize: 14,
    },
    filterIconButton: {
        backgroundColor: '#222',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#333',
        width: 45,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    filterIconText: {
        fontSize: 18,
        color: '#fff',
    },
    filterModalOption: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        paddingHorizontal: 10,
    },
    filterModalOptionActive: {
        backgroundColor: '#221100', // Dark orange/brown
    },
    filterModalOptionText: {
        fontSize: 16,
        color: '#ccc',
        fontWeight: '500',
    },
    filterModalOptionTextActive: {
        color: '#f28b2c',
        fontWeight: 'bold',
    },
    listContainer: {
        paddingHorizontal: 15,
        paddingBottom: 120, // Leave space for bottom tabs
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#111',
        borderRadius: 12,
        marginBottom: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#222',
        width: '100%',
    },
    imageContainer: {
        width: 140,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productImage: {
        width: 120,
        height: 140,
        resizeMode: 'contain',
    },
    cardContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    categoryText: {
        color: '#f28b2c',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'right',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    brandText: {
        color: '#AAA',
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'right',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
        flex: 1,
    },
    productDescription: {
        fontSize: 12,
        color: '#AAA',
        marginBottom: 8,
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
        fontSize: 12,
        marginRight: 3,
    },
    ratingText: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: 'bold',
    },
    stockText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    productPrice: {
        fontSize: 18,
        color: '#FFF',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    buyButton: {
        backgroundColor: '#f28b2c',
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
    },
    buyButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
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
