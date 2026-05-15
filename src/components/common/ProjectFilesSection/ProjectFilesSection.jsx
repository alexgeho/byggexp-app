import React from "react";
import { createStyles } from "./ProjectFilesSection.style";
import { Image, View } from "react-native";
import { useTheme } from "../../../theme/ThemeContext";

export default function ProjectFilesSection() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.container}>
      <Image
        source={require("../../../assets/main/ProjectFiles.png")}
        style={styles.image}
      />
    </View>
  );
}
