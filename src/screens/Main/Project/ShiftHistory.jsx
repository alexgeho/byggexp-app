import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState, useContext, useCallback } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import AuthContext from '../../../contexts/AuthContext';
import { BottomBar } from '../../../components/BottomBar';
import { GlassBackButton } from '../../../components/common/GlassBackButton/GlassBackButton';
import { shiftService } from '../../../services';
import { formatDuration, formatMonthLabel, formatShiftDayLabel, formatTimeRange } from '../../../utils/shifts';
import { useFocusEffect } from '@react-navigation/native';

export const ShiftHistory = ({ route }) => {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const bottomSheetRef = useRef(null);
  const [period] = useState('Month');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  const { projectId, type = 'history' } = route.params || {};
  const canCreate = user?.role === 'worker' && type === 'report';
  const canViewAll = ['companyAdmin', 'projectAdmin'].includes(user?.role);

  const loadShiftDays = useCallback(async () => {
    try {
      setLoading(true);
      const [months, data] = await Promise.all([
        shiftService.getMonths(),
        shiftService.list(projectId ? { projectId } : {}),
      ]);

      setDays(data.days || []);

      if (months.length > 0) {
        setFromDate(formatMonthLabel(months[months.length - 1]));
        setToDate(formatMonthLabel(months[0]));
      } else {
        setFromDate('');
        setToDate('');
      }
    } catch (error) {
      console.error('Failed to load shift history list:', error);
      setDays([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useFocusEffect(
    useCallback(() => {
      loadShiftDays();
    }, [loadShiftDays]),
  );

  const openWorkerModal = () => {
    bottomSheetRef.current?.expand();
  };

  const closeWorkerModal = () => {
    bottomSheetRef.current?.close();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <GlassBackButton backgroundColor={'rgb(253 253 253)'} tint={"light"} borderColor="#FFFFFF50" onPress={() => navigation.goBack()} iconSource={require('../../../assets/Arrow-left.png')} />
        <Text style={styles.projectName}>Shift history</Text>
        <View style={styles.backZeroButton} />
      </View>

      <Text style={{ color: '#052D50', fontSize: 36, width: '100%' }}>{user?.name || 'Shift history'}</Text>

      <ScrollView style={{ flex: 1, width: '100%' }}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0091FF" />
          </View>
        ) : days.length === 0 ? (
          <Text style={styles.emptyStateText}>No shifts found yet.</Text>
        ) : (
          days.map((day) => (
            <TouchableOpacity key={day.date} style={[styles.shiftItem, { marginBottom: 12 }]} activeOpacity={0.9}>
              <View style={styles.shiftHeader}>
                <Text style={styles.dateText}>{formatShiftDayLabel(day.date)}</Text>
                <Text style={styles.totalText}>Total: {formatDuration(day.totalDurationMs)}</Text>
              </View>

              {day.shifts.map((shift, index) => (
                <View key={shift.id} style={index === 0 ? styles.shiftBody : styles.subShift}>
                  <View style={styles.shiftProjectContainer}>
                    <Text style={styles.projectInlineText}>{shift.projectName}</Text>
                    <Text style={styles.locationText}>{shift.location || 'No location'}</Text>
                  </View>
                  <View style={styles.timeContainer}>
                    <Text style={styles.durationText}>{formatDuration(shift.durationMs)}</Text>
                    <Text style={styles.timeRangeText}>{formatTimeRange(shift.startedAt, shift.endedAt)}</Text>
                  </View>
                </View>
              ))}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['30%', '60%']}
        enablePanDownToClose={true}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.periodContainer}>
            <Text style={styles.periodLabel}>Period</Text>
            <TouchableOpacity style={styles.periodDropdown}>
              <Text style={styles.periodValue}>{period}</Text>
              <Image style={styles.dropdownArrow} source={require('../../../assets/Arrow-down.png')} />
            </TouchableOpacity>
          </View>

          <View style={styles.dateContainer}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>From</Text>
              <TextInput
                style={styles.dateInput}
                value={fromDate}
                onChangeText={setFromDate}
                placeholder="Select date"
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>To</Text>
              <TextInput
                style={styles.dateInput}
                value={toDate}
                onChangeText={setToDate}
                placeholder="Select date"
              />
            </View>
          </View>

          <View style={styles.exportButtonsContainer}>
            <TouchableOpacity style={styles.exportButton}>
              <Text style={styles.exportButtonText}>PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportButton}>
              <Text style={styles.exportButtonText}>Excel</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.exportMainButton}
            onPress={() => Alert.alert('Export is not ready yet', 'Shift data is real now, but report export is still pending.')}
          >
            <Text style={styles.exportMainButtonText}>
              Export
            </Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>

      <BottomBar
        onLeftPress={() => navigation.navigate('Home')}
        onRightPress={() => navigation.navigate('Menu')}
        onAddPress={openWorkerModal}
        showAddButton={canCreate || canViewAll}
        renderAddContent={() => (
          <Text style={{ color: '#ffffff' }}>{canCreate ? 'Export Report' : 'View Reports'}</Text>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingTop: 48,
    gap: 24,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  backZeroButton: {
    padding: 16,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  projectName: {
    color: '#052D50',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 96,
    width: '100%',
  },
  loadingContainer: {
    paddingTop: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#698196',
    textAlign: 'center',
    marginTop: 24,
  },
  shiftItem: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.0625,
    shadowRadius: 10,
    elevation: 1,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateText: {
    color: '#0785F4',
  },
  totalText: {
    color: '#0785F4',
  },
  shiftBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftProjectContainer: {
    width: '45%',
    gap: 4,
  },
  projectInlineText: {
    color: '#052D50',
    fontWeight: '600',
  },
  locationText: {
    color: '#052D50',
  },
  timeContainer: {
    gap: 4,
    alignItems: 'flex-end',
  },
  durationText: {
    color: '#052D50',
  },
  timeRangeText: {
    color: '#052D5050',
  },
  subShift: {
    borderTopWidth: 1,
    borderColor: '#E6E6E6',
    paddingTop: 8,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomSheetBackground: {
    backgroundColor: '#F5F8FA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: '#CCCCCC',
    width: 40,
    height: 4,
    borderRadius: 2,
    zIndex: 4,
    position: 'relative',
  },
  bottomSheetContent: {
    padding: 20,
    paddingTop: 12,
  },
  workerModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#052D50',
    marginBottom: 20,
  },
  periodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  periodLabel: {
    fontSize: 16,
    color: '#052D50',
  },
  periodDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  periodValue: {
    fontSize: 16,
    color: '#052D50',
  },
  dropdownArrow: {
    width: 16,
    height: 16,
    marginLeft: 8,
    tintColor: '#052D50',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#052D50',
    marginBottom: 4,
  },
  dateInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    fontSize: 16,
    color: '#052D50',
  },
  exportButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    alignItems: 'center',
  },
  exportButtonText: {
    fontSize: 16,
    color: '#052D50',
  },
  exportMainButton: {
    width: '100%',
    backgroundColor: '#0091FF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  exportMainButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

