const VOWELS = new Set('AEIOU');

export function normalize(str) {
  return str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z]/g, '');
}

export function isVowel(char) {
  return VOWELS.has(char.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
}

export function isLetter(char) {
  return /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(char);
}

export function normalizeChar(char) {
  return char.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
