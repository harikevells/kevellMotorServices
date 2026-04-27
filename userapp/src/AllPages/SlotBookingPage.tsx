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
  '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', 
  '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', 
  '08:00 PM', '09:00 PM'
];

const SlotBookingPage = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SlotRouteProp>();
  const { centerId, serviceIds, vehicleId, category, fuel, vehicleCategory } = route.params;

  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      full: d.toISOString().split('T')[0],
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate(),
    };
  });

  useEffect(() => {
    loadSlots();
  }, [selectedDate]);

  const loadSlots = async () => {
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

      setSlots(mergedSlots);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderSlotItem = ({ item }: { item: Slot }) => {
    const isFull = item.bookedCount >= item.maxCapacity;
    const isSelected = selectedTime === item.time;
    
    return (
      <TouchableOpacity
        style={[
          styles.slotItem,
          isFull && styles.fullSlot,
          isSelected && styles.selectedSlot,
        ]}
        disabled={isFull}
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

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Pick a Date</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.dateList}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {dates.map((item) => (
            <TouchableOpacity 
              key={item.full}
              style={[styles.dateItem, selectedDate === item.full && styles.selectedDateItem]}
              onPress={() => setSelectedDate(item.full)}
            >
              <Text style={[styles.dateDay, selectedDate === item.full && styles.selectedDateText]}>{item.day}</Text>
              <Text style={[styles.dateNumber, selectedDate === item.full && styles.selectedDateText]}>{item.date}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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

        <TouchableOpacity 
          style={[styles.nextButton, !selectedTime && styles.disabledButton]}
          onPress={() => selectedTime && navigation.navigate('Address', { 
            centerId, 
            serviceIds, 
            slotDate: selectedDate, 
            slotTime: selectedTime,
            vehicleId,
            category,
            fuel,
            vehicleCategory
          })}
          disabled={!selectedTime}
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
    fontSize: 18,
    fontWeight: '800',
    color: '#f28b2c',
    marginBottom: 15,
  },
  dateList: {
    flexGrow: 0,
    marginBottom: 30,
  },
  dateItem: {
    width: 70,
    height: 90,
    backgroundColor: '#121212',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  selectedDateItem: {
    backgroundColor: '#f28b2c',
    borderColor: '#f28b2c',
  },
  dateDay: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 8,
    fontWeight: '600',
  },
  dateNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
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
  }
});

export default SlotBookingPage;
