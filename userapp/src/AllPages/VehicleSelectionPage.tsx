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
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { EVCar } from '../assets/EVIcons';
import { fetchUserVehicles, addVehicle, fetchBrands } from '../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Vehicle {
  _id: string;
  vehicle_category: string;
  fuel_type: string;
  brand: string;
  model: string;
  year: number;
  registration_no: string;
}

interface Brand {
  _id: string;
  brand_name: string;
}

const VehicleSelectionPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'VehicleSelection'>>();
  const preSelectedCategory = route.params?.category;
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Add Vehicle State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [newVehicle, setNewVehicle] = useState({
    vehicle_category: '',
    fuel_type: '',
    brand: '',
    model: '',
    year: '',
    registration_no: '',
  });
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetchUserVehicles();
      // res is { success: true, data: [...] } due to api.ts interceptor
      setVehicles(res.data || []);
    } catch (err) {
      console.error(err);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async (cat: string, fuel: string) => {
    try {
      setLoadingBrands(true);
      setBrands([]);
      console.log(`[BRAND-FETCH] Category: ${cat}, Fuel: ${fuel}`);
      
      const res = await fetchBrands(cat, fuel);
      
      // The backend returns { success: true, data: [...] }
      // api.ts interceptor returns response.data
      // So res is { success: true, data: [...] }
      if (res && res.data && Array.isArray(res.data)) {
        setBrands(res.data);
      } else {
        console.warn('[BRAND-FETCH] No data array in response:', res);
        setBrands([]);
      }
    } catch (err: any) {
      console.error('[BRAND-FETCH] Error:', err);
      Alert.alert('Load Error', `Failed to fetch brands: ${err.message || err}`);
      setBrands([]);
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleAddVehicle = async () => {
    try {
      if (!newVehicle.brand || !newVehicle.model || !newVehicle.registration_no || !newVehicle.year) {
         Alert.alert('Error', 'Please fill all details including brand');
         return;
      }
      setLoading(true);
      await addVehicle({
        ...newVehicle,
        year: parseInt(newVehicle.year),
      });
      setShowAddModal(false);
      resetAddForm();
      loadVehicles();
    } catch (err: any) {
      Alert.alert('Add Error', err.toString());
    } finally {
      setLoading(false);
    }
  };

  const resetAddForm = () => {
    setAddStep(1);
    setNewVehicle({
      vehicle_category: '',
      fuel_type: '',
      brand: '',
      model: '',
      year: '',
      registration_no: '',
    });
    setBrands([]);
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity
      style={[
        styles.vehicleCard,
        selectedVehicle?._id === item._id && styles.selectedCard
      ]}
      onPress={() => setSelectedVehicle(item)}
    >
      <View style={styles.vehicleIconContainer}>
        <EVCar width={40} height={40} />
      </View>
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleName}>{item.brand} {item.model}</Text>
        <Text style={styles.vehicleDetails}>
           {item.vehicle_category?.replace('_', '-').toUpperCase()} • {item.fuel_type?.toUpperCase()} • {item.registration_no}
        </Text>
      </View>
      <View style={[styles.radio, selectedVehicle?._id === item._id && styles.radioActive]}>
        {selectedVehicle?._id === item._id && <View style={styles.radioInner} />}
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
        <Text style={styles.headerTitle}>Select Vehicle</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.subTitle}>Select your vehicle for booking</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
        ) : vehicles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No vehicles added.</Text>
            <TouchableOpacity style={styles.addInitialButton} onPress={() => setShowAddModal(true)}>
               <Text style={styles.addInitialText}>Add a Vehicle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={vehicles}
            keyExtractor={(item) => item._id}
            renderItem={renderVehicleItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity 
          style={[styles.nextButton, !selectedVehicle && styles.disabledButton]}
          onPress={() => selectedVehicle && navigation.navigate('ServiceSelection', { 
             vehicleId: selectedVehicle._id,
             category: preSelectedCategory || selectedVehicle.vehicle_category,
             fuel: selectedVehicle.fuel_type
          })}
          disabled={!selectedVehicle}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Add Vehicle Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                 <Text style={styles.modalTitle}>New Vehicle</Text>
                 <TouchableOpacity onPress={() => setShowAddModal(false)}>
                    <Text style={styles.closeText}>✕</Text>
                 </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                 {addStep === 1 && (
                    <View>
                       <Text style={styles.stepLabel}>Vehicle Category</Text>
                       {['2_wheeler', '4_wheeler', 'heavy'].map(cat => (
                          <TouchableOpacity 
                             key={cat}
                             style={[styles.optionItem, newVehicle.vehicle_category === cat && styles.selectedOption]}
                             onPress={() => {
                                setNewVehicle({...newVehicle, vehicle_category: cat});
                                setAddStep(2);
                             }}
                          >
                             <Text style={styles.optionText}>{cat.replace('_', ' ').toUpperCase()}</Text>
                          </TouchableOpacity>
                       ))}
                    </View>
                 )}

                 {addStep === 2 && (
                    <View>
                       <Text style={styles.stepLabel}>Fuel Type</Text>
                       {['electric', 'petrol', 'diesel', 'cng', 'hybrid'].map(fuel => (
                          <TouchableOpacity 
                             key={fuel}
                             style={[styles.optionItem, newVehicle.fuel_type === fuel && styles.selectedOption]}
                             onPress={() => {
                                const selectedCat = newVehicle.vehicle_category;
                                setNewVehicle(prev => ({...prev, fuel_type: fuel}));
                                setAddStep(3);
                                loadBrands(selectedCat, fuel);
                             }}
                          >
                             <Text style={styles.optionText}>{fuel.toUpperCase()}</Text>
                          </TouchableOpacity>
                       ))}
                       <TouchableOpacity onPress={() => setAddStep(1)}><Text style={styles.backLink}>← Back</Text></TouchableOpacity>
                    </View>
                 )}

                 {addStep === 3 && (
                    <View>
                       <Text style={styles.stepLabel}>Choose Brand</Text>
                       {loadingBrands ? (
                         <View style={styles.loadingWrapper}>
                           <ActivityIndicator color={COLORS.primary} size="large" />
                           <Text style={styles.loadingText}>Fetching available brands...</Text>
                         </View>
                       ) : brands.length === 0 ? (
                         <View style={styles.emptyBrands}>
                           <Text style={styles.noBrandsText}>No brands found for this search.</Text>
                           <TouchableOpacity onPress={() => setAddStep(2)}>
                             <Text style={styles.backLink}>← Try another fuel</Text>
                           </TouchableOpacity>
                         </View>
                       ) : (
                          brands.map(b => (
                             <TouchableOpacity 
                                key={b._id}
                                style={[styles.optionItem, newVehicle.brand === b.brand_name && styles.selectedOption]}
                                onPress={() => {
                                   setNewVehicle({...newVehicle, brand: b.brand_name});
                                   setAddStep(4);
                                }}
                             >
                                <Text style={styles.optionText}>{b.brand_name}</Text>
                             </TouchableOpacity>
                          ))
                       )}
                       {brands.length > 0 && <TouchableOpacity onPress={() => setAddStep(2)}><Text style={styles.backLink}>← Back</Text></TouchableOpacity>}
                    </View>
                 )}

                 {addStep === 4 && (
                    <View>
                       <Text style={styles.stepLabel}>Details for {newVehicle.brand}</Text>
                       <TextInput 
                          style={styles.input} 
                          placeholder="Model (e.g. Model X, Activa)"
                          value={newVehicle.model}
                          onChangeText={v => setNewVehicle({...newVehicle, model: v})}
                          placeholderTextColor={COLORS.grey}
                       />
                       <TextInput 
                          style={styles.input} 
                          placeholder="Reg. Number (e.g. KA01AB1234)"
                          value={newVehicle.registration_no}
                          onChangeText={v => setNewVehicle({...newVehicle, registration_no: v})}
                          autoCapitalize="characters"
                          placeholderTextColor={COLORS.grey}
                       />
                       <TextInput 
                          style={styles.input} 
                          placeholder="Year (e.g. 2023)"
                          keyboardType="numeric"
                          value={newVehicle.year}
                          onChangeText={v => setNewVehicle({...newVehicle, year: v})}
                          placeholderTextColor={COLORS.grey}
                       />
                       
                       <TouchableOpacity style={styles.submitButton} onPress={handleAddVehicle}>
                          <Text style={styles.submitButtonText}>Complete Setup</Text>
                       </TouchableOpacity>
                       <TouchableOpacity onPress={() => setAddStep(3)}><Text style={styles.backLink}>← Back</Text></TouchableOpacity>
                    </View>
                 )}
              </ScrollView>
           </View>
        </View>
      </Modal>
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
  addButton: {
    padding: 8,
    backgroundColor: COLORS.lightGrey,
    borderRadius: 8,
  },
  addButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subTitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  vehicleCard: {
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
  vehicleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 15,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  vehicleDetails: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.grey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
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
    marginBottom: 20,
  },
  addInitialButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  addInitialText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeText: {
    fontSize: 24,
    color: COLORS.grey,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: 15,
  },
  optionItem: {
    padding: 18,
    borderRadius: 12,
    backgroundColor: COLORS.lightGrey,
    marginBottom: 10,
  },
  selectedOption: {
    backgroundColor: COLORS.primary + '20',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  backLink: {
    color: COLORS.primary,
    marginTop: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingWrapper: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.grey,
    fontSize: 14,
  },
  emptyBrands: {
    padding: 30,
    alignItems: 'center',
  },
  noBrandsText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.lightGrey,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    color: COLORS.text,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default VehicleSelectionPage;
