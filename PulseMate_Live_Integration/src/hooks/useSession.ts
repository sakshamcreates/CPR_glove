import { useState, useEffect, useCallback, useRef } from 'react';
import { CPRSession } from '../types/cpr';
import { getDataAdapter } from '../services/dataAdapter';
import { sessionStorage } from '../services/sessionStorage';

export function useSession() {
  const adapter = getDataAdapter();
  const [isRecording, setIsRecording] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessions, setSessions] = useState<CPRSession[]>(() => sessionStorage.getSessions());
  const timerRef = useRef<number | null>(null);

  // Synchronize sessions list
  const refreshSessions = useCallback(() => {
    setSessions(sessionStorage.getSessions());
  }, []);

  const startSession = useCallback(() => {
    if (adapter.startSession) {
      adapter.startSession();
    }
    setIsRecording(true);
    setSessionDuration(0);

    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
    }

    timerRef.current = window.setInterval(() => {
      setSessionDuration((prev) => prev + 1);
    }, 1000);
  }, [adapter]);

  const stopSession = useCallback((): CPRSession | null => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);

    let savedSession: CPRSession | null = null;
    if (adapter.stopSession) {
      savedSession = adapter.stopSession();
      if (savedSession) {
        sessionStorage.saveSession(savedSession);
        refreshSessions();
      }
    }
    return savedSession;
  }, [adapter, refreshSessions]);

  const deleteSession = useCallback((id: string) => {
    sessionStorage.deleteSession(id);
    refreshSessions();
  }, [refreshSessions]);

  const clearSessions = useCallback(() => {
    sessionStorage.clearSessions();
    refreshSessions();
  }, [refreshSessions]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    isRecording,
    sessionDuration,
    sessions,
    startSession,
    stopSession,
    deleteSession,
    clearSessions,
    refreshSessions,
  };
}
