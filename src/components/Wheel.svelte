<script>
  import { sound } from '../lib/audio/soundEngine.js';
  import { settings } from '../lib/stores/settingsStore.svelte.js';
  import { WHEEL_THEMES, DEFAULT_WHEEL_THEME, themeSegmentColor } from '../lib/logic/wheelThemes.js';

  let { segments = [], spinning = false, canSpin = false, forcedResult = null, decorative = false, size = null, onSpin = () => {}, onResult = () => {} } = $props();

  let canvas;
  let wrapper;
  let currentRotation = $state(0);
  let isAnimating = $state(false);
  let dragRotation = $state(0); // live rotation while dragging

  let theme = $derived(WHEEL_THEMES[settings.wheelTheme] ?? WHEEL_THEMES[DEFAULT_WHEEL_THEME]);
  // Posizione di ogni segmento tra quelli numerici (per ciclare i colori premio del tema)
  let amountIndexes = $derived.by(() => {
    let n = 0;
    return segments.map(seg => (typeof seg.value === 'number' ? n++ : -1));
  });

  // Responsive size
  let cssSize = $state(280);
  let numSeg = $derived(segments.length);
  let arc = $derived(numSeg > 0 ? (2 * Math.PI) / numSeg : 0);

  // Ridisegna quando i font display sono pronti (le etichette usano Unbounded)
  let fontsReady = $state(false);
  $effect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => { if (!cancelled) fontsReady = true; });
    return () => { cancelled = true; };
  });

  function updateSize() {
    if (typeof window === 'undefined') return;
    if (size != null) {
      cssSize = size;
      return;
    }
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

  // Redraw wheel when canvas exists, size/theme/segments change or fonts become ready
  $effect(() => {
    if (!canvas || !segments.length) return;
    void fontsReady;
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
    if (isAnimating || (!canSpin && !decorative)) return;
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

    // Ruota della Home: nessun esito, gira e basta con l'inerzia del lancio
    if (decorative) {
      spinVelocity = Math.max(Math.min(angularVelocity, 1.2), -1.2);
      return;
    }

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

  // --- Ruota decorativa della Home: si anima al passaggio del mouse e si trascina ---
  let hovering = $state(false);
  let spinVelocity = 0; // gradi al millisecondo

  const HOVER_SPEED = 0.035;   // ~35 gradi al secondo
  const FRICTION = 0.0011;     // quanto si spegne il lancio, per ms

  $effect(() => {
    if (!decorative) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // Sul telefono non esiste l'hover: la ruota gira piano di suo (e' solo un
    // transform, il canvas non viene ridisegnato), e si trascina come sul desktop.
    const noHover = window.matchMedia?.('(hover: none)').matches;
    let last = performance.now();
    let raf = requestAnimationFrame(function frame(now) {
      const dt = Math.min(now - last, 60);
      last = now;
      if (!dragging) {
        const target = (hovering || noHover) && !reduced ? HOVER_SPEED : 0;
        if (Math.abs(spinVelocity) > HOVER_SPEED) {
          // sta ancora scorrendo dopo un lancio: attrito finche' non torna al regime
          const sign = Math.sign(spinVelocity);
          spinVelocity -= sign * FRICTION * dt;
          if (Math.sign(spinVelocity) !== sign) spinVelocity = 0;
          else if (target && Math.abs(spinVelocity) < HOVER_SPEED) spinVelocity = sign * HOVER_SPEED;
        } else {
          // avvio/arresto morbido verso la velocita' di regime
          spinVelocity += (target - spinVelocity) * Math.min(dt / (target ? 350 : 600), 1);
          if (!target && Math.abs(spinVelocity) < 0.0004) spinVelocity = 0;
        }
        if (spinVelocity !== 0 && wrapper) {
          currentRotation += spinVelocity * dt;
          wrapper.style.transition = 'none';
          wrapper.style.transform = `rotate(${currentRotation}deg)`;
        }
      }
      raf = requestAnimationFrame(frame);
    });
    return () => cancelAnimationFrame(raf);
  });

  function drawWheel(size, dpr) {
    const ctx = canvas.getContext('2d');
    const c = size / 2;
    const oR = size / 2 - 8 * dpr;
    const iR = oR - 12 * dpr;

    ctx.clearRect(0, 0, size, size);

    // Cornice piena dietro gli spicchi (A: gradiente oro, C: notte piatta)
    if (theme.rim.kind === 'disc') {
      ctx.beginPath();
      ctx.arc(c, c, oR + 4 * dpr, 0, 2 * Math.PI);
      if (theme.rim.stops) {
        const ringGrad = ctx.createRadialGradient(c, c, oR - 2 * dpr, c, c, oR + 6 * dpr);
        for (const [offset, color] of theme.rim.stops) ringGrad.addColorStop(offset, color);
        ctx.fillStyle = ringGrad;
      } else {
        ctx.fillStyle = theme.rim.color;
      }
      ctx.fill();
    }

    // Spicchi
    segments.forEach((seg, i) => {
      const start = i * arc;
      const end = start + arc;
      const roleColor = themeSegmentColor(theme, seg, amountIndexes[i]);

      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.arc(c, c, iR, start, end);
      ctx.closePath();

      if (theme.neon) {
        // Spicchio scuro, solo il bordo brilla
        ctx.fillStyle = seg.value === 'bancarotta' ? '#0B0616' : '#0D0B16';
        ctx.fill();
        ctx.save();
        ctx.shadowColor = roleColor;
        ctx.shadowBlur = 8 * dpr;
        ctx.strokeStyle = roleColor;
        ctx.lineWidth = theme.segStrokeWidth * dpr;
        ctx.stroke();
        ctx.restore();
      } else {
        if (theme.gradientSegments) {
          const grad = ctx.createRadialGradient(c, c, 20 * dpr, c, c, iR);
          grad.addColorStop(0, lightenColor(roleColor, 30));
          grad.addColorStop(1, roleColor);
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = roleColor;
        }
        ctx.fill();
        ctx.strokeStyle = theme.segStroke;
        ctx.lineWidth = theme.segStrokeWidth * dpr;
        ctx.stroke();
      }

      // Etichetta
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const isAmount = typeof seg.value === 'number';
      const displayLabel = isAmount ? `${seg.label}€` : seg.label;
      const textR = iR * 0.62;
      let labelSize = 14;
      if (displayLabel.length > 6) labelSize = 8;
      else if (displayLabel.length > 4) labelSize = 11;
      // Le misure delle tavole valgono per una ruota da 440: su ruote piu' grandi
      // (quella decorativa della Home) le etichette vanno scalate, altrimenti
      // restano minuscole. Sotto i 440 restano come sono, per leggibilita'.
      const labelScale = Math.max(1, size / (440 * dpr));
      const fontSize = labelSize * labelScale * dpr;

      const override = theme.labels.overrides?.[seg.value] ?? {};
      let labelFill = override.fill ?? theme.labels.fill;
      if (labelFill === 'segment') labelFill = roleColor;
      const halo = override.halo ?? theme.labels.halo;
      const haloWidth = override.haloWidth ?? theme.labels.haloWidth;

      ctx.font = `700 ${fontSize}px Unbounded, sans-serif`;
      if (theme.labels.glow) {
        ctx.shadowColor = labelFill;
        ctx.shadowBlur = 6 * labelScale * dpr;
      }
      if (halo && haloWidth > 0) {
        ctx.lineWidth = haloWidth * labelScale * dpr;
        ctx.strokeStyle = halo;
        ctx.lineJoin = 'round';
        ctx.strokeText(displayLabel, textR, 0);
      }
      ctx.fillStyle = labelFill;
      ctx.fillText(displayLabel, textR, 0);

      ctx.restore();
    });

    // Cornice ad anelli (B) o neon (D), sopra il bordo esterno degli spicchi
    if (theme.rim.kind === 'rings') {
      ctx.strokeStyle = theme.rim.ring;
      ctx.lineWidth = theme.rim.ringWidth * dpr;
      ctx.beginPath();
      ctx.arc(c, c, iR + 4 * dpr, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.strokeStyle = theme.rim.halo;
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.arc(c, c, iR + 9 * dpr, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (theme.rim.kind === 'neon') {
      ctx.save();
      ctx.shadowColor = theme.rim.color;
      ctx.shadowBlur = 10 * dpr;
      ctx.strokeStyle = theme.rim.color;
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.arc(c, c, iR + 5 * dpr, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }

    // LED / tacche sulla cornice
    if (theme.leds.kind === 'dots') {
      for (let i = 0; i < numSeg * 2; i++) {
        const angle = (i / (numSeg * 2)) * Math.PI * 2;
        const x = c + Math.cos(angle) * (oR + 1 * dpr);
        const y = c + Math.sin(angle) * (oR + 1 * dpr);
        ctx.beginPath();
        ctx.arc(x, y, 2.5 * dpr, 0, 2 * Math.PI);
        ctx.fillStyle = theme.leds.colors[i % theme.leds.colors.length];
        ctx.fill();
      }
    } else if (theme.leds.kind === 'ticks') {
      ctx.strokeStyle = theme.leds.color;
      ctx.lineWidth = 1.5 * dpr;
      for (let i = 0; i < numSeg * 2; i++) {
        const angle = (i / (numSeg * 2)) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(c + Math.cos(angle) * (iR + 6 * dpr), c + Math.sin(angle) * (iR + 6 * dpr));
        ctx.lineTo(c + Math.cos(angle) * (iR + 10 * dpr), c + Math.sin(angle) * (iR + 10 * dpr));
        ctx.stroke();
      }
    }

    // Mozzo con il logo Spicchi (niente scritta)
    const hubRadius = Math.max(24, 32 * (size / (440 * dpr))) * dpr;
    // Colletto scuro attorno al mozzo: senza, uno spicchio chiaro (il Jolly avorio)
    // sembra prolungarsi dentro il logo invece di fermarsi al centro.
    const collar = theme.hub.collar ?? '#0A0E23';
    if (collar) {
      ctx.beginPath();
      ctx.arc(c, c, hubRadius * 1.14, 0, 2 * Math.PI);
      ctx.fillStyle = collar;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(c, c, hubRadius, 0, 2 * Math.PI);
    ctx.fillStyle = theme.hub.fill;
    ctx.fill();
    if (theme.hub.stroke) {
      ctx.strokeStyle = theme.hub.stroke;
      ctx.lineWidth = theme.hub.strokeWidth * dpr;
      ctx.stroke();
    }

    // Proporzioni del marchio come nelle tavole: anello r 28, tratto 14, perno 5
    // su viewBox 96 scalato 0.62 dentro un mozzo da 32
    const logoR = hubRadius * 0.5425;
    ctx.lineWidth = hubRadius * 0.271;
    for (let i = 0; i < 8; i++) {
      const a0 = -Math.PI / 2 + (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.arc(c, c, logoR, a0, a0 + Math.PI / 4);
      ctx.strokeStyle = theme.hub.logo[i % 2];
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(c, c, hubRadius * 0.097, 0, 2 * Math.PI);
    ctx.fillStyle = theme.hub.pin;
    ctx.fill();
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

<div class="wheel-container" class:decorative>
  {#if !decorative}
    <div class="pointer-wrap" style={`filter: drop-shadow(0 0 8px ${theme.pointer.from}80);`}>
      <svg class="pointer" width="36" height="40" viewBox="0 0 36 40">
        <defs>
          <linearGradient id="ptrGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color={theme.pointer.from}/>
            <stop offset="100%" stop-color={theme.pointer.to}/>
          </linearGradient>
          <filter id="ptrShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.5)"/>
          </filter>
        </defs>
        <polygon points="18,38 4,4 32,4" fill="url(#ptrGrad)" stroke={theme.pointer.stroke} stroke-width="1.5" filter="url(#ptrShadow)"/>
        <polygon points="18,30 10,8 26,8" fill="rgba(255,255,255,0.2)"/>
      </svg>
    </div>
  {/if}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="wheel-wrapper"
    class:can-spin={(canSpin && !isAnimating) || decorative}
    class:dragging
    bind:this={wrapper}
    onpointerenter={() => { hovering = true; }}
    onpointerleave={() => { hovering = false; }}
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerUp}
  >
    <canvas bind:this={canvas}></canvas>
  </div>
  {#if !decorative}
    <div
      class="glow"
      style={`width: ${cssSize + 20}px; height: ${cssSize + 20}px; background: radial-gradient(circle, ${theme.glow} 0%, transparent 70%);`}
    ></div>
  {/if}
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
    overflow: hidden;
  }
  .wheel-container.decorative {
    /* solo la ruota risponde al mouse: il resto del riquadro resta trasparente
       ai click, cosi' non ruba spazio al menu della Home */
    pointer-events: none;
  }
  .wheel-container.decorative .wheel-wrapper {
    pointer-events: auto;
  }
  .pointer-wrap {
    z-index: 3;
    margin-bottom: -14px;
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
  .glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
  }
</style>
