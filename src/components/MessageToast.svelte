<script>
  import { fly } from 'svelte/transition';

  let { message = '' } = $props();
</script>

{#if message}
  <div class="toast" role="status" aria-live="polite" transition:fly={{ y: -40, duration: 300 }}>
    {message}
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    top: 1rem;
    top: calc(1rem + env(safe-area-inset-top, 0px));
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #1a237e, #283593);
    color: #ffd700;
    padding: 0.8rem 2rem;
    border-radius: 10px;
    border: 2px solid #ffd700;
    font-family: 'Oswald', sans-serif;
    font-size: 1.2rem;
    font-weight: 600;
    z-index: 200;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    text-align: center;
    max-width: 90vw;
    white-space: normal;
  }
</style>
