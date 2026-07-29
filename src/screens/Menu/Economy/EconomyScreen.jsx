import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../theme/ThemeContext";
import { offerService, invoiceService } from "../../../services";
import { BackButton } from "../../../components/common/BackButton/BackButton";
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
  const { theme } = useTheme();

  const [mode, setMode] = useState("offers"); // 'offers' | 'invoices'
  const [offers, setOffers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);

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

  const filtered = useMemo(
    () =>
      statusFilter
        ? items.filter((item) => String(item.status) === statusFilter)
        : items,
    [items, statusFilter],
  );

  const statusCounts = useMemo(() => {
    const counts = {};
    items.forEach((item) => {
      const status = String(item.status || "draft");
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [items]);

  const filterOptions = useMemo(() => {
    const order = isOffers ? OFFER_FILTER_ORDER : INVOICE_FILTER_ORDER;
    return order.filter((status) => statusCounts[status]);
  }, [isOffers, statusCounts]);

  const switchMode = (next) => {
    setMode(next);
    setStatusFilter(null);
  };

  const openCreate = () => {
    // Phase 2 wires the create screens; keep discoverable meanwhile.
    Alert.alert(
      isOffers ? t("economy.newOffer") : t("economy.newInvoice"),
      t("economy.createSoon"),
    );
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
        <View style={styles.cardTop}>
          <Text style={styles.cardNo}>
            {isOffers ? t("economy.offerNo") : t("economy.invoiceNo")} #{number}
          </Text>
          <View style={[styles.badge, styles[`badge_${tone}`]]}>
            <Text style={[styles.badgeText, styles[`badgeText_${tone}`]]}>
              {t(`economy.${statusNs}.${status}`, status)}
            </Text>
          </View>
        </View>
        <Text style={styles.cardCustomer} numberOfLines={1}>
          {customer}
        </Text>
        <View style={styles.cardBottom}>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {dateLabel}
          </Text>
          <Text style={styles.cardAmount}>{formatAmount(amount)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          iconSource={require("../../../assets/Arrow-left.png")}
        />
        <Text
          style={[styles.title, { fontFamily: theme.text.fontFamily.semiBold }]}
        >
          {t("economy.title")}
        </Text>
        <View style={styles.placeholder} />
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

      {filterOptions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillsRow}
          contentContainerStyle={styles.pillsContent}
        >
          <Pill
            label={`${t("economy.filters.all")} · ${items.length}`}
            active={!statusFilter}
            onPress={() => setStatusFilter(null)}
          />
          {filterOptions.map((status) => (
            <Pill
              key={status}
              label={`${t(`economy.${statusNs}.${status}`, status)} · ${statusCounts[status]}`}
              active={statusFilter === status}
              onPress={() => setStatusFilter(status)}
            />
          ))}
        </ScrollView>
      )}

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2683f9" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Icon name="file-text" size={30} color="#9fb0c4" />
            <Text style={styles.emptyText}>
              {isOffers ? t("economy.emptyOffers") : t("economy.emptyInvoices")}
            </Text>
          </View>
        ) : (
          filtered.map(renderCard)
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={openCreate}
        activeOpacity={0.85}
      >
        <Icon name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      <BottomBar
        showAddButton={false}
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
      />
    </View>
  );
}
