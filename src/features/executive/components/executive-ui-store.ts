import { create } from 'zustand';

/**
 * Bridges executive-dashboard state to the sidebar Settings panel:
 * - `showHealth`: whether the health bar is pinned to the dashboard (persisted)
 * - `exportCsv`: the dashboard registers its current (filter-aware) CSV export
 *   so the sidebar's Export button can trigger it.
 */
type ExportFn = (() => void) | null;

interface ExecUiState {
  showHealth: boolean;
  hydrated: boolean;
  setShowHealth: (v: boolean) => void;
  hydrate: () => void;
  exportCsv: ExportFn;
  canExport: boolean;
  registerExport: (fn: ExportFn, canExport: boolean) => void;
}

export const useExecUiStore = create<ExecUiState>((set) => ({
  showHealth: false,
  hydrated: false,
  setShowHealth: (v) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('exec_show_health', String(v));
    }
    set({ showHealth: v });
  },
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('exec_show_health');
    set({ showHealth: saved === 'true', hydrated: true });
  },
  exportCsv: null,
  canExport: false,
  registerExport: (fn, canExport) => set({ exportCsv: fn, canExport })
}));
