<script>
  import { game } from './lib/stores/gameStore.svelte.js';
  import { online } from './lib/stores/onlineStore.svelte.js';
  import { sound } from './lib/audio/soundEngine.js';
  import { segments } from './lib/logic/wheelSegments.js';
  import StartScreen from './components/StartScreen.svelte';
  import Wheel from './components/Wheel.svelte';
  import PuzzleBoard from './components/PuzzleBoard.svelte';
  import CategoryBanner from './components/CategoryBanner.svelte';
  import ScoreDisplay from './components/ScoreDisplay.svelte';
  import PlayersBar from './components/PlayersBar.svelte';
  import GameControls from './components/GameControls.svelte';
  import LetterPicker from './components/LetterPicker.svelte';
  import SolveModal from './components/SolveModal.svelte';
  import MessageToast from './components/MessageToast.svelte';
  import GameOverScreen from './components/GameOverScreen.svelte';
  import CookieBanner from './components/CookieBanner.svelte';
  import { settings } from './lib/stores/settingsStore.svelte.js';

  let forcedSpinIndex = $state(null);

  // Sync audio mute state from settings
  $effect(() => {
    sound.setMuted(!settings.soundEnabled);
  });

  function toggleAudio() {
    settings.soundEnabled = !settings.soundEnabled;
  }

  // Init audio context on first interaction
  let audioInited = false;
  function initAudio() {
    if (!audioInited) {
      sound.getCtx();
      audioInited = true;
    }
  }

  // --- Online mode helpers ---
  let isHost = $derived(online.mode === 'host');
  let isClient = $derived(online.mode === 'client');
  let isOnline = $derived(online.mode !== 'offline');

  // Host: broadcast state after any action (without phrase text)
  function hostBroadcast() {
    if (!isHost) return;
    const state = game.getSerializableState();
    // Don't leak the phrase — clients already have it from game_start
    state.phraseObj = { category: state.phraseObj.category };
    online.broadcastState(state);
  }

  // Determine if this client's turn (name matches current player)
  let isMyTurn = $derived(
    !isOnline ||
    (isHost && game.currentPlayer.name === online.myName) ||
    (isClient && game.currentPlayer.name === online.myName)
  );

  // --- Wrapped game actions ---
  function handleStartSpin() {
    if (isClient) {
      online.sendAction('startSpin');
      return;
    }
    if (isHost) {
      // Pre-determine spin result so we can broadcast it immediately
      const winIndex = Math.floor(Math.random() * segments.length);
      forcedSpinIndex = winIndex;
      game.setSpinIndex(winIndex);
    }
    game.startSpin();
    if (isHost) hostBroadcast();
  }

  function handleSpinResult(segment, winIndex) {
    if (isClient) {
      // Client ignores local spin result; state comes from host
      forcedSpinIndex = null;
      return;
    }
    game.handleSpinResult(segment, winIndex);
    if (isHost) hostBroadcast();
    forcedSpinIndex = null;
  }

  function handlePickConsonant(letter) {
    if (isClient) {
      online.sendAction('pickConsonant', { letter });
      return;
    }
    game.pickConsonant(letter);
    if (isHost) hostBroadcast();
  }

  function handleBuyVowel(letter) {
    if (isClient) {
      online.sendAction('buyVowel', { letter });
      return;
    }
    game.buyVowel(letter);
    if (isHost) hostBroadcast();
  }

  function handleStartBuyVowel() {
    if (isClient) {
      online.sendAction('startBuyVowel');
      return;
    }
    game.startBuyVowel();
    if (isHost) hostBroadcast();
  }

  function handleStartSolve() {
    if (isClient) {
      online.sendAction('startSolve');
      return;
    }
    game.startSolve();
    if (isHost) hostBroadcast();
  }

  function handleAttemptSolve(guess) {
    if (isClient) {
      online.sendAction('attemptSolve', { guess });
      return;
    }
    game.attemptSolve(guess);
    if (isHost) hostBroadcast();
  }

  function handleCancelSolve() {
    if (isClient) {
      online.sendAction('cancelSolve');
      return;
    }
    game.cancelSolve();
    if (isHost) hostBroadcast();
  }

  function handleUseJolly(absoluteIndex) {
    if (isClient) {
      online.sendAction('useJolly', { index: absoluteIndex });
      return;
    }
    game.useJolly(absoluteIndex);
    if (isHost) hostBroadcast();
  }

  function handleNextRound() {
    if (isClient) return;
    game.nextRound();
    if (isHost) {
      // New round = new phrase, must send full state (hostBroadcast strips phrase text)
      online.broadcastGameStart(game.getSerializableState());
    }
  }

  function handleNewGame() {
    if (isClient) return;
    game.newGame();
    if (isHost) {
      online.broadcastGameStart(game.getSerializableState());
    }
  }

  function handleGoToMenu() {
    game.goToMenu();
    if (isOnline) {
      online.leaveRoom();
    }
  }

  // --- Online start (host starts the game) ---
  function handleOnlineStart(playerNames, rounds) {
    game.startGame(playerNames, rounds);
    online.broadcastGameStart(game.getSerializableState());
  }

  // --- Setup online listeners ---
  // Host: listen for player actions
  online.onPlayerAction((payload) => {
    const { action, data } = payload;
    switch (action) {
      case 'startSpin': {
        const winIndex = Math.floor(Math.random() * segments.length);
        forcedSpinIndex = winIndex;
        game.setSpinIndex(winIndex);
        game.startSpin();
        hostBroadcast();
        break;
      }
      case 'pickConsonant':
        game.pickConsonant(data.letter);
        hostBroadcast();
        break;
      case 'buyVowel':
        game.buyVowel(data.letter);
        hostBroadcast();
        break;
      case 'startBuyVowel':
        game.startBuyVowel();
        hostBroadcast();
        break;
      case 'startSolve':
        game.startSolve();
        hostBroadcast();
        break;
      case 'attemptSolve':
        game.attemptSolve(data.guess);
        hostBroadcast();
        break;
      case 'cancelSolve':
        game.cancelSolve();
        hostBroadcast();
        break;
      case 'useJolly':
        game.useJolly(data.index);
        hostBroadcast();
        break;
    }
  });

  // Client: listen for state updates
  online.onStateUpdate((remoteState) => {
    // Pick up spin index before applying state, so the Wheel gets it in time
    if (remoteState.lastSpinIndex != null) {
      forcedSpinIndex = remoteState.lastSpinIndex;
    }

    game.applyRemoteState(remoteState);
  });

  // Client: listen for game start
  online.onGameStart((remoteState) => {
    game.startGameFromState(remoteState);
  });

  // Host: broadcast when timer expires (nextTurn was called inside gameStore)
  game.onTimerExpired(() => {
    if (isHost) hostBroadcast();
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div onclick={initAudio}>
{#if game.phase === 'menu'}
  <StartScreen
    onStart={(names, rounds) => game.startGame(names, rounds)}
    onOnlineStart={handleOnlineStart}
  />
{:else}
  <div class="app">
    <header>
      <div class="header-top">
        <button class="btn-menu" onclick={handleGoToMenu} title="Torna al menu">← Menu</button>
        <h1>Gira Fortuna</h1>
        <div class="header-right">
          {#if isOnline}
            <span class="online-indicator">
              ONLINE
            </span>
          {/if}
          {#if game.totalRounds > 1}
            <span class="round-indicator">Round {game.currentRound}/{game.totalRounds}</span>
          {/if}
          <button class="btn-audio" onclick={toggleAudio} title={settings.soundEnabled ? 'Disattiva suoni' : 'Attiva suoni'}>
            {settings.soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>
      {#if game.isMultiplayer}
        <PlayersBar
          players={game.players}
          currentIndex={game.currentPlayerIndex}
          totalScores={game.totalScores}
          showTotal={game.totalRounds > 1}
        />
      {:else}
        <ScoreDisplay
          money={game.currentPlayer.money}
          totalScore={game.totalScores[0] || 0}
          showTotal={game.totalRounds > 1}
        />
      {/if}
    </header>

    {#if game.isMultiplayer}
      <div class="turn-banner">
        Turno di <strong>{game.currentPlayer.name}</strong>
        {#if isOnline && isMyTurn}
          <span class="your-turn-badge">Il tuo turno!</span>
        {/if}
        <span class="timer" class:timer-warning={game.turnTimer <= 10}>{game.turnTimer}s</span>
      </div>
    {/if}

    {#if online.hostDisconnected}
      <div class="disconnect-banner">
        L'host si e' disconnesso. La partita e' terminata.
        <button class="back-to-menu-btn" onclick={handleGoToMenu}>Torna al Menu</button>
      </div>
    {/if}

    <main>
      <CategoryBanner category={game.phraseObj.category} />

      <PuzzleBoard
        phrase={game.phraseObj.text}
        revealedLetters={game.revealedLetters}
        jollyMode={game.phase === 'picking_jolly' && (!isOnline || isMyTurn)}
        jollyRevealedPositions={game.jollyRevealedPositions}
        onJollyPick={handleUseJolly}
      />

      {#if game.phase === 'picking_jolly' && (!isOnline || isMyTurn)}
        <div class="jolly-overlay">
          <div class="jolly-banner">
            <span class="jolly-icon">J</span>
            <span>JOLLY! Scegli una lettera sulla frase!</span>
          </div>
        </div>
      {/if}

      {#if game.phase === 'picking_consonant' && (!isOnline || isMyTurn)}
        <div class="picker-mobile">
          <LetterPicker
            mode="consonant"
            usedLetters={game.usedLetters}
            onPick={handlePickConsonant}
          />
        </div>
      {/if}

      {#if game.phase === 'picking_vowel' && (!isOnline || isMyTurn)}
        <div class="picker-mobile">
          <LetterPicker
            mode="vowel"
            usedLetters={game.usedLetters}
            onPick={handleBuyVowel}
          />
        </div>
      {/if}

      <div class="game-area">
        <Wheel
          spinning={game.phase === 'spinning'}
          canSpin={game.canSpin && (!isOnline || isMyTurn)}
          forcedResult={isOnline ? forcedSpinIndex : null}
          onSpin={handleStartSpin}
          onResult={handleSpinResult}
        />

        <div class="actions">
          <GameControls
            canSpin={game.canSpin && (!isOnline || isMyTurn)}
            canBuyVowel={game.canBuyVowel && (!isOnline || isMyTurn)}
            canSolve={game.canSolve && (!isOnline || isMyTurn)}
            showBuyVowel={game.hasSpunThisTurn}
            onSpin={handleStartSpin}
            onBuyVowel={handleStartBuyVowel}
            onSolve={handleStartSolve}
            playerName={game.isMultiplayer ? game.currentPlayer.name : ''}
          />

          <div class="picker-desktop">
            {#if game.phase === 'picking_consonant' && (!isOnline || isMyTurn)}
              <LetterPicker
                mode="consonant"
                usedLetters={game.usedLetters}
                onPick={handlePickConsonant}
              />
            {/if}

            {#if game.phase === 'picking_vowel' && (!isOnline || isMyTurn)}
              <LetterPicker
                mode="vowel"
                usedLetters={game.usedLetters}
                onPick={handleBuyVowel}
              />
            {/if}
          </div>
        </div>
      </div>
    </main>

    <MessageToast message={game.message} />

    <SolveModal
      open={game.phase === 'solving' && (!isOnline || isMyTurn)}
      phrase={game.phraseObj.text}
      revealedLetters={game.revealedLetters}
      jollyRevealedPositions={game.jollyRevealedPositions}
      onSubmit={handleAttemptSolve}
      onCancel={handleCancelSolve}
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
        onNextRound={handleNextRound}
        onNewGame={handleNewGame}
        onMenu={handleGoToMenu}
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
        onNextRound={handleNextRound}
        onNewGame={handleNewGame}
        onMenu={handleGoToMenu}
      />
    {/if}
  </div>
{/if}
<CookieBanner />
</div>

<style>
  .app {
    min-height: 100vh;
    padding: 1rem;
    max-width: 900px;
    margin: 0 auto;
  }
  header {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin-bottom: 1rem;
  }
  .header-top {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-left: auto;
  }
  .online-indicator {
    font-family: 'Oswald', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: #4CAF50;
    background: rgba(76,175,80,0.15);
    border: 1px solid rgba(76,175,80,0.3);
    border-radius: 6px;
    padding: 0.2rem 0.5rem;
    letter-spacing: 1px;
  }
  .round-indicator {
    font-family: 'Oswald', sans-serif;
    font-size: 0.85rem;
    color: #ffd700;
    background: rgba(255,215,0,0.1);
    border: 1px solid rgba(255,215,0,0.25);
    border-radius: 6px;
    padding: 0.2rem 0.6rem;
    white-space: nowrap;
  }
  .btn-audio {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    padding: 0.3rem 0.5rem;
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
    transition: all 0.2s;
  }
  .btn-audio:hover {
    background: rgba(255,255,255,0.15);
  }
  .btn-menu {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.6);
    padding: 0.35rem 0.8rem;
    border-radius: 6px;
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .btn-menu:hover {
    background: rgba(255,255,255,0.12);
    color: #fff;
  }
  h1 {
    font-family: 'Oswald', sans-serif;
    color: #ffd700;
    font-size: 1.6rem;
    font-weight: 700;
    text-shadow: 0 2px 10px rgba(255,215,0,0.3);
    margin: 0;
    letter-spacing: 1px;
  }
  .turn-banner {
    text-align: center;
    padding: 0.5rem;
    background: rgba(255,215,0,0.08);
    border: 1px solid rgba(255,215,0,0.2);
    border-radius: 8px;
    font-family: 'Oswald', sans-serif;
    font-size: 1.1rem;
    color: rgba(255,255,255,0.8);
    margin-bottom: 0.5rem;
  }
  .turn-banner strong {
    color: #ffd700;
  }
  .your-turn-badge {
    display: inline-block;
    background: rgba(76,175,80,0.2);
    color: #4CAF50;
    font-size: 0.85rem;
    padding: 0.1rem 0.5rem;
    border-radius: 4px;
    margin-left: 0.5rem;
    animation: pulse 1.5s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }
  .timer {
    font-family: 'Oswald', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: #4CAF50;
    background: rgba(76,175,80,0.12);
    padding: 0.15rem 0.6rem;
    border-radius: 6px;
    margin-left: 0.8rem;
    min-width: 3rem;
    text-align: center;
    transition: color 0.3s, background 0.3s;
  }
  .timer-warning {
    color: #ff5252;
    background: rgba(255,82,82,0.15);
    animation: timerPulse 0.8s ease-in-out infinite;
  }
  @keyframes timerPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .disconnect-banner {
    text-align: center;
    padding: 1rem;
    background: rgba(255,82,82,0.15);
    border: 2px solid rgba(255,82,82,0.4);
    border-radius: 10px;
    color: #ff5252;
    font-family: 'Oswald', sans-serif;
    font-size: 1.1rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
  }
  .back-to-menu-btn {
    background: rgba(255,82,82,0.2);
    border: 1px solid rgba(255,82,82,0.4);
    color: #ff5252;
    padding: 0.4rem 1.2rem;
    border-radius: 6px;
    font-family: 'Oswald', sans-serif;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .back-to-menu-btn:hover {
    background: rgba(255,82,82,0.3);
  }
  main {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }
  .game-area {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 2rem;
    flex-wrap: wrap;
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
    min-width: 280px;
    justify-content: center;
  }

  /* Jolly overlay banner */
  .jolly-overlay {
    display: flex;
    justify-content: center;
  }
  .jolly-banner {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
    background: linear-gradient(135deg, rgba(0,137,123,0.2), rgba(0,230,118,0.1));
    border: 2px solid rgba(0,230,118,0.4);
    border-radius: 12px;
    padding: 0.8rem 1.5rem;
    animation: jollyPulse 1.5s ease-in-out infinite;
    font-family: 'Oswald', sans-serif;
    font-size: 1.1rem;
    color: #00e676;
  }
  .jolly-icon {
    font-size: 1.8rem;
    font-weight: 700;
    color: #00897B;
    background: rgba(0,137,123,0.2);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  @keyframes jollyPulse {
    0%, 100% { box-shadow: 0 0 10px rgba(0,230,118,0.1); }
    50% { box-shadow: 0 0 25px rgba(0,230,118,0.3); }
  }

  /* Mobile: picker above wheel, desktop: picker beside wheel */
  .picker-mobile { display: none; }
  .picker-desktop { display: contents; }

  @media (max-width: 640px) {
    h1 { font-size: 1.1rem; }
    .game-area { flex-direction: column; align-items: center; }
    .actions { min-width: auto; width: 100%; }
    .app { padding: 0.5rem; }
    .jolly-banner { font-size: 0.95rem; padding: 0.6rem 1rem; }
    .jolly-icon { width: 32px; height: 32px; font-size: 1.4rem; }
    .picker-mobile { display: block; }
    .picker-desktop { display: none; }
  }

  @media (max-width: 400px) {
    h1 { font-size: 0.95rem; letter-spacing: 0; }
    .header-top { gap: 0.4rem; }
    .btn-menu { font-size: 0.7rem; padding: 0.3rem 0.5rem; }
    .round-indicator { font-size: 0.75rem; padding: 0.15rem 0.4rem; }
  }
</style>
