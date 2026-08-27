<script>
  // Porta d'ingresso della demo evento (si apre solo con ?demo=alghero).
  // Due percorsi: giocare le frasi come un partecipante, o vedere la finale a 4
  // com'e' sul palco.
  import SpicchiLogo from './SpicchiLogo.svelte';
  import { EVENT_PHRASES, EVENT_DEMO_PLAYERS } from '../lib/data/eventPhrases.js';

  let { onQualifiche = () => {}, onPalco = () => {} } = $props();

  let names = $state([...EVENT_DEMO_PLAYERS]);
</script>

<div class="demo-screen">
  <div class="content">
    <div class="brand-row">
      <SpicchiLogo size={34} />
      <span class="tagline">Demo riservata</span>
    </div>

    <h1 class="title">Gira la Fortuna<br><span>ad Alghero</span></h1>
    <p class="subtitle">
      Anteprima del format per il weekend di ottobre: {EVENT_PHRASES.length} frasi,
      tutte titoli di canzoni. Puoi provarla in due modi.
    </p>

    <div class="cards">
      <button class="card" onclick={() => onQualifiche()}>
        <span class="card-num">1</span>
        <span class="card-body">
          <span class="card-title">Gioca le {EVENT_PHRASES.length} frasi</span>
          <span class="card-text">
            Quello che fa un partecipante allo stand, dal telefono: una frase dopo
            l'altra, e alla fine il punteggio. Durante l'evento questo alimenta la
            classifica che decide i 4 finalisti.
          </span>
        </span>
      </button>

      <div class="card card-static">
        <span class="card-num">2</span>
        <span class="card-body">
          <span class="card-title">Prova la finale a 4</span>
          <span class="card-text">
            Come si vede sul ledwall domenica sera: quattro concorrenti a turno,
            scritte grandi, e a ogni frase risolta lo schermo annuncia la canzone
            da cantare tutti insieme.
          </span>
          <span class="names">
            {#each names as _, i}
              <input
                type="text"
                bind:value={names[i]}
                placeholder={`Concorrente ${i + 1}`}
                aria-label={`Nome del concorrente ${i + 1}`}
              />
            {/each}
          </span>
          <button
            class="cta"
            onclick={() => onPalco(names.map((n, i) => n.trim() || `Concorrente ${i + 1}`))}
          >
            Vai sul palco
          </button>
        </span>
      </div>
    </div>

    <p class="note">
      Le basi musicali non le suona il gioco: allo scoccare della soluzione lo
      schermo dice titolo e film, la base la manda il service audio.
    </p>
  </div>
</div>

<style>
  .demo-screen {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    padding: 3rem 1.2rem;
    background:
      radial-gradient(900px 600px at 80% 10%, rgba(124,108,255,0.10), transparent 60%),
      var(--bg);
  }
  .content {
    width: 100%;
    max-width: 880px;
  }
  .brand-row {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    margin-bottom: 1.2rem;
  }
  .tagline {
    font-family: var(--font-ui);
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .title {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: clamp(2.2rem, 5vw, 3.4rem);
    line-height: 1.02;
    margin-bottom: 0.8rem;
  }
  .title span {
    color: var(--amber);
  }
  .subtitle {
    font-family: var(--font-ui);
    color: var(--text-dim);
    font-size: 1.02rem;
    max-width: 46ch;
    margin-bottom: 2rem;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1rem;
  }
  .card {
    display: flex;
    gap: 1rem;
    text-align: left;
    padding: 1.4rem;
    background: var(--glass);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    color: var(--text);
    font: inherit;
    cursor: pointer;
    transition: all 0.2s;
  }
  .card-static {
    cursor: default;
  }
  button.card:hover {
    background: var(--glass-strong);
    border-color: var(--glass-border-strong);
    transform: translateY(-2px);
  }
  .card-num {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 1.4rem;
    color: var(--amber);
    line-height: 1;
    flex-shrink: 0;
  }
  .card-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
  }
  .card-title {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.14rem;
  }
  .card-text {
    font-family: var(--font-ui);
    font-size: 0.92rem;
    line-height: 1.45;
    color: var(--text-dim);
  }
  .names {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem;
    margin-top: 0.4rem;
  }
  .names input {
    background: var(--glass-strong);
    border: 1px solid var(--glass-border-strong);
    border-radius: 10px;
    padding: 0.5rem 0.7rem;
    color: var(--text);
    font-family: var(--font-ui);
    font-size: 0.9rem;
    min-width: 0;
  }
  .cta {
    margin-top: 0.6rem;
    height: 46px;
    border: none;
    border-radius: 14px;
    background: var(--amber);
    color: var(--ink);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.95rem;
    letter-spacing: 1px;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.2s;
  }
  .cta:hover {
    background: var(--amber-bright);
  }
  .note {
    margin-top: 1.6rem;
    font-family: var(--font-ui);
    font-size: 0.88rem;
    color: var(--text-faint);
    max-width: 60ch;
  }
</style>
