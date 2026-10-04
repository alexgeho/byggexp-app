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
import { getCompanyPlan } from "../../utils/companyModules";
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
  const home = isHome || getCompanyPlan() === "egenkontroll";

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
        <View style={styles.header}>
          {home ? (
            <View style={styles.headerSpacer} />
          ) : (
            <BackButton
              onPress={() => navigation.goBack()}
              iconSource={require("../../assets/Arrow-left.png")}
            />
          )}
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
                  <Text style={styles.meta}>
                    {t("egenkontroll.pointsDone", { done, total })}
                    {item.date ? ` · ${item.date}` : ""}
                  </Text>
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
          onLeftPress={() => (home ? load() : navigation.navigate("Main"))}
          onRightPress={() => navigation.navigate("Menu")}
          showAddButton
          onAddPress={() => navigation.navigate("NewEgenkontroll")}
        />
      </View>
    </View>
  );
}
