import React from 'react';
import { TouchableOpacity, Image, StyleSheet, Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from '../GlassView/GlassView';

export const GlassBackButton = ({ onPress, iconSource, style, iconStyle, borderColor, tint, backgroundColor }) => {
  if (Platform.OS === 'web') {
    return (
      <GlassView backgroundColor={backgroundColor} tint={tint} borderColor={borderColor} style={[styles.backButton, style]} onPress={onPress}>
        <LinearGradient
          colors={['rgba(255,255,255,0.88)', 'rgba(255,255,255,0.22)']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.baseGradient}
        />
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0)']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 0.7 }}
          style={styles.highlight}
        />
        <View style={styles.hardLightGlow} />
        <Image style={[styles.backIcon, iconStyle]} source={iconSource} />
      </GlassView>
    );
  }

  // Для iOS/Android оборачиваем в TouchableOpacity
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <GlassView
        backgroundColor={backgroundColor}
        borderColor={borderColor}
        style={[styles.backButton, style]}
        intensity={85}
        tint="light"
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.88)', 'rgba(255,255,255,0.22)']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.baseGradient}
        />
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0)']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 0.7 }}
          style={styles.highlight}
        />
        <View style={styles.hardLightGlow} />
        <Image style={[styles.backIcon, iconStyle]} source={iconSource} />
      </GlassView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(238, 245, 251, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    shadowColor: '#052D50',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  baseGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },
  highlight: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    height: 18,
    borderRadius: 21,
  },
  hardLightGlow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 20,
    backgroundColor: 'rgba(5, 45, 80, 0.04)',
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#052D50',
  },
});
