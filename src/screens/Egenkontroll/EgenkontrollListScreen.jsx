import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/ThemeContext";
import { checklistService } from "../../services";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import { getEntityId } from "../../utils/entityId";
import { isEgenkontrollOnly } from "../../utils/companyModules";
import { createStyles, statusColors } from "./Egenkontroll.styles";

// Egenkontroller list. For the solo "Egenkontroll" plan this is the home
// screen (no back button; the menu stays reachable from the bottom bar).
export default function EgenkontrollListScreen({ isHome = false }) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const c = theme.content;
  const styles = useMemo(() => createStyles(c), [c]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const home = isHome || isEgenkontrollOnly();
  // Getting started (solo plan): ticks off from real data, gone when all done.
  const onboardingSteps = [
    {
      key: "avtal",
      label: "egenkontroll.onboardingContract",
      done: items.length > 0,
    },
    {
      key: "foto",
      label: "egenkontroll.onboardingPhotos",
      done: items.some((it) => it.photos?.length),
    },
    {
      key: "sign",
      label: "egenkontroll.sign",
      done: items.some((it) => it.status === "signed"),
    },
  ];
  const onboardingDone = onboardingSteps.every((step) => step.done);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await checklistService.getAll();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load egenkontroller:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={styles.screen}>
      <View style={styles.pageContainer}>
        {home ? (
          <Text
            style={{
              fontSize: 32,
              fontWeight: "700",
              color: c.textPrimary,
              marginTop: 8,
              marginBottom: 14,
            }}
          >
            {t("egenkontroll.title")}
          </Text>
        ) : (
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
              {t("egenkontroll.title")}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
        )}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={items}
            keyExtractor={(item) => getEntityId(item)}
            ListHeaderComponent={
              home && !onboardingDone ? (
                <View style={[styles.row, { marginBottom: 4 }]}>
                  {onboardingSteps.map((step, i) => (
                    <View
                      key={step.key}
                      style={{ flex: 1, alignItems: "center", gap: 6 }}
                    >
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: step.done ? c.success : c.accentSoft,
                        }}
                      >
                        <Text
                          style={{
                            color: step.done ? c.onAccent : c.accent,
                            fontSize: 13,
                            fontWeight: "700",
                          }}
                        >
                          {step.done ? "✓" : i + 1}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: step.done ? c.success : c.textSecondary,
                        }}
                      >
                        {t(step.label)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={[styles.center, { paddingTop: 48 }]}>
                <Text style={styles.emptyTitle}>
                  {t("egenkontroll.emptyTitle")}
                </Text>
                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: 20 }]}
                  onPress={() => navigation.navigate("NewEgenkontroll")}
                >
                  <Text style={styles.primaryButtonText}>
                    {t("egenkontroll.new")}
                  </Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => {
              const total = item.items?.length || 0;
              const done = (item.items || []).filter(
                (it) => it.result && it.result !== "pending",
              ).length;
              const sc = statusColors(c, item.status);
              return (
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate("Egenkontroll", {
                      id: getEntityId(item),
                    })
                  }
                >
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={[styles.row, { marginTop: 4 }]}>
                    <View
                      style={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: c.inputSurface,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: `${total ? Math.round((done / total) * 100) : 0}%`,
                          height: "100%",
                          backgroundColor: c.success,
                        }}
                      />
                    </View>
                    <Text style={styles.meta}>
                      {done}/{total}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      styles.row,
                      { gap: 6, backgroundColor: sc.bg },
                    ]}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: sc.fg,
                      }}
                    />
                    <Text style={[styles.statusText, { color: sc.fg }]}>
                      {t(`egenkontroll.status.${item.status || "draft"}`)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        <BottomBar
          iconColor={c.textPrimary}
          pillColor={c.surface}
          pillBorderColor={c.border}
          onLeftPress={() => (home ? load() : navigation.navigate("Main"))}
          onRightPress={() => navigation.navigate("Menu")}
          showAddButton
          onAddPress={() => navigation.navigate("NewEgenkontroll")}
        />
      </View>
    </View>
  );
}
