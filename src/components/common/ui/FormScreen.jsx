import React from "react";
import { Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { layout, space } from "../../../theme/spacing";
import { screenPaddingTop } from "../../../styles/screenLayout";

const IS_WEB = Platform.OS === "web";

// Root of a FormHeader screen. On native the top is the same fixed pad every
// standard screen uses (48 + its 20 header pad), so a form's header and first
// card sit at the exact height of Create project's — not wherever the device's
// safe-area inset happens to put them. Web keeps the real inset.
export function FormScreen({ style, edges = ["top"], children }) {
  if (IS_WEB) {
    return (
      <SafeAreaView style={style} edges={edges}>
        {children}
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView
      style={[
        style,
        { paddingTop: screenPaddingTop + space.xl - layout.headerToContent },
      ]}
      edges={edges.filter((e) => e !== "top")}
    >
      {children}
    </SafeAreaView>
  );
}
