import React from 'react';
import { Image, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView as NativeGlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { GlassView } from './common/GlassView/GlassView';

const DEFAULT_LEFT_ICON = require('../assets/HomeGray.png');
const DEFAULT_RIGHT_ICON = require('../assets/MenuGray.png');
const DEFAULT_ADD_ICON = require('../assets/Plus.png');
const supportsNativeGlass = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

export const BottomBar = ({
  onLeftPress,
  onRightPress,
  onAddPress,
  leftIcon = DEFAULT_LEFT_ICON,
  rightIcon = DEFAULT_RIGHT_ICON,
  addIcon = DEFAULT_ADD_ICON,
  showAddButton = true,
  renderAddContent,
  addDisabled = false,
  containerStyle,
  navButtonsStyle,
  addButtonStyle,
}) => {
  const navBarContent = (
    <>
      <TouchableOpacity onPress={onLeftPress} style={styles.navButton}>
        <Image style={styles.navIcon} source={leftIcon} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onRightPress} style={styles.navButton}>
        <Image style={styles.navIcon} source={rightIcon} />
      </TouchableOpacity>
    </>
  );

  return (
    <View style={[styles.bottomBar, containerStyle]}>
      {supportsNativeGlass ? (
        <NativeGlassView
          style={[styles.navButtons, navButtonsStyle]}
          glassEffectStyle="regular"
          colorScheme="light"
          tintColor="rgba(255,255,255,0.18)"
        >
          <Svg pointerEvents="none" width="100%" height="100%" style={styles.navButtonsRadialOverlay}>
            <Defs>
              <RadialGradient id="leftGlow" cx="29.59%" cy="47.26%" rx="42.43%" ry="126.71%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
                <Stop offset="54%" stopColor="#EEF5FB" stopOpacity="0.56" />
                <Stop offset="100%" stopColor="#EEF5FB" stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="rightGlow" cx="71.33%" cy="46.58%" rx="40.37%" ry="120.55%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
                <Stop offset="54%" stopColor="#EEF5FB" stopOpacity="0.56" />
                <Stop offset="100%" stopColor="#EEF5FB" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#leftGlow)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#rightGlow)" />
          </Svg>
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0.88)', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 0.95 }}
            style={styles.nativeNavButtonsHighlight}
          />
          <View style={styles.nativeNavButtonsSoftFill} pointerEvents="none" />
          <View style={styles.nativeNavButtonsInnerRing} pointerEvents="none" />
          {navBarContent}
        </NativeGlassView>
      ) : (
        <GlassView
          style={[styles.navButtons, navButtonsStyle]}
          backgroundColor='rgba(5, 45, 80, 0.04)'
          borderColor='rgba(255, 255, 255, 0.6)'
          intensity={95}
          tint="light"
        >
          <Svg pointerEvents="none" width="100%" height="100%" style={styles.navButtonsRadialOverlay}>
            <Defs>
              <RadialGradient id="fallbackLeftGlow" cx="29.59%" cy="47.26%" rx="42.43%" ry="126.71%">
                <Stop offset="0%" stopColor="#EEF5FB" stopOpacity="0.95" />
                <Stop offset="100%" stopColor="#EEF5FB" stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="fallbackRightGlow" cx="71.33%" cy="46.58%" rx="40.37%" ry="120.55%">
                <Stop offset="0%" stopColor="#EEF5FB" stopOpacity="0.95" />
                <Stop offset="100%" stopColor="#EEF5FB" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#fallbackLeftGlow)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#fallbackRightGlow)" />
          </Svg>
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0.84)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.08)']}
            start={{ x: 0.08, y: 0 }}
            end={{ x: 0.92, y: 1 }}
            style={styles.navButtonsGradient}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0.96)', 'rgba(255,255,255,0.24)', 'rgba(255,255,255,0)']}
            start={{ x: 0.18, y: 0 }}
            end={{ x: 0.82, y: 0.9 }}
            style={styles.navButtonsHighlight}
          />
          <View style={styles.navButtonsInnerRing} pointerEvents="none" />
          {navBarContent}
        </GlassView>
      )}
      {showAddButton && (
        <TouchableOpacity onPress={onAddPress} style={[styles.addProjectButton, addButtonStyle]} disabled={addDisabled}>
          {renderAddContent ? renderAddContent() : (
            <Image style={styles.addIcon} source={addIcon} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    width: '100%',
    padding: 20,
    position: 'absolute',
    bottom: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  navButtons: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    shadowColor: '#D9E7F5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 6,
    overflow: 'hidden',
  },
  navButtonsGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
  },
  navButtonsRadialOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  navButtonsHighlight: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    height: 28,
    borderRadius: 29,
  },
  navButtonsInnerRing: {
    position: 'absolute',
    top: 1.5,
    left: 1.5,
    right: 1.5,
    bottom: 1.5,
    borderRadius: 26.5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  nativeNavButtonsInnerRing: {
    position: 'absolute',
    top: 0.5,
    left: 0.5,
    right: 0.5,
    bottom: 0.5,
    borderRadius: 29.5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
  },
  nativeNavButtonsSoftFill: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  nativeNavButtonsHighlight: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    height: 30,
    borderRadius: 29,
  },
  navButton: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    width: 24,
    height: 24,
  },
  addProjectButton: {
    width: 80,
    height: 80,
    backgroundColor: '#0091FF',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 4,
    boxShadow: '0px 2px 7px 0px rgba(0, 0, 0, 0.25)',
  },
  addIcon: {
    width: 24,
    height: 24,
  },
});
