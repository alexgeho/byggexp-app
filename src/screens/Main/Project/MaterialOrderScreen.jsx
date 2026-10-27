import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute } from "@react-navigation/native";

import AuthContext from "../../../contexts/AuthContext";
import { useFeedback } from "../../../contexts/FeedbackContext";
import { useTheme } from "../../../theme/ThemeContext";
import { materialOrderService } from "../../../services/material-order.service";
import { notificationsService } from "../../../services/notifications.service";
import { projectService } from "../../../services/project.service";
import { normalizeNotificationPreferences } from "../../../utils/notificationPreferences";
import ArticlePickerModal from "../../Menu/Economy/ArticlePickerModal";
import {
  FieldCard,
  FieldRow,
} from "../../../components/common/FieldRow/FieldRow";
import {
  Button,
  ChoiceChips,
  FormFooter,
  FormHeader,
  FormScreen,
  SectionTitle,
} from "../../../components/common/ui";
import { layout } from "../../../theme/spacing";
import { getApiErrorMessage } from "../../../utils/apiError";
import { getDateLocale } from "../../../utils/dateLocale";
import { formatMoney } from "../../../utils/billingTotals";
import {
  addArticle,
  buildOrderPayload,
  canEditOrder,
  isOrderable,
  orderTotal,
  parseDateOnly,
  setQuantity,
} from "../../../utils/materialOrder";

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
};

// Opened from a push the route carries only the order id (and maybe no project
// address): fetch what's missing, then show the form.
export default function MaterialOrderScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const params = useRoute().params || {};
  const { theme } = useTheme();
  const [order, setOrder] = useState(params.order || null);
  const [projectAddress, setProjectAddress] = useState(
    params.projectAddress ?? null,
  );
  const needsOrder = Boolean(params.orderId && !params.order);
  const projectId = params.projectId || order?.projectId;

  useEffect(() => {
    if (!needsOrder) return;
    materialOrderService
      .get(params.orderId)
      .then(setOrder)
      .catch(() => setOrder({ _missing: true }));
  }, [needsOrder, params.orderId]);

  useEffect(() => {
    if (projectAddress !== null || !projectId) return;
    projectService
      .getById(projectId)
      .then((project) => setProjectAddress(project?.location || ""))
      .catch(() => setProjectAddress(""));
  }, [projectAddress, projectId]);

  if ((needsOrder && !order) || projectAddress === null) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.content.background,
        }}
      >
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  // The order from the push was deleted meanwhile (or isn't ours to see).
  if (order?._missing) {
    return (
      <FormScreen
        style={{ flex: 1, backgroundColor: theme.content.background }}
        edges={["top"]}
      >
        <FormHeader title="" onBack={() => navigation.goBack()} />
        <Text
          style={{
            marginTop: 40,
            textAlign: "center",
            fontSize: 16,
            color: theme.content.textSecondary,
          }}
        >
          {t("materialOrders.notFound")}
        </Text>
      </FormScreen>
    );
  }

  return (
    <MaterialOrderForm
      order={order}
      projectId={projectId}
      projectAddress={projectAddress}
      fromPush={Boolean(params.fromPush)}
    />
  );
}

