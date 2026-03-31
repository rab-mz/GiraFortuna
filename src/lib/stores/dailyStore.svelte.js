import { phrases } from '../data/phrases.js';
import { isLetter, normalizeChar } from '../utils/italian.js';

const DAILY_KEY = 'gf_daily';
const STATS_KEY = 'gf_stats';

// Mulberry32 PRNG - deterministic from integer seed
function mulberry32(seed) {
  let t = (seed + 0x6D2B79F5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function dateToSeed(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function getDailyNumber(dateStr = getTodayStr()) {
  const launch = new Date('2026-03-30T00:00:00');
  const target = new Date(dateStr + 'T00:00:00');
  return Math.floor((target - launch) / 86400000) + 1;
}

function getDailyPhraseForDate(dateStr) {
  const seed = dateToSeed('girafortuna-' + dateStr);
  const r = mulberry32(seed);
  const idx = Math.floor(r * phrases.length);
  return { ...phrases[idx] };
}

function loadJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveJSON(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function createDailyStore() {
  const today = getTodayStr();
  const savedDaily = loadJSON(DAILY_KEY);
  const savedStats = loadJSON(STATS_KEY);

  let dailyResult = $state(
    savedDaily?.date === today ? savedDaily : null
  );

  let stats = $state(savedStats || {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    bestScore: 0,
    lastPlayedDate: null,
  });

  let hasPlayedToday = $derived(dailyResult !== null);
  let dailyNumber = $derived(getDailyNumber());

  // Display streak: account for broken streaks
  let streak = $derived(
    (stats.lastPlayedDate === getTodayStr() || stats.lastPlayedDate === getYesterdayStr())
      ? stats.currentStreak
      : 0
  );

  function getDailyPhrase() {
    return getDailyPhraseForDate(getTodayStr());
  }

  function recordResult({ score, revealedCount, totalCount, phraseText, revealedLetters, jollyPositions }) {
    const today = getTodayStr();
    const phrase = getDailyPhrase();

    const result = {
      date: today,
      dailyNumber: getDailyNumber(),
      score,
      revealedCount,
      totalCount,
      phraseText,
      revealedLetters,
      jollyPositions,
      category: phrase.category,
    };
    dailyResult = result;
    saveJSON(DAILY_KEY, result);

    // Update stats
    stats.gamesPlayed++;
    stats.gamesWon++;
    if (score > stats.bestScore) stats.bestScore = score;

    // Streak: if played yesterday, increment; otherwise reset to 1
    const yesterdayStr = getYesterdayStr();
    if (stats.lastPlayedDate === yesterdayStr) {
      stats.currentStreak++;
    } else if (stats.lastPlayedDate !== today) {
      stats.currentStreak = 1;
    }
    stats.lastPlayedDate = today;

    if (stats.currentStreak > stats.maxStreak) {
      stats.maxStreak = stats.currentStreak;
    }
    saveJSON(STATS_KEY, { ...stats });
  }

  function buildEmojiGrid(phraseText, revealedLettersArr, jollyPositionsArr) {
    const revealed = new Set(revealedLettersArr || []);
    const jolly = new Set(jollyPositionsArr || []);
    let grid = '';
    let pos = 0;
    for (const ch of phraseText) {
      if (ch === ' ') {
        grid += ' ';
      } else if (isLetter(ch)) {
        const norm = normalizeChar(ch);
        grid += (revealed.has(norm) || jolly.has(pos)) ? '🟨' : '⬛';
      }
      pos++;
    }
    return grid;
  }

  function getShareText() {
    if (!dailyResult) return '';
    const r = dailyResult;
    const grid = buildEmojiGrid(r.phraseText, r.revealedLetters, r.jollyPositions);
    return [
      `🎡 Gira la Fortuna #${r.dailyNumber}`,
      `📂 ${r.category}`,
      `💰 ${r.score.toLocaleString('it-IT')}€`,
      `🔤 ${r.revealedCount}/${r.totalCount}`,
      ``,
      grid,
      ``,
      `🔥 ${stats.currentStreak} ${stats.currentStreak === 1 ? 'giorno' : 'giorni'}`,
      `giralafortuna.it`,
    ].join('\n');
  }

  return {
    get dailyResult() { return dailyResult; },
    get hasPlayedToday() { return hasPlayedToday; },
    get dailyNumber() { return dailyNumber; },
    get stats() { return stats; },
    get streak() { return streak; },
    getDailyPhrase,
    recordResult,
    getShareText,
  };
}

export const daily = createDailyStore();
