import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import { projectService } from "../../../services";
import { createStyles, PRIMARY, MUTED } from "./billingForm.styles";
import { useTheme } from "../../../theme/ThemeContext";

// Optional project picker for the invoice form. Linking an invoice to a project
// lets its total roll up into that project's economy ("Fakturerat"). Selecting
// "no project" clears the link (onSelect(null)).
export default function ProjectPickerModal({ visible, onClose, onSelect }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectService.getAll();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setSearch("");
      load();
    }
  }, [visible, load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((p) =>
      [p.name, p.address, p.clientName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [projects, search]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <View style={styles.grab} />
          <Text style={styles.modalTitle}>{t("billing.selectProject")}</Text>

          <View style={styles.searchBar}>
            <Icon name="search" size={18} color={MUTED} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder={t("billing.searchProject")}
              placeholderTextColor="#9fb0c4"
            />
          </View>

          {/* Clear the project link. */}
          <TouchableOpacity
            style={styles.newClientBtn}
            onPress={() => onSelect(null)}
          >
            <Icon name="slash" size={18} color={MUTED} />
            <Text style={[styles.newClientText, { color: MUTED }]}>
              {t("billing.noProject")}
            </Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator
              color={PRIMARY}
              style={{ paddingVertical: 30 }}
            />
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled">
              {filtered.length === 0 ? (
                <Text
                  style={{
                    color: MUTED,
                    textAlign: "center",
                    paddingVertical: 24,
                  }}
                >
                  {t("billing.noProjects")}
                </Text>
              ) : (
                filtered.map((project) => (
                  <TouchableOpacity
                    key={project._id || project.id}
                    style={styles.clientRow}
                    onPress={() => onSelect(project)}
                  >
                    <Text style={styles.clientName}>
                      {project.name || t("projects.untitled")}
                    </Text>
                    {(project.address || project.clientName) && (
                      <Text style={styles.clientMeta}>
                        {[project.clientName, project.address]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.newClientBtn, { justifyContent: "center" }]}
            onPress={onClose}
          >
            <Text style={{ color: MUTED, fontWeight: "700" }}>
              {t("common.cancel")}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
