<script>
  import { fly, scale } from 'svelte/transition';

  let {
    open = false,
    stats = { gamesPlayed: 0, gamesWon: 0, currentStreak: 0, maxStreak: 0, bestScore: 0 },
    streak = 0,
    onClose = () => {},
  } = $props();

  let winRate = $derived(
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0
  );
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="overlay" transition:fly={{ y: 30, duration: 300 }} onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div class="modal" transition:scale={{ duration: 300, delay: 100 }}>
      <h2>Le Tue Statistiche</h2>

      <div class="stats-row">
        <div class="stat-box">
          <span class="stat-num">{stats.gamesPlayed}</span>
          <span class="stat-label">Partite</span>
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
        <span class="best-label">Miglior Punteggio</span>
        <span class="best-value">{stats.bestScore.toLocaleString('it-IT')}€</span>
      </div>

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
    max-width: 380px;
    width: 100%;
    padding: 2rem 1.5rem;
    background: linear-gradient(135deg, rgba(26,35,126,0.95), rgba(13,27,74,0.98));
    border: 2px solid rgba(255,215,0,0.25);
    border-radius: 16px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.4);
  }
  h2 {
    font-family: 'Oswald', sans-serif;
    font-size: 1.6rem;
    color: #ffd700;
    margin: 0 0 1.5rem;
    letter-spacing: 2px;
    text-shadow: 0 0 15px rgba(255,215,0,0.3);
  }
  .stats-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
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
  }
</style>
