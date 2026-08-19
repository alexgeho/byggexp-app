import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { content } from "../../../theme/tokens";
import { resolveUploadUrl } from "../../../utils/shifts";
import { getInitials } from "../../../utils/initials";

// Circular avatar: shows the image when available, otherwise the person's
// initials on a neutral disc. `uri` may be a raw/relative upload path.
// Rendered in every list row, so it uses expo-image (memory+disk cache, no
// re-decode/re-fetch on scroll or remount) and is memoized to skip re-renders
// on unchanged props.
export const Avatar = React.memo(function Avatar({ name, uri, size = 44 }) {
  const resolved = uri ? resolveUploadUrl(uri) : null;
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (resolved) {
    return (
      <Image
        source={resolved}
        style={[styles.base, dimension]}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
      />
    );
  }
  return (
    <View style={[styles.base, styles.fallback, dimension]}>
      <Text style={[styles.initials, { fontSize: size * 0.34 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
});

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
