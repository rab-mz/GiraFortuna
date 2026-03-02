const STORAGE_KEY = 'gf_settings';

export const ALL_CATEGORIES = [
  'Proverbio',
  'Modo di dire',
  'Espressione',
  'Frase celebre',
  'Titolo di film',
  'Canzone',
  'Personaggio famoso',
  'Luogo',
  'Cibo',
  'Serie TV',
  'Sport',
  'Scienza e natura',
];

const DEFAULTS = {
  soundEnabled: true,
  timerSeconds: 30,
  difficulty: 'all',       // 'short' | 'medium' | 'long' | 'all'
  vowelCost: 500,
  enabledCategories: [...ALL_CATEGORIES],
};

function loadSettings() {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure enabledCategories is always a valid array
      if (!Array.isArray(parsed.enabledCategories) || parsed.enabledCategories.length === 0) {
        parsed.enabledCategories = [...ALL_CATEGORIES];
      }
      return { ...DEFAULTS, ...parsed };
    }
  } catch {}
  return { ...DEFAULTS };
}

function createSettingsStore() {
  const initial = loadSettings();

  let soundEnabled = $state(initial.soundEnabled);
  let timerSeconds = $state(initial.timerSeconds);
  let difficulty = $state(initial.difficulty);
  let vowelCost = $state(initial.vowelCost);
  let enabledCategories = $state(initial.enabledCategories);

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      soundEnabled,
      timerSeconds,
      difficulty,
      vowelCost,
      enabledCategories,
    }));
  }

  return {
    get soundEnabled() { return soundEnabled; },
    set soundEnabled(v) { soundEnabled = v; save(); },

    get timerSeconds() { return timerSeconds; },
    set timerSeconds(v) { timerSeconds = v; save(); },

    get difficulty() { return difficulty; },
    set difficulty(v) { difficulty = v; save(); },

    get vowelCost() { return vowelCost; },
    set vowelCost(v) { vowelCost = v; save(); },

    get enabledCategories() { return enabledCategories; },
    set enabledCategories(v) { enabledCategories = v; save(); },

    toggleCategory(cat) {
      if (enabledCategories.includes(cat)) {
        // Don't allow disabling all
        if (enabledCategories.length <= 1) return;
        enabledCategories = enabledCategories.filter(c => c !== cat);
      } else {
        enabledCategories = [...enabledCategories, cat];
      }
      save();
    },

    reset() {
      soundEnabled = DEFAULTS.soundEnabled;
      timerSeconds = DEFAULTS.timerSeconds;
      difficulty = DEFAULTS.difficulty;
      vowelCost = DEFAULTS.vowelCost;
      enabledCategories = [...DEFAULTS.enabledCategories];
      save();
    },
  };
}

export const settings = createSettingsStore();
