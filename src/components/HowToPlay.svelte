<script>
  import { fly } from 'svelte/transition';

  let { open = false, onClose = () => {} } = $props();
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="overlay" transition:fly={{ y: 30, duration: 300 }} onclick={onClose}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <button class="close-btn" onclick={onClose}>&times;</button>
      <h2>Come si gioca</h2>

      <div class="rules">
        <section>
          <h3>Obiettivo</h3>
          <p>Indovina la frase nascosta girando la ruota e scegliendo le lettere giuste. Accumula piu soldi possibile!</p>
        </section>

        <section>
          <h3>Il turno</h3>
          <ol>
            <li><strong>Gira la ruota</strong>: trascina la ruota per farla girare</li>
            <li><strong>Scegli una consonante</strong>: se presente nella frase, guadagni il valore della ruota per ogni occorrenza</li>
            <li><strong>Compra una vocale</strong> (opzionale): costa 500€, non fa guadagnare ma rivela le lettere</li>
            <li><strong>Risolvi</strong>: prova a indovinare l'intera frase quando pensi di conoscerla</li>
          </ol>
        </section>

        <section>
          <h3>Caselle speciali</h3>
          <div class="specials">
            <div class="special-item">
              <span class="special-badge passa">PASSA</span>
              <span>Perdi il turno. Tocca al prossimo giocatore.</span>
            </div>
            <div class="special-item">
              <span class="special-badge bancarotta">BANCAROTTA</span>
              <span>Perdi tutti i soldi del round!</span>
            </div>
            <div class="special-item">
              <span class="special-badge jolly">JOLLY</span>
              <span>Scegli una lettera qualsiasi direttamente sulla frase per rivelarla gratis.</span>
            </div>
          </div>
        </section>

        <section>
          <h3>Vittoria</h3>
          <p>Vinci il round quando la frase e completamente rivelata o quando la risolvi correttamente. Il vincitore riceve un bonus di 1000€ in aggiunta ai guadagni del round.</p>
        </section>

        <section>
          <h3>Modalita di gioco</h3>
          <div class="modes">
            <div class="mode-item">
              <strong>1 Giocatore</strong>: gioca da solo senza limiti di tempo
            </div>
            <div class="mode-item">
              <strong>Locale</strong>: da 2 a 4 giocatori sullo stesso dispositivo, a turni con timer
            </div>
            <div class="mode-item">
              <strong>Online</strong>: gioca con amici su dispositivi diversi. L'host crea la stanza e condivide il codice
            </div>
          </div>
        </section>

        <section>
          <h3>Varianti della ruota</h3>
          <p>Prima di iniziare puoi scegliere una variante per cambiare il comportamento della ruota:</p>
          <div class="variants">
            <div class="variant-item">
              <strong class="variant-name">Classica</strong>
              <span>Il gioco standard. Premi da 100 a 1000, Passa, Bancarotta e Jolly.</span>
            </div>
            <div class="variant-item">
              <strong class="variant-name">Jackpot</strong>
              <span>Premi altissimi, nessuna Bancarotta. Adatto ai principianti!</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(4, 6, 18, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 400;
    backdrop-filter: blur(8px);
    padding: 1rem;
  }
  .modal {
    background: var(--indigo);
    border: 1px solid var(--glass-border-strong);
    border-radius: var(--radius-lg);
    padding: 2rem;
    max-width: 520px;
    width: 100%;
    max-height: 85vh;
    overflow-y: auto;
    position: relative;
  }
  .close-btn {
    position: absolute;
    top: 0.8rem;
    right: 1rem;
    background: none;
    border: none;
    color: var(--text-faint);
    font-size: 2rem;
    cursor: pointer;
    line-height: 1;
    transition: color 0.2s;
  }
  .close-btn:hover {
    color: var(--text);
  }
  h2 {
    font-family: var(--font-display);
    color: var(--text);
    font-weight: 700;
    font-size: 1.3rem;
    margin: 0 0 1.5rem;
    text-align: center;
    letter-spacing: 1px;
  }
  h3 {
    font-family: var(--font-ui);
    color: var(--amber);
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  section {
    margin-bottom: 1.5rem;
  }
  section:last-child {
    margin-bottom: 0;
  }
  p {
    font-family: var(--font-ui);
    color: rgba(244,242,255,0.8);
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0;
  }
  ol {
    font-family: var(--font-ui);
    color: rgba(244,242,255,0.8);
    font-size: 0.9rem;
    line-height: 1.6;
    padding-left: 1.2rem;
    margin: 0;
  }
  ol li {
    margin-bottom: 0.3rem;
  }
  ol li strong {
    color: var(--amber);
  }
  .specials {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .special-item {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    font-family: var(--font-ui);
    color: rgba(244,242,255,0.8);
    font-size: 0.85rem;
  }
  .special-badge {
    font-family: var(--font-ui);
    font-size: 0.68rem;
    font-weight: 700;
    padding: 0.3rem 0.6rem;
    border-radius: 8px;
    letter-spacing: 1px;
    flex-shrink: 0;
    min-width: 5.4rem;
    text-align: center;
  }
  .special-badge.passa {
    background: rgba(124,108,255,0.12);
    color: #A99DFF;
    border: 1px solid rgba(124,108,255,0.45);
  }
  .special-badge.bancarotta {
    background: rgba(255,93,115,0.1);
    color: var(--coral);
    border: 1px solid rgba(255,93,115,0.4);
  }
  .special-badge.jolly {
    background: rgba(51,214,181,0.1);
    color: var(--mint);
    border: 1px solid rgba(51,214,181,0.4);
  }
  .modes {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .mode-item {
    font-family: var(--font-ui);
    color: rgba(244,242,255,0.8);
    font-size: 0.85rem;
    padding: 0.55rem 0.9rem;
    background: var(--glass);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    line-height: 1.4;
  }
  .mode-item strong {
    color: var(--amber);
  }
  .variants {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  .variant-item {
    font-family: var(--font-ui);
    color: rgba(244,242,255,0.8);
    font-size: 0.85rem;
    padding: 0.55rem 0.9rem;
    background: var(--glass);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    line-height: 1.4;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .variant-name {
    color: var(--amber);
  }

  /* Scrollbar styling */
  .modal::-webkit-scrollbar {
    width: 6px;
  }
  .modal::-webkit-scrollbar-track {
    background: transparent;
  }
  .modal::-webkit-scrollbar-thumb {
    background: rgba(245,182,63,0.25);
    border-radius: 3px;
  }

  @media (max-width: 480px) {
    .modal {
      padding: 1.5rem;
    }
    h2 {
      font-size: 1.15rem;
    }
  }
</style>
