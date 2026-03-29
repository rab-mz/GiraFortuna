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
    background: rgba(0,0,0,0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 500;
    backdrop-filter: blur(8px);
    padding: 1rem;
  }
  .modal {
    background: linear-gradient(135deg, #1a237e, #283593);
    border: 2px solid #ff5252;
    border-radius: 16px;
    padding: 2rem;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 8px 40px rgba(0,0,0,0.5);
    text-align: center;
  }
  h2 {
    color: #ff5252;
    font-family: 'Oswald', sans-serif;
    font-size: 1.5rem;
    margin: 0 0 1rem;
    letter-spacing: 1px;
  }
  .warning-text {
    color: rgba(255,255,255,0.75);
    font-family: 'Inter', sans-serif;
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
    padding: 0.8rem 2rem;
    background: linear-gradient(135deg, #ffd700, #e6b800);
    color: #1a237e;
    border: none;
    border-radius: 10px;
    font-family: 'Oswald', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 1px;
    transition: transform 0.2s;
  }
  .btn-stay:hover {
    transform: scale(1.05);
  }
  .btn-exit {
    padding: 0.8rem 1.5rem;
    background: rgba(255,82,82,0.15);
    color: #ff5252;
    border: 1px solid rgba(255,82,82,0.4);
    border-radius: 10px;
    font-family: 'Oswald', sans-serif;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-exit:hover {
    background: rgba(255,82,82,0.25);
  }

  @media (max-width: 480px) {
    .modal { padding: 1.5rem; }
    h2 { font-size: 1.3rem; }
    .buttons { flex-direction: column; }
  }
</style>