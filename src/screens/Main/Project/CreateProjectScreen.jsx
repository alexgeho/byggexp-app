import { getDateLocale } from "../../../utils/dateLocale";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  Animated,
  Switch,
  Platform,
  Keyboard,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useTheme } from "../../../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
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
import {
  formatResolvedAddress,
  enrichAddressLabelWithQueryHouseNumber,
  getCoordinateCacheKey,
  normalizeLocationSuggestions,
  reverseGeocodeWithNominatim,
  searchAddressesWithNominatim,
} from "../../../utils/projectLocationSearch";
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
import { styles } from "./CreateProjectScreen.styles";
import {
  FieldIcon,
  isImageDocument,
  getDocumentTypeMeta,
  ToolsListModal,
  WorkersListModal,
  CompaniesListModal,
  SingleUserPickerModal,
} from "./CreateProjectScreen.parts";

const DATE_PICKER_DISPLAY = Platform.OS === "ios" ? "inline" : "calendar";
const TIME_PICKER_DISPLAY = Platform.OS === "ios" ? "spinner" : "clock";
const REVERSE_GEOCODE_MIN_INTERVAL_MS = 1200;

export default function CreateProjectScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
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
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isLocationSearchLoading, setIsLocationSearchLoading] = useState(false);
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
  const locationSearchRequestIdRef = useRef(0);
  const locationSearchInputRef = useRef(null);
  const lastReverseGeocodeAtRef = useRef(0);
  const reverseGeocodeCacheRef = useRef(new Map());

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

  useEffect(() => {
    if (!isLocationPickerVisible) {
      return;
    }

    const normalizedQuery = locationSearch.trim();
    if (normalizedQuery.length < 2) {
      locationSearchRequestIdRef.current += 1;
      setLocationSuggestions([]);
      setIsLocationSearchLoading(false);
      return;
    }

    const debounceId = setTimeout(async () => {
      const requestId = ++locationSearchRequestIdRef.current;
      setIsLocationSearchLoading(true);

      try {
        const matches = await searchAddressesWithNominatim(normalizedQuery, 2);
        const nextSuggestions = normalizeLocationSuggestions(matches).map(
          function enrichSuggestion(suggestion) {
            return {
              ...suggestion,
              label: enrichAddressLabelWithQueryHouseNumber(
                suggestion.label,
                normalizedQuery,
              ),
            };
          },
        );

        if (locationSearchRequestIdRef.current === requestId) {
          setLocationSuggestions(nextSuggestions);
        }
      } catch (error) {
        if (locationSearchRequestIdRef.current === requestId) {
          setLocationSuggestions([]);
        }
        console.error("Failed to search project addresses:", error);
      } finally {
        if (locationSearchRequestIdRef.current === requestId) {
          setIsLocationSearchLoading(false);
        }
      }
    }, 250);

    return () => clearTimeout(debounceId);
  }, [isLocationPickerVisible, locationSearch]);

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
    setLocationSuggestions([]);
    setIsLocationSearchLoading(false);
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

  const resolveAddressFromCoordinate = async (latitude, longitude) => {
    const cacheKey = getCoordinateCacheKey(latitude, longitude);
    const cachedAddress = reverseGeocodeCacheRef.current.get(cacheKey);

    if (cachedAddress) {
      return cachedAddress;
    }

    const elapsedSinceLastReverseGeocode =
      Date.now() - lastReverseGeocodeAtRef.current;
    if (elapsedSinceLastReverseGeocode < REVERSE_GEOCODE_MIN_INTERVAL_MS) {
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          REVERSE_GEOCODE_MIN_INTERVAL_MS - elapsedSinceLastReverseGeocode,
        ),
      );
    }

    try {
      lastReverseGeocodeAtRef.current = Date.now();
      const [resolvedAddress] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const formattedAddress = formatResolvedAddress(resolvedAddress);

      if (formattedAddress) {
        reverseGeocodeCacheRef.current.set(cacheKey, formattedAddress);
        return formattedAddress;
      }
    } catch {}

    try {
      const nominatimAddress = await reverseGeocodeWithNominatim(
        latitude,
        longitude,
      );
      if (nominatimAddress) {
        reverseGeocodeCacheRef.current.set(cacheKey, nominatimAddress);
        return nominatimAddress;
      }
    } catch {}

    return null;
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
      reverseGeocodeCacheRef.current.set(
        getCoordinateCacheKey(latitude, longitude),
        resolvedAddressText,
      );
      return;
    }

    const resolvedAddress = await resolveAddressFromCoordinate(
      latitude,
      longitude,
    );
    if (resolvedAddress) {
      setLocation(resolvedAddress);
      setLocationSearch(resolvedAddress);
      return;
    }

    const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    setLocation(fallbackAddress);
    setLocationSearch(fallbackAddress);
  };

  const openLocationPicker = () => {
    setLocationSearch(location);
    setLocationSuggestions([]);
    setIsLocationSearchLoading(false);
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

  const availableWorkers = users.filter((item) => item.role === "worker");
  const normalizedWorkerSearch = workerSearch.trim().toLowerCase();
  const filteredWorkers = availableWorkers.filter((worker) => {
    if (!normalizedWorkerSearch) {
      return true;
    }

    const searchableText = [worker.name, worker.profession, worker.email]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedWorkerSearch);
  });

  const selectedWorkersLabel =
    selectedWorkers.length > 0
      ? t("createProject.workerCount", { count: selectedWorkers.length })
      : "";

  const normalizedToolSearch = toolSearch.trim().toLowerCase();
  const filteredTools = tools.filter((tool) => {
    if (!normalizedToolSearch) {
      return true;
    }

    const searchableText = [tool.name, tool.notes]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedToolSearch);
  });

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

  const renderFieldInput = (
    key,
    label,
    value,
    onChangeText,
    { keyboardType = "default", half = false } = {},
  ) => (
    <View key={key} style={half ? styles.fieldItemHalf : styles.fieldItem}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor="#A7B3C2"
      />
    </View>
  );

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
            Create project
          </Text>

          {/* FloatingActionButton ======================================= */}
          <FloatingActionButton
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
              <Icon name="chevron-right" size={18} color="#052D50" />
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
              <Icon name="chevron-right" size={18} color="#052D50" />
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
              <Icon name="chevron-right" size={18} color="#052D50" />
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
              <Icon name="chevron-right" size={18} color="#052D50" />
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
              <Icon name="chevron-right" size={18} color="#052D50" />
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
                            color="#052D50"
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
              <Icon name="chevron-right" size={18} color="#052D50" />
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
              <Icon name="chevron-right" size={18} color="#052D50" />
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
              <Icon name="chevron-right" size={18} color="#052D50" />
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
              <Icon name="chevron-right" size={18} color="#052D50" />
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
              <Icon name="chevron-right" size={18} color="#052D50" />
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
              <Icon name="chevron-right" size={18} color="#052D50" />
            </TouchableOpacity>
          </View>

          {canSeeFinance ? (
            <View style={styles.fieldCard}>
              <Text style={styles.fieldSectionTitle}>
                {t("createProject.economySection")}
              </Text>
              <View style={styles.fieldRow}>
                {renderFieldInput(
                  "budget",
                  t("createProject.budget"),
                  budget,
                  setBudget,
                  { keyboardType: "numeric", half: true },
                )}
                {renderFieldInput(
                  "plannedHours",
                  t("createProject.plannedHours"),
                  plannedHours,
                  setPlannedHours,
                  { keyboardType: "numeric", half: true },
                )}
              </View>
              <View style={styles.fieldRow}>
                {renderFieldInput(
                  "plannedMaterialsCost",
                  t("createProject.plannedMaterials"),
                  plannedMaterialsCost,
                  setPlannedMaterialsCost,
                  { keyboardType: "numeric", half: true },
                )}
                {renderFieldInput(
                  "spentMaterialsCost",
                  t("createProject.spentMaterials"),
                  spentMaterialsCost,
                  setSpentMaterialsCost,
                  { keyboardType: "numeric", half: true },
                )}
              </View>
              <View style={styles.fieldRow}>
                {renderFieldInput(
                  "costRatePerHour",
                  t("createProject.costRate"),
                  costRatePerHour,
                  setCostRatePerHour,
                  { keyboardType: "numeric", half: true },
                )}
                {renderFieldInput(
                  "billRatePerHour",
                  t("createProject.billRate"),
                  billRatePerHour,
                  setBillRatePerHour,
                  { keyboardType: "numeric", half: true },
                )}
              </View>
            </View>
          ) : null}

          <View style={styles.fieldCard}>
            <Text style={styles.fieldSectionTitle}>
              {t("createProject.contractSection")}
            </Text>
            {renderFieldInput(
              "contractNumber",
              t("createProject.contractNumber"),
              contractNumber,
              setContractNumber,
            )}
            {renderFieldInput(
              "littera",
              t("createProject.littera"),
              littera,
              setLittera,
            )}
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={showStartDatePicker || showEndDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDatePickers}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerCard}>
            <Text style={styles.datePickerTitle}>
              {showStartDatePicker
                ? t("createProject.startDate")
                : t("createProject.endDate")}
            </Text>
            <DateTimePicker
              value={
                showStartDatePicker
                  ? beginningDate || new Date()
                  : endDate || new Date()
              }
              mode="date"
              display={DATE_PICKER_DISPLAY}
              onChange={(event, date) => {
                if (!date) {
                  return;
                }

                if (showStartDatePicker) {
                  setBeginningDate(date);
                } else if (showEndDatePicker) {
                  setEndDate(date);
                }
              }}
            />
            <View style={styles.datePickerActions}>
              <TouchableOpacity
                style={styles.datePickerSecondaryButton}
                onPress={closeDatePickers}
              >
                <Text style={styles.datePickerSecondaryButtonText}>
                  {t("common.done")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

      <Modal
        visible={isLocationPickerVisible}
        animationType="slide"
        onRequestClose={closeLocationPicker}
      >
        <View style={styles.mapModalScreen}>
          <View style={styles.mapTopBar}>
            <BackButton
              onPress={closeLocationPicker}
              iconSource={require("../../../assets/Arrow-left.png")}
            />
            <Text style={styles.mapModalTitle}>
              {t("createProject.projectAddress")}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.mapModalScroll}
            contentContainerStyle={styles.mapModalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.mapSearchInputCard}>
              <Icon name="search" size={18} color="rgba(5, 45, 80, 0.55)" />
              <TextInput
                ref={locationSearchInputRef}
                autoFocus={true}
                value={locationSearch}
                onChangeText={setLocationSearch}
                placeholder={t("createProject.searchAddress")}
                placeholderTextColor="rgba(5, 45, 80, 0.45)"
                style={styles.mapSearchInput}
                returnKeyType="search"
              />
            </View>

            {showLocationSearchHint ? (
              <View style={styles.mapSuggestionsEmptyState}>
                <Text style={styles.mapSuggestionsEmptyText}>
                  {locationSearchEmptyText}
                </Text>
              </View>
            ) : (
              <View style={styles.mapSuggestionsCard}>
                {isLocationLoading || isLocationSearchLoading ? (
                  <View style={styles.mapSuggestionsLoadingRow}>
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.primary}
                    />
                    <Text style={styles.mapSuggestionsLoadingText}>
                      {isLocationLoading
                        ? t("createProject.loadingLocation")
                        : t("createProject.searchingAddresses")}
                    </Text>
                  </View>
                ) : locationSuggestions.length ? (
                  locationSuggestions.map((item, index) => (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.85}
                      style={[
                        styles.mapSuggestionItem,
                        index === locationSuggestions.length - 1 &&
                          styles.mapSuggestionItemLast,
                      ]}
                      onPress={() => handleSelectLocationSuggestion(item)}
                    >
                      <Icon name="map-pin" size={16} color="#052D50" />
                      <Text style={styles.mapSuggestionText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.mapSuggestionsEmptyState}>
                    <Text style={styles.mapSuggestionsEmptyText}>
                      {locationSearchEmptyText}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.mapBottomPanel}>
              <Text style={styles.mapBottomPanelTitle}>
                {t("createProject.selectedLocation")}
              </Text>
              <Text
                numberOfLines={2}
                style={[
                  styles.mapBottomLocationText,
                  !location && styles.mapBottomLocationPlaceholder,
                ]}
              >
                {location || t("createProject.chooseLocationHint")}
              </Text>

              <View style={styles.activationAreaRow}>
                <View style={styles.activationAreaTextWrap}>
                  <Text style={styles.activationAreaTitle}>
                    {t("createProject.activationArea")}
                  </Text>
                  <Text style={styles.activationAreaSubtitle}>
                    {t("createProject.activationAreaHint")}
                  </Text>
                </View>

                <View style={styles.activationAreaBadge}>
                  <Text style={styles.activationAreaBadgeText}>
                    {t("createProject.metersShort", {
                      meters: locationRadiusMeters,
                    })}
                  </Text>
                </View>
              </View>

              <Slider
                minimumValue={50}
                maximumValue={1500}
                step={50}
                value={locationRadiusMeters}
                onValueChange={setLocationRadiusMeters}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor="rgba(5, 45, 80, 0.12)"
                thumbTintColor={theme.colors.primary}
                style={styles.activationAreaSlider}
              />

              <TouchableOpacity
                style={[
                  styles.mapChooseLocationButton,
                  !selectedCoordinate && styles.mapChooseLocationButtonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={confirmLocationPickerSelection}
                disabled={!selectedCoordinate}
              >
                <Text style={styles.mapChooseLocationButtonText}>
                  {t("createProject.chooseLocation")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showWorkStartPicker || showWorkEndPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={closeWorkTimePickers}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerCard}>
            <Text style={styles.datePickerTitle}>
              {showWorkStartPicker
                ? t("createProject.workDayStarts")
                : t("createProject.workDayEnds")}
            </Text>
            <DateTimePicker
              value={showWorkStartPicker ? workDayStartTime : workDayEndTime}
              mode="time"
              display={TIME_PICKER_DISPLAY}
              onChange={(_event, date) => {
                if (!date) {
                  return;
                }

                if (showWorkStartPicker) {
                  setWorkDayStartTime(date);
                } else {
                  setWorkDayEndTime(date);
                }
              }}
            />
            <TouchableOpacity
              style={styles.datePickerSecondaryButton}
              onPress={closeWorkTimePickers}
            >
              <Text style={styles.datePickerSecondaryButtonText}>
                {t("common.done")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation with Action Button */}

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={false}
      />
    </View>
  );
}
