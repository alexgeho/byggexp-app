import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/theme/ThemeContext';
import NotificationBootstrap from './src/components/NotificationBootstrap';

const defaultTextStyle = { fontFamily: 'DMSans-Regular' };

const mergeDefaultStyle = (currentStyle) => {
  if (Array.isArray(currentStyle)) {
    const hasFontFamily = currentStyle.some((style) => style?.fontFamily);
    return hasFontFamily ? currentStyle : [defaultTextStyle, ...currentStyle];
  }

  if (currentStyle?.fontFamily) {
    return currentStyle;
  }

  return currentStyle ? [defaultTextStyle, currentStyle] : defaultTextStyle;
};

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = mergeDefaultStyle(Text.defaultProps.style);

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = mergeDefaultStyle(TextInput.defaultProps.style);

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'DMSans-Regular': require('./src/assets/fonts/DMSans-Regular.ttf'),
          'DMSans-Bold': require('./src/assets/fonts/DMSans-Bold.ttf'),
          'DMSans-Medium': require('./src/assets/fonts/DMSans-Medium.ttf'),
          'DMSans-SemiBold': require('./src/assets/fonts/DMSans-Medium.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsLoaded(true); 
      }
    }

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <AuthProvider>
          <SafeAreaProvider>
            <NotificationBootstrap />
            <AppNavigator />
          </SafeAreaProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});