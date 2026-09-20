import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import AuthContext from "../../../contexts/AuthContext";
import { createStyles, PRIMARY, MUTED } from "./billingForm.styles";
import { useTheme } from "../../../theme/ThemeContext";
import { ProjectListCard } from "../../../components/common/ProjectListCard/ProjectListCard";

// Optional project picker for the invoice form. Linking an invoice to a project
// lets its total roll up into that project's economy ("Fakturerat"). Selecting
// "no project" clears the link (onSelect(null)).
export default function ProjectPickerModal({ visible, onClose, onSelect }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const isSuperAdmin = user?.role === "superadmin";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // GET /projects is superadmin-only; everyone else lists their company's
      // projects through /projects/my. Asking for the wrong one answered 403
      // and the picker showed "no projects" to admins whose company is full
      // of them. (The web form picks the endpoint the same way.)
      const data = isSuperAdmin
        ? await projectService.getAll()
        : await projectService.getMyProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

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
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 12, paddingBottom: 12 }}
            >
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
                // Same rich card as the Projects list.
                filtered.map((project) => (
                  <ProjectListCard
                    key={project._id || project.id}
                    project={project}
                    onPress={() => onSelect(project)}
                  />
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
