import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFeedback } from "../../../contexts/FeedbackContext";
import { useTheme } from "../../../theme/ThemeContext";
import { toolService } from "../../../services";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import Icon from "react-native-vector-icons/Feather";
import { createStyles } from "./SelectTools.styles";

export const SelectTools = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { showSuccess } = useFeedback();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const { projectId } = route.params || {};

  const [tools, setTools] = useState([]);
  const [selectedTools, setSelectedTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const themedCheckboxStyle = { borderColor: `${theme.colors.primary}66` };
  const themedCheckboxSelectedStyle = {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      setLoading(true);
      const all = await toolService.getAll();
      // Only tools not already attached to this project.
      const available = (all || []).filter(
        (tool) =>
          !Array.isArray(tool.projectIds) ||
          !tool.projectIds.map(String).includes(String(projectId)),
      );
      setTools(available);
    } catch (error) {
      console.error("Error fetching tools:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleToolSelection = (toolId) => {
    setSelectedTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId],
    );
  };

  const handleSaveTools = async () => {
    if (!projectId || selectedTools.length === 0) return;
    try {
      setSaving(true);
      await toolService.attachToProject(projectId, selectedTools);
      showSuccess({
        title: t("tools.added"),
        message: t("tools.addedMessage"),
      });
      navigation.goBack();
    } catch (error) {
      console.error("Error attaching tools:", error);
      Alert.alert(t("common.error"), t("tools.addFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0091FF" />
        <Text>{t("tools.loading")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          backgroundColor={theme.content.surfaceMuted}
          tint={"light"}
          borderColor="#FFFFFF50"
          onPress={() => navigation.goBack()}
          iconSource={require("../../../assets/Arrow-left.png")}
        />
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            styles.projectName,
            { fontFamily: theme.text.fontFamily["medium"] },
          ]}
        >
          {t("tools.selectTitle")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        style={{ width: "100%", flex: 1 }}
        data={tools}
        keyExtractor={(tool) => String(tool._id || tool.id)}
        ListEmptyComponent={
          <Text style={styles.noToolsText}>{t("tools.noneAvailable")}</Text>
        }
        renderItem={({ item: tool }) => {
          const toolId = tool._id || tool.id;
          const isSelected = selectedTools.includes(toolId);
          return (
            <View style={styles.toolItem}>
              <View style={styles.toolIcon}>
                <Icon name="tool" size={20} color="#0785F4" />
              </View>
              <View style={styles.toolInfo}>
                <Text style={styles.toolName}>
                  {tool.name || t("common.noName")}
                </Text>
                {tool.location ? (
                  <Text style={styles.toolMeta}>{tool.location}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => toggleToolSelection(toolId)}
                style={[
                  styles.checkbox,
                  themedCheckboxStyle,
                  isSelected && themedCheckboxSelectedStyle,
                ]}
              >
                {isSelected && <Text style={{ color: "#ffffff" }}>✓</Text>}
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        onAddPress={handleSaveTools}
        addDisabled={saving}
        renderAddContent={() =>
          saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Icon name="check" size={33} color="#FFFFFF" />
          )
        }
      />
    </View>
  );
};
