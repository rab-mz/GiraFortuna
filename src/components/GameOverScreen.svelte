<script>
  import { fly, scale } from 'svelte/transition';
  import DailyResultCard from './DailyResultCard.svelte';
  import { shareOrCopy } from '../lib/utils/share.js';

  let {
    winner = { name: '', money: 0 },
    players = [],
    isMultiplayer = false,
    phrase = '',
    category = '',
    song = null,
    currentRound = 1,
    totalRounds = 1,
    totalScores = [],
    isGameOver = false,
    showActions = true,
    isDailyGame = false,
    dailyResult = null,
    dailyStreak = 0,
    dailyShareText = '',
    onNextRound = () => {},
    onNewGame = () => {},
    onMenu = () => {},
  } = $props();

  let shareFeedback = $state('');
  let canShare = $derived(typeof navigator !== 'undefined' && !!navigator.share);

  function buildShareText() {
    if (isMultiplayer) {
      const topPlayer = sortedPlayers[0];
      return `🎡 Gira la Fortuna\n🏆 ${topPlayer.name} vince con ${topPlayer.total.toLocaleString('it-IT')}€!\n\ngiralafortuna.it`;
    }
    const score = totalRounds > 1 ? (totalScores[0] || 0) : winner.money;
    let text = `🎡 Gira la Fortuna\n💰 Ho vinto ${score.toLocaleString('it-IT')}€!`;
    if (category) {
      text += `\n🎯 ${category}`;
    }
    text += `\n\ngiralafortuna.it`;
    return text;
  }

  async function handleShare() {
    const result = await shareOrCopy(buildShareText());
    if (result === 'cancelled') return;
    shareFeedback = result === 'shared' ? 'Condiviso!' : 'Copiato!';
    setTimeout(() => { shareFeedback = ''; }, 2500);
  }

  let sortedPlayers = $derived(
    [...players].map((p, i) => ({ ...p, total: totalScores[i] || 0 }))
      .sort((a, b) => b.total - a.total)
  );

  let roundSortedPlayers = $derived(
    [...players].sort((a, b) => b.money - a.money)
  );

  // Auto-advance countdown between rounds
  let hasMoreRounds = $derived(!isGameOver && currentRound < totalRounds);
  // Sul palco dopo il reveal si canta: l'avanzamento automatico a 5 secondi
  // lo decide il conduttore, non il timer.
  let autoAdvance = $derived(hasMoreRounds && !song);
  let countdown = $state(5);
  let countdownInterval = null;

  function skipCountdown() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    onNextRound();
  }

  $effect(() => {
    if (autoAdvance) {
      countdown = 5;
      countdownInterval = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          countdownInterval = null;
          if (showActions) onNextRound();
        }
      }, 1000);
      return () => {
        if (countdownInterval) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }
      };
    }
  });
</script>

