import React, { useContext, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AuthContext from '../../contexts/AuthContext';
import { toolService } from '../../services';

const STATUS_LABELS = {
  available: 'Tillgänglig',
  occupied: 'Upptaget',
  broken: 'Trasig',
  in_repair: 'På service',
};

const EVENT_LABELS = {
  created: 'Registrerad',
  handoff: 'Överlämnad',
  returned: 'Återlämnad',
  inspection: 'Kontroll',
  repair: 'Reparation',
  status_change: 'Statusändring',
  note: 'Notering',
};

const idOf = (v) => (v && typeof v === 'object' ? v._id || v.id : v);

// Bottom sheet shown after scanning (or tapping) a tool: who holds it now,
// plus Take-over / Return / History. Writes go through the same hand-off
// endpoint the admin uses.
export default function ToolActionSheet({ visible, tool, onClose, onUpdated }) {
  const { userId, user } = useContext(AuthContext);
  const myId = userId || user?._id || user?.id || null;
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const holderId = tool ? idOf(tool.currentHolderId) : null;
  const heldByMe = holderId && String(holderId) === String(myId);

  const holderText = useMemo(() => {
    if (heldByMe) return 'Du har den';
    if (holderId) return 'Utlånad';
    return 'På lager';
  }, [heldByMe, holderId]);

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
    if (history) { setHistory(null); return; }
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.name}>{tool.name}</Text>

          <View style={styles.metaRow}>
            <View style={[styles.badge, styles[`badge_${tool.status}`] || styles.badge_available]}>
              <Text style={styles.badgeText}>{STATUS_LABELS[tool.status] || tool.status}</Text>
            </View>
            <Text style={styles.holder}>{holderText}</Text>
          </View>

          {tool.location ? <Text style={styles.location}>📍 {tool.location}</Text> : null}
          {tool.qrId ? <Text style={styles.qr}>{tool.qrId}</Text> : null}

          <View style={styles.actions}>
            {!heldByMe ? (
              <TouchableOpacity style={styles.primaryBtn} disabled={busy} onPress={() => run({ toUserId: myId })}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Ta över</Text>}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.primaryBtn} disabled={busy} onPress={() => run({ toUserId: '' })}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Lämna tillbaka</Text>}
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.secondaryBtn} onPress={loadHistory}>
              <Text style={styles.secondaryText}>{history ? 'Dölj historik' : 'Historik'}</Text>
            </TouchableOpacity>
          </View>

          {loadingHistory ? <ActivityIndicator style={{ marginTop: 12 }} color="#0785F4" /> : null}
          {history ? (
            <ScrollView style={styles.historyBox}>
              {history.length === 0 ? (
                <Text style={styles.historyEmpty}>Ingen historik ännu.</Text>
              ) : (
                history.map((e, i) => (
                  <View key={e._id || i} style={styles.historyItem}>
                    <Text style={styles.historyType}>{EVENT_LABELS[e.type] || e.type}</Text>
                    <Text style={styles.historyDate}>
                      {e.createdAt ? new Date(e.createdAt).toLocaleString('sv-SE') : ''}
                      {e.note ? ` · ${e.note}` : ''}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          ) : null}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Stäng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(5,45,80,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28, maxHeight: '85%' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', marginBottom: 14 },
  name: { fontSize: 20, fontWeight: '700', color: '#052D50' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badge_available: { backgroundColor: 'rgba(22,163,94,0.14)' },
  badge_occupied: { backgroundColor: 'rgba(7,133,244,0.14)' },
  badge_broken: { backgroundColor: 'rgba(220,38,38,0.14)' },
  badge_in_repair: { backgroundColor: 'rgba(234,166,35,0.16)' },
  badgeText: { fontSize: 13, fontWeight: '600', color: '#052D50' },
  holder: { color: '#5F7588', fontSize: 14, fontWeight: '600' },
  location: { color: '#5F7588', fontSize: 14, marginTop: 8 },
  qr: { color: '#94A3B8', fontSize: 13, fontFamily: 'Courier', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 18 },
  primaryBtn: { flex: 2, height: 52, borderRadius: 16, backgroundColor: '#0785F4', alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryBtn: { flex: 1, height: 52, borderRadius: 16, borderWidth: 1, borderColor: '#D8E0E8', alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#0785F4', fontSize: 15, fontWeight: '600' },
  historyBox: { marginTop: 14, maxHeight: 200 },
  historyEmpty: { color: '#94A3B8', fontSize: 14 },
  historyItem: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#EEF2F6' },
  historyType: { color: '#052D50', fontSize: 14, fontWeight: '600' },
  historyDate: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  closeBtn: { marginTop: 18, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },
  closeText: { color: '#5F7588', fontSize: 15, fontWeight: '600' },
});
