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
  companyName: "",
  email: "",
  orgNumber: "",
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

  const saveNewClient = async () => {
    if (!form.companyName.trim()) {
      Alert.alert(
        t("billing.clientNameRequiredTitle"),
        t("billing.clientNameRequired"),
      );
      return;
    }
    try {
      setSaving(true);
      const created = await clientService.create({
        companyName: form.companyName.trim(),
        email: form.email.trim(),
        orgNumber: form.orgNumber.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        postalCode: form.postalCode.trim(),
        city: form.city.trim(),
      });
      onSelect(created);
    } catch (error) {
      console.error("Failed to create client:", error);
      Alert.alert(t("billing.saveFailedTitle"), t("billing.clientSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const newClientField = (key, label, keyboardType) => (
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
              {newClientField("companyName", `${t("billing.clientName")} *`)}
              {newClientField("email", t("billing.email"), "email-address")}
              {newClientField("orgNumber", t("billing.orgNumber"))}
              {newClientField("phone", t("billing.phone"), "phone-pad")}
              {newClientField("address", t("billing.address"))}
              <View style={styles.two}>
                <View style={styles.half}>
                  {newClientField("postalCode", t("billing.postalCode"))}
                </View>
                <View style={styles.half}>
                  {newClientField("city", t("billing.city"))}
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
