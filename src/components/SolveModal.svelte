<script>
  let { open = false, onSubmit = () => {}, onCancel = () => {} } = $props();
  let guess = $state('');

  function handleSubmit(e) {
    e.preventDefault();
    if (guess.trim()) {
      onSubmit(guess.trim());
      guess = '';
    }
  }

  function handleCancel() {
    guess = '';
    onCancel();
  }
</script>

{#if open}
  <div class="overlay" role="button" tabindex="-1" onclick={handleCancel} onkeydown={(e) => e.key === 'Escape' && handleCancel()}>
    <div class="modal" role="dialog" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
      <h2>Risolvi la frase!</h2>
      <form onsubmit={handleSubmit}>
        <!-- svelte-ignore a11y_autofocus -->
        <input
          type="text"
          bind:value={guess}
          placeholder="Scrivi la frase completa..."
          autofocus
        />
        <div class="actions">
          <button type="submit" class="btn-confirm">Conferma</button>
          <button type="button" class="btn-cancel" onclick={handleCancel}>Annulla</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(4px);
  }
  .modal {
    background: linear-gradient(135deg, #1a237e, #283593);
    border: 2px solid #ffd700;
    border-radius: 16px;
    padding: 2rem;
    max-width: 450px;
    width: 90%;
    box-shadow: 0 8px 30px rgba(0,0,0,0.5);
  }
  h2 {
    color: #ffd700;
    font-family: 'Oswald', sans-serif;
    text-align: center;
    margin: 0 0 1rem;
    font-size: 1.5rem;
  }
  input {
    width: 100%;
    padding: 0.8rem;
    border: 2px solid rgba(255,215,0,0.4);
    border-radius: 8px;
    background: rgba(255,255,255,0.1);
    color: #fff;
    font-family: 'Inter', sans-serif;
    font-size: 1.1rem;
    box-sizing: border-box;
  }
  input::placeholder {
    color: rgba(255,255,255,0.4);
  }
  .actions {
    display: flex;
    gap: 0.8rem;
    margin-top: 1rem;
    justify-content: center;
  }
  .btn-confirm, .btn-cancel {
    padding: 0.6rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-family: 'Oswald', sans-serif;
    font-size: 1rem;
    cursor: pointer;
    font-weight: 600;
  }
  .btn-confirm {
    background: #ffd700;
    color: #1a237e;
  }
  .btn-cancel {
    background: rgba(255,255,255,0.15);
    color: #fff;
  }
</style>
