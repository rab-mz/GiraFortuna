import { normalizeChar, isVowel, isLetter, normalize } from '../utils/italian.js';

export function countOccurrences(phrase, letter) {
  const target = normalizeChar(letter);
  let count = 0;
  for (const ch of phrase) {
    if (isLetter(ch) && normalizeChar(ch) === target) count++;
  }
  return count;
}

export function getLettersInPhrase(phrase) {
  const letters = new Set();
  for (const ch of phrase) {
    if (isLetter(ch)) letters.add(normalizeChar(ch));
  }
  return letters;
}

export function checkSolution(phrase, guess) {
  return normalize(phrase) === normalize(guess);
}

export function isPhraseComplete(phrase, revealedLetters, jollyRevealedPositions = new Set()) {
  let pos = 0;
  for (const ch of phrase) {
    if (isLetter(ch)) {
      if (!revealedLetters.has(normalizeChar(ch)) && !jollyRevealedPositions.has(pos)) return false;
    }
    pos++;
  }
  return true;
}

export function isLetterFullyRevealed(phrase, letter, revealedLetters, jollyRevealedPositions) {
  const target = normalizeChar(letter);
  let pos = 0;
  for (const ch of phrase) {
    if (isLetter(ch) && normalizeChar(ch) === target) {
      if (!revealedLetters.has(target) && !jollyRevealedPositions.has(pos)) return false;
    }
    pos++;
  }
  return true;
}

export function getRemainingConsonants(phraseLetters, usedLetters) {
  return [...phraseLetters].filter(l => !isVowel(l) && !usedLetters.has(l));
}

export function getRemainingVowels(phraseLetters, usedLetters) {
  return [...phraseLetters].filter(l => isVowel(l) && !usedLetters.has(l));
}
