<script>
  import { fly, scale } from 'svelte/transition';

  let {
    result = null,
    streak = 0,
    shareText = '',
    isModal = false,
    onClose = () => {},
  } = $props();

  let shared = $state(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        shared = true;
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareText);
      shared = true;
      setTimeout(() => { shared = false; }, 2500);
    }
  }
</script>

{#if result}
  {#if isModal}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="overlay" transition:fly={{ y: 50, duration: 300 }} onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div class="card" transition:scale={{ duration: 300, delay: 100 }}>
        {@render content()}
        <button class="btn-close" onclick={onClose}>Chiudi</button>
      </div>
    </div>
  {:else}
    <div class="card-inline">
      {@render content()}
    </div>
  {/if}
{/if}

{#snippet content()}
  <div class="daily-header">
    <span class="daily-label">FRASE DEL GIORNO</span>
    <span class="daily-number">#{result.dailyNumber}</span>
  </div>

  <div class="stats-grid">
    <div class="stat">
      <span class="stat-icon">📂</span>
      <span class="stat-value">{result.category}</span>
    </div>
    <div class="stat">
      <span class="stat-icon">💰</span>
      <span class="stat-value score">{result.score.toLocaleString('it-IT')}€</span>
    </div>
    <div class="stat">
      <span class="stat-icon">🔤</span>
      <span class="stat-value">{result.usedLettersCount}/{result.totalLetters} lettere</span>
    </div>
    <div class="stat">
      <span class="stat-icon">🔥</span>
      <span class="stat-value streak">{streak} {streak === 1 ? 'giorno' : 'giorni'}</span>
    </div>
  </div>

  <button class="btn-share" onclick={handleShare}>
    {#if shared}
      Copiato!
    {:else}
      CONDIVIDI
    {/if}
  </button>

  <p class="daily-footer">Torna domani per una nuova frase!</p>
{/snippet}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 350;
    backdrop-filter: blur(8px);
    padding: 1rem;
  }
  .card, .card-inline {
    text-align: center;
    max-width: 360px;
    width: 100%;
    padding: 2rem 1.5rem;
    background: linear-gradient(135deg, rgba(26,35,126,0.95), rgba(13,27,74,0.98));
    border: 2px solid rgba(255,215,0,0.3);
    border-radius: 16px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.4), 0 0 30px rgba(255,215,0,0.1);
  }
  .card-inline {
    margin: 1rem auto;
    border-color: rgba(255,215,0,0.25);
  }
  .daily-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    margin-bottom: 1.5rem;
  }
  .daily-label {
    font-family: 'Oswald', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: #ffd700;
    letter-spacing: 2px;
  }
  .daily-number {
    font-family: 'Oswald', sans-serif;
    font-size: 0.9rem;
    color: rgba(255,215,0,0.6);
    background: rgba(255,215,0,0.1);
    padding: 0.15rem 0.6rem;
    border-radius: 12px;
    border: 1px solid rgba(255,215,0,0.2);
  }
  .stats-grid {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin-bottom: 1.5rem;
  }
  .stat {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.5rem 0.8rem;
    background: rgba(255,255,255,0.04);
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.06);
  }
  .stat-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
  }
  .stat-value {
    font-family: 'Oswald', sans-serif;
    font-size: 1.05rem;
    color: rgba(255,255,255,0.85);
  }
  .stat-value.score {
    color: #ffd700;
    font-size: 1.3rem;
    font-weight: 700;
  }
  .stat-value.streak {
    color: #ff6d00;
    font-weight: 600;
  }
  .btn-share {
    display: block;
    width: 100%;
    padding: 0.85rem;
    background: linear-gradient(135deg, #ffd700, #e6b800);
    color: #1a237e;
    border: none;
    border-radius: 10px;
    font-family: 'Oswald', sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 2px;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 16px rgba(255,215,0,0.3);
    margin-bottom: 1rem;
  }
  .btn-share:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(255,215,0,0.4);
  }
  .btn-share:active {
    transform: scale(0.98);
  }
  .btn-close {
    background: none;
    border: none;
    color: rgba(255,255,255,0.4);
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    cursor: pointer;
    text-decoration: underline;
    margin-top: 0.5rem;
    transition: color 0.2s;
  }
  .btn-close:hover {
    color: rgba(255,255,255,0.7);
  }
  .daily-footer {
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.35);
    margin: 0;
  }
</style>
