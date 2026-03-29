<script>
  import { fly, scale } from 'svelte/transition';

  let { message = '' } = $props();
</script>

{#if message}
  <div class="toast-wrap" transition:fly={{ y: -30, duration: 350 }}>
    <div class="toast" role="status" aria-live="polite" in:scale={{ duration: 200, delay: 100, start: 0.92 }}>
      <span class="glow"></span>
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
    overflow: hidden;
    background: linear-gradient(135deg, rgba(13, 27, 74, 0.95), rgba(26, 35, 126, 0.92));
    color: #ffd700;
    padding: 0.65rem 1.8rem;
    border-radius: 50px;
    border: 1.5px solid rgba(255, 215, 0, 0.4);
    font-family: 'Oswald', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-align: center;
    white-space: normal;
    backdrop-filter: blur(12px);
    box-shadow:
      0 4px 24px rgba(0, 0, 0, 0.45),
      0 0 15px rgba(255, 215, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .text {
    position: relative;
    z-index: 1;
    text-shadow: 0 1px 6px rgba(255, 215, 0, 0.25);
  }

  .glow {
    position: absolute;
    top: 0;
    left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.08), transparent);
    animation: shimmer 2s ease-in-out infinite;
    z-index: 0;
  }

  @keyframes shimmer {
    0% { left: -60%; }
    100% { left: 160%; }
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
      border-radius: 40px;
    }
  }
</style>
