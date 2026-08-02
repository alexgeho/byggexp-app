import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import {
  emptyLineItem,
  lineNet,
  formatMoney,
} from "../../../utils/billingTotals";
import { getDateLocale } from "../../../utils/dateLocale";
import { styles, PRIMARY, PLACEHOLDER } from "./billingForm.styles";

// Editable list of offer/invoice line items. Fully controlled: the parent
// owns `items` and receives the next array on every change. Matches the Figma
// "Invoice rows" section — section label, one white card per row, then a
// pill "Add row" button, all 8px apart.
export default function LineItemsEditor({ items, onChange, label }) {
  const { t } = useTranslation();

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
        <View key={index} style={styles.row}>
          <View style={styles.rowBlock}>
            <View style={styles.rowLabelLine}>
              <Text style={styles.cellLabel}>{t("billing.itemTitle")}</Text>
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
              placeholder={t("billing.itemDescriptionPlaceholder")}
              placeholderTextColor={PLACEHOLDER}
              multiline
            />
          </View>

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
                onChangeText={(text) => update(index, { unit: text })}
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

          <View style={styles.rowAmount}>
            <Text style={styles.rowAmountLabel}>
              {t("billing.amountExVat")}
            </Text>
            <Text style={styles.rowAmountValue}>
              {formatMoney(lineNet(item), getDateLocale())}
            </Text>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addRow} onPress={add} activeOpacity={0.8}>
        <Text style={styles.addRowText}>{t("billing.addRow")}</Text>
        <Icon name="plus" size={20} color={PRIMARY} />
      </TouchableOpacity>
    </View>
  );
}
