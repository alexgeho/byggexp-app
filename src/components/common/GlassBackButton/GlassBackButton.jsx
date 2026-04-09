import React from 'react';
import { TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { GlassView } from '../GlassView/GlassView';

export const GlassBackButton = ({ onPress, iconSource, style, iconStyle, borderColor, tint, backgroundColor }) => {
  if (Platform.OS === 'web') {
    return (
      <GlassView backgroundColor={backgroundColor} tint={tint} borderColor={borderColor} style={[styles.backButton, style]} onPress={onPress}>
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
        intensity={60}
        tint="light"
      >
        <Image style={[styles.backIcon, iconStyle]} source={iconSource} />
      </GlassView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
});
