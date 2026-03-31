<script>
  import { fly, scale } from 'svelte/transition';
  import { isLetter, normalizeChar } from '../lib/utils/italian.js';

  let {
    result = null,
    streak = 0,
    shareText = '',
    isModal = false,
    onClose = () => {},
  } = $props();

  let shared = $state(false);

  // Build phrase tiles: each char becomes {char, revealed, isLetter, isSpace}
  let phraseTiles = $derived.by(() => {
    if (!result?.phraseText) return [];
    const revealed = new Set(result.revealedLetters || []);
    const jolly = new Set(result.jollyPositions || []);
    const tiles = [];
    let pos = 0;
    for (const ch of result.phraseText) {
      if (ch === ' ') {
        tiles.push({ type: 'space' });
      } else if (isLetter(ch)) {
        const norm = normalizeChar(ch);
        tiles.push({
          type: 'letter',
          char: ch.toUpperCase(),
          revealed: revealed.has(norm) || jolly.has(pos),
        });
      } else {
        tiles.push({ type: 'punct', char: ch });
      }
      pos++;
    }
    return tiles;
  });

  // Group tiles into words for wrapping
  let words = $derived.by(() => {
    const groups = [];
    let current = [];
    for (const tile of phraseTiles) {
      if (tile.type === 'space') {
        if (current.length) groups.push(current);
        current = [];
      } else {
        current.push(tile);
      }
    }
    if (current.length) groups.push(current);
    return groups;
  });

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {}
    shared = true;
    setTimeout(() => { shared = false; }, 2500);
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

  <!-- Phrase preview grid -->
  <div class="phrase-preview">
    {#each words as word, wi}
      <div class="preview-word">
        {#each word as tile}
          {#if tile.type === 'letter'}
            <div class="mini-tile" class:revealed={tile.revealed} class:hidden={!tile.revealed}>
              {#if tile.revealed}
                <span>{tile.char}</span>
              {/if}
            </div>
          {:else}
            <span class="mini-punct">{tile.char}</span>
          {/if}
        {/each}
      </div>
      {#if wi < words.length - 1}
        <div class="preview-space"></div>
      {/if}
    {/each}
  </div>

  <div class="stats-row">
    <div class="stat-box">
      <span class="stat-icon">📂</span>
      <span class="stat-value">{result.category}</span>
    </div>
    <div class="stat-box">
      <span class="stat-icon">💰</span>
      <span class="stat-value score">{result.score.toLocaleString('it-IT')}€</span>
    </div>
    <div class="stat-box">
      <span class="stat-icon">🔤</span>
      <span class="stat-value">{result.revealedCount}/{result.totalCount} lettere</span>
    </div>
    <div class="stat-box">
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
    max-width: 380px;
    width: 100%;
    padding: 1.5rem 1.2rem;
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
    margin-bottom: 1rem;
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

  /* Phrase preview grid */
  .phrase-preview {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 3px;
    padding: 0.8rem 0.5rem;
    background: rgba(0,0,0,0.25);
    border-radius: 10px;
    border: 1px solid rgba(255,215,0,0.15);
    margin-bottom: 1rem;
  }
  .preview-word {
    display: flex;
    gap: 2px;
  }
  .preview-space {
    width: 8px;
  }
  .mini-tile {
    width: 20px;
    height: 24px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Oswald', sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    transition: all 0.2s;
  }
  .mini-tile.revealed {
    background: rgba(227,242,253,0.9);
    color: #1a237e;
    border: 1px solid rgba(255,215,0,0.5);
    box-shadow: 0 0 4px rgba(255,215,0,0.2);
  }
  .mini-tile.hidden {
    background: rgba(13,71,161,0.6);
    border: 1px solid rgba(255,255,255,0.15);
  }
  .mini-punct {
    color: rgba(255,255,255,0.5);
    font-size: 0.6rem;
    display: flex;
    align-items: center;
  }

  /* Stats */
  .stats-row {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-bottom: 1.2rem;
  }
  .stat-box {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.4rem 0.7rem;
    background: rgba(255,255,255,0.04);
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.06);
  }
  .stat-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
  }
  .stat-value {
    font-family: 'Oswald', sans-serif;
    font-size: 1rem;
    color: rgba(255,255,255,0.85);
  }
  .stat-value.score {
    color: #ffd700;
    font-size: 1.2rem;
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

  @media (max-width: 380px) {
    .mini-tile {
      width: 16px;
      height: 20px;
      font-size: 0.55rem;
    }
    .preview-space { width: 6px; }
    .phrase-preview { gap: 2px; }
    .preview-word { gap: 1px; }
  }
</style>
