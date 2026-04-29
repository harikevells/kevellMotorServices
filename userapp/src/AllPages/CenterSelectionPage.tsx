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
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { fetchCenters } from '../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CenterRouteProp = RouteProp<RootStackParamList, 'CenterSelection'>;

interface Center {
  _id: string;
  center_name: string;
  address: string;
  city: string;
  rating: number;
  total_reviews: number;
  distance?: number;
  profile_image_url?: string;
  specializations: string[];
  location?: {
    coordinates: [number, number]; // [longitude, latitude]
  };
}

const CenterSelectionPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CenterRouteProp>();
  const { serviceIds, serviceNames, vehicleId, category, fuel, vehicleCategory } = route.params || {};

  // Safely guard against undefined parameters so string methods like .toUpperCase() don't crash
  const safeCategory = typeof vehicleCategory === 'string' ? vehicleCategory : '';
  const safeFuel = typeof fuel === 'string' ? fuel : '';

  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCenters();
  }, []);

  const generateMapHTML = (mapCenters: Center[]) => {
    // Filter centers that have valid coordinates
    const validCenters = mapCenters.filter(c => c.location && c.location.coordinates && c.location.coordinates.length === 2);
    
    let centerLat = 13.0827; // Chennai default
    let centerLng = 80.2116;
    
    if (validCenters.length > 0) {
      let sumLat = 0, sumLng = 0;
      validCenters.forEach(c => {
         sumLng += c.location!.coordinates[0];
         sumLat += c.location!.coordinates[1];
      });
      centerLat = sumLat / validCenters.length;
      centerLng = sumLng / validCenters.length;
    }
    
    const markers = validCenters.map(c => `
      L.marker([${c.location!.coordinates[1]}, ${c.location!.coordinates[0]}]).addTo(map)
        .bindTooltip("${c.center_name}", { permanent: true, direction: "top", offset: [0, -35], className: "custom-tooltip" })
        .bindPopup("<b>${c.center_name}</b><br>${c.city}");
    `).join('\n');

    const boundsArray = validCenters.map(c => `[${c.location!.coordinates[1]}, ${c.location!.coordinates[0]}]`).join(',');
    const fitBoundsScript = validCenters.length > 0 
      ? `
        setTimeout(function() {
          map.invalidateSize();
          var bounds = L.latLngBounds([${boundsArray}]); 
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }, 500);
      `
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style> 
          body { padding: 0; margin: 0; } 
          #map { height: 100vh; width: 100vw; } 
          .custom-tooltip {
            background-color: #121212;
            color: #F5A623;
            border: 1px solid #F5A623;
            font-weight: 800;
            border-radius: 8px;
            padding: 4px 8px;
            font-size: 12px;
          }
          .leaflet-tooltip-top:before {
            border-top-color: #F5A623;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${centerLat}, ${centerLng}], 11);
          
          // Using CartoDB Dark Matter tiles
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            maxZoom: 19
          }).addTo(map);
          
          ${markers}
          ${fitBoundsScript}
        </script>
      </body>
      </html>
    `;
  };

  const loadCenters = async () => {
    try {
      setLoading(true);
      const res = await fetchCenters({
        vehicle_category: safeCategory,
        fuel_type: safeFuel,
      });
      const rawCenters = res?.data ?? res;
      setCenters(Array.isArray(rawCenters) ? rawCenters : []);
    } catch (error) {
      const msg = typeof error === 'string' ? error : (error as any)?.message || String(error);
      console.error('[CenterSelection] load error:', msg);
      setCenters([]);
    } finally {
      setLoading(false);
    }
  };

  const renderCenterItem = ({ item }: { item: Center }) => (
    <TouchableOpacity
      style={[
        styles.centerCard,
        selectedCenter === item._id && styles.selectedCard
      ]}
      onPress={() => setSelectedCenter(item._id)}
    >
      <View style={styles.centerIconContainer}>
        <Text style={styles.centerEmoji}>🏭</Text>
      </View>
      <View style={styles.centerInfo}>
        <Text style={styles.centerName}>{item.center_name}</Text>
        <Text style={styles.centerLocation}>📍 {item.city}</Text>
        <Text style={styles.centerAddress}>{item.address}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.ratingText}>⭐ {item.rating} ({item.total_reviews})</Text>
          <Text style={styles.metaDivider}>•</Text>
          <Text style={styles.distanceText}>
             {item.specializations.includes('electric') ? '⚡ EV Pro' : '🛠️ Master'}
          </Text>
        </View>
      </View>
      <View style={[styles.radio, selectedCenter === item._id && styles.radioActive]}>
        {selectedCenter === item._id && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.mapWrap}>
          <WebView 
            key={centers.length}
            originWhitelist={['*']}
            source={{ html: generateMapHTML(centers) }} 
            style={{ width: '100%', height: '100%' }}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listHeading}>
            {safeFuel ? `Recommended for ${safeFuel.toUpperCase()}` : 'Recommended Centers'}
          </Text>
          <Text style={styles.listSubtitle}>{centers.length} centers found</Text>
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : centers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No centers found for your vehicle type.</Text>
          </View>
        ) : (
          <FlatList
            data={centers}
            keyExtractor={(item) => item._id}
            renderItem={renderCenterItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity 
          style={[styles.nextButton, !selectedCenter && styles.disabledButton]}
          onPress={() => selectedCenter && navigation.navigate('SlotBooking', { 
            centerId: selectedCenter, 
            serviceIds,
            serviceNames,
            vehicleId,
            category,
            fuel,
            vehicleCategory
          })}
          disabled={!selectedCenter}
        >
          <Text style={styles.nextButtonText}>Choose Time Slot</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop:40,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#060606',
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
  mapWrap: {
    height: 180,
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#121212',
  },
  mapText: {
    color: '#AAAAAA',
    fontWeight: '700',
    fontSize: 14,
  },
  marker: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: '#f28b2c',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userLocation: {
    width: 16,
    height: 16,
    backgroundColor: '#3498db',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 15,
  },
  listHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f28b2c',
  },
  listSubtitle: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  listContainer: {
    paddingBottom: 120,
  },
  centerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  selectedCard: {
    borderColor: '#f28b2c',
    backgroundColor: '#1A1A1A',
  },
  centerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  centerEmoji: {
    fontSize: 24,
  },
  centerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  centerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centerLocation: {
    fontSize: 14,
    color: '#f28b2c',
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 2,
  },
  centerAddress: {
    fontSize: 13,
    color: '#AAAAAA',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metaDivider: {
    marginHorizontal: 8,
    color: '#333333',
  },
  distanceText: {
    fontSize: 12,
    color: '#f28b2c',
    fontWeight: '700',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  radioActive: {
    borderColor: '#f28b2c',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f28b2c',
  },
  nextButton: {
    backgroundColor: '#f28b2c',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    margin: 20,
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    shadowColor: '#f28b2c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#333333',
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
  }
});

export default CenterSelectionPage;
