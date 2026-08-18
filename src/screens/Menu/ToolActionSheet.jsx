import React, { useContext, useMemo, useState } from "react";
import { getDateLocale } from "../../utils/dateLocale";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "./ToolActionSheet.styles";
import { useTranslation } from "react-i18next";
import AuthContext from "../../contexts/AuthContext";
import { toolService } from "../../services";

const idOf = (v) => (v && typeof v === "object" ? v._id || v.id : v);

// Bottom sheet shown after scanning (or tapping) a tool: who holds it now,
// plus Take-over / Return / History. Writes go through the same hand-off
// endpoint the admin uses.
export default function ToolActionSheet({ visible, tool, onClose, onUpdated }) {
  const { t } = useTranslation();
  const { userId, user } = useContext(AuthContext);
  const myId = userId || user?._id || user?.id || null;
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const holderId = tool ? idOf(tool.currentHolderId) : null;
  const heldByMe = holderId && String(holderId) === String(myId);

  const holderText = useMemo(() => {
    if (heldByMe) return t("toolScan.heldByMe");
    if (holderId) return t("toolScan.heldByOther");
    return t("toolScan.inStock");
  }, [heldByMe, holderId, t]);

  if (!tool) return null;

  const run = async (payload) => {
    setBusy(true);
    try {
      const updated = await toolService.handoff(idOf(tool), payload);
      onUpdated?.(updated);
    } catch {
      /* surfaced elsewhere */
    } finally {
      setBusy(false);
    }
  };

  const loadHistory = async () => {
    if (history) {
      setHistory(null);
      return;
    }
    setLoadingHistory(true);
    try {
      setHistory(await toolService.history(idOf(tool)));
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.name}>{tool.name}</Text>

          <View style={styles.metaRow}>
            <View
              style={[
                styles.badge,
                styles[`badge_${tool.status}`] || styles.badge_available,
              ]}
            >
              <Text style={styles.badgeText}>
                {t(`tools.status.${tool.status}`, tool.status)}
              </Text>
            </View>
            <Text style={styles.holder}>{holderText}</Text>
          </View>

          {tool.location ? (
            <Text style={styles.location}>📍 {tool.location}</Text>
          ) : null}
          {tool.qrId ? <Text style={styles.qr}>{tool.qrId}</Text> : null}

          <View style={styles.actions}>
            {!heldByMe ? (
              <TouchableOpacity
                style={styles.primaryBtn}
                disabled={busy}
                onPress={() => run({ toUserId: myId })}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>
                    {t("toolScan.takeOver")}
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.primaryBtn}
                disabled={busy}
                onPress={() => run({ toUserId: "" })}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>{t("toolScan.return")}</Text>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.secondaryBtn} onPress={loadHistory}>
              <Text style={styles.secondaryText}>
                {history ? t("toolScan.hideHistory") : t("toolScan.history")}
              </Text>
            </TouchableOpacity>
          </View>

          {loadingHistory ? (
            <ActivityIndicator style={{ marginTop: 12 }} color="#0785F4" />
          ) : null}
          {history ? (
            <ScrollView style={styles.historyBox}>
              {history.length === 0 ? (
                <Text style={styles.historyEmpty}>
                  {t("toolScan.noHistory")}
                </Text>
              ) : (
                history.map((e, i) => (
                  <View key={e._id || i} style={styles.historyItem}>
                    <Text style={styles.historyType}>
                      {t(`toolScan.events.${e.type}`, e.type)}
                    </Text>
                    <Text style={styles.historyDate}>
                      {e.createdAt
                        ? new Date(e.createdAt).toLocaleString(getDateLocale())
                        : ""}
                      {e.note ? ` · ${e.note}` : ""}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          ) : null}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>{t("createProject.close")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
