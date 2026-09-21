import React from "react";
import { TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { radius } from "../../../theme/tokens";
import { useTheme } from "../../../theme/ThemeContext";

// Round confirm/save action for a screen header (top-right). Replaces the
// full-width bottom "Save" button pattern. Uses the active theme's primary blue
// so every save button across the app (this + FloatingActionButton) is the
// exact same colour.
export const HeaderCheckButton = ({
  onPress,
  loading = false,
  disabled = false,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.button,
        { backgroundColor: theme.colors.primary },
        (disabled || loading) && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={theme.content.onAccent} size="small" />
      ) : (
        <Icon name="check" size={22} color={theme.content.onAccent} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.6,
  },
});

export default HeaderCheckButton;
