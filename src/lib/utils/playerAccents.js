// Colori "accento" dei giocatori (dalle tavole Partita del canvas):
// 1 ambra, 2 violetto, 3 menta, 4 cobalto.
export const PLAYER_ACCENTS = [
  { solid: '#F5B63F', text: '#F5B63F', bg: 'rgba(245,182,63,0.25)', onSolid: '#14102A' },
  { solid: '#7C6CFF', text: '#A99DFF', bg: 'rgba(124,108,255,0.25)', onSolid: '#F4F2FF' },
  { solid: '#33D6B5', text: '#33D6B5', bg: 'rgba(51,214,181,0.22)', onSolid: '#14102A' },
  { solid: '#4F8DFF', text: '#4F8DFF', bg: 'rgba(79,141,255,0.25)', onSolid: '#F4F2FF' },
];

export function getPlayerAccent(index) {
  return PLAYER_ACCENTS[index % PLAYER_ACCENTS.length];
}
