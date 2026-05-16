import React from "react";

import {
  Image,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from "react-native";

import { useTheme } from "../../../theme/ThemeContext";

import { API_BASE_URL } from "../../../services/api";

import { createStyles } from "./ProjectFilesSection.style";

export default function ProjectFilesSection({
  project,
  onClose,
}) {
  const { theme } = useTheme();

  const styles = createStyles(theme);

  const files = project?.documents || [];

  if (!files.length) {
    return null;
  }

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>
          Project Documents
        </Text>

        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.7}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>
            ✕
          </Text>
        </TouchableOpacity>
      </View>

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