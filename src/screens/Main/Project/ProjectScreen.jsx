import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState, useRef } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { BottomBar } from '../../../components/BottomBar';
import { GlassBackButton } from '../../../components/common/GlassBackButton/GlassBackButton';

export const ProjectScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params || {};
  const project = { id: id, name: 'Ludvika' };
  const [modal, setModal] = useState('Tasks');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const bottomSheetRef = useRef(null);
  const openWorkerModal = (worker) => {
    setSelectedWorker(worker);
    bottomSheetRef.current?.expand();
  };

  const workers = [
    { id: 1, name: 'Alex Gerhard', avatar: require('../../../assets/TasksAva.png') },
    { id: 2, name: 'Alexander Reed', avatar: require('../../../assets/TasksAva.png') },
    { id: 3, name: 'Daniel Thompson', avatar: require('../../../assets/TasksAva.png') },
    { id: 4, name: 'Henry Cooper', avatar: require('../../../assets/TasksAva.png') },
  ];

  const closeWorkerModal = () => {
    bottomSheetRef.current?.close();
    setTimeout(() => setSelectedWorker(null), 300);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <GlassBackButton backgroundColor={'rgb(253 253 253)'} tint={"light"} borderColor="#FFFFFF50" onPress={() => navigation.goBack()} iconSource={require('../../../assets/Arrow-left.png')} />
        <Text style={styles.projectName}>{project.name}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image style={styles.backIcon} source={require('../../../assets/Search.png')} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setModal('Tasks')}
          style={[
            styles.tabButton,
            modal === 'Tasks' && styles.activeTab,
          ]}
        >
          <Text style={styles.tabText}>Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setModal('Documents')}
          style={[
            styles.tabButton,
            modal === 'Documents' && styles.activeTab,
          ]}
        >
          <Text style={styles.tabText}>Documents</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setModal('Workers')}
          style={[
            styles.tabButton,
            modal === 'Workers' && styles.activeTab,
          ]}
        >
          <Text style={styles.tabText}>Workers</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {modal === 'Tasks' && (
          <TouchableOpacity style={styles.taskItem}>
            <Text style={styles.taskTitle}>Install electrical wiring - Floor 2</Text>
            <Text style={styles.taskDescription}>
              Complete electrical installation for second floor including outlets, switches, and lighting...
            </Text>
            <View style={styles.taskFooter}>
              <View style={styles.taskAssignee}>
                <Image style={styles.assigneeAvatar} source={require('../../../assets/TasksAva.png')} />
                <Text style={styles.assigneeName}>Alex Gerhard</Text>
              </View>
              <View style={styles.taskDate}>
                <Image style={styles.dateIcon} source={require('../../../assets/TasksCalendar.png')} />
                <Text style={styles.dateText}>Aug 1 20:00</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {modal === 'Documents' && (
          <TouchableOpacity style={styles.documentItem}>
            <Image style={styles.documentImage} source={require('../../../assets/Document.png')} />
            <View style={styles.documentInfo}>
              <Text style={styles.documentName}>Building Floor Plan - Level 1</Text>
              <Text style={styles.documentMeta}>2.5 MB   01.15.2025</Text>
            </View>
          </TouchableOpacity>
        )}

        {modal === 'Workers' && (
          <>
            {workers.map((worker) => (
              <TouchableOpacity
                key={worker.id}
                style={styles.workerItem}
                onPress={() => openWorkerModal(worker)}
              >
                <Image style={styles.workerAvatar} source={worker.avatar} />
                <Text style={styles.workerName}>{worker.name}</Text>
                <Image style={styles.arrowIcon} source={require('../../../assets/Arrow-right.png')} />
              </TouchableOpacity>
            ))}
          </>
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
          {selectedWorker && (
            <>
              <Text style={styles.workerModalTitle}>{selectedWorker.name}</Text>

              <TouchableOpacity onPress={() => navigation.navigate('ShiftHistory')} style={styles.modalOption}>
                <Text style={styles.optionText}>Shift history</Text>
                <Image style={styles.optionArrow} source={require('../../../assets/Arrow-right.png')} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('SingleChat')} style={styles.modalOption}>
                <Text style={styles.optionText}>Personal chat</Text>
                <Image style={styles.optionArrow} source={require('../../../assets/Arrow-right.png')} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('GroupChat')} style={[styles.modalOption, styles.addGroupChat]}>
                <Text style={[styles.optionText, styles.addGroupChatText]}>Add to group chat</Text>
                <Image style={styles.optionArrow} source={require('../../../assets/Arrow-right.png')} />
              </TouchableOpacity>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>

      <BottomBar
        onLeftPress={() => navigation.navigate('Home')}
        onRightPress={() => navigation.navigate('Menu')}
        onAddPress={() => navigation.navigate('CreateProject')}
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
    paddingBottom: 48,
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
  backIcon: {
    width: 20,
    height: 20,
  },
  projectName: {
    color: '#052D50',
  },
  tabContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  tabButton: {
    padding: 4,
    flex: 1,
    paddingLeft: 8,
    paddingRight: 8,
    backgroundColor: '#ffffff',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.0625,
    shadowRadius: 10,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTab: {
    borderColor: '#0785F4',
  },
  tabText: {
    color: '#052D50',
    width: '100%',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 96,
    width: '100%',
  },
  taskItem: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    gap: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.0625,
    shadowRadius: 10,
    elevation: 1,
    marginBottom: 16,
  },
  taskTitle: {
    color: '#052D50',
    fontSize: 22,
  },
  taskDescription: {
    color: '#052D5050',
  },
  taskFooter: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskAssignee: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  assigneeAvatar: {
    width: 30,
    height: 30,
  },
  assigneeName: {
    color: '#052D50',
  },
  taskDate: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    padding: 4,
    paddingLeft: 12,
    paddingRight: 12,
    backgroundColor: '#0177DE0D',
    borderRadius: 999,
  },
  dateIcon: {
    width: 14,
    height: 14,
  },
  dateText: {
    color: '#0785F4',
  },
  documentItem: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    gap: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.0625,
    shadowRadius: 10,
    elevation: 1,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  documentInfo: {},
  documentName: {
    color: '#052D50',
  },
  documentMeta: {
    color: '#052D5050',
  },
  workerItem: {
    width: '100%',
    padding: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.0625,
    shadowRadius: 10,
    elevation: 1,
    gap: 16,
    marginBottom: 12,
  },
  workerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 9999,
  },
  workerName: {
    flex: 1,
  },
  arrowIcon: {
    width: 16,
    height: 26,
    marginRight: 12,
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
    position: 'relative'
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
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#052D50',
  },
  optionArrow: {
    width: 10,
    height: 20,
    tintColor: '#052D50',
  },
  addGroupChat: {
    backgroundColor: '#FFF',
    borderColor: '#0091FF',
    borderWidth: 1,
  },
  addGroupChatText: {
    color: '#0091FF',
    fontWeight: '600',
  },
});

