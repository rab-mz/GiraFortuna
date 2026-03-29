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
    background: rgba(0,0,0,0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 400;
    backdrop-filter: blur(8px);
    padding: 1rem;
  }
  .modal {
    background: linear-gradient(135deg, #1a237e, #283593);
    border: 2px solid #ffd700;
    border-radius: 16px;
    padding: 2rem;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 8px 40px rgba(0,0,0,0.5);
    text-align: center;
  }
  h2 {
    color: #ffd700;
    font-family: 'Oswald', sans-serif;
    font-size: 1.5rem;
    margin: 0 0 1.2rem;
    letter-spacing: 1px;
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
    padding: 0.4rem 0.6rem;
    background: rgba(255,255,255,0.05);
    border-radius: 6px;
  }
  .label {
    color: rgba(255,255,255,0.5);
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .value {
    color: rgba(255,255,255,0.9);
    font-family: 'Oswald', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
  }
  .buttons {
    display: flex;
    gap: 0.8rem;
    justify-content: center;
  }
  .btn-resume {
    padding: 0.8rem 2rem;
    background: linear-gradient(135deg, #ffd700, #e6b800);
    color: #1a237e;
    border: none;
    border-radius: 10px;
    font-family: 'Oswald', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 1px;
    transition: transform 0.2s;
  }
  .btn-resume:hover {
    transform: scale(1.05);
  }
  .btn-new {
    padding: 0.8rem 1.5rem;
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.8);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 10px;
    font-family: 'Oswald', sans-serif;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-new:hover {
    background: rgba(255,255,255,0.15);
    color: #fff;
  }

  @media (max-width: 480px) {
    .modal { padding: 1.5rem; }
    h2 { font-size: 1.3rem; }
    .buttons { flex-direction: column; }
  }
</style>
