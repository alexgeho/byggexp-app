import { useNavigation } from '@react-navigation/native';
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import AuthContext from '../../../contexts/AuthContext';
import { projectService } from '../../../services';
import { BottomBar } from '../../../components/BottomBar';
import { GlassBackButton } from '../../../components/common/GlassBackButton/GlassBackButton';

export default function ProjectsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { userId, isLoading: authLoading, user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canManageProjects = ['companyAdmin', 'projectAdmin'].includes(user?.role);

useEffect(() => {
    if (!authLoading && userId) {
      const fetchProjects = async () => {
        try {
          setLoading(true);
          const data = await projectService.getMyProjects();
          
          // CompanyAdmin видит все проекты компании
          // ProjectAdmin и Worker видят только свои проекты
          let userProjects = data;
          if (user?.role === 'worker' || user?.role === 'projectAdmin') {
            userProjects = data.filter(project =>
              project.workers && project.workers.includes(userId)
            );
          }
          
          setProjects(userProjects);
        } catch (err) {
          console.error('Ошибка при получении проектов:', err);
          setError('Не удалось загрузить проекты. Пожалуйста, повторите попытку.');
          Alert.alert('Ошибка', 'Не удалось загрузить проекты. Пожалуйста, повторите попытку.');
        } finally {
          setLoading(false);
        }
      };

      fetchProjects();
    } else if (!authLoading && !userId) {
      setError('Пользователь не авторизован.');
    }
  }, [userId, authLoading, user?.role]);

  if (authLoading || loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Загрузка...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <GlassBackButton backgroundColor={'rgb(253 253 253)'} tint={"light"} borderColor="#FFFFFF50" onPress={() => navigation.goBack()} iconSource={require('../../../assets/Arrow-left.png')} />
        <Text style={[styles.headerTitle, { fontFamily: theme.text.fontFamily['bold'] }]}>My projects</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search.."
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollContainer}
      >
        {projects.length === 0 ? (
          <Text style={styles.noProjectsText}>У вас пока нет проектов.</Text>
        ) : (
          projects.map(project => (
            <TouchableOpacity key={project._id} onPress={() => navigation.navigate('Project', { id: project._id })} style={styles.projectCard}>
              <View style={styles.cardHeader}>
                <Text style={[styles.projectName, { fontFamily: theme.text.fontFamily['bold'] }]}>{project.name}</Text>
                <Text style={styles.statusBadge}>{project.status}</Text>
              </View>
              <Text style={styles.dateText}>Начало: {new Date(project.beginningDate).toLocaleDateString()}</Text>
              <Text style={styles.locationText}>Местоположение: {project.location}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate('Home')}
        onRightPress={() => navigation.navigate('Menu')}
        onAddPress={() => navigation.navigate('CreateProject')}
        showAddButton={canManageProjects}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingTop: 48,
    paddingBottom: 48,
    gap: 12,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
   backButton: {
    padding: 16,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#052D50',
  },
  headerTitle: {
    color: '#052D50',
    fontSize: 18,
    textAlign: 'center',
  },
  placeholder: {
    width: 36,
  },
  searchContainer: {
    width: '100%',
  },
  searchInput: {
    width: '100%',
    height: 64,
    backgroundColor: '#052D500D',
    borderRadius: 20,
    padding: 16,
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    gap: 12,
    paddingBottom: 96,
  },
  projectCard: {
    backgroundColor: '#ffffff',
    width: '100%',
    padding: 20,
    borderRadius: 16,
    gap: 8,
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectName: {
    color: '#052D50',
  },
  statusBadge: {
    color: '#2582D9',
    backgroundColor: '#2582D91A',
    padding: 4,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 12,
  },
  dateText: {
    color: '#0785F4',
  },
  locationText: {
    color: '#698196',
  },
  noProjectsText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#698196',
    fontSize: 16,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'red',
    fontSize: 16,
  },
});

