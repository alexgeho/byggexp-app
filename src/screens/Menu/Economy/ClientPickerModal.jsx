import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import { clientService } from "../../../services";
import { styles, PRIMARY, MUTED } from "./billingForm.styles";

const NEW_CLIENT = {
  clientType: "company",
  companyName: "",
  orgNumber: "",
  vatNumber: "",
  contactPerson: "",
  firstName: "",
  lastName: "",
  personalNumber: "",
  email: "",
  phone: "",
  address: "",
  postalCode: "",
  city: "",
};

export default function ClientPickerModal({ visible, onClose, onSelect }) {
  const { t } = useTranslation();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(NEW_CLIENT);

  const isCompany = form.clientType === "company";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clientService.getAll();
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load clients:", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setSearch("");
      setCreating(false);
      setForm(NEW_CLIENT);
      load();
    }
  }, [visible, load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((client) =>
      [client.companyName, client.customerNumber, client.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [clients, search]);

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const buildPayload = () => {
    const base = {
      clientType: form.clientType,
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      postalCode: form.postalCode.trim(),
      city: form.city.trim(),
    };
    if (isCompany) {
      return {
        ...base,
        companyName: form.companyName.trim(),
        orgNumber: form.orgNumber.trim(),
        vatNumber: form.vatNumber.trim(),
        contactPerson: form.contactPerson.trim(),
      };
    }
    const fullName = `${form.firstName} ${form.lastName}`.trim();
    return {
      ...base,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      personalNumber: form.personalNumber.trim(),
      companyName: fullName, // downstream offer/invoice display the customer name
    };
  };

  const saveNewClient = async () => {
    if (isCompany && !form.companyName.trim()) {
      Alert.alert(
        t("billing.clientNameRequiredTitle"),
        t("billing.clientNameRequired"),
      );
      return;
    }
    if (!isCompany && (!form.firstName.trim() || !form.lastName.trim())) {
      Alert.alert(
        t("billing.clientNameRequiredTitle"),
        t("billing.privateNameRequired"),
      );
      return;
    }
    try {
      setSaving(true);
      const created = await clientService.create(buildPayload());
      onSelect(created);
    } catch (error) {
      console.error("Failed to create client:", error);
      Alert.alert(t("billing.saveFailedTitle"), t("billing.clientSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const field = (key, label, keyboardType) => (
    <View style={[styles.field, { marginBottom: 10 }]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={form[key]}
        onChangeText={(text) => setField(key, text)}
        keyboardType={keyboardType}
        autoCapitalize={key === "email" ? "none" : "sentences"}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.grab} />
          <Text style={styles.modalTitle}>
            {creating ? t("billing.newClient") : t("billing.selectClient")}
          </Text>

          {creating ? (
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={[styles.label, { marginBottom: 6 }]}>
                {t("billing.clientType")}
              </Text>
              <View style={styles.typeToggle}>
                <TouchableOpacity
                  style={[styles.typeBtn, isCompany && styles.typeBtnOn]}
                  onPress={() => setField("clientType", "company")}
                >
                  <Text
                    style={[styles.typeText, isCompany && styles.typeTextOn]}
                  >
                    {t("billing.typeCompany")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, !isCompany && styles.typeBtnOn]}
                  onPress={() => setField("clientType", "private")}
                >
                  <Text
                    style={[styles.typeText, !isCompany && styles.typeTextOn]}
                  >
                    {t("billing.typePrivate")}
                  </Text>
                </TouchableOpacity>
              </View>

              {isCompany ? (
                <>
                  {field("companyName", `${t("billing.companyNameField")} *`)}
                  {field("orgNumber", t("billing.orgNumber"))}
                  {field("vatNumber", t("billing.vatNumber"))}
                  {field("contactPerson", t("billing.contactPerson"))}
                </>
              ) : (
                <View style={styles.two}>
                  <View style={styles.half}>
                    {field("firstName", `${t("billing.firstName")} *`)}
                  </View>
                  <View style={styles.half}>
                    {field("lastName", `${t("billing.lastName")} *`)}
                  </View>
                </View>
              )}
              {!isCompany &&
                field("personalNumber", t("billing.personalNumber"))}

              {field("email", t("billing.email"), "email-address")}
              {field("phone", t("billing.phone"), "phone-pad")}
              {field("address", t("billing.address"))}
              <View style={styles.two}>
                <View style={styles.half}>
                  {field("postalCode", t("billing.postalCode"))}
                </View>
                <View style={styles.half}>
                  {field("city", t("billing.city"))}
                </View>
              </View>

              <View
                style={[
                  styles.actions,
                  {
                    position: "relative",
                    backgroundColor: "transparent",
                    borderTopWidth: 0,
                    paddingHorizontal: 0,
                    paddingBottom: 8,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.btn, styles.btnGhost]}
                  onPress={() => setCreating(false)}
                >
                  <Text style={[styles.btnText, styles.btnTextGhost]}>
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.btnPrimary,
                    saving && styles.btnDisabled,
                  ]}
                  onPress={saveNewClient}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={[styles.btnText, styles.btnTextPrimary]}>
                      {t("billing.saveClient")}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <>
              <View style={styles.searchBar}>
                <Icon name="search" size={18} color={MUTED} />
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder={t("billing.searchClient")}
                  placeholderTextColor="#9fb0c4"
                />
              </View>

              <TouchableOpacity
                style={styles.newClientBtn}
                onPress={() => setCreating(true)}
              >
                <Icon name="plus-circle" size={20} color={PRIMARY} />
                <Text style={styles.newClientText}>
                  {t("billing.newClient")}
                </Text>
              </TouchableOpacity>

              {loading ? (
                <ActivityIndicator
                  color={PRIMARY}
                  style={{ paddingVertical: 30 }}
                />
              ) : (
                <ScrollView keyboardShouldPersistTaps="handled">
                  {filtered.length === 0 ? (
                    <Text
                      style={{
                        color: MUTED,
                        textAlign: "center",
                        paddingVertical: 24,
                      }}
                    >
                      {t("billing.noClients")}
                    </Text>
                  ) : (
                    filtered.map((client) => (
                      <TouchableOpacity
                        key={client._id || client.id}
                        style={styles.clientRow}
                        onPress={() => onSelect(client)}
                      >
                        <Text style={styles.clientName}>
                          {client.companyName || t("economy.noCustomer")}
                        </Text>
                        {(client.customerNumber || client.email) && (
                          <Text style={styles.clientMeta}>
                            {[client.customerNumber, client.email]
                              .filter(Boolean)
                              .join(" · ")}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              )}

              <TouchableOpacity
                style={[styles.newClientBtn, { justifyContent: "center" }]}
                onPress={onClose}
              >
                <Text style={{ color: MUTED, fontWeight: "700" }}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
