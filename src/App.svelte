<script>
  import { game } from './lib/stores/gameStore.svelte.js';
  import { online } from './lib/stores/onlineStore.svelte.js';
  import { daily } from './lib/stores/dailyStore.svelte.js';
  import { sound } from './lib/audio/soundEngine.js';
  import { SEEDS } from './lib/logic/wheelSeeds.js';
  import { isLetter, normalizeChar } from './lib/utils/italian.js';
  import StartScreen from './components/StartScreen.svelte';
  import EventDemoScreen from './components/EventDemoScreen.svelte';
  import { EVENT_PHRASES } from './lib/data/eventPhrases.js';
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
  import InstallBanner from './components/InstallBanner.svelte';
  import { settings } from './lib/stores/settingsStore.svelte.js';
  import { saveSession, loadSession, loadOnlineSession, clearSession } from './lib/stores/sessionStore.js';
  import ResumeModal from './components/ResumeModal.svelte';
  import ExitConfirmModal from './components/ExitConfirmModal.svelte';
  import MobileGameLayout from './components/MobileGameLayout.svelte';
  import DiceRollScreen from './components/DiceRollScreen.svelte';
  import Icon from './components/Icon.svelte';
  import SpicchiLogo from './components/SpicchiLogo.svelte';
  import { formatEuro } from './lib/utils/format.js';
  import { analytics } from './lib/stores/analyticsStore.js';
  import { generalStats } from './lib/stores/generalStatsStore.svelte.js';

  // Init analytics on mount
  $effect(() => { analytics.init(); });

  let forcedSpinIndex = $state(null);
  let isMobile = $state(false);

  // Demo evento (Alghero): si apre solo con ?demo=alghero, non e' linkata da nessuna parte.
  const isEventDemo = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('demo') === 'alghero';
  let stageMode = $state(false);   // finale sul palco: tutto piu' grande
  let eventGame = $state(false);   // partita con il set di frasi dell'evento
  let showExitConfirm = $state(false);
  let diceRollData = $state(null); // {players: [{name, die1, die2}], ...metadata}
  let remoteRollIndex = $state(-1); // set when remote player rolls dice (online sync)
  let pendingSession = $state(loadSession());
  let showResumeModal = $derived(pendingSession !== null && game.phase === 'menu');
  let currentSegments = $derived(SEEDS[game.currentSeed]?.segments ?? SEEDS.classico.segments);
  let isDailyMode = $state(false);
  let dailyRecorded = $state(false);
  let gameMode = $state('single'); // 'single' | 'multi' | 'online' | 'daily'
  let generalStatsRecorded = $state(false);
  // Snapshot of revealed state captured BEFORE solve (since solve reveals all letters)
  let dailyPreSolveSnapshot = $state(null);

  // Record daily result when daily game ends
  $effect(() => {
    if (isDailyMode && game.phase === 'game_over' && !dailyRecorded && dailyPreSolveSnapshot) {
      dailyRecorded = true;
      const snap = dailyPreSolveSnapshot;
      daily.recordResult({
        score: game.roundWinner?.money ?? 0,
        revealedCount: snap.revealedCount,
        totalCount: snap.totalCount,
        phraseText: snap.phraseText,
        revealedLetters: snap.revealedLetters,
        jollyPositions: snap.jollyPositions,
      });
    }
  });

  // Record general stats when any game ends
  $effect(() => {
    if (game.phase === 'game_over' && !generalStatsRecorded) {
      generalStatsRecorded = true;
      const winner = game.roundWinner;
      let won = true;
      if (gameMode === 'online') {
        won = winner?.name === online.myName;
      } else if (gameMode === 'multi') {
        won = winner?.name === game.players[0]?.name;
      }
      generalStats.recordGame({
        mode: gameMode,
        phrase: game.phraseObj?.text ?? '',
        category: game.phraseObj?.category ?? '',
        score: winner?.money ?? 0,
        seed: game.currentSeed,
        rounds: game.totalRounds,
        won,
        players: game.players.length,
      });
    }
  });

  // Capture revealed state snapshot (called before any action that could end the game)
  function captureDailySnapshot() {
    if (!isDailyMode || dailyRecorded) return;
    const phrase = game.phraseObj.text;
    const revealed = game.revealedLetters;
    const jolly = game.jollyRevealedPositions;
    let totalCount = 0;
    let revealedCount = 0;
    let pos = 0;
    for (const ch of phrase) {
      if (isLetter(ch)) {
        totalCount++;
        const norm = normalizeChar(ch);
        if (revealed.has(norm) || jolly.has(pos)) {
          revealedCount++;
        }
      }
      pos++;
    }
    dailyPreSolveSnapshot = {
      revealedCount,
      totalCount,
      phraseText: phrase,
      revealedLetters: [...revealed],
      jollyPositions: [...jolly],
    };
  }

  // Estrazione pesata: bancarotta ~3%, ogni PASSA ~4%, il resto equiripartito sui premi
  const SPECIAL_SPIN_WEIGHTS = { bancarotta: 3, passa: 4 };

  function getWeightedSpinIndex() {
    const specials = currentSegments.map(seg => SPECIAL_SPIN_WEIGHTS[seg.value] ?? null);
    const specialTotal = specials.reduce((sum, w) => sum + (w ?? 0), 0);
    const prizeCount = specials.filter(w => w === null).length;
    const prizeWeight = Math.max(0, 100 - specialTotal) / Math.max(1, prizeCount);
    const weights = specials.map(w => w ?? prizeWeight);
    const total = weights.reduce((sum, w) => sum + w, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll < 0) return i;
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
      gameMode = 'daily';
    }
    generalStatsRecorded = false;
    game.restoreFromSession(gs);
    // If restored into game_over, it was already recorded before
    if (game.phase === 'game_over') generalStatsRecorded = true;
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

  function handleDemoQualifiche() {
    isDailyMode = false;
    stageMode = false;
    eventGame = true;
    gameMode = 'evento';
    generalStatsRecorded = false;
    game.startGame(['Ospite'], EVENT_PHRASES.length, 'classico', null, null, EVENT_PHRASES);
    analytics.trackGameStart({ mode: 'evento', playerCount: 1, seed: 'classico', rounds: EVENT_PHRASES.length });
  }

  function handleDemoPalco(names) {
    isDailyMode = false;
    stageMode = true;
    eventGame = true;
    gameMode = 'evento-palco';
    generalStatsRecorded = false;
    // Niente tiro dei dadi: sul palco il conduttore decide chi apre.
    game.startGame(names, EVENT_PHRASES.length, 'classico', 0, null, EVENT_PHRASES);
    analytics.trackGameStart({ mode: 'evento-palco', playerCount: names.length, seed: 'classico', rounds: EVENT_PHRASES.length });
  }

  function handleDailyStart() {
    const phrase = daily.getDailyPhrase();
    isDailyMode = true;
    dailyRecorded = false;
    dailyPreSolveSnapshot = null;
    gameMode = 'daily';
    generalStatsRecorded = false;
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

  // Timer visibile (anello sull'avatar attivo) solo nelle fasi in cui conta
  let timerRunning = $derived(
    game.isMultiplayer &&
    game.turnTimer > 0 &&
    ['idle', 'picking_consonant', 'picking_vowel', 'picking_jolly', 'solving'].includes(game.phase)
  );

  // --- Wrapped game actions ---
  function handleStartSpin() {
    if (isClient) {
      online.sendAction('startSpin');
      return;
    }
    // L'esito pesato si decide qui (host o partita locale): la ruota riceve sempre l'indice
    const winIndex = getWeightedSpinIndex();
    forcedSpinIndex = winIndex;
    game.setSpinIndex(winIndex);
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
    captureDailySnapshot();
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
    captureDailySnapshot();
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
    captureDailySnapshot();
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
    captureDailySnapshot();
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
    if ((game.isMultiplayer || isDailyMode) && game.phase !== 'round_won' && game.phase !== 'game_over') {
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
    // If exiting mid-daily-game, record it as a loss
    if (isDailyMode && !dailyRecorded && game.phase !== 'game_over') {
      captureDailySnapshot();
      if (dailyPreSolveSnapshot) {
        const snap = dailyPreSolveSnapshot;
        daily.recordResult({
          score: game.currentPlayer?.money ?? 0,
          revealedCount: snap.revealedCount,
          totalCount: snap.totalCount,
          phraseText: snap.phraseText,
          revealedLetters: snap.revealedLetters,
          jollyPositions: snap.jollyPositions,
          won: false,
        });
        dailyRecorded = true;
      }
    }
    game.goToMenu();
    clearSession();
    stageMode = false;
    eventGame = false;
    isDailyMode = false;
    dailyRecorded = false;
    dailyPreSolveSnapshot = null;
    generalStatsRecorded = false;
    if (isOnline) {
      online.leaveRoom();
    }
  }

  // --- Online start (host starts the game) ---
  function handleOnlineStart(playerNames, rounds, seed) {
    gameMode = 'online';
    generalStatsRecorded = false;
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

  // Client: riallinea il countdown all'heartbeat del timer dell'host
  online.onTimerSync(({ remainingMs }) => {
    if (online.mode !== 'client' || game.phase === 'menu') return;
    game.syncTimer(remainingMs);
  });

  // Host: heartbeat ~5s con i ms rimanenti del turno
  $effect(() => {
    if (!isHost || game.phase === 'menu') return;
    const heartbeat = setInterval(() => {
      const remaining = game.getTurnRemainingMs();
      if (remaining != null) online.broadcastTimerSync(remaining);
    }, 5000);
    return () => clearInterval(heartbeat);
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
{#if game.phase === 'menu' && isEventDemo}
  <EventDemoScreen
    onQualifiche={handleDemoQualifiche}
    onPalco={handleDemoPalco}
  />
{:else if game.phase === 'menu'}
  <StartScreen
    onStart={(names, rounds, seed) => {
      isDailyMode = false;
      const mode = names.length > 1 ? 'local' : 'single';
      gameMode = names.length > 1 ? 'multi' : 'single';
      generalStatsRecorded = false;
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
  <div class="app" class:stage={stageMode}>
    <header>
      <div class="header-left">
        <button class="icon-btn" onclick={handleBackButton} title="Torna al menu" aria-label="Torna al menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
        <div class="brand">
          <SpicchiLogo size={22} />
          <span class="brand-name">Gira la Fortuna</span>
        </div>
      </div>
      <div class="header-right">
        {#if isOnline}
          <span class="online-tag" title="Codice stanza"><span class="online-dot"></span>Stanza {online.roomCode}</span>
        {/if}
        {#if game.totalRounds > 1}
          <span class="round-indicator">{eventGame ? 'Frase' : 'Round'} {game.currentRound} di {game.totalRounds}</span>
        {/if}
        <button class="icon-btn" onclick={toggleAudio} title={settings.soundEnabled ? 'Disattiva suoni' : 'Attiva suoni'}>
          <Icon name={settings.soundEnabled ? 'audio-on' : 'audio-off'} size={18} />
        </button>
      </div>
    </header>

    {#if online.hostDisconnected}
      <div class="disconnect-banner">
        L'host si e' disconnesso. La partita e' terminata.
        <button class="back-to-menu-btn" onclick={handleGoToMenu}>Torna al Menu</button>
      </div>
    {/if}

    <main>
      <div class="wheel-col">
        <Wheel
          segments={currentSegments}
          spinning={game.phase === 'spinning'}
          canSpin={game.canSpin && (!isOnline || isMyTurn)}
          forcedResult={forcedSpinIndex}
          onSpin={handleStartSpin}
          onResult={handleSpinResult}
        />

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

        {#if isOnline && !isMyTurn && game.phase !== 'idle'}
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
      </div>

      <div class="board-col">
        <div class="board-head">
          <CategoryBanner category={game.phraseObj.category} />
          {#if game.isMultiplayer}
            <span class="turn-text">
              {#if isOnline && isMyTurn}
                Tocca a te, <strong>{game.currentPlayer.name}</strong>
              {:else}
                Tocca a <strong>{game.currentPlayer.name}</strong>
              {/if}
            </span>
          {/if}
        </div>

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

        {#if game.isMultiplayer}
          <PlayersBar
            players={game.players}
            currentIndex={game.currentPlayerIndex}
            totalScores={game.totalScores}
            showTotal={game.totalRounds > 1}
            timerSeconds={game.turnTimer}
            timerTotal={settings.timerSeconds}
            timerActive={timerRunning}
          />
        {:else}
          <ScoreDisplay
            money={game.currentPlayer.money}
            totalScore={game.totalScores[0] || 0}
            showTotal={game.totalRounds > 1}
          />
        {/if}

        {#if game.phase === 'idle' && (!isOnline || isMyTurn)}
          <p class="step-hint">
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
        {:else if game.phase === 'picking_consonant' && (!isOnline || isMyTurn)}
          <p class="step-hint highlight">Vale {formatEuro(game.currentSpinValue)} a lettera: scegli una consonante</p>
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
        category={game.phraseObj.category}
        song={game.phraseObj.song}
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
        category={game.phraseObj.category}
        song={game.phraseObj.song}
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

{#if game.phase === 'menu' && !isEventDemo}
  <InstallBanner />
{/if}
</div>

<style>
  .app {
    min-height: 100vh;
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 2rem 2rem;
    display: flex;
    flex-direction: column;
  }
  /* Glow atmosferico (tavola Partita): l'atmosfera la fanno il glow radiale e la ruota */
  .app::before {
    content: '';
    position: fixed;
    left: -200px;
    bottom: -300px;
    width: 900px;
    height: 900px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(245,182,63,0.08) 0%, rgba(10,14,35,0) 65%);
    pointer-events: none;
    z-index: -1;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    border-bottom: 1px solid var(--glass-border);
    margin-bottom: 1.6rem;
    gap: 1rem;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .brand-name {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.88rem;
    letter-spacing: 1px;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--glass-strong);
    border: 1px solid var(--glass-border-strong);
    color: rgba(244,242,255,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1rem;
    padding: 0;
    flex-shrink: 0;
  }
  .icon-btn:hover {
    background: rgba(244,242,255,0.1);
    color: var(--text);
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
  .online-tag {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-ui);
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--mint);
    user-select: all;
    white-space: nowrap;
  }
  .online-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--mint);
    flex-shrink: 0;
  }
  .round-indicator {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-dim);
    white-space: nowrap;
  }
  .disconnect-banner {
    text-align: center;
    padding: 1rem;
    background: rgba(255,93,115,0.1);
    border: 1px solid rgba(255,93,115,0.4);
    border-radius: var(--radius);
    color: var(--coral);
    font-family: var(--font-ui);
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
  }
  .back-to-menu-btn {
    background: rgba(255,93,115,0.15);
    border: 1px solid rgba(255,93,115,0.4);
    color: var(--coral);
    padding: 0.4rem 1.2rem;
    border-radius: 10px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .back-to-menu-btn:hover {
    background: rgba(255,93,115,0.25);
  }
  main {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(380px, 460px) minmax(0, 1fr);
    gap: 3rem;
    align-items: center;
  }
  .wheel-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }
  .board-col {
    display: flex;
    flex-direction: column;
    gap: 1.3rem;
    min-width: 0;
  }
  .board-head {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    flex-wrap: wrap;
  }
  .turn-text {
    font-family: var(--font-ui);
    font-size: 0.9rem;
    color: var(--text-dim);
  }
  .turn-text strong {
    color: var(--amber);
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
    background: rgba(51,214,181,0.1);
    border: 1.5px solid rgba(51,214,181,0.45);
    border-radius: var(--radius);
    padding: 0.8rem 1.5rem;
    animation: jollyPulse 1.5s ease-in-out infinite;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 1rem;
    color: var(--mint);
  }
  .jolly-icon {
    font-size: 1.4rem;
    font-weight: 700;
    font-family: var(--font-display);
    color: var(--mint);
    background: rgba(51,214,181,0.15);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  @keyframes jollyPulse {
    0%, 100% { box-shadow: 0 0 10px rgba(51,214,181,0.1); }
    50% { box-shadow: 0 0 25px rgba(51,214,181,0.3); }
  }

  /* Finale sul palco: tutto piu' grande, per essere letto da lontano su
     ledwall/proiettore. Su schermi piccoli resta la resa normale. */
  .app.stage {
    max-width: none;
  }
  @media (min-width: 1400px) {
    .app.stage header,
    .app.stage main {
      zoom: 1.2;
    }
  }
  @media (min-width: 1800px) {
    .app.stage header,
    .app.stage main {
      zoom: 1.4;
    }
  }

  .step-hint {
    font-family: var(--font-display);
    font-size: 1.12rem;
    font-weight: 500;
    line-height: 1.3;
    color: var(--amber);
    text-align: center;
    padding: 0.2rem 0;
    margin: 0;
  }
  .step-hint.highlight {
    color: var(--mint);
  }

  .picker-desktop {
    display: contents;
  }

  /* Waiting for opponent (online) */
  .waiting-opponent {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem 1.2rem;
    background: var(--glass);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-sm);
  }
  .waiting-text {
    font-family: var(--font-ui);
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-dim);
    margin: 0;
  }

  @media (max-width: 980px) {
    main {
      display: flex;
      flex-direction: column;
      gap: 1.6rem;
      align-items: stretch;
    }
    .board-col {
      order: -1;
    }
  }
</style>
