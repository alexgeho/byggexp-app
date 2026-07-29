import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";

export const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: {
    ...standardScreenHeader,
  },
  backButton: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  backZeroButton: {
    padding: 16,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  projectName: {
    color: "#052D50",
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "500",
  },
  titleRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  screenTitle: {
    color: "#052D50",
    fontSize: 36,
    flex: 1,
  },
  exportFabButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  exportFabText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 16,
  },
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingBottom: 96,
    width: "100%",
  },
  loadingContainer: {
    paddingTop: 32,
    alignItems: "center",
  },
  emptyStateText: {
    color: "#698196",
    textAlign: "center",
    marginTop: 24,
  },
  shiftItem: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  shiftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dateText: {
    color: "#0785F4",
  },
  totalText: {
    color: "#0785F4",
  },
  shiftBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shiftProjectContainer: {
    width: "45%",
    gap: 4,
  },
  projectInlineText: {
    color: "#052D50",
    fontWeight: "600",
  },
  workerInlineText: {
    color: "#0785F4",
    fontSize: 13,
    fontWeight: "600",
  },
  locationText: {
    color: "#052D50",
  },
  timeContainer: {
    gap: 4,
    alignItems: "flex-end",
  },
  durationText: {
    color: "#052D50",
  },
  timeRangeText: {
    color: "#052D5050",
  },
  subShift: {
    borderTopWidth: 1,
    borderColor: "#E6E6E6",
    paddingTop: 8,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomSheetBackground: {
    backgroundColor: "#EEEEEE",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleIndicator: {
    backgroundColor: "#CCCCCC",
    width: 40,
    height: 4,
    borderRadius: 2,
    zIndex: 4,
    position: "relative",
  },
  bottomSheetContent: {
    padding: 20,
    paddingTop: 12,
    gap: 12,
  },
  sheetCard: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  exportSheetCard: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    padding: 0,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  workerModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#052D50",
    marginBottom: 20,
  },
  periodContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  periodLabel: {
    fontSize: 16,
    color: "#052D50",
  },
  periodDropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  periodOptions: {
    gap: 12,
  },
  periodOptionButton: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  periodOptionButtonActive: {
    borderColor: "#0091FF",
    backgroundColor: "#EAF4FF",
  },
  periodOptionText: {
    color: "#052D50",
    fontSize: 15,
  },
  periodOptionTextActive: {
    color: "#0091FF",
    fontWeight: "700",
  },
  periodEmptyText: {
    color: "#698196",
    fontSize: 14,
  },
  periodValue: {
    fontSize: 16,
    color: "#052D50",
  },
  dropdownArrow: {
    width: 16,
    height: 16,
    marginLeft: 8,
    tintColor: "#052D50",
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: "#052D50",
    marginBottom: 4,
  },
  dateValueCard: {
    backgroundColor: "rgba(245, 245, 245, 1)",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: "center",
  },
  dateValueCardDisabled: {
    opacity: 0.72,
  },
  dateValueText: {
    fontSize: 15,
    color: "#052D50",
  },
  dateValuePlaceholder: {
    color: "#698196",
  },
  exportButtonsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    padding: 0,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  exportButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  exportButtonActive: {
    borderWidth: 2,
    borderColor: "rgba(7, 133, 244, 1)",
  },
  exportButtonText: {
    fontSize: 16,
    color: "#052D50",
  },
  exportButtonTextActive: {
    fontWeight: "600",
  },
  exportMainButton: {
    width: "100%",
    backgroundColor: "#0091FF",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  exportMainButtonDisabled: {
    opacity: 0.7,
  },
  exportMainButtonText: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 24,
  },
  datePickerCard: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  datePickerTitle: {
    color: "#052D50",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  datePickerButton: {
    alignSelf: "flex-end",
    marginTop: 12,
    backgroundColor: "#0091FF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  datePickerButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
