import { Fragment, memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";
import { AppIcon } from "../../../components/common/AppIcon";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { PersonListItem } from "../../../components/common/PersonListItem/PersonListItem";
import { HeaderCheckButton } from "../../../components/common/ui";
import { getWorkerStatusBadge } from "../../../utils/workerStatusBadge";
import { createStyles } from "./CreateProjectScreen.styles";
import { LocationMapPicker } from "./LocationMapPicker";
import { RadiusSlider } from "./RadiusSlider";
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

export const FieldIcon = ({
  library = "feather",
  name,
  size = 20,
  color = "rgba(5, 45, 80, 1)",
}) => {
  // iOS-style: no filled badge behind the glyph, so a white glyph would vanish —
  // render it in systemBlue instead, and keep glyphs at a readable size.
  const isWhite = /^#f{3}$|^#f{6}$/i.test(String(color).replace(/\s/g, ""));
  const resolved = isWhite ? "#007AFF" : color;
  const s = size < 28 ? 28 : size;
  if (library === "material-community") {
    return <MaterialCommunityIcons name={name} size={s} color={resolved} />;
  }

  return <AppIcon name={name} size={s} color={resolved} strokeWidth={1.5} />;
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
  const { theme } = useTheme();
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
            backgroundColor={theme.content.surfaceMuted}
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
  const { theme } = useTheme();
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
            backgroundColor={theme.content.surfaceMuted}
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
  const { theme } = useTheme();
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
            backgroundColor={theme.content.surfaceMuted}
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
  onPickCoordinate,
  onConfirm,
}) => {
  const styles = useThemedStyles();
  const { t } = useTranslation();
  const { theme } = useTheme();
  // A <Modal> gets no safe-area top inset on iOS (SafeAreaView reports 0 inside
  // a Modal — see the design-system notes), so add it manually. Without it the
  // header sits higher than on normal screens and the save button lands at a
  // different height than everywhere else.
  const insets = useSafeAreaInsets();
  // While the radius slider is being dragged, freeze the ScrollView. On Android
  // the vertical ScrollView otherwise intercepts the slider's horizontal drag,
  // so the thumb never moves. Released on slide complete.
  const [isSlidingRadius, setIsSlidingRadius] = useState(false);
  // Same freeze while panning the map or dragging the pin, so the outer
  // ScrollView doesn't steal the gesture.
  const [isMapInteracting, setIsMapInteracting] = useState(false);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.mapModalScreen, { paddingTop: insets.top }]}>
        <View style={styles.mapTopBar}>
          <BackButton
            onPress={onClose}
            iconSource={require("../../../assets/Arrow-left.png")}
          />
          <Text style={styles.mapModalTitle}>
            {t("createProject.projectAddress")}
          </Text>
          {/* Blue checkmark save in the header — same component/colour as the
              CreateProject header so it's identical across screens. Kept always
              solid (not disabled) to match; the press just no-ops until a place
              is chosen. */}
          <HeaderCheckButton
            onPress={() => {
              if (selectedCoordinate) {
                onConfirm();
              }
            }}
            accessibilityLabel={t("common.save")}
          />
        </View>

        <ScrollView
          style={styles.mapModalScroll}
          contentContainerStyle={styles.mapModalScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isSlidingRadius && !isMapInteracting}
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
                    onPress={() => {
                      Keyboard.dismiss();
                      onSelectSuggestion(item);
                    }}
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

            {/* Radius selector ABOVE the map so the on-screen keyboard can't
                cover it (Android). */}
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

            {/* Custom PanResponder slider — claims the touch so the ScrollView
                can't steal the horizontal drag on Android; big white knob with
                an even all-around shadow. */}
            <View style={styles.activationAreaSliderWrap}>
              <RadiusSlider
                min={50}
                max={1500}
                step={50}
                value={radiusMeters}
                onChange={setRadiusMeters}
                onSlidingStart={() => {
                  setIsSlidingRadius(true);
                  Keyboard.dismiss();
                }}
                onSlidingComplete={() => setIsSlidingRadius(false)}
                minTrackColor={theme.colors.primary}
                maxTrackColor="rgba(5, 45, 80, 0.22)"
                thumbSize={44}
              />
            </View>

            <LocationMapPicker
              latitude={selectedCoordinate?.latitude}
              longitude={selectedCoordinate?.longitude}
              radiusMeters={radiusMeters}
              onPickCoordinate={onPickCoordinate}
              onInteractionChange={(interacting) => {
                if (interacting) {
                  Keyboard.dismiss();
                }
                setIsMapInteracting(interacting);
              }}
            />
            <Text style={styles.mapDragHint}>
              {t("createProject.mapDragHint")}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// One borderless line with a floating label — the same row the project name
// and order reference use, so the Ekonomi rows read identically. Nothing here
// is required, so no asterisk.
const FloatingField = ({ label, value, onChangeText, last }) => {
  const styles = useThemedStyles();
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: focused || !!value ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [focused, value, anim]);

  return (
    <View
      style={[
        styles.projectNameField,
        styles.groupedField,
        last ? styles.groupRowLast : null,
      ]}
    >
      <Animated.Text
        pointerEvents="none"
        style={[
          styles.floatingLabel,
          {
            top: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 8] }),
            fontSize: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [16, 12],
            }),
          },
        ]}
      >
        {label}
      </Animated.Text>
      <TextInput
        style={styles.floatingInput}
        keyboardType="numeric"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
};

// Optional economy fields as full-width lines, grouped into three cards of two
// rows each (budget/hours, planned/spent material, cost/bill rate).
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

  const groups = [
    [
      [t("createProject.budget"), budget, setBudget],
      [t("createProject.plannedHours"), plannedHours, setPlannedHours],
    ],
    [
      [
        t("createProject.plannedMaterials"),
        plannedMaterialsCost,
        setPlannedMaterialsCost,
      ],
      [
        t("createProject.spentMaterials"),
        spentMaterialsCost,
        setSpentMaterialsCost,
      ],
    ],
    [
      [t("createProject.costRate"), costRatePerHour, setCostRatePerHour],
      [t("createProject.billRate"), billRatePerHour, setBillRatePerHour],
    ],
  ];

  return (
    <>
      {groups.map((rows, gi) => (
        <View key={gi} style={styles.groupCard}>
          {rows.map(([label, value, onChangeText], ri) => (
            <Fragment key={label}>
              {ri > 0 ? <View style={styles.rowSep} /> : null}
              <FloatingField
                label={label}
                value={value}
                onChangeText={onChangeText}
                last={ri === rows.length - 1}
              />
            </Fragment>
          ))}
        </View>
      ))}
    </>
  );
};
