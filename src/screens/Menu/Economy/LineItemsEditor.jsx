import React, { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import {
  emptyLineItem,
  emptyTextRow,
  lineNet,
  formatMoney,
} from "../../../utils/billingTotals";
import ArticlePickerModal from "./ArticlePickerModal";
import { getDateLocale } from "../../../utils/dateLocale";
import { createStyles, PRIMARY, PLACEHOLDER } from "./billingForm.styles";
import { useTheme } from "../../../theme/ThemeContext";

// Editable list of offer/invoice line items. Fully controlled: the parent
// owns `items` and receives the next array on every change. Matches the Figma
// "Invoice rows" section — section label, one white card per row, then a
// pill "Add row" button, all 8px apart.
const VAT_RATES = [25, 12, 6, 0];

export default function LineItemsEditor({
  items,
  onChange,
  label,
  rowLabel,
  // Called when a row's unit is typed, so the parent can drop the client's
  // agreed hourly rate onto a labour row (the web form does the same).
  onUnitChange,
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  // The field holds what was done ("Rivning kök, 25 m²"), so it is a
  // description on both the offer and the invoice — "Titel" read as a name.
  const rowFieldLabel = rowLabel || t("billing.itemDescription");

  const update = (index, patch) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    onChange(next);
  };

  const remove = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...items, emptyLineItem()]);
  };

  const addTextRow = () => {
    onChange([...items, emptyTextRow()]);
  };

  // Article picker state: which row is being filled, if any.
  const [articleRow, setArticleRow] = useState(null);

  // Same rule as the web: the article supplies what the row is missing, and
  // never overwrites a description or price already typed in.
  const applyArticle = (article) => {
    const index = articleRow;
    setArticleRow(null);
    if (index == null || !article) return;
    const current = items[index] || {};
    const hasDescription = String(current.description || "").trim() !== "";
    const hasPrice = Number(current.price) !== 0 && current.price !== "";
    update(index, {
      articleNumber: article.articleNumber || "",
      description: hasDescription ? current.description : article.name || "",
      price: hasPrice ? current.price : (article.priceExclMoms ?? 0),
      vatRate: article.momsPercent ?? current.vatRate ?? 25,
      unit: current.unit || article.unit || "st",
      quantity: current.quantity ?? 1,
      discount: current.discount ?? 0,
    });
  };

  const parseNumber = (value) => {
    const normalized = String(value)
      .replace(",", ".")
      .replace(/[^0-9.]/g, "");
    return normalized === "" ? 0 : Number(normalized);
  };

  return (
    <View style={{ gap: 8 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {items.map((item, index) => (
        <View key={item._key ?? index} style={styles.row}>
          <View style={styles.rowBlock}>
            <View style={styles.rowLabelLine}>
              <Text style={styles.cellLabel}>
                {item.isText ? t("billing.textRow") : rowFieldLabel}
              </Text>
              <TouchableOpacity
                style={styles.rowDelete}
                onPress={() => remove(index)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="trash-2" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.rowDescField}
              value={item.description}
              onChangeText={(text) => update(index, { description: text })}
              placeholder={
                item.isText
                  ? t("billing.textRowPlaceholder")
                  : t("billing.itemDescriptionPlaceholder")
              }
              placeholderTextColor={PLACEHOLDER}
              multiline
            />
          </View>

          {/* A text row is a heading between the priced rows — no article, no
              amounts, and it never reaches the totals. */}
          {item.isText ? null : (
            <TouchableOpacity
              style={styles.articleBtn}
              onPress={() => setArticleRow(index)}
              activeOpacity={0.7}
            >
              <Icon name="package" size={16} color={PRIMARY} />
              <Text style={styles.articleBtnText} numberOfLines={1}>
                {item.articleNumber
                  ? `${t("billing.article")} ${item.articleNumber}`
                  : t("billing.pickArticle")}
              </Text>
              <Icon name="chevron-right" size={18} color={PRIMARY} />
            </TouchableOpacity>
          )}

          {item.isText ? null : (
            <>
              <View style={styles.rowGrid}>
                <View style={styles.cell}>
                  <Text style={styles.cellLabel}>{t("billing.quantity")}</Text>
                  <TextInput
                    style={styles.cellInput}
                    value={String(item.quantity ?? "")}
                    onChangeText={(text) =>
                      update(index, { quantity: parseNumber(text) })
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.cell}>
                  <Text style={styles.cellLabel}>{t("billing.unit")}</Text>
                  <TextInput
                    style={[styles.cellInput, styles.cellInputLeft]}
                    value={item.unit}
                    onChangeText={(text) => {
                      update(index, { unit: text });
                      onUnitChange?.(index, text);
                    }}
                  />
                </View>
                <View style={styles.cell}>
                  <Text style={styles.cellLabel}>{t("billing.unitPrice")}</Text>
                  <TextInput
                    style={styles.cellInput}
                    value={String(item.price ?? "")}
                    onChangeText={(text) =>
                      update(index, { price: parseNumber(text) })
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.rowGrid}>
                <View style={styles.cell}>
                  <Text style={styles.cellLabel}>{t("billing.discount")}</Text>
                  <TextInput
                    style={styles.cellInput}
                    value={String(item.discount ?? 0)}
                    onChangeText={(text) =>
                      update(index, { discount: parseNumber(text) })
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[styles.cell, { flex: 2 }]}>
                  <Text style={styles.cellLabel}>{t("billing.vatRate")}</Text>
                  <View style={styles.vatRow}>
                    {VAT_RATES.map((rate) => {
                      const active = Number(item.vatRate ?? 25) === rate;
                      return (
                        <TouchableOpacity
                          key={rate}
                          style={[styles.vatChip, active && styles.vatChipOn]}
                          onPress={() => update(index, { vatRate: rate })}
                        >
                          <Text
                            style={[
                              styles.vatChipText,
                              active && styles.vatChipTextOn,
                            ]}
                          >
                            {rate}%
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={styles.rowAmount}>
                <Text style={styles.rowAmountLabel}>
                  {t("billing.amountExVat")}
                </Text>
                <Text style={styles.rowAmountValue}>
                  {formatMoney(lineNet(item), getDateLocale())}
                </Text>
              </View>
            </>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.addRow} onPress={add} activeOpacity={0.8}>
        <Text style={styles.addRowText}>{t("billing.addRow")}</Text>
        <Icon name="plus" size={20} color={PRIMARY} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.addRow}
        onPress={addTextRow}
        activeOpacity={0.8}
      >
        <Text style={styles.addRowText}>{t("billing.addTextRow")}</Text>
        <Icon name="type" size={18} color={PRIMARY} />
      </TouchableOpacity>

      <ArticlePickerModal
        visible={articleRow !== null}
        onClose={() => setArticleRow(null)}
        onSelect={applyArticle}
      />
    </View>
  );
}
