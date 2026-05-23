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
  Image,
} from 'react-native';
import { COLORS, SHADOWS, SIZES } from '../constants/theme';
import { fetchVendorDashboard, fetchOrderStatistics, fetchProfile, fetchNotifications } from '../services/api';
import { useVendorNav } from './VendorSidebarNavigator';
import { getImageUrl } from '../constants/config';

const { width } = Dimensions.get('window');

const VendorDashboard = () => {
  const { toggleDrawer, setActiveTab, unreadCount } = useVendorNav();
  const [stats, setStats] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('Year');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentDate.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Generate years from 2018 to current
  const years = Array.from(
    { length: new Date().getFullYear() - 2018 + 1 },
    (_, i) => 2018 + i
  ).reverse();

  useEffect(() => {
    loadAllData();
  }, [selectedYear, period]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [dashRes, statsRes, profileRes, notifRes]: any = await Promise.all([
        fetchVendorDashboard(),
        fetchOrderStatistics(selectedYear, period),
        fetchProfile(),
        fetchNotifications()
      ]);

      if (dashRes.success) {
        setDashboardData(dashRes.dashboard);
        console.log('[DEBUG] Full Dashboard Object:', JSON.stringify(dashRes.dashboard, null, 2));
      }
      if (statsRes.success) {
        setStats(statsRes.statistics);
        console.log(`[DEBUG] Stats for ${period}:`, statsRes.statistics);
      }
      if (profileRes.success) {
        setUser(profileRes.user);
      }
      if (notifRes.success) {
        setNotifications(notifRes.data || []);
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
    const totalRevenue = data.reduce((sum, val) => sum + (val || 0), 0);

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

                // Trend Line Calculation
                const nextVal = data[i + 1];
                const hasNext = nextVal !== undefined;
                const nextHeight = hasNext ? (nextVal / maxRevenue) * chartHeight : 0;
                const barWidth = (width - 100) / 12;

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
            <Text style={styles.legendText}>Target</Text>
          </View>
        </View>

        <View style={styles.chartFooter}>
          <Text style={styles.footerAmountLabel}>Sales Revenue amount : </Text>
          <Text style={styles.footerAmountValue}>₹ {totalRevenue.toLocaleString()}</Text>
        </View>
      </View>
    );
  };

  const ServiceCard = ({ title, count, icon }: any) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceIconContainer}>
        <Text style={styles.serviceEmoji}>{icon || '🛠️'}</Text>
      </View>
      <Text style={styles.serviceTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.serviceCount}>{count} orders</Text>
    </View>
  );

  const RecentOrderCard = ({ order }: { order: any }) => {
    const userImg = order.user?.profileImage || order.userDetails?.profileImage;
    const services = order.serviceNames || [];
    const serviceText = services.length > 0 ? services.join(', ') : 'General Service';

    return (
      <View style={styles.recentOrderCard}>
        <View style={styles.orderLeft}>
          {userImg ? (
            <Image source={{ uri: getImageUrl(userImg) }} style={styles.orderUserImg} />
          ) : (
            <View style={styles.orderUserPlaceholder}>
              <Text style={styles.orderUserInitial}>
                {(order.user?.name || order.userDetails?.name || 'C').charAt(0)}
              </Text>
            </View>
          )}
          <View style={styles.orderMid}>
            <Text style={styles.orderUserName} numberOfLines={1}>
              {order.user?.name || order.userDetails?.name || 'Customer'}
            </Text>
            <Text style={styles.orderServices} numberOfLines={1}>
              {serviceText}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => setActiveTab('Orders')}
        >
          <Text style={styles.viewBtnText}>View</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !dashboardData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={'#1B4D6B'} />
      </View>
    );
  }

  const overview = dashboardData?.overview || {};
  const popularServices = dashboardData?.popularServices || [];
  const recentOrders = dashboardData?.recentOrders || [];

  const getServiceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('brake')) return '⚙️';
    if (n.includes('engine')) return '🔌';
    if (n.includes('wheel')) return '🔘';
    if (n.includes('battery')) return '🔋';
    if (n.includes('ac') || n.includes('air')) return '❄️';
    if (n.includes('oil')) return '🛢️';
    if (n.includes('wash')) return '🧽';
    return '🛠️';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => setActiveTab('Profile')}
          >
            {user?.profileImage ? (
              <Image
                source={{ uri: getImageUrl(user.profileImage) }}
                style={styles.headerAvatar}
              />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={styles.avatarInitial}>{user?.name?.charAt(0) || 'V'}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <View style={styles.greetingRow}>
              <Text style={styles.greetingText}>{getGreeting()}, </Text>
              <Text style={styles.userNameText}>{user?.name || 'Vendor'}</Text>
            </View>
            <Text style={styles.dateDayText}>
              {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}, {currentDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setActiveTab('Notifications')}
            style={styles.notifBtn}
          >
            <Text style={styles.notifIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={styles.datePicker}
            onPress={() => period === 'Year' && setShowYearPicker(true)}
          >
            <Text style={styles.dateText}>
              {period === 'Year' ? selectedYear : currentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </Text>
            {period === 'Year' && <Text style={styles.downArrow}> ▼</Text>}
          </TouchableOpacity>

          <View style={styles.tabBar}>
            {['Today', 'Week', 'Month', 'Year'].map((p) => (
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
            title="Total Booking service"
            value={stats?.totalOrders}
            percentage="+5%"
            icon="📋"
            color="#2F80ED"
            bgColor="#E9F2FF"
          />
          <StatCard
            title="Total Services"
            value={stats?.completedOrders}
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


        <View style={styles.recentSection}>
          <View style={styles.recentHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => setActiveTab('Orders')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {(() => {
            // Get today's date in YYYY-MM-DD format (Local time)
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;

            const todayBookings = recentOrders.filter((o: any) => o.bookingDate === todayStr);

            const displayOrders = todayBookings.length > 0
              ? todayBookings.slice(0, 3)
              : recentOrders.slice(0, 3);

            if (displayOrders.length > 0) {
              return displayOrders.map((order: any) => (
                <RecentOrderCard key={order._id} order={order} />
              ));
            }

            return (
              <Text style={styles.emptyText}>No bookings found for today.</Text>
            );
          })()}
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
    paddingHorizontal: 20,
    paddingTop: 50,
    backgroundColor: '#F8F9FB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBtn: {
    padding: 10,
    position: 'relative',
    backgroundColor: '#FFF',
    borderRadius: 25,
    ...SHADOWS.light,
  },
  notifIcon: {
    fontSize: 20,
  },
  notifBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#EB5757',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  notifBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
  headerTextContainer: {
    marginLeft: 15,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  greetingText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  dateDayText: {
    fontSize: 12,
    color: '#1B4D6B',
    fontWeight: '600',
  },
  headerBtn: { padding: 8 },
  menuIcon: { fontSize: 22, color: '#000' },
  headerAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  headerAvatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#1B4D6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
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
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(235, 87, 87, 0.3)',
    borderRadius: 1,
    transform: [{ rotate: '-10deg' }],
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
  serviceCount: { fontSize: 9, color: '#999', marginTop: 2 },
  recentSection: { paddingHorizontal: 20, marginTop: 20, paddingBottom: 30 },
  recentOrderCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.light,
  },
  orderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderUserImg: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
  },
  orderUserPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderUserInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B4D6B',
  },
  orderMid: {
    flex: 1,
  },
  orderUserName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  orderServices: {
    fontSize: 12,
    color: '#666',
  },
  viewBtn: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  viewBtnText: {
    fontSize: 12,
    color: '#1B4D6B',
    fontWeight: '700',
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    fontSize: 14,
    color: '#1B4D6B',
    fontWeight: '600',
  },
  quickActions: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  actionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: '#E9F2FF',
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#E9F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B4D6B',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 20,
    color: '#1B4D6B',
    fontWeight: 'bold',
  },
  recentOrderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  customerName: { fontSize: 14, fontWeight: '700', color: '#000' },
  orderAmount: { fontSize: 14, fontWeight: '800', color: '#1B4D6B' },
  vehicleInfo: { fontSize: 12, color: '#666', marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  orderTime: { fontSize: 11, color: '#999', flex: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusName: { fontSize: 11, fontWeight: '600', color: '#333', textTransform: 'capitalize' },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', width: '100%', marginVertical: 20 },

  // Modal & Picker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    maxHeight: '50%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 20, textAlign: 'center' },
  yearItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE', alignItems: 'center' },
  yearItemText: { fontSize: 18, color: '#666' },
  activeYearText: { color: '#1B4D6B', fontWeight: 'bold' },
  closeBtn: { marginTop: 20, padding: 15, backgroundColor: '#1B4D6B', borderRadius: 15, alignItems: 'center' },
  closeBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default VendorDashboard;
