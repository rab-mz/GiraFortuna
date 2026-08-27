<script>
  import Icon from './Icon.svelte';
  import { fly, scale } from 'svelte/transition';
  import { isLetter, normalizeChar } from '../lib/utils/italian.js';
  import { shareOrCopy } from '../lib/utils/share.js';

  let {
    result = null,
    streak = 0,
    shareText = '',
    isModal = false,
    onClose = () => {},
  } = $props();

  let shareFeedback = $state('');
  let canShare = $derived(typeof navigator !== 'undefined' && !!navigator.share);
  let isWin = $derived(result?.won !== false);

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
    const result = await shareOrCopy(shareText);
    if (result === 'cancelled') return;
    shareFeedback = result === 'shared' ? 'Condiviso!' : 'Copiato!';
    setTimeout(() => { shareFeedback = ''; }, 2500);
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
    <span class="daily-label" class:loss={!isWin}>FRASE DEL GIORNO</span>
    <span class="daily-number" class:loss={!isWin}>#{result.dailyNumber}</span>
  </div>

  {#if !isWin}
    <div class="loss-banner">Non hai indovinato!</div>
  {/if}

  <!-- Phrase preview grid -->
  <div class="phrase-preview" class:loss={!isWin}>
    {#each words as word, wi}
      <div class="preview-word">
        {#each word as tile}
          {#if tile.type === 'letter'}
            {#if isWin}
              <div class="mini-tile" class:revealed={tile.revealed} class:hidden={!tile.revealed}>
                {#if tile.revealed}
                  <span>{tile.char}</span>
                {/if}
              </div>
            {:else}
              <div class="mini-tile" class:revealed-loss={tile.revealed} class:hidden-loss={!tile.revealed}>
                <span>{tile.char}</span>
              </div>
            {/if}
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

  {#if isWin}
    <div class="stats-row">
      <div class="stat-box">
        <span class="stat-icon"><Icon name="category" size={16} /></span>
        <span class="stat-value">{result.category}</span>
      </div>
      <div class="stat-box">
        <span class="stat-icon"><Icon name="money" size={16} /></span>
        <span class="stat-value score">{result.score.toLocaleString('it-IT')}€</span>
      </div>
      <div class="stat-box">
        <span class="stat-icon"><Icon name="letters" size={16} /></span>
        <span class="stat-value">{result.revealedCount}/{result.totalCount} lettere</span>
      </div>
      <div class="stat-box">
        <span class="stat-icon icon-streak"><Icon name="streak" size={16} /></span>
        <span class="stat-value streak">{streak} {streak === 1 ? 'giorno' : 'giorni'}</span>
      </div>
    </div>
  {:else}
    <div class="stats-row">
      <div class="stat-box">
        <span class="stat-icon"><Icon name="category" size={16} /></span>
        <span class="stat-value">{result.category}</span>
      </div>
      <div class="stat-box">
        <span class="stat-icon"><Icon name="letters" size={16} /></span>
        <span class="stat-value">{result.revealedCount}/{result.totalCount} lettere scoperte</span>
      </div>
    </div>
  {/if}

  <button class="btn-share" class:loss={!isWin} onclick={handleShare}>
    {#if shareFeedback}
      {shareFeedback}
    {:else}
      {canShare ? 'CONDIVIDI' : 'COPIA'}
    {/if}
  </button>

  <p class="daily-footer">Torna domani per una nuova frase!</p>
{/snippet}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(4, 6, 18, 0.75);
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
    background: var(--indigo);
    border: 1px solid var(--glass-border-strong);
    border-radius: var(--radius-lg);
    box-shadow: 0 8px 40px rgba(0,0,0,0.4);
  }
  .card-inline {
    margin: 1rem auto;
  }
  .daily-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    margin-bottom: 1rem;
  }
  .daily-label {
    font-family: var(--font-display);
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--amber);
    letter-spacing: 1.5px;
  }
  .daily-label.loss {
    color: var(--coral);
  }
  .daily-number {
    font-family: var(--font-ui);
    font-size: 0.85rem;
    font-weight: 600;
    color: rgba(245,182,63,0.75);
  }
  .daily-number.loss {
    color: rgba(255,93,115,0.7);
    background: rgba(255,93,115,0.08);
    border-color: rgba(255,93,115,0.25);
  }
  .loss-banner {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    color: var(--coral);
    letter-spacing: 0.5px;
    margin-bottom: 0.8rem;
  }

  /* Phrase preview grid */
  .phrase-preview {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 3px;
    padding: 0.8rem 0.5rem;
    background: var(--glass);
    border-radius: 12px;
    border: 1px solid var(--glass-border);
    margin-bottom: 1rem;
  }
  .phrase-preview.loss {
    border-color: rgba(255,93,115,0.25);
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
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: 0.58rem;
    font-weight: 700;
    transition: all 0.2s;
  }
  .mini-tile.revealed {
    background: var(--tile-revealed);
    color: var(--tile-letter);
  }
  .mini-tile.hidden {
    background: rgba(244,242,255,0.06);
    border: 1px solid rgba(244,242,255,0.12);
  }
  .mini-tile.revealed-loss {
    background: rgba(255,93,115,0.15);
    color: rgba(244,242,255,0.75);
    border: 1px solid rgba(255,93,115,0.35);
  }
  .mini-tile.hidden-loss {
    background: rgba(255,93,115,0.05);
    color: rgba(244,242,255,0.4);
    border: 1px solid rgba(255,93,115,0.2);
  }
  .mini-punct {
    color: var(--text-dim);
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
    padding: 0.45rem 0.7rem;
    background: var(--glass);
    border-radius: 10px;
    border: 1px solid var(--glass-border);
  }
  .stat-icon {
    display: flex;
    flex-shrink: 0;
    color: var(--text-faint);
  }
  .stat-icon.icon-streak {
    color: var(--amber);
  }
  .stat-value {
    font-family: var(--font-ui);
    font-weight: 600;
    font-size: 0.92rem;
    color: rgba(244,242,255,0.85);
  }
  .stat-value.score {
    font-family: var(--font-display);
    color: var(--amber);
    font-size: 1.05rem;
    font-weight: 700;
  }
  .stat-value.streak {
    color: var(--amber);
    font-weight: 700;
  }
  .btn-share {
    display: block;
    width: 100%;
    padding: 0.85rem;
    background: var(--amber);
    color: var(--ink);
    border: none;
    border-radius: 14px;
    font-family: var(--font-display);
    font-size: 0.98rem;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 1.5px;
    transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(245,182,63,0.3);
    margin-bottom: 1rem;
  }
  .btn-share.loss {
    background: rgba(255,93,115,0.15);
    color: var(--coral);
    border: 1px solid rgba(255,93,115,0.4);
    box-shadow: none;
  }
  .btn-share:hover {
    transform: translateY(-1px);
    background: var(--amber-bright);
  }
  .btn-share.loss:hover {
    background: rgba(255,93,115,0.25);
  }
  .btn-share:active {
    transform: scale(0.98);
  }
  .btn-close {
    background: none;
    border: none;
    color: var(--text-faint);
    font-family: var(--font-ui);
    font-size: 0.85rem;
    cursor: pointer;
    text-decoration: underline;
    margin-top: 0.5rem;
    transition: color 0.2s;
  }
  .btn-close:hover {
    color: var(--text-dim);
  }
  .daily-footer {
    font-family: var(--font-ui);
    font-size: 0.8rem;
    color: var(--text-faint);
    margin: 0;
  }

  @media (max-width: 380px) {
    .mini-tile {
      width: 16px;
      height: 20px;
      font-size: 0.5rem;
    }
    .preview-space { width: 6px; }
    .phrase-preview { gap: 2px; }
    .preview-word { gap: 1px; }
  }
</style>
