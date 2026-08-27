<script>
  import { fly } from 'svelte/transition';

  let { message = '' } = $props();

  // Il tono del messaggio decide il colore, come nella brand board:
  // corallo per le batoste, menta per le vincite, ambra per il resto.
  let tono = $derived.by(() => {
    const t = message.toLowerCase();
    if (/bancarotta|non c'e|non presente|scaduto|passa|perde|hai perso|abbandon/.test(t)) return 'ko';
    if (/\+|bonus|presente|corretta|vince|jolly/.test(t)) return 'ok';
    return 'neutro';
  });
</script>

{#if message}
  <div class="toast-wrap" transition:fly={{ y: -24, duration: 260 }}>
    <div class="toast {tono}" role="status" aria-live="polite">
      <span class="text">{message}</span>
    </div>
  </div>
{/if}

<style>
  .toast-wrap {
    position: fixed;
    top: 0.8rem;
    top: calc(0.8rem + env(safe-area-inset-top, 0px));
    left: 50%;
    transform: translateX(-50%);
    z-index: 200;
    max-width: 90vw;
    pointer-events: none;
  }

  .toast {
    position: relative;
    padding: 0.7rem 1.4rem;
    border-radius: var(--radius-sm);
    background: rgba(20, 26, 61, 0.96);
    border: 1px solid rgba(245, 182, 63, 0.35);
    color: var(--amber);
    font-family: var(--font-display);
    font-size: 1.02rem;
    font-weight: 500;
    line-height: 1.25;
    text-align: center;
    backdrop-filter: blur(12px);
    box-shadow: 0 10px 34px rgba(0, 0, 0, 0.5);
  }
  .toast.ok {
    border-color: rgba(51, 214, 181, 0.35);
    color: var(--mint);
  }
  .toast.ko {
    border-color: rgba(255, 93, 115, 0.35);
    color: var(--coral);
  }
  .text {
    position: relative;
  }

  @media (max-width: 640px) {
    .toast-wrap {
      top: 0.6rem;
      top: calc(0.6rem + env(safe-area-inset-top, 0px));
      left: auto;
      right: 0.6rem;
      transform: none;
    }
    .toast {
      font-size: 0.85rem;
      padding: 0.45rem 1.1rem;
    }
  }
</style>
