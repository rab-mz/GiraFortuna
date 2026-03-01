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
    border-color: rgba(0,230,118,0.6);
    box-shadow: 0 0 12px rgba(0,230,118,0.3);
  }
  .tile-wrap.clickable:hover .tile,
  .tile-wrap.clickable:active .tile {
    border-color: #00e676;
    box-shadow: 0 0 20px rgba(0,230,118,0.5);
    transform: scale(1.1);
  }
  .tile {
    width: 38px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Oswald', sans-serif;
    font-size: 1.4rem;
    font-weight: 700;
    border-radius: 4px;
    transition: all 0.3s ease;
  }
  .letter {
    background: var(--tile-bg, #0d47a1);
    border: 2px solid rgba(255,255,255,0.2);
    color: transparent;
    box-shadow: inset 0 2px 8px rgba(0,0,0,0.3);
  }
  .letter.revealed {
    background: var(--tile-revealed, #e3f2fd);
    color: var(--tile-letter, #1a237e);
    border-color: rgba(255,215,0,0.5);
    box-shadow: 0 0 10px rgba(255,215,0,0.3);
    animation: flipIn 0.5s ease;
  }
  .letter.jolly-revealed {
    background: #e8f5e9;
    color: #1b5e20;
    border-color: rgba(0,230,118,0.6);
    box-shadow: 0 0 10px rgba(0,230,118,0.3);
    animation: flipIn 0.5s ease;
  }
  .punctuation {
    background: transparent;
    color: rgba(255,255,255,0.7);
    font-size: 1.2rem;
  }
  .spacer {
    width: 18px;
    height: 48px;
  }
  .jolly-badge {
    position: absolute;
    bottom: -10px;
    font-family: 'Oswald', sans-serif;
    font-size: 0.6rem;
    font-weight: 700;
    color: #00897B;
    background: rgba(0,137,123,0.15);
    border: 1px solid rgba(0,137,123,0.4);
    border-radius: 3px;
    padding: 0 3px;
    line-height: 1.2;
  }
  @keyframes flipIn {
    0% { transform: rotateY(90deg); opacity: 0.5; }
    100% { transform: rotateY(0deg); opacity: 1; }
  }
  @keyframes jollyPulse {
    0%, 100% { box-shadow: 0 0 8px rgba(0,230,118,0.2); }
    50% { box-shadow: 0 0 16px rgba(0,230,118,0.5); }
  }

  @media (max-width: 480px) {
    .tile {
      width: 30px;
      height: 38px;
      font-size: 1.1rem;
    }
    .spacer {
      width: 12px;
      height: 38px;
    }
    .jolly-badge {
      font-size: 0.5rem;
      bottom: -8px;
    }
  }
</style>