// Material order from the site: pick grossist articles, quantities, a wanted
// delivery date, where to deliver and a note, save as a draft. An admin sends
// it. Opened with an `order`, a draft can be changed or deleted (a worker only
// their own); a sent order is read-only.
function MaterialOrderForm({ order, projectId, projectAddress, fromPush }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { showSuccess, showError } = useFeedback();
  const { user, updateStoredUser } = useContext(AuthContext);
  const orderId = order?._id || order?.id;
  // Purchase prices are for the office: the API sends them to admins only.
  const isAdmin = user?.role !== "worker";
  const seePrices = isAdmin;
  const editable = canEditOrder(order, user?._id || user?.id, isAdmin);
  const money = (value) => formatMoney(value, getDateLocale());

  const [rows, setRows] = useState(() =>
    (order?.rows || []).map((row) => ({ ...row })),
  );
  const [supplier, setSupplier] = useState(order?.supplier || "");
  const [desiredDate, setDesiredDate] = useState(
    () => parseDateOnly(order?.desiredDate) || tomorrow(),
  );
  const [comment, setComment] = useState(order?.comment || "");
  // Deliver to the project's address, or anywhere else (warehouse, home…).
  const savedAddress = (order?.deliveryAddress || "").trim();
  const [deliverOther, setDeliverOther] = useState(
    Boolean(savedAddress) && savedAddress !== (projectAddress || "").trim(),
  );
  const [otherAddress, setOtherAddress] = useState(
    savedAddress !== (projectAddress || "").trim() ? savedAddress : "",
  );
  const [notifyOn, setNotifyOn] = useState(
    normalizeNotificationPreferences(user?.notificationPreferences)
      .materialOrders,
  );
  // Which grossist this order goes to — picked first, before any article.
  const [suppliers, setSuppliers] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [androidDateOpen, setAndroidDateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editable) return;
    materialOrderService
      .listSuppliers()
      .then((list) => {
        const names = list.map((s) => s.supplier).filter(Boolean);
        setSuppliers(names);
        setSupplier((current) => current || names[0] || "");
      })
      .catch(() => setSuppliers([]));
  }, [editable]);

  // One order goes to one grossist: only the chosen supplier's articles are
  // offered, and the choice locks once a row is in.
  const articleFilter = useCallback(
    (article) =>
      isOrderable(article) && (!supplier || article.supplier === supplier),
    [supplier],
  );

  const handlePick = (article) => {
    setPickerOpen(false);
    if (article.supplier) setSupplier(article.supplier);
    setRows((prev) => addArticle(prev, article));
  };

  const changeQuantity = (index, quantity) =>
    setRows((prev) => {
      return setQuantity(prev, index, quantity);
    });

  const handleSave = async () => {
    if (saving) return;
    if (rows.length === 0) {
      showError({ message: t("materialOrders.noRows") });
      return;
    }
    if (deliverOther && !otherAddress.trim()) {
      showError({ message: t("materialOrders.address") });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...buildOrderPayload({
          projectId,
          supplier,
          rows,
          desiredDate,
          comment,
        }),
        deliveryAddress: deliverOther
          ? otherAddress.trim()
          : projectAddress || undefined,
      };
      if (orderId) {
        const { projectId: _project, ...changes } = payload;
        await materialOrderService.update(orderId, changes);
      } else {
        await materialOrderService.create(payload);
      }
      showSuccess({ title: t("materialOrders.saved") });
      navigation.goBack();
    } catch (error) {
      showError({ message: getApiErrorMessage(error, t("common.error")) });
    } finally {
      setSaving(false);
    }
  };

  // Opened from a push: switch these notifications off right here, like the
  // onboarding ×. Back on in Meny → Aviseringar.
  const muteNotifications = async () => {
    try {
      const saved = normalizeNotificationPreferences(
        await notificationsService.updateNotificationPreferences({
          ...normalizeNotificationPreferences(user?.notificationPreferences),
          materialOrders: false,
        }),
      );
      await updateStoredUser({ ...user, notificationPreferences: saved });
      setNotifyOn(false);
    } catch (error) {
      showError({ message: getApiErrorMessage(error, t("common.error")) });
    }
  };

  const handleDelete = () => {
    Alert.alert(t("materialOrders.deleteTitle"), undefined, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await materialOrderService.remove(orderId);
            navigation.goBack();
          } catch (error) {
            showError({
              message: getApiErrorMessage(error, t("common.error")),
            });
          }
        },
      },
    ]);
  };

  const title = orderId
    ? t("materialOrders.orderTitle", { number: order.orderNumber ?? "" })
    : t("materialOrders.newTitle");

  const dateLabel = desiredDate.toLocaleDateString(getDateLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <FormScreen style={styles.safe} edges={["top"]}>
      <FormHeader
        title={title}
        onBack={() => navigation.goBack()}
        // Until the first article is in, adding one is the only action.
        onSave={editable && rows.length > 0 ? handleSave : undefined}
        saving={saving}
        saveLabel={t("common.save")}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {editable && suppliers.length > 0 ? (
            <FieldCard>
              {rows.length === 0 && suppliers.length > 1 ? (
                <FieldRow label={t("materialOrders.supplier")} isLast>
                  <ChoiceChips
                    tone="soft"
                    scroll
                    values={suppliers}
                    value={supplier}
                    onChange={setSupplier}
                  />
                </FieldRow>
              ) : (
                <FieldRow
                  label={t("materialOrders.supplier")}
                  value={supplier}
                  isLast
                />
              )}
            </FieldCard>
          ) : null}

          <View>
            {!editable && supplier ? (
              <SectionTitle>
                {[
                  supplier,
                  order?.supplierInvoiceId &&
                    t("materialOrders.invoiced", {
                      number: order.supplierInvoiceNumber || "",
                    }),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </SectionTitle>
            ) : null}
            {rows.length > 0 ? (
              <FieldCard>
                {rows.map((row, index) => (
                  <View
                    key={row.articleId}
                    style={[
                      styles.row,
                      index < rows.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowName} numberOfLines={1}>
                        {row.name || row.articleNumber}
                      </Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        {[
                          row.articleNumber,
                          row.unit,
                          seePrices &&
                            row.unitPrice != null &&
                            money(row.unitPrice * row.quantity),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    </View>
                    {editable ? (
                      <TouchableOpacity
                        style={styles.stepButton}
                        onPress={() => changeQuantity(index, row.quantity - 1)}
                        accessibilityRole="button"
                        accessibilityLabel="−"
                      >
                        <Icon
                          name={row.quantity === 1 ? "trash-2" : "minus"}
                          size={18}
                          color={theme.colors.primary}
                        />
                      </TouchableOpacity>
                    ) : null}
                    <Text style={styles.quantity}>{row.quantity}</Text>
                    {editable ? (
                      <TouchableOpacity
                        style={styles.stepButton}
                        onPress={() => changeQuantity(index, row.quantity + 1)}
                        accessibilityRole="button"
                        accessibilityLabel="+"
                      >
                        <Icon
                          name="plus"
                          size={18}
                          color={theme.colors.primary}
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))}
                {seePrices && orderTotal(rows) != null ? (
                  <View style={[styles.totalRow, styles.rowDividerTop]}>
                    <Text style={styles.totalLabel}>
                      {t("materialOrders.total")}
                    </Text>
                    <Text style={styles.totalValue}>
                      {money(orderTotal(rows))}
                    </Text>
                  </View>
                ) : null}
              </FieldCard>
            ) : null}
            {editable ? (
              <Button
                variant={rows.length > 0 ? "outline" : "primary"}
                title={t("materialOrders.addArticle")}
                onPress={() => setPickerOpen(true)}
                style={rows.length > 0 ? styles.addAfterRows : null}
              />
            ) : null}
          </View>

          {editable ? (
            <FieldCard>
              <FieldRow label={t("materialOrders.delivery")}>
                <ChoiceChips
                  tone="soft"
                  values={["project", "other"]}
                  value={deliverOther ? "other" : "project"}
                  onChange={(v) => setDeliverOther(v === "other")}
                  format={(v) =>
                    v === "other"
                      ? t("materialOrders.deliveryOther")
                      : t("materialOrders.deliveryProject")
                  }
                />
              </FieldRow>
              {deliverOther ? (
                <FieldRow
                  variant="input"
                  floating
                  label={t("materialOrders.address")}
                  value={otherAddress}
                  onChangeText={setOtherAddress}
                />
              ) : (
                <FieldRow value={projectAddress || "—"} />
              )}
              {Platform.OS === "ios" ? (
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>
                    {t("materialOrders.desiredDate")}
                  </Text>
                  <DateTimePicker
                    value={desiredDate}
                    mode="date"
                    display="compact"
                    locale={getDateLocale()}
                    minimumDate={new Date()}
                    onChange={(_event, date) => date && setDesiredDate(date)}
                  />
                </View>
              ) : (
                <FieldRow
                  variant="select"
                  label={t("materialOrders.desiredDate")}
                  value={dateLabel}
                  onPress={() => setAndroidDateOpen(true)}
                  isLast
                />
              )}
            </FieldCard>
          ) : (
            <FieldCard>
              <FieldRow
                label={t("materialOrders.delivery")}
                value={savedAddress || projectAddress || "—"}
              />
              <FieldRow
                label={t("materialOrders.desiredDate")}
                value={dateLabel}
                isLast
              />
            </FieldCard>
          )}

          <FieldCard>
            {editable ? (
              <FieldRow
                variant="input"
                multiline
                label={t("materialOrders.comment")}
                value={comment}
                onChangeText={setComment}
                isLast
              />
            ) : (
              <FieldRow
                label={t("materialOrders.comment")}
                value={comment || "—"}
                isLast
              />
            )}
          </FieldCard>

          {editable && orderId ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Icon name="trash-2" size={18} color={theme.content.danger} />
              <Text style={styles.deleteText}>
                {t("materialOrders.delete")}
              </Text>
            </TouchableOpacity>
          ) : null}

          {fromPush && notifyOn ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={muteNotifications}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Icon name="bell-off" size={18} color={theme.content.textMuted} />
              <Text style={styles.muteText}>{t("materialOrders.mute")}</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {androidDateOpen ? (
        <DateTimePicker
          value={desiredDate}
          mode="date"
          minimumDate={new Date()}
          onChange={(_event, date) => {
            setAndroidDateOpen(false);
            if (date) setDesiredDate(date);
          }}
        />
      ) : null}

      {editable && rows.length > 0 ? (
        <FormFooter>
          <Button
            title={t("materialOrders.saveDraft")}
            onPress={handleSave}
            loading={saving}
          />
        </FormFooter>
      ) : null}

      <ArticlePickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePick}
        filter={articleFilter}
        fetchArticles={(q) =>
          materialOrderService.searchArticles({ supplier, q })
        }
        showPrice={seePrices}
        priceKey="purchasePriceExclMoms"
      />
    </FormScreen>
  );
}

function createStyles(theme) {
  const c = theme.content;
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    content: {
      paddingHorizontal: layout.formGutter,
      paddingTop: layout.headerToContent,
      paddingBottom: 40,
      gap: layout.betweenCards * 2,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 62,
      paddingHorizontal: 16,
      gap: 4,
    },
    rowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    rowInfo: { flex: 1, paddingVertical: 10, paddingRight: 8 },
    rowName: {
      fontSize: 14,
      color: c.textPrimary,
      fontFamily: theme.text.fontFamily.medium,
    },
    rowMeta: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    rowDividerTop: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    totalRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 52,
      paddingHorizontal: 16,
    },
    totalLabel: { fontSize: 14, color: c.textSecondary },
    totalValue: {
      fontSize: 16,
      color: c.textPrimary,
      fontFamily: theme.text.fontFamily.medium,
      fontVariant: ["tabular-nums"],
    },
    stepButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    quantity: {
      minWidth: 28,
      textAlign: "center",
      fontSize: 16,
      color: c.textPrimary,
      fontFamily: theme.text.fontFamily.medium,
      fontVariant: ["tabular-nums"],
    },
    addAfterRows: { marginTop: layout.betweenCards },
    // iOS: label left, compact date pill right — like a Settings row.
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 62,
      paddingLeft: 16,
      paddingRight: 8,
    },
    dateLabel: { fontSize: 14, color: c.textPrimary },
    deleteButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: 48,
    },
    deleteText: { fontSize: 16, color: c.danger },
    muteText: { fontSize: 16, color: c.textMuted },
  });
}
