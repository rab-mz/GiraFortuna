<script>
  let {
    players = [],
    currentIndex = 0,
    totalScores = [],
    showTotal = false,
    isMultiplayer = false,
    turnTimer = 30,
    showTimer = false,
  } = $props();

  let timerWarning = $derived(turnTimer <= 10);
</script>

<div class="strip">
  <div class="players-row">
    {#each players as player, i}
      <div class="player-card" class:active={i === currentIndex}>
        <span class="avatar" class:active={i === currentIndex}>
          {player.name.charAt(0).toUpperCase()}
        </span>
        <div class="details">
          <span class="name">{player.name}</span>
          <span class="money">{player.money.toLocaleString('it-IT')} €</span>
          {#if showTotal}
            <span class="total">Tot: {(totalScores[i] || 0).toLocaleString('it-IT')} €</span>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  {#if showTimer}
    <span class="timer" class:warning={timerWarning}>{turnTimer}s</span>
  {/if}
</div>

<style>
  .strip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    width: 100%;
  }
  .players-row {
    display: flex;
    align-items: stretch;
    gap: 0.35rem;
    flex: 1;
    min-width: 0;
  }
  .player-card {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.4rem;
    border-radius: 8px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    opacity: 0.5;
    transition: all 0.3s ease;
    min-width: 0;
  }
  .player-card.active {
    opacity: 1;
    background: rgba(255,215,0,0.08);
    border-color: rgba(255,215,0,0.3);
    box-shadow: 0 0 8px rgba(255,215,0,0.15);
  }
  .avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Oswald', sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    flex-shrink: 0;
    transition: all 0.3s ease;
  }
  .avatar.active {
    background: linear-gradient(135deg, #ffd700, #e6b800);
    color: #1a237e;
  }
  .details {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
    min-width: 0;
  }
  .name {
    font-family: 'Oswald', sans-serif;
    font-size: 0.7rem;
    color: rgba(255,255,255,0.6);
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .player-card.active .name {
    color: #ffd700;
  }
  .money {
    font-family: 'Oswald', sans-serif;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.5);
    font-weight: 700;
  }
  .player-card.active .money {
    color: #ffd700;
  }
  .total {
    font-family: 'Oswald', sans-serif;
    font-size: 0.6rem;
    color: rgba(76,175,80,0.5);
    font-weight: 600;
  }
  .player-card.active .total {
    color: #4CAF50;
  }
  .timer {
    font-family: 'Oswald', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    color: #4CAF50;
    background: rgba(76,175,80,0.12);
    padding: 0.1rem 0.5rem;
    border-radius: 5px;
    min-width: 2.5rem;
    text-align: center;
    flex-shrink: 0;
  }
  .timer.warning {
    color: #ff5252;
    background: rgba(255,82,82,0.15);
    animation: pulse 0.8s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
