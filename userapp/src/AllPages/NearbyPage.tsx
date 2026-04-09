import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NearbyPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedShop, setSelectedShop] = React.useState<string>('KC xerox Shop');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Shops</Text>
      </View>

      {/* Map Area Placeholder */}
      <View style={styles.mapArea}>
        {/* User Location Pulse */}
        <View style={styles.userPulseOuter}>
          <View style={styles.userPulseInner} />
        </View>

        {/* Shop Markers */}
        <View style={[styles.marker, { top: 40, left: 60 }]}>
          <Text style={styles.markerEmoji}>🏪</Text>
        </View>
        <View style={[styles.marker, { top: 120, right: 40 }]}>
          <Text style={styles.markerEmoji}>🏪</Text>
        </View>
        <View style={[styles.marker, { bottom: 60, left: 100 }]}>
          <Text style={styles.markerEmoji}>🏪</Text>
        </View>
        <View style={[styles.marker, { top: 180, right: 110 }]}>
          <Text style={styles.markerEmoji}>🏪</Text>
        </View>
      </View>

      {/* Content Card */}
      <View style={styles.contentCard}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Addresses */}
          <View style={styles.addressList}>
            <AddressRow icon="📍" title="88 Zurab Gorgiladze St" subtitle="Georgia, Batumi" />
            <AddressRow icon="📍" title="5 Noe Zhordania St" subtitle="Georgia, Batumi" />
          </View>

          {/* Featured Shop */}
          <TouchableOpacity
            onPress={() => setSelectedShop('KC xerox Shop')}
            style={[
              styles.shopCard,
              selectedShop === 'KC xerox Shop' && styles.shopCardActive
            ]}
          >
            <View style={styles.shopInfo}>
              <View style={styles.shopAvatar}>
                <Text style={styles.avatarText}>K</Text>
              </View>
              <Text style={styles.shopName}>KC xerox Shop</Text>
            </View>
            <View style={styles.shopActions}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#1B5E3B' }]}>
                <Text style={styles.actionIcon}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F5A623' }]}>
                <Text style={styles.actionIcon}>💬</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Action Button */}
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('UploadDocument');
          }}
          style={styles.nextButton}
        >
          <Text style={styles.nextButtonText}>Upload Documents</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const AddressRow = ({ icon, title, subtitle }: { icon: string, title: string, subtitle: string }) => (
  <View style={styles.addressRow}>
    <Text style={styles.addressIcon}>{icon}</Text>
    <View>
      <Text style={styles.addressTitle}>{title}</Text>
      <Text style={styles.addressSubtitle}>{subtitle}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 15,
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  mapArea: {
    height: 300,
    backgroundColor: '#e0e0e0',
    position: 'relative',
    overflow: 'hidden',
  },
  userPulseOuter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 140,
    height: 140,
    backgroundColor: 'rgba(33,150,243,0.15)',
    borderColor: '#2196F3',
    borderWidth: 2,
    borderRadius: 70,
    marginLeft: -70,
    marginTop: -70,
  },
  userPulseInner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    backgroundColor: '#2196F3',
    borderRadius: 10,
    marginLeft: -10,
    marginTop: -10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  marker: {
    position: 'absolute',
    backgroundColor: '#1B5E3B',
    padding: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerEmoji: {
    fontSize: 16,
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  addressList: {
    marginBottom: 24,
  },
  addressRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  addressIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  addressSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 20,
  },
  shopCardActive: {
    borderColor: '#1B5E3B',
    backgroundColor: '#F9FFF9',
    borderWidth: 2,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  shopName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  shopActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionIcon: {
    fontSize: 16,
    color: '#fff',
  },
  nextButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 18,
    borderRadius: 40,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NearbyPage;
