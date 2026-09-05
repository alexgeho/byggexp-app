import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthContext from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { useTheme } from "../../theme/ThemeContext";
import { projectService, toolService, userService } from "../../services";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import FloatingActionButton from "../../components/common/FloatingActionButton/FloatingActionButton";
import { standardScreenHeaderPlaceholder } from "../../styles/screenLayout";
import { createStyles } from "./CreateEmployeeScreen.styles";
import {
  canManageEmployees,
  getCreatableRoleOptions,
  USER_ROLES,
} from "../../utils/userRoles";
import { getApiErrorMessage } from "../../utils/apiError";
import { getEntityId } from "../../utils/entityId";

// Backend capability key for financial features (offers, invoices, clients).
const FINANCE_PERMISSION = "finance.manage";

const parsePhoneFields = (value) => {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) {
    return { areaCode: undefined, phone: undefined };
  }

  if (digits.length <= 2) {
    return {
      areaCode: parseInt(digits, 10),
      phone: undefined,
    };
  }

  return {
    areaCode: parseInt(digits.slice(0, 2), 10),
    phone: parseInt(digits.slice(2), 10),
  };
};

const FieldIcon = ({ name, theme, styles }) => (
  <View
    style={[
      styles.fieldIconBadge,
      { backgroundColor: theme.colors.primaryIconBadge },
    ]}
  >
    <Icon name={name} size={14} color="#FFFFFF" />
  </View>
);

const PlainFormRow = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  isLast = false,
  multiline = false,
  theme,
  styles,
}) => (
  <View
    style={[
      styles.groupedField,
      !isLast && styles.groupRowDivider,
      isLast && styles.groupRowLast,
    ]}
  >
    <View style={styles.fieldInputWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.content.placeholder}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "auto"}
      />
    </View>
  </View>
);

// Language assignable to an invited user — drives their emails + app default
// until they change it in-app. Codes match the app locales (Norwegian = "no").
const LANGUAGE_OPTIONS = [
  { value: "sv", label: "Svenska" },
  { value: "bs", label: "Bosanski / Hrvatski / Srpski" },
  { value: "et", label: "Eesti" },
  { value: "en", label: "English" },
  { value: "lv", label: "Latviešu" },
  { value: "lt", label: "Lietuvių" },
  { value: "no", label: "Norsk" },
  { value: "pl", label: "Polski" },
  { value: "ru", label: "Russkij" },
  { value: "fi", label: "Suomi" },
  { value: "uk", label: "Ukrainska" },
];
const DEFAULT_USER_LANGUAGE = "sv";
const languageObjectToCode = (language) =>
  language && typeof language === "object"
    ? Object.keys(language)[0] || DEFAULT_USER_LANGUAGE
    : language || DEFAULT_USER_LANGUAGE;

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
  <TouchableOpacity
    style={[
      styles.selectRow,
      !isLast && styles.groupRowDivider,
      isLast && styles.groupRowLast,
    ]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={styles.fieldRowContent}>
      <FieldIcon name={icon} theme={theme} styles={styles} />
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
);

