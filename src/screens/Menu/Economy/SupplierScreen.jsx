import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useFeedback } from "../../../contexts/FeedbackContext";
import { useTheme } from "../../../theme/ThemeContext";
import { materialOrderService } from "../../../services/material-order.service";
import {
  FieldCard,
  FieldRow,
} from "../../../components/common/FieldRow/FieldRow";
import {
  Button,
  FormFooter,
  FormHeader,
  FormScreen,
} from "../../../components/common/ui";
import { layout } from "../../../theme/spacing";
import { getApiErrorMessage } from "../../../utils/apiError";

// Add a grossist, or change where its orders go. The name is the key, so it is
// fixed once saved. «Ta bort» hides it from new orders (articles/orders stay).
export default function SupplierScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const existing = useRoute().params?.supplier || null;
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { showSuccess, showError } = useFeedback();

  const [name, setName] = useState(existing?.supplier || "");
  const [orderEmail, setOrderEmail] = useState(existing?.orderEmail || "");
  const [customerNumber, setCustomerNumber] = useState(
    existing?.customerNumber || "",
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    if (!name.trim()) {
      showError({ message: t("suppliers.nameRequired") });
      return;
    }
    setSaving(true);
    try {
      await materialOrderService.saveSupplier(name.trim(), {
        orderEmail: orderEmail.trim(),
        customerNumber: customerNumber.trim(),
      });
      showSuccess({ title: t("suppliers.saved") });
      navigation.goBack();
    } catch (error) {
      showError({ message: getApiErrorMessage(error, t("common.error")) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t("suppliers.removeTitle", { name: existing.supplier }),
      undefined,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("suppliers.remove"),
          style: "destructive",
          onPress: async () => {
            try {
              await materialOrderService.removeSupplier(existing.supplier);
              navigation.goBack();
            } catch (error) {
              showError({
                message: getApiErrorMessage(error, t("common.error")),
              });
            }
          },
        },
      ],
    );
  };

  return (
    <FormScreen style={styles.safe} edges={["top"]}>
      <FormHeader
        title={existing ? existing.supplier : t("suppliers.add")}
        onBack={() => navigation.goBack()}
        onSave={handleSave}
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
          <FieldCard>
            {existing ? (
              <FieldRow floating label={t("suppliers.name")} value={name} />
            ) : (
              <FieldRow
                variant="input"
                floating
                label={t("suppliers.name")}
                value={name}
                onChangeText={setName}
              />
            )}
            <FieldRow
              variant="input"
              floating
              label={t("suppliers.orderEmail")}
              value={orderEmail}
              onChangeText={setOrderEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <FieldRow
              variant="input"
              floating
              label={t("suppliers.customerNumber")}
              value={customerNumber}
              onChangeText={setCustomerNumber}
              isLast
            />
          </FieldCard>

          {existing ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Icon name="trash-2" size={18} color={theme.content.danger} />
              <Text style={styles.deleteText}>{t("suppliers.remove")}</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <FormFooter>
        <Button
          title={existing ? t("common.save") : t("suppliers.add")}
          onPress={handleSave}
          loading={saving}
        />
      </FormFooter>
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
    deleteButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: 48,
    },
    deleteText: { fontSize: 16, color: c.danger },
  });
}
