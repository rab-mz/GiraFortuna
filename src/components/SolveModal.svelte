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
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(4px);
    padding: 1rem;
  }
  .modal {
    background: linear-gradient(135deg, #1a237e, #283593);
    border: 2px solid #ffd700;
    border-radius: 16px;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 8px 30px rgba(0,0,0,0.5);
  }
  h2 {
    color: #ffd700;
    font-family: 'Oswald', sans-serif;
    text-align: center;
    margin: 0 0 1rem;
    font-size: 1.5rem;
  }

  /* Phrase preview */
  .phrase-preview {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 3px;
    padding: 1rem 0.5rem;
    background: rgba(0,0,0,0.3);
    border-radius: 10px;
    border: 1px solid rgba(255,215,0,0.15);
    margin-bottom: 1.2rem;
  }
  .word {
    display: flex;
    gap: 2px;
  }
  .word-space {
    width: 10px;
  }
  .tile {
    width: 26px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    font-family: 'Oswald', sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    background: #0d47a1;
    border: 1px solid rgba(255,215,0,0.2);
    color: transparent;
  }
  .tile.revealed {
    background: #e3f2fd;
    color: #1a237e;
    border-color: rgba(255,215,0,0.4);
  }
  .tile.symbol {
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.4);
    font-size: 0.8rem;
  }

  input {
    width: 100%;
    padding: 0.8rem;
    border: 2px solid rgba(255,215,0,0.4);
    border-radius: 8px;
    background: rgba(255,255,255,0.1);
    color: #fff;
    font-family: 'Inter', sans-serif;
    font-size: 1.1rem;
    box-sizing: border-box;
  }
  input::placeholder {
    color: rgba(255,255,255,0.4);
  }
  input:focus {
    outline: none;
    border-color: #ffd700;
  }
  .actions {
    display: flex;
    gap: 0.8rem;
    margin-top: 1rem;
    justify-content: center;
  }
  .btn-confirm, .btn-cancel {
    padding: 0.6rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-family: 'Oswald', sans-serif;
    font-size: 1rem;
    cursor: pointer;
    font-weight: 600;
  }
  .btn-confirm {
    background: #ffd700;
    color: #1a237e;
  }
  .btn-cancel {
    background: rgba(255,255,255,0.15);
    color: #fff;
  }

  @media (max-width: 480px) {
    .modal {
      padding: 1.5rem;
    }
    .tile {
      width: 22px;
      height: 26px;
      font-size: 0.75rem;
    }
  }
</style>
