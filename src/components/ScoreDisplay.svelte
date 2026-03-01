<script>
  let { money = 0, totalScore = 0, showTotal = false } = $props();
</script>

<div class="score-container">
  <div class="score">
    <span class="label">Montepremi Round</span>
    <span class="amount">{money.toLocaleString('it-IT')} €</span>
  </div>
  {#if showTotal}
    <div class="score total">
      <span class="label">Totale</span>
      <span class="amount total-amount">{totalScore.toLocaleString('it-IT')} €</span>
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
    padding: 0.6rem 1.5rem;
    background: linear-gradient(135deg, #1a237e, #283593);
    border: 2px solid #ffd700;
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(255,215,0,0.2);
  }
  .score.total {
    border-color: #4CAF50;
    box-shadow: 0 0 20px rgba(76,175,80,0.2);
  }
  .label {
    font-family: 'Oswald', sans-serif;
    color: rgba(255,255,255,0.7);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .amount {
    font-family: 'Oswald', sans-serif;
    color: #ffd700;
    font-size: 1.8rem;
    font-weight: 700;
    text-shadow: 0 0 10px rgba(255,215,0,0.4);
  }
  .total-amount {
    color: #4CAF50;
    text-shadow: 0 0 10px rgba(76,175,80,0.4);
  }
</style>
