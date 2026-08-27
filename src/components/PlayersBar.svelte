<script>
  import TimerRing from './TimerRing.svelte';
  import { getPlayerAccent } from '../lib/utils/playerAccents.js';
  import { formatEuro } from '../lib/utils/format.js';

  let {
    players = [],
    currentIndex = 0,
    totalScores = [],
    showTotal = false,
    timerSeconds = null,
    timerTotal = 30,
    timerActive = false,
  } = $props();

  let fraction = $derived(timerTotal > 0 ? (timerSeconds ?? 0) / timerTotal : 0);
  let warning = $derived(timerActive && timerSeconds != null && timerSeconds <= 10);
</script>

<div class="players-bar">
  {#each players as player, i}
    {@const accent = getPlayerAccent(i)}
    {@const active = i === currentIndex}
    <div class="player" class:active>
      {#if active}
        <TimerRing
          size={52}
          initial={player.name.charAt(0).toUpperCase()}
          accentSolid={accent.solid}
          accentOn={accent.onSolid}
          {fraction}
          {warning}
          showRing={timerActive}
        />
      {:else}
        <div class="avatar" style={`background: ${accent.bg}; color: ${accent.text};`}>
          {player.name.charAt(0).toUpperCase()}
        </div>
      {/if}
      <div class="info">
        <span class="name">{player.name}</span>
        <span class="money">{formatEuro(player.money)}</span>
        {#if showTotal}
          <span class="total">Tot: {formatEuro(totalScores[i] || 0)}</span>
        {/if}
      </div>
      {#if active && timerActive && timerSeconds != null}
        <span class="countdown" class:warning>{timerSeconds}<span class="unit">s</span></span>
      {/if}
    </div>
  {/each}
</div>

<style>
  .players-bar {
    display: flex;
    gap: 0.8rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  .player {
    flex: 1;
    min-width: 150px;
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.75rem 1rem;
    background: var(--glass);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius);
    transition: all 0.3s;
  }
  .player.active {
    background: rgba(245,182,63,0.08);
    border: 1.5px solid rgba(245,182,63,0.55);
    flex-grow: 1.5;
    min-width: 210px;
  }
  .player.active .info {
    flex: 1;
  }
  .avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 700;
    flex-shrink: 0;
  }
  .info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    line-height: 1.25;
    min-width: 0;
  }
  .name {
    font-family: var(--font-ui);
    font-size: 0.85rem;
    color: rgba(244,242,255,0.8);
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .player.active .name {
    color: var(--text);
    font-weight: 700;
  }
  .money {
    font-family: var(--font-display);
    font-size: 0.92rem;
    color: rgba(244,242,255,0.6);
    font-weight: 700;
  }
  .player.active .money {
    color: var(--amber);
  }
  .total {
    font-family: var(--font-ui);
    font-size: 0.7rem;
    color: var(--mint);
    font-weight: 600;
  }
  .countdown {
    margin-left: auto;
    padding-left: 0.4rem;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.15rem;
    color: var(--amber);
    flex-shrink: 0;
  }
  .countdown .unit {
    font-size: 0.65rem;
  }
  .countdown.warning {
    color: var(--coral);
    animation: countPulse 0.8s ease-in-out infinite;
  }
  @keyframes countPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
  }
</style>
