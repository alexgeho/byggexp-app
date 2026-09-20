import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/ThemeContext";
import { clientService } from "../../../services/client.service";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { ListCard } from "../../../components/common/ListCard/ListCard";
import { cardStyles } from "../../../styles/cards";
import { getEntityId } from "../../../utils/entityId";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";

// Kundtyp filter, "all" first so the list opens on every client.
const FILTERS = ["all", "company", "private"];

const clientName = (client) =>
  client?.companyName ||
  [client?.firstName, client?.lastName].filter(Boolean).join(" ");

// Klienter — a list screen like Projekt / Anställda / Verktyg: cards, a filter
// on top and a "+" that opens the form on its own screen (it used to sit inline
// above the list, which buried the clients themselves).
export default function ClientsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await clientService.getAll();
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load clients:", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visibleClients = useMemo(() => {
    if (filter === "all") return clients;
    // Clients saved before the type existed default to "company" server-side.
    return clients.filter(
      (client) => (client?.clientType || "company") === filter,
    );
  }, [clients, filter]);

  return (
    <View style={styles.screen}>
      <View style={styles.pageContainer}>
        <View style={styles.header}>
          <BackButton
            onPress={() => navigation.goBack()}
            iconSource={require("../../../assets/Arrow-left.png")}
          />
          <Text style={styles.headerTitle}>{t("clientForm.title")}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((value) => {
            const active = filter === value;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(value)}
                activeOpacity={0.85}
              >
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                >
                  {t(`clients.filter.${value}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            data={visibleClients}
            keyExtractor={(client, index) =>
              getEntityId(client) || `client-${index}`
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>
                  {t("clientForm.emptyList")}
                </Text>
              </View>
            }
            renderItem={({ item: client }) => {
              const isPrivate = (client.clientType || "company") === "private";
              return (
                <ListCard
                  title={clientName(client) || t("common.noName")}
                  badgeLabel={t(
                    isPrivate ? "clients.private" : "clients.company",
                  )}
                  badgeStyle={
                    isPrivate
                      ? cardStyles.cardBadgeOccupied
                      : cardStyles.cardBadgeAvailable
                  }
                >
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {[client.customerNumber, client.email, client.phone]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </ListCard>
              );
            }}
          />
        )}

        <BottomBar
          onLeftPress={() => navigation.navigate("Main")}
          onRightPress={() => navigation.navigate("Menu")}
          showAddButton={true}
          onAddPress={() => navigation.navigate("CreateClient")}
        />
      </View>
    </View>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    pageContainer: {
      ...standardScreenContainer,
      backgroundColor: c.background,
      paddingBottom: 0,
    },
    header: {
      ...standardScreenHeader,
    },
    headerTitle: {
      color: c.textPrimary,
      fontSize: 17,
      textAlign: "center",
      flex: 1,
    },
    headerSpacer: {
      width: 44,
    },
    filterRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },
    filterChip: {
      paddingHorizontal: 16,
      height: 36,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surfaceMuted,
    },
    filterChipActive: {
      backgroundColor: "#0785F4",
    },
    filterText: {
      color: c.textPrimary,
      fontSize: 14,
    },
    filterTextActive: {
      color: "#FFFFFF",
      fontWeight: "600",
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    list: {
      flex: 1,
      width: "100%",
    },
    listContent: {
      paddingBottom: 140,
    },
    cardMeta: {
      color: c.textMuted,
      fontSize: 13,
      marginTop: 4,
    },
    emptyState: {
      paddingVertical: 48,
      paddingHorizontal: 24,
      alignItems: "center",
    },
    emptyTitle: {
      fontSize: 15,
      color: c.textMuted,
      textAlign: "center",
    },
  });
