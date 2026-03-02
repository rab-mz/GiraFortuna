<script>
  import { fly } from 'svelte/transition';
  import { settings, ALL_CATEGORIES } from '../lib/stores/settingsStore.svelte.js';

  let { open = false, onClose = () => {} } = $props();

  const TIMER_OPTIONS = [15, 20, 30, 45, 60];
  const VOWEL_OPTIONS = [200, 300, 500, 750];
  const DIFFICULTY_OPTIONS = [
    { value: 'all', label: 'Tutte' },
    { value: 'short', label: 'Corte' },
    { value: 'medium', label: 'Medie' },
    { value: 'long', label: 'Lunghe' },
  ];

  let allCatsEnabled = $derived(settings.enabledCategories.length === ALL_CATEGORIES.length);

  function toggleAll() {
    if (allCatsEnabled) {
      // Can't disable all — keep first one
      settings.enabledCategories = [ALL_CATEGORIES[0]];
    } else {
      settings.enabledCategories = [...ALL_CATEGORIES];
    }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="overlay" transition:fly={{ y: 30, duration: 300 }} onclick={onClose}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <button class="close-btn" onclick={onClose}>&times;</button>
      <h2>Impostazioni</h2>

      <div class="settings-scroll">
        <!-- Sound -->
        <div class="setting-row">
          <div class="setting-label">
            <span class="setting-name">Effetti sonori</span>
          </div>
          <button
            class="toggle"
            class:active={settings.soundEnabled}
            onclick={() => { settings.soundEnabled = !settings.soundEnabled; }}
            aria-label={settings.soundEnabled ? 'Disattiva suoni' : 'Attiva suoni'}
          >
            <span class="toggle-knob"></span>
          </button>
        </div>

        <!-- Difficulty -->
        <div class="setting-row col">
          <div class="setting-label">
            <span class="setting-name">Difficolta'</span>
            <span class="setting-desc">Lunghezza delle frasi da indovinare</span>
          </div>
          <div class="chip-row">
            {#each DIFFICULTY_OPTIONS as opt}
              <button
                class="chip"
                class:active={settings.difficulty === opt.value}
                onclick={() => { settings.difficulty = opt.value; }}
              >
                {opt.label}
              </button>
            {/each}
          </div>
        </div>

        <!-- Vowel cost -->
        <div class="setting-row">
          <div class="setting-label">
            <span class="setting-name">Costo vocale</span>
            <span class="setting-desc">Prezzo per comprare una vocale</span>
          </div>
          <div class="chip-row">
            {#each VOWEL_OPTIONS as v}
              <button
                class="chip"
                class:active={settings.vowelCost === v}
                onclick={() => { settings.vowelCost = v; }}
              >
                {v}€
              </button>
            {/each}
          </div>
        </div>

        <!-- Timer -->
        <div class="setting-row">
          <div class="setting-label">
            <span class="setting-name">Timer turno</span>
            <span class="setting-desc">Secondi per turno (multiplayer)</span>
          </div>
          <div class="chip-row">
            {#each TIMER_OPTIONS as t}
              <button
                class="chip"
                class:active={settings.timerSeconds === t}
                onclick={() => { settings.timerSeconds = t; }}
              >
                {t}s
              </button>
            {/each}
          </div>
        </div>

        <!-- Categories -->
        <div class="setting-row col">
          <div class="setting-label">
            <span class="setting-name">Categorie</span>
            <span class="setting-desc">Scegli da quali categorie pescare le frasi</span>
          </div>
          <div class="cat-grid">
            <button
              class="cat-chip all-chip"
              class:active={allCatsEnabled}
              onclick={toggleAll}
            >
              Tutte
            </button>
            {#each ALL_CATEGORIES as cat}
              <button
                class="cat-chip"
                class:active={settings.enabledCategories.includes(cat)}
                onclick={() => settings.toggleCategory(cat)}
              >
                {cat}
              </button>
            {/each}
          </div>
        </div>
      </div>

      <button class="reset-btn" onclick={() => settings.reset()}>
        Ripristina predefiniti
      </button>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 400;
    backdrop-filter: blur(8px);
    padding: 1rem;
  }
  .modal {
    background: linear-gradient(135deg, #1a237e, #0d1b4a);
    border: 2px solid rgba(255,215,0,0.3);
    border-radius: 16px;
    padding: 2rem;
    max-width: 460px;
    width: 100%;
    max-height: 85vh;
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .settings-scroll {
    overflow-y: auto;
    flex: 1;
    margin-right: -0.5rem;
    padding-right: 0.5rem;
  }
  .settings-scroll::-webkit-scrollbar { width: 5px; }
  .settings-scroll::-webkit-scrollbar-track { background: transparent; }
  .settings-scroll::-webkit-scrollbar-thumb { background: rgba(255,215,0,0.2); border-radius: 3px; }

  .close-btn {
    position: absolute;
    top: 0.8rem;
    right: 1rem;
    background: none;
    border: none;
    color: rgba(255,255,255,0.5);
    font-size: 2rem;
    cursor: pointer;
    line-height: 1;
    transition: color 0.2s;
  }
  .close-btn:hover { color: #fff; }
  h2 {
    font-family: 'Oswald', sans-serif;
    color: #ffd700;
    font-size: 1.6rem;
    margin: 0 0 1.2rem;
    text-align: center;
    letter-spacing: 2px;
    flex-shrink: 0;
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    padding: 0.9rem 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .setting-row.col {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  .setting-label {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }
  .setting-name {
    font-family: 'Oswald', sans-serif;
    color: rgba(255,255,255,0.9);
    font-size: 1rem;
    font-weight: 600;
  }
  .setting-desc {
    font-family: 'Inter', sans-serif;
    color: rgba(255,255,255,0.35);
    font-size: 0.72rem;
  }

  /* Toggle switch */
  .toggle {
    width: 48px;
    height: 26px;
    border-radius: 13px;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.2);
    cursor: pointer;
    position: relative;
    transition: all 0.25s;
    flex-shrink: 0;
    padding: 0;
  }
  .toggle.active {
    background: rgba(255,215,0,0.3);
    border-color: rgba(255,215,0,0.5);
  }
  .toggle-knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(255,255,255,0.6);
    transition: all 0.25s;
  }
  .toggle.active .toggle-knob {
    left: 24px;
    background: #ffd700;
  }

  /* Chip buttons (timer, difficulty, vowel cost) */
  .chip-row {
    display: flex;
    gap: 0.3rem;
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .chip {
    padding: 0.35rem 0.7rem;
    border-radius: 6px;
    border: 1px solid rgba(255,215,0,0.2);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.45);
    font-family: 'Oswald', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .chip.active {
    background: rgba(255,215,0,0.18);
    color: #ffd700;
    border-color: rgba(255,215,0,0.6);
  }
  .chip:hover:not(.active) {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.7);
  }

  /* Category grid */
  .cat-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .cat-chip {
    padding: 0.3rem 0.6rem;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.4);
    font-family: 'Inter', sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .cat-chip.active {
    background: rgba(255,215,0,0.12);
    color: #ffd700;
    border-color: rgba(255,215,0,0.4);
  }
  .cat-chip:hover:not(.active) {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.6);
  }
  .all-chip {
    font-weight: 600;
  }

  .reset-btn {
    display: block;
    margin: 1.2rem auto 0;
    background: none;
    border: none;
    color: rgba(255,255,255,0.3);
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    cursor: pointer;
    text-decoration: underline;
    transition: color 0.2s;
    flex-shrink: 0;
  }
  .reset-btn:hover {
    color: rgba(255,255,255,0.6);
  }

  @media (max-width: 480px) {
    .modal { padding: 1.5rem; }
    h2 { font-size: 1.3rem; }
  }
</style>
