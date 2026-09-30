import { DataAdapter, ConnectionStatus, AdapterMode } from '../types/cpr';
import { demoAdapter } from './demoAdapter';
import { esp32Adapter } from './esp32Adapter';

export type { DataAdapter, ConnectionStatus, AdapterMode };

type ModeListener = (mode: AdapterMode, adapter: DataAdapter) => void;
const modeListeners: Set<ModeListener> = new Set();

const STORAGE_MODE_KEY = 'sanjeevani_adapter_mode';

function getInitialMode(): AdapterMode {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem(STORAGE_MODE_KEY);
    if (saved === 'esp32' || saved === 'demo') {
      return saved;
    }
  }
  return 'demo';
}

let currentMode: AdapterMode = getInitialMode();
let currentAdapter: DataAdapter = currentMode === 'esp32' ? esp32Adapter : demoAdapter;

export function getDataAdapter(): DataAdapter {
  return currentAdapter;
}

export function getAdapterMode(): AdapterMode {
  return currentMode;
}

export function setAdapterMode(mode: AdapterMode): void {
  if (currentMode === mode) return;

  if (currentAdapter) {
    currentAdapter.disconnect();
  }

  currentMode = mode;
  currentAdapter = mode === 'esp32' ? esp32Adapter : demoAdapter;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_MODE_KEY, mode);
  }

  for (const listener of modeListeners) {
    listener(currentMode, currentAdapter);
  }
}

export function onAdapterModeChange(listener: ModeListener): () => void {
  modeListeners.add(listener);
  return () => {
    modeListeners.delete(listener);
  };
}

export function setDataAdapter(adapter: DataAdapter): void {
  if (currentAdapter && currentAdapter !== adapter) {
    currentAdapter.disconnect();
  }
  currentAdapter = adapter;
}
