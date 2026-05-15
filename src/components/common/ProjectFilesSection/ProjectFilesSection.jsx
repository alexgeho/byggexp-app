import React from "react";

import {
  Image,
  ScrollView,
  View,
  Text,
} from "react-native";

import { useTheme } from "../../../theme/ThemeContext";

import { API_BASE_URL } from "../../../services/api";

import { createStyles } from "./ProjectFilesSection.style";

export default function ProjectFilesSection({ project }) {
  const { theme } = useTheme();

  const styles = createStyles(theme);

  const files = project?.documents || [];

  return (
    <View>
      <Text style={styles.title}>
        Project Documents
      </Text>

      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {files.map(function renderFile(file, index) {
            return (
              <Image
                key={index}
                source={{
                  uri: `${API_BASE_URL}${file.url}`,
                }}
                style={styles.image}
              />
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}