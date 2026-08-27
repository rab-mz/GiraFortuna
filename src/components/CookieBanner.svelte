<script>
  import { fly } from 'svelte/transition';

  let consent = $state(null); // null = non deciso, 'granted' | 'denied'
  let showDetails = $state(false);

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('gf_consent');
    if (saved === 'granted' || saved === 'denied') {
      consent = saved;
      applyConsent(saved);
    }
  }

  function applyConsent(value) {
    // Google Consent Mode v2. Il sito non mostra annunci: i permessi
    // pubblicitari restano negati, si chiede solo la statistica.
    window.gtag?.('consent', 'update', {
      analytics_storage: value,
    });
  }

  function accept() {
    consent = 'granted';
    localStorage.setItem('gf_consent', 'granted');
    applyConsent('granted');
  }

  function deny() {
    consent = 'denied';
    localStorage.setItem('gf_consent', 'denied');
    applyConsent('denied');
  }

  // Spinge giu' la pagina quanto e' alta la barra, cosi' non copre l'intestazione.
  let barEl = $state(null);
  $effect(() => {
    if (consent !== null || !barEl) return;
    const apply = () => { document.body.style.paddingTop = `${barEl.offsetHeight}px`; };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(barEl);
    return () => {
      ro.disconnect();
      document.body.style.paddingTop = '';
    };
  });

  function toggleDetails() {
    showDetails = !showDetails;
  }
</script>

{#if consent === null}
  <!-- entra con calma, esce subito: il `delay` di `transition:` valeva anche in uscita -->
  <div
    class="bar"
    bind:this={barEl}
    in:fly={{ y: -40, duration: 300, delay: 800 }}
    out:fly={{ y: -30, duration: 160 }}
  >
    <div class="row">
      <span class="msg">
        Usiamo cookie tecnici e di statistica. Nessuna pubblicita'.
        <button class="link" onclick={toggleDetails}>
          {showDetails ? 'Nascondi' : 'Dettagli'}
        </button>
      </span>
      <span class="actions">
        <button class="btn deny" onclick={deny}>Rifiuta</button>
        <button class="btn accept" onclick={accept}>Accetta</button>
      </span>
    </div>

    {#if showDetails}
      <ul class="details" transition:fly={{ y: -8, duration: 160 }}>
        <li><span class="dot green"></span><strong>Tecnici</strong>: necessari al funzionamento</li>
        <li><span class="dot blue"></span><strong>Statistica</strong>: visite e sessioni di gioco</li>
      </ul>
    {/if}
  </div>
{/if}

<style>
  .bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 500;
    padding: 0.55rem 0.9rem;
    background: rgba(20, 26, 61, 0.94);
    border-bottom: 1px solid var(--glass-border);
    backdrop-filter: blur(14px);
  }
  .row {
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.9rem;
    flex-wrap: wrap;
  }
  .msg {
    font-family: var(--font-ui);
    font-size: 0.82rem;
    line-height: 1.35;
    color: var(--text-dim);
  }
  .link {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: var(--amber);
    text-decoration: underline;
    cursor: pointer;
  }
  .actions {
    display: flex;
    gap: 0.45rem;
    flex-shrink: 0;
  }
  .btn {
    padding: 0.35rem 0.9rem;
    border-radius: 10px;
    font-family: var(--font-ui);
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }
  .accept {
    background: var(--amber);
    color: var(--ink);
    border: none;
  }
  .accept:hover {
    background: var(--amber-bright);
  }
  .deny {
    background: transparent;
    color: var(--text-dim);
    border: 1px solid var(--glass-border-strong);
  }
  .deny:hover {
    color: var(--text);
    background: var(--glass-strong);
  }
  .details {
    max-width: 900px;
    margin: 0.5rem auto 0.15rem;
    padding: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 1.2rem;
    font-family: var(--font-ui);
    font-size: 0.76rem;
    color: var(--text-faint);
  }
  .details strong {
    color: rgba(244, 242, 255, 0.8);
    font-weight: 600;
  }
  .dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 0.4rem;
    vertical-align: 1px;
  }
  .green { background: var(--mint); }
  .blue { background: var(--cobalt); }

  @media (max-width: 560px) {
    .row {
      justify-content: space-between;
      gap: 0.6rem;
    }
    .msg {
      font-size: 0.76rem;
      flex: 1;
      min-width: 12rem;
    }
    .btn {
      padding: 0.35rem 0.7rem;
      font-size: 0.78rem;
    }
    .details {
      flex-direction: column;
      gap: 0.25rem;
    }
  }
</style>
