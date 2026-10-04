import { useEffect, useState } from "react";

// The company's enabled modules + plan, as configured on the web (plan preset
// + superadmin overrides). Fail-open: until loaded, or if the call is not
// allowed for this role, every module counts as enabled.
let state = { plan: null, enabled: null, loadedFor: null };
const listeners = new Set();

const emit = () => listeners.forEach((fn) => fn(state));

export const isModuleEnabled = (key) =>
  !key || !state.enabled || state.enabled.includes(key);

export const getCompanyPlan = () => state.plan;

export async function loadCompanyModules(companyId) {
  if (!companyId) {
    state = { plan: null, enabled: null, loadedFor: null };
    emit();
    return;
  }
  if (state.loadedFor === companyId) return;
  try {
    // Lazy: userRoles imports this file, and api pulls in native storage.
    const api = require("../services/api").default;
    const { data } = await api.get(`/company/${companyId}/modules`);
    state = {
      plan: data?.plan ?? null,
      enabled: Array.isArray(data?.enabled) ? data.enabled : null,
      loadedFor: companyId,
    };
  } catch {
    state = { plan: null, enabled: null, loadedFor: companyId };
  }
  emit();
}

export function useCompanyModules(companyId) {
  const [snapshot, setSnapshot] = useState(state);
  useEffect(() => {
    listeners.add(setSnapshot);
    loadCompanyModules(companyId);
    return () => listeners.delete(setSnapshot);
  }, [companyId]);
  return snapshot;
}
