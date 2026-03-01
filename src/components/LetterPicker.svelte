<script>
  import { isVowel } from '../lib/utils/italian.js';

  let { mode = 'consonant', usedLetters = new Set(), onPick = () => {} } = $props();

  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  function isEnabled(letter) {
    if (usedLetters.has(letter)) return false;
    if (mode === 'consonant') return !isVowel(letter);
    if (mode === 'vowel') return isVowel(letter);
    return false;
  }
</script>

<div class="picker">
  <p class="hint">
    {mode === 'consonant' ? 'Scegli una consonante' : 'Scegli una vocale'}
  </p>
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
    color: #ffd700;
    font-family: 'Oswald', sans-serif;
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }
  .keys {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 5px;
    max-width: 520px;
    margin: 0 auto;
  }
  .key {
    width: 38px;
    height: 42px;
    border: 2px solid rgba(255,215,0,0.4);
    border-radius: 6px;
    background: rgba(255,255,255,0.1);
    color: #fff;
    font-family: 'Oswald', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .key:hover:not(:disabled) {
    background: rgba(255,215,0,0.3);
    transform: scale(1.1);
  }
  .key.vowel {
    border-color: rgba(255,100,100,0.5);
  }
  .key:disabled {
    opacity: 0.25;
    cursor: not-allowed;
    transform: none;
  }
  .key.used {
    background: rgba(100,100,100,0.3);
    text-decoration: line-through;
  }

  @media (max-width: 480px) {
    .keys {
      gap: 4px;
    }
    .key {
      width: 36px;
      height: 44px;
      font-size: 1.05rem;
      min-height: 44px;
    }
  }
</style>
