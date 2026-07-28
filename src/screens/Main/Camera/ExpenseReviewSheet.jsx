import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { expenseService, projectService } from '../../../services';

const toNumber = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

// Light review of a scanned receipt before saving it as an utlägg. Project is
// taken from the active shift; without a shift the worker picks one.
export default function ExpenseReviewSheet({ visible, asset, scanned, shift, onClose, onSaved }) {
  const { t } = useTranslation();
  const [supplier, setSupplier] = useState('');
  const [total, setTotal] = useState('');
  const [vat, setVat] = useState('');
  const [category, setCategory] = useState('');
  const [projectId, setProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const hasShift = Boolean(shift?.projectId || shift?.id);

  useEffect(() => {
    if (!visible) return;
    setSupplier(scanned?.supplierName || '');
    setTotal(scanned?.total ? String(scanned.total) : '');
    setVat(scanned?.vat ? String(scanned.vat) : '');
    setCategory(scanned?.category || '');
    setError('');
    if (shift?.projectId) {
      setProjectId(shift.projectId);
    } else {
      setProjectId(null);
      projectService
        .getMyProjects()
        .then((list) => setProjects(Array.isArray(list) ? list : []))
        .catch(() => setProjects([]));
    }
  }, [visible, scanned, shift?.projectId]);

  const projectLabel = useMemo(() => {
    if (shift?.projectName) return shift.projectName;
    const p = projects.find((x) => (x._id || x.id) === projectId);
    return p?.name || null;
  }, [shift?.projectName, projects, projectId]);

  const save = async () => {
    if (!projectId && !shift?.projectId) {
      setError(t('camera.expense.selectProject'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const created = await expenseService.create({
        supplierName: supplier,
        category,
        date: scanned?.date || '',
        amount: toNumber(total),
        vat: toNumber(vat),
        paidBy: 'own',
        projectId: shift?.projectId || projectId || null,
      });
      if (asset && (created?._id || created?.id)) {
        try {
          await expenseService.uploadReceipt(created._id || created.id, asset);
        } catch {
          /* expense saved; photo attach is best-effort */
        }
      }
      onSaved?.();
    } catch (e) {
      setError(e?.response?.data?.message || t('camera.expense.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{t('camera.expense.title')}</Text>

            {asset?.uri ? <Image source={{ uri: asset.uri }} style={styles.preview} /> : null}

            <Text style={styles.label}>{t('camera.expense.supplier')}</Text>
            <TextInput style={styles.input} value={supplier} onChangeText={setSupplier} placeholder={t('camera.expense.supplierPlaceholder')} />

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>{t('camera.expense.total')}</Text>
                <TextInput style={styles.input} value={total} onChangeText={setTotal} keyboardType="decimal-pad" placeholder="0" />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>{t('camera.expense.vat')}</Text>
                <TextInput style={styles.input} value={vat} onChangeText={setVat} keyboardType="decimal-pad" placeholder="0" />
              </View>
            </View>

            <Text style={styles.label}>{t('camera.expense.category')}</Text>
            <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder={t('camera.expense.categoryPlaceholder')} />

            <Text style={styles.label}>{t('createTask.projectLabel')}</Text>
            {hasShift && shift?.projectName ? (
              <View style={styles.projectFixed}>
                <Text style={styles.projectFixedText}>{projectLabel}</Text>
              </View>
            ) : (
              <View style={styles.projectList}>
                {projects.length === 0 ? (
                  <Text style={styles.hint}>{t('projects.notFound')}</Text>
                ) : (
                  projects.map((p) => {
                    const id = p._id || p.id;
                    const active = id === projectId;
                    return (
                      <TouchableOpacity
                        key={id}
                        style={[styles.projectChip, active && styles.projectChipActive]}
                        onPress={() => setProjectId(id)}
                      >
                        <Text style={[styles.projectChipText, active && styles.projectChipTextActive]}>{p.name}</Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{t('camera.expense.save')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(5,45,80,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24, maxHeight: '90%' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#052D50', marginBottom: 12 },
  preview: { width: '100%', height: 160, borderRadius: 14, backgroundColor: '#EEE', marginBottom: 14 },
  label: { color: '#5F7588', fontSize: 13, marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#D8E0E8', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#052D50' },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  projectFixed: { backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  projectFixedText: { color: '#052D50', fontSize: 15, fontWeight: '600' },
  projectList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  projectChip: { borderWidth: 1, borderColor: '#D8E0E8', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  projectChipActive: { backgroundColor: '#0785F4', borderColor: '#0785F4' },
  projectChipText: { color: '#052D50', fontSize: 14 },
  projectChipTextActive: { color: '#fff', fontWeight: '600' },
  hint: { color: '#94A3B8', fontSize: 13 },
  error: { color: '#DC2626', marginTop: 12 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, height: 52, borderRadius: 16, borderWidth: 1, borderColor: '#D8E0E8', alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#5F7588', fontSize: 15, fontWeight: '600' },
  saveBtn: { flex: 2, height: 52, borderRadius: 16, backgroundColor: '#0785F4', alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
