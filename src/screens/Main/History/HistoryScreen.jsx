import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { GlassBackButton } from '../../../components/common/GlassBackButton/GlassBackButton';

export default function HistoryScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [selectedDate, setSelectedDate] = useState('2025-04-08');

  const shiftData = {
    '2025-04-08': {
      date: 'Tuesday, July 8, 2025',
      hours: '08:00 – 16:00',
      duration: '8 hours',
      project: 'General construction labor',
      location: 'Site A – Central building area',
      images: [
        require('../../../assets/shiftImage1.jpg'),
        require('../../../assets/shiftImage2.jpg'),
      ],
    },
    '2025-04-09': {
      date: 'Wednesday, July 9, 2025',
      hours: '07:00 – 15:00',
      duration: '8 hours',
      project: 'Roof installation',
      location: 'Site B – North wing',
      images: [
        require('../../../assets/shiftImage3.jpg'),
      ],
    },
  };

  const currentMonthHours = 120;
  const previousMonthHours = 132;

  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'long' });

  const renderCalendar = () => {
    const daysInMonth = 30; 
    const startDay = 3;

    const rows = [];
    let days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarCellEmpty} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `2025-04-${day.toString().padStart(2, '0')}`;
      const isSelected = selectedDate === dateStr;
      const hasShift = shiftData[dateStr];

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarCell,
            isSelected && styles.calendarCellSelected,
            !hasShift && styles.calendarCellEmpty,
          ]}
          onPress={() => setSelectedDate(dateStr)}
        >
          <Text style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}>
            {day}
          </Text>
          {hasShift && (
            <Text style={[styles.calendarHours, isSelected && styles.calendarHoursSelected]}>
              {shiftData[dateStr].duration.split(' ')[0]}h
            </Text>
          )}
        </TouchableOpacity>
      );

      if (days.length === 7) {
        rows.push(<View key={`row-${rows.length}`} style={styles.calendarRow}>{days}</View>);
        days = [];
      }
    }

    if (days.length > 0) {
      while (days.length < 7) {
        days.push(<View key={`empty-end-${days.length}`} style={styles.calendarCellEmpty} />);
      }
      rows.push(<View key="last-row" style={styles.calendarRow}>{days}</View>);
    }

    return rows;
  };

  const currentShift = shiftData[selectedDate] || {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <GlassBackButton backgroundColor={'rgb(253 253 253)'} tint={"light"} borderColor="#FFFFFF50" onPress={() => navigation.goBack()} iconSource={require('../../../assets/Arrow-left.png')} />
        <Text style={[styles.headerTitle, { fontFamily: theme.text.fontFamily['bold'] }]}>Work shifts</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.exportSelector}>
        <Text style={styles.exportLabel}>Select period for export</Text>
        <TouchableOpacity style={styles.dropdownButton}>
          <Text style={styles.dropdownText}>April 2025</Text>
          <Image style={styles.dropdownIcon} source={require('../../../assets/Arrow-down.png')} />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <Text style={styles.calendarHeaderDay}>Mon</Text>
          <Text style={styles.calendarHeaderDay}>Tue</Text>
          <Text style={styles.calendarHeaderDay}>Wed</Text>
          <Text style={styles.calendarHeaderDay}>Thu</Text>
          <Text style={styles.calendarHeaderDay}>Fri</Text>
          <Text style={styles.calendarHeaderDay}>Sat</Text>
          <Text style={styles.calendarHeaderDay}>Sun</Text>
        </View>
        {renderCalendar()}
      </View>

      <View style={styles.shiftDetailsContainer}>
        <Text style={[styles.shiftTitle, { fontFamily: theme.text.fontFamily['bold'] }]}>
          Shift details for {currentShift.date || '—'}
        </Text>
        <View style={styles.shiftInfoRow}>
          <Text style={styles.shiftLabel}>Work hours:</Text>
          <Text style={styles.shiftValue}>{currentShift.hours || '—'}</Text>
        </View>
        <View style={styles.shiftInfoRow}>
          <Text style={styles.shiftLabel}>Duration:</Text>
          <Text style={styles.shiftValue}>{currentShift.duration || '—'}</Text>
        </View>
        <View style={styles.shiftInfoRow}>
          <Text style={styles.shiftLabel}>Project:</Text>
          <Text style={styles.shiftValue}>{currentShift.project || '—'}</Text>
        </View>
        <View style={styles.shiftInfoRow}>
          <Text style={styles.shiftLabel}>Location:</Text>
          <Text style={styles.shiftValue}>{currentShift.location || '—'}</Text>
        </View>
        <View style={styles.shiftImagesRow}>
          {currentShift.images?.map((img, index) => (
            <Image
              key={index}
              style={styles.shiftImage}
              source={img}
            />
          ))}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Current month:</Text>
          <Text style={styles.statValue}>{currentMonthHours} h</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Previous month:</Text>
          <Text style={styles.statValue}>{previousMonthHours} h</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.exportButton}>
        <Text style={styles.exportButtonText}>Export current period</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    paddingTop: 48,
    paddingBottom: 48,
    justifyContent: 'space-between'
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    color: '#052D50',
    fontSize: 18,
    textAlign: 'center',
  },
  placeholder: {
    width: 36,
  },
  exportSelector: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exportLabel: {
    color: '#052D50',
    fontSize: 14,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  dropdownText: {
    color: '#052D50',
    fontSize: 14,
  },
  dropdownIcon: {
    width: 16,
    height: 16,
  },
  calendarContainer: {
    width: '100%',
    marginBottom: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarHeaderDay: {
    color: '#698196',
    fontSize: 12,
    fontWeight: '500',
    width: 40,
    textAlign: 'center'
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  calendarCellSelected: {
    backgroundColor: '#0088FF',
  },
  calendarCellEmpty: {
    width: 40,
    height: 40,
  },
  calendarDay: {
    color: '#052D50',
    fontSize: 14,
    fontWeight: '500',
  },
  calendarDaySelected: {
    color: '#ffffff',
  },
  calendarHours: {
    color: '#ffffff',
    fontSize: 10,
    marginTop: 2,
    backgroundColor: '#0088FF',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  calendarHoursSelected: {
    backgroundColor: '#ffffff',
    color: '#0088FF',
  },
  shiftDetailsContainer: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  shiftTitle: {
    color: '#052D50',
    fontSize: 16,
    marginBottom: 12,
  },
  shiftInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  shiftLabel: {
    color: '#698196',
    fontSize: 14,
  },
  shiftValue: {
    color: '#052D50',
    fontSize: 14,
    fontWeight: '500',
  },
  shiftImagesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  shiftImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  statsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: '#698196',
    fontSize: 14,
  },
  statValue: {
    color: '#052D50',
    fontSize: 16,
    fontWeight: '500',
  },
  exportButton: {
    width: '100%',
    backgroundColor: '#0088FF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