export default function CreateEmployeeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const { user } = useContext(AuthContext);
  const { showSuccess } = useFeedback();
  const employeeId = route.params?.employeeId || "";
  const isEditing = Boolean(employeeId);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profession, setProfession] = useState("");
  const [phone, setPhone] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(
    DEFAULT_USER_LANGUAGE,
  );
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  // Finance capability delegation for Project Admins (mirrors the admin panel's
  // Permissions tab: grants `finance.manage`). Only company/super admins can set
  // it; workers never get it.
  const [financeAccess, setFinanceAccess] = useState(false);
  const [initialFinanceAccess, setInitialFinanceAccess] = useState(false);
  const [permissionOverrides, setPermissionOverrides] = useState({
    granted: [],
    revoked: [],
  });
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [tools, setTools] = useState([]);
  const [selectedToolIds, setSelectedToolIds] = useState([]);
  const [showToolModal, setShowToolModal] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTools, setLoadingTools] = useState(true);
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const roleOptions = useMemo(
    () => getCreatableRoleOptions(user?.role),
    [user?.role],
  );

  const selectedRoleLabel = useMemo(() => {
    const option = roleOptions.find((item) => item.value === selectedRole);
    return option ? t(`roles.${option.value}`, option.label) : "";
  }, [roleOptions, selectedRole, t]);

  const selectedLanguageLabel = useMemo(
    () =>
      LANGUAGE_OPTIONS.find((item) => item.value === selectedLanguage)?.label ||
      "",
    [selectedLanguage],
  );

  const isWorkerRole = selectedRole === USER_ROLES.WORKER;
  const canGrantFinance =
    user?.role === USER_ROLES.COMPANY_ADMIN || user?.role === "superadmin";
  const showFinanceToggle =
    canGrantFinance && selectedRole === USER_ROLES.PROJECT_ADMIN;

  const selectedToolsLabel = useMemo(() => {
    if (selectedToolIds.length === 0) {
      return "";
    }

    const names = selectedToolIds
      .map((toolId) => {
        const tool = tools.find((item) => getEntityId(item) === toolId);
        return tool?.name || "";
      })
      .filter(Boolean);

    return names.join(", ");
  }, [selectedToolIds, tools]);

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
    if (!selectedRole && roleOptions[0]?.value) {
      setSelectedRole(roleOptions[0].value);
    }
  }, [roleOptions, selectedRole]);

  useEffect(() => {
    if (!isWorkerRole) {
      setSelectedToolIds([]);
    }
  }, [isWorkerRole]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        const projectsData =
          user?.role === "superadmin"
            ? await projectService.getAll()
            : await projectService.getMyProjects();
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      } catch (error) {
        console.error("Failed to load projects:", error);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [user?.role]);

  useEffect(() => {
    const loadTools = async () => {
      try {
        setLoadingTools(true);
        const toolsData = await toolService.getAll();
        setTools(Array.isArray(toolsData) ? toolsData : []);
      } catch (error) {
        console.error("Failed to load tools:", error);
        setTools([]);
      } finally {
        setLoadingTools(false);
      }
    };

    loadTools();
  }, []);

  useEffect(() => {
    if (!isEditing || !employeeId) {
      return;
    }

    const loadEmployee = async () => {
      try {
        setLoadingEmployee(true);
        setFormError("");
        const data = await userService.getDetail(employeeId);

        setName(data?.name || "");
        setEmail(data?.email || "");
        setProfession(data?.profession || "");
        setPhone(
          data?.phoneAreaCode && data?.phoneNumber
            ? `+${data.phoneAreaCode}${data.phoneNumber}`
            : "",
        );
        setSelectedRole(data?.role || USER_ROLES.WORKER);
        setSelectedLanguage(languageObjectToCode(data?.language));
        setSelectedProjectIds(
          Array.isArray(data?.projects)
            ? data.projects
                .map((project) => getEntityId(project))
                .filter(Boolean)
            : [],
        );
        setSelectedToolIds(
          Array.isArray(data?.tools)
            ? data.tools.map((tool) => getEntityId(tool)).filter(Boolean)
            : [],
        );
        const overrides = data?.capabilities?.overrides || {
          granted: [],
          revoked: [],
        };
        setPermissionOverrides({
          granted: Array.isArray(overrides.granted) ? overrides.granted : [],
          revoked: Array.isArray(overrides.revoked) ? overrides.revoked : [],
        });
        const hasFinance = Array.isArray(data?.capabilities?.effective)
          ? data.capabilities.effective.includes(FINANCE_PERMISSION)
          : false;
        setFinanceAccess(hasFinance);
        setInitialFinanceAccess(hasFinance);
      } catch (error) {
        console.error("Failed to load employee:", error);
        setFormError(getApiErrorMessage(error, t("createEmployee.loadError")));
      } finally {
        setLoadingEmployee(false);
      }
    };

    loadEmployee();
  }, [employeeId, isEditing]);

  const toggleProjectSelection = (projectId) => {
    setSelectedProjectIds((previous) => {
      if (previous.includes(projectId)) {
        return previous.filter((id) => id !== projectId);
      }

      return [...previous, projectId];
    });
  };

  const toggleToolSelection = (toolId) => {
    setSelectedToolIds((previous) => {
      if (previous.includes(toolId)) {
        return previous.filter((id) => id !== toolId);
      }

      return [...previous, toolId];
    });
  };

  const handleSaveEmployee = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedProfession = profession.trim();
    const { areaCode, phone: phoneNumber } = parsePhoneFields(phone);

    if (!trimmedEmail) {
      setFormError(t("createEmployee.emailRequired"));
      return;
    }

    setFormError("");
    setSaving(true);

    try {
      const payload = {
        email: trimmedEmail,
      };

      if (trimmedName) {
        payload.name = trimmedName;
      }

      payload.profession = trimmedProfession;

      if (areaCode && phoneNumber) {
        payload.phoneAreaCode = areaCode;
        payload.phoneNumber = phoneNumber;
      }

      if (selectedRole) {
        payload.role = selectedRole;
      }

      if (selectedLanguage) {
        payload.language = { [selectedLanguage]: selectedLanguageLabel };
      }

      if (selectedProjectIds.length > 0 || isEditing) {
        payload.projectIds = selectedProjectIds;
      }

      if (user?.role === "companyAdmin" && user?.companyId) {
        payload.companyId = user.companyId;
      }

      let workerId = employeeId;

      if (isEditing) {
        await userService.update(employeeId, payload);
      } else {
        payload.inviteViaEmail = true;
        const createdUser = await userService.create(payload);
        workerId = getEntityId(createdUser);
      }

      if (workerId) {
        await toolService.replaceWorkerAssignments(
          workerId,
          selectedRole === USER_ROLES.WORKER ? selectedToolIds : [],
        );
      }

      // Persist the finance-access toggle only when it changed. Preserve any
      // other capability overrides the user already has (finance.manage is not
      // a projectAdmin default, so it lives purely in `granted`).
      if (
        workerId &&
        showFinanceToggle &&
        financeAccess !== initialFinanceAccess
      ) {
        const granted = new Set(permissionOverrides.granted || []);
        const revoked = new Set(permissionOverrides.revoked || []);
        if (financeAccess) {
          granted.add(FINANCE_PERMISSION);
          revoked.delete(FINANCE_PERMISSION);
        } else {
          granted.delete(FINANCE_PERMISSION);
          revoked.delete(FINANCE_PERMISSION);
        }
        await userService.updatePermissions(workerId, {
          granted: [...granted],
          revoked: [...revoked],
        });
      }

      showSuccess({
        title: isEditing
          ? t("createEmployee.updated")
          : t("createEmployee.invitationSent"),
        message: isEditing
          ? t("createEmployee.updatedMessage", {
              name: trimmedName || trimmedEmail,
            })
          : t("createEmployee.invitedMessage", {
              name: trimmedName || trimmedEmail,
            }),
      });
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save employee:", error);
      setFormError(
        getApiErrorMessage(
          error,
          isEditing
            ? t("createEmployee.updateError")
            : t("createEmployee.createError"),
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  if (!canManageEmployees(user?.role)) {
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
              {isEditing
                ? t("createEmployee.editTitle")
                : t("createEmployee.addTitle")}
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
            {isEditing
              ? t("createEmployee.editTitle")
              : t("createEmployee.addTitle")}
          </Text>
          <FloatingActionButton
            accessibilityLabel={t("common.save")}
            onPress={handleSaveEmployee}
            disabled={saving || loadingEmployee}
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
          {loadingEmployee ? (
            <View style={styles.inlineLoadingState}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : null}
          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <View style={styles.groupCard}>
            <PlainFormRow
              styles={styles}
              theme={theme}
              label={t("createEmployee.emailLabel")}
              value={email}
              onChangeText={setEmail}
              placeholder={t("createEmployee.emailPlaceholder")}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <PlainFormRow
              styles={styles}
              theme={theme}
              label={t("createEmployee.nameLabel")}
              value={name}
              onChangeText={setName}
              placeholder={t("createEmployee.namePlaceholder")}
              autoCapitalize="words"
            />
            <PlainFormRow
              styles={styles}
              theme={theme}
              label={t("myAccount.professionLabel")}
              value={profession}
              onChangeText={setProfession}
              placeholder={t("createEmployee.professionPlaceholder")}
              autoCapitalize="words"
            />
            <PlainFormRow
              styles={styles}
              theme={theme}
              label={t("createEmployee.phoneLabel")}
              value={phone}
              onChangeText={setPhone}
              placeholder="+46 701234567"
              keyboardType="phone-pad"
              isLast
            />
          </View>

          <View style={styles.groupCard}>
            <SelectRow
              styles={styles}
              icon="briefcase"
              label={t("createEmployee.addProject")}
              value={selectedProjectsLabel}
              placeholder={
                loadingProjects
                  ? t("projects.loading")
                  : t("createTask.selectProject")
              }
              onPress={() => setShowProjectModal(true)}
              theme={theme}
            />
            <SelectRow
              styles={styles}
              icon="flag"
              label={t("myAccount.roleLabel")}
              value={selectedRoleLabel}
              placeholder={t("createEmployee.selectRole")}
              onPress={() => setShowRoleModal(true)}
              theme={theme}
            />
            <SelectRow
              styles={styles}
              icon="globe"
              label={t("createEmployee.language", "Språk")}
              value={selectedLanguageLabel}
              placeholder={t("createEmployee.selectLanguage", "Välj språk")}
              onPress={() => setShowLanguageModal(true)}
              theme={theme}
              isLast={!isWorkerRole && !showFinanceToggle}
            />
            {isWorkerRole ? (
              <SelectRow
                styles={styles}
                icon="tool"
                label={t("createProject.attachInstruments")}
                value={selectedToolsLabel}
                placeholder={
                  loadingTools
                    ? t("createEmployee.loadingInstruments")
                    : t("createEmployee.selectInstruments")
                }
                onPress={() => setShowToolModal(true)}
                theme={theme}
                isLast
              />
            ) : null}
            {showFinanceToggle ? (
              <View style={styles.financeRow}>
                <View style={styles.financeIcon}>
                  <Icon name="dollar-sign" size={16} color="#0785F4" />
                </View>
                <View style={styles.financeCopy}>
                  <Text style={styles.financeLabel}>
                    {t("createEmployee.financeAccessLabel")}
                  </Text>
                  <Text style={styles.financeHint}>
                    {t("createEmployee.financeAccessHint")}
                  </Text>
                </View>
                <Switch
                  value={financeAccess}
                  onValueChange={setFinanceAccess}
                  trackColor={{ true: "#0785F4", false: "#D1D9E0" }}
                />
              </View>
            ) : null}
          </View>
        </ScrollView>

        <BottomBar
          onLeftPress={() => navigation.navigate("Main")}
          onRightPress={() => navigation.navigate("Menu")}
          showAddButton={false}
        />
      </View>

      <Modal
        visible={showRoleModal}
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <SafeAreaView style={styles.pickerModalContainer}>
          <View style={styles.pickerModalHeader}>
            <BackButton
              backgroundColor={theme.content.surfaceMuted}
              tint="light"
              borderColor="#FFFFFF50"
              onPress={() => setShowRoleModal(false)}
              iconSource={require("../../assets/Arrow-left.png")}
            />
            <Text
              style={[
                styles.pickerModalTitle,
                { fontFamily: theme.text.fontFamily.semiBold },
              ]}
            >
              {t("createEmployee.selectRole")}
            </Text>
            <View style={standardScreenHeaderPlaceholder} />
          </View>

          <ScrollView contentContainerStyle={styles.pickerListContent}>
            {roleOptions.map((option, index) => {
              const isSelected = selectedRole === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.pickerOptionRow,
                    index !== roleOptions.length - 1 && styles.groupRowDivider,
                  ]}
                  onPress={() => {
                    setSelectedRole(option.value);
                    setShowRoleModal(false);
                  }}
                >
                  <Text style={styles.pickerOptionLabel}>
                    {t(`roles.${option.value}`, option.label)}
                  </Text>
                  {isSelected ? (
                    <Icon name="check" size={18} color={theme.colors.primary} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showLanguageModal}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <SafeAreaView style={styles.pickerModalContainer}>
          <View style={styles.pickerModalHeader}>
            <BackButton
              backgroundColor={theme.content.surfaceMuted}
              tint="light"
              borderColor="#FFFFFF50"
              onPress={() => setShowLanguageModal(false)}
              iconSource={require("../../assets/Arrow-left.png")}
            />
            <Text
              style={[
                styles.pickerModalTitle,
                { fontFamily: theme.text.fontFamily.semiBold },
              ]}
            >
              {t("createEmployee.selectLanguage", "Välj språk")}
            </Text>
            <View style={standardScreenHeaderPlaceholder} />
          </View>

          <ScrollView contentContainerStyle={styles.pickerListContent}>
            {LANGUAGE_OPTIONS.map((option, index) => {
              const isSelected = selectedLanguage === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.pickerOptionRow,
                    index !== LANGUAGE_OPTIONS.length - 1 &&
                      styles.groupRowDivider,
                  ]}
                  onPress={() => {
                    setSelectedLanguage(option.value);
                    setShowLanguageModal(false);
                  }}
                >
                  <Text style={styles.pickerOptionLabel}>{option.label}</Text>
                  {isSelected ? (
                    <Icon name="check" size={18} color={theme.colors.primary} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
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
              {t("createEmployee.addProject")}
            </Text>
            <View style={standardScreenHeaderPlaceholder} />
          </View>

          <ScrollView contentContainerStyle={styles.pickerListContent}>
            {projects.length === 0 ? (
              <View style={styles.pickerEmptyState}>
                <Text style={styles.pickerEmptyStateText}>
                  {loadingProjects
                    ? t("projects.loading")
                    : t("projects.notFound")}
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

      <Modal
        visible={showToolModal}
        animationType="slide"
        onRequestClose={() => setShowToolModal(false)}
      >
        <SafeAreaView style={styles.pickerModalContainer}>
          <View style={styles.pickerModalHeader}>
            <BackButton
              backgroundColor={theme.content.surfaceMuted}
              tint="light"
              borderColor="#FFFFFF50"
              onPress={() => setShowToolModal(false)}
              iconSource={require("../../assets/Arrow-left.png")}
            />
            <Text
              style={[
                styles.pickerModalTitle,
                { fontFamily: theme.text.fontFamily.semiBold },
              ]}
            >
              {t("createProject.attachInstruments")}
            </Text>
            <View style={standardScreenHeaderPlaceholder} />
          </View>

          <ScrollView contentContainerStyle={styles.pickerListContent}>
            {tools.length === 0 ? (
              <View style={styles.pickerEmptyState}>
                <Text style={styles.pickerEmptyStateText}>
                  {loadingTools
                    ? t("createEmployee.loadingInstruments")
                    : t("tools.emptyTitle")}
                </Text>
              </View>
            ) : (
              tools.map((tool, index) => {
                const toolId = getEntityId(tool);
                const isSelected = selectedToolIds.includes(toolId);

                return (
                  <TouchableOpacity
                    key={toolId}
                    style={[
                      styles.pickerOptionRow,
                      index !== tools.length - 1 && styles.groupRowDivider,
                    ]}
                    onPress={() => toggleToolSelection(toolId)}
                  >
                    <Text style={styles.pickerOptionLabel}>{tool.name}</Text>
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
