import React, { useState, useEffect, useRef } from 'react';
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
import { EVCharging } from '../assets/EVIcons';
import { fetchServices, fetchCategories } from '../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ServiceRouteProp = RouteProp<RootStackParamList, 'ServiceSelection'>;

interface Service {
  _id: string;
  serviceName: string;
  price: number;
  duration: string;
  description: string;
  category: string;
}

const ServiceSelectionPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ServiceRouteProp>();
  const { vehicleId, category: serviceType, fuel, vehicleCategory } = route.params;

  // Sanitise route params — guard against undefined being sent as a literal string
  const VALID_VEHICLE_CATS = ['2_wheeler', '4_wheeler', 'heavy'];
  const VALID_FUEL_TYPES = ['electric', 'petrol', 'diesel', 'cng', 'hybrid'];
  const safeCat = VALID_VEHICLE_CATS.includes(vehicleCategory) ? vehicleCategory : '';
  const safeFuel = VALID_FUEL_TYPES.includes(fuel) ? fuel : '';

  // API expects "2 Wheeler" instead of "2_wheeler"
  const getApiVehicleCat = (cat: string) => {
    if (cat === '2_wheeler') return '2 Wheeler';
    if (cat === '4_wheeler') return '4 Wheeler';
    if (cat === 'heavy') return 'Heavy';
    return cat;
  };

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>(['all']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const initialised = useRef(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Re-load services whenever category tab changes (skip first mount)
  useEffect(() => {
    if (!initialised.current) return;
    loadServices(selectedCategory);
  }, [selectedCategory]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setLoadError(false);

      // Load category tabs and initial service list in sequence
      const catRes = await fetchCategories();
      const rawCats = catRes?.data ?? catRes;
      const apiVehicleCat = getApiVehicleCat(safeCat);

      const fetchedCats = Array.isArray(rawCats)
        ? rawCats
          .map((c: any) => typeof c === 'string' ? c : c.name)
          .filter((name: string) => name === apiVehicleCat) // Only show current vehicle category tab
        : [];
      setCategories(['all', ...fetchedCats]);

      const res = await fetchServices(apiVehicleCat, '', safeFuel); // Filter by vehicle category initially
      const rawServices = res?.data ?? res;
      setServices(Array.isArray(rawServices) ? rawServices : []);

      initialised.current = true;
    } catch (err) {
      console.error('[ServiceSelection] load error:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async (cat: string) => {
    try {
      setLoading(true);
      setLoadError(false);
      const apiVehicleCat = getApiVehicleCat(safeCat);
      // If 'all', use the vehicle category as the filter. If specific tab, use that tab's name.
      const serviceCat = cat === 'all' ? apiVehicleCat : cat;
      const res = await fetchServices(serviceCat, '', safeFuel);
      const rawServices = res?.data ?? res;
      setServices(Array.isArray(rawServices) ? rawServices : []);
    } catch (err) {
      console.error('[ServiceSelection] filter error:', err);
      setLoadError(true);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (id: string) => {
    if (selectedServices.includes(id)) {
      setSelectedServices(selectedServices.filter(s => s !== id));
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  const calculateTotal = () => {
    return services
      .filter(s => selectedServices.includes(s._id))
      .reduce((sum, s) => sum + (s.price || 0), 0);
  };

  const renderServiceItem = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={[
        styles.serviceCard,
        selectedServices.includes(item._id) && styles.selectedCard
      ]}
      onPress={() => toggleService(item._id)}
    >
      <View style={styles.serviceRow}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.serviceName}</Text>
          <Text style={styles.serviceCategory}>{item.category}</Text>
          <Text style={styles.serviceDesc}>{item.description}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>⏱ {item.duration}</Text>
            <Text style={styles.metaDivider}>•</Text>
            <Text style={styles.metaText}>₹ {item.price}</Text>
          </View>
        </View>
        <View style={[styles.checkbox, selectedServices.includes(item._id) && styles.checkboxActive]}>
          {selectedServices.includes(item._id) && <Text style={styles.checkIcon}>✓</Text>}
        </View>
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
        <Text style={styles.headerTitle}>Select Services</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Categories Tabs */}
        <View style={styles.categoryScrollContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryTab, selectedCategory === cat && styles.activeTab]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryTabText, selectedCategory === cat && styles.activeTabText]}>
                  {cat.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.topCard}>
          <EVCharging width={60} height={60} />
          <View style={styles.topCardText}>
            <Text style={styles.topTitle}>{fuel.toUpperCase()} Services</Text>
            <Text style={styles.topSubtitle}>Categorized for {vehicleCategory?.replace('_', ' ')}</Text>
          </View>
        </View>

        {/* DEBUG BANNER - remove after fix */}
        <View style={{ backgroundColor: services.length === 0 && !loading ? '#ff4444' : '#22aa44', padding: 6, borderRadius: 8, marginBottom: 8 }}>
          <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', fontWeight: 'bold' }}>
            {loading ? 'Loading...' : `Services: ${services.length} | Cat: ${selectedCategory} | Error: ${String(loadError)}`}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
        ) : loadError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Failed to load services. Check connection.</Text>
            <TouchableOpacity
              style={[styles.retryButton]}
              onPress={() => loadInitialData()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : services.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No services available for this category.</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setSelectedCategory('all');
                loadServices('all');
              }}
            >
              <Text style={styles.retryButtonText}>Show All Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={services}
            keyExtractor={(item) => item._id}
            renderItem={renderServiceItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.footer}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal:</Text>
            <Text style={styles.priceValue}>₹ {calculateTotal()}</Text>
          </View>
          <TouchableOpacity
            style={[styles.nextButton, selectedServices.length === 0 && styles.disabledButton]}
            onPress={() => selectedServices.length > 0 && navigation.navigate('CenterSelection', {
              // @ts-ignore
              serviceIds: selectedServices,
              vehicleId,
              vehicleCategory: vehicleCategory,
              category: serviceType,
              fuel
            })}
            disabled={selectedServices.length === 0}
          >
            <Text style={styles.nextButtonText}>Next: Select Center</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  categoryScrollContainer: {
    marginBottom: 15,
  },
  categoryList: {
    paddingBottom: 10,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  activeTab: {
    backgroundColor: '#f28b2c',
    borderColor: '#f28b2c',
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#AAAAAA',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  topCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f28b2c33',
  },
  topCardText: {
    marginLeft: 15,
    flex: 1,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f28b2c',
  },
  topSubtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    marginTop: 2,
  },
  listContainer: {
    paddingBottom: 150,
  },
  serviceCard: {
    backgroundColor: '#121212',
    padding: 18,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1.5,
    borderColor: '#1A1A1A',
  },
  selectedCard: {
    borderColor: '#f28b2c',
    backgroundColor: '#1A1A1A',
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  serviceCategory: {
    fontSize: 11,
    color: '#f28b2c',
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serviceDesc: {
    fontSize: 13,
    color: '#AAAAAA',
    marginTop: 2,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f28b2c',
  },
  metaDivider: {
    marginHorizontal: 8,
    color: '#333333',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  checkboxActive: {
    backgroundColor: '#f28b2c',
    borderColor: '#f28b2c',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121212',
    padding: 25,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 16,
    color: '#AAAAAA',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
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
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  retryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: '#f28b2c',
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#060606',
  },
  loadingText: {
    marginTop: 15,
    color: '#f28b2c',
  },
});

export default ServiceSelectionPage;
