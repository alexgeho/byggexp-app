import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { ScrollView } from 'react-native';
import { MenuButton } from '../../components/common/MenuButton/MenuButton';
import AuthContext from '../../contexts/AuthContext';
import { BottomBar } from '../../components/BottomBar';
import { GlassBackButton } from '../../components/common/GlassBackButton/GlassBackButton';

export default function MenuScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, logout } = useContext(AuthContext);

  const menuItems = useMemo(() => {
    const baseItems = [
      { id: 'account', screen: 'MyAccount', title: 'My account', icon: require('../../assets/Account.png'), color: '#9C27B0' },
      { id: 'notifications', title: 'Notifications', icon: require('../../assets/Notifications.png'), color: '#FFEB3B' },
    ];
    
    // CompanyAdmin: полный доступ
    if (user?.role === 'companyAdmin') {
      return [
        ...baseItems,
        { id: 'tasks', screen: 'Tasks', title: 'Tasks', icon: require('../../assets/Tasks.png'), color: '#00C853' },
        { id: 'shifts', screen: 'History', title: 'Shifts', icon: require('../../assets/WorkShifts.png'), color: '#F44336' },
        { id: 'company', title: 'Company', icon: require('../../assets/About.png'), color: '#009688' },
        { id: 'users', title: 'Users', icon: require('../../assets/Tasks.png'), color: '#2196F3' },
        { id: 'projects', title: 'Projects', icon: require('../../assets/Projekts.png'), color: '#FF9800' },
        { id: 'finance', title: 'Finance', icon: require('../../assets/Tracker.png'), color: '#4CAF50' },
      ];
    }
    
    // ProjectAdmin: управление проектами
    if (user?.role === 'projectAdmin') {
      return [
        ...baseItems,
        { id: 'tasks', screen: 'Tasks', title: 'Tasks', icon: require('../../assets/Tasks.png'), color: '#00C853' },
        { id: 'shifts', screen: 'History', title: 'Shifts', icon: require('../../assets/WorkShifts.png'), color: '#F44336' },
        { id: 'projects', title: 'Projects', icon: require('../../assets/Projekts.png'), color: '#FF9800' },
        { id: 'team', title: 'My Team', icon: require('../../assets/Tasks.png'), color: '#2196F3' },
        { id: 'reports', title: 'Reports', icon: require('../../assets/Documents.png'), color: '#795548' },
      ];
    }
    
    // Worker: базовое меню
    return [
      ...baseItems,
      { id: 'tasks', screen: 'Tasks', title: 'Tasks', icon: require('../../assets/Tasks.png'), color: '#00C853' },
      { id: 'documents', title: 'Documents', icon: require('../../assets/Documents.png'), color: '#2196F3' },
      { id: 'workShifts', screen: 'History', title: 'Work shifts', icon: require('../../assets/WorkShifts.png'), color: '#F44336' },
    ];
  }, [user?.role]);

  const settingsItems = [
    { id: 'legal', title: 'Legal & Policies', icon: require('../../assets/Legal.png'), color: '#009688' },
    { id: 'help', title: 'Help & Support', icon: require('../../assets/Help.png'), color: '#00BCD4' },
    { id: 'about', title: 'About the App', icon: require('../../assets/About.png'), color: '#795548' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <GlassBackButton backgroundColor={'rgb(253 253 253)'} tint={"light"} borderColor="#FFFFFF50" onPress={() => navigation.goBack()} iconSource={require('../../assets/Arrow-left.png')} />
        <Text style={[styles.headerTitle, { fontFamily: theme.text.fontFamily['semiBold'] }]}>Menu</Text>
        <View style={styles.placeholder} />
      </View>

      {user && (
        <View style={styles.userInfoContainer}>
          <Image style={styles.userAvatar} source={require('../../assets/Avatar.png')} />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { fontFamily: theme.text.fontFamily['bold'] }]}>{user.name || 'User'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user.role === 'companyAdmin' ? 'Company Admin' : 
                 user.role === 'projectAdmin' ? 'Project Admin' : 
                 user.role === 'worker' ? 'Worker' : 'User'}
              </Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView style={{paddingBottom: 96}}>
        <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Main</Text>
            {menuItems.map((item) => (
              <MenuButton id={item.id} screen={item.screen ? item.screen : 'Menu'} title={item.title} color={item.color} icon={item.icon} />
            ))}
        </View>

        <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Settings</Text>
            {settingsItems.map((item) => (
              <MenuButton id={item.id} screen={item.screen ? item.screen : 'Menu'} title={item.title} color={item.color} icon={item.icon} />
            ))}
        </View>
      </ScrollView>
        <BottomBar
          onLeftPress={() => navigation.navigate('Home')}
          onRightPress={() => navigation.navigate('Menu')}
          onAddPress={logout}
          renderAddContent={() => <Text style={styles.logoutButtonText}>Log out</Text>}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF5FB',
    padding: 16,
    paddingTop: 48,
    paddingBottom: 48,
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
    fontSize: 17,
    textAlign: 'center',
  },
  placeholder: {
    width: 36,
  },
  sectionTitle: {
    color: '#698196',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  menuSection: {
    marginBottom: 24,
  },
  settingsSection: {
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    width: 16,
    height: 16,
    tintColor: '#ffffff',
  },
  menuTitle: {
    flex: 1,
    marginLeft: 12,
    color: '#052D50',
    fontSize: 16,
  },
  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: '#698196',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.0625,
    shadowRadius: 10,
    elevation: 2,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 18,
    color: '#052D50',
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: '#2582D91A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    color: '#2582D9',
    fontWeight: '500',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});