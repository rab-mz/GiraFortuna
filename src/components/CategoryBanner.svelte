<script>
  let { category = '' } = $props();
</script>

<div class="banner">
  <span class="label">Argomento della frase</span>
  <span class="value">{category}</span>
</div>

<style>
  .banner {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }
  .label {
    font-family: var(--font-ui);
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--text-faint);
    white-space: nowrap;
  }
  .value {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.28rem;
    line-height: 1.15;
    color: var(--amber);
  }
  @media (max-width: 860px) {
    .banner {
      align-items: center;
      text-align: center;
    }
    .value {
      font-size: 1.05rem;
    }
  }
</style>
