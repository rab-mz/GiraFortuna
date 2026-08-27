<script>
  import { normalizeChar, isLetter } from '../lib/utils/italian.js';

  let {
    open = false,
    phrase = '',
    revealedLetters = new Set(),
    jollyRevealedPositions = new Set(),
    onSubmit = () => {},
    onCancel = () => {},
  } = $props();

  let guess = $state('');

  let words = $derived(phrase.split(' '));

  function getAbsoluteIndex(wordIndex, charIndex) {
    let abs = 0;
    for (let w = 0; w < wordIndex; w++) {
      abs += words[w].length + 1;
    }
    return abs + charIndex;
  }

  function isRevealed(char, absIndex) {
    if (!isLetter(char)) return true;
    if (revealedLetters.has(normalizeChar(char))) return true;
    if (jollyRevealedPositions.has(absIndex)) return true;
    return false;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (guess.trim()) {
      onSubmit(guess.trim());
      guess = '';
    }
  }

  function handleCancel() {
    guess = '';
    onCancel();
  }
</script>

{#if open}
  <div class="overlay" role="button" tabindex="-1" onclick={handleCancel} onkeydown={(e) => e.key === 'Escape' && handleCancel()}>
    <div class="modal" role="dialog" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
      <h2>Risolvi la frase!</h2>

      <div class="phrase-preview">
        {#each words as word, wi}
          <div class="word">
            {#each word.split('') as char, ci}
              {@const absIdx = getAbsoluteIndex(wi, ci)}
              {#if isLetter(char)}
                <span class="tile" class:revealed={isRevealed(char, absIdx)}>
                  {isRevealed(char, absIdx) ? char.toUpperCase() : ''}
                </span>
              {:else}
                <span class="tile symbol">{char}</span>
              {/if}
            {/each}
          </div>
          {#if wi < words.length - 1}
            <div class="word-space"></div>
          {/if}
        {/each}
      </div>

      <form onsubmit={handleSubmit}>
        <!-- svelte-ignore a11y_autofocus -->
        <input
          type="text"
          bind:value={guess}
          placeholder="Scrivi la frase completa..."
          autofocus
        />
        <div class="actions">
          <button type="submit" class="btn-confirm">Conferma</button>
          <button type="button" class="btn-cancel" onclick={handleCancel}>Annulla</button>
        </div>
      </form>
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
    z-index: 100;
    backdrop-filter: blur(6px);
    padding: 1rem;
  }
  .modal {
    background: var(--indigo);
    border: 1px solid var(--glass-border-strong);
    border-radius: var(--radius-lg);
    padding: 2rem;
    max-width: 520px;
    width: 90%;
    box-shadow: 0 8px 30px rgba(0,0,0,0.5);
  }
  h2 {
    color: var(--text);
    font-family: var(--font-display);
    font-weight: 700;
    text-align: center;
    margin: 0 0 1.2rem;
    font-size: 1.25rem;
  }

  /* Phrase preview */
  .phrase-preview {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 4px;
    padding: 1rem 0.6rem;
    background: var(--glass);
    border-radius: 14px;
    border: 1px solid var(--glass-border);
    margin-bottom: 1.2rem;
  }
  .word {
    display: flex;
    gap: 3px;
  }
  .word-space {
    width: 10px;
  }
  .tile {
    width: 26px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    font-family: var(--font-display);
    font-size: 0.8rem;
    font-weight: 700;
    background: var(--tile-bg);
    border: 1px solid var(--tile-border);
    color: transparent;
  }
  .tile.revealed {
    background: var(--tile-revealed);
    color: var(--tile-letter);
    border-color: transparent;
  }
  .tile.symbol {
    background: transparent;
    border: none;
    color: var(--text-faint);
    font-size: 0.8rem;
  }

  input {
    width: 100%;
    padding: 0.85rem 1rem;
    border: 1px solid rgba(245,182,63,0.4);
    border-radius: 12px;
    background: rgba(244,242,255,0.05);
    color: var(--text);
    font-family: var(--font-ui);
    font-size: 1.05rem;
    box-sizing: border-box;
  }
  input::placeholder {
    color: rgba(244,242,255,0.35);
  }
  input:focus {
    outline: none;
    border-color: var(--amber);
  }
  .actions {
    display: flex;
    gap: 0.8rem;
    margin-top: 1rem;
    justify-content: center;
  }
  .btn-confirm, .btn-cancel {
    padding: 0.7rem 1.6rem;
    border: none;
    border-radius: 14px;
    font-size: 0.95rem;
    cursor: pointer;
    font-weight: 700;
    transition: all 0.2s;
  }
  .btn-confirm {
    background: var(--amber);
    color: var(--ink);
    font-family: var(--font-display);
    letter-spacing: 0.5px;
  }
  .btn-confirm:hover {
    background: var(--amber-bright);
  }
  .btn-cancel {
    background: var(--glass-strong);
    border: 1px solid var(--glass-border-strong);
    color: rgba(244,242,255,0.8);
    font-family: var(--font-ui);
  }
  .btn-cancel:hover {
    background: rgba(244,242,255,0.1);
  }

  @media (max-width: 480px) {
    .modal {
      padding: 1.5rem;
    }
    .tile {
      width: 22px;
      height: 27px;
      font-size: 0.7rem;
    }
  }
</style>
