import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

// Presentational sub-components split out of ShiftsScreen to keep that file
// smaller. Each is self-contained: it receives the themed `styles` object and
// `t` from the parent, so it does no data-fetching or theming of its own.

// Admin filter: pick which employees the calendar/export is scoped to.
export function EmployeePickerModal({
  visible,
  employees,
  filterWorkerIds,
  setFilterWorkerIds,
  onClose,
  styles,
  t,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.datePickerOverlay}>
        <View style={styles.employeePickerCard}>
          <Text style={styles.datePickerTitle}>
            {t("shifts.selectEmployees")}
          </Text>
          <ScrollView style={styles.employeeList}>
            <TouchableOpacity
              style={styles.employeeRow}
              onPress={() => setFilterWorkerIds([])}
            >
              <Text style={styles.employeeName}>
                {t("shifts.allEmployees")}
              </Text>
              {filterWorkerIds.length === 0 ? (
                <Text style={styles.employeeCheck}>✓</Text>
              ) : null}
            </TouchableOpacity>
            {employees.map((emp) => {
              const id = String(emp._id || emp.id);
              const selected = filterWorkerIds.includes(id);
              return (
                <TouchableOpacity
                  key={id}
                  style={styles.employeeRow}
                  onPress={() =>
                    setFilterWorkerIds((prev) =>
                      prev.includes(id)
                        ? prev.filter((x) => x !== id)
                        : [...prev, id],
                    )
                  }
                >
                  <Text style={styles.employeeName} numberOfLines={1}>
                    {emp.name || emp.email}
                  </Text>
                  {selected ? (
                    <Text style={styles.employeeCheck}>✓</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.datePickerButton} onPress={onClose}>
            <Text style={styles.datePickerButtonText}>{t("common.done")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
