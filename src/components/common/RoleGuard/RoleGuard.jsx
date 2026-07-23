import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AuthContext from '../../contexts/AuthContext';

export const RoleGuard = ({ allowedRoles = [], children, fallback = null }) => {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();

  if (!user) {
    return fallback || <AccessDenied />;
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback || <AccessDenied />;
  }

  return children;
};

export const AccessDenied = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/Close.png')} 
        style={styles.icon}
      />
      <Text style={styles.title}>Доступ запрещён</Text>
      <Text style={styles.message}>
        У вас нет прав для просмотра этой страницы
      </Text>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Вернуться назад</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#EEEEEE',
  },
  icon: {
    width: 64,
    height: 64,
    marginBottom: 24,
    tintColor: '#052D50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#052D50',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#698196',
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#0091FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RoleGuard;
