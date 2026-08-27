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
    background: rgba(4, 6, 18, 0.7);
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
    background: var(--indigo);
    border: 1px solid var(--glass-border-strong);
    border-radius: var(--radius-lg);
    box-shadow: 0 8px 40px rgba(0,0,0,0.4);
    max-height: 90vh;
    overflow-y: auto;
  }
  h2 {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 0.8rem;
    letter-spacing: 1px;
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
    background: transparent;
    border: 1.5px solid var(--glass-border-strong);
    border-radius: 12px;
    color: rgba(244,242,255,0.6);
    font-family: var(--font-ui);
    font-weight: 600;
    font-size: 0.88rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .tab:hover {
    background: var(--glass-strong);
    color: rgba(244,242,255,0.8);
  }
  .tab.active {
    background: rgba(245,182,63,0.08);
    border-color: rgba(245,182,63,0.6);
    color: var(--amber);
    font-weight: 700;
  }

  .stats-subtitle {
    font-family: var(--font-ui);
    font-size: 0.8rem;
    color: var(--text-faint);
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
    background: var(--glass);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
  }
  .stat-num {
    font-family: var(--font-display);
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--text);
  }
  .stat-num.highlight {
    color: var(--amber);
  }
  .stat-label {
    font-family: var(--font-ui);
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--text-faint);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .best-score {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    padding: 0.8rem;
    background: rgba(245,182,63,0.06);
    border: 1px solid rgba(245,182,63,0.25);
    border-radius: 12px;
    margin-bottom: 1.5rem;
  }
  .best-label {
    font-family: var(--font-ui);
    font-size: 0.85rem;
    color: var(--text-dim);
  }
  .best-value {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--amber);
  }

  /* Mode breakdown */
  .mode-breakdown {
    margin-bottom: 1.2rem;
    text-align: left;
  }
  .mode-header {
    display: flex;
    padding: 0.4rem 0.6rem;
    border-bottom: 1px solid var(--glass-border);
    margin-bottom: 0.3rem;
  }
  .mode-header .mode-col {
    font-family: var(--font-ui);
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--text-faint);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .mode-row {
    display: flex;
    padding: 0.5rem 0.6rem;
    background: var(--glass);
    border-radius: 8px;
    margin-bottom: 0.2rem;
  }
  .mode-row:hover {
    background: var(--glass-strong);
  }
  .mode-col {
    flex: 1;
    font-family: var(--font-ui);
    font-weight: 600;
    font-size: 0.85rem;
    color: rgba(244,242,255,0.7);
    text-align: center;
  }
  .mode-col.name {
    text-align: left;
    flex: 1.2;
    color: rgba(244,242,255,0.9);
  }

  /* History */
  .history-section {
    margin-bottom: 1.2rem;
  }
  .history-title {
    font-family: var(--font-ui);
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-faint);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin: 0 0 0.5rem;
  }
  .history-list {
    max-height: 180px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(245,182,63,0.3) transparent;
  }
  .history-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.5rem;
    background: var(--glass);
    border-radius: 8px;
    margin-bottom: 0.2rem;
    font-family: var(--font-ui);
    font-size: 0.75rem;
    color: rgba(244,242,255,0.6);
  }
  .h-date {
    flex-shrink: 0;
    width: 2.5rem;
    color: var(--text-faint);
  }
  .h-mode {
    flex-shrink: 0;
    width: 3.5rem;
    padding: 0.15rem 0.3rem;
    background: rgba(245,182,63,0.1);
    border-radius: 8px;
    text-align: center;
    font-size: 0.62rem;
    color: var(--amber);
    font-weight: 700;
  }
  .h-cat {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .h-score {
    flex-shrink: 0;
    font-family: var(--font-display);
    font-size: 0.72rem;
    font-weight: 700;
    color: rgba(244,242,255,0.85);
  }
  .h-result {
    flex-shrink: 0;
    width: 1.2rem;
    text-align: center;
    font-size: 0.9rem;
    color: var(--coral);
  }
  .h-result.won {
    color: var(--mint);
  }
  .empty-history {
    font-family: var(--font-ui);
    font-size: 0.8rem;
    color: var(--text-faint);
    margin: 1rem 0;
  }

  .btn-close {
    padding: 0.7rem 2.5rem;
    background: var(--glass-strong);
    color: rgba(244,242,255,0.8);
    border: 1px solid var(--glass-border-strong);
    border-radius: 14px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 0.92rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-close:hover {
    background: rgba(244,242,255,0.1);
    color: var(--text);
  }

  @media (max-width: 480px) {
    .stat-num { font-size: 1.15rem; }
    .modal { padding: 1.5rem 1rem; }
    .history-list { max-height: 150px; }
  }
</style>
