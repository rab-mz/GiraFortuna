<script>
  import { fly } from 'svelte/transition';

  let consent = $state(null); // null = not decided, 'granted' | 'denied'
  let showDetails = $state(false);

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('gf_consent');
    if (saved === 'granted' || saved === 'denied') {
      consent = saved;
      applyConsent(saved);
    }
  }

  function applyConsent(value) {
    // Google Consent Mode v2
    window.gtag?.('consent', 'update', {
      ad_storage: value,
      ad_user_data: value,
      ad_personalization: value,
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

  function toggleDetails() {
    showDetails = !showDetails;
  }
</script>

{#if consent === null}
  <div class="banner" transition:fly={{ y: -80, x: 40, duration: 400, delay: 800 }}>
    <div class="banner-inner">
      <div class="header">
        <span class="cookie-icon">&#127856;</span>
        <span class="title">Cookie & Privacy</span>
      </div>

      <p class="msg">
        Usiamo cookie per migliorare il gioco e mostrare annunci.
        {#if !showDetails}
          <button class="link-btn" onclick={toggleDetails}>Dettagli</button>
        {/if}
      </p>

      {#if showDetails}
        <div class="details" transition:fly={{ y: -10, duration: 200 }}>
          <div class="detail-row">
            <span class="dot dot-green"></span>
            <span><strong>Tecnici</strong> — necessari al funzionamento</span>
          </div>
          <div class="detail-row">
            <span class="dot dot-blue"></span>
            <span><strong>Analytics</strong> — visite e sessioni di gioco</span>
          </div>
          <div class="detail-row">
            <span class="dot dot-gold"></span>
            <span><strong>Pubblicita'</strong> — annunci di Google AdSense</span>
          </div>
          <button class="link-btn" onclick={toggleDetails}>Nascondi</button>
        </div>
      {/if}

      <div class="buttons">
        <button class="btn btn-accept" onclick={accept}>Accetta</button>
        <button class="btn btn-deny" onclick={deny}>Rifiuta</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .banner {
    position: fixed;
    top: 60px;
    right: 1rem;
    z-index: 500;
    max-width: 340px;
    width: calc(100% - 2rem);
    pointer-events: auto;
  }

  .banner-inner {
    background: linear-gradient(145deg, rgba(13, 27, 74, 0.97), rgba(26, 35, 126, 0.95));
    border: 2px solid rgba(255, 215, 0, 0.35);
    border-radius: 16px;
    padding: 1rem 1.2rem;
    backdrop-filter: blur(16px);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.5),
      0 0 20px rgba(255, 215, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .cookie-icon {
    font-size: 1.4rem;
    animation: wobble 2s ease-in-out infinite;
  }

  @keyframes wobble {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-10deg) scale(1.1); }
    75% { transform: rotate(8deg) scale(1.05); }
  }

  .title {
    font-family: 'Oswald', sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    color: #ffd700;
    letter-spacing: 1px;
    text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
  }

  .msg {
    font-family: 'Inter', sans-serif;
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.75);
    line-height: 1.5;
    margin: 0 0 0.7rem;
  }

  .link-btn {
    background: none;
    border: none;
    color: rgba(255, 215, 0, 0.7);
    font-family: 'Inter', sans-serif;
    font-size: 0.75rem;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color 0.2s;
  }
  .link-btn:hover {
    color: #ffd700;
  }

  .details {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 0.7rem;
    padding: 0.5rem 0.6rem;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .detail-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: 'Inter', sans-serif;
    font-size: 0.72rem;
    color: rgba(255, 255, 255, 0.65);
  }

  .detail-row strong {
    color: rgba(255, 255, 255, 0.85);
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .dot-green { background: #4CAF50; box-shadow: 0 0 4px rgba(76, 175, 80, 0.5); }
  .dot-blue { background: #42A5F5; box-shadow: 0 0 4px rgba(66, 165, 245, 0.5); }
  .dot-gold { background: #ffd700; box-shadow: 0 0 4px rgba(255, 215, 0, 0.5); }

  .buttons {
    display: flex;
    gap: 0.5rem;
  }

  .btn {
    flex: 1;
    padding: 0.5rem 0.8rem;
    border-radius: 10px;
    font-family: 'Oswald', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .btn-accept {
    background: linear-gradient(135deg, #ffd700, #e6b800);
    color: #1a237e;
    box-shadow: 0 3px 12px rgba(255, 215, 0, 0.3);
  }
  .btn-accept:hover {
    transform: translateY(-1px);
    box-shadow: 0 5px 18px rgba(255, 215, 0, 0.4);
  }
  .btn-accept:active {
    transform: translateY(0);
  }

  .btn-deny {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
  .btn-deny:hover {
    background: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.8);
  }

  /* Desktop: bigger */
  @media (min-width: 641px) {
    .banner {
      max-width: 380px;
      top: 70px;
      right: 1.5rem;
    }
    .banner-inner {
      padding: 1.2rem 1.5rem;
    }
    .title {
      font-size: 1.15rem;
    }
    .msg {
      font-size: 0.82rem;
    }
    .btn {
      font-size: 0.95rem;
      padding: 0.55rem 1rem;
    }
  }

  /* Small mobile */
  @media (max-width: 380px) {
    .banner {
      right: 0.5rem;
      width: calc(100% - 1rem);
      max-width: none;
    }
    .banner-inner {
      padding: 0.8rem 1rem;
    }
  }
</style>
