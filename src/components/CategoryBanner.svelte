<script>
  let { category = '' } = $props();
</script>

<div class="banner">
  <span class="label">Categoria:</span>
  <span class="value">{category}</span>
</div>

<style>
  .banner {
    text-align: center;
    padding: 0.5rem 1.5rem;
    background: linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05));
    border: 1px solid rgba(255,215,0,0.3);
    border-radius: 8px;
    font-family: 'Oswald', sans-serif;
  }
  .label {
    color: rgba(255,255,255,0.6);
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .value {
    color: #ffd700;
    font-size: 1.3rem;
    font-weight: 600;
    margin-left: 0.5rem;
  }
</style>
