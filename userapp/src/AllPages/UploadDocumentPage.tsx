import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import UploadPrinter from '../assets/uploadprinter.svg';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type UploadRouteProp = RouteProp<RootStackParamList, 'UploadDocument'>;

const PAPER_TYPES = [
  { label: 'A3 Sheet' },
  { label: 'A4 Sheet' },
  { label: 'A5 Sheet' },
  { label: 'A2 Sheet' }
];

const UploadDocumentPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<UploadRouteProp>();
  const [quantity, setQuantity] = useState<number>(5);
  const [paperType, setPaperType] = useState<string>('A4 Sheet');
  const [printSide, setPrintSide] = useState<string>('Single side print');
  const [showFinalModal, setShowFinalModal] = useState<boolean>(false);

  // Check for return parameter to show popup
  useEffect(() => {
    if (route.params?.showFinalPopup) {
      setShowFinalModal(true);
      // Clear params to avoid showing again on focus
      navigation.setParams({ showFinalPopup: undefined });
    }
  }, [route.params?.showFinalPopup, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Top Banner */}
      <View style={styles.banner}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        
        {/* Floating Paper Emojis - Mocked with text */}
        <Text style={[styles.floatingEmoji, { top: 40, left: 20, transform: [{ rotate: '-20deg' }] }]}>📄</Text>
        <Text style={[styles.floatingEmoji, { top: 120, left: 40, transform: [{ rotate: '15deg' }] }]}>📄</Text>
        <Text style={[styles.floatingEmoji, { bottom: 30, right: 50, transform: [{ rotate: '-10deg' }] }]}>📄</Text>
        <Text style={[styles.floatingEmoji, { top: 60, right: 30, transform: [{ rotate: '25deg' }] }]}>📄</Text>
        
        <View style={styles.svgContainer}>
          <UploadPrinter width={380} height={350} />
        </View>
      </View>

      {/* Main Form */}
      <View style={styles.formCard}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Heading */}
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Please upload</Text>
            <TouchableOpacity>
              <Text style={styles.addText}>+ADD</Text>
            </TouchableOpacity>
          </View>

          {/* Upload Box */}
          <TouchableOpacity style={styles.uploadBox}>
            <Text style={styles.uploadPlaceholder}>Upload Document</Text>
            <Text style={styles.cameraIcon}>📷</Text>
          </TouchableOpacity>

          {/* Select Type */}
          <Text style={styles.subHeading}>Select type</Text>
          <View style={styles.paperGrid}>
            {PAPER_TYPES.map((type) => (
              <TouchableOpacity 
                key={type.label}
                onPress={() => setPaperType(type.label)}
                style={styles.paperItem}
              >
                <View style={[
                  styles.paperIconContainer,
                  paperType === type.label && styles.paperIconActive
                ]}>
                  <Text style={styles.paperIcon}>🖨️</Text>
                  {paperType === type.label && (
                    <View style={styles.checkBadge}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.paperLabel}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Page Options */}
          <Text style={styles.subHeading}>Page</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              onPress={() => setPrintSide('Single side print')}
              style={[
                styles.optionButton,
                printSide === 'Single side print' && styles.optionButtonActive
              ]}
            >
              <Text style={[
                styles.optionText,
                printSide === 'Single side print' && styles.optionTextActive
              ]}>Single side print</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setPrintSide('Double side print')}
              style={[
                styles.optionButton,
                printSide === 'Double side print' && styles.optionButtonActive
              ]}
            >
              <Text style={[
                styles.optionText,
                printSide === 'Double side print' && styles.optionTextActive
              ]}>Double side print</Text>
            </TouchableOpacity>
          </View>

          {/* Quantity */}
          <View style={styles.rowBetween}>
            <Text style={[styles.subHeading, { color: '#1B5E3B', marginBottom: 0 }]}>Quantity</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity 
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={styles.quantityBtn}
              >
                <Text style={styles.quantityIcon}>➖</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity 
                onPress={() => setQuantity(quantity + 1)}
                style={styles.quantityBtn}
              >
                <Text style={styles.quantityIcon}>➕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Next Button */}
        <TouchableOpacity 
          onPress={() => {
            navigation.navigate('SelectPage');
          }}
          style={styles.nextButton}
        >
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Final Popup Modal */}
      <Modal
        visible={showFinalModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFinalModal(false)}
      >
        <View style={styles.finalModalOverlay}>
          <View style={styles.finalModalContent}>
            <Text style={styles.finalModalEmoji}>📄✅</Text>
            <Text style={styles.finalModalTitle}>Document Confirmed</Text>
            <Text style={styles.finalModalText}>Your printing details have been saved successfully.</Text>
            <TouchableOpacity 
              style={styles.finalModalButton}
              onPress={() => {
                setShowFinalModal(false);
                navigation.navigate('Address');
              }}
            >
              <Text style={styles.finalModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  banner: {
    height: 450,
    backgroundColor: '#1B5E3B',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backIcon: {
    fontSize: 28,
    color: '#fff',
  },
  floatingEmoji: {
    position: 'absolute',
    fontSize: 24,
    opacity: 0.6,
  },
  svgContainer: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: -24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    marginBottom: 24,
  },
  uploadPlaceholder: {
    color: '#888',
    fontSize: 15,
  },
  cameraIcon: {
    fontSize: 18,
  },
  subHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1B5E3B',
    marginBottom: 12,
  },
  paperGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  paperItem: {
    alignItems: 'center',
    width: '22%',
  },
  paperIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paperIconActive: {
    borderColor: '#1B5E3B',
  },
  paperIcon: {
    fontSize: 28,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#F5A623',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  checkText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  paperLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  optionButtonActive: {
    backgroundColor: '#1B5E3B',
    borderColor: '#1B5E3B',
  },
  optionText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  optionTextActive: {
    color: '#fff',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityBtn: {
    padding: 4,
  },
  quantityIcon: {
    fontSize: 22,
    color: '#1B5E3B',
  },
  quantityText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  nextButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 18,
    borderRadius: 40,
    alignItems: 'center',
    marginTop: 'auto',
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  finalModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  finalModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: Dimensions.get('window').width * 0.8,
    padding: 30,
    alignItems: 'center',
    elevation: 5,
  },
  finalModalEmoji: {
    fontSize: 50,
    marginBottom: 20,
  },
  finalModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  finalModalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  finalModalButton: {
    backgroundColor: '#1B5E3B',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  finalModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UploadDocumentPage;

