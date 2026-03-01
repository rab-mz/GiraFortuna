<script>
  import LetterTile from './LetterTile.svelte';
  import { normalizeChar, isLetter } from '../lib/utils/italian.js';

  let {
    phrase = '',
    revealedLetters = new Set(),
    jollyMode = false,
    jollyRevealedPositions = new Set(),
    onJollyPick = () => {},
  } = $props();

  let words = $derived(phrase.split(' '));

  // Build absolute index mapping
  function getAbsoluteIndex(wordIndex, charIndex) {
    let abs = 0;
    for (let w = 0; w < wordIndex; w++) {
      abs += words[w].length + 1; // +1 for space
    }
    return abs + charIndex;
  }

  function isRevealed(char, absIndex) {
    if (!isLetter(char)) return true;
    if (revealedLetters.has(normalizeChar(char))) return true;
    if (jollyRevealedPositions.has(absIndex)) return true;
    return false;
  }

  function isJollyRevealed(char, absIndex) {
    if (!isLetter(char)) return false;
    if (revealedLetters.has(normalizeChar(char))) return false;
    return jollyRevealedPositions.has(absIndex);
  }

  function isTileClickable(char, absIndex) {
    if (!jollyMode) return false;
    if (!isLetter(char)) return false;
    return !isRevealed(char, absIndex);
  }
</script>

<div class="board">
  {#each words as word, wi}
    <div class="word">
      {#each word.split('') as char, ci}
        {@const absIdx = getAbsoluteIndex(wi, ci)}
        <LetterTile
          {char}
          revealed={isRevealed(char, absIdx)}
          jollyRevealed={isJollyRevealed(char, absIdx)}
          clickable={isTileClickable(char, absIdx)}
          onclick={() => {
            if (isTileClickable(char, absIdx)) onJollyPick(absIdx);
          }}
        />
      {/each}
    </div>
    {#if wi < words.length - 1}
      <div class="word-space"></div>
    {/if}
  {/each}
</div>

{#if jollyMode}
  <p class="jolly-hint">Tocca una casella nascosta per rivelare la lettera!</p>
{/if}

<style>
  .board {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 4px;
    padding: 1.5rem 1rem;
    background: rgba(0,0,0,0.3);
    border-radius: 12px;
    border: 2px solid rgba(255,215,0,0.2);
    min-height: 80px;
  }
  .word {
    display: flex;
    gap: 3px;
  }
  .word-space {
    width: 14px;
  }
  .jolly-hint {
    text-align: center;
    color: #00e676;
    font-family: 'Oswald', sans-serif;
    font-size: 1rem;
    margin-top: 0.5rem;
    animation: pulseGlow 1.5s ease-in-out infinite;
  }
  @keyframes pulseGlow {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; text-shadow: 0 0 10px rgba(0,230,118,0.5); }
  }

  @media (max-width: 480px) {
    .board {
      padding: 1rem 0.5rem;
      gap: 2px;
    }
    .word { gap: 2px; }
    .word-space { width: 10px; }
  }
</style>
