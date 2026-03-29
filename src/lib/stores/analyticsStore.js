/**
 * Analytics Store - Gira la Fortuna
 *
 * Tracks sessions and game events to Supabase.
 * Designed to be silent — never throws, never blocks gameplay.
 */
import { supabase, isSupabaseConfigured } from '../supabase.js';

const VISITOR_KEY = 'glf_visitor_id';
const SESSION_KEY = 'glf_session_id';

// --- Visitor ID (persistent across sessions) ---
function getOrCreateVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

// --- Device detection ---
function getDeviceInfo() {
  const ua = navigator.userAgent;

  let deviceType = 'desktop';
  if (/Mobi|Android/i.test(ua)) deviceType = 'mobile';
  else if (/Tablet|iPad/i.test(ua)) deviceType = 'tablet';

  let browser = 'unknown';
  if (/CriOS|Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Opera|OPR/i.test(ua)) browser = 'Opera';

  let os = 'unknown';
  if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return {
    device_type: deviceType,
    browser,
    os,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    language: navigator.language || navigator.userLanguage || 'unknown',
  };
}

// --- UTM params ---
function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
  };
}

// --- Country guess from language ---
function guessCountry(lang) {
  if (!lang) return null;
  const parts = lang.split('-');
  return parts.length > 1 ? parts[1].toUpperCase() : parts[0].toUpperCase();
}

// --- Analytics singleton ---
class Analytics {
  constructor() {
    this.visitorId = null;
    this.sessionId = null;
    this.sessionStartTime = null;
    this.gameStartTime = null;
    this._initialized = false;
  }

  async init() {
    if (this._initialized || !isSupabaseConfigured) return;
    this._initialized = true;

    try {
      this.visitorId = getOrCreateVisitorId();
      this.sessionStartTime = Date.now();

      const device = getDeviceInfo();
      const utm = getUtmParams();
      const country = guessCountry(device.language);

      // Generate session ID client-side (avoids needing SELECT after INSERT, which RLS blocks)
      this.sessionId = crypto.randomUUID();

      const { error } = await supabase
        .from('analytics_sessions')
        .insert({
          id: this.sessionId,
          visitor_id: this.visitorId,
          referrer: document.referrer || null,
          utm_source: utm.utm_source,
          utm_medium: utm.utm_medium,
          utm_campaign: utm.utm_campaign,
          landing_page: window.location.pathname,
          device_type: device.device_type,
          browser: device.browser,
          os: device.os,
          screen_width: device.screen_width,
          screen_height: device.screen_height,
          language: device.language,
          country,
        });

      if (error) {
        console.warn('[Analytics] Session insert failed:', error.message);
        this.sessionId = null;
        return;
      }
      sessionStorage.setItem(SESSION_KEY, this.sessionId);

      // Track the page view
      this.track('page_view', {
        url: window.location.href,
        title: document.title,
      });

      // End session on page unload
      this._setupUnload();
    } catch (e) {
      console.warn('[Analytics] Init failed:', e.message);
    }
  }

  _setupUnload() {
    const sessionId = this.sessionId;
    const visitorId = this.visitorId;
    const startTime = this.sessionStartTime;
    const baseUrl = supabase.supabaseUrl;
    const apikey = supabase.supabaseKey;

    let sent = false;
    const endSession = () => {
      if (sent || !sessionId) return;
      sent = true;

      const duration = Math.round((Date.now() - startTime) / 1000);

      // Track session_end event via sendBeacon (POST only, no PATCH needed)
      // Supabase REST accepts apikey as query param
      const eventUrl = `${baseUrl}/rest/v1/analytics_events?apikey=${apikey}`;
      const eventBody = JSON.stringify({
        session_id: sessionId,
        visitor_id: visitorId,
        event_type: 'session_end',
        event_data: { duration_seconds: duration },
      });
      navigator.sendBeacon(eventUrl, new Blob([eventBody], { type: 'application/json' }));
    };

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') endSession();
    });
  }

  async track(eventType, eventData = {}) {
    if (!this.sessionId || !isSupabaseConfigured) return;

    try {
      await supabase.from('analytics_events').insert({
        session_id: this.sessionId,
        visitor_id: this.visitorId,
        event_type: eventType,
        event_data: eventData,
      });
    } catch (e) {
      // Silent fail — analytics must never break gameplay
    }
  }

  // --- Convenience methods for game events ---

  trackGameStart({ mode, playerCount, seed, rounds }) {
    this.gameStartTime = Date.now();
    this.track('game_start', { mode, player_count: playerCount, seed, rounds });
  }

  trackSpin({ value, seed }) {
    this.track('spin', { value, seed });
  }

  trackLetterGuess({ letter, type, found, count }) {
    this.track('letter_guess', { letter, type, found, count });
  }

  trackPuzzleSolve({ success, phrase_length }) {
    this.track('puzzle_solve', { success, phrase_length });
  }

  trackRoundEnd({ winner, scores, round, totalRounds }) {
    const duration = this.gameStartTime
      ? Math.round((Date.now() - this.gameStartTime) / 1000)
      : null;
    this.track('round_end', { winner, scores, round, total_rounds: totalRounds, duration_seconds: duration });
  }

  trackGameEnd({ winner, scores, totalRounds }) {
    const duration = this.gameStartTime
      ? Math.round((Date.now() - this.gameStartTime) / 1000)
      : null;
    this.gameStartTime = null;
    this.track('game_end', { winner, scores, total_rounds: totalRounds, duration_seconds: duration });
  }

  trackRoomCreate({ roomCode }) {
    this.track('room_create', { room_code: roomCode });
  }

  trackRoomJoin({ roomCode }) {
    this.track('room_join', { room_code: roomCode });
  }

  trackSessionResume() {
    this.track('session_resume');
  }

  trackMenuAction({ action }) {
    this.track('menu_action', { action });
  }
}

export const analytics = new Analytics();
