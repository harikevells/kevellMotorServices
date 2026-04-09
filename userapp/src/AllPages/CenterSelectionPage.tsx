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
} from 'react-native';
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
}

const CenterSelectionPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CenterRouteProp>();
  const { serviceIds, vehicleId, category, fuel } = route.params;

  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCenters();
  }, []);

  const loadCenters = async () => {
    try {
      setLoading(true);
      // Fetch centers filtered by specialization (vehicle category and fuel type)
      const res = await fetchCenters({
        vehicle_category: category,
        fuel_type: fuel,
        // Optional: add latitude/longitude if available
      });
      setCenters(res.data);
    } catch (error) {
      console.error(error);
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
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>Service Centers Near You</Text>
          <View style={[styles.marker, { top: 40, left: 60 }]} />
          <View style={[styles.marker, { bottom: 50, right: 80 }]} />
          <View style={[styles.marker, { top: 100, right: 30 }]} />
          <View style={styles.userLocation} />
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listHeading}>Recommended for {fuel.toUpperCase()}</Text>
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
            vehicleId,
            category,
            fuel
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
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  mapPlaceholder: {
    height: 180,
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  mapText: {
    color: '#1976D2',
    fontWeight: '700',
    fontSize: 14,
  },
  marker: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  userLocation: {
    width: 16,
    height: 16,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 15,
  },
  listHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  listSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  listContainer: {
    paddingBottom: 100,
  },
  centerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    ...SHADOWS.light,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: COLORS.primary,
  },
  centerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: COLORS.text,
  },
  centerAddress: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  metaDivider: {
    marginHorizontal: 8,
    color: COLORS.grey,
  },
  distanceText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.grey,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  radioActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
    ...SHADOWS.medium,
  },
  disabledButton: {
    backgroundColor: COLORS.grey,
  },
  nextButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  }
});

export default CenterSelectionPage;
