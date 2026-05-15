import React from "react";
import { createStyles } from "./ProjectFilesSection.style";
import { Image, View, Text } from "react-native";
import { useTheme } from "../../../theme/ThemeContext";

export default function ProjectFilesSection({ project }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.container}>
      <Text>{project?.name}</Text>
      {/*   <Image
        source={require("../../../assets/main/ProjectFiles.png")}
        style={styles.image}
      /> */}
    </View>
  );
}
