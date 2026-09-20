import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { offerService, invoiceService, clientService } from "../../../services";
import { EntityListScreen } from "../../../components/common/EntityListScreen/EntityListScreen";
import { getDateLocale } from "../../../utils/dateLocale";
import { sortByNewest } from "../../../utils/sortByNewest";
import { createStyles } from "./EconomyScreen.styles";
import { downloadAndShareDocument } from "../../../utils/documentPreview";
import { API_BASE_URL } from "../../../config/env";
import { useTheme } from "../../../theme/ThemeContext";

const OFFER_STATUS_TONE = {
  draft: "draft",
  sent: "sent",
  accepted: "ok",
  rejected: "bad",
};
const INVOICE_STATUS_TONE = {
  draft: "draft",
  sent: "sent",
  paid: "ok",
  overdue: "bad",
  cancelled: "draft",
};
const OFFER_FILTER_ORDER = ["draft", "sent", "accepted", "rejected"];
const INVOICE_FILTER_ORDER = ["draft", "sent", "paid", "overdue", "cancelled"];

const formatAmount = (value) => {
  const number = Math.round(Number(value) || 0);
  const formatted = new Intl.NumberFormat(getDateLocale(), {
    maximumFractionDigits: 0,
  }).format(number);
  return `${formatted} kr`;
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }
  return date.toLocaleDateString(getDateLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function EconomyScreen() {
  const route = useRoute();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);

  // Offers and invoices are separate entities with their own routes; the route
  // fixes which one this screen is. There is no in-screen switch any more.
  const [mode, setMode] = useState(
    route.params?.mode === "invoices" ? "invoices" : "offers",
  ); // 'offers' | 'invoices'
  const [offers, setOffers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  // The document whose action sheet is open, and whether one is running.
  const [actionItem, setActionItem] = useState(null);
  const [busyAction, setBusyAction] = useState(false);
  // Kundtyp filter — "all" | "company" | "private".
  const [clientTypeFilter, setClientTypeFilter] = useState("all");
  const [clients, setClients] = useState([]);

  // Clients, articles and the company's own details are entities of their
  // own, each with a screen in the menu. This screen makes one thing: a
  // document — so it carries one action, "new invoice"/"new offer".

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [offerData, invoiceData, clientData] = await Promise.all([
        offerService.getAll().catch(() => []),
        invoiceService.getAll().catch(() => []),
        // Documents snapshot the customer's name/number but not its type, so
        // the client register is what tells private from company.
        clientService.getAll().catch(() => []),
      ]);
      setOffers(Array.isArray(offerData) ? offerData : []);
      setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
      setClients(Array.isArray(clientData) ? clientData : []);
    } catch (loadError) {
      console.error("Failed to load economy data:", loadError);
      setError(t("economy.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Follow the tab requested by the menu if the screen is re-navigated with a
  // different mode while still mounted.
  useEffect(() => {
    const requested = route.params?.mode;
    if (requested === "offers" || requested === "invoices") {
      setMode(requested);
    }
  }, [route.params?.mode]);

  const isOffers = mode === "offers";
  const rawItems = isOffers ? offers : invoices;
  const toneMap = isOffers ? OFFER_STATUS_TONE : INVOICE_STATUS_TONE;
  const statusNs = isOffers ? "offerStatus" : "invoiceStatus";

  const items = useMemo(
    () => sortByNewest(rawItems, (item) => [item?.createdAt, item?.updatedAt]),
    [rawItems],
  );

  // customerNumber is the reliable link (invoices carry it); the name is the
  // fallback for offers, which only snapshot companyName.
  const clientTypeIndex = useMemo(() => {
    const byNumber = new Map();
    const byName = new Map();
    clients.forEach((client) => {
      const type = client.clientType || "company";
      if (client.customerNumber) {
        byNumber.set(String(client.customerNumber).trim(), type);
      }
      const name =
        client.companyName ||
        [client.firstName, client.lastName].filter(Boolean).join(" ");
      if (name) byName.set(name.trim(), type);
    });
    return { byNumber, byName };
  }, [clients]);

  const clientTypeOf = useCallback(
    (item) => {
      // A ROT invoice is a private buyer by definition.
      if (item.rotEnabled) return "private";
      const number = String(item.customerNumber || "").trim();
      if (number && clientTypeIndex.byNumber.has(number)) {
        return clientTypeIndex.byNumber.get(number);
      }
      const name = (item.companyName || "").trim();
      // Unknown customers fall back to "company", the server's default.
      return clientTypeIndex.byName.get(name) || "company";
    },
    [clientTypeIndex],
  );

  const byClientType = useMemo(
    () =>
      clientTypeFilter === "all"
        ? items
        : items.filter((item) => clientTypeOf(item) === clientTypeFilter),
    [items, clientTypeFilter, clientTypeOf],
  );

  const filtered = useMemo(
    () =>
      statusFilter
        ? byClientType.filter((item) => String(item.status) === statusFilter)
        : byClientType,
    [byClientType, statusFilter],
  );

  const statusCounts = useMemo(() => {
    const counts = {};
    byClientType.forEach((item) => {
      const status = String(item.status || "draft");
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [byClientType]);

  const filterOptions = useMemo(() => {
    const order = isOffers ? OFFER_FILTER_ORDER : INVOICE_FILTER_ORDER;
    return order.filter((status) => statusCounts[status]);
  }, [isOffers, statusCounts]);

  // Swipe a document left to delete it, like every other list in the app. The
  // deliberate left-swipe is the safeguard, so no confirm; the row leaves only
  // once the backend confirms.
  const handleDeleteDocument = async (item) => {
    const id = item._id || item.id;
    const service = isOffers ? offerService : invoiceService;
    try {
      await service.remove(id);
      const drop = (list) =>
        list.filter((entry) => (entry._id || entry.id) !== id);
      if (isOffers) setOffers(drop);
      else setInvoices(drop);
    } catch (error) {
      const status = error?.response?.status;
      const raw = error?.response?.data?.message ?? error?.message;
      const detail = Array.isArray(raw) ? raw.join(", ") : raw;
      console.error("Failed to delete document:", status, detail, error);
      Alert.alert(
        t("common.error"),
        `${t("economy.deleteFailed")}\n[${status ?? "?"}] ${detail ?? ""}`,
      );
    }
  };

  const documentId = (item) => item?._id || item?.id;

  const runAction = async (work, failedTitle, failedMessage) => {
    setBusyAction(true);
    try {
      await work();
      setActionItem(null);
      await load();
    } catch (error) {
      console.error(failedTitle, error);
      Alert.alert(t(failedTitle), t(failedMessage));
    } finally {
      setBusyAction(false);
    }
  };

  // Mail it to the customer's address as it stands on the document.
  const sendByEmail = (item) => {
    const email = String(item?.email || "").trim();
    if (!email) {
      Alert.alert(t("billing.missingEmailTitle"), t("billing.missingEmail"));
      return;
    }
    runAction(
      async () => {
        const id = documentId(item);
        if (isOffers) await offerService.send(id, { email });
        else await invoiceService.send(id, { email });
      },
      "billing.saveFailedTitle",
      isOffers ? "billing.offerSendFailed" : "billing.invoiceSendFailed",
    );
  };

  // Hand the PDF to the phone's share sheet — mail, chat, Files, print.
  const shareDocument = (item) =>
    runAction(
      async () => {
        const id = documentId(item);
        const number = isOffers ? item.offerNumber : item.invoiceNumber;
        await downloadAndShareDocument({
          url: `${API_BASE_URL}/${isOffers ? "offers" : "invoices"}/${id}/pdf`,
          fileName: `${isOffers ? "offert" : "faktura"}-${number || id}.pdf`,
        });
      },
      "billing.shareFailedTitle",
      isOffers ? "billing.offerShareFailed" : "billing.invoiceSendFailed",
    );

  const markPaid = (item) =>
    runAction(
      () => invoiceService.setStatus(documentId(item), "paid"),
      "billing.saveFailedTitle",
      "billing.invoiceSaveFailed",
    );

  const renderCard = (item) => {
    const id = item._id || item.id;
    const number = isOffers ? item.offerNumber : item.invoiceNumber;
    const customer = item.companyName || t("economy.noCustomer");
    const status = String(item.status || "draft");
    const tone = toneMap[status] || "draft";
    const amount = isOffers ? item.total : item.roundedTotal || item.total;
    const dateLabel = isOffers
      ? item.validUntil
        ? `${t("economy.validUntil")} ${formatDate(item.validUntil)}`
        : ""
      : item.dueDate
        ? `${t("economy.due")} ${formatDate(item.dueDate)}`
        : "";

    return (
      <TouchableOpacity
        key={id}
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => setActionItem(item)}
      >
        <View style={styles.cardInfo}>
          <Text style={styles.cardNo}>
            {isOffers ? t("economy.offerNo") : t("economy.invoiceNo")} #{number}
          </Text>
          <Text style={styles.cardCustomer} numberOfLines={1}>
            {customer}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {dateLabel}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.badge, styles[`badge_${tone}`]]}>
            <Text style={[styles.badgeText, styles[`badgeText_${tone}`]]}>
              {t(`economy.${statusNs}.${status}`, status)}
            </Text>
          </View>
          <Text style={styles.cardAmount}>{formatAmount(amount)}</Text>
        </View>

        {/* Overflow menu: a vertical ⋮ in the card's top-right corner, where
            Material puts it, inside a full 48dp target. The badge and the
            amount keep clear of it. */}
        <TouchableOpacity
          style={styles.cardMore}
          onPress={() => setActionItem(item)}
          accessibilityRole="button"
          accessibilityLabel={t("common.more", "Mer")}
        >
          <Icon name="more-vertical" size={22} color="#9AA6B2" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <EntityListScreen
        title={isOffers ? t("economy.offers") : t("economy.invoices")}
        data={filtered}
        loading={loading}
        keyExtractor={(item, index) => item._id || item.id || `doc-${index}`}
        onDelete={handleDeleteDocument}
        emptyText={
          error ||
          (isOffers ? t("economy.emptyOffers") : t("economy.emptyInvoices"))
        }
        addScreen={isOffers ? "CreateOffer" : "CreateInvoice"}
        // Same chip row as Klienter, Projekt, Verktyg — one filter control
        // across every list instead of a dropdown here and chips there.
        filters={["all", "company", "private"].map((value) => ({
          value,
          label: t(`clients.filter.${value}`),
        }))}
        activeFilter={clientTypeFilter}
        onFilterChange={setClientTypeFilter}
        beforeList={
          <>
            {filterOptions.length > 0 ? (
              <View style={styles.pillsWrap}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.pillsRow}
                  contentContainerStyle={styles.pillsContent}
                >
                  {filterOptions.map((status) => {
                    const active = statusFilter === status;
                    // A pill reads in its status's own colour — the same
                    // palette the badge on the card uses, so "Förfallen" is
                    // red in the filter and red on the document.
                    const pillTone = toneMap[status] || "draft";
                    return (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.pill,
                          styles[`badge_${pillTone}`],
                          active && styles[`pillOn_${pillTone}`],
                        ]}
                        onPress={() => setStatusFilter(active ? null : status)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            styles[`badgeText_${pillTone}`],
                            active && styles.pillTextOn,
                          ]}
                        >
                          {t(`economy.${statusNs}.${status}`, status)} (
                          {statusCounts[status]})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}
          </>
        }
        renderCard={renderCard}
      />

      {/* Tap a document → what can be done with it: send it by mail, hand
          the PDF to the share sheet, or mark an invoice paid. */}
      <Modal
        visible={Boolean(actionItem)}
        transparent
        animationType="slide"
        onRequestClose={() => setActionItem(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setActionItem(null)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.grab} />
            <Text style={styles.modalTitle} numberOfLines={1}>
              {actionItem?.companyName || t("economy.noCustomer")}
            </Text>

            {busyAction ? (
              <ActivityIndicator
                color={theme.colors.primary}
                style={{ marginVertical: 18 }}
              />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => sendByEmail(actionItem)}
                  activeOpacity={0.8}
                >
                  <Icon name="mail" size={20} color={theme.colors.primary} />
                  <Text style={styles.actionRowText}>
                    {t("economy.sendByEmail", "Skicka via e-post")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => shareDocument(actionItem)}
                  activeOpacity={0.8}
                >
                  <Icon name="share-2" size={20} color={theme.colors.primary} />
                  <Text style={styles.actionRowText}>
                    {t("economy.shareDocument", "Ladda ner / dela")}
                  </Text>
                </TouchableOpacity>

                {!isOffers && actionItem?.status !== "paid" ? (
                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => markPaid(actionItem)}
                    activeOpacity={0.8}
                  >
                    <Icon name="check-circle" size={20} color="#04B251" />
                    <Text style={styles.actionRowText}>
                      {t("economy.markPaid", "Markera som betald")}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
