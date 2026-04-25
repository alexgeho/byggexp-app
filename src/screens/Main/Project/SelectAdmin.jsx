import { useNavigation } from "@react-navigation/native";
import React, { useContext, useState } from 'react'
import { Image, Text, StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import AuthContext from '../../../contexts/AuthContext';
import { BottomBar } from '../../../components/BottomBar';
import { GlassBackButton } from '../../../components/common/GlassBackButton/GlassBackButton';

export const SelectAdmin = () => {

    const navigation = useNavigation();
    const { user } = useContext(AuthContext);
    const [isSelected, setSelection] = useState(false)

    // Проверка прав доступа - только для companyAdmin
    if (user?.role !== 'companyAdmin') {
        return (
        <View style={styles.container}>
            <View style={styles.header}>
            <GlassBackButton backgroundColor={'rgb(253 253 253)'} tint={"light"} borderColor="#FFFFFF50" onPress={() => navigation.goBack()} iconSource={require('../../../assets/Arrow-left.png')} />
            <Text style={styles.projectName}>Select an Admin</Text>
            <GlassBackButton backgroundColor={'rgb(253 253 253)'} tint={"light"} borderColor="#FFFFFF50" onPress={() => navigation.goBack()} iconSource={require('../../../assets/Search.png')} />
            </View>
            <View style={styles.accessDeniedContainer}>
            <Text style={styles.accessDeniedText}>Доступ запрещён</Text>
            <Text style={styles.accessDeniedSubtext}>Только владелец компании может назначать прорабов</Text>
            </View>
        </View>
        )
    }

  return <View style={styles.container}>
    <View style={styles.header}>
          <GlassBackButton backgroundColor={'rgb(253 253 253)'} tint={"light"} borderColor="#FFFFFF50" onPress={() => navigation.goBack()} iconSource={require('../../../assets/Arrow-left.png')} />
          <Text style={styles.projectName}>Select an Admin</Text>
          <GlassBackButton backgroundColor={'rgb(253 253 253)'} tint={"light"} borderColor="#FFFFFF50" onPress={() => navigation.goBack()} iconSource={require('../../../assets/Search.png')} />
        </View>


        <ScrollView style={{width: '100%', flex: 1}}>
          <View style={styles.workerItem}>
                  <Image style={styles.workerAvatar} source={require('../../../assets/TasksAva.png')} />
                  <Text style={styles.workerName}>Хуеглотус</Text>
                  <TouchableOpacity
                    onPress={() => setSelection(!isSelected)}
                    style={{
                      width: 22,
                      height: 22, 
                      borderWidth: 2,
                      borderColor: '#0088FF',
                      borderRadius: 4,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSelected ? '#0088FF' : 'transparent',
                      marginRight: 8
                    }}
                  >
                    {isSelected && <Text style={{color: '#ffffff'}}>✓</Text>}
                  </TouchableOpacity>
                </View>
        </ScrollView>

        <BottomBar
          onLeftPress={() => navigation.navigate('Home')}
          onRightPress={() => navigation.navigate('Menu')}
          onAddPress={() => navigation.navigate('CreateProject')}
        />
  </View>

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingTop: 48,
    paddingBottom: 48,
    gap: 24,
    backgroundColor: '#EEF5FB',
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
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: 'DMSans-SemiBold',
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
    marginBottom: 12
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
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#052D50',
    marginBottom: 12,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    color: '#698196',
    textAlign: 'center',
  },
});

