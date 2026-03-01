<script>
  import { segments } from '../lib/logic/wheelSegments.js';
  import { sound } from '../lib/audio/soundEngine.js';

  let { spinning = false, canSpin = false, forcedResult = null, onSpin = () => {}, onResult = () => {} } = $props();

  let canvas;
  let wrapper;
  let currentRotation = $state(0);
  let isAnimating = $state(false);
  let dragRotation = $state(0); // live rotation while dragging

  // Responsive size
  let cssSize = $state(280);
  const numSeg = segments.length;
  const arc = (2 * Math.PI) / numSeg;

  function updateSize() {
    if (typeof window === 'undefined') return;
    const w = window.innerWidth;
    if (w <= 400) cssSize = Math.min(w - 40, 260);
    else if (w <= 640) cssSize = 300;
    else cssSize = 440;
  }

  // Resize listener
  $effect(() => {
    updateSize();
    const handler = () => updateSize();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  });

  // Redraw wheel when canvas exists or size changes
  $effect(() => {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const s = cssSize * dpr;
    canvas.width = s;
    canvas.height = s;
    canvas.style.width = cssSize + 'px';
    canvas.style.height = cssSize + 'px';
    drawWheel(s, dpr);
  });

  // --- Drag-to-spin ---
  let dragging = $state(false);
  let dragStartAngle = 0;
  let dragBaseRotation = 0;
  let lastAngle = 0;
  let lastTime = 0;
  let angularVelocity = 0;

  function getAngleFromCenter(e) {
    if (!wrapper) return 0;
    const rect = wrapper.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
  }

  function handlePointerDown(e) {
    if (isAnimating || !canSpin) return;
    e.preventDefault();
    dragging = true;
    dragStartAngle = getAngleFromCenter(e);
    dragBaseRotation = currentRotation;
    dragRotation = 0;
    lastAngle = dragStartAngle;
    lastTime = Date.now();
    angularVelocity = 0;
    if (wrapper) wrapper.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragging || isAnimating) return;
    e.preventDefault();
    const angle = getAngleFromCenter(e);
    let delta = angle - dragStartAngle;

    // Handle wrap-around (-180 to 180)
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    dragRotation = delta;

    // Track velocity
    const now = Date.now();
    let moveDelta = angle - lastAngle;
    if (moveDelta > 180) moveDelta -= 360;
    if (moveDelta < -180) moveDelta += 360;
    const dt = Math.max(now - lastTime, 1);
    angularVelocity = moveDelta / dt; // deg/ms

    lastAngle = angle;
    lastTime = now;

    // Apply live rotation
    if (wrapper) {
      wrapper.style.transition = 'none';
      wrapper.style.transform = `rotate(${dragBaseRotation + dragRotation}deg)`;
    }
  }

  function handlePointerUp(e) {
    if (!dragging) return;
    dragging = false;

    const speed = Math.abs(angularVelocity);
    const totalDrag = Math.abs(dragRotation);

    // Update base rotation to current drag position
    currentRotation = dragBaseRotation + dragRotation;
    dragRotation = 0;

    // If dragged fast enough or far enough, trigger spin
    if ((totalDrag > 30 && speed > 0.15) || totalDrag > 60) {
      onSpin();
    } else {
      // Snap back smoothly
      if (wrapper) {
        wrapper.style.transition = 'transform 0.3s ease';
        wrapper.style.transform = `rotate(${currentRotation}deg)`;
      }
    }
  }

  function drawWheel(size, dpr) {
    const ctx = canvas.getContext('2d');
    const c = size / 2;
    const oR = size / 2 - 8 * dpr;
    const iR = oR - 12 * dpr;

    ctx.clearRect(0, 0, size, size);

    // Outer metallic ring
    ctx.beginPath();
    ctx.arc(c, c, oR + 4 * dpr, 0, 2 * Math.PI);
    const ringGrad = ctx.createRadialGradient(c, c, oR - 2 * dpr, c, c, oR + 6 * dpr);
    ringGrad.addColorStop(0, '#c9a800');
    ringGrad.addColorStop(0.5, '#ffd700');
    ringGrad.addColorStop(1, '#a08600');
    ctx.fillStyle = ringGrad;
    ctx.fill();

    // Draw segments
    segments.forEach((seg, i) => {
      const start = i * arc;
      const end = start + arc;
      const mid = start + arc / 2;

      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.arc(c, c, iR, start, end);
      ctx.closePath();
      const grad = ctx.createRadialGradient(c, c, 20 * dpr, c, c, iR);
      grad.addColorStop(0, lightenColor(seg.color, 30));
      grad.addColorStop(1, seg.color);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(mid);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const isAmount = typeof seg.value === 'number';
      const displayLabel = isAmount ? `${seg.label}€` : seg.label;
      const textR = iR * 0.62;
      const fontSize = (displayLabel.length > 6 ? 11 : displayLabel.length > 4 ? 13 : 16) * dpr;

      ctx.font = `bold ${fontSize}px Oswald, sans-serif`;
      ctx.lineWidth = 3 * dpr;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineJoin = 'round';
      ctx.strokeText(displayLabel, textR, 0);
      ctx.fillStyle = seg.textColor;
      ctx.fillText(displayLabel, textR, 0);


      ctx.restore();
    });

    // LED dots
    for (let i = 0; i < numSeg * 2; i++) {
      const angle = (i / (numSeg * 2)) * Math.PI * 2;
      const x = c + Math.cos(angle) * (oR + 1 * dpr);
      const y = c + Math.sin(angle) * (oR + 1 * dpr);
      ctx.beginPath();
      ctx.arc(x, y, 2.5 * dpr, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? '#fff' : '#ffd700';
      ctx.fill();
    }

    // Center hub
    const hubRadius = Math.max(24, 32 * (size / (440 * dpr))) * dpr;
    ctx.beginPath();
    ctx.arc(c, c, hubRadius, 0, 2 * Math.PI);
    const hubGrad = ctx.createRadialGradient(c - 8 * dpr, c - 8 * dpr, 2 * dpr, c, c, hubRadius);
    hubGrad.addColorStop(0, '#ffd700');
    hubGrad.addColorStop(0.6, '#b8960c');
    hubGrad.addColorStop(1, '#8a6d00');
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(c, c, hubRadius - 6 * dpr, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();

    const hubFontSize = Math.max(7, 10 * (size / (440 * dpr))) * dpr;
    ctx.fillStyle = '#1a237e';
    ctx.font = `bold ${hubFontSize}px Oswald, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GIRA', c, c - 4 * dpr);
    ctx.fillText('FORTUNA', c, c + 10 * dpr);
  }

  function lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + percent);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
    const b = Math.min(255, (num & 0x0000FF) + percent);
    return `rgb(${r},${g},${b})`;
  }

  function spin(forceIndex) {
    if (isAnimating) return;
    isAnimating = true;

    const winIndex = forceIndex != null ? forceIndex : Math.floor(Math.random() * numSeg);
    const segAngle = 360 / numSeg;
    const segmentCenter = winIndex * segAngle + segAngle / 2;
    let targetStop = 270 - segmentCenter;
    if (targetStop < 0) targetStop += 360;

    const fullSpins = 360 * (6 + Math.floor(Math.random() * 4));
    const newRotation = currentRotation + fullSpins + ((targetStop - (currentRotation % 360) + 360) % 360);
    currentRotation = newRotation;

    wrapper.style.transition = 'transform 5s cubic-bezier(0.15, 0.60, 0.08, 1.00)';
    wrapper.style.transform = `rotate(${currentRotation}deg)`;

    // Tick sounds that decelerate with the wheel
    const spinDuration = 5000; // matches CSS transition
    const spinStart = performance.now();
    let tickTimer = null;

    function scheduleTick() {
      const elapsed = performance.now() - spinStart;
      if (elapsed >= spinDuration) return;

      sound.tick();

      // Easing matches cubic-bezier(0.15, 0.60, 0.08, 1.00): fast start, long slow end
      // Map progress (0→1) to interval (60ms → 500ms)
      const progress = elapsed / spinDuration;
      const interval = 70 + progress * progress * 1000;

      tickTimer = setTimeout(scheduleTick, interval);
    }
    scheduleTick();

    wrapper.addEventListener('transitionend', () => {
      if (tickTimer) clearTimeout(tickTimer);
      isAnimating = false;
      onResult(segments[winIndex], winIndex);
    }, { once: true });
  }

  // Guard: only spin once per spinning=true cycle.
  // Without this, when the animation ends (isAnimating→false) but spinning is still true
  // (host broadcast hasn't arrived yet), the effect would re-trigger a second spin.
  let hasSpunThisCycle = false;

  $effect(() => {
    if (!spinning) {
      hasSpunThisCycle = false;
    } else if (!isAnimating && !hasSpunThisCycle) {
      hasSpunThisCycle = true;
      spin(forcedResult);
    }
  });
</script>

<div class="wheel-container">
  <div class="pointer-wrap">
    <svg class="pointer" width="36" height="40" viewBox="0 0 36 40">
      <defs>
        <linearGradient id="ptrGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffd700"/>
          <stop offset="100%" stop-color="#b8960c"/>
        </linearGradient>
        <filter id="ptrShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>
      <polygon points="18,38 4,4 32,4" fill="url(#ptrGrad)" stroke="#8a6d00" stroke-width="1.5" filter="url(#ptrShadow)"/>
      <polygon points="18,30 10,8 26,8" fill="rgba(255,255,255,0.2)"/>
    </svg>
  </div>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="wheel-wrapper"
    class:can-spin={canSpin && !isAnimating}
    class:dragging
    bind:this={wrapper}
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerUp}
  >
    <canvas bind:this={canvas}></canvas>
  </div>
  {#if canSpin && !isAnimating && !dragging}
    <p class="swipe-hint">Trascina per girare</p>
  {/if}
  <div class="glow" style="width: {cssSize + 20}px; height: {cssSize + 20}px;"></div>
</div>

<style>
  .wheel-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
  }
  .pointer-wrap {
    z-index: 3;
    margin-bottom: -14px;
    filter: drop-shadow(0 0 8px rgba(255,215,0,0.5));
  }
  .pointer {
    display: block;
  }
  .wheel-wrapper {
    will-change: transform;
    position: relative;
    z-index: 1;
    touch-action: none;
  }
  .wheel-wrapper.can-spin {
    cursor: grab;
  }
  .wheel-wrapper.dragging {
    cursor: grabbing;
  }
  canvas {
    display: block;
    border-radius: 50%;
  }
  .swipe-hint {
    color: rgba(255,215,0,0.5);
    font-family: 'Inter', sans-serif;
    font-size: 0.75rem;
    text-align: center;
    margin-top: 0.4rem;
    animation: fadeInOut 2s ease-in-out infinite;
  }
  @keyframes fadeInOut {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.7; }
  }
  .glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }
</style>
