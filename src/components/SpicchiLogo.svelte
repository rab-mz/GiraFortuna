<script>
  // Marchio "Spicchi": anello a 8 spicchi alternati + perno centrale.
  // Colori di default: versione ambra/avorio su fondo scuro (brand board).
  let { size = 24, colorA = '#F5B63F', colorB = '#EDE9FF', pin = '#F5B63F' } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 96 96" aria-hidden="true">
  <g transform="rotate(-90 48 48)" fill="none" stroke-width="14">
    <circle cx="48" cy="48" r="28" stroke={colorA} stroke-dasharray="21.99 21.99" />
    <circle cx="48" cy="48" r="28" stroke={colorB} stroke-dasharray="21.99 21.99" stroke-dashoffset="-21.99" />
  </g>
  <circle cx="48" cy="48" r="5" fill={pin} />
</svg>
