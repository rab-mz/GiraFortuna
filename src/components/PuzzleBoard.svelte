<script>
  import LetterTile from './LetterTile.svelte';
  import { normalizeChar, isLetter } from '../lib/utils/italian.js';
  import { layoutPhrase, rowWidth } from '../lib/utils/boardLayout.js';

  let {
    phrase = '',
    revealedLetters = new Set(),
    jollyMode = false,
    jollyRevealedPositions = new Set(),
    onJollyPick = () => {},
  } = $props();

  let words = $derived(phrase.split(' '));

  // --- Impaginazione delle righe (logica in lib/utils/boardLayout.js) ---
  let boardW = $state(0);
  let isSmall = $state(false);
  let isLarge = $state(false);
  $effect(() => {
    const mqSmall = window.matchMedia('(max-width: 480px)');
    const mqLarge = window.matchMedia('(min-width: 981px)');
    isSmall = mqSmall.matches;
    isLarge = mqLarge.matches;
    const hs = (e) => { isSmall = e.matches; };
    const hl = (e) => { isLarge = e.matches; };
    mqSmall.addEventListener('change', hs);
    mqLarge.addEventListener('change', hl);
    return () => {
      mqSmall.removeEventListener('change', hs);
      mqLarge.removeEventListener('change', hl);
    };
  });

  let metrics = $derived(isSmall
    ? { tile: 28, gap: 2, space: 10, boardGap: 2 }
    : isLarge
      ? { tile: 46, gap: 5, space: 16, boardGap: 6 }
      : { tile: 40, gap: 5, space: 14, boardGap: 6 });

  // arrotondata: senza, una variazione di un pixel rifa' l'impaginazione e le
  // caselle sembrano "ricaricarsi"
  let boardStep = $derived(Math.floor(boardW / 6) * 6);
  let lines = $derived(layoutPhrase(words, boardStep, metrics));

  // Se una parola (o una riga) e' piu' larga del tabellone non si spezza mai a
  // meta': si stringono le caselle quel tanto che basta perche' entri tutto.
  let scala = $derived.by(() => {
    if (!boardStep || !lines.length) return 1;
    const larga = Math.max(...lines.map(r => rowWidth(r, words, metrics)));
    if (larga <= boardStep) return 1;
    return Math.max(boardStep / larga, 0.5);
  });

  let tileStyle = $derived(scala === 1 ? '' : [
    `--tile-w: ${(metrics.tile * scala).toFixed(1)}px`,
    `--tile-h: ${((isSmall ? 36 : isLarge ? 58 : 50) * scala).toFixed(1)}px`,
    `--tile-font: ${((isSmall ? 0.95 : isLarge ? 1.45 : 1.3) * scala).toFixed(2)}rem`,
  ].join('; '));

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
  <div class="lines" bind:clientWidth={boardW} style={tileStyle}>
    {#each lines as line, li (li)}
      <div class="line">
        {#each line as wi, k (wi)}
          <div class="word">
            {#each words[wi].split('') as char, ci (ci)}
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
          {#if k < line.length - 1}
            <div class="word-space"></div>
          {/if}
        {/each}
      </div>
    {/each}
  </div>
</div>

{#if jollyMode}
  <p class="jolly-hint">Tocca una casella nascosta per rivelare la lettera!</p>
{/if}

<style>
  .board {
    display: flex;
    justify-content: center;
    padding: 1.6rem 1.4rem;
    background: var(--glass);
    border-radius: 20px;
    border: 1px solid var(--glass-border);
    min-height: 80px;
  }
  .lines {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .line {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 6px;
  }
  .word {
    display: flex;
    gap: 5px;
  }
  .word-space {
    width: 14px;
  }
  .jolly-hint {
    text-align: center;
    color: var(--mint);
    font-family: var(--font-ui);
    font-weight: 600;
    font-size: 0.95rem;
    margin-top: 0.5rem;
    animation: pulseGlow 1.5s ease-in-out infinite;
  }
  @keyframes pulseGlow {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; text-shadow: 0 0 10px rgba(51,214,181,0.5); }
  }

  @media (max-width: 480px) {
    .board {
      padding: 1rem 0.5rem;
    }
    .lines { gap: 5px; }
    .line { gap: 2px; }
    .word { gap: 2px; }
    .word-space { width: 10px; }
  }

  /* Desktop: caselle piu' grandi (le misure devono combaciare con metrics) */
  @media (min-width: 981px) {
    .word-space { width: 16px; }
  }
</style>
