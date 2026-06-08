import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, FlatList, Alert, ActivityIndicator, SafeAreaView, Dimensions
} from 'react-native';
import api from '../services/api';

const { width } = Dimensions.get('window');

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helpers
const formatTime12Hour = (time24: string) => {
  if (!time24) return '';
  let [hoursStr, minutes] = time24.split(':');
  let hours = parseInt(hoursStr, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hStr = hours < 10 ? '0' + hours : hours;
  return `${hStr}:${minutes} ${ampm}`;
};

const parseTime24Hour = (time12Str: string) => {
  try {
    if (!time12Str) return "09:00";
    const [time, modifier] = time12Str.trim().split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = String(parseInt(hours, 10) + 12);
    if (hours.length === 1) hours = '0' + hours;
    return `${hours}:${minutes}`;
  } catch (e) {
    return "09:00";
  }
};

const parseTime24ToMinutes = (time24: string) => {
  if (!time24) return 0;
  const [h, m] = time24.split(':');
  return parseInt(h, 10) * 60 + parseInt(m, 10);
};

const parse12HourToMinutes = (time12Str: string) => {
  if (!time12Str) return 0;
  try {
    const [time, modifier] = time12Str.trim().split(' ');
    let [hours, minutes] = time.split(':');
    let h = parseInt(hours, 10);
    let m = parseInt(minutes, 10);
    if (h === 12) h = 0;
    if (modifier === 'PM') h += 12;
    return h * 60 + m;
  } catch (e) {
    return 0;
  }
};

const checkOverlap = (existingTime: string, newStartTime24: string, newEndTime24: string) => {
  const newStartMin = parseTime24ToMinutes(newStartTime24);
  const newEndMin = parseTime24ToMinutes(newEndTime24);

  if (existingTime && existingTime.includes('-')) {
    const [existStart12, existEnd12] = existingTime.split('-');
    const existStartMin = parse12HourToMinutes(existStart12);
    const existEndMin = parse12HourToMinutes(existEnd12);
    return newStartMin < existEndMin && newEndMin > existStartMin;
  } else if (existingTime) {
    const existMin = parse12HourToMinutes(existingTime);
    return newStartMin <= existMin && newEndMin > existMin;
  }
  return false;
};

// Generate Time List (every 30 mins) for Picker
const generateTimeOptions = () => {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m of ['00', '30']) {
      const hStr = h < 10 ? `0${h}` : `${h}`;
      times.push(`${hStr}:${m}`);
    }
  }
  return times;
};
const timeOptions = generateTimeOptions();

// Generate Date Options (Next 30 days)
const generateDateOptions = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};
const dateOptions = generateDateOptions();


