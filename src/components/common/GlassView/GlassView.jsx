import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

/**
 * Universal blur-effect component
 * - Web: CSS backdrop-filter
 * - iOS/Android: expo-blur
 *
 * On iOS/Android wrap GlassView in a TouchableOpacity if you need onPress
 */
export const GlassView = ({
  children,
  style,
  intensity = 50, // 0-100
  tint = 'default', // 'light', 'dark', 'default'
  borderColor = "#222",
  onPress,
  backgroundColor = "rgba(0, 0, 0, 0.5)",
  ...props
}) => {
  if (Platform.OS === 'web') {
    // On web use a View with onClick to support onPress
    const handleClick = onPress ? () => onPress() : undefined;

    return (
      <View
        style={[styles.glassWeb, style, { borderColor, backgroundColor }]}
        {...props}
        onStartShouldSetResponder={onPress ? () => true : undefined}
        onTouchEnd={handleClick}
        onClick={handleClick}
      >
        {children}
      </View>
    );
  }

  // iOS/Android - BlurView
  // Android does not support tint, use 'default'
  const blurTint = Platform.OS === 'android' ? 'default' : tint;

  return (
    <BlurView
      style={[styles.glassNative, style]}
      intensity={intensity}
      tint={blurTint}
      {...props}
    >
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  glassWeb: {
    borderWidth: 1,
    borderRadius: 16,
    borderTopColor: '#FFFFFF',
    cursor: 'pointer',
    // CSS backdrop-filter for web
    backdropFilter: 'brightness(1.1) blur(7px)',
    WebkitBackdropFilter: 'brightness(1.1) blur(5px)',
  },
  glassNative: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    overflow: 'hidden',
  },
});

/**
 * Hook for platform checks
 */
export const useLiquidGlass = () => {
  return {
    isWeb: Platform.OS === 'web',
    isNative: Platform.OS !== 'web',
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    platform: Platform.OS,
  };
};
