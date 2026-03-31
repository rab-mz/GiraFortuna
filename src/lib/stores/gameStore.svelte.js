import { getRandomPhrase } from '../data/phrases.js';
import {
  countOccurrences,
  getLettersInPhrase,
  checkSolution,
  isPhraseComplete,
  isLetterFullyRevealed,
  getRemainingConsonants,
  getRemainingVowels,
} from '../logic/gameEngine.js';
import { normalizeChar, isVowel, isLetter } from '../utils/italian.js';
import { sound } from '../audio/soundEngine.js';
import { settings } from './settingsStore.svelte.js';

function createGame() {
  // --- Players & mode ---
  let players = $state([]);
  let currentPlayerIndex = $state(0);
  let isMultiplayer = $derived(players.length > 1);

  // --- Round system ---
  let currentRound = $state(1);
  let totalRounds = $state(1);
  let totalScores = $state([]);

  // --- Game state ---
  let phraseObj = $state(getRandomPhrase());
  let revealedLetters = $state(new Set());
  let usedLetters = $state(new Set());
  let jollyRevealedPositions = $state(new Set());
  let currentSeed = $state('classico');
  let bankruptCount = $state(0);
  // phases: menu | idle | spinning | picking_consonant | picking_vowel | picking_jolly | solving | round_won | game_over
  let phase = $state('menu');
  let currentSpinValue = $state(null);
  let message = $state('');
  let hasSpunThisTurn = $state(false);
  // Tracks which player indices have already bought a vowel this round
  let boughtVowelThisRound = $state(new Set());
  let roundWinner = $state(null);

  // --- Online spin sync ---
  let lastSpinIndex = $state(null);

  // --- Timer ---
  let turnTimer = $state(settings.timerSeconds);
  let timerInterval = null;
  let _onTimerExpired = null;

  function startTimer() {
    if (!isMultiplayer) return;
    stopTimer();
    turnTimer = settings.timerSeconds;
    timerInterval = setInterval(() => {
      turnTimer--;
      if (turnTimer <= 0) {
        stopTimer();
        showMessage(`Tempo scaduto! ${currentPlayer.name} perde il turno.`);
        nextTurn();
        if (_onTimerExpired) _onTimerExpired();
      }
    }, 1000);
  }

  // Display-only timer for clients (counts down but does NOT call nextTurn)
  function startDisplayTimer() {
    stopTimer();
    if (turnTimer <= 0) return;
    timerInterval = setInterval(() => {
      turnTimer--;
      if (turnTimer <= 0) {
        stopTimer();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function resetTimer() {
    turnTimer = settings.timerSeconds;
  }

  function onTimerExpired(callback) {
    _onTimerExpired = callback;
  }

  // --- Derived ---
  let phraseLetters = $derived(getLettersInPhrase(phraseObj.text));
  let consonantsLeft = $derived(getRemainingConsonants(phraseLetters, usedLetters).length > 0);
  let vowelsLeft = $derived(getRemainingVowels(phraseLetters, usedLetters).length > 0);
  let currentPlayer = $derived(players[currentPlayerIndex] || { name: '', money: 0 });
  let hasBoughtVowelThisRound = $derived(boughtVowelThisRound.has(currentPlayerIndex));
  let canBuyVowel = $derived(!hasBoughtVowelThisRound && currentPlayer.money >= settings.vowelCost && vowelsLeft && phase === 'idle');
  let canSpin = $derived(consonantsLeft && phase === 'idle');
  let canSolve = $derived(phase === 'idle');

  function showMessage(text, duration = 2500) {
    message = text;
    setTimeout(() => { message = ''; }, duration);
  }

  function applyMinPrize() {
    players[currentPlayerIndex].money += 1000;
    showMessage(`Bonus vittoria! +1000€`, 3000);
  }

  function handleWin() {
    stopTimer();
    applyMinPrize();
    roundWinner = { ...players[currentPlayerIndex] };

    // Only the winner keeps their round earnings
    totalScores[currentPlayerIndex] += players[currentPlayerIndex].money;

    if (currentRound >= totalRounds) {
      phase = 'game_over';
    } else {
      phase = 'round_won';
    }
    sound.winFanfare();
  }

  function nextTurn() {
    hasSpunThisTurn = false;
    if (isMultiplayer) {
      currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    }
    phase = 'idle';
    startTimer();
  }

  // --- Setup ---
  function startGame(playerNames, rounds = 1, seed = 'classico', firstPlayerIndex = null, phraseOverride = null) {
    players = playerNames.map(name => ({ name, money: 0 }));
    totalRounds = rounds;
    currentRound = 1;
    totalScores = playerNames.map(() => 0);
    currentPlayerIndex = firstPlayerIndex != null
      ? firstPlayerIndex
      : (players.length > 1 ? Math.floor(Math.random() * players.length) : 0);
    currentSeed = seed;
    bankruptCount = 0;
    phraseObj = phraseOverride || getRandomPhrase(settings.enabledCategories, settings.difficulty);
    revealedLetters = new Set();
    usedLetters = new Set();
    jollyRevealedPositions = new Set();
    currentSpinValue = null;
    hasSpunThisTurn = false;
    boughtVowelThisRound = new Set();
    roundWinner = null;
    lastSpinIndex = null;
    message = '';
    phase = 'idle';
    startTimer();
    sound.startBgMusic();
    if (players.length > 1) {
      showMessage(`${players[currentPlayerIndex].name} inizia per primo!`, 3000);
    }
  }

  // Start game from remote state (for online clients)
  function startGameFromState(remoteState) {
    applyRemoteState(remoteState);
    sound.startBgMusic();
  }

  function goToMenu() {
    stopTimer();
    sound.stopBgMusic();
    phase = 'menu';
  }

  // --- Actions ---
  function startSpin() {
    if (!canSpin) return;
    sound.spinStart();
    stopTimer();
    phase = 'spinning';
  }

  function handleSpinResult(segment, spinIndex) {
    currentSpinValue = segment.value;
    if (spinIndex !== undefined) {
      lastSpinIndex = spinIndex;
    }

    if (segment.value === 'passa') {
      sound.passSound();
      showMessage(isMultiplayer
        ? `PASSA! ${currentPlayer.name} perde il turno.`
        : 'PASSA! Hai perso il giro.');
      nextTurn();
    } else if (segment.value === 'bancarotta') {
      sound.bankruptcy();
      players[currentPlayerIndex].money = 0;
      bankruptCount++;
      showMessage(isMultiplayer
        ? `BANCAROTTA! ${currentPlayer.name} perde tutto!`
        : 'BANCAROTTA! Hai perso tutto!');
      nextTurn();
    } else if (segment.value === 'jolly') {
      sound.jollySound();
      showMessage(isMultiplayer
        ? `JOLLY! ${currentPlayer.name} sceglie una lettera!`
        : 'JOLLY! Scegli una lettera sulla frase!');
      phase = 'picking_jolly';
    } else {
      hasSpunThisTurn = true;
      phase = 'picking_consonant';
      startTimer();
    }
  }

  function useJolly(absoluteIndex) {
    if (phase !== 'picking_jolly') return;

    const char = phraseObj.text[absoluteIndex];
    if (!char || !isLetter(char)) return;
    const norm = normalizeChar(char);

    if (usedLetters.has(norm)) return;

    sound.letterReveal();
    revealedLetters = new Set([...revealedLetters, norm]);
    usedLetters = new Set([...usedLetters, norm]);

    if (isPhraseComplete(phraseObj.text, revealedLetters, jollyRevealedPositions)) {
      handleWin();
      return;
    }
    phase = 'idle';
    startTimer();
  }

  function pickConsonant(letter) {
    if (phase !== 'picking_consonant') return;
    const norm = normalizeChar(letter);
    if (isVowel(norm) || usedLetters.has(norm)) return;

    usedLetters = new Set([...usedLetters, norm]);
    const count = countOccurrences(phraseObj.text, norm);

    if (count > 0) {
      sound.letterReveal();
      revealedLetters = new Set([...revealedLetters, norm]);
      const earned = currentSpinValue * count;
      players[currentPlayerIndex].money += earned;
      showMessage(`${norm} presente ${count} volta/e! +${earned}€`);
      if (isPhraseComplete(phraseObj.text, revealedLetters, jollyRevealedPositions)) {
        handleWin();
        return;
      }
      phase = 'idle';
      startTimer();
    } else {
      sound.wrongAnswer();
      showMessage(`${norm} non presente!`);
      nextTurn();
    }
  }

  function startBuyVowel() {
    if (!canBuyVowel) return;
    sound.buttonClick();
    phase = 'picking_vowel';
  }

  function buyVowel(letter) {
    if (phase !== 'picking_vowel') return;
    const norm = normalizeChar(letter);
    if (!isVowel(norm) || usedLetters.has(norm)) return;

    players[currentPlayerIndex].money -= settings.vowelCost;
    boughtVowelThisRound = new Set([...boughtVowelThisRound, currentPlayerIndex]);
    usedLetters = new Set([...usedLetters, norm]);
    const count = countOccurrences(phraseObj.text, norm);

    if (count > 0) {
      sound.letterReveal();
      revealedLetters = new Set([...revealedLetters, norm]);
      showMessage(`${norm} presente ${count} volta/e!`);
      if (isPhraseComplete(phraseObj.text, revealedLetters, jollyRevealedPositions)) {
        handleWin();
        return;
      }
      phase = 'idle';
      startTimer();
    } else {
      sound.wrongAnswer();
      showMessage(`${norm} non presente!`);
      nextTurn();
    }
  }

  function startSolve() {
    if (!canSolve) return;
    sound.buttonClick();
    stopTimer();
    phase = 'solving';
  }

  function attemptSolve(guess) {
    if (checkSolution(phraseObj.text, guess)) {
      revealedLetters = new Set([...getLettersInPhrase(phraseObj.text)]);
      handleWin();
    } else {
      sound.wrongAnswer();
      showMessage(isMultiplayer
        ? `Risposta sbagliata! ${currentPlayer.name} perde il turno.`
        : 'Risposta sbagliata!');
      nextTurn();
    }
  }

  function cancelSolve() {
    phase = 'idle';
    startTimer();
  }

  // Next round (after round_won screen)
  function nextRound() {
    currentRound++;
    phraseObj = getRandomPhrase(settings.enabledCategories, settings.difficulty);
    revealedLetters = new Set();
    usedLetters = new Set();
    jollyRevealedPositions = new Set();
    currentSpinValue = null;
    hasSpunThisTurn = false;
    boughtVowelThisRound = new Set();
    roundWinner = null;
    lastSpinIndex = null;
    message = '';
    players.forEach(p => { p.money = 0; });
    currentPlayerIndex = players.length > 1 ? Math.floor(Math.random() * players.length) : 0;
    phase = 'idle';
    startTimer();
    if (players.length > 1) {
      showMessage(`${players[currentPlayerIndex].name} inizia il round!`, 3000);
    }
  }

  // Restart entire game (from game_over)
  function newGame() {
    currentRound = 1;
    bankruptCount = 0;
    totalScores = players.map(() => 0);
    phraseObj = getRandomPhrase(settings.enabledCategories, settings.difficulty);
    revealedLetters = new Set();
    usedLetters = new Set();
    jollyRevealedPositions = new Set();
    currentSpinValue = null;
    hasSpunThisTurn = false;
    boughtVowelThisRound = new Set();
    roundWinner = null;
    lastSpinIndex = null;
    message = '';
    players.forEach(p => { p.money = 0; });
    currentPlayerIndex = players.length > 1 ? Math.floor(Math.random() * players.length) : 0;
    phase = 'idle';
    startTimer();
    if (players.length > 1) {
      showMessage(`${players[currentPlayerIndex].name} inizia per primo!`, 3000);
    }
  }

  function removePlayer(name) {
    const idx = players.findIndex(p => p.name === name);
    if (idx === -1) return;

    players = players.filter((_, i) => i !== idx);
    totalScores = totalScores.filter((_, i) => i !== idx);

    // Shift boughtVowelThisRound indices
    const newBought = new Set();
    for (const i of boughtVowelThisRound) {
      if (i < idx) newBought.add(i);
      else if (i > idx) newBought.add(i - 1);
    }
    boughtVowelThisRound = newBought;

    // If only 1 player left, they win
    if (players.length <= 1) {
      stopTimer();
      if (players.length === 1) {
        showMessage(`${name} ha abbandonato. ${players[0].name} vince la partita!`, 4000);
        roundWinner = { ...players[0] };
        totalScores[0] += players[0].money;
        phase = 'game_over';
        sound.winFanfare();
      }
      return;
    }

    showMessage(`${name} ha abbandonato la partita.`, 3000);

    // Adjust currentPlayerIndex
    if (idx < currentPlayerIndex) {
      currentPlayerIndex--;
    } else if (idx === currentPlayerIndex) {
      currentPlayerIndex = currentPlayerIndex % players.length;
      hasSpunThisTurn = false;
      phase = 'idle';
      startTimer();
    }
  }

  function setSpinIndex(idx) {
    lastSpinIndex = idx;
  }

  // --- Online serialization ---
  function getSerializableState() {
    return {
      players: players.map(p => ({ name: p.name, money: p.money })),
      currentPlayerIndex,
      currentRound,
      totalRounds,
      totalScores: [...totalScores],
      phraseObj: { text: phraseObj.text, category: phraseObj.category },
      revealedLetters: [...revealedLetters],
      usedLetters: [...usedLetters],
      jollyRevealedPositions: [...jollyRevealedPositions],
      phase,
      currentSpinValue,
      hasSpunThisTurn,
      boughtVowelThisRound: [...boughtVowelThisRound],
      roundWinner,
      lastSpinIndex,
      turnTimer,
      message,
      currentSeed,
      bankruptCount,
    };
  }

  function applyRemoteState(state) {
    stopTimer();
    players = state.players.map(p => ({ name: p.name, money: p.money }));
    currentPlayerIndex = state.currentPlayerIndex;
    currentRound = state.currentRound;
    totalRounds = state.totalRounds;
    totalScores = [...state.totalScores];
    if (state.phraseObj.text) {
      phraseObj = { text: state.phraseObj.text, category: state.phraseObj.category };
    } else if (state.phraseObj.category) {
      phraseObj = { ...phraseObj, category: state.phraseObj.category };
    }
    revealedLetters = new Set(state.revealedLetters);
    usedLetters = new Set(state.usedLetters);
    jollyRevealedPositions = new Set(state.jollyRevealedPositions);
    phase = state.phase;
    currentSpinValue = state.currentSpinValue;
    hasSpunThisTurn = state.hasSpunThisTurn;
    boughtVowelThisRound = new Set(state.boughtVowelThisRound ?? []);
    roundWinner = state.roundWinner;
    lastSpinIndex = state.lastSpinIndex;
    turnTimer = state.turnTimer != null ? state.turnTimer : settings.timerSeconds;
    if (state.currentSeed) currentSeed = state.currentSeed;
    if (state.bankruptCount !== undefined) bankruptCount = state.bankruptCount;
    if (state.message) {
      showMessage(state.message);
    }
    // Start display-only countdown on the client so timer ticks visually
    const activePhases = ['idle', 'picking_consonant', 'picking_vowel', 'picking_jolly', 'solving'];
    if (turnTimer > 0 && activePhases.includes(phase)) {
      startDisplayTimer();
    }
  }

  function restoreFromSession(savedState) {
    stopTimer();
    players = savedState.players.map(p => ({ name: p.name, money: p.money }));
    currentPlayerIndex = savedState.currentPlayerIndex;
    currentRound = savedState.currentRound;
    totalRounds = savedState.totalRounds;
    totalScores = [...savedState.totalScores];
    phraseObj = { text: savedState.phraseObj.text, category: savedState.phraseObj.category };
    revealedLetters = new Set(savedState.revealedLetters);
    usedLetters = new Set(savedState.usedLetters);
    jollyRevealedPositions = new Set(savedState.jollyRevealedPositions);
    phase = savedState.phase;
    currentSpinValue = savedState.currentSpinValue;
    hasSpunThisTurn = savedState.hasSpunThisTurn;
    boughtVowelThisRound = new Set(savedState.boughtVowelThisRound ?? []);
    roundWinner = savedState.roundWinner;
    lastSpinIndex = savedState.lastSpinIndex;
    turnTimer = savedState.turnTimer != null ? savedState.turnTimer : settings.timerSeconds;
    if (savedState.currentSeed) currentSeed = savedState.currentSeed;
    if (savedState.bankruptCount !== undefined) bankruptCount = savedState.bankruptCount;
    message = '';

    // Restart timer for multiplayer active phases
    const activePhases = ['idle', 'picking_consonant', 'picking_vowel', 'picking_jolly'];
    if (players.length > 1 && activePhases.includes(phase)) {
      startTimer();
    }
  }

  return {
    get players() { return players; },
    get currentPlayerIndex() { return currentPlayerIndex; },
    get currentPlayer() { return currentPlayer; },
    get isMultiplayer() { return isMultiplayer; },
    get phraseObj() { return phraseObj; },
    get revealedLetters() { return revealedLetters; },
    get usedLetters() { return usedLetters; },
    get jollyRevealedPositions() { return jollyRevealedPositions; },
    get phase() { return phase; },
    get currentSpinValue() { return currentSpinValue; },
    get message() { return message; },
    get consonantsLeft() { return consonantsLeft; },
    get canBuyVowel() { return canBuyVowel; },
    get canSpin() { return canSpin; },
    get canSolve() { return canSolve; },
    get currentRound() { return currentRound; },
    get totalRounds() { return totalRounds; },
    get totalScores() { return totalScores; },
    get roundWinner() { return roundWinner; },
    get vowelsLeft() { return vowelsLeft; },
    get currentSeed() { return currentSeed; },
    get bankruptCount() { return bankruptCount; },
    get hasBoughtVowelThisRound() { return hasBoughtVowelThisRound; },
    get hasSpunThisTurn() { return hasSpunThisTurn; },
    get turnTimer() { return turnTimer; },
    get lastSpinIndex() { return lastSpinIndex; },
    setSpinIndex,
    removePlayer,
    startGame,
    startGameFromState,
    goToMenu,
    startSpin,
    handleSpinResult,
    pickConsonant,
    buyVowel,
    startBuyVowel,
    startSolve,
    attemptSolve,
    cancelSolve,
    useJolly,
    nextRound,
    newGame,
    getSerializableState,
    applyRemoteState,
    onTimerExpired,
    restoreFromSession,
  };
}

export const game = createGame();
