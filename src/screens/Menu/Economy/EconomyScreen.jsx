import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { offerService, invoiceService, clientService } from "../../../services";
import { FilterSelector } from "../../../components/common/FilterSelector/FilterSelector";
import { EntityListScreen } from "../../../components/common/EntityListScreen/EntityListScreen";
import { getDateLocale } from "../../../utils/dateLocale";
import { sortByNewest } from "../../../utils/sortByNewest";
import { createStyles } from "./EconomyScreen.styles";
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
  const navigation = useNavigation();
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
  const [customerFilter, setCustomerFilter] = useState(null);
  // Kundtyp filter — "all" | "company" | "private".
  const [clientTypeFilter, setClientTypeFilter] = useState("all");
  const [clients, setClients] = useState([]);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [registersModalVisible, setRegistersModalVisible] = useState(false);

  // Reference registers shared by BOTH offers and invoices (not a filter of the
  // current tab) — so they live behind the header's "•••" menu, out of the
  // document canvas, instead of sitting under the Offers/Invoices switch where
  // they read as offer sub-filters.
  const registers = [
    { icon: "users", label: t("clientForm.title"), route: "Clients" },
    { icon: "package", label: t("articleForm.title"), route: "Articles" },
    {
      icon: "briefcase",
      label: t("companyDetails.title"),
      route: "CompanyDetails",
    },
  ];

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

  // Unique customers (companyName) across the current mode, with counts.
  const customerOptions = useMemo(() => {
    const counts = new Map();
    items.forEach((item) => {
      const name = (item.companyName || "").trim();
      if (name) counts.set(name, (counts.get(name) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

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

  const byCustomer = useMemo(
    () =>
      customerFilter
        ? byClientType.filter(
            (item) => (item.companyName || "").trim() === customerFilter,
          )
        : byClientType,
    [byClientType, customerFilter],
  );

  const filtered = useMemo(
    () =>
      statusFilter
        ? byCustomer.filter((item) => String(item.status) === statusFilter)
        : byCustomer,
    [byCustomer, statusFilter],
  );

  const statusCounts = useMemo(() => {
    const counts = {};
    byCustomer.forEach((item) => {
      const status = String(item.status || "draft");
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [byCustomer]);

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
      <TouchableOpacity key={id} style={styles.card} activeOpacity={0.85}>
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
        headerRight={
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setRegistersModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={t("economy.registers", "Register")}
          >
            <Icon name="more-horizontal" size={22} color="#030303" />
          </TouchableOpacity>
        }
        beforeList={
          <>
            <View style={styles.clientTypeFilter}>
              <FilterSelector
                value={clientTypeFilter}
                onChange={setClientTypeFilter}
                placeholder={t("clients.filter.all")}
                options={["all", "company", "private"].map((value) => ({
                  value,
                  label: t(`clients.filter.${value}`),
                }))}
              />
            </View>
            {customerOptions.length > 0 || filterOptions.length > 0 ? (
              <View style={styles.pillsWrap}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.pillsRow}
                  contentContainerStyle={styles.pillsContent}
                >
                  <TouchableOpacity
                    style={[styles.pill, customerFilter && styles.pillOn]}
                    onPress={() => setCustomerModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        customerFilter && styles.pillTextOn,
                      ]}
                      numberOfLines={1}
                    >
                      {customerFilter || t("economy.allCustomers")}
                    </Text>
                    <Icon
                      name="chevron-down"
                      size={14}
                      color={customerFilter ? "#FFFFFF" : "#5F7588"}
                    />
                  </TouchableOpacity>

                  {filterOptions.map((status) => {
                    const active = statusFilter === status;
                    return (
                      <TouchableOpacity
                        key={status}
                        style={[styles.pill, active && styles.pillOn]}
                        onPress={() => setStatusFilter(active ? null : status)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[styles.pillText, active && styles.pillTextOn]}
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

      <Modal
        visible={registersModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRegistersModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRegistersModalVisible(false)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.grab} />
            <Text style={styles.modalTitle}>
              {t("economy.registers", "Register")}
            </Text>
            {registers.map((reg) => (
              <TouchableOpacity
                key={reg.route}
                style={styles.registerRow}
                activeOpacity={0.8}
                onPress={() => {
                  setRegistersModalVisible(false);
                  navigation.navigate(reg.route);
                }}
              >
                <View style={styles.registerRowLeft}>
                  <Icon
                    name={reg.icon}
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.registerRowText} numberOfLines={1}>
                    {reg.label}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9AA6B2" />
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={customerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomerModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCustomerModalVisible(false)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.grab} />
            <Text style={styles.modalTitle}>
              {t("economy.filterByCustomer")}
            </Text>
            <ScrollView>
              <TouchableOpacity
                style={styles.customerRow}
                onPress={() => {
                  setCustomerFilter(null);
                  setCustomerModalVisible(false);
                }}
              >
                <Text style={styles.customerRowText}>
                  {t("economy.allCustomers")}
                </Text>
                {!customerFilter && (
                  <Icon name="check" size={18} color="#0785F4" />
                )}
              </TouchableOpacity>
              {customerOptions.map((option) => (
                <TouchableOpacity
                  key={option.name}
                  style={styles.customerRow}
                  onPress={() => {
                    setCustomerFilter(option.name);
                    setStatusFilter(null);
                    setCustomerModalVisible(false);
                  }}
                >
                  <Text style={styles.customerRowText} numberOfLines={1}>
                    {option.name} · {option.count}
                  </Text>
                  {customerFilter === option.name && (
                    <Icon name="check" size={18} color="#0785F4" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
