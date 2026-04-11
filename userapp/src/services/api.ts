import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Standard for Android Emulator to localhost
const BASE_URL = 'http://192.168.0.137:5000/api'; 

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

// Vendor
export const fetchVendorOrders = () => api.get('/vendor/orders');
export const updateOrderStatus = (bookingId: string, status: string) => 
  api.patch(`/vendor/orders/${bookingId}/status`, { status });
export const fetchVendorDashboard = () => api.get('/vendor/dashboard');
export const fetchOrderStatistics = (year: number) => api.get(`/vendor/orders/statistics?year=${year}`);
export const fetchDeliveryBoys = () => api.get('/vendor/delivery-boys');

export default api;
