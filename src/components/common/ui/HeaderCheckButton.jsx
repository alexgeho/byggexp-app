import React from "react";
import { TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { content, radius } from "../../../theme/tokens";

// Round confirm/save action for a screen header (top-right). Replaces the
// full-width bottom "Save" button pattern.
export const HeaderCheckButton = ({
  onPress,
  loading = false,
  disabled = false,
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.85}
    style={[styles.button, (disabled || loading) && styles.disabled]}
  >
    {loading ? (
      <ActivityIndicator color={content.onAccent} size="small" />
    ) : (
      <Icon name="check" size={22} color={content.onAccent} />
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: content.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.6,
  },
});

export default HeaderCheckButton;
