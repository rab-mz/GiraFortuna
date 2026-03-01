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
  // phases: menu | idle | spinning | picking_consonant | picking_vowel | picking_jolly | solving | round_won | game_over
  let phase = $state('menu');
  let currentSpinValue = $state(null);
  let message = $state('');
  let hasSpunThisTurn = $state(false);
  let hasBoughtVowelThisTurn = $state(false);
  let roundWinner = $state(null);

  // --- Online spin sync ---
  let lastSpinIndex = $state(null);

  // --- Timer ---
  const TURN_TIME = 30;
  let turnTimer = $state(TURN_TIME);
  let timerInterval = null;
  let _onTimerExpired = null;

  function startTimer() {
    if (!isMultiplayer) return;
    stopTimer();
    turnTimer = TURN_TIME;
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
    turnTimer = TURN_TIME;
  }

  function onTimerExpired(callback) {
    _onTimerExpired = callback;
  }

  // --- Derived ---
  let phraseLetters = $derived(getLettersInPhrase(phraseObj.text));
  let consonantsLeft = $derived(getRemainingConsonants(phraseLetters, usedLetters).length > 0);
  let vowelsLeft = $derived(getRemainingVowels(phraseLetters, usedLetters).length > 0);
  let currentPlayer = $derived(players[currentPlayerIndex] || { name: '', money: 0 });
  let canBuyVowel = $derived(hasSpunThisTurn && !hasBoughtVowelThisTurn && currentPlayer.money >= 500 && vowelsLeft && phase === 'idle');
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
    hasBoughtVowelThisTurn = false;
    if (isMultiplayer) {
      currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    }
    phase = 'idle';
    startTimer();
  }

  // --- Setup ---
  function startGame(playerNames, rounds = 1) {
    players = playerNames.map(name => ({ name, money: 0 }));
    totalRounds = rounds;
    currentRound = 1;
    totalScores = playerNames.map(() => 0);
    currentPlayerIndex = 0;
    phraseObj = getRandomPhrase();
    revealedLetters = new Set();
    usedLetters = new Set();
    jollyRevealedPositions = new Set();
    currentSpinValue = null;
    hasSpunThisTurn = false;
    hasBoughtVowelThisTurn = false;
    roundWinner = null;
    lastSpinIndex = null;
    message = '';
    phase = 'idle';
    startTimer();
    sound.startBgMusic();
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

    // Get the character at this position
    const char = phraseObj.text[absoluteIndex];
    if (!char || !isLetter(char)) return;
    const norm = normalizeChar(char);

    // Check if already revealed (by letter or by jolly position)
    if (revealedLetters.has(norm)) return;
    if (jollyRevealedPositions.has(absoluteIndex)) return;

    // Reveal this specific position
    jollyRevealedPositions = new Set([...jollyRevealedPositions, absoluteIndex]);
    sound.letterReveal();

    // Check if ALL occurrences of this letter are now revealed
    if (isLetterFullyRevealed(phraseObj.text, norm, revealedLetters, jollyRevealedPositions)) {
      revealedLetters = new Set([...revealedLetters, norm]);
      usedLetters = new Set([...usedLetters, norm]);
    }

    // Check win
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

    players[currentPlayerIndex].money -= 500;
    hasBoughtVowelThisTurn = true;
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
    phraseObj = getRandomPhrase();
    revealedLetters = new Set();
    usedLetters = new Set();
    jollyRevealedPositions = new Set();
    currentSpinValue = null;
    hasSpunThisTurn = false;
    hasBoughtVowelThisTurn = false;
    roundWinner = null;
    lastSpinIndex = null;
    message = '';
    players.forEach(p => { p.money = 0; });
    currentPlayerIndex = 0;
    phase = 'idle';
    startTimer();
  }

  // Restart entire game (from game_over)
  function newGame() {
    currentRound = 1;
    totalScores = players.map(() => 0);
    phraseObj = getRandomPhrase();
    revealedLetters = new Set();
    usedLetters = new Set();
    jollyRevealedPositions = new Set();
    currentSpinValue = null;
    hasSpunThisTurn = false;
    hasBoughtVowelThisTurn = false;
    roundWinner = null;
    lastSpinIndex = null;
    message = '';
    players.forEach(p => { p.money = 0; });
    currentPlayerIndex = 0;
    phase = 'idle';
    startTimer();
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
      hasBoughtVowelThisTurn,
      roundWinner,
      lastSpinIndex,
      turnTimer,
      message,
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
    hasBoughtVowelThisTurn = state.hasBoughtVowelThisTurn;
    roundWinner = state.roundWinner;
    lastSpinIndex = state.lastSpinIndex;
    turnTimer = state.turnTimer != null ? state.turnTimer : TURN_TIME;
    if (state.message) {
      showMessage(state.message);
    }
    // Start display-only countdown on the client so timer ticks visually
    const activePhases = ['idle', 'picking_consonant', 'picking_vowel', 'picking_jolly', 'solving'];
    if (turnTimer > 0 && activePhases.includes(phase)) {
      startDisplayTimer();
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
    get vowelsLeft() { return vowelsLeft; },
    get canBuyVowel() { return canBuyVowel; },
    get canSpin() { return canSpin; },
    get canSolve() { return canSolve; },
    get currentRound() { return currentRound; },
    get totalRounds() { return totalRounds; },
    get totalScores() { return totalScores; },
    get roundWinner() { return roundWinner; },
    get hasSpunThisTurn() { return hasSpunThisTurn; },
    get turnTimer() { return turnTimer; },
    get lastSpinIndex() { return lastSpinIndex; },
    setSpinIndex,
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
  };
}

export const game = createGame();
