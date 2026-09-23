import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../../styles/screenLayout";
import { onDark } from "../../../theme/colorUtils";

export const createStyles = (c) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    pageContainer: {
      ...standardScreenContainer,
      backgroundColor: c.background,
    },
    contentScroll: {
      flex: 1,
      width: "100%",
    },
    contentScrollContent: {
      paddingBottom: 140,
      gap: 12,
    },
    // "Loading…" under the spinner: without a colour it renders RN's default
    // black, which disappears on the dark page.
    emptyListText: {
      color: onDark(c, c.textMuted, "#000000"),
    },
    loadingText: {
      color: onDark(c, c.textMuted, "#000000"),
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
      color: c.textPrimary,
      fontSize: 17,
      textAlign: "center",
    },
    formSectionTitle: {
      color: c.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 8,
      marginTop: 8,
      paddingHorizontal: 8,
    },
    groupCard: {
      width: "100%",
      backgroundColor: c.surface,
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 20,
      borderWidth: 0,
    },
    sheetContainer: {
      flex: 1,
      backgroundColor: c.background,
    },
    sheetContent: {
      padding: 16,
      paddingBottom: 60,
    },
    // Inline shift-schedule editing (no drill-in): time pickers + grace pills.
    scheduleInlineRow: {
      minHeight: 52,
      paddingHorizontal: 16,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    scheduleInlineColRow: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    scheduleInlineLabel: {
      color: c.textPrimary,
      fontSize: 16,
    },
    gracePills: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 10,
    },
    gracePill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: c.inputSurface,
    },
    gracePillOn: {
      backgroundColor: "#007AFF",
    },
    gracePillText: {
      color: c.textPrimary,
      fontSize: 15,
    },
    gracePillTextOn: {
      color: "#FFFFFF",
    },
    groupedField: {
      backgroundColor: "transparent",
      borderRadius: 0,
      marginBottom: 0,
    },
    groupRowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    // iOS inset separators: a hairline child line (not a row border), so it can
    // start at the label without widening the row / clipping trailing controls.
    rowSep: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.divider,
      marginLeft: 16, // rows without a leading icon
    },
    rowSepIcon: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.divider,
      marginLeft: 58, // rows with a leading icon (16 + 30 icon + 12 gap)
    },
    groupRowLast: {
      borderBottomWidth: 0,
    },
    groupRowDisabled: {
      opacity: 0.45,
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
      backgroundColor: c.surface,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      // Match every other block's gap (groupCard = 20) so the space above and
      // below the Anteckning card is identical.
      marginBottom: 20,
      borderWidth: 0,
    },
    fieldCardPad: {
      marginBottom: 20,
    },
    // Ekonomi/Avtal: black section headers + black field labels (match the
    // create-project row titles), replacing the muted grey secondaryLabel.
    ecoSectionTitleBlack: {
      color: c.textPrimary,
    },
    ecoFieldLabelBlack: {
      color: c.textPrimary,
      opacity: 1,
    },
    fieldRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 14,
    },
    inputsContainer: {
      padding: 18,
      backgroundColor: c.surface,
      borderRadius: 16,
      width: "100%",
      gap: 8,
      marginBottom: 12,
      borderWidth: 0,
    },
    input: {
      paddingBottom: 12,
      paddingTop: 12,
      color: c.textMuted,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    projectNameField: {
      width: "100%",
      height: 56,
      position: "relative",
      backgroundColor: c.surface,
      borderRadius: 20,
      paddingHorizontal: 16,
      marginBottom: 8,
      borderWidth: 0,
    },
    switchField: {
      width: "100%",
      // A long label (it wraps to two lines in Russian and German) used to push
      // the switch past the card's right edge, where it could barely be hit.
      // The row grows instead, and the label gets the space that is left.
      minHeight: 56,
      paddingVertical: 8,
      backgroundColor: c.surface,
      borderRadius: 20,
      paddingHorizontal: 16,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 0,
    },
    floatingLabel: {
      position: "absolute",
      left: 16,
      color: c.textPrimary,
      opacity: 0.5,
    },
    floatingInput: {
      width: "100%",
      height: "100%",
      paddingTop: 22,
      paddingBottom: 0,
      color: c.textPrimary,
      fontSize: 16,
    },
    switchLabel: {
      color: c.textPrimary,
      fontSize: 16,
      flex: 1,
      marginRight: 12,
    },
    switchControl: {
      // No fixed frame: iOS draws the switch at its own size and a frame that
      // disagrees with it pushed the control out past the card's padding —
      // it ended up ~4pt from the edge where the label sits at 16.
      alignSelf: "center",
      marginVertical: 0,
    },
    locationField: {
      width: "100%",
      height: 56,
      backgroundColor: c.surface,
      borderRadius: 20,
      paddingHorizontal: 16,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 0,
    },
    locationFieldContent: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingRight: 12,
    },
    locationFieldIconContainer: {
      width: 30,
      height: 30,
      borderRadius: 5,
      alignItems: "center",
      justifyContent: "center",
    },
    locationFieldText: {
      flex: 1,
      fontSize: 16,
    },
    locationFieldPlaceholder: {
      // iOS nav rows: the label stays black (like a button), not grey.
      color: c.textPrimary,
    },
    locationFieldValue: {
      color: c.textPrimary,
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
      backgroundColor: c.surfaceMuted,
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
      color: c.textPrimary,
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
      color: c.textPrimary,
      fontSize: 10,
      fontWeight: "600",
    },
    firstInput: {
      borderBottomWidth: 1,
      borderColor: c.border,
    },
    selectableRow: {
      width: "100%",
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      borderWidth: 0,
    },
    rowCenter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    iconContainer: {
      width: 30,
      height: 30,
      borderRadius: 5,
      alignItems: "center",
      justifyContent: "center",
    },
    smallIcon: {
      width: 20,
      height: 20,
    },
    label: {
      color: c.textPrimary,
      fontSize: 14,
    },
    selectedValue: {
      color: c.textPrimary,
      fontSize: 16,
    },
    placeholderText: {
      color: c.textMuted,
      fontSize: 14,
    },
    arrowIcon: {
      width: 10,
      height: 16,
    },
    datesContainer: {
      width: "100%",
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
      borderWidth: 0,
    },
    dateButton: {
      flex: 1,
      padding: 8,
    },
    dateLabel: {
      color: c.textPrimary,
      fontSize: 12,
      marginBottom: 4,
    },
    dateValue: {
      color: c.textPrimary,
      fontSize: 14,
    },
    datePickerOverlay: {
      flex: 1,
      backgroundColor: onDark(c, c.divider, "rgba(5, 45, 80, 0.28)"),
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    datePickerCard: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: c.surface,
      borderRadius: 10,
      padding: 16,
      borderWidth: 0,
    },
    datePickerTitle: {
      color: c.textPrimary,
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
    },
    datePickerSecondaryButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "600",
    },
    noteInput: {
      // A solid background (matching the card) forces a ColorDrawable that
      // replaces the native EditText background — removing its bottom underline
      // on Android (Fabric ignores underlineColorAndroid). "transparent" wasn't
      // enough; the card colour keeps it visually identical.
      backgroundColor: c.surface,
      borderRadius: 0,
      padding: 0,
      width: "100%",
      minHeight: 64,
      textAlignVertical: "top",
      color: c.textPrimary,
    },
    workersModalContainer: {
      flex: 1,
      backgroundColor: c.background,
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
      color: c.textPrimary,
      fontSize: 17,
      fontFamily: "DMSans-SemiBold",
    },
    workersSearchBar: {
      height: 56,
      borderRadius: 20,
      backgroundColor: c.surface,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 16,
      borderWidth: 0,
    },
    workersSearchInput: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 16,
    },
    workersListContent: {
      paddingBottom: 20,
    },
    workerCard: {
      height: 72,
      borderRadius: 100,
      backgroundColor: c.surface,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      gap: 12,
      marginBottom: 12,
      borderWidth: 0,
    },
    workerAvatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 10,
      backgroundColor: c.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    workerAvatarInitials: {
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    workerCardInfo: {
      flex: 1,
      justifyContent: "center",
    },
    workerCardName: {
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 2,
    },
    workerCardProfession: {
      color: c.textMuted,
      fontSize: 14,
    },
    workerCheckbox: {
      width: 24,
      height: 24,
      borderRadius: 7,
      borderWidth: 0,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surface,
    },
    workerCheckboxSelected: {
      backgroundColor: c.surface,
    },
    workersEmptyState: {
      paddingTop: 24,
      alignItems: "center",
    },
    workersEmptyText: {
      color: c.textMuted,
      fontSize: 16,
    },
    workersModalFooter: {
      paddingTop: 8,
    },
    createButton: {
      backgroundColor: "#0091FF",
      padding: 16,
      borderRadius: 10,
      alignItems: "center",
      marginBottom: 100,
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
      backgroundColor: c.surface,
      width: "90%",
      maxHeight: "80%",
      borderRadius: 16,
      padding: 16,
      borderWidth: 0,
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
      borderBottomColor: c.divider,
    },
    selectedUserItem: {
      backgroundColor: c.accentSoft,
    },
    userName: {
      fontSize: 16,
      fontWeight: "600",
    },
    userEmail: {
      fontSize: 14,
      color: c.textMuted,
    },
    closeButton: {
      marginTop: 16,
      padding: 12,
      backgroundColor: "#0091FF",
      borderRadius: 8,
      alignItems: "center",
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
      backgroundColor: c.background,
    },
    accessDeniedText: {
      fontSize: 24,
      fontWeight: "bold",
      color: c.textPrimary,
      marginBottom: 12,
    },
    accessDeniedSubtext: {
      fontSize: 16,
      color: c.textMuted,
      textAlign: "center",
      marginBottom: 32,
    },
    backButton: {
      backgroundColor: c.accent,
      paddingVertical: 15,
      paddingHorizontal: 40,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "stretch",
    },
    backButtonText: {
      color: "#ffffff",
      fontSize: 17,
      fontWeight: "700",
      textAlign: "center",
    },
    mapModalScreen: {
      flex: 1,
      ...standardScreenContainer,
      backgroundColor: c.background,
      gap: 0,
    },
    mapModalKeyboard: {
      flex: 1,
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
      color: c.textPrimary,
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
      borderWidth: 0,
      backgroundColor: c.surface,
      paddingHorizontal: 16,
    },
    mapUseCurrentRow: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      marginTop: 4,
    },
    mapUseCurrentText: {
      fontSize: 15,
      fontWeight: "500",
    },
    mapSearchInput: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 16,
      paddingVertical: 16,
    },
    mapSuggestionsCard: {
      // Theme surface: white suggestions on the dark theme hid white text.
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    mapSuggestionsLoadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 32,
      paddingVertical: 4,
    },
    mapSuggestionsLoadingText: {
      color: c.textPrimary,
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
      borderBottomColor: c.divider,
    },
    mapSuggestionItemLast: {
      borderBottomWidth: 0,
    },
    mapSuggestionText: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 14,
      lineHeight: 20,
    },
    mapSuggestionsEmptyText: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
    mapSuggestionsEmptyState: {
      paddingVertical: 10,
    },
    mapBottomPanel: {
      // Was a hardcoded near-white: on the dark theme it made a light slab
      // with white text on it.
      backgroundColor: c.surface,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 14,
      borderWidth: 0,
      gap: 12,
    },
    mapBottomPanelTitle: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    mapBottomLocationText: {
      color: c.textPrimary,
      fontSize: 14,
      lineHeight: 20,
    },
    mapBottomLocationPlaceholder: {
      color: c.placeholder,
    },
    mapDragHint: {
      color: c.textMuted,
      fontSize: 12,
      lineHeight: 16,
      marginTop: -4,
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
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    activationAreaSubtitle: {
      color: c.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    activationAreaBadge: {
      minWidth: 78,
      height: 36,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: c.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    activationAreaBadgeText: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: "600",
    },
    activationAreaSliderWrap: {
      width: "100%",
    },
    activationAreaSlider: {
      width: "100%",
      height: 44,
      marginTop: 2,
    },
    mapChooseLocationButton: {
      width: "100%",
      minHeight: 52,
      borderRadius: 16,
      backgroundColor: "#0091FF",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
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
