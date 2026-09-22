import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
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
  const navigation = useNavigation();
  const highlightId = route.params?.entityId || null;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("unpaid");
  // Tapping a bill used to settle it on the spot. It opens its actions now —
  // a received invoice can also be corrected, and a booked one is corrected by
  // crediting it, not by deleting it.
  const [actionItem, setActionItem] = useState(null);
  const [busyAction, setBusyAction] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditingPartly, setCreditingPartly] = useState(false);

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

  const runAction = async (work) => {
    setBusyAction(true);
    try {
      await work();
      setActionItem(null);
      setCreditingPartly(false);
      setCreditAmount("");
      await load();
    } catch (error) {
      console.error("Supplier invoice action failed:", error);
      Alert.alert(
        t("common.error"),
        error?.response?.data?.message ||
          error?.message ||
          t("supplierInvoices.actionFailed"),
      );
    } finally {
      setBusyAction(false);
    }
  };

  const creditInvoice = (invoice, amount) =>
    runAction(() =>
      supplierInvoiceService.credit(
        invoice._id || invoice.id,
        amount == null ? undefined : amount,
      ),
    );

  const confirmDelete = (invoice) =>
    Alert.alert(t("economy.deleteTitle"), t("economy.deleteMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () =>
          runAction(() =>
            supplierInvoiceService.remove(invoice._id || invoice.id),
          ),
      },
    ]);

  const formatMoney = (value) =>
    `${new Intl.NumberFormat(getDateLocale(), {
      maximumFractionDigits: 0,
    }).format(Number(value) || 0)} kr`;

  return (
    <>
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
        addScreen="CreateSupplierInvoice"
        onDelete={confirmDelete}
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
              onPress={() => setActionItem(invoice)}
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

      <Modal
        visible={Boolean(actionItem)}
        transparent
        animationType="slide"
        onRequestClose={() => setActionItem(null)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => {
            setActionItem(null);
            setCreditingPartly(false);
          }}
        >
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.grab} />

            {busyAction ? (
              <ActivityIndicator
                color={theme.colors.primary}
                style={{ marginVertical: 18 }}
              />
            ) : creditingPartly ? (
              <>
                <Text style={styles.sheetTitle}>
                  {t("supplierInvoices.creditPartly")}
                </Text>
                <TextInput
                  style={styles.amountInput}
                  value={creditAmount}
                  onChangeText={setCreditAmount}
                  keyboardType="decimal-pad"
                  placeholder={t("supplierInvoices.amountExclVat")}
                  placeholderTextColor={theme.content.placeholder}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() =>
                    creditInvoice(
                      actionItem,
                      Number(String(creditAmount).replace(",", ".")) || 0,
                    )
                  }
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>
                    {t("economy.creditInvoice")}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => {
                    const invoice = actionItem;
                    setActionItem(null);
                    navigation.navigate("CreateSupplierInvoice", { invoice });
                  }}
                  activeOpacity={0.8}
                >
                  <Icon name="edit-2" size={20} color={theme.colors.primary} />
                  <Text style={styles.rowText}>{t("common.edit")}</Text>
                </TouchableOpacity>

                {String(actionItem?.status || "") !== "paid" ? (
                  <TouchableOpacity
                    style={styles.row}
                    onPress={() => runAction(() => markPaid(actionItem))}
                    activeOpacity={0.8}
                  >
                    <Icon name="check-circle" size={20} color="#04B251" />
                    <Text style={styles.rowText}>
                      {t("supplierInvoices.markPaid")}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {!actionItem?.creditOfId ? (
                  <>
                    <TouchableOpacity
                      style={styles.row}
                      onPress={() => creditInvoice(actionItem, null)}
                      activeOpacity={0.8}
                    >
                      <Icon
                        name="rotate-ccw"
                        size={20}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.rowText}>
                        {t("supplierInvoices.creditFull")}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.row}
                      onPress={() => setCreditingPartly(true)}
                      activeOpacity={0.8}
                    >
                      <Icon
                        name="divide-circle"
                        size={20}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.rowText}>
                        {t("supplierInvoices.creditPartly")}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : null}

                <TouchableOpacity
                  style={styles.row}
                  onPress={() => confirmDelete(actionItem)}
                  activeOpacity={0.8}
                >
                  <Icon name="trash-2" size={20} color="#E5484D" />
                  <Text style={[styles.rowText, styles.rowDanger]}>
                    {t("common.delete")}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function createStyles(theme) {
  const c = theme.content;
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(5, 25, 50, 0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 28,
      gap: 4,
    },
    grab: {
      width: 42,
      height: 5,
      borderRadius: 3,
      backgroundColor: c.divider,
      alignSelf: "center",
      marginBottom: 12,
    },
    sheetTitle: {
      color: c.textPrimary,
      fontSize: 17,
      fontFamily: theme.text.fontFamily.semiBold,
      marginBottom: 12,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 14,
    },
    rowText: { color: c.textPrimary, fontSize: 16 },
    rowDanger: { color: "#E5484D" },
    amountInput: {
      backgroundColor: c.inputSurface,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: c.textPrimary,
      fontSize: 17,
      marginBottom: 12,
    },
    primaryBtn: {
      backgroundColor: theme.colors.primary,
      borderRadius: 999,
      paddingVertical: 15,
      alignItems: "center",
    },
    primaryBtnText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontFamily: theme.text.fontFamily.semiBold,
    },
  });
}
