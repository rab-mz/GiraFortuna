const SESSION_KEY = 'gf_session';
const ONLINE_SESSION_KEY = 'gf_online_session';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export function saveSession(gameState, onlineInfo = null) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      gameState,
      savedAt: Date.now(),
      version: 1,
    }));
    if (onlineInfo) {
      localStorage.setItem(ONLINE_SESSION_KEY, JSON.stringify(onlineInfo));
    } else {
      localStorage.removeItem(ONLINE_SESSION_KEY);
    }
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function loadOnlineSession() {
  try {
    const raw = localStorage.getItem(ONLINE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(ONLINE_SESSION_KEY);
}
