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
  ImageBackground,
  Linking,
  Alert,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line } from 'react-native-svg';
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

  const RevenueChart = ({ data }: { data: number[] }) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const safeData = Array.isArray(data) && data.length === 12 ? data : Array(12).fill(0);

    // Find a peak for tooltip, or default to 1 (Feb)
    let maxIndex = 1;
    let maxVal = -1;
    safeData.forEach((val, i) => {
      if (val > maxVal) { maxVal = val; maxIndex = i; }
    });
    // Default to index 1 if no data, as in the user's mockup
    const tooltipIndex = maxVal > 0 ? maxIndex : 1;

    const maxRevenue = Math.max(...safeData, 100);

    const pointWidth = 60;
    const chartWidth = Math.max(pointWidth * 12, width - 60);
    const chartHeight = 150;
    const paddingHorizontal = 20;
    const paddingVertical = 20;
    const graphHeight = chartHeight - paddingVertical * 2;

    const points = safeData.map((val, i) => {
      let h = val > 0 ? (val / maxRevenue) * graphHeight : 0;
      // Mock curve if all data is 0 for testing design visually
      if (maxVal === 0) h = Math.abs(Math.sin(i * 0.8)) * 80 + 20;

      return {
        x: paddingHorizontal + i * ((chartWidth - paddingHorizontal * 2) / 11),
        y: paddingVertical + graphHeight - h,
        val: val
      };
    });

    const createPath = (pts: { x: number, y: number }[]) => {
      if (pts.length === 0) return '';
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const midX = (p0.x + p1.x) / 2;
        d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
      }
      return d;
    };

    const pathD = createPath(points);
    const areaD = `${pathD} L ${points[11].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

    return (
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>SALES REVENUE VS. TARGET I YTD</Text>
          <TouchableOpacity style={styles.monthDropdownBtn} onPress={() => setShowYearPicker(true)}>
            <Text style={styles.monthDropdownText}>Year ⌄</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -15 }} contentContainerStyle={{ paddingHorizontal: 15 }}>
          <View style={{ width: chartWidth, height: chartHeight + 40 }}>
            <Svg width={chartWidth} height={chartHeight}>
              <Defs>
                <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#E67E22" stopOpacity="0.8" />
                  <Stop offset="1" stopColor="#E67E22" stopOpacity="0" />
                </LinearGradient>
              </Defs>

              <Path d={areaD} fill="url(#grad)" />
              <Path d={pathD} fill="none" stroke="#E67E22" strokeWidth="2.5" />

              <Line
                x1={points[tooltipIndex].x}
                y1={0}
                x2={points[tooltipIndex].x}
                y2={chartHeight}
                stroke="#555"
                strokeWidth="1"
                strokeDasharray="4 4"
              />

              {points.map((p, i) => (
                <Circle key={i} cx={p.x} cy={p.y} r="5" fill="#E67E22" stroke="#FFF" strokeWidth="2" />
              ))}
            </Svg>

            <View style={[styles.tooltipBoxSvg, {
              left: points[tooltipIndex].x + 8,
              top: points[tooltipIndex].y - 12
            }]}
            >
              <Text style={styles.tooltipTextSvg}>${points[tooltipIndex].val.toLocaleString()}</Text>
            </View>

            <View style={styles.xAxisContainerSvg}>
              <View style={styles.chartXAxisLineSvg} />
              {months.map((m, i) => (
                <View key={i} style={[styles.xAxisTickWrapperSvg, { left: points[i].x - 15 }]}>
                  <View style={styles.xTickSvg} />
                  <Text style={styles.xLabelSvg}>{m}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  const RecentOrderCard = ({ order }: { order: any }) => {
    const userImg = order.user?.profileImage || order.userDetails?.profileImage;
    const email = order.user?.email || order.userDetails?.email || order.email || 'No Email Provided';
    const phone = order.user?.mobile || order.userDetails?.mobile || order.mobile || order.user?.phone || order.userDetails?.phone || order.phone || '';
    const name = order.user?.name || order.userDetails?.name || order.name || 'Customer';
    const d = new Date(order.createdAt || order.bookingDate || new Date());
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' });
    const timeSlot = order.timeSlot || d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const orderStatus = order.status || 'pending';

    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'completed':
        case 'delivered':
          return '#27AE60';
        case 'cancelled':
          return '#E74C3C';
        case 'on_the_way':
        case 'confirmed':
          return '#3498DB';
        default:
          return '#E67E22';
      }
    };

    return (
      <View style={styles.recentOrderCard}>
        <View style={styles.recentOrderTopRow}>
          <Text style={styles.recentOrderDate}>Date & Time</Text>
          <View style={[
            styles.unpaidBadge,
            { backgroundColor: getStatusColor(orderStatus) }
          ]}>
            <Text style={styles.unpaidText}>{orderStatus.replace(/_/g, ' ').toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.recentOrderTimeRow}>
          <Text style={styles.recentOrderTimeVal}>{dateStr}</Text>
          <Text style={styles.recentOrderTimeValRight}>{timeSlot}</Text>
        </View>

        <View style={styles.orderBottomRow}>
          {userImg ? (
            <Image source={{ uri: getImageUrl(userImg) }} style={styles.orderUserImg} />
          ) : (
            <View style={styles.orderUserPlaceholder}>
              <Text style={styles.orderUserInitial}>
                {name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.orderMid}>
            <Text style={styles.orderUserName} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.orderEmail} numberOfLines={1}>
              #{order.bookingRef || order._id.slice(-6).toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.phoneBtn}
            onPress={() => {
              if (phone) {
                Linking.openURL(`tel:${phone}`);
              } else {
                Alert.alert('Phone not available', 'The customer phone number is missing.');
              }
            }}
          >
            <Text style={styles.phoneIcon}>📞</Text>
          </TouchableOpacity>
        </View>
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
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => setActiveTab('Profile')}>
              {user?.profileImage ? (
                <Image source={{ uri: getImageUrl(user.profileImage) }} style={styles.headerAvatar} />
              ) : (
                <View style={styles.headerAvatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{user?.name?.charAt(0) || 'V'}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greetingText}>Welcome</Text>
              <Text style={styles.userNameText}>{user?.name || 'Tayyab Sohail'}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setActiveTab('Notifications')} style={styles.notifBtn}>
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
          <View style={styles.welcomeCardContainer}>
            <View style={styles.welcomeCard}>
              <TouchableOpacity style={[styles.yearDropdownBtn, { position: 'absolute', top: 15, right: 15, zIndex: 10 }]} onPress={() => setShowYearPicker(true)}>
                <Text style={styles.yearDropdownText}>Year</Text>
                <Text style={styles.yearDropdownArrow}> ⌄</Text>
              </TouchableOpacity>
              <Text style={styles.welcomeSubText}>Welcome, Back</Text>
              <Text style={styles.welcomeMainText}>{user?.name || 'Tayyab sohail'}</Text>
              <Text style={styles.welcomeMonthText}>
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][currentDate.getMonth()]} Month
              </Text>

              <View style={styles.totalBookingRow}>
                <Text style={styles.totalBookingLabel}>Total Booking :</Text>
                <Text style={styles.totalBookingValue}>{stats?.totalOrders || 0}</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Active</Text>
                  <Text style={styles.statVal}>{stats?.completedOrders || 0}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Pending</Text>
                  <Text style={styles.statVal}>{stats?.pendingOrders || 0}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Cancel</Text>
                  <Text style={styles.statVal}>{stats?.cancelledOrders || 0}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.categorySection}>
            <Text style={styles.sectionTitleMain}>Category</Text>
            <View style={styles.categoryRow}>
              <View style={styles.categoryItemWrapper}>
                <TouchableOpacity style={styles.categoryBox} onPress={() => setActiveTab('Vendorspareshop')}>
                  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </Svg>
                </TouchableOpacity>
                <Text style={styles.categoryLabelText}>Shop</Text>
              </View>
              <View style={styles.categoryItemWrapper}>
                <TouchableOpacity style={styles.categoryBox} onPress={() => setActiveTab('VendorWallet')}>
                  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5m-9 0h9m-9 0a2 2 0 100-4h9" />
                  </Svg>
                </TouchableOpacity>
                <Text style={styles.categoryLabelText}>Wallet</Text>
              </View>
              <View style={styles.categoryItemWrapper}>
                <TouchableOpacity style={styles.categoryBox} onPress={() => setActiveTab('ChallenBooking')}>
                  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></Path>
                    <Path d="M14 2v6h6"></Path>
                    <Path d="M16 13H8"></Path>
                    <Path d="M16 17H8"></Path>
                    <Path d="M10 9H8"></Path>
                  </Svg>
                </TouchableOpacity>
                <Text style={styles.categoryLabelText}>Chellan</Text>
              </View>
            </View>
          </View>

          <View style={styles.chartSection}>
            <RevenueChart data={stats?.monthlyRevenue || Array(12).fill(0)} />
          </View>

          <View style={styles.recentSection}>
            <View style={styles.recentHeaderRow}>
              <Text style={styles.sectionTitleMain}>Recent Bookings</Text>
              <TouchableOpacity onPress={() => setActiveTab('Orders')}>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>
            {(() => {
              const now = new Date();
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, '0');
              const day = String(now.getDate()).padStart(2, '0');
              const todayStr = `${year}-${month}-${day}`;
              
              // Filter out completed and delivered orders
              const activeOrders = recentOrders.filter((o: any) => o.status !== 'completed' && o.status !== 'delivered');
              
              const todayBookings = activeOrders.filter((o: any) => o.bookingDate === todayStr);
              const displayOrders = todayBookings.length > 0 ? todayBookings.slice(0, 3) : activeOrders.slice(0, 3);

              if (displayOrders.length > 0) {
                return displayOrders.map((order: any) => (
                  <RecentOrderCard key={order._id} order={order} />
                ));
              }
              return <Text style={styles.emptyText}>No bookings found for today.</Text>;
            })()}
          </View>
        </ScrollView>

        <Modal visible={showYearPicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Year</Text>
              <FlatList
                data={years}
                keyExtractor={(item) => item.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.yearItem} onPress={() => { setSelectedYear(item); setShowYearPicker(false); }}>
                    <Text style={[styles.yearItemText, selectedYear === item && styles.activeYearText]}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowYearPicker(false)}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    marginTop: 30,
    backgroundColor: 'transparent',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifBtn: {
    padding: 8,
    position: 'relative',
    marginLeft: 15,
  },
  notifIcon: {
    fontSize: 22,
    color: '#FFF',
  },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EB5757',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#000',
  },
  notifBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '800' },
  headerTextContainer: { marginLeft: 12 },
  greetingText: { fontSize: 12, color: '#DDD', fontWeight: '500' },
  userNameText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  headerAvatar: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 1, borderColor: '#444' },
  headerAvatarPlaceholder: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  scroll: { paddingVertical: 5 },

  yearDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E67E22'
  },
  yearDropdownText: { color: '#CCC', fontSize: 12, fontWeight: '500' },
  yearDropdownArrow: { color: '#CCC', fontSize: 14, marginLeft: 5 },

  welcomeCardContainer: { paddingHorizontal: 20, marginBottom: 20 },
  welcomeCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E67E22',
    padding: 20,
    alignItems: 'center',
  },
  welcomeSubText: { color: '#FFF', fontSize: 13, marginBottom: 5 },
  welcomeMainText: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  welcomeMonthText: { color: '#FFF', fontSize: 13, marginBottom: 5, width: '100%', textAlign: 'center' },
  totalBookingRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 10 },
  totalBookingLabel: { color: '#FFFF00', fontSize: 16, fontWeight: 'bold' },
  totalBookingValue: { color: '#FFFF00', fontSize: 16, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' },
  statCol: { flex: 1, alignItems: 'center' },
  statLabel: { color: '#FFF', fontSize: 17, marginBottom: 10 ,width:80, textAlign: 'center'},
  statVal: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  statDivider: { width: 1, height: 40, backgroundColor: '#888' },

  categorySection: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitleMain: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 15 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryItemWrapper: { alignItems: 'center', width: '30%' },
  categoryBox: {
    width: 65,
    height: 65,
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E67E22',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  catEmoji: { fontSize: 24 },
  categoryLabelText: { color: '#FFF', fontSize: 12, fontWeight: '600' },

  chartSection: { paddingHorizontal: 20, marginBottom: 20 },
  chartCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  chartTitle: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  monthDropdownBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A2A2A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#E67E22' },
  monthDropdownText: { color: '#FFF', fontSize: 10 },

  tooltipBoxSvg: { position: 'absolute', backgroundColor: '#FFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, zIndex: 20 },
  tooltipTextSvg: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  xAxisContainerSvg: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 35 },
  chartXAxisLineSvg: { position: 'absolute', top: 0, left: 20, right: 20, height: 1, borderTopWidth: 1, borderColor: '#444', borderStyle: 'dashed' },
  xAxisTickWrapperSvg: { position: 'absolute', top: -2, width: 30, alignItems: 'center' },
  xTickSvg: { width: 6, height: 4, backgroundColor: '#007AFF', borderRadius: 1 },
  xLabelSvg: { color: '#FFF', fontSize: 10, marginTop: 5 },

  recentSection: { paddingHorizontal: 20, paddingBottom: 15 },
  recentHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  viewAllText: { color: '#888', fontSize: 12, fontWeight: '600' },
  recentOrderCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    borderLeftWidth: 4,
    borderLeftColor: '#E67E22',
    padding: 15,
    marginBottom: 15,
  },
  recentOrderTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  recentOrderDate: { color: '#CCC', fontSize: 11 },
  unpaidBadge: { backgroundColor: '#E67E22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  unpaidText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  recentOrderTimeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  recentOrderTimeVal: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  recentOrderTimeValRight: { color: '#FFF', fontSize: 12, justifyContent: "flex-end", width: 130 ,textAlign:'right'},
  orderBottomRow: { flexDirection: 'row', alignItems: 'center' },
  orderUserImg: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  orderUserPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#444', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  orderUserInitial: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  orderMid: { flex: 1 },
  orderUserName: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  orderEmail: { color: '#AAA', fontSize: 10 },
  phoneBtn: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#27AE60', justifyContent: 'center', alignItems: 'center' },
  phoneIcon: { fontSize: 16, color: '#FFF' },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, maxHeight: '50%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 20, textAlign: 'center' },
  yearItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#333', alignItems: 'center' },
  yearItemText: { fontSize: 18, color: '#AAA' },
  activeYearText: { color: '#E67E22', fontWeight: 'bold' },
  closeBtn: { marginTop: 20, padding: 15, backgroundColor: '#E67E22', borderRadius: 15, alignItems: 'center' },
  closeBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default VendorDashboard;
