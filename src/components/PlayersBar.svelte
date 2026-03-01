<script>
  let { players = [], currentIndex = 0, totalScores = [], showTotal = false } = $props();
</script>

<div class="players-bar">
  {#each players as player, i}
    <div class="player" class:active={i === currentIndex}>
      <div class="avatar">{player.name.charAt(0).toUpperCase()}</div>
      <div class="info">
        <span class="name">{player.name}</span>
        <span class="money">{player.money.toLocaleString('it-IT')} €</span>
        {#if showTotal}
          <span class="total">Tot: {(totalScores[i] || 0).toLocaleString('it-IT')} €</span>
        {/if}
      </div>
      {#if player.hasJolly}
        <span class="jolly" title="Jolly">J</span>
      {/if}
      {#if i === currentIndex}
        <div class="turn-indicator"></div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .players-bar {
    display: flex;
    gap: 0.6rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  .player {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.8rem;
    background: rgba(255,255,255,0.06);
    border: 2px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    position: relative;
    transition: all 0.3s;
    min-width: 130px;
  }
  .player.active {
    background: rgba(255,215,0,0.1);
    border-color: #ffd700;
    box-shadow: 0 0 15px rgba(255,215,0,0.15);
  }
  .avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, #283593, #1a237e);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Oswald', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: #ffd700;
    flex-shrink: 0;
  }
  .player.active .avatar {
    background: linear-gradient(135deg, #ffd700, #e6b800);
    color: #1a237e;
  }
  .info {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }
  .name {
    font-family: 'Oswald', sans-serif;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.8);
    font-weight: 600;
  }
  .player.active .name {
    color: #ffd700;
  }
  .money {
    font-family: 'Oswald', sans-serif;
    font-size: 1rem;
    color: #ffd700;
    font-weight: 700;
  }
  .total {
    font-family: 'Oswald', sans-serif;
    font-size: 0.75rem;
    color: #4CAF50;
    font-weight: 600;
  }
  .jolly {
    background: #ffd700;
    color: #1a237e;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Oswald', sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    flex-shrink: 0;
  }
  .turn-indicator {
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 6px solid #ffd700;
    transform: translateX(-50%) rotate(180deg);
  }
</style>
