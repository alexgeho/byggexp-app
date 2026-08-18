import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import Icon from "react-native-vector-icons/Feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useTranslation } from "react-i18next";
import { SuccessPopupIcon } from "../components/common/SuccessPopupIcon/SuccessPopupIcon";
import { useTheme } from "../theme/ThemeContext";

const FeedbackContext = createContext(null);

// How long a popup stays up before dismissing itself. The OK button (and a tap
// on the backdrop) still close it sooner. Pass autoHideMs: 0 to keep it sticky.
const DEFAULT_AUTO_HIDE_MS = { success: 3000, error: 4200 };

export function useFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }

  return context;
}

export function FeedbackProvider({ children }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [popup, setPopup] = useState(null);
  const hideTimerRef = useRef(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const hidePopup = useCallback(() => {
    clearHideTimer();
    setPopup(null);
  }, [clearHideTimer]);

  const showPopup = useCallback(
    (variant, options) => {
      if (!options?.message) {
        return;
      }

      const autoHideMs =
        options.autoHideMs != null
          ? options.autoHideMs
          : DEFAULT_AUTO_HIDE_MS[variant];

      setPopup({
        variant,
        title:
          options.title ||
          (variant === "error" ? t("common.error") : t("common.success")),
        message: options.message,
        buttonLabel: options.buttonLabel || t("common.ok"),
        autoHideMs,
      });
    },
    [t],
  );

  const showSuccess = useCallback(
    (options) => showPopup("success", options),
    [showPopup],
  );

  const showError = useCallback(
    (options) => showPopup("error", options),
    [showPopup],
  );

  // Backwards-compatible alias.
  const hideSuccess = hidePopup;

  // Auto-dismiss: whenever a popup with a positive autoHideMs is shown, arm a
  // timer that closes it on its own. Re-runs (and clears) whenever the popup
  // changes, so a fresh popup always gets a fresh timer.
  useEffect(() => {
    clearHideTimer();
    if (popup && popup.autoHideMs > 0) {
      hideTimerRef.current = setTimeout(() => {
        hideTimerRef.current = null;
        setPopup(null);
      }, popup.autoHideMs);
    }
    return clearHideTimer;
  }, [popup, clearHideTimer]);

  const value = useMemo(
    () => ({
      showSuccess,
      showError,
      hideSuccess,
      hidePopup,
    }),
    [showSuccess, showError, hideSuccess, hidePopup],
  );

  const isDarkTheme = theme.colors.background === "#121212";
  const popupBackground = isDarkTheme ? "#1C1C1C" : "#FFFFFF";
  const popupBorder = isDarkTheme ? "rgba(255, 255, 255, 0.12)" : "#FFFFFF";
  const popupTextColor = isDarkTheme ? "#FFFFFF" : "#052D50";
  const popupSubtextColor = isDarkTheme
    ? "rgba(255, 255, 255, 0.72)"
    : "rgba(5, 45, 80, 0.65)";
  const isError = popup?.variant === "error";
  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <Modal
        animationType="fade"
        transparent={true}
        visible={Boolean(popup)}
        onRequestClose={hidePopup}
      >
        <View style={styles.overlay}>
          <BlurView
            intensity={50}
            tint="light"
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <Pressable style={StyleSheet.absoluteFill} onPress={hidePopup} />

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
            {isError ? (
              <View style={styles.errorIconWrap}>
                <Icon name="alert-circle" size={30} color="#E5484D" />
              </View>
            ) : (
              <SuccessPopupIcon />
            )}

            <Text
              style={[
                styles.title,
                {
                  color: isError ? "#E5484D" : popupTextColor,
                  fontFamily: theme.text.fontFamily.semiBold,
                },
              ]}
            >
              {popup?.title}
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
              {popup?.message}
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={hidePopup}
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
                {popup?.buttonLabel}
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
    backgroundColor: "transparent",
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
  errorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: "rgba(229, 72, 77, 0.12)",
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
