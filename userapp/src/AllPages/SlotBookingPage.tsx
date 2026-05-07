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
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { fetchSlots } from '../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type SlotRouteProp = RouteProp<RootStackParamList, 'SlotBooking'>;

interface Slot {
  _id: string;
  time: string;
  maxCapacity: number;
  bookedCount: number;
}

const DEFAULT_TIMES = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM', '09:00 PM'
];

const SlotBookingPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SlotRouteProp>();
  const { centerId, serviceIds, serviceNames, vehicleId, category, fuel, vehicleCategory } = route.params;

  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingType, setBookingType] = useState<'upcoming' | 'live'>('upcoming');
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  // Live states
  const [liveDate, setLiveDate] = useState('');
  const [liveTime, setLiveTime] = useState('');

  const generateDates = () => {
    const dates = [];
    const now = new Date();
    // Generate dates for current and next 2 months
    for (let m = 0; m < 3; m++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() + m, 1);
      const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
        // Don't show past dates
        if (date >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
          dates.push({
            full: date.toISOString().split('T')[0],
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            date: date.getDate(),
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            monthNum: date.getMonth(),
            year: date.getFullYear()
          });
        }
      }
    }
    return dates;
  };

  const allDates = generateDates();
  const months = [...new Set(allDates.map(d => `${d.month} ${d.year}`))];
  const filteredDates = allDates.filter(d => `${d.month} ${d.year}` === `${new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'short' })} ${viewYear}`);

  useEffect(() => {
    loadSlots();
  }, [selectedDate]);

  const isPastTime = (timeStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDate !== todayStr) return false;

    const now = new Date();
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const slotTimeEnd = new Date();
    slotTimeEnd.setHours(hours, minutes + 30, 0, 0);

    return slotTimeEnd <= now;
  };

  const loadSlots = async () => {
    if (bookingType !== 'upcoming') return;
    try {
      setLoading(true);
      const res = await fetchSlots(centerId, selectedDate);
      const backendSlots = Array.isArray(res?.data) ? res.data : [];

      const mergedSlots = DEFAULT_TIMES.map(time => {
        const found = backendSlots.find((s: any) => s.time === time);
        if (found) return found;
        return {
          _id: time, // temporary id
          time,
          maxCapacity: 5,
          bookedCount: 0
        };
      });

      const filteredSlots = mergedSlots.filter(item => !isPastTime(item.time));
      setSlots(filteredSlots);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLiveSlot = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    setLiveDate(date);
    setLiveTime(time);
    setSelectedDate(date);
    setSelectedTime(time);
    Alert.alert('Live Slot Captured', `Date: ${date}\nTime: ${time}`);
  };

  const handleReviewBooking = () => {
    let finalDate = selectedDate;
    let finalTime = selectedTime;

    if (bookingType === 'live') {
      finalDate = liveDate;
      finalTime = liveTime;
    }

    if (!finalDate || !finalTime) {
      Alert.alert('Selection Required', 'Please select or enter a date and time.');
      return;
    }

    navigation.navigate('Address', {
      centerId,
      serviceIds,
      serviceNames,
      slotDate: finalDate,
      slotTime: finalTime,
      vehicleId,
      category,
      fuel,
      vehicleCategory,
      bookingType
    });
  };

  const renderSlotItem = ({ item }: { item: Slot }) => {
    const isFull = item.bookedCount >= item.maxCapacity;
    const isPast = isPastTime(item.time);
    const isSelected = selectedTime === item.time;

    return (
      <TouchableOpacity
        style={[
          styles.slotItem,
          (isFull || isPast) && styles.fullSlot,
          isSelected && styles.selectedSlot,
        ]}
        disabled={isFull || isPast}
        onPress={() => setSelectedTime(item.time)}
      >
        <Text style={[
          styles.slotTime,
          isFull && styles.fullSlotText,
          isSelected && styles.selectedSlotText,
        ]}>{item.time}</Text>
        <Text style={[
          styles.slotAvailability,
          isFull && styles.fullSlotText,
          isSelected && styles.selectedSlotText,
        ]}>
          {isFull ? 'Full' : `${item.maxCapacity - item.bookedCount} left`}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Time Slot</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, bookingType === 'upcoming' && styles.activeTab]}
          onPress={() => setBookingType('upcoming')}
        >
          <Text style={[styles.tabText, bookingType === 'upcoming' && styles.activeTabText]}>Upcoming Slot</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, bookingType === 'live' && styles.activeTab]}
          onPress={() => setBookingType('live')}
        >
          <Text style={[styles.tabText, bookingType === 'live' && styles.activeTabText]}>Emergency Slot</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {bookingType === 'upcoming' ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pick a Date</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowMonthDropdown(true)}
              >
                <Text style={styles.dropdownButtonText}>
                  {new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <Modal
              visible={showMonthDropdown}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowMonthDropdown(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowMonthDropdown(false)}
              >
                <View style={styles.dropdownContent}>
                  {months.map((m, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.dropdownOption}
                      onPress={() => {
                        const date = allDates.find(d => `${d.month} ${d.year}` === m);
                        if (date) {
                          setViewMonth(date.monthNum);
                          setViewYear(date.year);
                        }
                        setShowMonthDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownOptionText,
                        `${new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'short' })} ${viewYear}` === m && styles.activeDropdownText
                      ]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>

            <FlatList
              horizontal
              data={filteredDates}
              keyExtractor={(item) => item.full}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateListContainer}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.dateItem, selectedDate === item.full && styles.selectedDateItem]}
                  onPress={() => setSelectedDate(item.full)}
                >
                  <Text style={[styles.dateDay, selectedDate === item.full && styles.selectedDateText]}>{item.day}</Text>
                  <Text style={[styles.dateNumber, selectedDate === item.full && styles.selectedDateText]}>{item.date}</Text>
                  <Text style={[styles.dateMonth, selectedDate === item.full && styles.selectedDateText]}>{item.month}</Text>
                </TouchableOpacity>
              )}
            />

            <Text style={styles.sectionTitle}>Available Slots</Text>
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
            ) : slots.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No slots available for this date.</Text>
              </View>
            ) : (
              <FlatList
                data={slots}
                keyExtractor={(item) => item.time}
                renderItem={renderSlotItem}
                numColumns={2}
                contentContainerStyle={styles.slotGrid}
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        ) : (
          <View style={styles.liveSlotContainer}>
            <Text style={styles.sectionTitle}>Live Slot Booking</Text>
            <TouchableOpacity style={styles.liveSlotBtn} onPress={handleLiveSlot}>
              <Text style={styles.liveSlotBtnText}>Get Current Date & Time</Text>
            </TouchableOpacity>

            {(liveDate && liveTime) ? (
              <View style={styles.liveResult}>
                <Text style={styles.liveResultText}>Selected Date: {liveDate}</Text>
                <Text style={styles.liveResultText}>Selected Time: {liveTime}</Text>
              </View>
            ) : (
              <Text style={styles.helperText}>Click the button to capture the current time for your service.</Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            ((bookingType === 'upcoming' && !selectedTime) ||
              (bookingType === 'live' && !liveTime)) && styles.disabledButton
          ]}
          onPress={handleReviewBooking}
          disabled={(bookingType === 'upcoming' && !selectedTime) || (bookingType === 'live' && !liveTime)}
        >
          <Text style={styles.nextButtonText}>Review Booking</Text>
        </TouchableOpacity>
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
    paddingTop: 30,
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
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f28b2c',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  dropdownButtonText: {
    color: '#f28b2c',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
  },
  dropdownArrow: {
    color: '#888',
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContent: {
    backgroundColor: '#1A1A1A',
    width: '80%',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  dropdownOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dropdownOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeDropdownText: {
    color: '#f28b2c',
  },
  dateListContainer: {
    paddingRight: 30,
    paddingBottom: 20,
    marginBottom: 10,
  },
  dateItem: {
    width: 60,
    height: 80,
    backgroundColor: '#121212',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#333333',
  },
  selectedDateItem: {
    backgroundColor: '#f28b2c',
    borderColor: '#f28b2c',
  },
  dateDay: {
    fontSize: 12,
    color: '#AAAAAA',
    marginBottom: 4,
    fontWeight: '600',
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 1,
  },
  dateMonth: {
    fontSize: 10,
    color: '#f28b2c',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  selectedDateText: {
    color: '#FFFFFF',
  },
  slotGrid: {
    paddingBottom: 20,
  },
  slotItem: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 18,
    borderRadius: 20,
    margin: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  selectedSlot: {
    borderColor: '#f28b2c',
    backgroundColor: '#f28b2c15',
  },
  fullSlot: {
    backgroundColor: '#1A1A1A',
    opacity: 0.4,
  },
  slotTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  slotAvailability: {
    fontSize: 12,
    color: '#f28b2c',
    marginTop: 4,
    fontWeight: '800',
  },
  fullSlotText: {
    color: '#333333',
  },
  selectedSlotText: {
    color: '#f28b2c',
  },
  nextButton: {
    backgroundColor: '#f28b2c',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 'auto',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#AAAAAA',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  activeTab: {
    backgroundColor: '#f28b2c20',
    borderColor: '#f28b2c',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#f28b2c',
  },
  emergencyContainer: {
    flex: 1,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15,
  },
  textInput: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    color: '#FFFFFF',
    padding: 15,
    fontSize: 16,
  },
  helperText: {
    color: '#888',
    fontSize: 12,
    marginTop: 15,
    fontStyle: 'italic',
  },
  liveSlotContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 30,
  },
  liveSlotBtn: {
    backgroundColor: '#f28b2c',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 15,
    marginBottom: 20,
  },
  liveSlotBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  liveResult: {
    backgroundColor: '#121212',
    padding: 20,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f28b2c50',
  },
  liveResultText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 5,
  }
});

export default SlotBookingPage;
