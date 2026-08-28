<script>
  import { fly, fade, slide } from 'svelte/transition';
  import Wheel from './Wheel.svelte';
  import PuzzleBoard from './PuzzleBoard.svelte';
  import CategoryBanner from './CategoryBanner.svelte';
  import GameControls from './GameControls.svelte';
  import LetterPicker from './LetterPicker.svelte';
  import SolveModal from './SolveModal.svelte';
  import MessageToast from './MessageToast.svelte';
  import GameOverScreen from './GameOverScreen.svelte';
  import MobilePlayerStrip from './MobilePlayerStrip.svelte';
  import ScoreDisplay from './ScoreDisplay.svelte';
  import Icon from './Icon.svelte';
  import SpicchiLogo from './SpicchiLogo.svelte';
  import { settings } from '../lib/stores/settingsStore.svelte.js';
  import { formatEuro } from '../lib/utils/format.js';

  let {
    game,
    online,
    isOnline = false,
    isMyTurn = true,
    isHost = false,
    isClient = false,
    currentSegments = [],
    forcedSpinIndex = null,
    onStartSpin = () => {},
    onSpinResult = () => {},
    onPickConsonant = () => {},
    onBuyVowel = () => {},
    onStartBuyVowel = () => {},
    onStartSolve = () => {},
    onAttemptSolve = () => {},
    onCancelSolve = () => {},
    onUseJolly = () => {},
    onGoToMenu = () => {},
    onNextRound = () => {},
    onNewGame = () => {},
    onToggleAudio = () => {},
    isDailyMode = false,
    dailyResult = null,
    dailyStreak = 0,
    dailyShareText = '',
  } = $props();

  // Phase-based visibility
  let showPicker = $derived(
    (game.phase === 'picking_consonant' || game.phase === 'picking_vowel') &&
    (!isOnline || isMyTurn)
  );
  let showJolly = $derived(
    game.phase === 'picking_jolly' && (!isOnline || isMyTurn)
  );
  let showActionBar = $derived(
    game.phase === 'idle' && (!isOnline || isMyTurn)
  );
  let pickerMode = $derived(
    game.phase === 'picking_vowel' ? 'vowel' : 'consonant'
  );

  // Ruota grande come in Home: piena larghezza, tagliata sotto dalla barra dei
  // comandi. La finestra visibile si stringe quando servono le lettere, cosi'
  // la ruota "scende" invece di rimpicciolirsi.
  let wheelSize = $state(360);
  $effect(() => {
    const update = () => { wheelSize = Math.min(Math.round(window.innerWidth * 1.45), 560); };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  });

  // Waiting message when it's the opponent's turn (online only)
  let opponentName = $derived(game.currentPlayer?.name ?? '');
  let waitingMessage = $derived(() => {
    if (!isOnline || isMyTurn) return null;
    switch (game.phase) {
      case 'spinning': return `${opponentName} sta girando la ruota...`;
      case 'picking_consonant': return `${opponentName} sta scegliendo una consonante...`;
      case 'picking_vowel': return `${opponentName} sta comprando una vocale...`;
      case 'picking_jolly': return `${opponentName} sta usando il Jolly...`;
      case 'solving': return `${opponentName} sta provando a risolvere...`;
      case 'idle': return `Turno di ${opponentName}`;
      default: return null;
    }
  });
  let showWaiting = $derived(isOnline && !isMyTurn && waitingMessage() !== null);


  // Timer visibile (anello sull'avatar attivo) solo nelle fasi in cui conta
  let timerRunning = $derived(
    game.isMultiplayer &&
    game.turnTimer > 0 &&
    ['idle', 'picking_consonant', 'picking_vowel', 'picking_jolly', 'solving'].includes(game.phase)
  );
</script>

