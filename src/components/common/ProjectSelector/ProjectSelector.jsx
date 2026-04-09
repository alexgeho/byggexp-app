import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, FlatList, Animated, Modal, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../theme/ThemeContext';
import { GlassView } from '../GlassView/GlassView';

const GlassViewWrapper = ({ children, style }) => {
  return (
    <GlassView style={style} intensity={60} tint="dark">
      {children}
    </GlassView>
  );
};

export default function ProjectSelector({ value, onChange, projects = [], onCreateProject }) {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [buttonLayout, setButtonLayout] = useState(null);
  const buttonRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = () => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsVisible(false);
        setSearchQuery('');
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.95);
      });
    } else {
      buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
        setButtonLayout({ x: pageX, y: pageY, width, height });
        setIsVisible(true);
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              tension: 300,
              friction: 10,
              useNativeDriver: true,
            }),
          ]).start();
        }, 10);
      });
    }
  };

  const handleSelect = (project) => {
    onChange(project);
    setIsVisible(false);
    setSearchQuery('');
  };

  const handleCreate = () => {
    if (onCreateProject && searchQuery.trim()) {
      onCreateProject(searchQuery.trim());
      setIsVisible(false);
      setSearchQuery('');
    }
  };

  const getKey = (item) => item._id || item.id?.toString();

  return (
    <View style={styles.container} collapsable={false}>
      <GlassViewWrapper style={styles.glassContainer}>
        <TouchableOpacity
          ref={buttonRef}
          style={styles.glassInput}
          onPress={handleToggle}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['rgba(0,32,58,0.05)', 'rgba(0,32,58,0.01)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradient}
          />
          <Text style={styles.text}>
            {value ? value.name : 'Select or create project'}
          </Text>
          <Animated.Text style={[styles.arrow, { transform: [{ rotate: isVisible ? '180deg' : '0deg' }] }]}>▼</Animated.Text>
        </TouchableOpacity>
      </GlassViewWrapper>

      {Platform.OS === 'web' ? (
        isVisible && buttonLayout && (
          <Animated.View
            style={[
              styles.dropdownContainerWeb,
              {
                top: buttonLayout.height + 8,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.dropdownBlurWeb}>
              <View style={styles.dropdownContent}>
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text || '#fff' }]}
                placeholder="Search or type new..."
                placeholderTextColor={theme.colors.textSecondary || '#aaa'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleCreate}
                autoFocus
                underlineColorAndroid="transparent"
                autoCorrect={false}
              />
              <FlatList
                data={filteredProjects}
                keyExtractor={getKey}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.projectItem}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={[styles.projectText, { color: '#fff' }]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary || '#aaa' }]}>
                    {searchQuery.trim() ? 'Type to create...' : 'No projects'}
                  </Text>
                }
                style={styles.list}
              />
              {searchQuery.trim() && (
                <TouchableOpacity
                  style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleCreate}
                >
                  <Text style={styles.createButtonText}>
                    Create "{searchQuery}"
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          </Animated.View>
        )
      ) : (
        <Modal
          visible={isVisible}
          transparent={true}
          statusBarTranslucent={true}
          onRequestClose={() => {
            setIsVisible(false);
            setSearchQuery('');
          }}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => {
              setIsVisible(false);
              setSearchQuery('');
            }}
          >
            {buttonLayout && (
              <Animated.View
                style={[
                  styles.dropdownContainer,
                  {
                    top: buttonLayout.height + 8,
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <GlassViewWrapper style={styles.dropdownBlur}>
                  <View style={styles.dropdownContent}>
                    <TextInput
                      style={[styles.searchInput, { color: theme.colors.text || '#fff' }]}
                      placeholder="Search or type new..."
                      placeholderTextColor={theme.colors.textSecondary || '#aaa'}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      onSubmitEditing={handleCreate}
                      autoFocus
                      underlineColorAndroid="transparent"
                      autoCorrect={false}
                    />
                    <FlatList
                      data={filteredProjects}
                      keyExtractor={getKey}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.projectItem}
                          onPress={() => handleSelect(item)}
                        >
                          <Text style={[styles.projectText, { color: theme.colors.text || '#fff' }]}>
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      )}
                      ListEmptyComponent={
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary || '#aaa' }]}>
                          {searchQuery.trim() ? 'Type to create...' : 'No projects'}
                        </Text>
                      }
                      style={styles.list}
                    />
                    {searchQuery.trim() && (
                      <TouchableOpacity
                        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
                        onPress={handleCreate}
                      >
                        <Text style={styles.createButtonText}>
                          Create "{searchQuery}"
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </GlassViewWrapper>
              </Animated.View>
            )}
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 9999,
    elevation: 10,
  },
  glassContainer: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  glassInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderWidth: 1,
    borderColor: 'rgba(0,32,58, 0.3)',
    borderLeftColor: 'rgba(255, 255, 255, 0.5)',
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
  },
  text: {
    fontSize: 16,
    flex: 1,
    color: 'white',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  arrow: {
    fontSize: 14,
    color: 'white',
    marginLeft: 8,
    opacity: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  dropdownContainerWeb: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  dropdownBlurWeb: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 30, 30, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  dropdownBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  dropdownContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    maxHeight: 280,
  },
  list: {
    maxHeight: 200,
  },
  searchInput: {
    padding: 14,
    fontSize: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'transparent',
    color: '#fff',
  },
  projectItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  projectText: {
    fontSize: 15,
  },
  emptyText: {
    padding: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  createButton: {
    padding: 14,
    alignItems: 'center',
    margin: 8,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

