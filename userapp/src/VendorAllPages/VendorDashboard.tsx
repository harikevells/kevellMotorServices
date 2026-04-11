import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import api from '../services/api';
import { useVendorNav } from './VendorSidebarNavigator';

const { width } = Dimensions.get('window');

const VendorDashboard = () => {
  const { toggleDrawer } = useVendorNav();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('Today');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Generate years from 2018 to current
  const years = Array.from(
    { length: new Date().getFullYear() - 2018 + 1 },
    (_, i) => 2018 + i
  ).reverse();

  useEffect(() => {
    fetchDashboard();
  }, [selectedYear]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      // Pass the selected year to the statistics API
      const res: any = await api.get(`/vendor/orders/statistics?year=${selectedYear}`);
      if (res.success) {
        setStats(res.statistics);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, percentage, icon, color, bgColor }: any) => (
    <View style={[styles.statCard, { backgroundColor: bgColor }]}>
      <View style={styles.statCardHeader}>
        <View style={[styles.statIconContainer, { backgroundColor: color }]}>
          <Text style={styles.statEmoji}>{icon}</Text>
        </View>
        <Text style={[styles.percentageText, { color }]}>{percentage}</Text>
      </View>
      <View style={styles.statCardBody}>
        <Text style={styles.statValue}>{value || 0}</Text>
        <Text style={styles.statLabel}>{title}</Text>
      </View>
    </View>
  );

  const RevenueChart = ({ data }: { data: number[] }) => {
    // Exact month names as requested
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const maxRevenue = Math.max(...data, 1000);
    const chartHeight = 180;

    // Fixed Target line calculation (mockup trend matching image)
    const targets = months.map((_, i) => (maxRevenue * 0.3) + (i * (maxRevenue * 0.05)));
    const totalRevenue = data.reduce((sum, val) => sum + val, 0);

    return (
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>SALES REVENUE VS, TARGET I YTD</Text>
          </View>
          <TouchableOpacity
            style={styles.yearDropdown}
            onPress={() => setShowYearPicker(true)}
          >
            <Text style={styles.chartYear}>Year: {selectedYear}</Text>
            <Text style={styles.downArrowSmall}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chartBody}>
          <View style={styles.yAxis}>
            {[1, 0.75, 0.5, 0.25, 0].map((step) => (
              <Text key={step} style={styles.yLabel}>
                ₹{(maxRevenue * step / 1000).toFixed(0)}K
              </Text>
            ))}
          </View>

          <View style={styles.chartArea}>
            {[0, 25, 50, 75, 100].map(h => (
              <View key={h} style={[styles.gridLine, { bottom: `${h}%` }]} />
            ))}

            <View style={styles.barsRow}>
              {data.map((val, i) => {
                const barHeight = (val / maxRevenue) * chartHeight;
                const targetHeight = (targets[i] / maxRevenue) * chartHeight;

                return (
                  <View key={i} style={styles.barGroup}>
                    <View style={[styles.bar, { height: Math.max(barHeight, 5) }]} />
                    <View style={[styles.linePin, { bottom: targetHeight }]} />
                    <Text style={styles.xLabel}>{months[i]}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.targetLineOverlay} />
          </View>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#1B4D6B' }]} />
            <Text style={styles.legendText}>Sales Revenue</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: '#EB5757' }]} />
            <Text style={styles.legendText}>Sales Target</Text>
          </View>
        </View>

        <View style={styles.chartFooter}>
          <Text style={styles.footerAmountLabel}>Sales Revenue amount : </Text>
          <Text style={styles.footerAmountValue}>₹ {totalRevenue.toLocaleString()}</Text>
        </View>
      </View>
    );
  };

  const ServiceCard = ({ title, icon }: any) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceIconContainer}>
        <Text style={styles.serviceEmoji}>{icon}</Text>
      </View>
      <Text style={styles.serviceTitle}>{title}</Text>
    </View>
  );

  if (loading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={'#1B4D6B'} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.headerBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Siva bike shop</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.datePicker}>
            <Text style={styles.dateText}>Wed, 9 Nov</Text>
            <Text style={styles.downArrow}>▼</Text>
          </TouchableOpacity>

          <View style={styles.tabBar}>
            {['Today', 'Week', 'Month'].map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                style={[styles.tab, period === p && styles.activeTab]}
              >
                <Text style={[styles.tabText, period === p && styles.activeTabText]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.statGrid}>
          <StatCard
            title="Total Delivery Boy"
            value={stats?.totalDeliveryBoys}
            percentage="+5%"
            icon="👥"
            color="#2F80ED"
            bgColor="#E9F2FF"
          />
          <StatCard
            title="Total Services"
            value={stats?.totalOrders}
            percentage="+12%"
            icon="📊"
            color="#9B51E0"
            bgColor="#F2E9FB"
          />
          <StatCard
            title="Pending Services"
            value={stats?.pendingOrders}
            percentage="-3.56%"
            icon="⏳"
            color="#1B4D6B"
            bgColor="#E9F2FF"
          />
          <StatCard
            title="Cancel Services"
            value={stats?.cancelledOrders}
            percentage="-6%"
            icon="❌"
            color="#EB5757"
            bgColor="#FFEDED"
          />
        </View>

        <View style={styles.chartSection}>
          <RevenueChart data={stats?.monthlyRevenue || Array(12).fill(0)} />
        </View>

        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Popular Services</Text>
          <View style={styles.servicesGrid}>
            <ServiceCard title="Check Engine Light" icon="🔌" />
            <ServiceCard title="Brake Pads" icon="⚙️" />
            <ServiceCard title="Wheel Balancing" icon="🔘" />
            <ServiceCard title="Battery Services" icon="🔋" />
            <ServiceCard title="A/C Diagnosis" icon="❄️" />
            <ServiceCard title="Wheel Alignment" icon="🚜" />
            <ServiceCard title="Exhaust" icon="🎺" />
            <ServiceCard title="Transmission" icon="⛓️" />
            <ServiceCard title="Normal Service" icon="🛠️" />
          </View>
        </View>
      </ScrollView>

      {/* Year Picker Modal */}
      <Modal visible={showYearPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Year</Text>
            <FlatList
              data={years}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.yearItem}
                  onPress={() => {
                    setSelectedYear(item);
                    setShowYearPicker(false);
                  }}
                >
                  <Text style={[styles.yearItemText, selectedYear === item && styles.activeYearText]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowYearPicker(false)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50,
    backgroundColor: '#F8F9FB',
  },
  headerBtn: { padding: 8 },
  menuIcon: { fontSize: 22, color: '#000' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  searchIcon: { fontSize: 20, color: '#000' },
  scroll: { paddingVertical: 20 },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  datePicker: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 16, fontWeight: '600', color: '#000', marginRight: 8 },
  downArrow: { fontSize: 10, color: '#000' },
  downArrowSmall: { fontSize: 8, color: '#000', marginLeft: 5 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    padding: 3,
  },
  tab: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#000',
    ...SHADOWS.light,
  },
  tabText: { fontSize: 13, color: '#666', fontWeight: '500' },
  activeTabText: { color: '#FFF' },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  statCard: {
    width: '48%',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    ...SHADOWS.light,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  statIconContainer: {
    padding: 8,
    borderRadius: 10,
  },
  statEmoji: { fontSize: 18 },
  percentageText: { fontSize: 12, fontWeight: 'bold' },
  statCardBody: {},
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#000', marginBottom: 5 },
  statLabel: { fontSize: 12, color: '#000' },

  chartSection: { paddingHorizontal: 20, marginBottom: 30 },
  chartCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    ...SHADOWS.medium,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 10,
  },
  yearDropdown: { flexDirection: 'row', alignItems: 'center', padding: 5 },
  chartTitle: { fontSize: 12, fontWeight: 'bold', color: '#000', letterSpacing: 0.5 },
  chartYear: { fontSize: 12, color: '#000', fontWeight: 'bold' },
  chartBody: {
    flexDirection: 'row',
    height: 220,
    paddingTop: 10,
  },
  yAxis: {
    justifyContent: 'space-between',
    height: 180,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#EEE',
  },
  yLabel: { fontSize: 10, color: '#000', textAlign: 'right' },
  chartArea: {
    flex: 1,
    height: 180,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#EEE',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 180,
  },
  barGroup: {
    alignItems: 'center',
    width: (width - 100) / 12,
  },
  bar: {
    width: 8,
    backgroundColor: '#1B4D6B',
    borderRadius: 4,
  },
  linePin: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EB5757',
    zIndex: 10,
  },
  targetLineOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(235, 87, 87, 0.4)',
    transform: [{ rotate: '-12deg' }],
  },
  xLabel: {
    fontSize: 8,
    color: '#000',
    marginTop: 8,
    position: 'absolute',
    bottom: -25,
    width: 30,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 35,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 15 },
  legendBox: { width: 12, height: 12, marginRight: 8, borderRadius: 2 },
  legendLine: { width: 20, height: 3, marginRight: 8, borderRadius: 1.5 },
  legendText: { fontSize: 11, color: '#000', fontWeight: '500' },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerAmountLabel: { fontSize: 14, color: '#000', fontWeight: '500' },
  footerAmountValue: { fontSize: 14, color: '#000', fontWeight: 'bold' },

  servicesSection: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 15 },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (width - 60) / 3,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
    ...SHADOWS.light,
  },
  serviceIconContainer: {
    marginBottom: 8,
  },
  serviceEmoji: { fontSize: 24 },
  serviceTitle: {
    fontSize: 10,
    color: '#000',
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    maxHeight: '60%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 20, textAlign: 'center' },
  yearItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE', alignItems: 'center' },
  yearItemText: { fontSize: 18, color: '#666' },
  activeYearText: { color: '#1B4D6B', fontWeight: 'bold' },
  closeBtn: { marginTop: 20, padding: 15, backgroundColor: '#000', borderRadius: 15, alignItems: 'center' },
  closeBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default VendorDashboard;
