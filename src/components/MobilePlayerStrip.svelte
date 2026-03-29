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

  let current = $derived(players[currentIndex] || { name: '', money: 0 });
  let initial = $derived(current.name ? current.name.charAt(0).toUpperCase() : '?');
  let timerWarning = $derived(turnTimer <= 10);
</script>

<div class="strip">
  <div class="player-info">
    <div class="avatar">{initial}</div>
    <div class="details">
      <span class="name">{current.name}</span>
      <span class="money">{current.money.toLocaleString('it-IT')} €</span>
    </div>
    {#if showTotal}
      <span class="total">{(totalScores[currentIndex] || 0).toLocaleString('it-IT')} €</span>
    {/if}
  </div>

  <div class="right">
    {#if isMultiplayer && players.length > 1}
      <span class="player-count">{currentIndex + 1}/{players.length}</span>
    {/if}
    {#if showTimer}
      <span class="timer" class:warning={timerWarning}>{turnTimer}s</span>
    {/if}
  </div>
</div>

<style>
  .strip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.3rem 0.5rem;
    background: rgba(255,215,0,0.06);
    border: 1px solid rgba(255,215,0,0.15);
    border-radius: 8px;
    gap: 0.5rem;
  }
  .player-info {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
    flex: 1;
  }
  .avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ffd700, #e6b800);
    color: #1a237e;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Oswald', sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    flex-shrink: 0;
  }
  .details {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
    min-width: 0;
  }
  .name {
    font-family: 'Oswald', sans-serif;
    font-size: 0.8rem;
    color: #ffd700;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .money {
    font-family: 'Oswald', sans-serif;
    font-size: 0.95rem;
    color: #ffd700;
    font-weight: 700;
  }
  .total {
    font-family: 'Oswald', sans-serif;
    font-size: 0.75rem;
    color: #4CAF50;
    font-weight: 600;
    flex-shrink: 0;
  }
  .right {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
  }
  .player-count {
    font-family: 'Oswald', sans-serif;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.4);
    background: rgba(255,255,255,0.06);
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
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
