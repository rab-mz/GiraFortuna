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
      <h2>Privacy Policy</h2>

      <div class="content">
        <p class="updated">Ultimo aggiornamento: Marzo 2026</p>

        <section>
          <h3>Titolare del trattamento</h3>
          <p>Gira la Fortuna (girafortuna.it) e' un gioco online gratuito. Per contatti: info@girafortuna.it</p>
        </section>

        <section>
          <h3>Dati raccolti</h3>
          <p>Questo sito <strong>non raccoglie dati personali</strong>. Non e' richiesta registrazione, non vengono richiesti nome, email o altri dati identificativi per utilizzare il servizio.</p>
          <p>Nella modalita' multiplayer online, il nome scelto dal giocatore viene trasmesso temporaneamente via WebSocket per il funzionamento della partita e <strong>non viene salvato</strong> in alcun database.</p>
        </section>

        <section>
          <h3>Cookie</h3>
          <p>Questo sito utilizza esclusivamente <strong>cookie tecnici</strong> necessari al funzionamento (es. preferenze locali). Non vengono utilizzati cookie di profilazione o di terze parti a scopo pubblicitario.</p>
          <p>I cookie tecnici non richiedono il consenso dell'utente ai sensi dell'art. 122 del Codice Privacy e del provvedimento del Garante dell'8 maggio 2014.</p>
        </section>

        <section>
          <h3>Servizi di terze parti</h3>
          <p><strong>Supabase</strong>: utilizzato esclusivamente per la funzionalita' multiplayer in tempo reale tramite WebSocket. Non vengono trasferiti dati personali. <a href="https://supabase.com/privacy" target="_blank" rel="noopener">Privacy Policy di Supabase</a>.</p>
          <p><strong>Netlify</strong>: il sito e' ospitato su Netlify. I log del server possono contenere indirizzi IP in forma anonimizzata. <a href="https://www.netlify.com/privacy/" target="_blank" rel="noopener">Privacy Policy di Netlify</a>.</p>
        </section>

        <section>
          <h3>Diritti dell'utente</h3>
          <p>Ai sensi del Regolamento UE 2016/679 (GDPR), l'utente ha diritto di accesso, rettifica, cancellazione e portabilita' dei propri dati. Poiche' non raccogliamo dati personali, tali diritti sono automaticamente garantiti.</p>
        </section>

        <section>
          <h3>Modifiche</h3>
          <p>Questa policy puo' essere aggiornata. Eventuali modifiche saranno pubblicate su questa pagina.</p>
        </section>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 400;
    backdrop-filter: blur(8px);
    padding: 1rem;
  }
  .modal {
    background: linear-gradient(135deg, #1a237e, #0d1b4a);
    border: 2px solid rgba(255,215,0,0.3);
    border-radius: 16px;
    padding: 2rem;
    max-width: 560px;
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
    color: rgba(255,255,255,0.5);
    font-size: 2rem;
    cursor: pointer;
    line-height: 1;
    transition: color 0.2s;
  }
  .close-btn:hover { color: #fff; }
  h2 {
    font-family: 'Oswald', sans-serif;
    color: #ffd700;
    font-size: 1.8rem;
    margin: 0 0 0.5rem;
    text-align: center;
    letter-spacing: 2px;
  }
  .updated {
    text-align: center;
    color: rgba(255,255,255,0.4);
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    margin-bottom: 1.5rem;
  }
  h3 {
    font-family: 'Oswald', sans-serif;
    color: #ffd700;
    font-size: 1rem;
    margin: 0 0 0.4rem;
    letter-spacing: 1px;
  }
  section {
    margin-bottom: 1.2rem;
  }
  p {
    font-family: 'Inter', sans-serif;
    color: rgba(255,255,255,0.8);
    font-size: 0.85rem;
    line-height: 1.6;
    margin: 0 0 0.5rem;
  }
  p strong { color: #fff; }
  a {
    color: #ffd700;
    text-decoration: underline;
  }
  a:hover { color: #fff; }

  .modal::-webkit-scrollbar { width: 6px; }
  .modal::-webkit-scrollbar-track { background: transparent; }
  .modal::-webkit-scrollbar-thumb { background: rgba(255,215,0,0.3); border-radius: 3px; }

  @media (max-width: 480px) {
    .modal { padding: 1.5rem; }
    h2 { font-size: 1.4rem; }
  }
</style>
