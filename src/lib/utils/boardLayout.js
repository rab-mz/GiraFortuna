// Impaginazione del tabellone: decide dove vanno a capo le frasi.
//
// Il wrap del browser riempie la riga fino all'ultimo posto libero, e cosi'
// restano preposizioni appese in fondo e righe sbilanciate. Qui si sceglie
// l'impaginazione col criterio della tipografia: righe piene in modo uniforme
// e mai una parolina di servizio staccata da cio' che introduce.

// Parole che non reggono da sole la fine di una riga.
export const PAROLE_LEGATE = new Set([
  'a', 'ad', 'ai', 'al', 'alla', 'alle', 'agli', 'allo', 'che', 'chi', 'coi', 'col',
  'con', 'da', 'dai', 'dal', 'dalla', 'dalle', 'degli', 'dei', 'del', 'della', 'delle',
  'dello', 'di', 'e', 'ed', 'gli', 'i', 'il', 'in', 'la', 'le', 'lo', 'ma', 'nei',
  'nel', 'nella', 'nelle', 'ne', 'non', 'o', 'ogni', 'per', 'piu', 'se', 'si', 'su',
  'sui', 'sul', 'sulla', 'sulle', 'tra', 'fra', 'un', 'una', 'uno',
]);

function pulisci(parola) {
  return parola.toLowerCase().replace(/[^a-zà-ù]/gi, '');
}

export function wordWidth(word, m) {
  return word.length * m.tile + (word.length - 1) * m.gap;
}

// Larghezza in pixel di una riga (indici di parola) con le misure date.
export function rowWidth(row, words, m) {
  const sep = m.space + m.boardGap * 2;
  return row.reduce((tot, i) => tot + wordWidth(words[i], m), 0) + sep * (row.length - 1);
}

// Restituisce un array di righe, ognuna con gli indici delle parole.
export function layoutPhrase(words, boardWidth, m) {
  const n = words.length;
  if (!n) return [];
  if (!boardWidth) return [words.map((_, i) => i)];

  const ww = words.map(w => wordWidth(w, m));
  const sep = m.space + m.boardGap * 2;
  const penalita = Math.pow(boardWidth, 2); // pesa quanto una riga lasciata mezza vuota

  // cost[i] = costo minimo per impaginare le parole da i in poi
  const cost = new Array(n + 1).fill(Infinity);
  const next = new Array(n + 1).fill(n);
  cost[n] = 0;

  for (let i = n - 1; i >= 0; i--) {
    let width = 0;
    for (let j = i; j < n; j++) {
      width += ww[j] + (j > i ? sep : 0);
      if (width > boardWidth && j > i) break;
      const avanzo = Math.max(boardWidth - width, 0);
      let c = avanzo * avanzo;
      const ultimaRiga = j === n - 1;
      if (!ultimaRiga && PAROLE_LEGATE.has(pulisci(words[j]))) c += penalita;
      if (!ultimaRiga && j === i && words[i].length <= 3) c += penalita * 0.5;
      const resto = cost[j + 1];
      if (resto === Infinity) continue;
      const tot = c + resto;
      if (tot < cost[i]) {
        cost[i] = tot;
        next[i] = j + 1;
      }
    }
  }

  const righe = [];
  let i = 0;
  while (i < n && righe.length < 12) {
    const j = Math.max(next[i], i + 1);
    righe.push(Array.from({ length: j - i }, (_, k) => i + k));
    i = j;
  }
  return righe;
}
