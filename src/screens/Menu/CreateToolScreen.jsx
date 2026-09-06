import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";
import { AppIcon } from "../../components/common/AppIcon";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthContext from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { useTheme } from "../../theme/ThemeContext";
import { projectService, toolService, userService } from "../../services";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import FloatingActionButton from "../../components/common/FloatingActionButton/FloatingActionButton";
import { standardScreenHeaderPlaceholder } from "../../styles/screenLayout";
import { createStyles } from "./CreateToolScreen.styles";
import { pickUploadAssets } from "../../utils/uploadPicker";
import { getEntityId } from "../../utils/entityId";
import { canManageTools } from "../../utils/userRoles";
import { DEFAULT_TOOL_STATUS } from "../../constants/toolStatus";

const FieldIcon = ({ name, styles }) => (
  <View style={styles.fieldIconBadge}>
    <AppIcon name={name} size={28} color="#007AFF" strokeWidth={1.5} />
  </View>
);

const PlainFormRow = ({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  isLast = false,
  multiline = false,
  theme,
  styles,
}) => (
  <>
    <View style={styles.groupedField}>
      <View style={styles.fieldRowContent}>
        {icon ? <FieldIcon name={icon} styles={styles} /> : null}
        <View style={styles.fieldInputWrap}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <TextInput
            style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.content.placeholder}
            multiline={multiline}
            textAlignVertical={multiline ? "top" : "auto"}
          />
        </View>
      </View>
    </View>
    {!isLast ? <View style={styles.rowSepIcon} /> : null}
  </>
);

const SelectRow = ({
  icon,
  label,
  value,
  placeholder,
  onPress,
  theme,
  styles,
  isLast = false,
}) => (
  <>
    <TouchableOpacity
      style={styles.selectRow}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.fieldRowContent}>
        <FieldIcon name={icon} styles={styles} />
        <View style={styles.fieldInputWrap}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Text
            numberOfLines={2}
            style={[styles.selectValue, !value && styles.selectPlaceholder]}
          >
            {value || placeholder}
          </Text>
        </View>
      </View>
      <Icon name="chevron-right" size={18} color={theme.content.textPrimary} />
    </TouchableOpacity>
    {!isLast ? <View style={styles.rowSepIcon} /> : null}
  </>
);

