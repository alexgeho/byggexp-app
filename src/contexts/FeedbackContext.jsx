import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SuccessPopupIcon } from "../components/common/SuccessPopupIcon/SuccessPopupIcon";
import { useTheme } from "../theme/ThemeContext";

const FeedbackContext = createContext(null);

export function useFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }

  return context;
}

export function FeedbackProvider({ children }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [successPopup, setSuccessPopup] = useState(null);

  const hideSuccess = useCallback(() => {
    setSuccessPopup(null);
  }, []);

  const showSuccess = useCallback((options) => {
    if (!options?.message) {
      return;
    }

    setSuccessPopup({
      title: options.title || "Success",
      message: options.message,
      buttonLabel: options.buttonLabel || "OK",
    });
  }, []);

  const value = useMemo(
    () => ({
      showSuccess,
      hideSuccess,
    }),
    [hideSuccess, showSuccess],
  );

  const isDarkTheme = theme.colors.background === "#121212";
  const popupBackground = isDarkTheme
    ? "#1C1C1C"
    : "#FFFFFF";
  const popupBorder = isDarkTheme ? "rgba(255, 255, 255, 0.12)" : "#FFFFFF";
  const popupTextColor = isDarkTheme ? "#FFFFFF" : "#052D50";
  const popupSubtextColor = isDarkTheme
    ? "rgba(255, 255, 255, 0.72)"
    : "rgba(5, 45, 80, 0.65)";
  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <Modal
        animationType="fade"
        transparent={true}
        visible={Boolean(successPopup)}
        onRequestClose={hideSuccess}
      >
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={hideSuccess} />

          <View
            style={[
              styles.popupCard,
              {
                marginTop: insets.top + 24,
                backgroundColor: popupBackground,
                borderColor: popupBorder,
              },
            ]}
          >
            <SuccessPopupIcon />

            <Text
              style={[
                styles.title,
                {
                  color: popupTextColor,
                  fontFamily: theme.text.fontFamily.semiBold,
                },
              ]}
            >
              {successPopup?.title}
            </Text>

            <Text
              style={[
                styles.message,
                {
                  color: popupSubtextColor,
                  fontFamily: theme.text.fontFamily.medium,
                },
              ]}
            >
              {successPopup?.message}
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={hideSuccess}
              style={[
                styles.button,
                {
                  backgroundColor: theme.colors.primary,
                  borderColor: `${theme.colors.primary}CC`,
                },
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  { fontFamily: theme.text.fontFamily.semiBold },
                ]}
              >
                {successPopup?.buttonLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </FeedbackContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "rgba(5, 45, 80, 0.18)",
    alignItems: "center",
  },
  popupCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    textAlign: "center",
  },
  message: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  button: {
    marginTop: 18,
    minWidth: 132,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});