<div class="overlay" transition:fly={{ y: 50, duration: 400 }}>
  <div class="content" transition:scale={{ duration: 400, delay: 200 }}>

    {#if isGameOver}
      <!-- Final game over -->
      <h1>{isDailyGame ? 'COMPLIMENTI!' : 'FINE DEL GIOCO!'}</h1>
      <p class="phrase">"{phrase}"</p>

      {#if song}
        <div class="song-card">
          <span class="song-label">{isMultiplayer ? 'Ora si canta' : 'La canzone era'}</span>
          <span class="song-title">{phrase}</span>
          <span class="song-film">dal film {song.film}</span>
        </div>
      {/if}

      {#if isDailyGame && dailyResult}
        <DailyResultCard
          result={dailyResult}
          streak={dailyStreak}
          shareText={dailyShareText}
        />
        <div class="buttons">
          <button class="btn-menu" onclick={onMenu}>Menu</button>
        </div>
      {:else if isMultiplayer}
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
        <button class="btn-share" onclick={handleShare}>
          {#if shareFeedback}
            {shareFeedback}
          {:else}
            {canShare ? 'CONDIVIDI' : 'COPIA RISULTATO'}
          {/if}
        </button>
        <div class="buttons">
          {#if showActions}
            <button class="btn-play" onclick={onNewGame}>Gioca Ancora</button>
          {/if}
          <button class="btn-menu" onclick={onMenu}>Esci</button>
        </div>
      {:else}
        <p class="prize">Vincita ultimo round: <strong>{winner.money.toLocaleString('it-IT')} €</strong></p>
        {#if totalRounds > 1}
          <p class="prize total-prize final">Totale finale: <strong>{(totalScores[0] || 0).toLocaleString('it-IT')} €</strong></p>
        {/if}
        <button class="btn-share" onclick={handleShare}>
          {#if shareFeedback}
            {shareFeedback}
          {:else}
            {canShare ? 'CONDIVIDI' : 'COPIA RISULTATO'}
          {/if}
        </button>
        <div class="buttons">
          {#if showActions}
            <button class="btn-play" onclick={onNewGame}>Gioca Ancora</button>
          {/if}
          <button class="btn-menu" onclick={onMenu}>Esci</button>
        </div>
      {/if}

    {:else}
      <!-- Round won -->
      <div class="round-badge">{song ? 'Frase' : 'Round'} {currentRound} di {totalRounds}</div>
      <h1>{isMultiplayer ? `${winner.name} HA VINTO!` : 'HAI VINTO!'}</h1>
      <p class="phrase">"{phrase}"</p>

      {#if song}
        <div class="song-card">
          <span class="song-label">{isMultiplayer ? 'Ora si canta' : 'La canzone era'}</span>
          <span class="song-title">{phrase}</span>
          <span class="song-film">dal film {song.film}</span>
        </div>
      {/if}

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

      {#if autoAdvance}
        <div class="countdown-bar">
          <span class="countdown-text">Prossimo round tra <strong>{countdown}</strong>s</span>
          <div class="countdown-track">
            <div class="countdown-fill" style="width: {(countdown / 5) * 100}%"></div>
          </div>
          {#if showActions}
            <button class="btn-skip" onclick={skipCountdown}>Avanti</button>
          {/if}
        </div>
      {:else}
        <div class="buttons">
          {#if showActions}
            <button class="btn-play" onclick={onNextRound}>{song ? 'Frase successiva' : 'Round Successivo'}</button>
          {/if}
          <button class="btn-menu" onclick={onMenu}>Esci</button>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(4, 6, 18, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 300;
    backdrop-filter: blur(8px);
    padding: 1rem;
  }
  .content {
    text-align: center;
    padding: 2.5rem;
    max-width: 460px;
    width: 94%;
    max-height: 92vh;
    overflow-y: auto;
    background: var(--indigo);
    border: 1px solid var(--glass-border-strong);
    border-radius: var(--radius-lg);
    box-shadow: 0 12px 50px rgba(0,0,0,0.5);
  }
  .round-badge {
    display: inline-block;
    color: var(--amber);
    font-family: var(--font-ui);
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.6rem;
  }
  .song-card {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    align-items: center;
    padding: 1.1rem 1.4rem;
    margin: 0 0 1.2rem;
    border-radius: var(--radius);
    background: rgba(245,182,63,0.08);
    border: 1px solid rgba(245,182,63,0.35);
  }
  .song-label {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--text-faint);
  }
  .song-title {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.5rem;
    line-height: 1.15;
    color: var(--amber);
    text-align: center;
  }
  .song-film {
    font-family: var(--font-ui);
    font-size: 1rem;
    color: var(--text-dim);
  }

  h1 {
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 900;
    color: var(--amber);
    margin: 0 0 0.8rem;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .phrase {
    font-family: var(--font-ui);
    color: var(--text);
    font-size: 1.1rem;
    margin-bottom: 1.2rem;
    font-style: italic;
  }
  .prize {
    color: rgba(244,242,255,0.7);
    font-family: var(--font-ui);
    font-size: 1rem;
    margin-bottom: 1.2rem;
  }
  .prize strong {
    font-family: var(--font-display);
    font-size: 1.6rem;
    color: var(--amber);
    display: block;
    margin-top: 0.2rem;
  }
  .leaderboard {
    margin: 1rem 0 1.5rem;
    text-align: left;
  }
  .leaderboard h3 {
    font-family: var(--font-ui);
    color: var(--text-faint);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 0.5rem;
    text-align: center;
  }
  .lb-row {
    display: flex;
    align-items: center;
    padding: 0.6rem 0.9rem;
    border-radius: 12px;
    margin-bottom: 0.35rem;
    background: var(--glass);
    border: 1px solid var(--glass-border);
  }
  .lb-row.winner {
    background: rgba(245,182,63,0.08);
    border: 1.5px solid rgba(245,182,63,0.55);
  }
  .lb-pos {
    font-family: var(--font-display);
    color: var(--text-faint);
    width: 2rem;
    font-size: 0.9rem;
    font-weight: 700;
  }
  .lb-row.winner .lb-pos {
    color: var(--amber);
  }
  .lb-name {
    flex: 1;
    font-family: var(--font-ui);
    color: rgba(244,242,255,0.8);
    font-size: 0.95rem;
    font-weight: 600;
  }
  .lb-row.winner .lb-name {
    color: var(--text);
    font-weight: 700;
  }
  .lb-money {
    font-family: var(--font-display);
    color: var(--amber);
    font-size: 1rem;
    font-weight: 700;
  }
  .lb-money.total-money {
    color: var(--mint);
  }
  .leaderboard.totals {
    margin-top: 0.5rem;
    padding-top: 0.8rem;
    border-top: 1px solid var(--glass-border);
  }
  .total-prize {
    color: rgba(244,242,255,0.7);
    font-size: 0.95rem;
  }
  .total-prize strong {
    color: var(--mint);
    font-size: 1.3rem;
  }
  .total-prize.final {
    font-size: 1rem;
  }
  .total-prize.final strong {
    font-size: 1.7rem;
  }
  .buttons {
    display: flex;
    gap: 0.8rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  .btn-play {
    padding: 0.85rem 2.2rem;
    background: var(--amber);
    color: var(--ink);
    border: none;
    border-radius: 14px;
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.2s;
    box-shadow: 0 8px 24px rgba(245,182,63,0.3);
  }
  .btn-play:hover {
    background: var(--amber-bright);
    transform: scale(1.04);
  }
  .btn-menu {
    padding: 0.85rem 1.8rem;
    background: var(--glass-strong);
    color: rgba(244,242,255,0.8);
    border: 1px solid var(--glass-border-strong);
    border-radius: 14px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 0.92rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-menu:hover {
    background: rgba(244,242,255,0.1);
    color: var(--text);
  }

  .btn-share {
    display: block;
    width: 100%;
    padding: 0.8rem;
    background: rgba(245,182,63,0.08);
    color: var(--amber);
    border: 1.5px solid rgba(245,182,63,0.45);
    border-radius: 14px;
    font-family: var(--font-ui);
    font-size: 0.92rem;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 1.5px;
    transition: all 0.2s;
    margin-bottom: 1rem;
  }
  .btn-share:hover {
    transform: translateY(-1px);
    background: rgba(245,182,63,0.15);
    box-shadow: 0 4px 16px rgba(245,182,63,0.15);
  }
  .btn-share:active {
    transform: scale(0.98);
  }

  /* Countdown between rounds */
  .countdown-bar {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  .countdown-text {
    font-family: var(--font-ui);
    font-size: 0.92rem;
    color: var(--text-dim);
  }
  .countdown-text strong {
    color: var(--amber);
    font-family: var(--font-display);
    font-size: 1.05rem;
  }
  .countdown-track {
    width: 100%;
    max-width: 200px;
    height: 4px;
    background: rgba(244,242,255,0.1);
    border-radius: 2px;
    overflow: hidden;
  }
  .countdown-fill {
    height: 100%;
    background: var(--amber);
    border-radius: 2px;
    transition: width 1s linear;
  }
  .btn-skip {
    margin-top: 0.4rem;
    padding: 0.45rem 1.6rem;
    background: var(--glass-strong);
    color: rgba(244,242,255,0.7);
    border: 1px solid var(--glass-border-strong);
    border-radius: 12px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 0.85rem;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-skip:hover {
    background: rgba(245,182,63,0.1);
    color: var(--amber);
    border-color: rgba(245,182,63,0.35);
  }

  @media (max-width: 480px) {
    h1 { font-size: 1.4rem; }
    .content { padding: 1.5rem; }
  }
</style>
