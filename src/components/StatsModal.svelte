<script>
  import { fly, scale } from 'svelte/transition';

  let {
    open = false,
    stats = { gamesPlayed: 0, gamesWon: 0, currentStreak: 0, maxStreak: 0, bestScore: 0 },
    streak = 0,
    generalStats = null,
    matchHistory = [],
    onClose = () => {},
  } = $props();

  let activeTab = $state('daily');

  // Reset tab when modal opens
  $effect(() => {
    if (open) activeTab = 'daily';
  });

  let winRate = $derived(
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0
  );

  const MODE_LABELS = { single: 'Singolo', multi: 'Locale', online: 'Online', daily: 'Daily' };
  const MODES = ['single', 'multi', 'online', 'daily'];

  function modeWinRate(mode) {
    const s = generalStats?.[mode];
    if (!s || s.played === 0) return 0;
    return Math.round((s.won / s.played) * 100);
  }

  function totalWinRate() {
    const s = generalStats?.total;
    if (!s || s.played === 0) return 0;
    return Math.round((s.won / s.played) * 100);
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="overlay" transition:fly={{ y: 30, duration: 300 }} onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div class="modal" transition:scale={{ duration: 300, delay: 100 }}>
      <h2>Statistiche</h2>

      <div class="tab-bar">
        <button class="tab" class:active={activeTab === 'daily'} onclick={() => activeTab = 'daily'}>Daily</button>
        <button class="tab" class:active={activeTab === 'generale'} onclick={() => activeTab = 'generale'}>Generale</button>
      </div>

      {#if activeTab === 'daily'}
        <p class="stats-subtitle">Sfida quotidiana</p>

        <div class="stats-row">
          <div class="stat-box">
            <span class="stat-num">{stats.gamesPlayed}</span>
            <span class="stat-label">Giocate</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">{winRate}%</span>
            <span class="stat-label">Vittorie</span>
          </div>
          <div class="stat-box">
            <span class="stat-num highlight">{streak}</span>
            <span class="stat-label">Streak</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">{stats.maxStreak}</span>
            <span class="stat-label">Max Streak</span>
          </div>
        </div>

        <div class="best-score">
          <span class="best-label">Miglior Punteggio Daily</span>
          <span class="best-value">{stats.bestScore.toLocaleString('it-IT')}&#8364;</span>
        </div>

      {:else}
        <p class="stats-subtitle">Tutte le modalit&agrave;</p>

        {#if generalStats}
          <div class="stats-row">
            <div class="stat-box">
              <span class="stat-num">{generalStats.total.played}</span>
              <span class="stat-label">Giocate</span>
            </div>
            <div class="stat-box">
              <span class="stat-num">{totalWinRate()}%</span>
              <span class="stat-label">Vittorie</span>
            </div>
            <div class="stat-box">
              <span class="stat-num">{generalStats.total.won}</span>
              <span class="stat-label">Vinte</span>
            </div>
            <div class="stat-box">
              <span class="stat-num highlight">{generalStats.total.bestScore.toLocaleString('it-IT')}&#8364;</span>
              <span class="stat-label">Miglior</span>
            </div>
          </div>

          <div class="mode-breakdown">
            <div class="mode-header">
              <span class="mode-col name">Modalit&agrave;</span>
              <span class="mode-col">Giocate</span>
              <span class="mode-col">Vinte%</span>
              <span class="mode-col">Miglior</span>
            </div>
            {#each MODES as mode}
              {@const s = generalStats[mode]}
              {#if s && s.played > 0}
                <div class="mode-row">
                  <span class="mode-col name">{MODE_LABELS[mode]}</span>
                  <span class="mode-col">{s.played}</span>
                  <span class="mode-col">{modeWinRate(mode)}%</span>
                  <span class="mode-col">{s.bestScore.toLocaleString('it-IT')}&#8364;</span>
                </div>
              {/if}
            {/each}
          </div>

          {#if matchHistory.length > 0}
            <div class="history-section">
              <h3 class="history-title">Storico Partite</h3>
              <div class="history-list">
                {#each matchHistory as entry}
                  <div class="history-row">
                    <span class="h-date">{formatDate(entry.date)}</span>
                    <span class="h-mode">{MODE_LABELS[entry.mode] || entry.mode}</span>
                    <span class="h-cat">{entry.category}</span>
                    <span class="h-score">{entry.score.toLocaleString('it-IT')}&#8364;</span>
                    <span class="h-result" class:won={entry.won}>{entry.won ? '\u2713' : '\u2717'}</span>
                  </div>
                {/each}
              </div>
            </div>
          {:else}
            <p class="empty-history">Nessuna partita registrata</p>
          {/if}
        {:else}
          <p class="empty-history">Nessuna statistica disponibile</p>
        {/if}
      {/if}

      <button class="btn-close" onclick={onClose}>Chiudi</button>
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
    text-align: center;
    max-width: 420px;
    width: 100%;
    padding: 2rem 1.5rem;
    background: linear-gradient(135deg, rgba(26,35,126,0.95), rgba(13,27,74,0.98));
    border: 2px solid rgba(255,215,0,0.25);
    border-radius: 16px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.4);
    max-height: 90vh;
    overflow-y: auto;
  }
  h2 {
    font-family: 'Oswald', sans-serif;
    font-size: 1.6rem;
    color: #ffd700;
    margin: 0 0 0.8rem;
    letter-spacing: 2px;
    text-shadow: 0 0 15px rgba(255,215,0,0.3);
  }

  /* Tab bar */
  .tab-bar {
    display: flex;
    gap: 0.4rem;
    justify-content: center;
    margin-bottom: 1rem;
  }
  .tab {
    padding: 0.5rem 1.5rem;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px;
    color: rgba(255,255,255,0.5);
    font-family: 'Oswald', sans-serif;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 1px;
  }
  .tab:hover {
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.7);
  }
  .tab.active {
    background: rgba(255,215,0,0.15);
    border-color: rgba(255,215,0,0.4);
    color: #ffd700;
  }

  .stats-subtitle {
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.4);
    margin: 0 0 1.2rem;
  }
  .stats-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.2rem;
  }
  .stat-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding: 0.8rem 0.3rem;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
  }
  .stat-num {
    font-family: 'Oswald', sans-serif;
    font-size: 1.8rem;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
  }
  .stat-num.highlight {
    color: #ff6d00;
  }
  .stat-label {
    font-family: 'Inter', sans-serif;
    font-size: 0.7rem;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .best-score {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    padding: 0.8rem;
    background: rgba(255,215,0,0.06);
    border: 1px solid rgba(255,215,0,0.2);
    border-radius: 10px;
    margin-bottom: 1.5rem;
  }
  .best-label {
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.5);
  }
  .best-value {
    font-family: 'Oswald', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffd700;
  }

  /* Mode breakdown */
  .mode-breakdown {
    margin-bottom: 1.2rem;
    text-align: left;
  }
  .mode-header {
    display: flex;
    padding: 0.4rem 0.6rem;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    margin-bottom: 0.3rem;
  }
  .mode-header .mode-col {
    font-family: 'Inter', sans-serif;
    font-size: 0.65rem;
    color: rgba(255,255,255,0.35);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .mode-row {
    display: flex;
    padding: 0.5rem 0.6rem;
    background: rgba(255,255,255,0.03);
    border-radius: 6px;
    margin-bottom: 0.2rem;
  }
  .mode-row:hover {
    background: rgba(255,255,255,0.06);
  }
  .mode-col {
    flex: 1;
    font-family: 'Oswald', sans-serif;
    font-size: 0.9rem;
    color: rgba(255,255,255,0.7);
    text-align: center;
  }
  .mode-col.name {
    text-align: left;
    flex: 1.2;
    color: rgba(255,255,255,0.85);
  }

  /* History */
  .history-section {
    margin-bottom: 1.2rem;
  }
  .history-title {
    font-family: 'Oswald', sans-serif;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin: 0 0 0.5rem;
  }
  .history-list {
    max-height: 180px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,215,0,0.3) transparent;
  }
  .history-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.5rem;
    background: rgba(255,255,255,0.03);
    border-radius: 6px;
    margin-bottom: 0.2rem;
    font-family: 'Inter', sans-serif;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.6);
  }
  .h-date {
    flex-shrink: 0;
    width: 2.5rem;
    color: rgba(255,255,255,0.4);
  }
  .h-mode {
    flex-shrink: 0;
    width: 3.5rem;
    padding: 0.15rem 0.3rem;
    background: rgba(255,215,0,0.1);
    border-radius: 4px;
    text-align: center;
    font-size: 0.65rem;
    color: #ffd700;
    font-weight: 600;
  }
  .h-cat {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .h-score {
    flex-shrink: 0;
    font-family: 'Oswald', sans-serif;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.8);
  }
  .h-result {
    flex-shrink: 0;
    width: 1.2rem;
    text-align: center;
    font-size: 0.9rem;
    color: #ef5350;
  }
  .h-result.won {
    color: #4CAF50;
  }
  .empty-history {
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.3);
    margin: 1rem 0;
  }

  .btn-close {
    padding: 0.7rem 2.5rem;
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.8);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 10px;
    font-family: 'Oswald', sans-serif;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-close:hover {
    background: rgba(255,255,255,0.15);
    color: #fff;
  }

  @media (max-width: 480px) {
    .stat-num { font-size: 1.4rem; }
    .modal { padding: 1.5rem 1rem; }
    .history-list { max-height: 150px; }
  }
</style>
