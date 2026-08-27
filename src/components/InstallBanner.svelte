<script>
  // Invito ad aggiungere il gioco alla schermata Home. Solo su telefono:
  // su Android usa il prompt nativo di Chrome, su iPhone spiega il gesto
  // (Safari non offre nessuna API per installare).
  import { fly } from 'svelte/transition';
  import SpicchiLogo from './SpicchiLogo.svelte';
  import { getInstallPrompt, onInstallPromptChange, showInstallPrompt } from '../lib/utils/installPrompt.js';

  const DISMISS_KEY = 'gf_install_dismissed';
  const DISMISS_DAYS = 14;

  let platform = $state(null); // 'ios' | 'android' | null
  let iosBrowser = $state('safari'); // su iPhone il gesto cambia da browser a browser
  let visible = $state(false);
  let hasNativePrompt = $state(false);

  function detectPlatform() {
    if (typeof navigator === 'undefined') return null;
    const ua = navigator.userAgent || '';
    // Da iPadOS 13 in poi l'iPad si dichiara Mac: lo si riconosce dal touch.
    const isIOS = /iPad|iPhone|iPod/.test(ua)
      || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
    if (isIOS) {
      // Su iPhone ogni browser usa WebKit, ma il menu da cui si aggiunge cambia.
      if (/CriOS/.test(ua)) iosBrowser = 'chrome';
      else if (/FxiOS|EdgiOS|OPT\//.test(ua)) iosBrowser = 'altro';
      else iosBrowser = 'safari';
      return 'ios';
    }
    if (/Android/i.test(ua)) return 'android';
    return null;
  }

  function alreadyInstalled() {
    return window.matchMedia?.('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
  }

  function dismissedRecently() {
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY));
      if (!at) return false;
      return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  }

  function cookieBannerOpen() {
    try {
      return localStorage.getItem('gf_consent') === null;
    } catch {
      return false;
    }
  }

  $effect(() => {
    platform = detectPlatform();
    if (!platform || alreadyInstalled() || dismissedRecently()) return;

    const unsubscribe = onInstallPromptChange(() => {
      hasNativePrompt = !!getInstallPrompt();
    });
    hasNativePrompt = !!getInstallPrompt();

    // Si fa vedere dopo il banner dei cookie, non insieme.
    let timer = null;
    const check = () => {
      if (cookieBannerOpen()) {
        timer = setTimeout(check, 1000);
        return;
      }
      timer = setTimeout(() => { visible = true; }, 2000);
    };
    check();

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  });

  // Su Android ha senso solo se Chrome ci ha dato il prompt da rilanciare.
  let show = $derived(visible && (platform === 'ios' || (platform === 'android' && hasNativePrompt)));

  function dismiss() {
    visible = false;
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
  }

  async function install() {
    const accepted = await showInstallPrompt();
    if (accepted) visible = false;
    else dismiss();
  }
</script>

{#if show}
  <div class="install-banner" transition:fly={{ y: 80, duration: 300 }}>
    <div class="icon"><SpicchiLogo size={34} /></div>

    <div class="text">
      <span class="title">Tienilo a portata di dito</span>
      {#if platform === 'ios'}
        <span class="body">
          {#if iosBrowser === 'altro'}
            Apri questa pagina in <strong>Safari</strong>, tocca Condividi e poi
            <strong>Aggiungi alla schermata Home</strong>.
          {:else}
            Tocca
            <svg class="share-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-label="condividi">
              <path d="M12 15V3m0 0L8 7m4-4l4 4" />
              <path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
            </svg>
            , poi <strong>Aggiungi alla schermata Home</strong>.
          {/if}
        </span>
      {:else}
        <span class="body">Aggiungi Gira la Fortuna alla schermata Home e si apre come un'app.</span>
      {/if}
    </div>

    {#if platform === 'android'}
      <button class="cta" onclick={install}>Aggiungi</button>
    {/if}

    <button class="close" onclick={dismiss} aria-label="Chiudi">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
  </div>
{/if}

<style>
  .install-banner {
    position: fixed;
    left: 0.7rem;
    right: 0.7rem;
    bottom: calc(0.7rem + env(safe-area-inset-bottom, 0px));
    z-index: 120;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 0.9rem;
    background: rgba(20, 26, 61, 0.96);
    border: 1px solid var(--glass-border-strong);
    border-radius: var(--radius);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(12px);
  }
  .icon {
    display: flex;
    flex-shrink: 0;
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
    flex: 1;
  }
  .title {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--text);
  }
  .body {
    font-family: var(--font-ui);
    font-size: 0.82rem;
    line-height: 1.35;
    color: var(--text-dim);
  }
  .body strong {
    color: rgba(244, 242, 255, 0.85);
    font-weight: 600;
  }
  .share-icon {
    vertical-align: -2px;
    color: var(--cobalt);
  }
  .cta {
    flex-shrink: 0;
    padding: 0.55rem 1rem;
    border: none;
    border-radius: 12px;
    background: var(--amber);
    color: var(--ink);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .close {
    flex-shrink: 0;
    align-self: flex-start;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: none;
    border: none;
    color: var(--text-faint);
    cursor: pointer;
  }
  .close:hover {
    color: var(--text);
  }
</style>
