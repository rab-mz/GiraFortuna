<script>
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
    Gira la Ruota
  </button>
  {#if showBuyVowel}
    <button class="btn vowel" disabled={!canBuyVowel} onclick={onBuyVowel}>
      Compra Vocale (-500€)
    </button>
  {/if}
  <button class="btn solve" disabled={!canSolve} onclick={onSolve}>
    Risolvi
  </button>
</div>

<style>
  .controls {
    display: flex;
    gap: 0.8rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  .btn {
    padding: 0.7rem 1.4rem;
    border: none;
    border-radius: 8px;
    font-family: 'Oswald', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    transform: none;
  }
  .btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  .spin {
    background: linear-gradient(135deg, #ffd700, #f0c000);
    color: #1a237e;
  }
  .vowel {
    background: linear-gradient(135deg, #4CAF50, #388e3c);
    color: #fff;
  }
  .solve {
    background: linear-gradient(135deg, #2196F3, #1976D2);
    color: #fff;
  }

  @media (max-width: 480px) {
    .controls {
      flex-direction: column;
      align-items: stretch;
    }
    .btn {
      padding: 0.9rem 1.4rem;
      font-size: 1.05rem;
    }
  }
</style>
