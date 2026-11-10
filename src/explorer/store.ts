import { create } from 'zustand';
import type { ProviderId, ScenarioId } from './types';

export type Speed = 0.5 | 1 | 1.5 | 2;
export type PanelTab = 'detalle' | 'inspector' | 'codigo' | 'bitacora';

interface ExplorerState {
  scenarioId: ScenarioId;
  variantId: string;
  stepIndex: number;
  eventIndex: number;
  playing: boolean;
  speed: Speed;
  onePacket: boolean;
  view: 'red' | 'secuencia';
  diagramOnly: boolean;
  listOpen: boolean;
  panelOpen: boolean;
  panel: PanelTab;
  longOpen: boolean;
  helpOpen: boolean;
  searchOpen: boolean;
  selectedNode: string | null;
  provider: ProviderId;
  insideBox: boolean;
  setScenario: (id: ScenarioId, variantId?: string) => void;
  setVariant: (id: string) => void;
  toggle: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  goto: (step: number) => void;
  setSpeed: (speed: Speed) => void;
  togglePacket: () => void;
  toggleView: () => void;
  toggleDiagram: () => void;
  toggleList: () => void;
  toggleTheme: () => void;
  setPanel: (panel: PanelTab) => void;
  setLong: (open: boolean) => void;
  setHelp: (open: boolean) => void;
  setSearch: (open: boolean) => void;
  selectNode: (id: string | null) => void;
  setInside: (inside: boolean) => void;
  setProvider: (provider: ProviderId) => void;
  reset: () => void;
}

const base = {
  scenarioId: 'texto-privado' as ScenarioId,
  variantId: 'base',
  stepIndex: -1,
  eventIndex: 0,
  playing: false,
  speed: 1 as Speed,
  onePacket: false,
  view: 'red' as const,
  diagramOnly: false,
  listOpen: false,
  panelOpen: true,
  panel: 'detalle' as PanelTab,
  longOpen: false,
  helpOpen: false,
  searchOpen: false,
  selectedNode: null,
  provider: 'gemini' as ProviderId,
  insideBox: true,
};

export const useExplorer = create<ExplorerState>((set) => ({
  ...base,
  setScenario: (scenarioId, variantId) =>
    set({ scenarioId, variantId: variantId ?? 'base', stepIndex: -1, eventIndex: 0, playing: false, longOpen: false }),
  setVariant: (variantId) => set({ variantId, stepIndex: -1, eventIndex: 0, playing: false }),
  toggle: () => set((state) => ({ playing: !state.playing, stepIndex: state.stepIndex < 0 ? 0 : state.stepIndex })),
  pause: () => set({ playing: false }),
  next: () => set((state) => ({ stepIndex: state.stepIndex + 1, eventIndex: 0, playing: false })),
  prev: () => set((state) => ({ stepIndex: Math.max(-1, state.stepIndex - 1), eventIndex: 0, playing: false })),
  goto: (stepIndex) => set({ stepIndex, eventIndex: 0, playing: false }),
  setSpeed: (speed) => set({ speed }),
  togglePacket: () => set((state) => ({ onePacket: !state.onePacket })),
  toggleView: () => set((state) => ({ view: state.view === 'red' ? 'secuencia' : 'red' })),
  toggleDiagram: () => set((state) => ({ diagramOnly: !state.diagramOnly })),
  toggleList: () => set((state) => ({ listOpen: !state.listOpen })),
  toggleTheme: () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('wappi-view-theme', next);
  },
  setPanel: (panel) => set({ panel, panelOpen: true }),
  setLong: (longOpen) => set({ longOpen }),
  setHelp: (helpOpen) => set({ helpOpen }),
  setSearch: (searchOpen) => set({ searchOpen }),
  selectNode: (selectedNode) => set({ selectedNode, panelOpen: true, panel: 'detalle' }),
  setInside: (insideBox) => set({ insideBox }),
  setProvider: (provider) => set({ provider }),
  reset: () => set({ ...base }),
}));