export default function CreateToolScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const { user } = useContext(AuthContext);
  const { showSuccess } = useFeedback();

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const selectedWorkersLabel = useMemo(() => {
    if (selectedWorkerIds.length === 0) {
      return "";
    }

    const names = selectedWorkerIds
      .map((workerId) => {
        const worker = workers.find((item) => getEntityId(item) === workerId);
        return worker?.name || "";
      })
      .filter(Boolean);

    return names.join(", ");
  }, [selectedWorkerIds, workers]);

  const selectedProjectsLabel = useMemo(() => {
    if (selectedProjectIds.length === 0) {
      return "";
    }

    const names = selectedProjectIds
      .map((projectId) => {
        const project = projects.find(
          (item) => getEntityId(item) === projectId,
        );
        return project?.name || "";
      })
      .filter(Boolean);

    return names.join(", ");
  }, [projects, selectedProjectIds]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [workersData, projectsData] = await Promise.all([
          userService.getWorkers(),
          user?.role === "superadmin"
            ? projectService.getAll()
            : projectService.getMyProjects(),
        ]);

        setWorkers(Array.isArray(workersData) ? workersData : []);
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      } catch (error) {
        console.error("Failed to load tool form data:", error);
        setWorkers([]);
        setProjects([]);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user?.role]);

  const pickPhoto = async () => {
    try {
      const assets = await pickUploadAssets({
        allowsMultipleSelection: false,
        fileNamePrefix: "tool-photo",
        documentTypes: ["image/*"],
      });

      if (assets.length > 0) {
        setPhoto(assets[0]);
      }
    } catch (error) {
      console.error("Failed to pick tool photo:", error);
      Alert.alert(t("tools.photoErrorTitle"), t("tools.photoErrorMessage"));
    }
  };

  const toggleWorkerSelection = (workerId) => {
    setSelectedWorkerIds((previous) => {
      if (previous.includes(workerId)) {
        return previous.filter((id) => id !== workerId);
      }

      return [...previous, workerId];
    });
  };

  const toggleProjectSelection = (projectId) => {
    setSelectedProjectIds((previous) => {
      if (previous.includes(projectId)) {
        return previous.filter((id) => id !== projectId);
      }

      return [...previous, projectId];
    });
  };

  const handleCreateTool = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setFormError(t("tools.nameRequired"));
      return;
    }

    setFormError("");
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", trimmedName);
      formData.append("status", DEFAULT_TOOL_STATUS);

      if (notes.trim()) {
        formData.append("notes", notes.trim());
      }

      if (selectedWorkerIds.length > 0) {
        formData.append("workerIds", JSON.stringify(selectedWorkerIds));
      }

      if (selectedProjectIds.length > 0) {
        formData.append("projectIds", JSON.stringify(selectedProjectIds));
      }

      if (photo) {
        formData.append("photo", {
          uri: photo.uri,
          name: photo.name || "tool-photo.jpg",
          type: photo.mimeType || "image/jpeg",
        });
      }

      await toolService.create(formData);
      showSuccess({
        title: t("tools.created"),
        message: t("tools.createdMessage"),
      });
      navigation.goBack();
    } catch (error) {
      console.error("Failed to create tool:", error);
      const message = error?.response?.data?.message;
      setFormError(
        Array.isArray(message)
          ? message.join(", ")
          : message || error?.message || t("tools.createError"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (!canManageTools(user?.role)) {
    return (
      <View style={styles.screen}>
        <View style={styles.pageContainer}>
          <View style={styles.header}>
            <BackButton
              onPress={() => navigation.goBack()}
              iconSource={require("../../assets/Arrow-left.png")}
            />
            <Text
              style={[
                styles.headerTitle,
                { fontFamily: theme.text.fontFamily.semiBold },
              ]}
            >
              {t("tools.addTitle")}
            </Text>
            <View style={standardScreenHeaderPlaceholder} />
          </View>
          <View style={styles.accessDeniedContainer}>
            <Text style={styles.accessDeniedText}>{t("access.denied")}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.pageContainer}>
        <View style={styles.header}>
          <BackButton
            onPress={() => navigation.goBack()}
            iconSource={require("../../assets/Arrow-left.png")}
          />
          <Text
            style={[
              styles.headerTitle,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            {t("tools.addTitle")}
          </Text>
          <FloatingActionButton
            accessibilityLabel={t("common.save")}
            onPress={handleCreateTool}
            disabled={saving}
            renderContent={() =>
              saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon name="check" size={24} color="#FFFFFF" />
              )
            }
          />
        </View>

        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <View style={styles.groupCard}>
            <PlainFormRow
              styles={styles}
              theme={theme}
              icon="tool"
              label={t("tools.nameLabel")}
              value={name}
              onChangeText={setName}
              placeholder={t("tools.namePlaceholder")}
            />
            <TouchableOpacity
              style={[styles.selectRow, styles.groupRowLast]}
              onPress={pickPhoto}
              activeOpacity={0.85}
            >
              <View style={styles.fieldRowContent}>
                <FieldIcon name="camera" theme={theme} styles={styles} />
                <View style={styles.fieldInputWrap}>
                  <Text style={styles.fieldLabel}>{t("tools.addPhoto")}</Text>
                  <Text
                    style={[
                      styles.selectValue,
                      !photo && styles.selectPlaceholder,
                    ]}
                  >
                    {photo
                      ? photo.name || t("tools.photoSelected")
                      : t("tools.selectPhoto")}
                  </Text>
                </View>
              </View>
              {photo ? (
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.photoPreview}
                />
              ) : (
                <Icon name="chevron-right" size={18} color="#052D50" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.groupCard}>
            <SelectRow
              styles={styles}
              icon="users"
              label={t("tools.attachWorkers")}
              value={selectedWorkersLabel}
              placeholder={
                loadingData ? t("workers.loading") : t("workers.select")
              }
              onPress={() => setShowWorkerModal(true)}
              theme={theme}
            />
            <SelectRow
              styles={styles}
              icon="folder"
              label={t("tools.attachProjects")}
              value={selectedProjectsLabel}
              placeholder={
                loadingData ? t("projects.loading") : t("projects.select")
              }
              onPress={() => setShowProjectModal(true)}
              theme={theme}
              isLast
            />
          </View>

          <View style={styles.groupCard}>
            <PlainFormRow
              styles={styles}
              theme={theme}
              icon="file-text"
              label={t("tools.notesLabel")}
              value={notes}
              onChangeText={setNotes}
              placeholder={t("tools.notesPlaceholder")}
              isLast
            />
          </View>
        </ScrollView>

        <BottomBar
          onLeftPress={() => navigation.navigate("Main")}
          onRightPress={() => navigation.navigate("Menu")}
          showAddButton={false}
        />
      </View>

      <Modal
        visible={showWorkerModal}
        animationType="slide"
        onRequestClose={() => setShowWorkerModal(false)}
      >
        <SafeAreaView style={styles.pickerModalContainer}>
          <View style={styles.pickerModalHeader}>
            <BackButton
              backgroundColor={theme.content.surfaceMuted}
              tint="light"
              borderColor="#FFFFFF50"
              onPress={() => setShowWorkerModal(false)}
              iconSource={require("../../assets/Arrow-left.png")}
            />
            <Text
              style={[
                styles.pickerModalTitle,
                { fontFamily: theme.text.fontFamily.semiBold },
              ]}
            >
              {t("tools.attachWorkers")}
            </Text>
            <View style={standardScreenHeaderPlaceholder} />
          </View>

          <ScrollView contentContainerStyle={styles.pickerListContent}>
            {workers.length === 0 ? (
              <View style={styles.pickerEmptyState}>
                <Text style={styles.pickerEmptyStateText}>
                  {loadingData ? t("workers.loading") : t("workers.notFound")}
                </Text>
              </View>
            ) : (
              workers.map((worker, index) => {
                const workerId = getEntityId(worker);
                const isSelected = selectedWorkerIds.includes(workerId);

                return (
                  <TouchableOpacity
                    key={workerId}
                    style={[
                      styles.pickerOptionRow,
                      index !== workers.length - 1 && styles.groupRowDivider,
                    ]}
                    onPress={() => toggleWorkerSelection(workerId)}
                  >
                    <Text style={styles.pickerOptionLabel}>
                      {worker.name || worker.email}
                    </Text>
                    {isSelected ? (
                      <Icon
                        name="check"
                        size={18}
                        color={theme.colors.primary}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showProjectModal}
        animationType="slide"
        onRequestClose={() => setShowProjectModal(false)}
      >
        <SafeAreaView style={styles.pickerModalContainer}>
          <View style={styles.pickerModalHeader}>
            <BackButton
              backgroundColor={theme.content.surfaceMuted}
              tint="light"
              borderColor="#FFFFFF50"
              onPress={() => setShowProjectModal(false)}
              iconSource={require("../../assets/Arrow-left.png")}
            />
            <Text
              style={[
                styles.pickerModalTitle,
                { fontFamily: theme.text.fontFamily.semiBold },
              ]}
            >
              {t("tools.attachProjects")}
            </Text>
            <View style={standardScreenHeaderPlaceholder} />
          </View>

          <ScrollView contentContainerStyle={styles.pickerListContent}>
            {projects.length === 0 ? (
              <View style={styles.pickerEmptyState}>
                <Text style={styles.pickerEmptyStateText}>
                  {loadingData ? t("projects.loading") : t("projects.notFound")}
                </Text>
              </View>
            ) : (
              projects.map((project, index) => {
                const projectId = getEntityId(project);
                const isSelected = selectedProjectIds.includes(projectId);

                return (
                  <TouchableOpacity
                    key={projectId}
                    style={[
                      styles.pickerOptionRow,
                      index !== projects.length - 1 && styles.groupRowDivider,
                    ]}
                    onPress={() => toggleProjectSelection(projectId)}
                  >
                    <Text style={styles.pickerOptionLabel}>{project.name}</Text>
                    {isSelected ? (
                      <Icon
                        name="check"
                        size={18}
                        color={theme.colors.primary}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
