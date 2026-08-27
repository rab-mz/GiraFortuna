// Set di frasi della demo evento (Alghero, ottobre 2026): 10 canzoni, in ordine
// fisso e uguali per tutti i partecipanti. La frase da indovinare e' il titolo
// italiano della canzone; `song.film` serve alla schermata "ora si canta", che
// dice al pubblico cosa sta per partire dal mixer del service audio.
//
// Le basi NON le suona il gioco (decisione del 27/08): qui c'e' solo il testo.

export const EVENT_PHRASES = [
  { text: "Il cerchio della vita", category: "Canzone", song: { film: "Il Re Leone" } },
  { text: "In fondo al mar", category: "Canzone", song: { film: "La Sirenetta" } },
  { text: "All'alba sorgero", category: "Canzone", song: { film: "Frozen" } },
  { text: "Hakuna Matata", category: "Canzone", song: { film: "Il Re Leone" } },
  { text: "Il mondo e mio", category: "Canzone", song: { film: "Aladdin" } },
  { text: "Oltre l'orizzonte", category: "Canzone", song: { film: "Oceania" } },
  { text: "Non si nomina Bruno", category: "Canzone", song: { film: "Encanto" } },
  { text: "Ehi ho andiamo a lavorar", category: "Canzone", song: { film: "Biancaneve" } },
  { text: "Stia con noi", category: "Canzone", song: { film: "La Bella e la Bestia" } },
  { text: "Il mio nuovo sogno", category: "Canzone", song: { film: "Rapunzel" } },
];

// Nomi di comodo per la finale a 4 della demo.
export const EVENT_DEMO_PLAYERS = ['Paolo', 'Giulia', 'Marco', 'Elena'];