<div class="mobile-app">
  <!-- Compact sticky header -->
  <header class="mobile-header">
    <button class="btn-menu" onclick={onGoToMenu} title="Menu">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    </button>
    <div class="header-brand">
      <SpicchiLogo size={18} />
      <span class="header-title">Gira la Fortuna</span>
    </div>
    <div class="header-right">
      {#if isOnline}
        <span class="online-badge">
          <span class="online-dot"></span>
          {online.roomCode}
        </span>
      {/if}
      {#if game.totalRounds > 1}
        <span class="round-badge">R. {game.currentRound}/{game.totalRounds}</span>
      {/if}
      <button class="btn-audio" onclick={onToggleAudio}>
        <Icon name={settings.soundEnabled ? 'audio-on' : 'audio-off'} size={17} />
      </button>
    </div>
  </header>

  <!-- Player strip / Score -->
  <div class="player-area">
    {#if game.isMultiplayer}
      <MobilePlayerStrip
        players={game.players}
        currentIndex={game.currentPlayerIndex}
        totalScores={game.totalScores}
        showTotal={game.totalRounds > 1}
        isMultiplayer={true}
        turnTimer={game.turnTimer}
        timerTotal={settings.timerSeconds}
        showTimer={timerRunning}
      />
      {#if isOnline && isMyTurn && game.phase !== 'spinning'}
        <span class="your-turn-pill">Il tuo turno!</span>
      {/if}
    {:else}
      <div class="single-score">
        <span class="score-amount">{formatEuro(game.currentPlayer.money)}</span>
        {#if game.totalRounds > 1}
          <span class="score-total">Tot: {formatEuro(game.totalScores[0] || 0)}</span>
        {/if}
      </div>
    {/if}
  </div>

  {#if online.hostDisconnected}
    <div class="disconnect-banner">
      L'host si e' disconnesso.
      <button class="disconnect-btn" onclick={onGoToMenu}>Torna al Menu</button>
    </div>
  {/if}

  <!-- Category -->
  <div class="category-line">
    <CategoryBanner category={game.phraseObj.category} />
  </div>

  <!-- PuzzleBoard: always visible -->
  <PuzzleBoard
    phrase={game.phraseObj.text}
    revealedLetters={game.revealedLetters}
    jollyMode={game.phase === 'picking_jolly' && (!isOnline || isMyTurn)}
    jollyRevealedPositions={game.jollyRevealedPositions}
    onJollyPick={onUseJolly}
  />

  <!-- Step hint sopra la ruota. Lo spazio resta occupato anche quando il
       messaggio non c'e', altrimenti al via del giro la ruota fa un salto. -->
  <div class="hint-slot">
    {#if game.phase === 'idle' && (!isOnline || isMyTurn)}
      <p class="step-hint" in:fade={{ duration: 200 }}>
        {#if !game.consonantsLeft && !game.vowelsLeft}
          Tutte le lettere sono note: risolvi la frase
        {:else if !game.consonantsLeft}
          Niente più consonanti: compra una vocale o risolvi
        {:else if !game.hasSpunThisTurn}
          Gira la ruota per iniziare il turno
        {:else}
          Puoi girare di nuovo, comprare una vocale o risolvere
        {/if}
      </p>
    {/if}
  </div>

  <!-- Phase-conditional content area -->
  <div class="phase-area">
    {#if showJolly}
      <div class="jolly-area" in:fade={{ duration: 200 }} out:fade={{ duration: 150 }}>
        <div class="jolly-banner">
          <span class="jolly-icon">J</span>
          <span>JOLLY! Tocca una lettera nascosta!</span>
        </div>
      </div>
    {/if}

    {#if showPicker}
      <div class="picker-area" in:slide={{ duration: 250, delay: 100 }} out:slide={{ duration: 200 }}>
        {#if game.phase === 'picking_consonant'}
          <p class="picker-hint">Vale <strong>{formatEuro(game.currentSpinValue)}</strong> a lettera: scegli una consonante</p>
        {/if}
        <LetterPicker
          mode={pickerMode}
          usedLetters={game.usedLetters}
          showHint={pickerMode === 'vowel'}
          onPick={pickerMode === 'vowel' ? onBuyVowel : onPickConsonant}
        />
      </div>
    {/if}

    {#if showWaiting}
      <div class="waiting-area" in:fade={{ duration: 250 }} out:fade={{ duration: 150 }}>
        <p class="waiting-text">{waitingMessage()}</p>
      </div>
    {/if}

    <!-- Wheel: always visible to prevent canvas freeze from mount/unmount -->
    <div class="wheel-stage">
      <div class="wheel-holder">
        <Wheel
          segments={currentSegments}
          spinning={game.phase === 'spinning'}
          canSpin={game.canSpin && (!isOnline || isMyTurn)}
          forcedResult={forcedSpinIndex}
          size={wheelSize}
          onSpin={onStartSpin}
          onResult={onSpinResult}
        />
      </div>
    </div>
  </div>


  <!-- La sfumatura resta sempre in fondo: e' lei a far "uscire" la ruota dallo schermo -->
  <div class="bottom-fade" aria-hidden="true"></div>

  <!-- Sticky bottom action bar -->
  {#if showActionBar}
    <div class="action-bar" in:fly={{ y: 60, duration: 250 }} out:fly={{ y: 60, duration: 200 }}>
      <GameControls
        canSpin={game.canSpin && (!isOnline || isMyTurn)}
        canBuyVowel={game.canBuyVowel && (!isOnline || isMyTurn)}
        canSolve={game.canSolve && (!isOnline || isMyTurn)}
        showBuyVowel={game.vowelsLeft && !game.hasBoughtVowelThisRound}
        onSpin={onStartSpin}
        onBuyVowel={onStartBuyVowel}
        onSolve={onStartSolve}
        playerName={game.isMultiplayer ? game.currentPlayer.name : ''}
      />
    </div>
  {/if}

  <!-- Toast -->
  <MessageToast message={game.message} />

  <!-- Modals/Overlays -->
  <SolveModal
    open={game.phase === 'solving' && (!isOnline || isMyTurn)}
    phrase={game.phraseObj.text}
    revealedLetters={game.revealedLetters}
    jollyRevealedPositions={game.jollyRevealedPositions}
    onSubmit={onAttemptSolve}
    onCancel={onCancelSolve}
  />

  {#if game.phase === 'round_won'}
    <GameOverScreen
      winner={game.roundWinner}
      players={game.players}
      isMultiplayer={game.isMultiplayer}
      phrase={game.phraseObj.text}
      category={game.phraseObj.category}
      song={game.phraseObj.song}
      currentRound={game.currentRound}
      totalRounds={game.totalRounds}
      totalScores={game.totalScores}
      isGameOver={false}
      showActions={!isClient}
      onNextRound={onNextRound}
      onNewGame={onNewGame}
      onMenu={onGoToMenu}
    />
  {/if}

  {#if game.phase === 'game_over'}
    <GameOverScreen
      winner={game.roundWinner}
      players={game.players}
      isMultiplayer={game.isMultiplayer}
      phrase={game.phraseObj.text}
      category={game.phraseObj.category}
      song={game.phraseObj.song}
      currentRound={game.currentRound}
      totalRounds={game.totalRounds}
      totalScores={game.totalScores}
      isGameOver={true}
      showActions={!isClient}
      isDailyGame={isDailyMode}
      {dailyResult}
      {dailyStreak}
      {dailyShareText}
      onNextRound={onNextRound}
      onNewGame={onNewGame}
      onMenu={onGoToMenu}
    />
  {/if}
</div>

<style>
  .mobile-app {
    /* altezza fissa: la ruota deborda dal fondo di proposito, e senza questo
       il contenuto in eccesso farebbe scrollare la pagina */
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  /* --- Sticky Header --- */
  .mobile-header {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    padding: 0.45rem 0.6rem;
    background: rgba(10, 14, 35, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--glass-border);
    gap: 0.4rem;
  }
  .btn-menu {
    background: none;
    border: none;
    color: rgba(244,242,255,0.6);
    padding: 0.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .btn-menu:active {
    color: var(--amber);
  }
  .header-brand {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
  }
  .header-title {
    font-family: var(--font-display);
    color: var(--text);
    font-size: 0.72rem;
    font-weight: 700;
    white-space: nowrap;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-left: auto;
  }
  .online-badge {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-family: var(--font-ui);
    font-size: 0.74rem;
    font-weight: 600;
    color: var(--mint);
  }
  .online-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--mint);
    flex-shrink: 0;
  }
  .round-badge {
    font-family: var(--font-ui);
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--text-dim);
    padding: 0.1rem 0.2rem;
    white-space: nowrap;
  }
  .btn-audio {
    background: none;
    border: none;
    font-size: 0.95rem;
    padding: 0.15rem;
    cursor: pointer;
    line-height: 1;
  }

  /* --- Player Area --- */
  .player-area {
    padding: 0.4rem 0.6rem 0;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .your-turn-pill {
    font-family: var(--font-ui);
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--mint);
    white-space: nowrap;
    animation: pulse 1.5s ease-in-out infinite;
    flex-shrink: 0;
  }
  .single-score {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    padding: 0.2rem 0;
    width: 100%;
    justify-content: center;
  }
  .score-amount {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--amber);
  }
  .score-total {
    font-family: var(--font-ui);
    font-size: 0.78rem;
    color: var(--mint);
    font-weight: 600;
  }

  /* --- Disconnect --- */
  .disconnect-banner {
    text-align: center;
    padding: 0.5rem;
    background: rgba(255,93,115,0.1);
    border: 1px solid rgba(255,93,115,0.35);
    color: var(--coral);
    font-family: var(--font-ui);
    font-weight: 600;
    font-size: 0.85rem;
    margin: 0.3rem 0.6rem;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  .disconnect-btn {
    background: rgba(255,93,115,0.15);
    border: 1px solid rgba(255,93,115,0.4);
    color: var(--coral);
    padding: 0.25rem 0.8rem;
    border-radius: 8px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 0.78rem;
    cursor: pointer;
  }

  /* --- Category --- */
  .category-line {
    padding: 0.5rem 0.6rem 0.1rem;
  }

  /* --- Phase Area --- */
  .phase-area {
    flex: 1;
    min-height: 0; /* senza questo il flex item cresce con la ruota e la pagina scrolla */
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.3rem 0.5rem;
    position: relative;
  }
  /* La ruota riempie lo spazio che resta e viene tagliata dal bordo della barra
     comandi: quando compaiono le lettere lo spazio si riduce e la ruota "scende"
     da sola, senza misure fisse che cambiano da telefono a telefono. */
  /* La ruota non viene ritagliata: esce dal fondo dello schermo, come in Home.
     Quando compare qualcosa in mezzo (le lettere, il Jolly) lo spazio si
     riduce e la ruota scivola giu' da sola. */
  /* La ruota parte poco sotto il tabellone ed e' piu' grande dello spazio che
     resta: quel che avanza esce dal fondo dello schermo. Quando in mezzo
     compaiono le lettere lo spazio si riduce e la ruota scende da sola. */
  .wheel-stage {
    width: 100%;
    flex: 1;
    min-height: 90px;
    padding-top: 40px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    overflow: hidden;
  }
  .wheel-holder {
    flex-shrink: 0;
  }

  /* --- Picker Area --- */
  .picker-area {
    width: 100%;
    padding: 0.3rem 0;
    /* sopra la sfumatura in fondo: sugli schermi bassi le ultime lettere
       finivano dentro il gradiente e si leggevano a malapena */
    position: relative;
    z-index: 41;
  }
  .picker-hint {
    text-align: center;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 0.98rem;
    line-height: 1.3;
    color: var(--mint);
    margin: 0 0 0.5rem;
    padding: 0.2rem 0.6rem;
  }
  .picker-hint strong {
    font-family: var(--font-display);
    font-size: 0.95rem;
  }

  /* --- Jolly Area --- */
  .jolly-area {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 1rem 0;
  }
  .jolly-banner {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    background: rgba(51,214,181,0.1);
    border: 1.5px solid rgba(51,214,181,0.45);
    border-radius: 14px;
    padding: 0.7rem 1.2rem;
    animation: jollyPulse 1.5s ease-in-out infinite;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--mint);
  }
  .jolly-icon {
    font-size: 1.2rem;
    font-weight: 700;
    font-family: var(--font-display);
    color: var(--mint);
    background: rgba(51,214,181,0.15);
    border-radius: 50%;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  @keyframes jollyPulse {
    0%, 100% { box-shadow: 0 0 8px rgba(51,214,181,0.1); }
    50% { box-shadow: 0 0 20px rgba(51,214,181,0.3); }
  }

  /* --- Step Hint --- */
  .hint-slot {
    min-height: 2.6rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .step-hint {
    font-family: var(--font-display);
    font-size: 0.98rem;
    font-weight: 500;
    line-height: 1.3;
    color: var(--amber);
    text-align: center;
    padding: 0.35rem 0.6rem;
    margin: 0;
  }

  /* --- Sticky Bottom Action Bar --- */
  .bottom-fade {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: calc(205px + env(safe-area-inset-bottom, 0px));
    z-index: 39;
    pointer-events: none;
    background: linear-gradient(
      to top,
      rgba(10, 14, 35, 0.98) 45%,
      rgba(10, 14, 35, 0.85) 72%,
      rgba(10, 14, 35, 0)
    );
  }
  .action-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 40;
    padding: 1.6rem 0.6rem 1.5rem;
    padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
    background: none;
  }

  /* --- Waiting for opponent --- */
  .waiting-area {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    padding: 2rem 1rem;
  }
  .waiting-text {
    font-family: var(--font-ui);
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--text-dim);
    text-align: center;
    margin: 0;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }
</style>
