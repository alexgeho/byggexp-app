import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { content } from "../../../theme/tokens";
import { resolveUploadUrl } from "../../../utils/shifts";

const getInitials = (name) => {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

// Circular avatar: shows the image when available, otherwise the person's
// initials on a neutral disc. `uri` may be a raw/relative upload path.
export const Avatar = ({ name, uri, size = 44 }) => {
  const resolved = uri ? resolveUploadUrl(uri) : null;
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (resolved) {
    return (
      <Image source={{ uri: resolved }} style={[styles.base, dimension]} />
    );
  }
  return (
    <View style={[styles.base, styles.fallback, dimension]}>
      <Text style={[styles.initials, { fontSize: size * 0.34 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    // No-photo placeholder blends with the screen background (Figma #EEEEEE).
    backgroundColor: content.background,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: content.textPrimary,
    fontWeight: "700",
  },
});

export default Avatar;