const VendorTimeslot = () => {
  const [vendorData, setVendorData] = useState({ id: '', name: '' });

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('5');
  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>({
    Sunday: false, Monday: true, Tuesday: true, Wednesday: true,
    Thursday: true, Friday: true, Saturday: false
  });
  const [availableDaysInRange, setAvailableDaysInRange] = useState<Record<string, boolean>>({
    Sunday: true, Monday: true, Tuesday: true, Wednesday: true,
    Thursday: true, Friday: true, Saturday: true
  });

  const [editSlotId, setEditSlotId] = useState<string | null>(null);

  const [slots, setSlots] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);

  // Picker States
  const [showPicker, setShowPicker] = useState(false);
  const [pickerType, setPickerType] = useState<'date' | 'time'>('date');
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | 'filter'>('start');

  useEffect(() => {
    fetchProfile();
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  }, []);

  const fetchProfile = async () => {
    try {
      const [authRes, vendorRes]: any = await Promise.all([
        api.get('/auth/profile'),
        api.get('/vendor/profile')
      ]);
      if (authRes.success) {
        setVendorData({
          id: vendorRes?.vendor?._id || authRes.user._id,
          name: authRes.user.name || 'Vendor'
        });
      }
    } catch (e) {
      console.warn('Profile fetch error:', e);
    }
  };

  useEffect(() => {
    if (vendorData.id) fetchAllSlots();
  }, [vendorData.id]);

  useEffect(() => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) return;

    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const available: Record<string, boolean> = {
      Sunday: false, Monday: false, Tuesday: false, Wednesday: false,
      Thursday: false, Friday: false, Saturday: false
    };

    if (daysDiff >= 6) {
      Object.keys(available).forEach(d => available[d] = true);
    } else {
      let current = new Date(start);
      while (current <= end) {
        available[daysOfWeek[current.getDay()]] = true;
        current.setDate(current.getDate() + 1);
      }
    }

    setAvailableDaysInRange(available);

    if (!editSlotId) {
      setSelectedDays(prev => {
        const next = { ...prev };
        for (const day of daysOfWeek) {
          if (!available[day]) {
            next[day] = false;
          } else if (daysDiff < 6) {
            next[day] = true;
          }
        }
        return next;
      });
    }
  }, [startDate, endDate, editSlotId]);

  const fetchAllSlots = async () => {
    try {
      setFetchingSlots(true);
      const response: any = await api.get(`/slots/${vendorData.id}`);
      if (response.success) {
        setSlots(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setFetchingSlots(false);
    }
  };

  const handleDayChange = (day: string) => {
    setSelectedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
    setStartTime('');
    setEndTime('');
    setMaxCapacity('5');
    setEditSlotId(null);
    setSelectedDays({
      Sunday: false, Monday: true, Tuesday: true, Wednesday: true,
      Thursday: true, Friday: true, Saturday: false
    });
  };

  const handleEditClick = (slot: any) => {
    setEditSlotId(slot._id);
    setStartDate(slot.date);
    setEndDate(slot.date);
    setMaxCapacity(String(slot.maxCapacity || 5));

    const dateObj = new Date(slot.date);
    const dayName = daysOfWeek[dateObj.getDay()];

    const newDays: Record<string, boolean> = {
      Sunday: false, Monday: false, Tuesday: false, Wednesday: false,
      Thursday: false, Friday: false, Saturday: false
    };
    newDays[dayName] = true;
    setSelectedDays(newDays);

    if (slot.time && slot.time.includes('-')) {
      const [start, end] = slot.time.split('-');
      setStartTime(parseTime24Hour(start));
      setEndTime(parseTime24Hour(end));
    } else {
      setStartTime(parseTime24Hour(slot.time));
      setEndTime(parseTime24Hour(slot.time));
    }
  };

  const handleDeleteClick = (id: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this slot?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            await api.delete(`/slots/${id}`);
            Alert.alert("Success", "Slot deleted successfully.");
            fetchAllSlots();
            if (editSlotId === id) resetForm();
          } catch (err: any) {
            Alert.alert("Error", err.response?.data?.message || 'Error deleting slot');
          }
        }
      }
    ]);
  };

  const handleGenerateSlots = async () => {
    if (!startTime || !endTime) {
      Alert.alert('Error', 'Please select both start and end times.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      Alert.alert('Error', 'End Date cannot be before Start Date.');
      return;
    }
    const hasDaysSelected = Object.values(selectedDays).some(val => val);
    if (!hasDaysSelected) {
      Alert.alert('Error', 'Please select at least one day of the week.');
      return;
    }

    try {
      setLoading(true);
      const formattedTime = `${formatTime12Hour(startTime)} - ${formatTime12Hour(endTime)}`;

      // UPDATE MODE
      if (editSlotId) {
        const isOverlapping = slots.some(s => {
          if (s.date !== startDate) return false;
          if (s._id === editSlotId) return false;
          return checkOverlap(s.time, startTime, endTime);
        });

        if (isOverlapping) {
          Alert.alert("Error", "Cannot update slot: The selected time overlaps with an existing slot.");
          setLoading(false);
          return;
        }

        const payload = {
          date: startDate,
          time: formattedTime,
          maxCapacity: parseInt(maxCapacity, 10)
        };
        await api.put(`/slots/${editSlotId}`, payload);
        Alert.alert("Success", "Slot updated successfully.");
        resetForm();
        fetchAllSlots();
        setLoading(false);
        return;
      }

      // GENERATE MODE
      let currentDate = new Date(startDate);
      const endD = new Date(endDate);
      let createdCount = 0;
      let duplicateCount = 0;

      while (currentDate <= endD) {
        const dayName = daysOfWeek[currentDate.getDay()];
        if (selectedDays[dayName]) {
          const dateStr = currentDate.toISOString().split('T')[0];

          const slotExists = slots.some(s => {
            if (s.date !== dateStr) return false;
            return checkOverlap(s.time, startTime, endTime);
          });

          if (slotExists) {
            duplicateCount++;
          } else {
            const payload = {
              center: vendorData.id,
              date: dateStr,
              time: formattedTime,
              maxCapacity: parseInt(maxCapacity, 10)
            };
            try {
              await api.post('/slots', payload);
              createdCount++;
            } catch (err: any) {
              duplicateCount++;
            }
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (createdCount > 0) {
        Alert.alert("Success", `Successfully generated ${createdCount} time slot(s).`);
        fetchAllSlots();
      } else if (duplicateCount > 0) {
        Alert.alert('Notice', 'Already slot exists for selected times.');
      } else {
        Alert.alert('Notice', 'No valid dates found for the selected days within the date range.');
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred during operation.');
    } finally {
      setLoading(false);
    }
  };

  const getDayLabel = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    const dayIndex = d.getDay();
    if (isNaN(dayIndex) || !daysOfWeek[dayIndex]) return 'N/A';
    return daysOfWeek[dayIndex];
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingSlots = slots.filter(s => s.date >= todayStr);
  const displaySlots = filterDate ? upcomingSlots.filter(s => s.date === filterDate) : upcomingSlots;

  const openPicker = (type: 'date' | 'time', target: 'start' | 'end' | 'filter') => {
    setPickerType(type);
    setPickerTarget(target);
    setShowPicker(true);
  };

  const handlePickerSelect = (val: string) => {
    setShowPicker(false);
    if (pickerType === 'date') {
      if (pickerTarget === 'start') setStartDate(val);
      else if (pickerTarget === 'end') setEndDate(val);
      else if (pickerTarget === 'filter') setFilterDate(val);
    } else {
      if (pickerTarget === 'start') setStartTime(val);
      else if (pickerTarget === 'end') setEndTime(val);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Manage Timeslots</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* FORM SECTION */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{editSlotId ? 'Edit Slot' : 'Generate Slots'}</Text>
            {editSlotId && (
              <TouchableOpacity onPress={resetForm} style={styles.cancelEditBtn}>
                <Text style={styles.cancelEditTxt}>Cancel Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.formRow}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Start Date</Text>
              <TouchableOpacity style={styles.inputBox} onPress={() => openPicker('date', 'start')}>
                <Text style={styles.inputText}>{startDate || 'YYYY-MM-DD'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>End Date</Text>
              <TouchableOpacity style={styles.inputBox} onPress={() => !editSlotId && openPicker('date', 'end')}>
                <Text style={[styles.inputText, editSlotId && { color: '#888' }]}>{endDate || 'YYYY-MM-DD'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.label}>Applicable Days</Text>
          <View style={styles.daysGrid}>
            {daysOfWeek.map(day => {
              const isAvailable = availableDaysInRange[day];
              const isSelected = selectedDays[day];
              const disabled = !isAvailable || !!editSlotId;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, isSelected && styles.dayChipActive, disabled && styles.dayChipDisabled]}
                  onPress={() => !disabled && handleDayChange(day)}
                  activeOpacity={disabled ? 1 : 0.7}
                >
                  <Text style={[styles.dayChipText, isSelected && styles.dayChipTextActive, disabled && { color: '#666' }]}>
                    {day.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={styles.formRow}>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>Start Time</Text>
              <TouchableOpacity style={styles.inputBox} onPress={() => openPicker('time', 'start')}>
                <Text style={styles.inputText}>{startTime ? formatTime12Hour(startTime) : '--:--'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>End Time</Text>
              <TouchableOpacity style={styles.inputBox} onPress={() => openPicker('time', 'end')}>
                <Text style={styles.inputText}>{endTime ? formatTime12Hour(endTime) : '--:--'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>Capacity</Text>
              <TextInput
                style={[styles.inputBox, { color: '#FFF' }]}
                keyboardType="numeric"
                value={maxCapacity}
                onChangeText={setMaxCapacity}
              />
            </View>
          </View>

          <TouchableOpacity style={[styles.submitBtn, editSlotId && { backgroundColor: '#3498DB' }]} onPress={handleGenerateSlots} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <Text style={styles.submitBtnText}>{editSlotId ? 'Update Time Slot' : 'Generate Time Slots'}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* LIST SECTION */}
        <View style={[styles.card, { marginTop: 20 }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Scheduled Slots</Text>
            <View style={styles.badge}><Text style={styles.badgeTxt}>{upcomingSlots.length} Slots</Text></View>
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity style={[styles.inputBox, { flex: 1 }]} onPress={() => openPicker('date', 'filter')}>
              <Text style={styles.inputText}>{filterDate || 'Filter by date...'}</Text>
            </TouchableOpacity>
            {filterDate ? (
              <TouchableOpacity style={styles.clearBtn} onPress={() => setFilterDate('')}>
                <Text style={styles.clearBtnTxt}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {fetchingSlots ? (
            <ActivityIndicator color="#E67E22" style={{ marginVertical: 30 }} />
          ) : displaySlots.length > 0 ? (
            displaySlots.map((slot, idx) => (
              <View key={slot._id || idx} style={styles.slotItem}>
                <View style={styles.slotInfo}>
                  <View style={styles.slotDateRow}>
                    <View style={styles.dateBadge}><Text style={styles.dateBadgeTxt}>{slot.date}</Text></View>
                    <View style={styles.dayBadge}><Text style={styles.dayBadgeTxt}>{getDayLabel(slot.date)}</Text></View>
                  </View>
                  <Text style={styles.slotTimeTxt}>{slot.time}</Text>
                  <Text style={styles.slotDetailsTxt}>Cap: {slot.maxCapacity}  •  Booked: {slot.bookedCount || 0}</Text>
                </View>
                <View style={styles.slotActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditClick(slot)}>
                    <Text style={styles.actionBtnTxt}>✎</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(231,76,60,0.2)' }]} onPress={() => handleDeleteClick(slot._id)}>
                    <Text style={[styles.actionBtnTxt, { color: '#E74C3C' }]}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyTxt}>No time slots found.</Text>
          )}
        </View>
      </ScrollView>

      {/* Reusable Picker Modal */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select {pickerType === 'date' ? 'Date' : 'Time'}</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.pickerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={pickerType === 'date' ? dateOptions : timeOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.pickerItem} onPress={() => handlePickerSelect(item)}>
                  <Text style={styles.pickerItemTxt}>
                    {pickerType === 'date' ? item : formatTime12Hour(item)}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerRow: { padding: 20, paddingTop: 50, paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  scrollContent: { paddingHorizontal: 15, paddingBottom: 20 },
  card: { backgroundColor: 'rgba(20,20,20,0.8)', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: '#333' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  cancelEditBtn: { padding: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 5 },
  cancelEditTxt: { color: '#FFF', fontSize: 12 },
  badge: { backgroundColor: '#1B4D6B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeTxt: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  formRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  halfInput: { width: '48%' },
  thirdInput: { width: '31%' },
  label: { color: '#CCC', fontSize: 12, marginBottom: 5, fontWeight: 'bold' },
  inputBox: { backgroundColor: 'rgba(255,255,255,0.1)', height: 45, borderRadius: 8, paddingHorizontal: 10, justifyContent: 'center', borderWidth: 1, borderColor: '#444' },
  inputText: { color: '#FFF', fontSize: 14 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  dayChip: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#444' },
  dayChipActive: { backgroundColor: '#E67E22', borderColor: '#E67E22' },
  dayChipDisabled: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: '#222' },
  dayChipText: { color: '#CCC', fontSize: 12, fontWeight: 'bold' },
  dayChipTextActive: { color: '#FFF' },
  submitBtn: { backgroundColor: '#E67E22', height: 45, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
  clearBtn: { padding: 10 },
  clearBtnTxt: { color: '#E74C3C', fontWeight: 'bold' },
  slotItem: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  slotInfo: { flex: 1 },
  slotDateRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  dateBadge: { backgroundColor: 'rgba(52, 152, 219, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  dateBadgeTxt: { color: '#3498DB', fontSize: 12, fontWeight: 'bold' },
  dayBadge: { backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingVertical: 3, borderRadius: 6, width: 85, justifyContent: 'center', alignItems: 'center' },
  dayBadgeTxt: { color: '#CCC', fontSize: 12, textAlign: 'center', width: 100 },
  slotTimeTxt: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  slotDetailsTxt: { color: '#888', fontSize: 12 },
  slotActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  actionBtnTxt: { color: '#FFF', fontSize: 16 },
  emptyTxt: { color: '#888', textAlign: 'center', marginTop: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  pickerContainer: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  pickerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  pickerClose: { color: '#999', fontSize: 20 },
  pickerItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
  pickerItemTxt: { color: '#FFF', fontSize: 16, textAlign: 'center' }
});

export default VendorTimeslot;
