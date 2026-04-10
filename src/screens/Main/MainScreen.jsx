import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import ProjectSelector from '../../components/common/ProjectSelector/ProjectSelector';
import AuthContext from '../../contexts/AuthContext';
import { useTimer } from '../../hooks/useTimer';
import { GlassView } from '../../components/common/GlassView/GlassView';

export default function MainScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { formattedTime, isRunning, isPaused, progress: timerProgress, start, pause, reset } = useTimer();

  const [selectedProject, setSelectedProject] = useState(null);

  const handlePlayPause = () => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  const handleNav = (screen) => {
    navigation.navigate(screen);
  };

  const BackgroundComponent = Platform.OS === 'web' ? View : LinearGradient;

  return (
    <BackgroundComponent
      colors={['#00203A', '#000509']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
      {...(Platform.OS === 'web' && {
        style: [styles.container, {
          backgroundImage: 'linear-gradient(180deg, #00203A 0%, #000509 40%)',
        }]
      })}
    >
      <View style={styles.selectProjectContainer}>
        <ProjectSelector
          value={selectedProject}
          onChange={(project) => {
            setSelectedProject(project);
            reset();
          }}
          projects={[]}
          onPress={() => navigation.navigate('Projects')}
        />

        <View style={styles.timerRow}>
          <Text style={[styles.timerNumber, { fontFamily: theme.text.fontFamily['regular'] }]}>{formattedTime.hours}</Text>
          <Text style={[styles.timerNumber, { fontFamily: theme.text.fontFamily['regular'] }]}>:</Text>
          <Text style={[styles.timerNumber, { fontFamily: theme.text.fontFamily['regular'] }]}>{formattedTime.minutes}</Text>
          <Text style={[styles.timerNumber, { fontFamily: theme.text.fontFamily['regular'] }]}>:</Text>
          <Text style={[styles.timerSubNumber, { fontFamily: theme.text.fontFamily['regular'] }]}>{formattedTime.seconds}</Text>
        </View>

        <View style={styles.dotsRow}>
          {Array.from({ length: 10 }).map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index < timerProgress && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.playButtonContainer}>
          <TouchableOpacity
            style={[styles.playButton, isPaused && styles.playButtonPaused]}
            onPress={handlePlayPause}
          >
            <Image
              style={[styles.playIcon, { tintColor: '#ffffff' }]}
              source={isRunning ? require('../../assets/main/Pause.png') : require('../../assets/main/Play.png')}
            />
          </TouchableOpacity>
        </View>

        {user?.role === 'worker' && (
          <TouchableOpacity
            style={styles.timeReportButton}
            onPress={() => navigation.navigate('ShiftHistory', { type: 'report' })}
          >
            <Image style={styles.timeReportIcon} source={require('../../assets/WorkShifts.png')} />
            <Text style={styles.timeReportText}>Mark time</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.navButtonContainer}>
        <GlassView style={styles.button} intensity={60} tint="dark">
          <TouchableOpacity onPress={() => handleNav('Camera')} style={styles.buttonInner}>
            <Image style={styles.buttonIcon} source={require('../../assets/Camera.png')} />
            <Text style={[styles.text, { fontFamily: theme.text.fontFamily['regular'] }]}>Camera</Text>
          </TouchableOpacity>
        </GlassView>
        <GlassView style={styles.button} intensity={60} tint="dark">
          <TouchableOpacity onPress={() => handleNav('Chats')} style={styles.buttonInner}>
            <Image style={styles.buttonIcon} source={require('../../assets/messager.png')} />
            <Text style={[styles.text, { fontFamily: theme.text.fontFamily['regular'] }]}>Chats</Text>
          </TouchableOpacity>
        </GlassView>
        <GlassView style={styles.button} intensity={60} tint="dark">
          <TouchableOpacity onPress={() => handleNav('History')} style={styles.buttonInner}>
            <Image style={styles.buttonIcon} source={require('../../assets/history.png')} />
            <Text style={[styles.text, { fontFamily: theme.text.fontFamily['regular'] }]}>History</Text>
          </TouchableOpacity>
        </GlassView>
        <GlassView style={styles.button} intensity={60} tint="dark">
          <TouchableOpacity onPress={() => handleNav('Projects')} style={styles.buttonInner}>
            <Image style={styles.buttonIcon} source={require('../../assets/projects.png')} />
            <Text style={[styles.text, { fontFamily: theme.text.fontFamily['regular'] }]}>Projects</Text>
          </TouchableOpacity>
        </GlassView>
      </View>

      <View style={styles.bottomNavContainer}>
        <TouchableOpacity style={styles.bottomNavItem}>
          <Image style={styles.bottomIcon} source={require('../../assets/Home.png')} />
          <Text style={styles.bottomText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNav('Menu')} style={styles.bottomNavItem}>
          <Image style={styles.bottomIcon} source={require('../../assets/Menu.png')} />
          <Text style={styles.bottomText}>Menu</Text>
        </TouchableOpacity>
      </View>
    </BackgroundComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    paddingTop: 32,
    justifyContent: 'space-between',
  },
  selectProjectContainer: {
    padding: 46,
    zIndex: 1000,
    position: 'relative',
  },
  timerRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    elevation: 3,
  },
  timerNumber: {
    color: '#ffffff',
    fontSize: 48,
  },
  timerSubNumber: {
    color: '#ffffff40',
    fontSize: 48,
  },
  dotsRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    elevation: 3,
  },
  dot: {
    width: '6%',
    height: 42,
    backgroundColor: '#0A1724',
    borderWidth: 1,
    borderColor: '#ffffff20',
    borderRadius: 50,
  },
  dotActive: {
    backgroundColor: '#0088FF',
    borderColor: '#0088FF',
  },
  playButtonContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  playButton: {
    width: 100,
    height: 100,
    backgroundColor: '#0088FF',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#ffffff60',
    shadowColor: '#0088FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.605,
    shadowRadius: 80,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonPaused: {
    opacity: 0.7,
  },
  playIcon: {
    width: 32,
    height: 32,
  },
  navButtonContainer: {
    flexWrap: 'wrap',
    padding: 16,
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonInner: {
    flexDirection: 'column',
    padding: 16,
    gap: 28,
    alignItems: 'center',
  },
  buttonIcon: {
    width: 26,
    height: 26,
  },
  text: {
    color: '#ffffff',
  },
  bottomNavContainer: {
    flexDirection: 'row',
    gap: 72,
    justifyContent: 'center',
    paddingBottom: 32,
  },
  bottomNavItem: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
  },
  bottomIcon: {
    width: 28,
    height: 28,
  },
  bottomText: {
    color: '#ffffff',
    fontSize: 12,
  },
  timeReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0091FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  timeReportIcon: {
    width: 20,
    height: 20,
    tintColor: '#ffffff',
  },
  timeReportText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});