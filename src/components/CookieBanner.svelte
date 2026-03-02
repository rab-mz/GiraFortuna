<script>
  import { fly } from 'svelte/transition';

  let accepted = $state(false);

  // Check localStorage on init
  if (typeof window !== 'undefined') {
    accepted = localStorage.getItem('gf_cookie_ok') === '1';
  }

  function accept() {
    localStorage.setItem('gf_cookie_ok', '1');
    accepted = true;
  }
</script>

{#if !accepted}
  <div class="banner" transition:fly={{ y: 50, duration: 300 }}>
    <p>Questo sito usa solo cookie tecnici necessari al funzionamento. Nessun dato personale viene raccolto.</p>
    <button onclick={accept}>OK</button>
  </div>
{/if}

<style>
  .banner {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(13, 27, 74, 0.97);
    border-top: 1px solid rgba(255,215,0,0.2);
    padding: 0.8rem 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    z-index: 500;
    backdrop-filter: blur(8px);
  }
  p {
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.7);
    margin: 0;
    line-height: 1.4;
  }
  button {
    background: rgba(255,215,0,0.2);
    border: 1px solid rgba(255,215,0,0.4);
    color: #ffd700;
    padding: 0.4rem 1.2rem;
    border-radius: 6px;
    font-family: 'Oswald', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.2s;
  }
  button:hover {
    background: rgba(255,215,0,0.3);
  }

  @media (max-width: 480px) {
    .banner {
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.8rem;
    }
    p { text-align: center; font-size: 0.75rem; }
  }
</style>
