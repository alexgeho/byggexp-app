import { memo, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { PersonListItem } from "../../../components/common/PersonListItem/PersonListItem";
import {
  Card,
  FieldInput,
  HeaderCheckButton,
  SectionTitle,
} from "../../../components/common/ui";
import { getWorkerStatusBadge } from "../../../utils/workerStatusBadge";
import { createStyles } from "./CreateProjectScreen.styles";
import { useTheme } from "../../../theme/ThemeContext";

const useThemedStyles = () => {
  const { theme } = useTheme();
  return useMemo(() => createStyles(theme.content), [theme.content]);
};

const DATE_PICKER_DISPLAY = Platform.OS === "ios" ? "inline" : "calendar";
const TIME_PICKER_DISPLAY = Platform.OS === "ios" ? "spinner" : "clock";

// Project start / end date picker (one modal for both bounds).
export const ProjectDatePickerModal = ({
  showStart,
  showEnd,
  beginningDate,
  endDate,
  setBeginningDate,
  setEndDate,
  onClose,
}) => {
  const styles = useThemedStyles();
  const { t } = useTranslation();
  return (
    <Modal
      visible={showStart || showEnd}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.datePickerOverlay}>
        <View style={styles.datePickerCard}>
          <Text style={styles.datePickerTitle}>
            {showStart
              ? t("createProject.startDate")
              : t("createProject.endDate")}
          </Text>
          <DateTimePicker
            value={
              showStart ? beginningDate || new Date() : endDate || new Date()
            }
            mode="date"
            display={DATE_PICKER_DISPLAY}
            onChange={(event, date) => {
              if (!date) {
                return;
              }
              if (showStart) {
                setBeginningDate(date);
              } else if (showEnd) {
                setEndDate(date);
              }
            }}
          />
          <View style={styles.datePickerActions}>
            <TouchableOpacity
              style={styles.datePickerSecondaryButton}
              onPress={onClose}
            >
              <Text style={styles.datePickerSecondaryButtonText}>
                {t("common.done")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Work-day start / end time picker (one modal for both bounds).
export const WorkTimePickerModal = ({
  showStart,
  showEnd,
  startTime,
  endTime,
  setStartTime,
  setEndTime,
  onClose,
}) => {
  const styles = useThemedStyles();
  const { t } = useTranslation();
  return (
    <Modal
      visible={showStart || showEnd}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.datePickerOverlay}>
        <View style={styles.datePickerCard}>
          <Text style={styles.datePickerTitle}>
            {showStart
              ? t("createProject.workDayStarts")
              : t("createProject.workDayEnds")}
          </Text>
          <DateTimePicker
            value={showStart ? startTime : endTime}
            mode="time"
            display={TIME_PICKER_DISPLAY}
            onChange={(_event, date) => {
              if (!date) {
                return;
              }
              if (showStart) {
                setStartTime(date);
              } else {
                setEndTime(date);
              }
            }}
          />
          <TouchableOpacity
            style={styles.datePickerSecondaryButton}
            onPress={onClose}
          >
            <Text style={styles.datePickerSecondaryButtonText}>
              {t("common.done")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export const getUserInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "?"
  );
};

export const FieldIcon = ({
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

// isImageDocument / getDocumentTypeMeta now live in utils/documentPreview
// (shared, DRY).

export const ToolsListModal = memo(function ToolsListModal({
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
  const { t } = useTranslation();
  const styles = useThemedStyles();
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
          <Text style={styles.workersModalTitle}>
            {t("createProject.attachToolsTitle")}
          </Text>
          <HeaderCheckButton onPress={onSave} />
        </View>

        <View style={styles.workersSearchBar}>
          <Icon name="search" size={18} color="rgba(5, 45, 80, 0.5)" />
          <TextInput
            value={toolSearch}
            onChangeText={onToolSearchChange}
            placeholder={t("createProject.searchInstruments")}
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
                    {item.name || t("createProject.unnamedInstrument")}
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
              <Text style={styles.workersEmptyText}>
                {t("tools.emptyTitle")}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
});

export const WorkersListModal = memo(function WorkersListModal({
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
  const { t } = useTranslation();
  const styles = useThemedStyles();
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
          <Text style={styles.workersModalTitle}>
            {t("createProject.projectTeamTitle")}
          </Text>
          <HeaderCheckButton onPress={onSave} />
        </View>

        <View style={styles.workersSearchBar}>
          <Icon name="search" size={18} color="rgba(5, 45, 80, 0.5)" />
          <TextInput
            value={workerSearch}
            onChangeText={onWorkerSearchChange}
            placeholder={t("createProject.searchWorkers")}
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
          renderItem={({ item }) => (
            <PersonListItem
              person={item}
              subtitle={item.profession || t("employees.noProfession")}
              statusBadge={getWorkerStatusBadge(item, null, t)}
              selectable
              selected={selectedWorkers.includes(item._id)}
              onPress={() => toggleSelection(item._id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.workersEmptyState}>
              <Text style={styles.workersEmptyText}>
                {t("workers.notFound")}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
});

export const SelectedItem = ({
  title,
  value,
  onPress,
  showArrow = true,
  iconName = "briefcase",
  iconLibrary = "feather",
  containerStyle,
  badgeStyle,
}) => {
  const { t } = useTranslation();
  const styles = useThemedStyles();
  return (
    <TouchableOpacity
      style={[styles.selectableRow, { borderBottomWidth: 0 }, containerStyle]}
      onPress={onPress}
    >
      <View style={styles.rowCenter}>
        <View style={[styles.iconContainer, badgeStyle]}>
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
            <Text style={styles.placeholderText}>
              {t("createProject.selectPlaceholder")}
            </Text>
          )}
        </View>
      </View>
      {showArrow && (
        <Image
          style={styles.arrowIcon}
          source={require("../../../assets/Arrow-right.png")}
          resizeMode="contain"
        />
      )}
    </TouchableOpacity>
  );
};

export const CompaniesListModal = ({
  visible,
  onClose,
  onSelect,
  selectedCompanyId,
  companies,
}) => {
  const { t } = useTranslation();
  const styles = useThemedStyles();
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {t("createProject.selectClientCompany")}
          </Text>
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
            ListEmptyComponent={<Text>{t("createProject.noCompanies")}</Text>}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>
              {t("createProject.close")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export const SingleUserPickerModal = ({
  visible,
  onClose,
  title,
  searchValue,
  onSearchChange,
  selectedUserId,
  onSelect,
  data,
  checkboxStyle,
  checkboxSelectedStyle,
}) => {
  const { t } = useTranslation();
  const styles = useThemedStyles();
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
          <Text style={styles.workersModalTitle}>{title}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.workersSearchBar}>
          <Icon name="search" size={18} color="rgba(5, 45, 80, 0.5)" />
          <TextInput
            value={searchValue}
            onChangeText={onSearchChange}
            placeholder={t("createProject.searchWorkers")}
            placeholderTextColor="rgba(5, 45, 80, 0.5)"
            style={styles.workersSearchInput}
          />
        </View>

        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.workersListContent}
          renderItem={({ item }) => (
            <PersonListItem
              person={item}
              subtitle={item.profession || t("employees.noProfession")}
              statusBadge={getWorkerStatusBadge(item, null, t)}
              selectable
              selected={selectedUserId === item._id}
              onPress={() => onSelect(item._id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.workersEmptyState}>
              <Text style={styles.workersEmptyText}>
                {t("workers.notFound")}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
};

// Full-screen address picker: search field + suggestion list + activation-area
// radius slider. All data (suggestions, loading flags, selection) is owned by
// the parent and passed in; this component only renders and reports events.
export const LocationPickerModal = ({
  visible,
  onClose,
  searchInputRef,
  locationSearch,
  setLocationSearch,
  showSearchHint,
  searchEmptyText,
  isLocationLoading,
  isSearchLoading,
  suggestions,
  onSelectSuggestion,
  location,
  radiusMeters,
  setRadiusMeters,
  selectedCoordinate,
  onConfirm,
}) => {
  const styles = useThemedStyles();
  const { t } = useTranslation();
  const { theme } = useTheme();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.mapModalScreen}>
        <View style={styles.mapTopBar}>
          <BackButton
            onPress={onClose}
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
              ref={searchInputRef}
              autoFocus
              value={locationSearch}
              onChangeText={setLocationSearch}
              placeholder={t("createProject.searchAddress")}
              placeholderTextColor="rgba(5, 45, 80, 0.45)"
              style={styles.mapSearchInput}
              returnKeyType="search"
            />
          </View>

          {showSearchHint ? (
            <View style={styles.mapSuggestionsEmptyState}>
              <Text style={styles.mapSuggestionsEmptyText}>
                {searchEmptyText}
              </Text>
            </View>
          ) : (
            <View style={styles.mapSuggestionsCard}>
              {isLocationLoading || isSearchLoading ? (
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
              ) : suggestions.length ? (
                suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.85}
                    style={[
                      styles.mapSuggestionItem,
                      index === suggestions.length - 1 &&
                        styles.mapSuggestionItemLast,
                    ]}
                    onPress={() => onSelectSuggestion(item)}
                  >
                    <Icon
                      name="map-pin"
                      size={16}
                      color={theme.content.textPrimary}
                    />
                    <Text style={styles.mapSuggestionText}>{item.label}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.mapSuggestionsEmptyState}>
                  <Text style={styles.mapSuggestionsEmptyText}>
                    {searchEmptyText}
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
                  {t("createProject.metersShort", { meters: radiusMeters })}
                </Text>
              </View>
            </View>

            <Slider
              minimumValue={50}
              maximumValue={1500}
              step={50}
              value={radiusMeters}
              onValueChange={setRadiusMeters}
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
              onPress={onConfirm}
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
  );
};

// Optional economy card: budget / hours / material-cost / rate fields, laid
// out in three two-up rows.
export const EconomySection = ({
  budget,
  setBudget,
  plannedHours,
  setPlannedHours,
  plannedMaterialsCost,
  setPlannedMaterialsCost,
  spentMaterialsCost,
  setSpentMaterialsCost,
  costRatePerHour,
  setCostRatePerHour,
  billRatePerHour,
  setBillRatePerHour,
}) => {
  const styles = useThemedStyles();
  const { t } = useTranslation();
  return (
    <Card style={styles.fieldCardPad}>
      <SectionTitle>{t("createProject.economySection")}</SectionTitle>
      <View style={styles.fieldRow}>
        <FieldInput
          half
          keyboardType="numeric"
          label={t("createProject.budget")}
          value={budget}
          onChangeText={setBudget}
        />
        <FieldInput
          half
          keyboardType="numeric"
          label={t("createProject.plannedHours")}
          value={plannedHours}
          onChangeText={setPlannedHours}
        />
      </View>
      <View style={styles.fieldRow}>
        <FieldInput
          half
          keyboardType="numeric"
          label={t("createProject.plannedMaterials")}
          value={plannedMaterialsCost}
          onChangeText={setPlannedMaterialsCost}
        />
        <FieldInput
          half
          keyboardType="numeric"
          label={t("createProject.spentMaterials")}
          value={spentMaterialsCost}
          onChangeText={setSpentMaterialsCost}
        />
      </View>
      <View style={styles.fieldRow}>
        <FieldInput
          half
          keyboardType="numeric"
          label={t("createProject.costRate")}
          value={costRatePerHour}
          onChangeText={setCostRatePerHour}
        />
        <FieldInput
          half
          keyboardType="numeric"
          label={t("createProject.billRate")}
          value={billRatePerHour}
          onChangeText={setBillRatePerHour}
        />
      </View>
    </Card>
  );
};

// Contract card: contract number + littera.
export const ContractSection = ({
  contractNumber,
  setContractNumber,
  littera,
  setLittera,
}) => {
  const styles = useThemedStyles();
  const { t } = useTranslation();
  return (
    <Card style={styles.fieldCardPad}>
      <SectionTitle>{t("createProject.contractSection")}</SectionTitle>
      <FieldInput
        label={t("createProject.contractNumber")}
        value={contractNumber}
        onChangeText={setContractNumber}
      />
      <FieldInput
        label={t("createProject.littera")}
        value={littera}
        onChangeText={setLittera}
      />
    </Card>
  );
};
