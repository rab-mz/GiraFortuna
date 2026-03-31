<script>
  import { game } from './lib/stores/gameStore.svelte.js';
  import { online } from './lib/stores/onlineStore.svelte.js';
  import { daily } from './lib/stores/dailyStore.svelte.js';
  import { sound } from './lib/audio/soundEngine.js';
  import { SEEDS } from './lib/logic/wheelSeeds.js';
  import { getLettersInPhrase } from './lib/logic/gameEngine.js';
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
  import { saveSession, loadSession, loadOnlineSession, clearSession } from './lib/stores/sessionStore.js';
  import ResumeModal from './components/ResumeModal.svelte';
  import ExitConfirmModal from './components/ExitConfirmModal.svelte';
  import MobileGameLayout from './components/MobileGameLayout.svelte';
  import DiceRollScreen from './components/DiceRollScreen.svelte';
  import { analytics } from './lib/stores/analyticsStore.js';

  // Init analytics on mount
  $effect(() => { analytics.init(); });

  let forcedSpinIndex = $state(null);
  let isMobile = $state(false);
  let showExitConfirm = $state(false);
  let diceRollData = $state(null); // {players: [{name, die1, die2}], ...metadata}
  let remoteRollIndex = $state(-1); // set when remote player rolls dice (online sync)
  let pendingSession = $state(loadSession());
  let showResumeModal = $derived(pendingSession !== null && game.phase === 'menu');
  let currentSegments = $derived(SEEDS[game.currentSeed]?.segments ?? SEEDS.classico.segments);
  let isDailyMode = $state(false);
  let dailyRecorded = $state(false);

  // Record daily result when daily game ends
  $effect(() => {
    if (isDailyMode && game.phase === 'game_over' && !dailyRecorded) {
      dailyRecorded = true;
      const totalLetters = getLettersInPhrase(game.phraseObj.text).size;
      daily.recordResult({
        score: game.roundWinner?.money ?? 0,
        usedLettersCount: game.revealedLetters.size,
        totalLetters,
      });
    }
  });

  function getWeightedSpinIndex() {
    const segs = currentSegments;
    if (game.currentSeed !== 'maledizione' || game.bankruptCount === 0) {
      return Math.floor(Math.random() * segs.length);
    }
    const weights = segs.map(seg => {
      if (seg.value === 'bancarotta') return Math.pow(2, game.bankruptCount);
      if (seg.value === 'passa') return Math.pow(2, Math.ceil(game.bankruptCount / 2));
      return 1;
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return weights.length - 1;
  }

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

  // --- Mobile detection ---
  $effect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    isMobile = mq.matches;
    const handler = (e) => { isMobile = e.matches; };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  });

  // --- Session persistence ---
  $effect(() => {
    const phase = game.phase;
    if (phase !== 'menu') {
      const onlineInfo = online.mode !== 'offline'
        ? { roomCode: online.roomCode, mode: online.mode, playerName: online.myName }
        : null;
      const state = game.getSerializableState();
      if (isDailyMode) state._dailyDate = new Date().toISOString().slice(0, 10);
      saveSession(state, onlineInfo);
    }
  });

  function handleResume() {
    if (!pendingSession) return;
    const gs = pendingSession.gameState;
    // If it was a daily game from a different day, discard
    if (gs._dailyDate && gs._dailyDate !== new Date().toISOString().slice(0, 10)) {
      handleDismissResume();
      return;
    }
    if (gs._dailyDate) {
      isDailyMode = true;
      dailyRecorded = false;
    }
    game.restoreFromSession(gs);
    const onlineSess = loadOnlineSession();
    if (onlineSess && onlineSess.mode === 'client') {
      online.joinRoom(onlineSess.roomCode, onlineSess.playerName);
    }
    sound.startBgMusic();
    pendingSession = null;
    analytics.trackSessionResume();
  }

  function handleDismissResume() {
    clearSession();
    pendingSession = null;
  }

  function handleDailyStart() {
    const phrase = daily.getDailyPhrase();
    isDailyMode = true;
    dailyRecorded = false;
    game.startGame(['Giocatore'], 1, 'classico', null, phrase);
    analytics.trackGameStart({ mode: 'daily', playerCount: 1, seed: 'classico', rounds: 1 });
  }

  // --- Dice roll helpers ---
  function generateDiceForPlayers(names) {
    return names.map(name => ({
      name,
      die1: Math.ceil(Math.random() * 6),
      die2: Math.ceil(Math.random() * 6),
    }));
  }

  function getDiceWinner(diceResults) {
    const totals = diceResults.map(d => d.die1 + d.die2);
    const max = Math.max(...totals);
    return totals.indexOf(max); // first with max = tiebreak
  }

  function handleDiceComplete(winnerIndex) {
    diceRollData = null;
    remoteRollIndex = -1;
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
      const winIndex = getWeightedSpinIndex();
      forcedSpinIndex = winIndex;
      game.setSpinIndex(winIndex);
    }
    game.startSpin();
    if (isHost) hostBroadcast();
  }

  function handleSpinResult(segment, winIndex) {
    if (isClient) {
      forcedSpinIndex = null;
      return;
    }
    game.handleSpinResult(segment, winIndex);
    if (isHost) hostBroadcast();
    forcedSpinIndex = null;
    analytics.trackSpin({ value: segment?.value ?? segment?.label, seed: game.currentSeed });
  }

  function handlePickConsonant(letter) {
    if (isClient) {
      online.sendAction('pickConsonant', { letter });
      return;
    }
    const before = game.revealedLetters.size;
    game.pickConsonant(letter);
    const found = game.revealedLetters.size > before;
    analytics.trackLetterGuess({ letter, type: 'consonant', found, count: game.revealedLetters.size - before });
    if (isHost) hostBroadcast();
  }

  function handleBuyVowel(letter) {
    if (isClient) {
      online.sendAction('buyVowel', { letter });
      return;
    }
    const before = game.revealedLetters.size;
    game.buyVowel(letter);
    const found = game.revealedLetters.size > before;
    analytics.trackLetterGuess({ letter, type: 'vowel', found, count: game.revealedLetters.size - before });
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
    const phaseBefore = game.phase;
    game.attemptSolve(guess);
    const success = game.phase === 'round_won' || game.phase === 'game_over';
    analytics.trackPuzzleSolve({ success, phrase_length: game.phraseObj?.text?.length });
    if (success) {
      const scores = game.players.map(p => p.money);
      const winner = game.roundWinner;
      if (game.phase === 'game_over') {
        analytics.trackGameEnd({ winner, scores, totalRounds: game.totalRounds });
      } else {
        analytics.trackRoundEnd({ winner, scores, round: game.currentRound, totalRounds: game.totalRounds });
      }
    }
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

  function handleBackButton() {
    if (game.isMultiplayer && game.phase !== 'round_won' && game.phase !== 'game_over') {
      showExitConfirm = true;
    } else {
      handleGoToMenu();
    }
  }

  function handleConfirmExit() {
    showExitConfirm = false;
    handleGoToMenu();
  }

  function handleCancelExit() {
    showExitConfirm = false;
  }

  function handleGoToMenu() {
    game.goToMenu();
    clearSession();
    isDailyMode = false;
    dailyRecorded = false;
    if (isOnline) {
      online.leaveRoom();
    }
  }

  // --- Online start (host starts the game) ---
  function handleOnlineStart(playerNames, rounds, seed) {
    const dice = generateDiceForPlayers(playerNames);
    const winner = getDiceWinner(dice);
    game.startGame(playerNames, rounds, seed, winner);
    const fullState = game.getSerializableState();
    fullState.diceResults = dice;
    online.broadcastGameStart(fullState);
    diceRollData = { players: dice };
    analytics.trackGameStart({ mode: 'online', playerCount: playerNames.length, seed, rounds });
    analytics.trackRoomCreate({ roomCode: online.roomCode });
  }

  // --- Setup online listeners ---
  // Host: listen for player actions
  online.onPlayerAction((payload) => {
    // Ignore stale broadcasts after leaving the room
    if (online.mode === 'offline' || game.phase === 'menu') return;

    const { action, data } = payload;
    switch (action) {
      case 'startSpin': {
        const winIndex = getWeightedSpinIndex();
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
    // Ignore stale broadcasts after leaving the room
    if (online.mode === 'offline' || game.phase === 'menu') return;

    // Pick up spin index before applying state, so the Wheel gets it in time
    if (remoteState.lastSpinIndex != null) {
      forcedSpinIndex = remoteState.lastSpinIndex;
    }

    game.applyRemoteState(remoteState);
  });

  // Client: listen for game start
  online.onGameStart((remoteState) => {
    // Ignore stale broadcasts after leaving the room (but NOT menu phase —
    // game_start is specifically meant to transition from menu to game)
    if (online.mode === 'offline') return;

    game.startGameFromState(remoteState);
    // Show dice animation if host sent dice results
    if (remoteState.diceResults && remoteState.diceResults.length > 1) {
      diceRollData = { players: remoteState.diceResults };
    }
    // Track join + game start for clients
    if (isClient) {
      analytics.trackRoomJoin({ roomCode: online.roomCode });
      analytics.trackGameStart({
        mode: 'online',
        playerCount: remoteState.players?.length,
        seed: remoteState.currentSeed,
        rounds: remoteState.totalRounds,
      });
    }
  });

  // Online: sync dice rolls between players
  online.onDiceRoll(({ playerIndex }) => {
    remoteRollIndex = playerIndex;
  });

  function handleDiceRollBroadcast(playerIndex) {
    online.broadcastDiceRoll(playerIndex);
  }

  // Host: when a player (re)joins mid-game, re-broadcast full state so they can catch up
  online.onPlayerJoined(() => {
    if (isHost && game.phase !== 'menu') {
      online.broadcastGameStart(game.getSerializableState());
    }
  });

  // Host: when a player leaves mid-game, remove them and broadcast
  online.onPlayerLeft((playerName) => {
    if (isHost && game.phase !== 'menu') {
      game.removePlayer(playerName);
      // If game ended (last player wins), broadcast game_start so clients get full state
      if (game.phase === 'game_over') {
        online.broadcastGameStart(game.getSerializableState());
      } else {
        hostBroadcast();
      }
    }
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
    onStart={(names, rounds, seed) => {
      isDailyMode = false;
      const mode = names.length > 1 ? 'local' : 'single';
      if (names.length > 1) {
        const dice = generateDiceForPlayers(names);
        const winner = getDiceWinner(dice);
        game.startGame(names, rounds, seed, winner);
        diceRollData = { players: dice };
      } else {
        game.startGame(names, rounds, seed);
      }
      analytics.trackGameStart({ mode, playerCount: names.length, seed, rounds });
    }}
    onOnlineStart={handleOnlineStart}
    onDailyStart={handleDailyStart}
  />
{:else if isMobile}
  <MobileGameLayout
    {game}
    {online}
    {isOnline}
    {isMyTurn}
    {isHost}
    {isClient}
    {currentSegments}
    {isDailyMode}
    dailyResult={daily.dailyResult}
    dailyStreak={daily.streak}
    dailyShareText={daily.getShareText()}
    forcedSpinIndex={forcedSpinIndex}
    onStartSpin={handleStartSpin}
    onSpinResult={handleSpinResult}
    onPickConsonant={handlePickConsonant}
    onBuyVowel={handleBuyVowel}
    onStartBuyVowel={handleStartBuyVowel}
    onStartSolve={handleStartSolve}
    onAttemptSolve={handleAttemptSolve}
    onCancelSolve={handleCancelSolve}
    onUseJolly={handleUseJolly}
    onGoToMenu={handleBackButton}
    onNextRound={handleNextRound}
    onNewGame={handleNewGame}
    onToggleAudio={toggleAudio}
  />
{:else}
  <div class="app">
    <header>
      <div class="header-top">
        <button class="btn-menu" onclick={handleBackButton} title="Torna al menu">← Menu</button>
        <h1>Gira la Fortuna</h1>
        <div class="header-right">
          {#if isOnline}
            <span class="online-indicator">ONLINE</span>
            <span class="room-code-badge" title="Codice stanza">{online.roomCode}</span>
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

      <div class="game-area">
        <Wheel
          segments={currentSegments}
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
            showBuyVowel={game.vowelsLeft && !game.hasBoughtVowelThisRound}
            onSpin={handleStartSpin}
            onBuyVowel={handleStartBuyVowel}
            onSolve={handleStartSolve}
            playerName={game.isMultiplayer ? game.currentPlayer.name : ''}
          />

          {#if game.phase === 'idle' && (!isOnline || isMyTurn)}
            <p class="step-hint">
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
          {:else if game.phase === 'picking_consonant' && (!isOnline || isMyTurn)}
            <p class="step-hint highlight">Valore: {game.currentSpinValue}€ — scegli una consonante!</p>
          {:else if isOnline && !isMyTurn && game.phase !== 'idle'}
            <div class="waiting-opponent">
              <p class="waiting-text">
                {#if game.phase === 'spinning'}
                  {game.currentPlayer.name} sta girando la ruota...
                {:else if game.phase === 'picking_consonant'}
                  {game.currentPlayer.name} sta scegliendo una consonante...
                {:else if game.phase === 'picking_vowel'}
                  {game.currentPlayer.name} sta comprando una vocale...
                {:else if game.phase === 'picking_jolly'}
                  {game.currentPlayer.name} sta usando il Jolly...
                {:else if game.phase === 'solving'}
                  {game.currentPlayer.name} sta provando a risolvere...
                {/if}
              </p>
            </div>
          {/if}

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
        isDailyGame={isDailyMode}
        dailyResult={daily.dailyResult}
        dailyStreak={daily.streak}
        dailyShareText={daily.getShareText()}
        onNextRound={handleNextRound}
        onNewGame={handleNewGame}
        onMenu={handleGoToMenu}
      />
    {/if}
  </div>
{/if}
{#if diceRollData}
  <DiceRollScreen
    players={diceRollData.players}
    onComplete={handleDiceComplete}
    myName={isOnline ? online.myName : null}
    onDiceRoll={isOnline ? handleDiceRollBroadcast : null}
    {remoteRollIndex}
  />
{/if}
{#if showResumeModal}
  <ResumeModal
    session={pendingSession}
    onResume={handleResume}
    onDismiss={handleDismissResume}
  />
{/if}
<ExitConfirmModal
  open={showExitConfirm}
  {isOnline}
  onConfirm={handleConfirmExit}
  onCancel={handleCancelExit}
/>
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
  .room-code-badge {
    font-family: 'Oswald', sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: #ffd700;
    background: rgba(255,215,0,0.1);
    border: 1px solid rgba(255,215,0,0.3);
    border-radius: 6px;
    padding: 0.2rem 0.6rem;
    letter-spacing: 2px;
    cursor: default;
    user-select: all;
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

  .step-hint {
    font-family: 'Inter', sans-serif;
    font-size: 0.82rem;
    color: rgba(255,215,0,0.65);
    text-align: center;
    padding: 0.4rem 0.8rem;
    border: 1px solid rgba(255,215,0,0.12);
    border-radius: 8px;
    background: rgba(255,215,0,0.04);
    margin: 0;
  }
  .step-hint.highlight {
    color: #00e676;
    border-color: rgba(0,230,118,0.2);
    background: rgba(0,230,118,0.04);
  }

  /* Desktop only: picker beside wheel */
  .picker-desktop { display: contents; }

  /* Waiting for opponent (online) */
  .waiting-opponent {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem 1.2rem;
    background: rgba(255,215,0,0.05);
    border: 1px solid rgba(255,215,0,0.15);
    border-radius: 10px;
    margin-top: 0.5rem;
  }
  .waiting-text {
    font-family: 'Oswald', sans-serif;
    font-size: 0.95rem;
    color: rgba(255,215,0,0.7);
    margin: 0;
  }
</style>
