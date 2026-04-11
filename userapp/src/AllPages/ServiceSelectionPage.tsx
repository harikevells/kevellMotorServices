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
  name: string;
  base_price: number;
  duration_minutes: number;
  description: string;
  category: string;
}

const ServiceSelectionPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ServiceRouteProp>();
  const { vehicleId, category: vehicleCat, fuel } = route.params;

  // Sanitise route params — guard against undefined being sent as a literal string
  const VALID_VEHICLE_CATS = ['2_wheeler', '4_wheeler', 'heavy'];
  const VALID_FUEL_TYPES   = ['electric', 'petrol', 'diesel', 'cng', 'hybrid'];
  const safeCat  = VALID_VEHICLE_CATS.includes(vehicleCat) ? vehicleCat : '';
  const safeFuel = VALID_FUEL_TYPES.includes(fuel)         ? fuel        : '';

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
      const fetchedCats: string[] = Array.isArray(rawCats) ? rawCats : [];
      setCategories(['all', ...fetchedCats]);

      const res = await fetchServices('', safeCat, safeFuel);
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
      const serviceCat = cat === 'all' ? '' : cat;
      const res = await fetchServices(serviceCat, safeCat, safeFuel);
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
      .reduce((sum, s) => sum + s.base_price, 0);
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
          <Text style={styles.serviceName}>{item.name}</Text>
          <Text style={styles.serviceDesc}>{item.description}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>⏱ {item.duration_minutes} mins</Text>
            <Text style={styles.metaDivider}>•</Text>
            <Text style={styles.metaText}>₹ {item.base_price}</Text>
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
            <Text style={styles.topSubtitle}>Categorized for {vehicleCat.replace('_', ' ')}</Text>
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
               category: vehicleCat,
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
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginRight: 10,
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.white,
  },
  topCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  topCardText: {
    marginLeft: 15,
    flex: 1,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  topSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  listContainer: {
    paddingBottom: 150,
  },
  serviceCard: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
    ...SHADOWS.light,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: COLORS.primary,
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
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  serviceDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  metaDivider: {
    marginHorizontal: 8,
    color: COLORS.grey,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: COLORS.grey,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkIcon: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    ...SHADOWS.medium,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  priceLabel: {
    fontSize: 16,
    width: '50%',
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
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
    marginTop: 50,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginTop: 4,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default ServiceSelectionPage;
