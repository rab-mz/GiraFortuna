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
  import { settings } from '../lib/stores/settingsStore.svelte.js';

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
</script>

<div class="mobile-app">
  <!-- Compact sticky header -->
  <header class="mobile-header">
    <button class="btn-menu" onclick={onGoToMenu} title="Menu">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    </button>
    <span class="header-title">Gira la Fortuna</span>
    <div class="header-right">
      {#if isOnline}
        <span class="online-badge">
          <span class="online-dot"></span>
          {online.roomCode}
        </span>
      {/if}
      {#if game.totalRounds > 1}
        <span class="round-badge">{game.currentRound}/{game.totalRounds}</span>
      {/if}
      <button class="btn-audio" onclick={onToggleAudio}>
        {settings.soundEnabled ? '🔊' : '🔇'}
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
        showTimer={true}
      />
      {#if isOnline && isMyTurn && game.phase !== 'spinning'}
        <span class="your-turn-pill">Il tuo turno!</span>
      {/if}
    {:else}
      <div class="single-score">
        <span class="score-amount">{game.currentPlayer.money.toLocaleString('it-IT')} €</span>
        {#if game.totalRounds > 1}
          <span class="score-total">Tot: {(game.totalScores[0] || 0).toLocaleString('it-IT')} €</span>
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

  <!-- Category (inline) -->
  <div class="category-line">
    <span class="cat-label">Categoria:</span>
    <span class="cat-value">{game.phraseObj.category}</span>
  </div>

  <!-- PuzzleBoard: always visible -->
  <PuzzleBoard
    phrase={game.phraseObj.text}
    revealedLetters={game.revealedLetters}
    jollyMode={game.phase === 'picking_jolly' && (!isOnline || isMyTurn)}
    jollyRevealedPositions={game.jollyRevealedPositions}
    onJollyPick={onUseJolly}
  />

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
          <p class="picker-hint">Valore: <strong>{game.currentSpinValue}€</strong> — scegli una consonante!</p>
        {/if}
        <LetterPicker
          mode={pickerMode}
          usedLetters={game.usedLetters}
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
    <div class="wheel-area">
      <Wheel
        segments={currentSegments}
        spinning={game.phase === 'spinning'}
        canSpin={game.canSpin && (!isOnline || isMyTurn)}
        forcedResult={isOnline ? forcedSpinIndex : null}
        onSpin={onStartSpin}
        onResult={onSpinResult}
      />
    </div>
  </div>

  <!-- Step hint (between wheel and action bar) -->
  {#if game.phase === 'idle' && (!isOnline || isMyTurn)}
    <p class="step-hint" in:fade={{ duration: 200 }}>
      {#if !game.consonantsLeft && !game.vowelsLeft}
        Tutte le lettere note — risolvi la frase!
      {:else if !game.consonantsLeft}
        Nessuna consonante rimasta — compra una vocale o risolvi!
      {:else if !game.hasSpunThisTurn}
        Gira la ruota per iniziare il turno
      {:else}
        Puoi girare di nuovo, comprare una vocale o risolvere
      {/if}
    </p>
  {/if}

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
      currentRound={game.currentRound}
      totalRounds={game.totalRounds}
      totalScores={game.totalScores}
      isGameOver={true}
      showActions={!isClient}
      onNextRound={onNextRound}
      onNewGame={onNewGame}
      onMenu={onGoToMenu}
    />
  {/if}
</div>

<style>
  .mobile-app {
    min-height: 100vh;
    min-height: 100dvh;
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
    padding: 0.35rem 0.5rem;
    background: rgba(13, 27, 74, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255,215,0,0.12);
    gap: 0.4rem;
  }
  .btn-menu {
    background: none;
    border: none;
    color: rgba(255,255,255,0.5);
    padding: 0.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .btn-menu:active {
    color: #ffd700;
  }
  .header-title {
    font-family: 'Oswald', sans-serif;
    color: #ffd700;
    font-size: 0.95rem;
    font-weight: 700;
    white-space: nowrap;
    letter-spacing: 0.5px;
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
    gap: 0.25rem;
    font-family: 'Oswald', sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    color: #ffd700;
    background: rgba(255,215,0,0.08);
    border: 1px solid rgba(255,215,0,0.2);
    border-radius: 5px;
    padding: 0.1rem 0.4rem;
    letter-spacing: 1.5px;
  }
  .online-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #4CAF50;
    flex-shrink: 0;
  }
  .round-badge {
    font-family: 'Oswald', sans-serif;
    font-size: 0.7rem;
    color: rgba(255,215,0,0.7);
    background: rgba(255,215,0,0.06);
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
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
    padding: 0.3rem 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .your-turn-pill {
    font-family: 'Oswald', sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    color: #4CAF50;
    background: rgba(76,175,80,0.15);
    border: 1px solid rgba(76,175,80,0.3);
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
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
    font-family: 'Oswald', sans-serif;
    font-size: 1.4rem;
    font-weight: 700;
    color: #ffd700;
    text-shadow: 0 0 8px rgba(255,215,0,0.3);
  }
  .score-total {
    font-family: 'Oswald', sans-serif;
    font-size: 0.8rem;
    color: #4CAF50;
    font-weight: 600;
  }

  /* --- Disconnect --- */
  .disconnect-banner {
    text-align: center;
    padding: 0.5rem;
    background: rgba(255,82,82,0.12);
    border: 1px solid rgba(255,82,82,0.3);
    color: #ff5252;
    font-family: 'Oswald', sans-serif;
    font-size: 0.9rem;
    margin: 0.3rem 0.5rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  .disconnect-btn {
    background: rgba(255,82,82,0.2);
    border: 1px solid rgba(255,82,82,0.4);
    color: #ff5252;
    padding: 0.25rem 0.8rem;
    border-radius: 5px;
    font-family: 'Oswald', sans-serif;
    font-size: 0.8rem;
    cursor: pointer;
  }

  /* --- Category --- */
  .category-line {
    text-align: center;
    padding: 0.25rem 0.5rem;
    font-family: 'Oswald', sans-serif;
  }
  .cat-label {
    color: rgba(255,255,255,0.4);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .cat-value {
    color: #ffd700;
    font-size: 0.95rem;
    font-weight: 600;
    margin-left: 0.3rem;
  }

  /* --- Phase Area --- */
  .phase-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.3rem 0.5rem;
    position: relative;
  }
  .wheel-area {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  /* --- Picker Area --- */
  .picker-area {
    width: 100%;
    padding: 0.3rem 0;
  }
  .picker-hint {
    text-align: center;
    font-family: 'Oswald', sans-serif;
    font-size: 0.95rem;
    color: #00e676;
    margin: 0 0 0.4rem;
    padding: 0.4rem 0.8rem;
    background: rgba(0,230,118,0.06);
    border: 1px solid rgba(0,230,118,0.2);
    border-radius: 8px;
  }
  .picker-hint strong {
    font-size: 1.1rem;
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
    background: linear-gradient(135deg, rgba(0,137,123,0.2), rgba(0,230,118,0.1));
    border: 2px solid rgba(0,230,118,0.4);
    border-radius: 12px;
    padding: 0.7rem 1.2rem;
    animation: jollyPulse 1.5s ease-in-out infinite;
    font-family: 'Oswald', sans-serif;
    font-size: 1rem;
    color: #00e676;
  }
  .jolly-icon {
    font-size: 1.5rem;
    font-weight: 700;
    color: #00897B;
    background: rgba(0,137,123,0.2);
    border-radius: 50%;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  @keyframes jollyPulse {
    0%, 100% { box-shadow: 0 0 8px rgba(0,230,118,0.1); }
    50% { box-shadow: 0 0 20px rgba(0,230,118,0.3); }
  }

  /* --- Step Hint --- */
  .step-hint {
    font-family: 'Inter', sans-serif;
    font-size: 0.78rem;
    color: rgba(255,215,0,0.55);
    text-align: center;
    padding: 0.3rem 0.6rem;
    margin: 0;
  }

  /* --- Sticky Bottom Action Bar --- */
  .action-bar {
    position: sticky;
    bottom: 0;
    z-index: 40;
    padding: 0.5rem 0.5rem;
    padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
    background: rgba(13, 27, 74, 0.95);
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(255,215,0,0.12);
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
    font-family: 'Oswald', sans-serif;
    font-size: 1rem;
    color: rgba(255,215,0,0.7);
    text-align: center;
    margin: 0;
    letter-spacing: 0.5px;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }
</style>
