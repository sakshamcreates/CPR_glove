import { CPRSession } from '../types/cpr';

const STORAGE_KEY = 'pulsemate_cpr_sessions';

export const sessionStorage = {
  getSessions(): CPRSession[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // Validate schema minimally and sort newest first
      return parsed
        .filter((s): s is CPRSession => Boolean(s && typeof s.id === 'string' && typeof s.startedAt === 'number'))
        .sort((a, b) => b.startedAt - a.startedAt);
    } catch (err) {
      console.warn('Failed to parse sessions from localStorage:', err);
      return [];
    }
  },

  getSession(id: string): CPRSession | undefined {
    const sessions = this.getSessions();
    return sessions.find((s) => s.id === id);
  },

  saveSession(session: CPRSession): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getSessions();
      // Replace if existing, or prepend
      const existingIdx = current.findIndex((s) => s.id === session.id);
      let updated: CPRSession[];
      if (existingIdx >= 0) {
        updated = [...current];
        updated[existingIdx] = session;
      } else {
        updated = [session, ...current];
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save session to localStorage:', err);
    }
  },

  deleteSession(id: string): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getSessions();
      const updated = current.filter((s) => s.id !== id);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to delete session from localStorage:', err);
    }
  },

  clearSessions(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear sessions from localStorage:', err);
    }
  },
};
