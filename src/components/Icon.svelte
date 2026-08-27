<script>
  // Icone di interfaccia, al posto delle emoji (che cambiano faccia su ogni
  // sistema e stonano col resto). Tratto coerente con le altre icone dell'app.
  let { name, size = 18, stroke = 1.8 } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={stroke}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {#if name === 'audio-on'}
    <path d="M11 5 6 9H3v6h3l5 4z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M18.5 5.5a9 9 0 0 1 0 13" />
  {:else if name === 'audio-off'}
    <path d="M11 5 6 9H3v6h3l5 4z" />
    <path d="M16 9.5l5 5M21 9.5l-5 5" />
  {:else if name === 'category'}
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  {:else if name === 'money'}
    <circle cx="12" cy="12" r="9" />
    <path d="M14.5 9.5A3 3 0 0 0 12 8c-1.7 0-3 .9-3 2s1.3 2 3 2 3 .9 3 2-1.3 2-3 2a3 3 0 0 1-2.5-1.5" />
    <path d="M12 6.2v11.6" />
  {:else if name === 'letters'}
    <path d="M4 18 8.5 7l4.5 11" />
    <path d="M5.6 14.6h5.8" />
    <path d="M16 18V9.5h2.6a2.4 2.4 0 0 1 0 4.8H16" />
  {:else if name === 'streak'}
    <path d="M12 3c1 3.6-2.6 4.6-2.6 8.2a2.7 2.7 0 0 0 5.4.2c-.4-3.8 3.2-3.8 1.4-8.3 2.7 2.7 4.5 5.9 4.5 9a8.7 8.7 0 1 1-17.4 0c0-4 3.1-7.2 5.4-9.9" />
  {/if}
</svg>
