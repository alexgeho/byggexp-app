import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Font from "expo-font";
import { Oswald_500Medium } from "@expo-google-fonts/oswald";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/contexts/AuthContext";
import { FeedbackProvider } from "./src/contexts/FeedbackContext";
import { ThemeProvider } from "./src/theme/ThemeContext";
import NotificationBootstrap from "./src/components/NotificationBootstrap";
import ShiftLocationMonitor from "./src/components/ShiftLocationMonitor";
import LocationConsentBootstrap from "./src/components/LocationConsentBootstrap";
import MagicLinkHandler from "./src/components/MagicLinkHandler";
import { WelcomeSlides } from "./src/components/common/WelcomeSlides/WelcomeSlides";
// Side-effect imports: register the background location tasks via
// TaskManager.defineTask at module load, before the OS can invoke them
// headless. iOS uses the native geofence task; Android uses the
// foreground-service location task.
import "./src/tasks/shiftGeofenceTask";
import "./src/tasks/shiftLocationUpdatesTask";
import ErrorBoundary from "./src/components/common/ErrorBoundary/ErrorBoundary";
import { initSentry } from "./src/utils/sentry";
import { loadStoredLanguage } from "./src/i18n";

// Start crash reporting as early as possible (no-op without a DSN).
initSentry();

const defaultTextStyle = { fontFamily: "DMSans-Regular" };

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
    async function bootstrap() {
      try {
        // The persisted-language read and the font load are independent — run
        // them together instead of serially so the first paint isn't gated on
        // an AsyncStorage round-trip followed by the font decode.
        await Promise.all([
          loadStoredLanguage(),
          Font.loadAsync({
            "DMSans-Regular": require("./src/assets/fonts/DMSans-Regular.ttf"),
            "DMSans-Bold": require("./src/assets/fonts/DMSans-Bold.ttf"),
            "DMSans-Medium": require("./src/assets/fonts/DMSans-Medium.ttf"),
            "DMSans-SemiBold": require("./src/assets/fonts/DMSans-Medium.ttf"),
            "Landasans-Medium": require("./src/assets/fonts/Landasans-Medium.otf"),
            Oswald_500Medium,
          }),
        ]);
      } catch (error) {
        console.error("Error during bootstrap (fonts/language):", error);
      } finally {
        setFontsLoaded(true);
      }
    }

    bootstrap();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <SafeAreaProvider>
              <StatusBar style="dark" />
              <FeedbackProvider>
                <NotificationBootstrap />
                <ShiftLocationMonitor />
                <LocationConsentBootstrap />
                <MagicLinkHandler />
                <AppNavigator />
                <WelcomeSlides />
              </FeedbackProvider>
            </SafeAreaProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
