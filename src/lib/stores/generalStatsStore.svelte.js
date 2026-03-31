const STATS_KEY = 'gf_general_stats';
const HISTORY_KEY = 'gf_match_history';
const MAX_HISTORY = 100;

function loadJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveJSON(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function emptyMode() {
  return { played: 0, won: 0, bestScore: 0 };
}

function defaultStats() {
  return {
    total: emptyMode(),
    single: emptyMode(),
    multi: emptyMode(),
    online: emptyMode(),
    daily: emptyMode(),
  };
}

const MODE_LABELS = {
  single: 'Singolo',
  multi: 'Locale',
  online: 'Online',
  daily: 'Daily',
};

function createGeneralStatsStore() {
  const savedStats = loadJSON(STATS_KEY);
  const savedHistory = loadJSON(HISTORY_KEY);

  let stats = $state(savedStats || defaultStats());
  let history = $state(savedHistory || []);

  function recordGame({ mode, phrase, category, score, seed, rounds, won, players }) {
    // Update aggregated counters
    stats.total.played++;
    if (won) stats.total.won++;
    if (score > stats.total.bestScore) stats.total.bestScore = score;

    const modeStats = stats[mode];
    if (modeStats) {
      modeStats.played++;
      if (won) modeStats.won++;
      if (score > modeStats.bestScore) modeStats.bestScore = score;
    }

    saveJSON(STATS_KEY, stats);

    // Append to history (FIFO cap)
    const entry = {
      date: new Date().toISOString(),
      mode,
      phrase,
      category,
      score,
      seed,
      rounds,
      won,
      players,
    };

    history.unshift(entry);
    if (history.length > MAX_HISTORY) history.pop();
    saveJSON(HISTORY_KEY, history);
  }

  function winRate(mode = 'total') {
    const s = stats[mode];
    if (!s || s.played === 0) return 0;
    return Math.round((s.won / s.played) * 100);
  }

  return {
    get stats() { return stats; },
    get history() { return history; },
    recordGame,
    winRate,
    MODE_LABELS,
  };
}

export const generalStats = createGeneralStatsStore();
