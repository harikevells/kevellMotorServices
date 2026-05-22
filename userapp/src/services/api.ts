import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BASE_URL } from '../constants/config';

// Base URL is now managed in src/constants/config.ts

// --- RESILIENT STORAGE WRAPPER ---
// Fixes "Native module is null" if AsyncStorage isn't built/linked correctly
const MemoryStorage: Record<string, string> = {};

const SafeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (!AsyncStorage) return MemoryStorage[key] || null;
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn('[Storage-Safe] Falling back to memory storage due to error:', e);
      return MemoryStorage[key] || null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (!AsyncStorage) {
        MemoryStorage[key] = value;
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn('[Storage-Safe] Falling back to memory storage due to error:', e);
      MemoryStorage[key] = value;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (!AsyncStorage) {
        delete MemoryStorage[key];
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (e) {
      delete MemoryStorage[key];
    }
  }
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor for Auth Token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SafeStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('[API-Auth] Failed to retrieve token:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for Error Handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'Something went wrong';

    if (error.response) {
      // Backend returned an error (4xx, 5xx)
      message = error.response.data?.message || `Server Error: ${error.response.status}`;
      console.error('[API Error Response]:', error.response.status, message);
    } else if (error.request) {
      // Request was made but no response received (Network issues)
      message = 'Network error or server unreachable. Check your connection.';
      console.error('[API Network Error]:', error.request);
    } else {
      // Error setting up the request
      message = error.message;
      console.error('[API Request Error]:', message);
    }

    return Promise.reject(message);
  }
);

// --- API FUNCTIONS ---

// Authentication
export { SafeStorage };
export const login = (data: any) => api.post('/auth/login', data);
export const register = (data: any) => api.post('/auth/register', data);
export const fetchProfile = () => api.get('/auth/profile');
export const updateProfile = (data: any) => api.put('/users/profile', data);
export const uploadAvatar = (formData: any) => api.post('/users/upload-avatar', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const sendOTP = (phone: string) => api.post('/auth/send-otp', { phone });
export const verifyOTP = (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp });

// Vehicles
export const fetchUserVehicles = () => api.get('/vehicles');
export const addVehicle = (data: any) => api.post('/vehicles', data);
export const fetchBrands = (category: string, fuel: string) =>
  api.get(`/vehicles/brands?category=${category}&fuel=${fuel}`);

// Services
export const fetchCategories = () => api.get('/services/categories');
export const fetchServices = (serviceCategory: string, vehicleCategory: string, fuelType: string) =>
  api.get(`/services?category=${serviceCategory}&vehicle_category=${vehicleCategory}&fuel_type=${fuelType}`);

// Centers
export const fetchCenters = (params: any) => api.get('/centers', { params });
export const fetchCenterDetails = (id: string) => api.get(`/centers/${id}`);
export const fetchSlots = (centerId: string, date: string) =>
  api.get(`/slots/${centerId}?date=${date}`);

// Bookings
export const createBooking = (data: any) => api.post('/bookings', data);
export const fetchUserBookings = () => api.get('/bookings');
export const fetchTracking = (bookingId: string) => api.get('/bookings/' + bookingId + '/track');
export const cancelBooking = (bookingId: string, reason: string) => api.patch(`/bookings/${bookingId}/cancel`, { reason });
export const replyBookingReview = (bookingId: string, reply: string) => api.post(`/bookings/${bookingId}/reply`, { reply });

// Offers
export const fetchActiveOffers = () => api.get('/offers/active');
export const validateOffer = (couponCode: string, subtotal: number) => api.post('/offers/validate', { couponCode, subtotal });

// Reviews
export const addReview = (data: { orderId: string, rating: number, comment: string }) =>
  api.post(`/bookings/${data.orderId}/review`, { rating: data.rating, comment: data.comment });

export const fetchCenterReviews = (shopId: string) => api.get(`bookings/center/${shopId}/reviews`);

// Vendor
export const fetchVendorOrders = () => api.get('/vendor/orders');
export const updateOrderStatus = (bookingId: string, status: string, location?: { latitude: number; longitude: number }) =>
  api.patch(`/vendor/orders/${bookingId}/status`, { status, location });
export const updateOrderLocation = (bookingId: string, latitude: number, longitude: number) =>
  api.patch(`/vendor/orders/${bookingId}/location`, { latitude, longitude });
export const updateOrderPaymentStatus = (bookingId: string, paymentStatus: string) =>
  api.patch(`/vendor/orders/${bookingId}/payment-status`, { paymentStatus });
export const fetchVendorDashboard = () => api.get('/vendor/dashboard');
export const fetchOrderStatistics = (year?: number, period?: string) => {
  const params: any = {};
  if (year) params.year = year;
  if (period) params.period = period.toLowerCase();
  return api.get('/vendor/orders/statistics', { params });
};
export const fetchDeliveryBoys = () => api.get('/vendor/delivery-boys');
export const fetchSpareParts = () => api.get('/spare-parts');
export const createSparePartOrder = (data: any) => api.post('/spare-part-orders', data);
export const getMySparePartOrders = () => api.get('/spare-part-orders/my-orders');
export const updateSparePartOrderPayment = (orderId: string, paymentData: any) =>
  api.put(`/spare-part-orders/${orderId}/payment`, paymentData);
export const cancelSparePartOrder = (orderId: string, cancelReason: string) =>
  api.put(`/spare-part-orders/${orderId}/cancel`, { cancelReason });
export const addSparePartReview = (partId: string, rating: number, comment: string) =>
  api.post(`/spare-parts/${partId}/reviews`, { rating, comment });
export const uploadBookingBill = (bookingId: string, formData: FormData) =>
  api.post(`/vendor/orders/${bookingId}/bill`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

// Notifications
export const fetchNotifications = () => api.get('/notifications');
export const markNotificationRead = (id: string) => api.put(`/notifications/mark-read/${id}`);
export const markAllNotificationsRead = () => api.put('/notifications/mark-all-read');

// Razorpay
export const createRazorpayOrder = (orderId: string) => api.post('/razorpay/create-order', { orderId });
export const verifyRazorpayPayment = (data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderId: string;
}) => api.post('/razorpay/verify', data);

// Subscriptions
export const fetchSubscriptions = () => api.get('/subscriptions');
export const purchaseSubscription = (planId: string) => api.post('/subscriptions/purchase', { planId });
export const fetchMySubscriptions = () => api.get('/subscriptions/my-subscriptions');

export default api;
