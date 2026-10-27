import React, { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/ThemeContext";
import { materialOrderService } from "../../../services/material-order.service";
import { EntityListScreen } from "../../../components/common/EntityListScreen/EntityListScreen";
import { ListCard } from "../../../components/common/ListCard/ListCard";
import { getApiErrorMessage } from "../../../utils/apiError";

// Grossists material is ordered from — mirror of the admin web «Leverantörer».
// Swipe-delete hides one from new orders; its articles and orders stay.
export default function SuppliersScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setSuppliers(await materialOrderService.listSuppliers());
    } catch {
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = useCallback(
    async (item) => {
      try {
        await materialOrderService.removeSupplier(item.supplier);
        setSuppliers((prev) =>
          prev.filter((s) => s.supplier !== item.supplier),
        );
      } catch (error) {
        Alert.alert(t("common.error"), getApiErrorMessage(error, ""));
      }
    },
    [t],
  );

  return (
    <EntityListScreen
      title={t("suppliers.title")}
      data={suppliers}
      loading={loading}
      keyExtractor={(item) => item.supplier}
      onDelete={handleDelete}
      emptyText={t("suppliers.empty")}
      addScreen="Supplier"
      renderCard={(item) => (
        <ListCard
          title={item.supplier}
          onPress={() => navigation.navigate("Supplier", { supplier: item })}
        >
          <Text style={styles.cardMeta} numberOfLines={1}>
            {[item.orderEmail, item.customerNumber]
              .filter(Boolean)
              .join(" · ") || "—"}
          </Text>
        </ListCard>
      )}
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
