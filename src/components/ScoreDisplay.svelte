<script>
  import { formatEuro } from '../lib/utils/format.js';

  let { money = 0, totalScore = 0, showTotal = false } = $props();
</script>

<div class="score-container">
  <div class="score">
    <span class="label">Montepremi round</span>
    <span class="amount">{formatEuro(money)}</span>
  </div>
  {#if showTotal}
    <div class="score">
      <span class="label">Totale</span>
      <span class="amount total-amount">{formatEuro(totalScore)}</span>
    </div>
  {/if}
</div>

<style>
  .score-container {
    display: flex;
    gap: 0.8rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  .score {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    padding: 0.7rem 1.6rem;
    background: var(--glass);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius);
  }
  .label {
    font-family: var(--font-ui);
    color: var(--text-faint);
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .amount {
    font-family: var(--font-display);
    color: var(--amber);
    font-size: 1.5rem;
    font-weight: 700;
  }
  .total-amount {
    color: var(--mint);
  }
  @media (min-width: 981px) {
    .score {
      padding: 0.8rem 2rem;
    }
    .amount {
      font-size: 1.8rem;
    }
  }
</style>
