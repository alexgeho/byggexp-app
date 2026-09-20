import React, { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/ThemeContext";
import { clientService } from "../../../services/client.service";
import { EntityListScreen } from "../../../components/common/EntityListScreen/EntityListScreen";
import { ListCard } from "../../../components/common/ListCard/ListCard";
import { cardStyles } from "../../../styles/cards";
import { getEntityId } from "../../../utils/entityId";

// Kundtyp filter, "all" first so the list opens on every client.
const FILTERS = ["all", "company", "private"];

const clientName = (client) =>
  client?.companyName ||
  [client?.firstName, client?.lastName].filter(Boolean).join(" ");

export default function ClientsScreen() {
  const { t } = useTranslation();
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

  const handleDelete = useCallback(
    async (client) => {
      const id = getEntityId(client);
      try {
        await clientService.remove(id);
        // Drop it only once the backend confirms — no flash/re-appear on error.
        setClients((previous) =>
          previous.filter((item) => getEntityId(item) !== id),
        );
      } catch (error) {
        const status = error?.response?.status;
        const raw = error?.response?.data?.message ?? error?.message;
        const detail = Array.isArray(raw) ? raw.join(", ") : raw;
        console.error("Failed to delete client:", status, detail, error);
        Alert.alert(
          t("common.error"),
          `${t("clientForm.deleteFailed")}\n[${status ?? "?"}] ${detail ?? ""}`,
        );
      }
    },
    [t],
  );

  return (
    <EntityListScreen
      title={t("clientForm.title")}
      data={visibleClients}
      loading={loading}
      keyExtractor={(client, index) => getEntityId(client) || `client-${index}`}
      filters={FILTERS.map((value) => ({
        value,
        label: t(`clients.filter.${value}`),
      }))}
      activeFilter={filter}
      onFilterChange={setFilter}
      onDelete={handleDelete}
      emptyText={t("clientForm.emptyList")}
      addScreen="CreateClient"
      renderCard={(client) => {
        const isPrivate = (client.clientType || "company") === "private";
        return (
          <ListCard
            title={clientName(client) || t("common.noName")}
            badgeLabel={t(isPrivate ? "clients.private" : "clients.company")}
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
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    cardMeta: {
      color: c.textMuted,
      fontSize: 13,
      marginTop: 4,
    },
  });
