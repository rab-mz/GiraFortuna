<script>
  import { onMount } from 'svelte';
  import { fly, scale, fade } from 'svelte/transition';
  import { sound } from '../lib/audio/soundEngine.js';

  let {
    players = [], // [{name, die1, die2}, ...]
    onComplete = () => {}, // called with winnerIndex
  } = $props();

  // Dot patterns for dice faces (3x3 grid, 1=dot, 0=empty)
  const DOTS = {
    1: [0,0,0, 0,1,0, 0,0,0],
    2: [0,0,1, 0,0,0, 1,0,0],
    3: [0,0,1, 0,1,0, 1,0,0],
    4: [1,0,1, 0,0,0, 1,0,1],
    5: [1,0,1, 0,1,0, 1,0,1],
    6: [1,0,1, 1,0,1, 1,0,1],
  };

  // Calculate winner (highest total, tiebreak = first in order)
  const totals = players.map(p => p.die1 + p.die2);
  const maxTotal = Math.max(...totals);
  const winnerIndex = totals.indexOf(maxTotal);

  // Animation state (initialised from props — they don't change during the animation)
  const count = players.length;
  let displayDice = $state(Array.from({ length: count }, () => ({ die1: 1, die2: 1 })));
  let playerState = $state(Array.from({ length: count }, () => 'waiting')); // waiting | rolling | landed
  let showWinner = $state(false);

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  async function animate() {
    await delay(800);

    for (let i = 0; i < players.length; i++) {
      playerState[i] = 'rolling';
      playerState = [...playerState];
      sound.buttonClick();

      // Rapid random values with deceleration
      const steps = 14;
      for (let s = 0; s < steps; s++) {
        displayDice[i] = {
          die1: Math.ceil(Math.random() * 6),
          die2: Math.ceil(Math.random() * 6),
        };
        displayDice = [...displayDice];
        if (s % 3 === 0) sound.tick();
        await delay(55 + s * 18); // accelerate → decelerate
      }

      // Land on final value
      displayDice[i] = { die1: players[i].die1, die2: players[i].die2 };
      displayDice = [...displayDice];
      playerState[i] = 'landed';
      playerState = [...playerState];
      sound.letterReveal();

      await delay(700);
    }

    // Show winner
    await delay(400);
    showWinner = true;
    sound.winFanfare();

    await delay(2800);
    onComplete(winnerIndex);
  }

  onMount(() => {
    animate();
  });
</script>

