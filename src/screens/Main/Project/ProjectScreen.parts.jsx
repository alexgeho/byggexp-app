import React from "react";
import { ScrollView, Text, TouchableOpacity } from "react-native";

// The project detail tabs. Data-driven so the six near-identical TouchableOpacity
// blocks become one map; the Economy tab is finance-gated. Behaviour and order
// are unchanged from the inline version.
const PROJECT_TABS = [
  { key: "Tasks", labelKey: "project.tabs.tasks" },
  { key: "Documents", labelKey: "project.tabs.documents" },
  { key: "Workers", labelKey: "project.tabs.workers" },
  { key: "Tools", labelKey: "project.tabs.tools" },
  { key: "Photos", labelKey: "project.tabs.photos" },
  { key: "Economy", labelKey: "project.tabs.economy", financeOnly: true },
];

export function ProjectTabBar({
  active,
  onSelect,
  canSeeFinance,
  styles,
  activeColor,
  t,
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabScroll}
      contentContainerStyle={styles.tabContainer}
    >
      {PROJECT_TABS.filter((tab) => !tab.financeOnly || canSeeFinance).map(
        (tab) => {
          const isActive = active === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onSelect(tab.key)}
              style={[
                styles.tabButton,
                isActive && styles.activeTab,
                isActive && { borderColor: activeColor },
              ]}
            >
              <Text
                style={[styles.tabText, isActive && { color: activeColor }]}
              >
                {t(tab.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        },
      )}
    </ScrollView>
  );
}
