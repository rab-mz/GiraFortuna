<script>
  import TimerRing from './TimerRing.svelte';
  import { getPlayerAccent } from '../lib/utils/playerAccents.js';
  import { formatEuro } from '../lib/utils/format.js';

  let {
    players = [],
    currentIndex = 0,
    totalScores = [],
    showTotal = false,
    isMultiplayer = false,
    turnTimer = 30,
    timerTotal = 30,
    showTimer = false,
  } = $props();

  let timerWarning = $derived(turnTimer <= 10);
  let fraction = $derived(timerTotal > 0 ? turnTimer / timerTotal : 0);
</script>

<div class="strip">
  {#each players as player, i}
    {@const accent = getPlayerAccent(i)}
    {@const active = i === currentIndex}
    <div class="player-card" class:active>
      {#if active}
        <TimerRing
          size={38}
          initial={player.name.charAt(0).toUpperCase()}
          accentSolid={accent.solid}
          accentOn={accent.onSolid}
          {fraction}
          warning={showTimer && timerWarning}
          showRing={showTimer}
        />
        <div class="details">
          <span class="name">{player.name}</span>
          <span class="money">{formatEuro(player.money)}</span>
          {#if showTotal}
            <span class="total">Tot: {formatEuro(totalScores[i] || 0)}</span>
          {/if}
        </div>
        {#if showTimer}
          <span class="countdown" class:warning={timerWarning}>{turnTimer}<span class="unit">s</span></span>
        {/if}
      {:else}
        <div class="details centered">
          <span class="name">{player.name}</span>
          <span class="money">{formatEuro(player.money)}</span>
          {#if showTotal}
            <span class="total">Tot: {formatEuro(totalScores[i] || 0)}</span>
          {/if}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .strip {
    display: flex;
    align-items: stretch;
    gap: 0.5rem;
    width: 100%;
  }
  .player-card {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 0.6rem;
    border-radius: 14px;
    background: var(--glass);
    border: 1px solid var(--glass-border);
    transition: all 0.3s ease;
    min-width: 0;
  }
  .player-card.active {
    flex: 1.3;
    justify-content: flex-start;
    background: rgba(245,182,63,0.08);
    border: 1.5px solid rgba(245,182,63,0.55);
  }
  .details {
    display: flex;
    flex-direction: column;
    gap: 1px;
    line-height: 1.2;
    min-width: 0;
  }
  .details.centered {
    align-items: center;
  }
  .name {
    font-family: var(--font-ui);
    font-size: 0.7rem;
    color: rgba(244,242,255,0.75);
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  .player-card.active .name {
    color: var(--text);
    font-weight: 700;
    font-size: 0.75rem;
  }
  .money {
    font-family: var(--font-display);
    font-size: 0.75rem;
    color: rgba(244,242,255,0.6);
    font-weight: 700;
    white-space: nowrap;
  }
  .player-card.active .money {
    color: var(--amber);
  }
  .total {
    font-family: var(--font-ui);
    font-size: 0.6rem;
    color: var(--mint);
    font-weight: 600;
    white-space: nowrap;
  }
  .countdown {
    margin-left: auto;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--amber);
    flex-shrink: 0;
  }
  .countdown .unit {
    font-size: 0.55rem;
  }
  .countdown.warning {
    color: var(--coral);
    animation: pulse 0.8s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
