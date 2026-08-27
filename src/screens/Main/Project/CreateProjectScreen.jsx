import { getDateLocale } from "../../../utils/dateLocale";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Switch,
  Keyboard,
} from "react-native";
import { useTheme } from "../../../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Icon from "react-native-vector-icons/Feather";
import AuthContext from "../../../contexts/AuthContext";
import { useFeedback } from "../../../contexts/FeedbackContext";
import {
  projectService,
  toolService,
  userService,
  companyService,
} from "../../../services";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { shiftLocationPolicy } from "../../../config/shiftLocationPolicy";
import { useAddressSearch } from "../../../hooks/useAddressSearch";
import { useReverseGeocode } from "../../../hooks/useReverseGeocode";
import { pickUploadAssets } from "../../../utils/uploadPicker";
import {
  SHIFT_GRACE_MINUTE_OPTIONS,
  buildShiftSchedulePayload,
  createDefaultShiftSchedule,
  parseTimeFromDate,
  parseTimeStringToDate,
} from "../../../utils/shiftSchedule";
import { canCreateProjects } from "../../../utils/userRoles";

import FloatingActionButton from "../../../components/common/FloatingActionButton/FloatingActionButton";
import { createStyles } from "./CreateProjectScreen.styles";
import {
  FieldIcon,
  ToolsListModal,
  WorkersListModal,
  CompaniesListModal,
  SingleUserPickerModal,
  ProjectDatePickerModal,
  WorkTimePickerModal,
  LocationPickerModal,
  EconomySection,
  ContractSection,
} from "./CreateProjectScreen.parts";
import {
  getDocumentTypeMeta,
  isImageDocument,
} from "../../../utils/documentPreview";

