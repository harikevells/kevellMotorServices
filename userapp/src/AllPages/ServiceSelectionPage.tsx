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
  Image,
  Platform,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
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
  const [selectionMode, setSelectionMode] = useState<'select' | 'other'>('select');
  const [manualServices, setManualServices] = useState('');
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

  const renderServiceItem = ({ item }: { item: Service }) => {
    return (
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={() => toggleService(item._id)}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={[styles.radioCircle, selectedServices.includes(item._id) && styles.radioCircleActive, { marginRight: 12, marginTop: 2 }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            {item.description ? <Text style={styles.serviceDesc} numberOfLines={2}>{item.description}</Text> : null}
            <Text style={styles.metaText}>{item.duration}- {item.price}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choose Your Services</Text>
        <Text style={styles.headerSubtitle}>{vehicleCategory?.replace('_', '-').toUpperCase()} SERVICES</Text>
      </View>

      {/* Selection Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleButton, selectionMode === 'select' && styles.toggleButtonActive]} 
          onPress={() => setSelectionMode('select')}
        >
          <Text style={[styles.toggleText, selectionMode === 'select' && styles.toggleTextActive]}>Select</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleButton, selectionMode === 'other' && styles.toggleButtonActive]} 
          onPress={() => setSelectionMode('other')}
        >
          <Text style={[styles.toggleText, selectionMode === 'other' && styles.toggleTextActive]}>Other</Text>
        </TouchableOpacity>
      </View>

      {/* Fixed Background Image */}
      <Image
        source={require('../assets/servicesnamerightimage.png')}
        style={styles.fixedImage}
        resizeMode="contain"
      />

      <View style={styles.content}>
        {selectionMode === 'other' ? (
          <View style={styles.manualContainer}>
            <Text style={styles.manualLabel}>Type your services manually</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.manualInput}
                placeholder="e.g. Engine work, Painting..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={6}
                value={manualServices}
                onChangeText={setManualServices}
                textAlignVertical="top"
              />
            </View>
            <Text style={styles.manualHint}>Type each service separated by commas</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator size="large" color={'#f28b2c'} style={{ marginTop: 50 }} />
        ) : loadError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Failed to load services. Check connection.</Text>
            <TouchableOpacity
              style={styles.retryButton}
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
      </View>

      <View style={styles.footer}>
        <View style={styles.divider} />
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Subtotal</Text>
          <Text style={styles.priceValue}>{calculateTotal()}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.nextButton, 
            (selectionMode === 'select' ? selectedServices.length === 0 : manualServices.trim().length === 0) && styles.disabledButton
          ]}
          onPress={() => {
            const isReady = selectionMode === 'select' ? selectedServices.length > 0 : manualServices.trim().length > 0;
            if (isReady) {
              navigation.navigate('CenterSelection', {
                serviceIds: selectionMode === 'select' ? selectedServices : [],
                serviceNames: selectionMode === 'other' ? manualServices.split(',').map(s => s.trim()).filter(s => s) : [],
                vehicleId,
                vehicleCategory: vehicleCategory,
                category: serviceType,
                fuel
              });
            }
          }}
          disabled={selectionMode === 'select' ? selectedServices.length === 0 : manualServices.trim().length === 0}
        >
          <Text style={styles.nextButtonText}>Next Select center</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#000000',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#00FF7F',
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 1,
  },
  fixedImage: {
    position: 'absolute',
    right: -30, // Adjust to move image to the right and cut it in half like the design
    top: '15%',
    width: 260, // Large enough to act as background
    height: '75%',
    zIndex: 0,
  },
  content: {
    flex: 1,
    paddingLeft: 20,
    paddingRight: '45%', // Drastically increased to push text completely to the left
    zIndex: 5,
  },
  listContainer: {
    paddingBottom: 40,
    paddingTop: 10,
  },
  serviceCard: {
    marginBottom: 25,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DDDDDD',
  },
  radioCircleActive: {
    backgroundColor: '#00FF7F', // vibrant green like the design
  },
  serviceName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
    lineHeight: 20,
  },
  serviceDesc: {
    fontSize: 11,
    color: '#AAAAAA',
    lineHeight: 14,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#f28b2c',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 25,
    paddingBottom: Platform.OS === 'android' ? 40 : 30,
    paddingTop: 10,
    backgroundColor: '#000000',
    zIndex: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#222222',
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  priceLabel: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  priceValue: {
    fontSize: 14,
    color: '#f28b2c',
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#f28b2c',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    alignSelf: 'center',
    width: '80%',
  },
  disabledButton: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: '#f28b2c',
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 30,
    marginBottom: 10,
    backgroundColor: '#111',
    borderRadius: 25,
    padding: 4,
    zIndex: 10,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 22,
  },
  toggleButtonActive: {
    backgroundColor: '#f28b2c',
  },
  toggleText: {
    color: '#888',
    fontWeight: '700',
    fontSize: 14,
  },
  toggleTextActive: {
    color: '#000',
  },
  manualContainer: {
    marginTop: 30,
    paddingRight: 10,
  },
  manualLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 15,
  },
  inputWrapper: {
    backgroundColor: '#121212',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#f28b2c44',
    padding: 15,
  },
  manualInput: {
    color: '#FFFFFF',
    fontSize: 15,
    height: 120,
  },
  manualHint: {
    color: '#666',
    fontSize: 12,
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default ServiceSelectionPage;
