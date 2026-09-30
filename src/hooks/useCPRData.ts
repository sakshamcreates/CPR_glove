import { useState, useEffect, useCallback } from 'react';
import { CPRData, ConnectionStatus, AdapterMode } from '../types/cpr';
import {
  getDataAdapter,
  getAdapterMode,
  setAdapterMode as setGlobalAdapterMode,
  onAdapterModeChange,
} from '../services/dataAdapter';

export function useCPRData() {
  const [adapterMode, setMode] = useState<AdapterMode>(() => getAdapterMode());
  const [data, setData] = useState<CPRData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(() =>
    getDataAdapter().getStatus()
  );
  const [isPaused, setIsPaused] = useState<boolean>(() => {
    const adapter = getDataAdapter();
    return adapter.isPaused ? adapter.isPaused() : false;
  });

  useEffect(() => {
    let activeAdapter = getDataAdapter();

    const subscribeToAdapter = (adapter = activeAdapter) => {
      setConnectionStatus(adapter.getStatus());

      // Data subscription
      const unsubscribeData = adapter.subscribe((newData: CPRData) => {
        setData(newData);
        if (adapter.isPaused) {
          setIsPaused(adapter.isPaused());
        }
      });

      // Status change subscription
      let unsubscribeStatus: (() => void) | undefined;
      if (adapter.onStatusChange) {
        unsubscribeStatus = adapter.onStatusChange((status) => {
          setConnectionStatus(status);
        });
      }

      return () => {
        unsubscribeData();
        if (unsubscribeStatus) {
          unsubscribeStatus();
        }
      };
    };

    let cleanupCurrent = subscribeToAdapter(activeAdapter);

    // Listen for mode changes (e.g. toggling Demo <-> Live ESP32)
    const unsubscribeMode = onAdapterModeChange((newMode, newAdapter) => {
      setMode(newMode);
      cleanupCurrent();
      activeAdapter = newAdapter;
      cleanupCurrent = subscribeToAdapter(newAdapter);
    });

    return () => {
      cleanupCurrent();
      unsubscribeMode();
    };
  }, []);

  const pause = useCallback(() => {
    const adapter = getDataAdapter();
    if (adapter.pause) {
      adapter.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    const adapter = getDataAdapter();
    if (adapter.resume) {
      adapter.resume();
      setIsPaused(false);
    }
  }, []);

  const reset = useCallback(() => {
    const adapter = getDataAdapter();
    if (adapter.reset) {
      adapter.reset();
    }
  }, []);

  const setAdapterMode = useCallback((newMode: AdapterMode) => {
    setGlobalAdapterMode(newMode);
  }, []);

  return {
    data,
    connectionStatus,
    adapterMode,
    setAdapterMode,
    isPaused,
    pause,
    resume,
    reset,
  };
}
