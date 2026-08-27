<script>
  import { settings } from '../lib/stores/settingsStore.svelte.js';

  let {
    canSpin = false,
    canBuyVowel = false,
    canSolve = false,
    showBuyVowel = false,
    onSpin = () => {},
    onBuyVowel = () => {},
    onSolve = () => {},
    playerName = '',
  } = $props();
</script>

<div class="controls">
  <button class="btn spin" disabled={!canSpin} onclick={onSpin}>
    Gira la ruota
  </button>
  <div class="secondary">
    {#if showBuyVowel}
      <button class="btn vowel" disabled={!canBuyVowel} onclick={onBuyVowel}>
        Vocale −{settings.vowelCost} €
      </button>
    {/if}
    <button class="btn solve" disabled={!canSolve} onclick={onSolve}>
      Risolvi
    </button>
  </div>
</div>

<style>
  .controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 380px;
    margin: 0 auto;
  }
  .secondary {
    display: flex;
    gap: 12px;
  }
  .btn {
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    transform: none;
  }
  .btn:hover:not(:disabled) {
    transform: translateY(-2px);
  }
  .spin {
    height: 58px;
    border-radius: 16px;
    background: var(--amber);
    color: var(--ink);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.02rem;
    letter-spacing: 1px;
    text-transform: uppercase;
    box-shadow: 0 10px 30px rgba(245,182,63,0.3);
  }
  .spin:hover:not(:disabled) {
    background: var(--amber-bright);
  }
  .vowel,
  .solve {
    flex: 1;
    height: 48px;
    border-radius: 14px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 0.88rem;
  }
  .vowel {
    background: var(--glass-strong);
    border: 1px solid var(--glass-border-strong);
    color: rgba(244,242,255,0.85);
  }
  .vowel:hover:not(:disabled) {
    background: rgba(244,242,255,0.1);
  }
  .solve {
    background: rgba(124,108,255,0.12);
    border: 1px solid rgba(124,108,255,0.45);
    color: #A99DFF;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .solve:hover:not(:disabled) {
    background: rgba(124,108,255,0.2);
  }
</style>
