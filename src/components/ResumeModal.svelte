<script>
  import { fly, scale } from 'svelte/transition';

  let {
    session = null,
    onResume = () => {},
    onDismiss = () => {},
  } = $props();

  let state = $derived(session?.gameState);
  let playerNames = $derived(state?.players?.map(p => p.name).join(', ') ?? '');
  let roundInfo = $derived(
    state ? `Round ${state.currentRound}/${state.totalRounds}` : ''
  );

  const phaseLabels = {
    idle: 'In attesa',
    spinning: 'Giro in corso',
    picking_consonant: 'Scelta consonante',
    picking_vowel: 'Scelta vocale',
    picking_jolly: 'Jolly',
    solving: 'Risoluzione',
    round_won: 'Round vinto',
    game_over: 'Fine partita',
  };

  let phaseLabel = $derived(phaseLabels[state?.phase] ?? '');
</script>

{#if session}
  <div class="overlay" transition:fly={{ y: 50, duration: 300 }}>
    <div class="modal" transition:scale={{ duration: 300, delay: 100 }}>
      <h2>Partita in corso trovata!</h2>

      <div class="info">
        <div class="info-row">
          <span class="label">Giocatori</span>
          <span class="value">{playerNames}</span>
        </div>
        <div class="info-row">
          <span class="label">Stato</span>
          <span class="value">{roundInfo} &mdash; {phaseLabel}</span>
        </div>
        {#if state?.phraseObj?.category}
          <div class="info-row">
            <span class="label">Categoria</span>
            <span class="value">{state.phraseObj.category}</span>
          </div>
        {/if}
      </div>

      <div class="buttons">
        <button class="btn-resume" onclick={onResume}>Riprendi</button>
        <button class="btn-new" onclick={onDismiss}>Nuova Partita</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(4, 6, 18, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 400;
    backdrop-filter: blur(8px);
    padding: 1rem;
  }
  .modal {
    background: var(--indigo);
    border: 1px solid var(--glass-border-strong);
    border-radius: var(--radius-lg);
    padding: 2rem;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 8px 40px rgba(0,0,0,0.5);
    text-align: center;
  }
  h2 {
    color: var(--text);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.2rem;
    margin: 0 0 1.2rem;
  }
  .info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    text-align: left;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.8rem;
    padding: 0.5rem 0.8rem;
    background: var(--glass);
    border: 1px solid var(--glass-border);
    border-radius: 10px;
  }
  .label {
    color: var(--text-faint);
    font-family: var(--font-ui);
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    flex-shrink: 0;
  }
  .value {
    color: var(--text);
    font-family: var(--font-ui);
    font-size: 0.9rem;
    font-weight: 600;
    text-align: right;
  }
  .buttons {
    display: flex;
    gap: 0.8rem;
    justify-content: center;
  }
  .btn-resume {
    padding: 0.8rem 2rem;
    background: var(--amber);
    color: var(--ink);
    border: none;
    border-radius: 14px;
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.5px;
    transition: all 0.2s;
  }
  .btn-resume:hover {
    background: var(--amber-bright);
    transform: scale(1.04);
  }
  .btn-new {
    padding: 0.8rem 1.5rem;
    background: var(--glass-strong);
    color: rgba(244,242,255,0.8);
    border: 1px solid var(--glass-border-strong);
    border-radius: 14px;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-new:hover {
    background: rgba(244,242,255,0.1);
    color: var(--text);
  }

  @media (max-width: 480px) {
    .modal { padding: 1.5rem; }
    h2 { font-size: 1.05rem; }
    .buttons { flex-direction: column; }
  }
</style>
