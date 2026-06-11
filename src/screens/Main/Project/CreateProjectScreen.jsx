import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Animated,
  Switch,
  Platform,
  Keyboard,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useTheme } from "../../../theme/ThemeContext";
import {
  useNavigation,
} from "@react-navigation/native";
import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import Icon from "react-native-vector-icons/Feather";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthContext from "../../../contexts/AuthContext";
import { useFeedback } from "../../../contexts/FeedbackContext";
import { projectService, toolService, userService, companyService } from "../../../services";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { shiftLocationPolicy } from "../../../config/shiftLocationPolicy";
import { standardScreenContainer, standardScreenHeader, standardScreenHeaderPlaceholder } from "../../../styles/screenLayout";
import {
  formatResolvedAddress,
  enrichAddressLabelWithQueryHouseNumber,
  getCoordinateCacheKey,
  normalizeLocationSuggestions,
  reverseGeocodeWithNominatim,
  searchAddressesWithNominatim,
} from "../../../utils/projectLocationSearch";
import { pickUploadAssets } from "../../../utils/uploadPicker";

const DATE_PICKER_DISPLAY = Platform.OS === "ios" ? "inline" : "calendar";
const REVERSE_GEOCODE_MIN_INTERVAL_MS = 1200;

const getUserInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "?"
  );
};

const FieldIcon = ({
  library = "feather",
  name,
  size = 20,
  color = "rgba(5, 45, 80, 1)",
}) => {
  if (library === "material-community") {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }

  return <Icon name={name} size={size} color={color} />;
};

const getFileExtension = (fileName = "") => {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop().toUpperCase() : "";
};

const isImageDocument = (document) => {
  const mimeType = document?.mimeType || "";
  const extension = getFileExtension(document?.name || "").toLowerCase();
  return (
    mimeType.startsWith("image/") ||
    ["png", "jpg", "jpeg", "webp", "gif", "bmp", "heic"].includes(extension)
  );
};

const getDocumentTypeMeta = (document) => {
  const extension = getFileExtension(document?.name || "");
  const mimeType = document?.mimeType || "";

  if (isImageDocument(document)) {
    return { icon: "image", label: extension || "IMAGE" };
  }

  if (mimeType.includes("pdf") || extension === "PDF") {
    return { icon: "file-text", label: "PDF" };
  }

  if (["DOC", "DOCX", "TXT", "RTF"].includes(extension)) {
    return { icon: "file-text", label: extension || "DOC" };
  }

  if (["XLS", "XLSX", "CSV"].includes(extension)) {
    return { icon: "grid", label: extension || "XLS" };
  }

  return { icon: "file", label: extension || "FILE" };
};

