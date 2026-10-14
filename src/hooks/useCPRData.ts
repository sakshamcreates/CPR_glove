import { useState, useEffect, useCallback } from 'react';
import { CPRData, ConnectionStatus, AdapterMode, ESP32HelloMessage } from '../types/cpr';
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
  const [error, setError] = useState<string | null>(() => {
    const adapter = getDataAdapter();
    return adapter.getError ? adapter.getError() : null;
  });
  const [helloInfo, setHelloInfo] = useState<ESP32HelloMessage | null>(() => {
    const adapter = getDataAdapter();
    return adapter.getHelloInfo ? adapter.getHelloInfo() : null;
  });
  const [isPaused, setIsPaused] = useState<boolean>(() => {
    const adapter = getDataAdapter();
    return adapter.isPaused ? adapter.isPaused() : false;
  });

  useEffect(() => {
    let activeAdapter = getDataAdapter();

    const subscribeToAdapter = (adapter = activeAdapter) => {
      setConnectionStatus(adapter.getStatus());
      if (adapter.getError) {
        setError(adapter.getError());
      }
      if (adapter.getHelloInfo) {
        setHelloInfo(adapter.getHelloInfo());
      }

      // Data subscription
      const unsubscribeData = adapter.subscribe((newData: CPRData) => {
        setData(newData);
        if (newData.helloInfo) {
          setHelloInfo(newData.helloInfo);
        }
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

      // Error change subscription
      let unsubscribeError: (() => void) | undefined;
      if (adapter.onError) {
        unsubscribeError = adapter.onError((err) => {
          setError(err);
        });
      }

      return () => {
        unsubscribeData();
        if (unsubscribeStatus) {
          unsubscribeStatus();
        }
        if (unsubscribeError) {
          unsubscribeError();
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

  const [wsUrl, setWsUrlState] = useState<string>(() => {
    const adapter = getDataAdapter();
    return adapter.getWsUrl ? adapter.getWsUrl() : '';
  });

  const setCustomWsUrl = useCallback((url: string) => {
    const adapter = getDataAdapter();
    if (adapter.setCustomWsUrl) {
      adapter.setCustomWsUrl(url);
      setWsUrlState(adapter.getWsUrl ? adapter.getWsUrl() : url);
    }
  }, []);

  const reconnect = useCallback(() => {
    const adapter = getDataAdapter();
    adapter.disconnect();
    adapter.connect();
    if (adapter.getWsUrl) {
      setWsUrlState(adapter.getWsUrl());
    }
  }, []);

  return {
    data,
    latestTelemetry: data,
    connectionStatus,
    error,
    helloInfo,
    adapterMode,
    setAdapterMode,
    isPaused,
    pause,
    resume,
    reset,
    reconnect,
    wsUrl,
    setCustomWsUrl,
  };
}
