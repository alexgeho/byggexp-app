import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { offerService, invoiceService } from "../../../services";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import { getDateLocale } from "../../../utils/dateLocale";
import { sortByNewest } from "../../../utils/sortByNewest";
import { styles } from "./EconomyScreen.styles";

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

function Pill({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.pill, active && styles.pillOn]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.pillText, active && styles.pillTextOn]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function EconomyScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState("offers"); // 'offers' | 'invoices'
  const [offers, setOffers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [customerFilter, setCustomerFilter] = useState(null);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [offerData, invoiceData] = await Promise.all([
        offerService.getAll().catch(() => []),
        invoiceService.getAll().catch(() => []),
      ]);
      setOffers(Array.isArray(offerData) ? offerData : []);
      setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
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

  const byCustomer = useMemo(
    () =>
      customerFilter
        ? items.filter(
            (item) => (item.companyName || "").trim() === customerFilter,
          )
        : items,
    [items, customerFilter],
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

  const switchMode = (next) => {
    setMode(next);
    setStatusFilter(null);
    setCustomerFilter(null);
  };

  const openCreate = () => {
    navigation.navigate(isOffers ? "CreateOffer" : "CreateInvoice");
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
    <View style={styles.container}>
      <View style={[styles.header, { marginTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={22} color="#030303" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("economy.title")}</Text>
        {/* Transparent spacer keeps the title centered (settings button removed). */}
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.segmented}>
        <TouchableOpacity
          style={[styles.segBtn, isOffers && styles.segBtnOn]}
          onPress={() => switchMode("offers")}
        >
          <Text style={[styles.segText, isOffers && styles.segTextOn]}>
            {t("economy.offers")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segBtn, !isOffers && styles.segBtnOn]}
          onPress={() => switchMode("invoices")}
        >
          <Text style={[styles.segText, !isOffers && styles.segTextOn]}>
            {t("economy.invoices")}
          </Text>
        </TouchableOpacity>
      </View>

      {(customerOptions.length > 0 || filterOptions.length > 0) && (
        <View style={styles.pillsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillsRow}
            contentContainerStyle={styles.pillsContent}
          >
            {/* Customer filter sits first, in the same horizontally-scrollable
              row as the status pills. */}
            {customerOptions.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.pill,
                  styles.customerPill,
                  customerFilter && styles.pillOn,
                ]}
                onPress={() => setCustomerModalVisible(true)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.pillText,
                    styles.customerPillText,
                    customerFilter && styles.pillTextOn,
                  ]}
                  numberOfLines={1}
                >
                  {customerFilter || t("economy.allCustomers")}
                </Text>
                {customerFilter ? (
                  <TouchableOpacity
                    onPress={() => setCustomerFilter(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon name="x" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : (
                  <Icon name="chevron-down" size={16} color="#667E93" />
                )}
              </TouchableOpacity>
            )}

            {filterOptions.length > 0 && (
              <Pill
                label={`${t("economy.filters.all")} (${byCustomer.length})`}
                active={!statusFilter}
                onPress={() => setStatusFilter(null)}
              />
            )}
            {filterOptions.map((status) => (
              <Pill
                key={status}
                label={`${t(`economy.${statusNs}.${status}`, status)} (${statusCounts[status]})`}
                active={statusFilter === status}
                onPress={() => setStatusFilter(status)}
              />
            ))}
          </ScrollView>
          {/* Soft fade on the right edge so scrolled-off pills taper out
              instead of being hard-cut by the screen edge. */}
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(242,241,246,0)", "#F2F1F6"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.pillsFade}
          />
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#0785F4" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Icon name="file-text" size={30} color="#9AA6B2" />
            <Text style={styles.emptyText}>
              {isOffers ? t("economy.emptyOffers") : t("economy.emptyInvoices")}
            </Text>
          </View>
        ) : (
          filtered.map(renderCard)
        )}
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        onAddPress={openCreate}
      />

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
    </View>
  );
}