const ToolsListModal = memo(function ToolsListModal({
  visible,
  onClose,
  selectedTools,
  toggleSelection,
  onSave,
  toolSearch,
  onToolSearchChange,
  filteredTools,
  checkboxStyle,
  checkboxSelectedStyle,
}) {
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.workersModalContainer}>
        <View style={styles.workersModalHeader}>
          <BackButton
            backgroundColor={"rgba(255, 255, 255, 0.6)"}
            tint={"light"}
            borderColor="#FFFFFF50"
            onPress={onClose}
            iconSource={require("../../../assets/Arrow-left.png")}
          />
          <Text style={styles.workersModalTitle}>Attach instruments</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.workersSearchBar}>
          <Icon name="search" size={18} color="rgba(5, 45, 80, 0.5)" />
          <TextInput
            value={toolSearch}
            onChangeText={onToolSearchChange}
            placeholder="Search instruments"
            placeholderTextColor="rgba(5, 45, 80, 0.5)"
            style={styles.workersSearchInput}
          />
        </View>

        <FlatList
          data={filteredTools}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.workersListContent}
          keyboardShouldPersistTaps="handled"
          extraData={selectedTools}
          renderItem={({ item }) => {
            const toolId = item._id;
            const isSelected = selectedTools.includes(toolId);

            return (
              <TouchableOpacity
                style={styles.workerCard}
                onPress={() => toggleSelection(toolId)}
                activeOpacity={0.85}
              >
                <View style={styles.workerCardInfo}>
                  <Text numberOfLines={1} style={styles.workerCardName}>
                    {item.name || "Unnamed instrument"}
                  </Text>
                  {item.notes ? (
                    <Text numberOfLines={1} style={styles.workerCardProfession}>
                      {item.notes}
                    </Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.workerCheckbox,
                    checkboxStyle,
                    isSelected && styles.workerCheckboxSelected,
                    isSelected && checkboxSelectedStyle,
                  ]}
                >
                  {isSelected ? (
                    <Icon name="check" size={12} color="#FFFFFF" />
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.workersEmptyState}>
              <Text style={styles.workersEmptyText}>No instruments found</Text>
            </View>
          }
        />

        <View style={styles.workersModalFooter}>
          <TouchableOpacity style={styles.closeButton} onPress={onSave}>
            <Text style={styles.closeButtonText}>
              {selectedTools.length > 0
                ? `Save (${selectedTools.length})`
                : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
});

const WorkersListModal = memo(function WorkersListModal({
  visible,
  onClose,
  selectedWorkers,
  toggleSelection,
  onSave,
  workerSearch,
  onWorkerSearchChange,
  filteredWorkers,
  checkboxStyle,
  checkboxSelectedStyle,
}) {
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.workersModalContainer}>
        <View style={styles.workersModalHeader}>
          <BackButton
            backgroundColor={"rgba(255, 255, 255, 0.6)"}
            tint={"light"}
            borderColor="#FFFFFF50"
            onPress={onClose}
            iconSource={require("../../../assets/Arrow-left.png")}
          />
          <Text style={styles.workersModalTitle}>Project team</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.workersSearchBar}>
          <Icon name="search" size={18} color="rgba(5, 45, 80, 0.5)" />
          <TextInput
            value={workerSearch}
            onChangeText={onWorkerSearchChange}
            placeholder="Search workers"
            placeholderTextColor="rgba(5, 45, 80, 0.5)"
            style={styles.workersSearchInput}
          />
        </View>

        <FlatList
          data={filteredWorkers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.workersListContent}
          keyboardShouldPersistTaps="handled"
          extraData={selectedWorkers}
          renderItem={({ item }) => {
            const isSelected = selectedWorkers.includes(item._id);

            return (
              <TouchableOpacity
                style={styles.workerCard}
                onPress={() => toggleSelection(item._id)}
                activeOpacity={0.85}
              >
                <View style={styles.workerAvatarPlaceholder}>
                  <Text style={styles.workerAvatarInitials}>
                    {getUserInitials(item.name)}
                  </Text>
                </View>
                <View style={styles.workerCardInfo}>
                  <Text numberOfLines={1} style={styles.workerCardName}>
                    {item.name || "Unnamed worker"}
                  </Text>
                  <Text numberOfLines={1} style={styles.workerCardProfession}>
                    {item.profession || "Profession not set"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.workerCheckbox,
                    checkboxStyle,
                    isSelected && styles.workerCheckboxSelected,
                    isSelected && checkboxSelectedStyle,
                  ]}
                >
                  {isSelected ? (
                    <Icon name="check" size={12} color="#FFFFFF" />
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.workersEmptyState}>
              <Text style={styles.workersEmptyText}>No workers found</Text>
            </View>
          }
        />

        <View style={styles.workersModalFooter}>
          <TouchableOpacity style={styles.closeButton} onPress={onSave}>
            <Text style={styles.closeButtonText}>
              {selectedWorkers.length > 0
                ? `Save (${selectedWorkers.length})`
                : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
});

export default function CreateProjectScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { showSuccess } = useFeedback();
  const { user } = useContext(AuthContext);

  // Проверка прав доступа - только для superadmin, companyAdmin и projectAdmin
  const canManageProjects = [
    "superadmin",
    "companyAdmin",
    "projectAdmin",
  ].includes(user?.role);

  if (!canManageProjects) {
    return (
      <View style={styles.accessDeniedContainer}>
        <Text style={styles.accessDeniedText}>Доступ запрещён</Text>
        <Text style={styles.accessDeniedSubtext}>
          Только администраторы могут создавать проекты
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Вернуться назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const [projectName, setProjectName] = useState("");
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

  const fetchUsersByCompany = async (companyId) => {
    try {
      const usersData = await userService.getByCompany(companyId);
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching company users:", error);
      setUsers([]);
    }
  };

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
        // Для companyAdmin / projectAdmin используем их компанию
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
      Alert.alert("Error", `Failed to load data: ${error.message}`);
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

  const toggleWorkerSelection = (workerId) => {
    setSelectedWorkers((prev) => {
      if (prev.includes(workerId)) {
        return prev.filter((id) => id !== workerId);
      } else {
        return [...prev, workerId];
      }
    });
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
      Alert.alert("Documents error", "Unable to select documents right now.");
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
        "Location required",
        "Search for an address first.",
      );
      return;
    }

    closeLocationPicker();
  };

  const closeDatePickers = () => {
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
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
        "Validation Error",
        "Please enter project name",
      );
      return;
    }

    setSaving(true);

    try {
      const projectData = new FormData();

      if (selectedOwner) {
        projectData.append("ownerId", selectedOwner);
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

      projectData.append(
        "locationRadiusMeters",
        String(locationRadiusMeters),
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

      console.log("Project created:", result);
      showSuccess({
        title: "Project created",
        message: "Project created successfully!",
      });

      navigation.goBack();
    } catch (error) {
      console.error("Error creating project:", error);
      Alert.alert("Error", error.message || "Failed to create project");
    } finally {
      setSaving(false);
    }
  };

  const SelectedItem = ({
    title,
    value,
    onPress,
    showArrow = true,
    iconName = "briefcase",
    iconLibrary = "feather",
    containerStyle,
  }) => (
    <TouchableOpacity
      style={[styles.selectableRow, { borderBottomWidth: 0 }, containerStyle]}
      onPress={onPress}
    >
      <View style={styles.rowCenter}>
        <View style={[styles.iconContainer, fieldIconBadgeStyle]}>
          <FieldIcon
            library={iconLibrary}
            name={iconName}
            size={14}
            color="#FFFFFF"
          />
        </View>
        <View>
          <Text style={styles.label}>{title}</Text>
          {value ? (
            <Text style={styles.selectedValue}>{value}</Text>
          ) : (
            <Text style={styles.placeholderText}>Select...</Text>
          )}
        </View>
      </View>
      {showArrow && (
        <Image
          style={styles.arrowIcon}
          source={require("../../../assets/Arrow-right.png")}
        />
      )}
    </TouchableOpacity>
  );

  const CompaniesListModal = ({
    visible,
    onClose,
    onSelect,
    selectedCompanyId,
  }) => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Client Company</Text>
          <FlatList
            data={companies}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.userItem,
                  selectedCompanyId === item._id && styles.selectedUserItem,
                ]}
                onPress={() => onSelect(item._id)}
              >
                <Text style={styles.userName}>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text>No companies found</Text>}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
      ? `${selectedWorkers.length} worker${selectedWorkers.length > 1 ? "s" : ""}`
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
      ? `${selectedTools.length} instrument${selectedTools.length > 1 ? "s" : ""}`
      : "";

  const filteredOwners = getFilteredUsers(ownerSearch);
  const filteredManagers = getFilteredUsers(managerSearch);

  const SingleUserPickerModal = ({
    visible,
    onClose,
    title,
    searchValue,
    onSearchChange,
    selectedUserId,
    onSelect,
    data,
  }) => (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.workersModalContainer}>
        <View style={styles.workersModalHeader}>
          <BackButton
            backgroundColor={"rgba(255, 255, 255, 0.6)"}
            tint={"light"}
            borderColor="#FFFFFF50"
            onPress={onClose}
            iconSource={require("../../../assets/Arrow-left.png")}
          />
          <Text style={styles.workersModalTitle}>{title}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.workersSearchBar}>
          <Icon name="search" size={18} color="rgba(5, 45, 80, 0.5)" />
          <TextInput
            value={searchValue}
            onChangeText={onSearchChange}
            placeholder="Search workers"
            placeholderTextColor="rgba(5, 45, 80, 0.5)"
            style={styles.workersSearchInput}
          />
        </View>

        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.workersListContent}
          renderItem={({ item }) => {
            const isSelected = selectedUserId === item._id;

            return (
              <TouchableOpacity
                style={styles.workerCard}
                onPress={() => onSelect(item._id)}
                activeOpacity={0.85}
              >
                <View style={styles.workerAvatarPlaceholder}>
                  <Text style={styles.workerAvatarInitials}>
                    {getUserInitials(item.name)}
                  </Text>
                </View>
                <View style={styles.workerCardInfo}>
                  <Text numberOfLines={1} style={styles.workerCardName}>
                    {item.name || "Unnamed worker"}
                  </Text>
                  <Text numberOfLines={1} style={styles.workerCardProfession}>
                    {item.profession || "Profession not set"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.workerCheckbox,
                    themedCheckboxStyle,
                    isSelected && styles.workerCheckboxSelected,
                    isSelected && themedCheckboxSelectedStyle,
                  ]}
                >
                  {isSelected ? (
                    <Icon name="check" size={12} color="#FFFFFF" />
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.workersEmptyState}>
              <Text style={styles.workersEmptyText}>No workers found</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );

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
              Create project
            </Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0091FF" />
            <Text>Loading...</Text>
          </View>
        </View>
      </View>
    );
  }

  const fieldIconBadgeStyle = { backgroundColor: theme.colors.primaryIconBadge };
  const themedCheckboxStyle = {
    borderColor: `${theme.colors.primary}66`,
  };
  const themedCheckboxSelectedStyle = {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  };
  const locationSearchEmptyText =
    locationSearch.trim().length < 2
      ? "Start typing to search for a project address."
      : "No addresses found. Try a more specific search.";
  const showLocationSearchHint =
    locationSearch.trim().length < 2 &&
    !isLocationLoading &&
    !isLocationSearchLoading &&
    !locationSuggestions.length;

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
            Create project
          </Text>
          <View style={styles.placeholder} />
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
                {location || "Location"}
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
            <Text style={styles.switchLabel}>Use location as a name</Text>
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
              Project name *
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
                style={[styles.locationFieldIconContainer, fieldIconBadgeStyle]}
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
                {selectedWorkersLabel || "Project team"}
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color="#052D50" />
          </TouchableOpacity>

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
                style={[styles.locationFieldIconContainer, fieldIconBadgeStyle]}
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
                {selectedToolsLabel || "Attach instruments"}
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color="#052D50" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.locationField,
              styles.groupedField,
              styles.groupRowDivider,
            ]}
            onPress={() => setShowOwnersModal(true)}
            activeOpacity={0.85}
          >
            <View style={styles.locationFieldContent}>
              <View
                style={[styles.locationFieldIconContainer, fieldIconBadgeStyle]}
              >
                <FieldIcon
                  library="material-community"
                  name="tie"
                  size={14}
                  color="#FFFFFF"
                />
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.locationFieldText,
                  selectedOwner
                    ? styles.locationFieldValue
                    : styles.locationFieldPlaceholder,
                ]}
              >
                {users.find((u) => u._id === selectedOwner)?.name || "Owner"}
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color="#052D50" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.locationField,
              styles.groupedField,
              styles.groupRowDivider,
            ]}
            onPress={() => setShowManagersModal(true)}
            activeOpacity={0.85}
          >
            <View style={styles.locationFieldContent}>
              <View
                style={[styles.locationFieldIconContainer, fieldIconBadgeStyle]}
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
                  "Project Manager"}
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color="#052D50" />
          </TouchableOpacity>

          <SelectedItem
            title="Client Company"
            value={
              companies.find((c) => c._id === selectedClientCompany)?.name || ""
            }
            onPress={() => setShowCompaniesModal(true)}
            iconName="office-building-outline"
            iconLibrary="material-community"
            containerStyle={styles.groupedSelectableRow}
          />
        </View>

        <View style={styles.groupCard}>
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
                style={[styles.locationFieldIconContainer, fieldIconBadgeStyle]}
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
                  ? `${selectedDocuments.length} document${selectedDocuments.length > 1 ? "s" : ""}`
                  : "Documents"}
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
                        <Icon name={typeMeta.icon} size={12} color="#052D50" />
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
          <TouchableOpacity
            style={[styles.groupedDateRow, styles.groupRowDivider]}
            onPress={() => setShowStartDatePicker(true)}
          >
            <View style={styles.locationFieldContent}>
              <View
                style={[styles.locationFieldIconContainer, fieldIconBadgeStyle]}
              >
                <FieldIcon name="calendar" size={14} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.dateLabel}>Start Date</Text>
                <Text style={styles.dateValue}>
                  {beginningDate
                    ? beginningDate.toLocaleDateString()
                    : "Select date"}
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
                style={[styles.locationFieldIconContainer, fieldIconBadgeStyle]}
              >
                <FieldIcon name="clock" size={14} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.dateLabel}>End Date</Text>
                <Text style={styles.dateValue}>
                  {endDate ? endDate.toLocaleDateString() : "Select date"}
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={18} color="#052D50" />
          </TouchableOpacity>
        </View>

        <View style={styles.noteGroup}>
          <TextInput
            multiline={true}
            placeholder="Note"
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
          />
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
                {showStartDatePicker ? "Start Date" : "End Date"}
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
                  <Text style={styles.datePickerSecondaryButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <SingleUserPickerModal
          visible={showOwnersModal}
          onClose={() => {
            setShowOwnersModal(false);
            setOwnerSearch("");
          }}
          onSelect={(id) => {
            handleSelectUser(id, "owner");
            setOwnerSearch("");
          }}
          title="Owner"
          searchValue={ownerSearch}
          onSearchChange={setOwnerSearch}
          selectedUserId={selectedOwner}
          data={filteredOwners}
        />

        <SingleUserPickerModal
          visible={showManagersModal}
          onClose={() => {
            setShowManagersModal(false);
            setManagerSearch("");
          }}
          onSelect={(id) => {
            handleSelectUser(id, "manager");
            setManagerSearch("");
          }}
          title="Project Manager"
          searchValue={managerSearch}
          onSearchChange={setManagerSearch}
          selectedUserId={selectedManager}
          data={filteredManagers}
        />

        <CompaniesListModal
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
              <Text style={styles.mapModalTitle}>Project address</Text>
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
                  placeholder="Search address"
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
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={styles.mapSuggestionsLoadingText}>
                      {isLocationLoading
                        ? "Loading location..."
                        : "Searching addresses..."}
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
                  Selected location
                </Text>
                <Text
                  numberOfLines={2}
                  style={[
                    styles.mapBottomLocationText,
                    !location && styles.mapBottomLocationPlaceholder,
                  ]}
                >
                  {location || "Search and choose a project location."}
                </Text>

                <View style={styles.activationAreaRow}>
                  <View style={styles.activationAreaTextWrap}>
                    <Text style={styles.activationAreaTitle}>
                      Activation area
                    </Text>
                    <Text style={styles.activationAreaSubtitle}>
                      Upon entry, the timer will start
                    </Text>
                  </View>

                  <View style={styles.activationAreaBadge}>
                    <Text style={styles.activationAreaBadgeText}>
                      {locationRadiusMeters} m
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
                    !selectedCoordinate &&
                      styles.mapChooseLocationButtonDisabled,
                  ]}
                  activeOpacity={0.85}
                  onPress={confirmLocationPickerSelection}
                  disabled={!selectedCoordinate}
                >
                  <Text style={styles.mapChooseLocationButtonText}>
                    Choose project location
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        onAddPress={createProject}
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
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EEEEEE",
  },
  pageContainer: {
    ...standardScreenContainer,
  },
  contentScroll: {
    flex: 1,
    width: "100%",
  },
  contentScrollContent: {
    paddingBottom: 140,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    ...standardScreenHeader,
  },
  placeholder: {
    ...standardScreenHeaderPlaceholder,
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    textAlign: "center",
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
    backgroundColor: "transparent",
    borderRadius: 0,
    marginBottom: 0,
  },
  groupRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(5, 45, 80, 0.08)",
  },
  groupRowLast: {
    borderBottomWidth: 0,
  },
  groupedSelectableRow: {
    backgroundColor: "transparent",
    borderRadius: 0,
    marginBottom: 0,
    minHeight: 56,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
  },
  groupedDateRow: {
    width: "100%",
    minHeight: 56,
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  noteGroup: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  inputsContainer: {
    padding: 18,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 16,
    width: "100%",
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  input: {
    paddingBottom: 12,
    paddingTop: 12,
    color: "#052D5050",
    borderBottomWidth: 1,
    borderBottomColor: "#052D5050",
  },
  projectNameField: {
    width: "100%",
    height: 56,
    position: "relative",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  switchField: {
    width: "100%",
    height: 56,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  floatingLabel: {
    position: "absolute",
    left: 16,
    color: "#052D50",
    opacity: 0.5,
  },
  floatingInput: {
    width: "100%",
    height: "100%",
    paddingTop: 22,
    paddingBottom: 0,
    color: "#052D50",
    fontSize: 16,
  },
  switchLabel: {
    color: "#052D50",
    fontSize: 16,
  },
  switchControl: {
    width: 51,
    height: 31,
    alignSelf: "center",
    marginVertical: 0,
  },
  locationField: {
    width: "100%",
    height: 56,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  locationFieldContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 12,
  },
  locationFieldIconContainer: {
    width: 27,
    height: 27,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  locationFieldText: {
    flex: 1,
    fontSize: 16,
  },
  locationFieldPlaceholder: {
    color: "rgba(5, 45, 80, 0.5)",
  },
  locationFieldValue: {
    color: "rgba(5, 45, 80, 1)",
  },
  spacingAfterSwitch: {
    marginTop: 24,
  },
  spacingAfterClientCompany: {
    marginTop: 20,
  },
  documentsGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  spacingAfterDocuments: {
    marginBottom: 32,
  },
  documentCard: {
    width: "23%",
    height: 67,
    backgroundColor: "rgba(239, 239, 240, 1)",
    borderRadius: 8,
    overflow: "hidden",
  },
  documentImage: {
    width: "100%",
    height: "100%",
  },
  documentFileContent: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 6,
    justifyContent: "space-between",
  },
  documentName: {
    color: "#052D50",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "500",
  },
  documentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  documentMetaText: {
    color: "#052D50",
    fontSize: 10,
    fontWeight: "600",
  },
  firstInput: {
    borderBottomWidth: 1,
    borderColor: "#052D5050",
  },
  selectableRow: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconContainer: {
    width: 27,
    height: 27,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  smallIcon: {
    width: 20,
    height: 20,
  },
  label: {
    color: "#052D50",
    fontSize: 14,
  },
  selectedValue: {
    color: "#052D50",
    fontSize: 16,
  },
  placeholderText: {
    color: "#052D5050",
    fontSize: 14,
  },
  arrowIcon: {
    width: 10,
    height: 16,
  },
  datesContainer: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  dateButton: {
    flex: 1,
    padding: 8,
  },
  dateLabel: {
    color: "#052D50",
    fontSize: 12,
    marginBottom: 4,
  },
  dateValue: {
    color: "#052D50",
    fontSize: 14,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(5, 45, 80, 0.28)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  datePickerCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#052D50",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  datePickerTitle: {
    color: "#052D50",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  datePickerActions: {
    marginTop: 12,
    alignItems: "center",
  },
  datePickerSecondaryButton: {
    minWidth: 120,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#0091FF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 4,
    boxShadow: "0px 2px 7px 0px rgba(0, 0, 0, 0.25)",
  },
  datePickerSecondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  noteInput: {
    backgroundColor: "transparent",
    borderRadius: 0,
    padding: 0,
    width: "100%",
    minHeight: 100,
    textAlignVertical: "top",
    color: "#052D50",
  },
  workersModalContainer: {
    flex: 1,
    backgroundColor: "#EEEEEE",
    paddingHorizontal: 12,
    paddingTop: 48,
    paddingBottom: 24,
  },
  workersModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  workersModalTitle: {
    color: "#052D50",
    fontSize: 17,
    fontFamily: "DMSans-SemiBold",
  },
  workersSearchBar: {
    height: 56,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  workersSearchInput: {
    flex: 1,
    color: "#052D50",
    fontSize: 16,
  },
  workersListContent: {
    paddingBottom: 20,
  },
  workerCard: {
    height: 72,
    borderRadius: 100,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  workerAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#D9E3EC",
    alignItems: "center",
    justifyContent: "center",
  },
  workerAvatarInitials: {
    color: "#052D50",
    fontSize: 16,
    fontWeight: "700",
  },
  workerCardInfo: {
    flex: 1,
    justifyContent: "center",
  },
  workerCardName: {
    color: "#052D50",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  workerCardProfession: {
    color: "rgba(5, 45, 80, 0.65)",
    fontSize: 14,
  },
  workerCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#052D50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  workerCheckboxSelected: {
    backgroundColor: "#FFFFFF",
  },
  workersEmptyState: {
    paddingTop: 24,
    alignItems: "center",
  },
  workersEmptyText: {
    color: "#698196",
    fontSize: 16,
  },
  workersModalFooter: {
    paddingTop: 8,
  },
  createButton: {
    backgroundColor: "#0091FF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 4,
    boxShadow: "0px 2px 7px 0px rgba(0, 0, 0, 0.25)",
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    width: "90%",
    maxHeight: "80%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  userItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedUserItem: {
    backgroundColor: "#e6f7ff",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#0091FF",
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 4,
    boxShadow: "0px 2px 7px 0px rgba(0, 0, 0, 0.25)",
  },
  closeButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#EEEEEE",
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#052D50",
    marginBottom: 12,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    color: "#698196",
    textAlign: "center",
    marginBottom: 32,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  mapModalScreen: {
    flex: 1,
    backgroundColor: "#EEF5FB",
    ...standardScreenContainer,
    gap: 0,
  },
  mapModalScroll: {
    flex: 1,
  },
  mapModalScrollContent: {
    gap: 12,
    paddingBottom: 16,
  },
  mapTopBar: {
    ...standardScreenHeader,
  },
  mapModalTitle: {
    color: "#052D50",
    fontSize: 17,
    textAlign: "center",
    fontWeight: "600",
  },
  mapSearchInputCard: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    paddingHorizontal: 16,
  },
  mapSearchInput: {
    flex: 1,
    color: "#052D50",
    fontSize: 16,
    paddingVertical: 16,
  },
  mapSuggestionsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#052D50",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  mapSuggestionsLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 32,
    paddingVertical: 4,
  },
  mapSuggestionsLoadingText: {
    color: "#052D50",
    fontSize: 14,
    fontWeight: "500",
  },
  mapSuggestionItem: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(5, 45, 80, 0.08)",
  },
  mapSuggestionItemLast: {
    borderBottomWidth: 0,
  },
  mapSuggestionText: {
    flex: 1,
    color: "#052D50",
    fontSize: 14,
    lineHeight: 20,
  },
  mapSuggestionsEmptyText: {
    color: "#698196",
    fontSize: 14,
    lineHeight: 20,
  },
  mapSuggestionsEmptyState: {
    paddingVertical: 10,
  },
  mapBottomPanel: {
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#052D50",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
    gap: 12,
  },
  mapBottomPanelTitle: {
    color: "#052D50",
    fontSize: 15,
    fontWeight: "600",
  },
  mapBottomLocationText: {
    color: "#052D50",
    fontSize: 14,
    lineHeight: 20,
  },
  mapBottomLocationPlaceholder: {
    color: "rgba(5, 45, 80, 0.5)",
  },
  activationAreaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  activationAreaTextWrap: {
    flex: 1,
    gap: 2,
  },
  activationAreaTitle: {
    color: "#052D50",
    fontSize: 15,
    fontWeight: "600",
  },
  activationAreaSubtitle: {
    color: "#698196",
    fontSize: 13,
    lineHeight: 18,
  },
  activationAreaBadge: {
    minWidth: 78,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(5, 45, 80, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  activationAreaBadgeText: {
    color: "#052D50",
    fontSize: 14,
    fontWeight: "600",
  },
  activationAreaSlider: {
    width: "100%",
    height: 36,
    marginTop: -2,
  },
  mapChooseLocationButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#0091FF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 4,
  },
  mapChooseLocationButtonDisabled: {
    opacity: 0.45,
  },
  mapChooseLocationButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
