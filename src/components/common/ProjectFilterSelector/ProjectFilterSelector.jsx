import React, { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";
import { setLocalProjectSelectionHandler } from "../../../utils/localProjectSelection";
import { useTheme } from "../../../theme/ThemeContext";
import { createStyles } from "./ProjectFilterSelector.styles";

const getProjectId = (project) => project?._id || project?.id;

export function ProjectFilterSelector({
  projects,
  selectedProjectId,
  onSelect,
}) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);

  const selectedProject = projects.find(
    (project) => getProjectId(project) === selectedProjectId,
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.trigger}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={selectedProject?.name || t("projects.all")}
        onPress={() => {
          // Keep the callback out of navigation params (non-serializable).
          setLocalProjectSelectionHandler((project) =>
            onSelect(project ? getProjectId(project) : null),
          );
          navigation.navigate("Projects", {
            mode: "select-local",
            allowAll: true,
            currentProjectId: selectedProjectId,
          });
        }}
      >
        <Text
          style={[
            styles.triggerText,
            !selectedProject && styles.triggerPlaceholder,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {selectedProject?.name || t("projects.all")}
        </Text>
        <Icon name="chevron-down" size={18} color={theme.content.textMuted} />
      </TouchableOpacity>
    </View>
  );
}
