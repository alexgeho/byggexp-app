import React, { useContext, useMemo, useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthContext from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { useTheme } from "../../theme/ThemeContext";
import { userService } from "../../services";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../styles/screenLayout";
import {
  canManageEmployees,
  getCreatableRoleOptions,
} from "../../utils/userRoles";

const parseOptionalNumber = (value) => {
  const normalized = String(value || "").replace(/\D/g, "");
  return normalized ? parseInt(normalized, 10) : undefined;
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

const FormRow = ({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  theme,
  isLast = false,
}) => (
  <View
    style={[
      styles.groupedField,
      !isLast && styles.groupRowDivider,
      isLast && styles.groupRowLast,
    ]}
  >
    <View style={styles.fieldRowContent}>
      <FieldIcon name={icon} theme={theme} />
      <View style={styles.fieldInputWrap}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(5, 45, 80, 0.35)"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </View>
    </View>
  </View>
);

export default function CreateEmployeeScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const { showSuccess } = useFeedback();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profession, setProfession] = useState("");
  const [phoneAreaCode, setPhoneAreaCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
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

  React.useEffect(() => {
    if (!selectedRole && roleOptions[0]?.value) {
      setSelectedRole(roleOptions[0].value);
    }
  }, [roleOptions, selectedRole]);

  const handleCreateEmployee = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const areaCode = parseOptionalNumber(phoneAreaCode);
    const phone = parseOptionalNumber(phoneNumber);

    if (!trimmedName || !trimmedEmail) {
      setFormError("Please fill in name and email.");
      return;
    }

    if (!areaCode || !phone) {
      setFormError("Please enter a valid phone area code and number.");
      return;
    }

    if (!selectedRole) {
      setFormError("Please select a role.");
      return;
    }

    setFormError("");
    setSaving(true);

    try {
      const payload = {
        name: trimmedName,
        email: trimmedEmail,
        phoneAreaCode: areaCode,
        phoneNumber: phone,
        role: selectedRole,
        inviteViaEmail: true,
      };

      if (profession.trim()) {
        payload.profession = profession.trim();
      }

      if (user?.role === "companyAdmin" && user?.companyId) {
        payload.companyId = user.companyId;
      }

      await userService.create(payload);
      showSuccess({
        title: "Invitation sent",
        message: `${trimmedName} will receive an email with a password and confirmation link.`,
      });
      navigation.goBack();
    } catch (error) {
      console.error("Failed to create employee:", error);
      setFormError(getApiErrorMessage(error, "Unable to create employee."));
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
              Add employee
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
            Add employee
          </Text>
          <View style={standardScreenHeaderPlaceholder} />
        </View>

        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <Text style={styles.formSectionTitle}>Profile</Text>
          <View style={styles.groupCard}>
            <FormRow
              icon="user"
              label="Full name *"
              value={name}
              onChangeText={setName}
              placeholder="Employee name"
              autoCapitalize="words"
              theme={theme}
            />
            <FormRow
              icon="mail"
              label="Email *"
              value={email}
              onChangeText={setEmail}
              placeholder="email@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              theme={theme}
            />
            <FormRow
              icon="briefcase"
              label="Profession"
              value={profession}
              onChangeText={setProfession}
              placeholder="Electrician"
              autoCapitalize="words"
              theme={theme}
              isLast
            />
          </View>

          <Text style={styles.formSectionTitle}>Contact</Text>
          <View style={styles.groupCard}>
            <FormRow
              icon="hash"
              label="Phone area code *"
              value={phoneAreaCode}
              onChangeText={setPhoneAreaCode}
              placeholder="46"
              keyboardType="number-pad"
              theme={theme}
            />
            <FormRow
              icon="phone"
              label="Phone number *"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="701234567"
              keyboardType="number-pad"
              theme={theme}
              isLast
            />
          </View>

          <Text style={styles.formSectionTitle}>Access</Text>
          <View style={styles.groupCard}>
            <TouchableOpacity
              style={[styles.selectRow, styles.groupRowLast]}
              onPress={() => setShowRoleModal(true)}
              activeOpacity={0.85}
            >
              <View style={styles.fieldRowContent}>
                <FieldIcon name="shield" theme={theme} />
                <View style={styles.fieldInputWrap}>
                  <Text style={styles.fieldLabel}>Role *</Text>
                  <Text
                    style={[
                      styles.selectValue,
                      !selectedRoleLabel && styles.selectPlaceholder,
                    ]}
                  >
                    {selectedRoleLabel || "Select role"}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={18} color="#052D50" />
            </TouchableOpacity>
          </View>

          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Email invitation</Text>
            <Text style={styles.noteText}>
              A temporary password and confirmation link will be sent by email.
              After opening the link, the employee is signed in automatically.
            </Text>
          </View>
        </ScrollView>

        <BottomBar
          onLeftPress={() => navigation.navigate("Main")}
          onRightPress={() => navigation.navigate("Menu")}
          onAddPress={handleCreateEmployee}
          addDisabled={saving}
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
        <SafeAreaView style={styles.roleModalContainer}>
          <View style={styles.roleModalHeader}>
            <BackButton
              backgroundColor="rgba(255, 255, 255, 0.6)"
              tint="light"
              borderColor="#FFFFFF50"
              onPress={() => setShowRoleModal(false)}
              iconSource={require("../../assets/Arrow-left.png")}
            />
            <Text
              style={[
                styles.roleModalTitle,
                { fontFamily: theme.text.fontFamily.semiBold },
              ]}
            >
              Select role
            </Text>
            <View style={standardScreenHeaderPlaceholder} />
          </View>

          <ScrollView contentContainerStyle={styles.roleListContent}>
            {roleOptions.map((option, index) => {
              const isSelected = selectedRole === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.roleOptionRow,
                    index !== roleOptions.length - 1 && styles.groupRowDivider,
                  ]}
                  onPress={() => {
                    setSelectedRole(option.value);
                    setShowRoleModal(false);
                  }}
                >
                  <Text style={styles.roleOptionLabel}>{option.label}</Text>
                  {isSelected ? (
                    <Icon name="check" size={18} color={theme.colors.primary} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
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
    gap: 4,
  },
  formSectionTitle: {
    color: "#698196",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  groupCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 20,
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
  noteCard: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    gap: 6,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#052D50",
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#5a6b7d",
  },
  formError: {
    color: "#c62828",
    fontSize: 14,
    marginBottom: 8,
    paddingHorizontal: 8,
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
  roleModalContainer: {
    flex: 1,
    backgroundColor: "#EEEEEE",
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  roleModalHeader: {
    ...standardScreenHeader,
    marginBottom: 12,
  },
  roleModalTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    color: "#052D50",
  },
  roleListContent: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    overflow: "hidden",
  },
  roleOptionRow: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roleOptionLabel: {
    fontSize: 16,
    color: "#052D50",
  },
});
