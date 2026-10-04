import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
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
          <View
            style={[
              styles.row,
              {
                justifyContent: "space-between",
                marginTop: 8,
                marginBottom: 14,
              },
            ]}
          >
            <Text
              style={{ fontSize: 32, fontWeight: "700", color: c.textPrimary }}
            >
              {t("egenkontroll.title")}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Menu")}
              accessibilityLabel={t("a11y.menu")}
              hitSlop={12}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              <Icon name="menu" size={20} color={c.textPrimary} />
            </TouchableOpacity>
          </View>
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
            ListEmptyComponent={
              <View style={[styles.center, { paddingTop: 48 }]}>
                <Text style={styles.emptyTitle}>
                  {t("egenkontroll.emptyTitle")}
                </Text>
                {home ? null : (
                  <TouchableOpacity
                    style={[styles.primaryButton, { marginTop: 20 }]}
                    onPress={() => navigation.navigate("NewEgenkontroll")}
                  >
                    <Text style={styles.primaryButtonText}>
                      {t("egenkontroll.new")}
                    </Text>
                  </TouchableOpacity>
                )}
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

        {home ? (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate("NewEgenkontroll")}
            >
              <Icon name="plus" size={18} color={c.onAccent} />
              <Text style={styles.primaryButtonText}>
                {t("egenkontroll.new")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <BottomBar
            iconColor={c.textPrimary}
            pillColor={c.surface}
            pillBorderColor={c.border}
            onLeftPress={() => (home ? load() : navigation.navigate("Main"))}
            onRightPress={() => navigation.navigate("Menu")}
            showAddButton
            onAddPress={() => navigation.navigate("NewEgenkontroll")}
          />
        )}
      </View>
    </View>
  );
}
