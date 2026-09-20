import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Feather";

import { useTheme } from "../../../theme/ThemeContext";
import AuthContext from "../../../contexts/AuthContext";
import { supplierInvoiceService, taskService } from "../../../services";
import { paymentsDue } from "../../../utils/paymentDue";
import { formatMoney } from "../../../utils/billingTotals";
import { getDateLocale } from "../../../utils/dateLocale";
// Reuse the shift-history preview styles for an identical look.
import { createStyles } from "../ShiftHistoryPreview/ShiftHistoryPreview.styles";

const DONE_STATUSES = new Set(["done", "completed", "closed"]);
const ROW_LIMIT = 3;

const OVERDUE_COLOR = "#FF3B30";
const SOON_COLOR = "#FF9500";

const formatDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat(getDateLocale(), {
    day: "numeric",
    month: "short",
  }).format(date);
};

// "Mitt arbete" — the app's version of the admin panel's Mitt-arbete surface,
// squeezed into one home card: the bills that have to be PAID (supplier
// invoices, most urgent first) and this user's overdue tasks. Everything else
// that page shows (approvals, day plan, quadrants) stays on the web.
export function MyWorkPreview({ colorMode = "dark", onClose, refreshKey = 0 }) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { hasPermission } = useContext(AuthContext);
  const styles = createStyles(theme, colorMode);
  const secondaryIconColor =
    colorMode === "light" ? `${theme.colors.text}80` : "rgba(255,255,255,0.72)";
  const canFinance = hasPermission?.("finance.manage");

  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [payingIds, setPayingIds] = useState([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const now = Date.now();

      const [invoices, tasks] = await Promise.all([
        canFinance
          ? supplierInvoiceService.getAll().catch(() => [])
          : Promise.resolve([]),
        taskService.getAll().catch(() => []),
      ]);

      setBills(paymentsDue(invoices, now, ROW_LIMIT));
      setOverdueTasks(
        (Array.isArray(tasks) ? tasks : [])
          .filter(
            (task) =>
              task.dueDate &&
              !DONE_STATUSES.has(String(task.status || "").toLowerCase()) &&
              new Date(task.dueDate).getTime() < now,
          )
          .sort(
            (left, right) => new Date(left.dueDate) - new Date(right.dueDate),
          )
          .slice(0, ROW_LIMIT),
      );
    } catch (error) {
      console.error("Failed to load my-work preview:", error);
      setBills([]);
      setOverdueTasks([]);
    } finally {
      setLoading(false);
    }
  }, [canFinance]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  // Tick the circle to mark a bill paid — that also stops its reminders. The
  // row leaves the list at once and comes back if the server refuses.
  const markPaid = useCallback(
    async (invoice) => {
      const id = invoice._id || invoice.id;
      if (!id || payingIds.includes(id)) {
        return;
      }
      setPayingIds((prev) => [...prev, id]);
      setBills((prev) => prev.filter((item) => (item._id || item.id) !== id));
      try {
        await supplierInvoiceService.setStatus(id, "paid");
      } catch (error) {
        console.error("Failed to mark invoice paid:", error);
        await load();
      } finally {
        setPayingIds((prev) => prev.filter((item) => item !== id));
      }
    },
    [payingIds, load],
  );

  const isEmpty = !bills.length && !overdueTasks.length;

  const renderBill = (invoice, index) => {
    const tone = invoice.tone;
    const dueColor =
      tone === "overdue"
        ? OVERDUE_COLOR
        : tone === "soon"
          ? SOON_COLOR
          : styles.dateText.color;

    return (
      <View
        key={invoice._id || invoice.id || `bill-${index}`}
        style={[
          extraStyles.item,
          (index !== bills.length - 1 || overdueTasks.length > 0) &&
            styles.itemDivider,
        ]}
      >
        <Text style={[styles.dateText, { color: dueColor }]}>
          {tone === "overdue"
            ? t("myWork.overdueBy", {
                days: Math.abs(invoice.days),
                defaultValue: "Förfallen {{days}} d",
              })
            : t("myWork.dueOn", {
                date: formatDay(invoice.dueDate),
                defaultValue: "Förfaller {{date}}",
              })}
        </Text>

        <View style={extraStyles.row}>
          <Text
            style={[styles.projectText, extraStyles.rowText]}
            numberOfLines={1}
          >
            {invoice.supplierName || t("myWork.unknownSupplier")}
          </Text>
          <Text style={[styles.dateText, extraStyles.amount]}>
            {formatMoney(invoice.total)}
          </Text>
          <TouchableOpacity
            style={[extraStyles.checkbox, { borderColor: secondaryIconColor }]}
            onPress={() => markPaid(invoice)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityLabel={t("myWork.markPaid")}
          />
        </View>
      </View>
    );
  };

  const renderTask = (task, index) => (
    <View
      key={task._id || task.id || `task-${index}`}
      style={[
        extraStyles.item,
        index !== overdueTasks.length - 1 && styles.itemDivider,
      ]}
    >
      <Text style={[styles.dateText, { color: OVERDUE_COLOR }]}>
        {t("myWork.taskOverdue", {
          date: formatDay(task.dueDate),
          defaultValue: "Försenad {{date}}",
        })}
      </Text>
      <Text style={[styles.projectText, extraStyles.rowText]} numberOfLines={1}>
        {task.taskTitle || t("tasksPreview.untitled")}
      </Text>
    </View>
  );

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("myWork.title")}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() =>
              navigation.navigate(
                canFinance && bills.length ? "Economy" : "Tasks",
              )
            }
            activeOpacity={0.8}
          >
            <Text style={styles.linkText}>{t("common.viewAll")}</Text>
            <Icon
              name="arrow-right"
              size={18}
              color={secondaryIconColor}
              style={styles.linkIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        {onClose ? (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Icon name="x" size={18} color={secondaryIconColor} />
          </TouchableOpacity>
        ) : null}

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : isEmpty ? (
          <View style={styles.emptyState}>
            <Icon
              name="check-circle"
              size={26}
              color={styles.emptyText.color}
            />
            <Text style={styles.emptyText}>{t("myWork.allClear")}</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {bills.map(renderBill)}
            {overdueTasks.map(renderTask)}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const extraStyles = StyleSheet.create({
  item: {
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowText: {
    flex: 1,
  },
  amount: {
    fontVariant: ["tabular-nums"],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    marginRight: 4,
  },
});

export default MyWorkPreview;
