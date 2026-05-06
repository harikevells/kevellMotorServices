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
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { fetchProfile } from '../services/api';
import { WebView } from 'react-native-webview';
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; // Removing since it's black without API key

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type AddressRouteProp = RouteProp<RootStackParamList, 'Address'>;

const GEOAPIFY_API_KEY = '96f656418a7946a8923716c6138c8212';

const AddressPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddressRouteProp>();
  const { centerId, serviceIds, serviceNames, slotDate, slotTime, vehicleId, category, fuel, vehicleCategory } = route.params;

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
    latitude: 0,
    longitude: 0,
  });

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showUserLoc, setShowUserLoc] = useState(false);
  const [region, setRegion] = useState({
    latitude: 13.0827, // Default Chennai
    longitude: 80.2707,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const webViewRef = React.useRef<WebView>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const res: any = await fetchProfile();
      // res is { success: true, user: { ... } } due to axios interceptor returning response.data
      const userData = res?.user;
      if (userData) {
        setFormData(prev => ({
          ...prev,
          name: userData.name || '',
          mobile: userData.phone || '',
        }));
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      getCurrentLocation();
      return;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Kevell Motor Services needs access to your location for service delivery.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        getCurrentLocation();
      } else {
        Alert.alert('Permission Denied', 'Location permission is required to fetch live location.');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const getCurrentLocation = () => {
    setLoadingLocation(true);
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateLocation(latitude, longitude);
        
        // Sync to WebView
        const js = `if(window.updateCenter) window.updateCenter(${latitude}, ${longitude});`;
        webViewRef.current?.injectJavaScript(js);
        
        setLoadingLocation(false);
        Alert.alert('Location Found', 'Your current location has been updated on the map.');
      },
      (error) => {
        console.error(error);
        setLoadingLocation(false);
        Alert.alert('Error', 'Could not fetch your live location. Please check your GPS settings.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${GEOAPIFY_API_KEY}`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const address = data.features[0].properties.formatted;
        setFormData(prev => ({ ...prev, address }));
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const updateLocation = (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    setRegion(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
    reverseGeocode(lat, lng);
  };

  const generateMapHTML = (lat: number, lng: number) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style> 
          body { padding: 0; margin: 0; background: #FFFFFF; } 
          #map { height: 100vh; width: 100vw; } 
          .leaflet-control-attribution { display: none; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', {
            zoomControl: false
          }).setView([${lat}, ${lng}], 15);
          
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 20
          }).addTo(map);

          var marker = L.marker([${lat}, ${lng}], {
            draggable: false
          }).addTo(map);

          map.on('move', function() {
            var center = map.getCenter();
            marker.setLatLng(center);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              latitude: center.lat,
              longitude: center.lng
            }));
          });

          // Function to update center from outside
          window.updateCenter = function(newLat, newLng) {
            map.setView([newLat, newLng], 15);
            marker.setLatLng([newLat, newLng]);
          };
        </script>
      </body>
      </html>
    `;
  };

  const handleNext = () => {
    if (!formData.name || !formData.mobile || !formData.address) {
      Alert.alert('Error', 'Please fill in all details');
      return;
    }

    if (formData.latitude === 0) {
      Alert.alert('Error', 'Please capture your live location');
      return;
    }

    navigation.navigate('BookingSummary', {
      centerId,
      serviceIds,
      serviceNames,
      slotDate,
      slotTime,
      vehicleId,
      category,
      fuel,
      vehicleCategory,
      userName: formData.name,
      userPhone: formData.mobile,
      userAddress: formData.address,
      latitude: formData.latitude,
      longitude: formData.longitude,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Address</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.inputSection}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#666"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />

          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter mobile number"
            placeholderTextColor="#666"
            keyboardType="phone-pad"
            value={formData.mobile}
            onChangeText={(text) => setFormData({ ...formData, mobile: text })}
          />

          <Text style={styles.label}>Detailed Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Door No, Street, Landmark..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={3}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
          />
        </View>

        <View style={styles.locationSection}>
          <View style={styles.locationHeader}>
            <Text style={styles.label}>Live Location</Text>
            <TouchableOpacity
              style={styles.locationBtn}
              onPress={requestLocationPermission}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#f28b2c" />
              ) : (
                <Text style={styles.locationBtnText}>Capture My Location</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: generateMapHTML(region.latitude, region.longitude) }}
              style={styles.map}
              scrollEnabled={true}
              onMessage={(event) => {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.latitude && data.longitude) {
                  // Only update if not currently fetching user location to avoid loops
                  if (!loadingLocation) {
                    setFormData(prev => ({ ...prev, latitude: data.latitude, longitude: data.longitude }));
                    setRegion(prev => ({ ...prev, latitude: data.latitude, longitude: data.longitude }));
                    // Debounce geocoding or only do it on stop? 
                    // For now let's just update local state
                  }
                }
              }}
            />
            <View style={styles.markerFixed} pointerEvents="none">
              <View style={styles.markerDot} />
            </View>
          </View>

          <View style={styles.coordsDisplay}>
            <Text style={styles.coordsText}>Lat: {formData.latitude.toFixed(6)}</Text>
            <Text style={styles.coordsText}>Long: {formData.longitude.toFixed(6)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Confirm & Review</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060606',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 30,
    paddingVertical: 15,
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
  inputSection: {
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: '#f28b2c',
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 15,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  locationSection: {
    marginBottom: 30,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationBtn: {
    backgroundColor: 'rgba(242, 139, 44, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f28b2c',
  },
  locationBtnText: {
    color: '#f28b2c',
    fontSize: 12,
    fontWeight: '700',
  },
  mapContainer: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerFixed: {
    left: '50%',
    marginLeft: -12,
    marginTop: -48,
    position: 'absolute',
    top: '50%',
  },
  markerDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(242, 139, 44, 0.3)',
    borderWidth: 2,
    borderColor: '#f28b2c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coordsDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#121212',
    padding: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#333',
  },
  coordsText: {
    color: '#888',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  nextButton: {
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
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});

export default AddressPage;
