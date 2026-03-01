<script>
  import { fly, scale } from 'svelte/transition';

  let {
    winner = { name: '', money: 0 },
    players = [],
    isMultiplayer = false,
    phrase = '',
    currentRound = 1,
    totalRounds = 1,
    totalScores = [],
    isGameOver = false,
    showActions = true,
    onNextRound = () => {},
    onNewGame = () => {},
    onMenu = () => {},
  } = $props();

  let sortedPlayers = $derived(
    [...players].map((p, i) => ({ ...p, total: totalScores[i] || 0 }))
      .sort((a, b) => b.total - a.total)
  );

  let roundSortedPlayers = $derived(
    [...players].sort((a, b) => b.money - a.money)
  );
</script>

<div class="overlay" transition:fly={{ y: 50, duration: 400 }}>
  <div class="content" transition:scale={{ duration: 400, delay: 200 }}>

    {#if isGameOver}
      <!-- Final game over -->
      <h1>FINE DEL GIOCO!</h1>
      <p class="phrase">"{phrase}"</p>

      {#if isMultiplayer}
        <div class="leaderboard">
          <h3>Classifica Finale</h3>
          {#each sortedPlayers as player, i}
            <div class="lb-row" class:winner={i === 0}>
              <span class="lb-pos">{i + 1}.</span>
              <span class="lb-name">{player.name}</span>
              <span class="lb-money">{player.total.toLocaleString('it-IT')} €</span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="prize">Vincita ultimo round: <strong>{winner.money.toLocaleString('it-IT')} €</strong></p>
        {#if totalRounds > 1}
          <p class="prize total-prize final">Totale finale: <strong>{(totalScores[0] || 0).toLocaleString('it-IT')} €</strong></p>
        {/if}
      {/if}

      <div class="buttons">
        {#if showActions}
          <button class="btn-play" onclick={onNewGame}>Gioca Ancora</button>
        {/if}
        <button class="btn-menu" onclick={onMenu}>Esci</button>
      </div>

    {:else}
      <!-- Round won -->
      <div class="round-badge">Round {currentRound} di {totalRounds}</div>
      <h1>{isMultiplayer ? `${winner.name} HA VINTO!` : 'HAI VINTO!'}</h1>
      <p class="phrase">"{phrase}"</p>

      {#if isMultiplayer}
        <div class="leaderboard">
          <h3>Vincita Round</h3>
          {#each roundSortedPlayers as player}
            <div class="lb-row" class:winner={player.name === winner.name}>
              <span class="lb-name">{player.name}</span>
              <span class="lb-money">{player.money.toLocaleString('it-IT')} €</span>
            </div>
          {/each}
        </div>
        <div class="leaderboard totals">
          <h3>Classifica Totale</h3>
          {#each sortedPlayers as player, i}
            <div class="lb-row" class:winner={i === 0}>
              <span class="lb-pos">{i + 1}.</span>
              <span class="lb-name">{player.name}</span>
              <span class="lb-money total-money">{player.total.toLocaleString('it-IT')} €</span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="prize">Vincita round: <strong>{winner.money.toLocaleString('it-IT')} €</strong></p>
        <p class="prize total-prize">Totale accumulato: <strong>{(totalScores[0] || 0).toLocaleString('it-IT')} €</strong></p>
      {/if}

      <div class="buttons">
        {#if showActions}
          <button class="btn-play" onclick={onNextRound}>Round Successivo</button>
        {/if}
        <button class="btn-menu" onclick={onMenu}>Esci</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 300;
    backdrop-filter: blur(8px);
  }
  .content {
    text-align: center;
    padding: 2.5rem;
    max-width: 450px;
    width: 90%;
  }
  .round-badge {
    display: inline-block;
    padding: 0.3rem 1.2rem;
    background: rgba(255,215,0,0.15);
    border: 1px solid rgba(255,215,0,0.3);
    border-radius: 20px;
    color: #ffd700;
    font-family: 'Oswald', sans-serif;
    font-size: 0.9rem;
    letter-spacing: 1px;
    margin-bottom: 0.8rem;
  }
  h1 {
    font-family: 'Oswald', sans-serif;
    font-size: 2.8rem;
    color: #ffd700;
    text-shadow: 0 0 30px rgba(255,215,0,0.6);
    margin: 0 0 0.8rem;
    letter-spacing: 3px;
  }
  .phrase {
    font-family: 'Inter', sans-serif;
    color: #fff;
    font-size: 1.2rem;
    margin-bottom: 1rem;
    font-style: italic;
  }
  .prize {
    color: #ffd700;
    font-family: 'Oswald', sans-serif;
    font-size: 1.4rem;
    margin-bottom: 1.5rem;
  }
  .prize strong {
    font-size: 2rem;
  }
  .leaderboard {
    margin: 1rem 0 1.5rem;
    text-align: left;
  }
  .leaderboard h3 {
    font-family: 'Oswald', sans-serif;
    color: rgba(255,255,255,0.6);
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 0.5rem;
    text-align: center;
  }
  .lb-row {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.8rem;
    border-radius: 8px;
    margin-bottom: 0.3rem;
    background: rgba(255,255,255,0.05);
  }
  .lb-row.winner {
    background: rgba(255,215,0,0.12);
    border: 1px solid rgba(255,215,0,0.3);
  }
  .lb-pos {
    font-family: 'Oswald', sans-serif;
    color: rgba(255,255,255,0.4);
    width: 2rem;
    font-size: 1rem;
  }
  .lb-row.winner .lb-pos {
    color: #ffd700;
  }
  .lb-name {
    flex: 1;
    font-family: 'Oswald', sans-serif;
    color: rgba(255,255,255,0.8);
    font-size: 1rem;
  }
  .lb-row.winner .lb-name {
    color: #ffd700;
    font-weight: 600;
  }
  .lb-money {
    font-family: 'Oswald', sans-serif;
    color: #ffd700;
    font-size: 1.1rem;
    font-weight: 700;
  }
  .lb-money.total-money {
    color: #4CAF50;
  }
  .leaderboard.totals {
    margin-top: 0.5rem;
    padding-top: 0.8rem;
    border-top: 1px solid rgba(255,255,255,0.1);
  }
  .total-prize {
    color: #4CAF50;
    font-size: 1.1rem;
  }
  .total-prize strong {
    font-size: 1.5rem;
    color: #4CAF50;
  }
  .total-prize.final {
    font-size: 1.4rem;
  }
  .total-prize.final strong {
    font-size: 2rem;
  }
  .buttons {
    display: flex;
    gap: 0.8rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  .btn-play {
    padding: 0.8rem 2.5rem;
    background: linear-gradient(135deg, #ffd700, #f0c000);
    color: #1a237e;
    border: none;
    border-radius: 10px;
    font-family: 'Oswald', sans-serif;
    font-size: 1.2rem;
    font-weight: 700;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 2px;
    transition: transform 0.2s;
  }
  .btn-play:hover { transform: scale(1.05); }
  .btn-menu {
    padding: 0.8rem 2rem;
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.8);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 10px;
    font-family: 'Oswald', sans-serif;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-menu:hover { background: rgba(255,255,255,0.15); color: #fff; }


  @media (max-width: 480px) {
    h1 { font-size: 2rem; }
    .content { padding: 1.5rem; }
  }
</style>
