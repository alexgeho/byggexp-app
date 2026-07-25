import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthContext from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { useTheme } from "../../theme/ThemeContext";
import { projectService, toolService, userService } from "../../services";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import FloatingActionButton from "../../components/common2/FloatingActionButton/FloatingActionButton";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../styles/screenLayout";
import {
  canManageEmployees,
  getCreatableRoleOptions,
  USER_ROLES,
} from "../../utils/userRoles";

const getEntityId = (entity) => {
  const id = entity?._id || entity?.id;
  return id ? String(id) : "";
};

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

const getApiErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) {
    return message.join(", ");
  }
  return message || error?.message || fallback;
};

const FieldIcon = ({ name, theme }) => (
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
        placeholderTextColor="rgba(5, 45, 80, 0.35)"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "auto"}
      />
    </View>
  </View>
);

const SelectRow = ({
  icon,
  label,
  value,
  placeholder,
  onPress,
  theme,
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
      <FieldIcon name={icon} theme={theme} />
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
    <Icon name="chevron-right" size={18} color="#052D50" />
  </TouchableOpacity>
);

export default function CreateEmployeeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
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
    return option?.label || "";
  }, [roleOptions, selectedRole]);

  const isWorkerRole = selectedRole === USER_ROLES.WORKER;

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
        setSelectedProjectIds(
          Array.isArray(data?.projects)
            ? data.projects.map((project) => getEntityId(project)).filter(Boolean)
            : [],
        );
        setSelectedToolIds(
          Array.isArray(data?.tools)
            ? data.tools.map((tool) => getEntityId(tool)).filter(Boolean)
            : [],
        );
      } catch (error) {
        console.error("Failed to load employee:", error);
        setFormError(getApiErrorMessage(error, "Unable to load employee."));
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
      setFormError("Please fill in email.");
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

      showSuccess({
        title: isEditing ? "Employee updated" : "Invitation sent",
        message: isEditing
          ? `${trimmedName || trimmedEmail} updated successfully.`
          : `${trimmedName || trimmedEmail} will receive an email with a password and confirmation link.`,
      });
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save employee:", error);
      setFormError(
        getApiErrorMessage(
          error,
          isEditing ? "Unable to update employee." : "Unable to create employee.",
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
              {isEditing ? "Edit employee" : "Add employee"}
            </Text>
            <View style={standardScreenHeaderPlaceholder} />
          </View>
          <View style={styles.accessDeniedContainer}>
            <Text style={styles.accessDeniedText}>Access denied</Text>
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
            {isEditing ? "Edit employee" : "Add employee"}
          </Text>
          <FloatingActionButton
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
              label="Email *"
              value={email}
              onChangeText={setEmail}
              placeholder="email@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <PlainFormRow
              label="First and Last name"
              value={name}
              onChangeText={setName}
              placeholder="Employee name"
              autoCapitalize="words"
            />
            <PlainFormRow
              label="Profession"
              value={profession}
              onChangeText={setProfession}
              placeholder="Worker profession"
              autoCapitalize="words"
            />
            <PlainFormRow
              label="Phone number"
              value={phone}
              onChangeText={setPhone}
              placeholder="+46 701234567"
              keyboardType="phone-pad"
              isLast
            />
          </View>

          <View style={styles.groupCard}>
            <SelectRow
              icon="briefcase"
              label="Add project"
              value={selectedProjectsLabel}
              placeholder={loadingProjects ? "Loading projects..." : "Select project"}
              onPress={() => setShowProjectModal(true)}
              theme={theme}
            />
            <SelectRow
              icon="flag"
              label="Role"
              value={selectedRoleLabel}
              placeholder="Select role"
              onPress={() => setShowRoleModal(true)}
              theme={theme}
              isLast={!isWorkerRole}
            />
            {isWorkerRole ? (
              <SelectRow
                icon="tool"
                label="Attach instruments"
                value={selectedToolsLabel}
                placeholder={loadingTools ? "Loading instruments..." : "Select instruments"}
                onPress={() => setShowToolModal(true)}
                theme={theme}
                isLast
              />
            ) : null}
          </View>

        </ScrollView>

        <BottomBar
          onLeftPress={() => navigation.navigate("Main")}
          onRightPress={() => navigation.navigate("Menu")}
          onAddPress={handleSaveEmployee}
          addDisabled={saving || loadingEmployee}
          renderAddContent={() =>
            saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon name="check" size={28} color="#FFFFFF" />
            )
          }
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
              backgroundColor="rgba(255, 255, 255, 0.6)"
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
              Select role
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
              backgroundColor="rgba(255, 255, 255, 0.6)"
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
              Add project
            </Text>
            <View style={standardScreenHeaderPlaceholder} />
          </View>

          <ScrollView contentContainerStyle={styles.pickerListContent}>
            {projects.length === 0 ? (
              <View style={styles.pickerEmptyState}>
                <Text style={styles.pickerEmptyStateText}>
                  {loadingProjects ? "Loading projects..." : "No projects found"}
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
                      <Icon name="check" size={18} color={theme.colors.primary} />
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
              backgroundColor="rgba(255, 255, 255, 0.6)"
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
              Attach instruments
            </Text>
            <View style={standardScreenHeaderPlaceholder} />
          </View>

          <ScrollView contentContainerStyle={styles.pickerListContent}>
            {tools.length === 0 ? (
              <View style={styles.pickerEmptyState}>
                <Text style={styles.pickerEmptyStateText}>
                  {loadingTools ? "Loading instruments..." : "No instruments found"}
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
                      <Icon name="check" size={18} color={theme.colors.primary} />
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EEEEEE",
  },
  pageContainer: {
    ...standardScreenContainer,
    paddingBottom: 0,
  },
  header: {
    ...standardScreenHeader,
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    textAlign: "center",
    flex: 1,
  },
  contentScroll: {
    flex: 1,
    width: "100%",
  },
  contentScrollContent: {
    paddingBottom: 140,
    gap: 20,
  },
  groupCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  groupedField: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  groupRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(5, 45, 80, 0.08)",
  },
  groupRowLast: {
    borderBottomWidth: 0,
  },
  fieldRowContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  fieldIconBadge: {
    width: 27,
    height: 27,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldInputWrap: {
    flex: 1,
    gap: 2,
  },
  fieldLabel: {
    fontSize: 12,
    color: "rgba(5, 45, 80, 0.55)",
  },
  fieldInput: {
    fontSize: 16,
    color: "#052D50",
    paddingVertical: 0,
  },
  fieldInputMultiline: {
    minHeight: 96,
    paddingTop: 4,
  },
  selectRow: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectValue: {
    fontSize: 16,
    color: "#052D50",
  },
  selectPlaceholder: {
    color: "rgba(5, 45, 80, 0.35)",
  },
  formError: {
    color: "#c62828",
    fontSize: 14,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  inlineLoadingState: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  accessDeniedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  accessDeniedText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#151515",
  },
  pickerModalContainer: {
    flex: 1,
    backgroundColor: "#EEEEEE",
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  pickerModalHeader: {
    ...standardScreenHeader,
    marginBottom: 12,
  },
  pickerModalTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    color: "#052D50",
  },
  pickerListContent: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    overflow: "hidden",
  },
  pickerOptionRow: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerOptionLabel: {
    fontSize: 16,
    color: "#052D50",
    flex: 1,
    paddingRight: 12,
  },
  pickerEmptyState: {
    minHeight: 56,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  pickerEmptyStateText: {
    fontSize: 16,
    color: "rgba(5, 45, 80, 0.55)",
  },
});