<div class="overlay" transition:fade={{ duration: 300 }}>
  <div class="content" transition:scale={{ duration: 400, delay: 100 }}>
    <h2>Chi inizia per primo?</h2>
    <p class="subtitle">Lancia i dadi!</p>

    <div class="players-list">
      {#each players as player, i}
        <div
          class="player-row"
          class:active={playerState[i] !== 'waiting'}
          class:winner={showWinner && i === winnerIndex}
          class:dimmed={showWinner && i !== winnerIndex}
        >
          <div class="player-left">
            <div class="avatar" class:winner-avatar={showWinner && i === winnerIndex}>
              {player.name.charAt(0).toUpperCase()}
            </div>
            <span class="name">{player.name}</span>
          </div>

          <div class="dice-area">
            {#if playerState[i] !== 'waiting'}
              <div class="die" class:rolling={playerState[i] === 'rolling'} class:landed={playerState[i] === 'landed'}>
                <div class="die-grid">
                  {#each DOTS[displayDice[i].die1] as hasDot}
                    <div class="cell">{#if hasDot}<span class="dot"></span>{/if}</div>
                  {/each}
                </div>
              </div>
              <div class="die" class:rolling={playerState[i] === 'rolling'} class:landed={playerState[i] === 'landed'}>
                <div class="die-grid">
                  {#each DOTS[displayDice[i].die2] as hasDot}
                    <div class="cell">{#if hasDot}<span class="dot"></span>{/if}</div>
                  {/each}
                </div>
              </div>
            {:else}
              <div class="die placeholder"></div>
              <div class="die placeholder"></div>
            {/if}
          </div>

          <div class="total-area">
            {#if playerState[i] === 'landed'}
              <span class="total" in:scale={{ duration: 300 }}>
                {players[i].die1 + players[i].die2}
              </span>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    {#if showWinner}
      <div class="winner-banner" in:fly={{ y: 20, duration: 400 }}>
        <span class="winner-name">{players[winnerIndex].name}</span> inizia per primo!
      </div>
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.92);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 350;
    backdrop-filter: blur(12px);
    padding: 1rem;
  }
  .content {
    text-align: center;
    max-width: 420px;
    width: 100%;
  }
  h2 {
    font-family: 'Oswald', sans-serif;
    color: #ffd700;
    font-size: 2rem;
    margin: 0 0 0.2rem;
    letter-spacing: 2px;
    text-shadow: 0 0 25px rgba(255,215,0,0.4);
  }
  .subtitle {
    font-family: 'Inter', sans-serif;
    color: rgba(255,255,255,0.4);
    font-size: 0.9rem;
    margin: 0 0 1.8rem;
  }

  /* --- Player Rows --- */
  .players-list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin-bottom: 1.5rem;
  }
  .player-row {
    display: flex;
    align-items: center;
    padding: 0.7rem 0.8rem;
    background: rgba(255,255,255,0.03);
    border: 2px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    transition: all 0.4s ease;
    opacity: 0.4;
  }
  .player-row.active {
    opacity: 1;
    border-color: rgba(255,215,0,0.15);
    background: rgba(255,215,0,0.04);
  }
  .player-row.winner {
    border-color: #ffd700;
    background: rgba(255,215,0,0.1);
    box-shadow: 0 0 25px rgba(255,215,0,0.15);
    opacity: 1;
  }
  .player-row.dimmed {
    opacity: 0.35;
  }

  .player-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
  }
  .avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, #283593, #1a237e);
    color: #ffd700;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Oswald', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    flex-shrink: 0;
    transition: all 0.4s;
  }
  .avatar.winner-avatar {
    background: linear-gradient(135deg, #ffd700, #e6b800);
    color: #1a237e;
    box-shadow: 0 0 12px rgba(255,215,0,0.4);
  }
  .name {
    font-family: 'Oswald', sans-serif;
    color: rgba(255,255,255,0.85);
    font-size: 1.05rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .player-row.winner .name {
    color: #ffd700;
  }

  /* --- Dice --- */
  .dice-area {
    display: flex;
    gap: 0.35rem;
    flex-shrink: 0;
  }
  .die {
    width: 46px;
    height: 46px;
    background: linear-gradient(145deg, #faf5eb, #e8e0d0);
    border-radius: 9px;
    box-shadow:
      0 3px 8px rgba(0,0,0,0.35),
      inset 0 1px 0 rgba(255,255,255,0.6),
      inset 0 -1px 0 rgba(0,0,0,0.08);
    overflow: hidden;
  }
  .die.placeholder {
    background: rgba(255,255,255,0.04);
    box-shadow: none;
    border: 2px dashed rgba(255,255,255,0.08);
  }
  .die.rolling {
    animation: diceShake 0.12s ease-in-out infinite;
  }
  .die.landed {
    animation: dieLand 0.35s ease-out;
  }

  .die-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr;
    width: 100%;
    height: 100%;
    padding: 7px;
    box-sizing: border-box;
  }
  .cell {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #3a3a4a, #1a1a2e);
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.4);
  }

  /* --- Total --- */
  .total-area {
    width: 2.5rem;
    text-align: right;
    flex-shrink: 0;
  }
  .total {
    font-family: 'Oswald', sans-serif;
    font-size: 1.4rem;
    font-weight: 700;
    color: #ffd700;
    text-shadow: 0 0 8px rgba(255,215,0,0.3);
  }

  /* --- Winner Banner --- */
  .winner-banner {
    font-family: 'Oswald', sans-serif;
    font-size: 1.3rem;
    color: #ffd700;
    text-shadow: 0 0 20px rgba(255,215,0,0.5);
    padding: 0.8rem 1.5rem;
    background: linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,215,0,0.06));
    border: 2px solid rgba(255,215,0,0.35);
    border-radius: 12px;
    letter-spacing: 1px;
  }
  .winner-name {
    font-weight: 700;
    font-size: 1.5rem;
  }

  /* --- Animations --- */
  @keyframes diceShake {
    0% { transform: rotate(0deg) translateY(0); }
    20% { transform: rotate(-10deg) translateY(-2px); }
    40% { transform: rotate(8deg) translateY(1px); }
    60% { transform: rotate(-5deg) translateY(-1px); }
    80% { transform: rotate(4deg) translateY(0); }
    100% { transform: rotate(0deg) translateY(0); }
  }

  @keyframes dieLand {
    0% { transform: scale(1.2) rotate(3deg); }
    40% { transform: scale(0.92) rotate(-1deg); }
    70% { transform: scale(1.05) rotate(0); }
    100% { transform: scale(1) rotate(0); }
  }

  @media (max-width: 480px) {
    h2 { font-size: 1.5rem; }
    .subtitle { font-size: 0.8rem; margin-bottom: 1.2rem; }
    .die { width: 40px; height: 40px; border-radius: 7px; }
    .die-grid { padding: 5px; }
    .dot { width: 7px; height: 7px; }
    .player-row { padding: 0.5rem 0.6rem; }
    .avatar { width: 30px; height: 30px; font-size: 0.85rem; }
    .name { font-size: 0.95rem; }
    .total { font-size: 1.2rem; }
    .winner-banner { font-size: 1.1rem; padding: 0.6rem 1rem; }
    .winner-name { font-size: 1.3rem; }
  }
</style>
