<script>
  import { isLetter } from '../lib/utils/italian.js';

  let {
    char = '',
    revealed = false,
    jollyRevealed = false,
    clickable = false,
    onclick = () => {},
  } = $props();

  let isAlpha = $derived(isLetter(char));
  let display = $derived(revealed || !isAlpha ? char.toUpperCase() : '');
  let showTile = $derived(char !== ' ');
</script>

{#if showTile}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="tile-wrap"
    class:clickable
    role={clickable ? 'button' : undefined}
    tabindex={clickable ? 0 : undefined}
    onclick={clickable ? onclick : undefined}
    onkeydown={clickable ? (e) => { if (e.key === 'Enter') onclick(); } : undefined}
  >
    <div class="tile" class:letter={isAlpha} class:revealed={revealed && isAlpha} class:jolly-revealed={jollyRevealed} class:punctuation={!isAlpha}>
      <span>{display}</span>
    </div>
    {#if jollyRevealed}
      <span class="jolly-badge">J</span>
    {/if}
  </div>
{:else}
  <div class="spacer"></div>
{/if}

<style>
  .tile-wrap {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
  }
  .tile-wrap.clickable {
    cursor: pointer;
  }
  .tile-wrap.clickable .tile {
    animation: jollyPulse 1.2s ease-in-out infinite;
    border-color: rgba(51,214,181,0.6);
    box-shadow: 0 0 12px rgba(51,214,181,0.3);
  }
  .tile-wrap.clickable:hover .tile,
  .tile-wrap.clickable:active .tile {
    border-color: var(--mint);
    box-shadow: 0 0 20px rgba(51,214,181,0.5);
    transform: scale(1.1);
  }
  .tile {
    /* le misure arrivano dal tabellone: si stringono se una riga e' troppo lunga */
    width: var(--tile-w, 40px);
    height: var(--tile-h, 50px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: var(--tile-font, 1.3rem);
    font-weight: 700;
    border-radius: 7px;
    transition: all 0.3s ease;
  }
  .letter {
    background: var(--tile-bg);
    border: 1px solid var(--tile-border);
    color: transparent;
  }
  .letter.revealed {
    background: var(--tile-revealed);
    color: var(--tile-letter);
    border-color: transparent;
    animation: flipIn 0.5s ease;
  }
  .letter.jolly-revealed {
    background: var(--tile-revealed);
    color: var(--tile-letter);
    border: 2px solid rgba(51,214,181,0.7);
    box-shadow: 0 0 10px rgba(51,214,181,0.3);
    animation: flipIn 0.5s ease;
  }
  .punctuation {
    background: transparent;
    color: var(--text-dim);
    font-size: 1.1rem;
  }
  .spacer {
    width: 18px;
    height: var(--tile-h, 50px);
  }
  .jolly-badge {
    position: absolute;
    bottom: -10px;
    font-family: var(--font-ui);
    font-size: 0.6rem;
    font-weight: 700;
    color: var(--mint);
    background: rgba(51,214,181,0.12);
    border: 1px solid rgba(51,214,181,0.4);
    border-radius: 4px;
    padding: 0 3px;
    line-height: 1.2;
  }
  @keyframes flipIn {
    0% { transform: rotateY(90deg); opacity: 0.5; }
    100% { transform: rotateY(0deg); opacity: 1; }
  }
  @keyframes jollyPulse {
    0%, 100% { box-shadow: 0 0 8px rgba(51,214,181,0.2); }
    50% { box-shadow: 0 0 16px rgba(51,214,181,0.5); }
  }

  @media (max-width: 480px) {
    .tile {
      width: var(--tile-w, 28px);
      height: var(--tile-h, 36px);
      font-size: var(--tile-font, 0.95rem);
      border-radius: 5px;
    }
    .spacer {
      width: 12px;
      height: var(--tile-h, 36px);
    }
    .jolly-badge {
      font-size: 0.5rem;
      bottom: -8px;
    }
  }

  /* Desktop: caselle piu' grandi (in sincrono con le metrics del tabellone) */
  @media (min-width: 981px) {
    .tile {
      width: var(--tile-w, 46px);
      height: var(--tile-h, 58px);
      font-size: var(--tile-font, 1.45rem);
    }
    .spacer {
      width: 20px;
      height: var(--tile-h, 58px);
    }
  }
</style>
