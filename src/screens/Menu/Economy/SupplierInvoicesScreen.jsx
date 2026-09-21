import React, { useCallback, useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { supplierInvoiceService } from "../../../services";
import { EntityListScreen } from "../../../components/common/EntityListScreen/EntityListScreen";
import { ListCard } from "../../../components/common/ListCard/ListCard";
import { getDateLocale } from "../../../utils/dateLocale";
import { sortByNewest } from "../../../utils/sortByNewest";
import { useCardStyles } from "../../../styles/cards";
import { useTheme } from "../../../theme/ThemeContext";

// The bills the company has to PAY (leverantörsfakturor) — the other side of
// the invoices it sends out. This is where the "unpaid invoice" reminder lands:
// the push carries the invoice's id, and the row it points at opens first.
const FILTERS = ["unpaid", "paid", "all"];

const dueDays = (invoice) => {
  const due = String(invoice?.dueDate || "").slice(0, 10);
  if (!due) return null;
  const end = Date.parse(`${due}T00:00:00`);
  if (Number.isNaN(end)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((end - today.getTime()) / 86400000);
};

export default function SupplierInvoicesScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const cardStyles = useCardStyles();
  const route = useRoute();
  const highlightId = route.params?.entityId || null;

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("unpaid");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supplierInvoiceService.getAll();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load supplier invoices:", error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visible = useMemo(() => {
    const byStatus = invoices.filter((invoice) => {
      const paid = String(invoice?.status || "") === "paid";
      if (filter === "paid") return paid;
      if (filter === "unpaid") return !paid;
      return true;
    });
    // The one the notification points at goes first, whatever the sort says.
    const sorted = sortByNewest(byStatus, (invoice) => [
      invoice?.dueDate,
      invoice?.createdAt,
    ]);
    if (!highlightId) return sorted;
    const index = sorted.findIndex(
      (invoice) => String(invoice._id || invoice.id) === String(highlightId),
    );
    if (index <= 0) return sorted;
    const copy = [...sorted];
    const [picked] = copy.splice(index, 1);
    return [picked, ...copy];
  }, [invoices, filter, highlightId]);

  const markPaid = useCallback(
    async (invoice) => {
      const id = invoice._id || invoice.id;
      try {
        await supplierInvoiceService.setStatus(id, "paid");
        setInvoices((previous) =>
          previous.map((item) =>
            String(item._id || item.id) === String(id)
              ? { ...item, status: "paid" }
              : item,
          ),
        );
      } catch (error) {
        console.error("Failed to mark supplier invoice paid:", error);
        Alert.alert(t("common.error"), t("supplierInvoices.markPaidFailed"));
      }
    },
    [t],
  );

  const formatMoney = (value) =>
    `${new Intl.NumberFormat(getDateLocale(), {
      maximumFractionDigits: 0,
    }).format(Number(value) || 0)} kr`;

  return (
    <EntityListScreen
      title={t("supplierInvoices.title")}
      data={visible}
      loading={loading}
      keyExtractor={(invoice, index) =>
        invoice._id || invoice.id || `bill-${index}`
      }
      filters={FILTERS.map((value) => ({
        value,
        label: t(`supplierInvoices.filter.${value}`),
      }))}
      activeFilter={filter}
      onFilterChange={setFilter}
      emptyText={t("supplierInvoices.empty")}
      // Swipe right to settle it — the counterpart of the delete swipe, and
      // the same gesture the home card's checkbox does.
      leftAction={{
        icon: "check",
        label: t("supplierInvoices.markPaid"),
        color: "#04B251",
        onPress: markPaid,
      }}
      renderCard={(invoice) => {
        const days = dueDays(invoice);
        const paid = String(invoice.status || "") === "paid";
        const overdue = !paid && days !== null && days < 0;
        const badgeLabel = paid
          ? t("supplierInvoices.status.paid")
          : overdue
            ? t("supplierInvoices.overdueBy", { days: Math.abs(days) })
            : days === null
              ? t("supplierInvoices.status.unpaid")
              : t("supplierInvoices.dueIn", { days });

        return (
          <ListCard
            title={invoice.supplierName || t("supplierInvoices.unknown")}
            badgeLabel={badgeLabel}
            badgeStyle={
              paid
                ? cardStyles.cardBadgeCompleted
                : overdue
                  ? cardStyles.cardBadgeOverdue
                  : cardStyles.cardBadgeOpen
            }
            onPress={paid ? undefined : () => markPaid(invoice)}
          >
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Text
                style={[
                  cardStyles.cardPrimaryText,
                  { color: theme.colors.primary },
                ]}
              >
                {formatMoney(invoice.total)}
              </Text>
              <Text style={cardStyles.cardSecondaryText} numberOfLines={1}>
                {[invoice.invoiceNumber, invoice.category]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>
          </ListCard>
        );
      }}
    />
  );
}
