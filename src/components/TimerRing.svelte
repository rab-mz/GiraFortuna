<script>
  // Avatar con anello di countdown attorno (brand board: il tempo si vede sempre).
  // fraction: quota di tempo residua 0..1; warning: sotto i 10s l'anello passa a corallo e pulsa.
  let {
    size = 56,
    initial = '?',
    accentSolid = '#F5B63F',
    accentOn = '#14102A',
    fraction = 1,
    warning = false,
    showRing = true,
  } = $props();

  let r = $derived(size / 2 - 3);
  let circumference = $derived(2 * Math.PI * r);
  let dash = $derived(Math.max(0, Math.min(1, fraction)) * circumference);
</script>

<div class="ring-wrap" class:warning style={`width: ${size}px; height: ${size}px;`}>
  {#if showRing}
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} class="ring">
      <circle cx={size / 2} cy={size / 2} {r} fill="none" stroke="rgba(244,242,255,0.12)" stroke-width="4" />
      <circle
        cx={size / 2}
        cy={size / 2}
        {r}
        fill="none"
        stroke={warning ? 'var(--coral)' : accentSolid}
        stroke-width="4"
        stroke-linecap="round"
        stroke-dasharray={`${dash} ${circumference}`}
      />
    </svg>
  {/if}
  <div
    class="avatar"
    style={`background: ${accentSolid}; color: ${accentOn}; inset: ${showRing ? 7 : 0}px;`}
  >{initial}</div>
</div>

<style>
  .ring-wrap {
    position: relative;
    flex-shrink: 0;
  }
  .ring {
    transform: rotate(-90deg);
    display: block;
  }
  .ring circle {
    transition: stroke-dasharray 0.25s linear, stroke 0.3s;
  }
  .ring-wrap.warning .ring {
    animation: ringPulse 0.8s ease-in-out infinite;
  }
  @keyframes ringPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
  }
  .avatar {
    position: absolute;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.05rem;
  }
</style>