export default function CreateProjectScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const { showSuccess } = useFeedback();
  const { user, hasPermission } = useContext(AuthContext);
  const allowedToCreate = canCreateProjects(user?.role);
  // Financial fields (budget, rates, materials) are only shown to users who can
  // manage finance — same capability as the admin panel's Economy section.
  const canSeeFinance = hasPermission ? hasPermission("finance.manage") : false;

  const [projectName, setProjectName] = useState("");
  // Contract / economy fields (mirrors the admin project form).
  const [contractNumber, setContractNumber] = useState("");
  const [littera, setLittera] = useState("");
  const [budget, setBudget] = useState("");
  const [plannedHours, setPlannedHours] = useState("");
  const [plannedMaterialsCost, setPlannedMaterialsCost] = useState("");
  const [spentMaterialsCost, setSpentMaterialsCost] = useState("");
  const [costRatePerHour, setCostRatePerHour] = useState("");
  const [billRatePerHour, setBillRatePerHour] = useState("");
  const [isProjectNameFocused, setIsProjectNameFocused] = useState(false);
  const [useLocationAsName, setUseLocationAsName] = useState(true);
  const [note, setNote] = useState("");
  const [location, setLocation] = useState("");
  const [locationRadiusMeters, setLocationRadiusMeters] = useState(
    shiftLocationPolicy.maxDistanceMeters,
  );
  const [selectedCoordinate, setSelectedCoordinate] = useState(null);
  const [isLocationPickerVisible, setIsLocationPickerVisible] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const {
    suggestions: locationSuggestions,
    loading: isLocationSearchLoading,
    clearSuggestions: clearLocationSuggestions,
  } = useAddressSearch(locationSearch, isLocationPickerVisible);
  const { resolveAddress, cacheAddress } = useReverseGeocode();
  const [beginningDate, setBeginningDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const defaultShiftSchedule = createDefaultShiftSchedule();
  const [shiftScheduleEnabled, setShiftScheduleEnabled] = useState(
    defaultShiftSchedule.enabled,
  );
  const [workDayStartTime, setWorkDayStartTime] = useState(() =>
    parseTimeStringToDate(defaultShiftSchedule.workDayStartTime),
  );
  const [workDayEndTime, setWorkDayEndTime] = useState(() =>
    parseTimeStringToDate(defaultShiftSchedule.workDayEndTime),
  );
  const [startGraceMinutes, setStartGraceMinutes] = useState(
    defaultShiftSchedule.startGraceMinutes,
  );
  const [endGraceMinutes, setEndGraceMinutes] = useState(
    defaultShiftSchedule.endGraceMinutes,
  );
  const [showWorkStartPicker, setShowWorkStartPicker] = useState(false);
  const [showWorkEndPicker, setShowWorkEndPicker] = useState(false);

  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);
  const [selectedClientCompany, setSelectedClientCompany] = useState(null);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [tools, setTools] = useState([]);
  const [selectedTools, setSelectedTools] = useState([]);

  const [showOwnersModal, setShowOwnersModal] = useState(false);
  const [showManagersModal, setShowManagersModal] = useState(false);
  const [showCompaniesModal, setShowCompaniesModal] = useState(false);
  const [showWorkersModal, setShowWorkersModal] = useState(false);
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [workerSearch, setWorkerSearch] = useState("");
  const [toolSearch, setToolSearch] = useState("");
  const [ownerSearch, setOwnerSearch] = useState("");
  const [managerSearch, setManagerSearch] = useState("");
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [pendingTools, setPendingTools] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const projectNameLabelAnim = useRef(new Animated.Value(0)).current;
  const isLocationLoadingRef = useRef(false);
  const locationSearchInputRef = useRef(null);

  useEffect(() => {
    fetchUsersAndCompanies();
  }, []);

  useEffect(() => {
    Animated.timing(projectNameLabelAnim, {
      toValue: isProjectNameFocused || !!projectName ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isProjectNameFocused, projectName, projectNameLabelAnim]);

  useEffect(() => {
    if (useLocationAsName) {
      setProjectName(location);
    }
  }, [useLocationAsName, location]);

  const handleProjectNameFocus = useCallback(() => {
    setIsProjectNameFocused(true);
    setUseLocationAsName(false);
  }, []);

  const fetchUsersAndCompanies = async () => {
    try {
      if (user?.role === "superadmin") {
        const [allCompanies, allUsers, toolsData] = await Promise.all([
          companyService.getAll(),
          userService.getAll(),
          toolService.getAll(),
        ]);
        setCompanies(allCompanies);
        setUsers(allUsers);
        setTools(Array.isArray(toolsData) ? toolsData : []);

        const initialCompanyId = allCompanies[0]?._id || null;
        setSelectedClientCompany(initialCompanyId);
      } else {
        // For companyAdmin / projectAdmin use their own company
        const myCompany = await companyService.getMyCompany();
        setCompanies([myCompany]);
        setSelectedClientCompany(myCompany._id);

        const [usersData, toolsData] = await Promise.all([
          userService.getMyCompanyUsers(),
          toolService.getAll(),
        ]);
        setUsers(usersData);
        setTools(Array.isArray(toolsData) ? toolsData : []);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert(
        t("common.error"),
        t("createProject.loadDataError", { message: error.message }),
      );
      setLoading(false);
    }
  };

  const handleSelectUser = (userId, type) => {
    switch (type) {
      case "owner":
        setSelectedOwner(userId);
        setShowOwnersModal(false);
        break;
      case "manager":
        setSelectedManager(userId);
        setShowManagersModal(false);
        break;
    }
  };

  const handleSelectCompany = (companyId) => {
    setSelectedClientCompany(companyId);
    setSelectedOwner(null);
    setSelectedManager(null);
    setSelectedWorkers([]);
    setShowCompaniesModal(false);
  };

  const togglePendingWorkerSelection = (workerId) => {
    setPendingWorkers((prev) => {
      if (prev.includes(workerId)) {
        return prev.filter((id) => id !== workerId);
      }

      return [...prev, workerId];
    });
  };

  const openWorkersModal = () => {
    setPendingWorkers(selectedWorkers);
    setWorkerSearch("");
    setShowWorkersModal(true);
  };

  const closeWorkersModal = () => {
    setShowWorkersModal(false);
    setWorkerSearch("");
    setPendingWorkers([]);
  };

  const saveWorkersSelection = () => {
    setSelectedWorkers(pendingWorkers);
    closeWorkersModal();
  };

  const openToolsModal = () => {
    setPendingTools(selectedTools);
    setToolSearch("");
    setShowToolsModal(true);
  };

  const closeToolsModal = () => {
    setShowToolsModal(false);
    setToolSearch("");
    setPendingTools([]);
  };

  const togglePendingToolSelection = (toolId) => {
    setPendingTools((prev) => {
      if (prev.includes(toolId)) {
        return prev.filter((id) => id !== toolId);
      }

      return [...prev, toolId];
    });
  };

  const saveToolsSelection = () => {
    setSelectedTools(pendingTools);
    closeToolsModal();
  };

  const pickDocuments = async () => {
    try {
      const pickedAssets = await pickUploadAssets({
        fileNamePrefix: "project-document",
      });

      if (!pickedAssets.length) {
        return;
      }

      setSelectedDocuments((prev) => {
        const existingUris = new Set(prev.map((item) => item.uri));
        const nextDocuments = pickedAssets.filter(
          (item) => !existingUris.has(item.uri),
        );
        return [...prev, ...nextDocuments];
      });
    } catch (error) {
      console.error("Error picking documents:", error);
      Alert.alert(
        t("createTask.documentsErrorTitle"),
        t("createTask.documentsErrorMessage"),
      );
    }
  };

  const closeLocationPicker = () => {
    setIsLocationPickerVisible(false);
    setLocationSearch(location);
    clearLocationSuggestions();
  };

  const confirmLocationPickerSelection = () => {
    if (!selectedCoordinate) {
      Alert.alert(
        t("createProject.locationRequiredTitle"),
        t("createProject.locationRequiredMessage"),
      );
      return;
    }

    closeLocationPicker();
  };

  const closeDatePickers = () => {
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
  };

  const closeWorkTimePickers = () => {
    setShowWorkStartPicker(false);
    setShowWorkEndPicker(false);
  };

  const pickGraceMinutes = (title, onSelect) => {
    Alert.alert(title, undefined, [
      ...SHIFT_GRACE_MINUTE_OPTIONS.map((minutes) => ({
        text: t("createProject.minutesShort", { minutes }),
        onPress: () => onSelect(minutes),
      })),
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  const setLocationLoadingState = (value) => {
    isLocationLoadingRef.current = value;
    setIsLocationLoading(value);
  };

  const applyResolvedLocation = async (
    latitude,
    longitude,
    resolvedAddressText,
  ) => {
    setSelectedCoordinate({ latitude, longitude });

    if (resolvedAddressText) {
      setLocation(resolvedAddressText);
      setLocationSearch(resolvedAddressText);
      cacheAddress(latitude, longitude, resolvedAddressText);
      return;
    }

    const resolvedAddress = await resolveAddress(latitude, longitude);
    if (resolvedAddress) {
      setLocation(resolvedAddress);
      setLocationSearch(resolvedAddress);
      return;
    }

    const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    setLocation(fallbackAddress);
    setLocationSearch(fallbackAddress);
  };

  // Dragging the map pin (or tapping the map) sets the coordinate directly and
  // reverse-geocodes it into the address text. No full-screen loading state —
  // the reverse geocoder is throttled and the pin stays responsive.
  const handlePickMapCoordinate = async (latitude, longitude) => {
    await applyResolvedLocation(latitude, longitude);
  };

  const openLocationPicker = () => {
    setLocationSearch(location);
    clearLocationSuggestions();
    setIsLocationPickerVisible(true);
  };

  const handleSelectLocationSuggestion = async (suggestion) => {
    if (isLocationLoadingRef.current) {
      return;
    }

    locationSearchInputRef.current?.blur();
    Keyboard.dismiss();

    setLocationLoadingState(true);
    try {
      await applyResolvedLocation(
        suggestion.latitude,
        suggestion.longitude,
        suggestion.label,
      );
    } finally {
      setLocationLoadingState(false);
    }
  };

  const createProject = async () => {
    if (!projectName) {
      Alert.alert(
        t("createProject.validationTitle"),
        t("createProject.nameRequired"),
      );
      return;
    }

    setSaving(true);

    try {
      const projectData = new FormData();

      // The Owner field was removed from the form — the creator is the owner.
      const ownerId = selectedOwner || user?._id || user?.id;
      if (ownerId) {
        projectData.append("ownerId", ownerId);
      }

      if (selectedManager) {
        projectData.append("projectManagerId", selectedManager);
      }

      if (selectedClientCompany) {
        projectData.append("clientCompanyId", selectedClientCompany);
      }

      projectData.append("name", projectName);
      projectData.append("status", "planning");

      if (location) {
        projectData.append("location", location);
      }

      if (selectedCoordinate) {
        projectData.append(
          "locationLatitude",
          String(selectedCoordinate.latitude),
        );
        projectData.append(
          "locationLongitude",
          String(selectedCoordinate.longitude),
        );
      }

      projectData.append("locationRadiusMeters", String(locationRadiusMeters));

      projectData.append(
        "shiftSchedule",
        JSON.stringify(
          buildShiftSchedulePayload({
            enabled: shiftScheduleEnabled,
            workDayStartTime: parseTimeFromDate(workDayStartTime),
            workDayEndTime: parseTimeFromDate(workDayEndTime),
            startGraceMinutes,
            endGraceMinutes,
          }),
        ),
      );

      if (beginningDate) {
        projectData.append("beginningDate", beginningDate.toISOString());
      }

      if (endDate) {
        projectData.append("endDate", endDate.toISOString());
      }

      if (note) {
        projectData.append("description", note);
      }

      if (contractNumber.trim()) {
        projectData.append("contractNumber", contractNumber.trim());
      }
      if (littera.trim()) {
        projectData.append("littera", littera.trim());
      }

      // Financial figures — only sent by users allowed to manage finance.
      if (canSeeFinance) {
        const appendAmount = (key, raw) => {
          const parsed = parseFloat(String(raw).replace(",", "."));
          if (!Number.isNaN(parsed)) {
            projectData.append(key, String(parsed));
          }
        };
        appendAmount("budget", budget);
        appendAmount("plannedHours", plannedHours);
        appendAmount("plannedMaterialsCost", plannedMaterialsCost);
        appendAmount("spentMaterialsCost", spentMaterialsCost);
        appendAmount("costRatePerHour", costRatePerHour);
        appendAmount("billRatePerHour", billRatePerHour);
      }

      if (selectedWorkers.length > 0) {
        projectData.append("workers", JSON.stringify(selectedWorkers));
      }

      selectedDocuments.forEach((item, index) => {
        projectData.append("documents", {
          uri: item.uri,
          name: item.name || `document-${index + 1}`,
          type: item.mimeType || "application/octet-stream",
        });
      });

      const result = await projectService.create(projectData);
      const projectId = result?._id || result?.id;

      if (selectedTools.length > 0 && projectId) {
        await toolService.attachToProject(String(projectId), selectedTools);
      }

      showSuccess({
        title: t("createProject.created"),
        message: t("createProject.createdMessage"),
      });

      navigation.goBack();
    } catch (error) {
      console.error("Error creating project:", error);
      Alert.alert(
        t("common.error"),
        error.message || t("createProject.createError"),
      );
    } finally {
      setSaving(false);
    }
  };

  const getFilteredUsers = (searchValue) => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return users;
    }

    return users.filter((item) => {
      const searchableText = [item.name, item.profession, item.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  };

  // Only role=worker can be added to a project team — the backend rejects any
  // other role. Managers/admins are assigned through the admin panel.
  const availableWorkers = useMemo(
    () => users.filter((item) => item.role === "worker"),
    [users],
  );
  const normalizedWorkerSearch = workerSearch.trim().toLowerCase();
  const filteredWorkers = useMemo(() => {
    if (!normalizedWorkerSearch) {
      return availableWorkers;
    }

    return availableWorkers.filter((worker) => {
      const searchableText = [worker.name, worker.profession, worker.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedWorkerSearch);
    });
  }, [availableWorkers, normalizedWorkerSearch]);

  const selectedWorkersLabel =
    selectedWorkers.length > 0
      ? t("createProject.workerCount", { count: selectedWorkers.length })
      : "";

  const normalizedToolSearch = toolSearch.trim().toLowerCase();
  const filteredTools = useMemo(() => {
    if (!normalizedToolSearch) {
      return tools;
    }

    return tools.filter((tool) => {
      const searchableText = [tool.name, tool.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedToolSearch);
    });
  }, [tools, normalizedToolSearch]);

  const selectedToolsLabel =
    selectedTools.length > 0
      ? t("createProject.instrumentCount", { count: selectedTools.length })
      : "";

  const filteredOwners = getFilteredUsers(ownerSearch);
  const filteredManagers = getFilteredUsers(managerSearch);

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.pageContainer}>
          <View style={styles.header}>
            <BackButton
              onPress={() => navigation.goBack()}
              iconSource={require("../../../assets/Arrow-left.png")}
            />

            <Text
              style={[
                styles.headerTitle,
                { fontFamily: theme.text.fontFamily["semiBold"] },
              ]}
            >
              {t("createProject.title")}
            </Text>

            <View style={styles.placeholder} />
          </View>

          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0091FF" />
            <Text>{t("common.loading")}</Text>
          </View>
        </View>
      </View>
    );
  }

  const fieldIconBadgeStyle = {
    backgroundColor: theme.colors.primaryIconBadge,
  };
  const themedCheckboxStyle = {
    borderColor: `${theme.colors.primary}66`,
  };
  const themedCheckboxSelectedStyle = {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  };
  const locationSearchEmptyText =
    locationSearch.trim().length < 2
      ? t("createProject.searchHint")
      : t("createProject.noAddresses");
  const showLocationSearchHint =
    locationSearch.trim().length < 2 &&
    !isLocationLoading &&
    !isLocationSearchLoading &&
    !locationSuggestions.length;

  if (!allowedToCreate) {
    return (
      <View style={styles.accessDeniedContainer}>
        <Text style={styles.accessDeniedText}>{t("access.denied")}</Text>
        <Text style={styles.accessDeniedSubtext}>
          {t("access.onlyCompanyAdminsCreateProjects")}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{t("common.goBack")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* RENDER SCREEN */
  return (
    <View style={styles.screen}>
      <View style={styles.pageContainer}>
        {/* HEADER ======================================= */}
        <View style={styles.header}>
          <BackButton
            onPress={() => navigation.goBack()}
            iconSource={require("../../../assets/Arrow-left.png")}
          />
          <Text
            style={[
              styles.headerTitle,
              { fontFamily: theme.text.fontFamily["semiBold"] },
            ]}
          >
            {t("createProject.title")}
          </Text>

          {/* FloatingActionButton ======================================= */}
          <FloatingActionButton
            accessibilityLabel={t("common.save")}
            onPress={createProject}
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
          <View style={styles.groupCard}>
            <TouchableOpacity
              style={[
                styles.locationField,
                styles.groupedField,
                styles.groupRowDivider,
              ]}
              onPress={openLocationPicker}
              activeOpacity={0.85}
            >
              <View style={styles.locationFieldContent}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.locationFieldText,
                    location
                      ? styles.locationFieldValue
                      : styles.locationFieldPlaceholder,
                  ]}
                >
                  {location || t("createProject.location")}
                </Text>
              </View>
              <Icon
                name="chevron-right"
                size={18}
                color={theme.content.textPrimary}
              />
            </TouchableOpacity>

            <View
              style={[
                styles.switchField,
                styles.groupedField,
                styles.groupRowDivider,
              ]}
            >
              <Text style={styles.switchLabel}>
                {t("createProject.useLocationAsName")}
              </Text>
              <Switch
                value={useLocationAsName}
                onValueChange={setUseLocationAsName}
                trackColor={{ false: "#D9E3EC", true: theme.colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#D9E3EC"
                style={styles.switchControl}
              />
            </View>

            <View
              style={[
                styles.projectNameField,
                styles.groupedField,
                styles.groupRowLast,
              ]}
            >
              <Animated.Text
                pointerEvents="none"
                style={[
                  styles.floatingLabel,
                  {
                    top: projectNameLabelAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 8],
                    }),
                    fontSize: projectNameLabelAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 12],
                    }),
                  },
                ]}
              >
                {t("createProject.projectNameLabel")}
              </Animated.Text>
              <TextInput
                style={styles.floatingInput}
                value={projectName}
                onChangeText={setProjectName}
                onFocus={handleProjectNameFocus}
                onBlur={() => setIsProjectNameFocused(false)}
              />
            </View>
          </View>

          <View style={styles.noteGroup}>
            <TextInput
              multiline={true}
              placeholder={t("createProject.note")}
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
            />
          </View>

          <View style={styles.groupCard}>
            <TouchableOpacity
              style={[
                styles.locationField,
                styles.groupedField,
                styles.groupRowDivider,
              ]}
              onPress={openWorkersModal}
              activeOpacity={0.85}
            >
              <View style={styles.locationFieldContent}>
                <View
                  style={[
                    styles.locationFieldIconContainer,
                    fieldIconBadgeStyle,
                  ]}
                >
                  <FieldIcon name="users" size={14} color="#FFFFFF" />
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.locationFieldText,
                    selectedWorkers.length
                      ? styles.locationFieldValue
                      : styles.locationFieldPlaceholder,
                  ]}
                >
                  {selectedWorkersLabel || t("createProject.projectTeam")}
                </Text>
              </View>
              <Icon
                name="chevron-right"
                size={18}
                color={theme.content.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.locationField,
                styles.groupedField,
                styles.groupRowLast,
              ]}
              onPress={() => setShowManagersModal(true)}
              activeOpacity={0.85}
            >
              <View style={styles.locationFieldContent}>
                <View
                  style={[
                    styles.locationFieldIconContainer,
                    fieldIconBadgeStyle,
                  ]}
                >
                  <FieldIcon name="briefcase" size={14} color="#FFFFFF" />
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.locationFieldText,
                    selectedManager
                      ? styles.locationFieldValue
                      : styles.locationFieldPlaceholder,
                  ]}
                >
                  {users.find((u) => u._id === selectedManager)?.name ||
                    t("createProject.projectManager")}
                </Text>
              </View>
              <Icon
                name="chevron-right"
                size={18}
                color={theme.content.textPrimary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.groupCard}>
            <TouchableOpacity
              style={[
                styles.locationField,
                styles.groupedField,
                styles.groupRowDivider,
              ]}
              onPress={openToolsModal}
              activeOpacity={0.85}
            >
              <View style={styles.locationFieldContent}>
                <View
                  style={[
                    styles.locationFieldIconContainer,
                    fieldIconBadgeStyle,
                  ]}
                >
                  <FieldIcon name="tool" size={14} color="#FFFFFF" />
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.locationFieldText,
                    selectedTools.length
                      ? styles.locationFieldValue
                      : styles.locationFieldPlaceholder,
                  ]}
                >
                  {selectedToolsLabel || t("createProject.attachInstruments")}
                </Text>
              </View>
              <Icon
                name="chevron-right"
                size={18}
                color={theme.content.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.locationField,
                styles.groupedField,
                styles.groupRowLast,
              ]}
              onPress={pickDocuments}
              activeOpacity={0.85}
            >
              <View style={styles.locationFieldContent}>
                <View
                  style={[
                    styles.locationFieldIconContainer,
                    fieldIconBadgeStyle,
                  ]}
                >
                  <FieldIcon name="paperclip" size={14} color="#FFFFFF" />
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.locationFieldText,
                    selectedDocuments.length
                      ? styles.locationFieldValue
                      : styles.locationFieldPlaceholder,
                  ]}
                >
                  {selectedDocuments.length
                    ? t("createProject.documentCount", {
                        count: selectedDocuments.length,
                      })
                    : t("project.tabs.documents")}
                </Text>
              </View>
              <Icon
                name="chevron-right"
                size={18}
                color={theme.content.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {selectedDocuments.length ? (
            <View style={styles.documentsGrid}>
              {selectedDocuments.map((document, index) => {
                const typeMeta = getDocumentTypeMeta(document);
                const isImage = isImageDocument(document);

                return (
                  <View
                    key={`${document.uri}-${index}`}
                    style={styles.documentCard}
                  >
                    {isImage ? (
                      <Image
                        source={{ uri: document.uri }}
                        style={styles.documentImage}
                      />
                    ) : (
                      <View style={styles.documentFileContent}>
                        <Text numberOfLines={2} style={styles.documentName}>
                          {document.name}
                        </Text>
                        <View style={styles.documentMetaRow}>
                          <Icon
                            name={typeMeta.icon}
                            size={12}
                            color={theme.content.textPrimary}
                          />
                          <Text style={styles.documentMetaText}>
                            {typeMeta.label}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={styles.groupCard}>
            <View
              style={[
                styles.switchField,
                styles.groupedField,
                styles.groupRowDivider,
              ]}
            >
              <View style={styles.locationFieldContent}>
                <View
                  style={[
                    styles.locationFieldIconContainer,
                    fieldIconBadgeStyle,
                  ]}
                >
                  <FieldIcon name="clock" size={14} color="#FFFFFF" />
                </View>
                <Text style={styles.switchLabel}>
                  {t("createProject.limitShiftByHours")}
                </Text>
              </View>
              <Switch
                value={shiftScheduleEnabled}
                onValueChange={setShiftScheduleEnabled}
                trackColor={{ false: "#D9E3EC", true: theme.colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#D9E3EC"
                style={styles.switchControl}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.groupedDateRow,
                styles.groupRowDivider,
                !shiftScheduleEnabled && styles.groupRowDisabled,
              ]}
              onPress={() =>
                shiftScheduleEnabled && setShowWorkStartPicker(true)
              }
              activeOpacity={0.85}
              disabled={!shiftScheduleEnabled}
            >
              <View style={styles.locationFieldContent}>
                <View
                  style={[
                    styles.locationFieldIconContainer,
                    fieldIconBadgeStyle,
                  ]}
                >
                  <FieldIcon name="clock" size={14} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.dateLabel}>
                    {t("createProject.workDayStarts")}
                  </Text>
                  <Text style={styles.dateValue}>
                    {parseTimeFromDate(workDayStartTime)}
                  </Text>
                </View>
              </View>
              <Icon
                name="chevron-right"
                size={18}
                color={theme.content.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.groupedDateRow,
                styles.groupRowDivider,
                !shiftScheduleEnabled && styles.groupRowDisabled,
              ]}
              onPress={() => shiftScheduleEnabled && setShowWorkEndPicker(true)}
              activeOpacity={0.85}
              disabled={!shiftScheduleEnabled}
            >
              <View style={styles.locationFieldContent}>
                <View
                  style={[
                    styles.locationFieldIconContainer,
                    fieldIconBadgeStyle,
                  ]}
                >
                  <FieldIcon name="clock" size={14} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.dateLabel}>
                    {t("createProject.workDayEnds")}
                  </Text>
                  <Text style={styles.dateValue}>
                    {parseTimeFromDate(workDayEndTime)}
                  </Text>
                </View>
              </View>
              <Icon
                name="chevron-right"
                size={18}
                color={theme.content.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.groupedDateRow,
                styles.groupRowDivider,
                !shiftScheduleEnabled && styles.groupRowDisabled,
              ]}
              onPress={() =>
                shiftScheduleEnabled &&
                pickGraceMinutes(
                  t("createProject.startGracePrompt"),
                  setStartGraceMinutes,
                )
              }
              activeOpacity={0.85}
              disabled={!shiftScheduleEnabled}
            >
              <View style={styles.locationFieldContent}>
                <View
                  style={[
                    styles.locationFieldIconContainer,
                    fieldIconBadgeStyle,
                  ]}
                >
                  <FieldIcon name="clock" size={14} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.dateLabel}>
                    {t("createProject.startGrace")}
                  </Text>
                  <Text style={styles.dateValue}>
                    {t("createProject.minutesShort", {
                      minutes: startGraceMinutes,
                    })}
                  </Text>
                </View>
              </View>
              <Icon
                name="chevron-right"
                size={18}
                color={theme.content.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.groupedDateRow,
                styles.groupRowLast,
                !shiftScheduleEnabled && styles.groupRowDisabled,
              ]}
              onPress={() =>
                shiftScheduleEnabled &&
                pickGraceMinutes(
                  t("createProject.endGracePrompt"),
                  setEndGraceMinutes,
                )
              }
              activeOpacity={0.85}
              disabled={!shiftScheduleEnabled}
            >
              <View style={styles.locationFieldContent}>
                <View
                  style={[
                    styles.locationFieldIconContainer,
                    fieldIconBadgeStyle,
                  ]}
                >
                  <FieldIcon name="clock" size={14} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.dateLabel}>
                    {t("createProject.endGrace")}
                  </Text>
                  <Text style={styles.dateValue}>
                    {t("createProject.minutesShort", {
                      minutes: endGraceMinutes,
                    })}
                  </Text>
                </View>
              </View>
              <Icon
                name="chevron-right"
                size={18}
                color={theme.content.textPrimary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.groupCard}>
            <TouchableOpacity
              style={[styles.groupedDateRow, styles.groupRowDivider]}
              onPress={() => setShowStartDatePicker(true)}
            >
              <View style={styles.locationFieldContent}>
                <View
                  style={[
                    styles.locationFieldIconContainer,
                    fieldIconBadgeStyle,
                  ]}
                >
                  <FieldIcon name="calendar" size={14} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.dateLabel}>
                    {t("createProject.startDate")}
                  </Text>
                  <Text style={styles.dateValue}>
                    {beginningDate
                      ? beginningDate.toLocaleDateString(getDateLocale())
                      : t("createTask.selectDate")}
                  </Text>
                </View>
              </View>
              <Icon
                name="chevron-right"
                size={18}
                color={theme.content.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.groupedDateRow, styles.groupRowLast]}
              onPress={() => setShowEndDatePicker(true)}
            >
              <View style={styles.locationFieldContent}>
                <View
                  style={[
                    styles.locationFieldIconContainer,
                    fieldIconBadgeStyle,
                  ]}
                >
                  <FieldIcon name="clock" size={14} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.dateLabel}>
                    {t("createProject.endDate")}
                  </Text>
                  <Text style={styles.dateValue}>
                    {endDate
                      ? endDate.toLocaleDateString(getDateLocale())
                      : t("createTask.selectDate")}
                  </Text>
                </View>
              </View>
              <Icon
                name="chevron-right"
                size={18}
                color={theme.content.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {canSeeFinance ? (
            <EconomySection
              budget={budget}
              setBudget={setBudget}
              plannedHours={plannedHours}
              setPlannedHours={setPlannedHours}
              plannedMaterialsCost={plannedMaterialsCost}
              setPlannedMaterialsCost={setPlannedMaterialsCost}
              spentMaterialsCost={spentMaterialsCost}
              setSpentMaterialsCost={setSpentMaterialsCost}
              costRatePerHour={costRatePerHour}
              setCostRatePerHour={setCostRatePerHour}
              billRatePerHour={billRatePerHour}
              setBillRatePerHour={setBillRatePerHour}
            />
          ) : null}

          <ContractSection
            contractNumber={contractNumber}
            setContractNumber={setContractNumber}
            littera={littera}
            setLittera={setLittera}
          />
        </ScrollView>
      </View>

      <ProjectDatePickerModal
        showStart={showStartDatePicker}
        showEnd={showEndDatePicker}
        beginningDate={beginningDate}
        endDate={endDate}
        setBeginningDate={setBeginningDate}
        setEndDate={setEndDate}
        onClose={closeDatePickers}
      />

      <SingleUserPickerModal
        checkboxStyle={themedCheckboxStyle}
        checkboxSelectedStyle={themedCheckboxSelectedStyle}
        visible={showOwnersModal}
        onClose={() => {
          setShowOwnersModal(false);
          setOwnerSearch("");
        }}
        onSelect={(id) => {
          handleSelectUser(id, "owner");
          setOwnerSearch("");
        }}
        title={t("createProject.owner")}
        searchValue={ownerSearch}
        onSearchChange={setOwnerSearch}
        selectedUserId={selectedOwner}
        data={filteredOwners}
      />

      <SingleUserPickerModal
        checkboxStyle={themedCheckboxStyle}
        checkboxSelectedStyle={themedCheckboxSelectedStyle}
        visible={showManagersModal}
        onClose={() => {
          setShowManagersModal(false);
          setManagerSearch("");
        }}
        onSelect={(id) => {
          handleSelectUser(id, "manager");
          setManagerSearch("");
        }}
        title={t("createProject.projectManager")}
        searchValue={managerSearch}
        onSearchChange={setManagerSearch}
        selectedUserId={selectedManager}
        data={filteredManagers}
      />

      <CompaniesListModal
        companies={companies}
        visible={showCompaniesModal}
        onClose={() => setShowCompaniesModal(false)}
        onSelect={handleSelectCompany}
        selectedCompanyId={selectedClientCompany}
      />

      <WorkersListModal
        visible={showWorkersModal}
        onClose={closeWorkersModal}
        onSave={saveWorkersSelection}
        selectedWorkers={pendingWorkers}
        toggleSelection={togglePendingWorkerSelection}
        workerSearch={workerSearch}
        onWorkerSearchChange={setWorkerSearch}
        filteredWorkers={filteredWorkers}
        checkboxStyle={themedCheckboxStyle}
        checkboxSelectedStyle={themedCheckboxSelectedStyle}
      />

      <ToolsListModal
        visible={showToolsModal}
        onClose={closeToolsModal}
        onSave={saveToolsSelection}
        selectedTools={pendingTools}
        toggleSelection={togglePendingToolSelection}
        toolSearch={toolSearch}
        onToolSearchChange={setToolSearch}
        filteredTools={filteredTools}
        checkboxStyle={themedCheckboxStyle}
        checkboxSelectedStyle={themedCheckboxSelectedStyle}
      />

      <LocationPickerModal
        visible={isLocationPickerVisible}
        onClose={closeLocationPicker}
        searchInputRef={locationSearchInputRef}
        locationSearch={locationSearch}
        setLocationSearch={setLocationSearch}
        showSearchHint={showLocationSearchHint}
        searchEmptyText={locationSearchEmptyText}
        isLocationLoading={isLocationLoading}
        isSearchLoading={isLocationSearchLoading}
        suggestions={locationSuggestions}
        onSelectSuggestion={handleSelectLocationSuggestion}
        location={location}
        radiusMeters={locationRadiusMeters}
        setRadiusMeters={setLocationRadiusMeters}
        selectedCoordinate={selectedCoordinate}
        onPickCoordinate={handlePickMapCoordinate}
        onConfirm={confirmLocationPickerSelection}
      />

      <WorkTimePickerModal
        showStart={showWorkStartPicker}
        showEnd={showWorkEndPicker}
        startTime={workDayStartTime}
        endTime={workDayEndTime}
        setStartTime={setWorkDayStartTime}
        setEndTime={setWorkDayEndTime}
        onClose={closeWorkTimePickers}
      />

      {/* Bottom Navigation with Action Button */}

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={false}
      />
    </View>
  );
}
