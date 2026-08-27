<script>
  import { fly, scale } from 'svelte/transition';

  let {
    open = false,
    isOnline = false,
    onConfirm = () => {},
    onCancel = () => {},
  } = $props();
</script>

{#if open}
  <div class="overlay" transition:fly={{ y: 50, duration: 300 }}>
    <div class="modal" transition:scale={{ duration: 300, delay: 100 }}>
      <h2>Vuoi davvero uscire?</h2>

      <p class="warning-text">
        {#if isOnline}
          Se esci, lascerai la partita e gli altri giocatori.
          Non potrai rientrare nella stanza.
        {:else}
          Se esci, la partita in corso verra' persa
          e non potrai riprendere da dove eri rimasto.
        {/if}
      </p>

      <div class="buttons">
        <button class="btn-stay" onclick={onCancel}>Resta in partita</button>
        <button class="btn-exit" onclick={onConfirm}>Esci</button>
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
    z-index: 500;
    backdrop-filter: blur(8px);
    padding: 1rem;
  }
  .modal {
    background: var(--indigo);
    border: 1px solid rgba(255,93,115,0.45);
    border-radius: var(--radius-lg);
    padding: 2rem;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 8px 40px rgba(0,0,0,0.5);
    text-align: center;
  }
  h2 {
    color: var(--coral);
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 1rem;
  }
  .warning-text {
    color: var(--text-dim);
    font-family: var(--font-ui);
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0 0 1.5rem;
  }
  .buttons {
    display: flex;
    gap: 0.8rem;
    justify-content: center;
  }
  .btn-stay {
    padding: 0.8rem 1.8rem;
    background: var(--amber);
    color: var(--ink);
    border: none;
    border-radius: 14px;
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.5px;
    transition: all 0.2s;
  }
  .btn-stay:hover {
    background: var(--amber-bright);
    transform: scale(1.04);
  }
  .btn-exit {
    padding: 0.8rem 1.5rem;
    background: rgba(255,93,115,0.12);
    color: var(--coral);
    border: 1px solid rgba(255,93,115,0.4);
    border-radius: 14px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-exit:hover {
    background: rgba(255,93,115,0.22);
  }

  @media (max-width: 480px) {
    .modal { padding: 1.5rem; }
    h2 { font-size: 1.1rem; }
    .buttons { flex-direction: column; }
  }
</style>