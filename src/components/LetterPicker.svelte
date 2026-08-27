<script>
  import { isVowel } from '../lib/utils/italian.js';

  let { mode = 'consonant', usedLetters = new Set(), onPick = () => {}, showHint = true } = $props();

  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  function isEnabled(letter) {
    if (usedLetters.has(letter)) return false;
    if (mode === 'consonant') return !isVowel(letter);
    if (mode === 'vowel') return isVowel(letter);
    return false;
  }
</script>

<div class="picker">
  {#if showHint}
    <p class="hint">
      {mode === 'consonant' ? 'Scegli una consonante' : 'Scegli una vocale'}
    </p>
  {/if}
  <div class="keys">
    {#each LETTERS as letter}
      <button
        class="key"
        class:vowel={isVowel(letter)}
        class:used={usedLetters.has(letter)}
        disabled={!isEnabled(letter)}
        onclick={() => onPick(letter)}
      >
        {letter}
      </button>
    {/each}
  </div>
</div>

<style>
  .picker {
    text-align: center;
  }
  .hint {
    color: var(--amber);
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 1.05rem;
    margin-bottom: 0.7rem;
  }
  .keys {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    max-width: 520px;
    margin: 0 auto;
  }
  .key {
    width: 40px;
    height: 46px;
    border: 1px solid var(--glass-border-strong);
    border-radius: 10px;
    background: var(--glass-strong);
    color: var(--text);
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }
  .key:hover:not(:disabled) {
    background: rgba(245,182,63,0.15);
    border-color: rgba(245,182,63,0.6);
    color: var(--amber);
    transform: scale(1.08);
  }
  .key.vowel {
    border-color: rgba(124,108,255,0.45);
  }
  .key.vowel:hover:not(:disabled) {
    background: rgba(124,108,255,0.15);
    border-color: rgba(124,108,255,0.7);
    color: #A99DFF;
  }
  .key:disabled {
    opacity: 0.22;
    cursor: not-allowed;
    transform: none;
  }
  .key.used {
    background: transparent;
    text-decoration: line-through;
  }

  @media (max-width: 480px) {
    .keys {
      gap: 4px;
    }
    .key {
      width: 44px;
      height: 44px;
      font-size: 0.95rem;
      min-height: 44px;
      min-width: 44px;
    }
  }
</style>
