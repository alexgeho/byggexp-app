import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import { styles } from "./ProjectFilterSelector.styles";

const getProjectId = (project) => project?._id || project?.id;

export function ProjectFilterSelector({ projects, selectedProjectId, onSelect }) {
  const navigation = useNavigation();

  const selectedProject = projects.find(
    (project) => getProjectId(project) === selectedProjectId,
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.trigger}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate("Projects", {
            mode: "select-local",
            allowAll: true,
            currentProjectId: selectedProjectId,
            onSelect: (project) => onSelect(project ? getProjectId(project) : null),
          })
        }
      >
        <Text style={styles.triggerText} numberOfLines={1} ellipsizeMode="tail">
          {selectedProject?.name || "All projects"}
        </Text>
        <Icon name="chevron-down" size={18} color="rgba(5, 45, 80, 0.5)" />
      </TouchableOpacity>
    </View>
  );
}
