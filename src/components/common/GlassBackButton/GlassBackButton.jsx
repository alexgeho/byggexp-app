import React from 'react';
import { TouchableOpacity, Image, StyleSheet, Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView as NativeGlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { GlassView } from '../GlassView/GlassView';

const supportsNativeGlass = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

export const GlassBackButton = ({ onPress, iconSource, style, iconStyle, borderColor, tint, backgroundColor }) => {
  if (supportsNativeGlass) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <NativeGlassView
          style={[styles.backButton, style]}
          glassEffectStyle="clear"
          colorScheme="light"
          tintColor="rgba(255,255,255,0.22)"
          isInteractive
        >
          <Svg pointerEvents="none" width="100%" height="100%" style={styles.radialOverlay}>
            <Defs>
              <RadialGradient id="backButtonGlow" cx="32%" cy="28%" rx="68%" ry="68%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <Stop offset="65%" stopColor="#F7FBFF" stopOpacity="0.38" />
                <Stop offset="100%" stopColor="#F7FBFF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#backButtonGlow)" />
          </Svg>
          <View style={styles.nativeInnerRing} pointerEvents="none" />
          <View style={styles.nativeSoftFill} pointerEvents="none" />
          <Image style={[styles.backIcon, iconStyle]} source={iconSource} />
        </NativeGlassView>
      </TouchableOpacity>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <GlassView backgroundColor={backgroundColor} tint={tint} borderColor={borderColor} style={[styles.backButton, style]} onPress={onPress}>
        <LinearGradient
          colors={['rgba(255,255,255,0.78)', 'rgba(255,255,255,0.16)']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.baseGradient}
        />
        <LinearGradient
          colors={['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 0.85 }}
          style={styles.highlight}
        />
        <View style={styles.innerRing} pointerEvents="none" />
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
        intensity={95}
        tint="light"
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.78)', 'rgba(255,255,255,0.16)']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.baseGradient}
        />
        <LinearGradient
          colors={['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 0.85 }}
          style={styles.highlight}
        />
        <View style={styles.innerRing} pointerEvents="none" />
        <View style={styles.hardLightGlow} />
        <Image style={[styles.backIcon, iconStyle]} source={iconSource} />
      </GlassView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    shadowColor: '#CFE0F2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 6,
  },
  baseGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  highlight: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    height: 20,
    borderRadius: 23,
  },
  innerRing: {
    position: 'absolute',
    top: 1.5,
    left: 1.5,
    right: 1.5,
    bottom: 1.5,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.36)',
  },
  nativeInnerRing: {
    position: 'absolute',
    top: 0.5,
    left: 0.5,
    right: 0.5,
    bottom: 0.5,
    borderRadius: 24.5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.44)',
  },
  nativeSoftFill: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  radialOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  hardLightGlow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 22,
    backgroundColor: 'rgba(5, 45, 80, 0.04)',
  },
  backIcon: {
    width: 22,
    height: 22,
    tintColor: '#20384D',
  },
});
