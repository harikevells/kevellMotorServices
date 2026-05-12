import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import axios from 'axios';
import { fetchUserBookings } from '../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TrackingRouteProp = RouteProp<RootStackParamList, 'TrackingPage'>;

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
      0.5 - Math.cos(dLat)/2 + 
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      (1 - Math.cos(dLon))/2;
  return R * 2 * Math.asin(Math.sqrt(a));
};

const TrackingPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<TrackingRouteProp>();
  const { bookingId } = route.params;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  
  const [routePath, setRoutePath] = useState<{latitude: number, longitude: number}[]>([]);
  const [distanceKm, setDistanceKm] = useState<string>('0.0');
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);

  const loadTrackingData = useCallback(async () => {
    try {
      const res = await fetchUserBookings();
      const currentBooking = res.data.find((b: any) => b._id === bookingId || b.bookingRef === bookingId);
      
      if (currentBooking) {
        setBooking(currentBooking);
        
        const vendorLat = parseFloat(currentBooking.vendorDetails?.latitude || currentBooking.center?.location?.coordinates?.[1] || 0);
        const vendorLng = parseFloat(currentBooking.vendorDetails?.longitude || currentBooking.center?.location?.coordinates?.[0] || 0);
        const userLat = parseFloat(currentBooking.userDetails?.latitude || 0);
        const userLng = parseFloat(currentBooking.userDetails?.longitude || 0);

        if (vendorLat && vendorLng && userLat && userLng) {
          fetchRoute(vendorLat, vendorLng, userLat, userLng);
        }
      }
    } catch (error) {
      console.error('Tracking fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadTrackingData();
    // Optional: auto refresh every 15s
    const interval = setInterval(loadTrackingData, 15000);
    return () => clearInterval(interval);
  }, [loadTrackingData]);

  const fetchRoute = async (vLat: number, vLng: number, uLat: number, uLng: number) => {
    try {
      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${vLng},${vLat};${uLng},${uLat}?overview=full&geometries=geojson`,
        { timeout: 15000 }
      );
      if (response.data && response.data.routes && response.data.routes.length > 0) {
        const coords = response.data.routes[0].geometry.coordinates.map((coord: number[]) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        setRoutePath(coords);
        
        const durationSeconds = response.data.routes[0].duration;
        setEtaMinutes(Math.round(durationSeconds / 60));
      }
      const dist = calculateDistance(vLat, vLng, uLat, uLng).toFixed(1);
      setDistanceKm(dist);
    } catch (error) {
      console.warn('OSRM route fetch failed, using straight-line fallback:', error);
      setRoutePath([
        { latitude: vLat, longitude: vLng },
        { latitude: uLat, longitude: uLng }
      ]);
      const distKm = calculateDistance(vLat, vLng, uLat, uLng);
      setDistanceKm(distKm.toFixed(1));
      setEtaMinutes(Math.round(distKm * 2));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f28b2c" />
      </View>
    );
  }

  const vendorLat = parseFloat(booking?.vendorDetails?.latitude || booking?.center?.location?.coordinates?.[1] || 0);
  const vendorLng = parseFloat(booking?.vendorDetails?.longitude || booking?.center?.location?.coordinates?.[0] || 0);
  const userLat = parseFloat(booking?.userDetails?.latitude || 0);
  const userLng = parseFloat(booking?.userDetails?.longitude || 0);

  const validCoordinates = vendorLat !== 0 && vendorLng !== 0 && !isNaN(vendorLat) && !isNaN(vendorLng);

  const mapHtml = `
  <!DOCTYPE html>
  <html>
  <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
          body { padding: 0; margin: 0; background-color: #f8f9fa; }
          html, body, #map { height: 100%; width: 100vw; }
          .vendor-icon { background-color: #f97316; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-size: 18px; }
          .user-icon { background-color: #eab308; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-size: 18px; }
      </style>
  </head>
  <body>
      <div id="map"></div>
      <script>
          const vendorLat = ${vendorLat};
          const vendorLng = ${vendorLng};
          const userLat = ${userLat};
          const userLng = ${userLng};
          const routeStr = '${JSON.stringify(routePath)}';
          const routePath = JSON.parse(routeStr);

          const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([vendorLat, vendorLng], 14);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
          }).addTo(map);

          const vendorDiv = L.divIcon({ className: 'custom-div-icon', html: '<div class="vendor-icon">🚲</div>', iconSize: [36, 36], iconAnchor: [18, 18] });
          L.marker([vendorLat, vendorLng], { icon: vendorDiv }).addTo(map);

          if (userLat !== 0 && userLng !== 0) {
              const userDiv = L.divIcon({ className: 'custom-div-icon', html: '<div class="user-icon">👤</div>', iconSize: [36, 36], iconAnchor: [18, 18] });
              L.marker([userLat, userLng], { icon: userDiv }).addTo(map);
          }

          if (routePath && routePath.length > 0) {
              const latlngs = routePath.map(p => [p.latitude, p.longitude]);
              L.polyline(latlngs, {color: '#3b82f6', weight: 4, opacity: 0.8}).addTo(map);
              map.fitBounds(L.polyline(latlngs).getBounds(), { padding: [50, 50] });
          }
      </script>
  </body>
  </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {validCoordinates ? (
        <WebView 
          source={{ html: mapHtml }} 
          style={styles.map} 
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <View style={styles.noMapContainer}>
          <Text style={styles.noMapText}>Live location not available yet.</Text>
        </View>
      )}

      {/* Header / Back Button overlay */}
      <View style={styles.headerOverlay}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Tracking</Text>
      </View>

      {/* Floating Info Card */}
      {validCoordinates && (
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Vendor En Route</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Distance</Text>
              <Text style={styles.detailValue}>{distanceKm} km</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>ETA</Text>
              <Text style={[styles.detailValue, { color: '#F5A623' }]}>{etaMinutes !== null ? `${etaMinutes} mins` : 'Calculating...'}</Text>
            </View>
          </View>

          <View style={styles.vendorInfoRow}>
            <View style={styles.vendorIconBg}>
              <Text style={{fontSize: 20}}>👤</Text>
            </View>
            <View style={styles.vendorTextContainer}>
              <Text style={styles.vendorName}>{booking?.vendorDetails?.vendorName || booking?.center?.ownerName || 'Vendor'}</Text>
              <Text style={styles.vendorPhone}>{booking?.vendorDetails?.phone || booking?.center?.phone || 'No Phone'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.callBtn} 
              onPress={() => {
                const phone = booking?.vendorDetails?.phone || booking?.center?.phone;
                if (phone) {
                  Linking.openURL(`tel:${phone}`);
                }
              }}
            >
              <Text style={styles.callBtnIcon}>📞</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  noMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMapText: {
    fontSize: 16,
    color: '#888',
  },
  headerOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
    lineHeight: 28,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginLeft: 15,
    color: '#333',
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  vendorMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f97316',
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  userMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eab308',
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  markerText: {
    fontSize: 20,
  },
  infoCard: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0e6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f28b2c',
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f28b2c',
    letterSpacing: 0.5,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
    fontWeight: '700',
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333',
  },
  divider: {
    width: 1,
    height: '90%',
    backgroundColor: '#e0e0e0',
  },
  vendorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff4eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  vendorTextContainer: {
    flex: 1,
  },
  vendorName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#333',
    marginBottom: 3,
  },
  vendorPhone: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  callBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f28b2c',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f28b2c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  callBtnIcon: {
    fontSize: 20,
  },
});

export default TrackingPage;

