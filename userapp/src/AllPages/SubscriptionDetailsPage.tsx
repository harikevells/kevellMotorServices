import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { fetchMySubscriptions } from '../services/api';
import Icon from 'react-native-vector-icons/Feather';

const SubscriptionDetailsPage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [viewMode, setViewMode] = useState<'plan' | 'history'>('plan');
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [historySubs, setHistorySubs] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await fetchMySubscriptions();
      if (res.success) {
        setActiveSub(res.active);
        setHistorySubs(res.history || []);
      }
    } catch (e) {
      console.warn('Failed to load subscriptions', e);
    } finally {
      setLoading(false);
    }
  };

  const renderActivePlan = () => {
    if (!activeSub) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You don't have an active subscription.</Text>
          <TouchableOpacity style={styles.subscribeBtn} onPress={() => navigation.navigate('Home' as any)}>
            <Text style={styles.subscribeBtnText}>View Plans</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const plan = activeSub.plan || {};
    const expiryDate = new Date(activeSub.expiryDate);
    const today = new Date();
    const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    return (
      <View style={styles.activeCard}>
        <View style={styles.activeHeader}>
          <Text style={styles.activeTitle}>{plan.name || 'Subscription'}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>ACTIVE</Text>
          </View>
        </View>
        <Text style={styles.activePrice}>₹{plan.price || 0} <Text style={styles.billingCycle}>/ {plan.billingCycle || 'month'}</Text></Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.benefitsTitle}>Your Benefits</Text>
        {(plan.features || ['10% Off on Spare Parts', '10% Off on Services']).map((feature: string, idx: number) => (
          <View key={idx} style={styles.benefitRow}>
            <Text style={styles.checkIcon}>✓</Text>
            <Text style={styles.benefitText}>{feature}</Text>
          </View>
        ))}

        <View style={styles.expiryBox}>
          <Text style={styles.expiryLabel}>Expires in {daysLeft} days</Text>
          <Text style={styles.expiryDate}>{expiryDate.toLocaleDateString()}</Text>
        </View>
      </View>
    );
  };

  const renderHistory = () => {
    if (historySubs.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No subscription history found.</Text>
        </View>
      );
    }

    return (
      <View style={styles.historyContainer}>
        {historySubs.map((sub, idx) => {
          const plan = sub.plan || {};
          const isExpired = sub.status === 'expired' || new Date(sub.expiryDate) < new Date();
          return (
            <View key={idx} style={styles.historyCard}>
              <View style={styles.historyHeaderRow}>
                <Text style={styles.historyPlanName}>{plan.name || 'Plan'}</Text>
                <Text style={[styles.historyStatus, isExpired ? styles.statusExpired : styles.statusActive]}>
                  {isExpired ? 'EXPIRED' : sub.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.historyPrice}>₹{plan.price || 0}</Text>
              <Text style={styles.historyDates}>
                Purchased: {new Date(sub.purchaseDate).toLocaleDateString()}
              </Text>
              <Text style={styles.historyDates}>
                Expires: {new Date(sub.expiryDate).toLocaleDateString()}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Subscriptions</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleBtn, viewMode === 'plan' && styles.toggleBtnActive]}
          onPress={() => setViewMode('plan')}
        >
          <Text style={[styles.toggleBtnText, viewMode === 'plan' && styles.toggleBtnTextActive]}>Active Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleBtn, viewMode === 'history' && styles.toggleBtnActive]}
          onPress={() => setViewMode('history')}
        >
          <Text style={[styles.toggleBtnText, viewMode === 'history' && styles.toggleBtnTextActive]}>Paid Plan List</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#F5A623" style={{ marginTop: 50 }} />
        ) : (
          viewMode === 'plan' ? renderActivePlan() : renderHistory()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    ...SHADOWS.light,
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#E9ECEF',
    borderRadius: 30,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 26,
  },
  toggleBtnActive: {
    backgroundColor: '#F5A623',
    ...SHADOWS.medium,
  },
  toggleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6C757D',
  },
  toggleBtnTextActive: {
    color: '#FFF',
  },
  scrollContent: {
    padding: 20,
  },
  activeCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 25,
    ...SHADOWS.medium,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusBadge: {
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#28a745',
  },
  statusText: {
    color: '#28a745',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activePrice: {
    fontSize: 36,
    fontWeight: '900',
    color: '#F5A623',
    marginTop: 10,
  },
  billingCycle: {
    fontSize: 16,
    color: '#AAA',
    fontWeight: 'normal',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 20,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkIcon: {
    color: '#F5A623',
    fontSize: 16,
    marginRight: 10,
    fontWeight: 'bold',
  },
  benefitText: {
    color: '#DDD',
    fontSize: 15,
  },
  expiryBox: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryLabel: {
    color: '#AAA',
    fontSize: 14,
  },
  expiryDate: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  subscribeBtn: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  subscribeBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  historyContainer: {
    gap: 15,
  },
  historyCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    ...SHADOWS.light,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyPlanName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  historyStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    color: '#28a745',
  },
  statusExpired: {
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    color: '#dc3545',
  },
  historyPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F5A623',
    marginBottom: 10,
  },
  historyDates: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  }
});

export default SubscriptionDetailsPage;
