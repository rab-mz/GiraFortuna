<script>
  import { online } from '../lib/stores/onlineStore.svelte.js';
  import { daily } from '../lib/stores/dailyStore.svelte.js';
  import { generalStats } from '../lib/stores/generalStatsStore.svelte.js';
  import { SEEDS, SEED_LIST } from '../lib/logic/wheelSeeds.js';
  import HowToPlay from './HowToPlay.svelte';
  import PrivacyPolicy from './PrivacyPolicy.svelte';
  import SettingsModal from './SettingsModal.svelte';
  import StatsModal from './StatsModal.svelte';
  import DailyResultCard from './DailyResultCard.svelte';
  import SpicchiLogo from './SpicchiLogo.svelte';
  import Wheel from './Wheel.svelte';

  let { onStart = () => {}, onOnlineStart = () => {}, onDailyStart = () => {} } = $props();

  let showRules = $state(false);
  let showPrivacy = $state(false);
  let showSettings = $state(false);
  let showStats = $state(false);
  let showDailyResult = $state(false);

  let section = $state(null); // null (home) | 'multi'
  let multiMode = $state('online'); // 'online' | 'local' — Online e' la modalita' principale
  let numPlayers = $state(2);
  let playerNames = $state(['', '']);
  let numRounds = $state(1);
  let selectedSeed = $state('classico');

  // Online state
  let onlineMode = $state(null); // null | 'join'
  let onlineName = $state('');
  let joinCode = $state('');
  let onlineRounds = $state(1);

  let decoSegments = $derived(SEEDS[selectedSeed]?.segments ?? SEEDS.classico.segments);

  // Ruota decorativa: fuori quadro a destra sul desktop, sotto il menu sul telefono
  let heroSize = $state(880);
  $effect(() => {
    const update = () => {
      heroSize = window.innerWidth <= 1020
        ? Math.min(Math.round(window.innerWidth * 1.05), 460)
        : 880;
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  });
  let inLobby = $derived(online.mode !== 'offline');

  function updateNumPlayers(n) {
    numPlayers = n;
    playerNames = Array.from({ length: n }, (_, i) => playerNames[i] || '');
  }

  function handleSingleStart() {
    onStart(['Giocatore'], numRounds, selectedSeed);
  }

  function handleMultiStart() {
    const names = playerNames.map((n, i) => n.trim() || `Giocatore ${i + 1}`);
    onStart(names, numRounds, selectedSeed);
  }

  function handleCreateRoom() {
    const name = onlineName.trim() || 'Host';
    online.createRoom(name);
  }

  function handleJoinRoom() {
    if (joinCode.trim().length < 3) return;
    const name = onlineName.trim() || 'Giocatore';
    online.joinRoom(joinCode.trim(), name);
  }

  function handleOnlineStart() {
    const names = online.connectedPlayers.map(p => p.name);
    onOnlineStart(names, onlineRounds, selectedSeed);
  }

  function handleLeaveRoom() {
    online.leaveRoom();
    onlineMode = null;
  }

  function handleBackHome() {
    section = null;
    onlineMode = null;
  }

  let copied = $state(false);
  function copyRoomCode() {
    navigator.clipboard.writeText(online.roomCode);
    copied = true;
    setTimeout(() => { copied = false; }, 2000);
  }
</script>

<div class="start-screen" style={`--hero-size: ${heroSize}px`}>
  <!-- Ruota decorativa a destra, mezza fuori quadro (tavola Home) -->
  <div class="hero" aria-hidden="true">
    <div class="hero-glow"></div>
    <div class="hero-wheel">
      <Wheel segments={decoSegments} decorative size={heroSize} />
      <div class="hero-vignette"></div>
    </div>
  </div>


  <div class="content">
    {#if !section}
      <!-- ========== HOME ========== -->
      <div class="brand-row">
        <SpicchiLogo size={40} />
        <span class="tagline">Il gioco della ruota in italiano</span>
      </div>
      <h1 class="title">Gira la<br><span>Fortuna</span></h1>
      <p class="subtitle">Gira la ruota, compra le vocali, indovina la frase.</p>

      <div class="menu">
        <div class="play-btn-wrapper">
          <button class="cta-primary" onclick={handleSingleStart}>
            <span>Gioca</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>

        <button
          class="menu-row"
          onclick={() => {
            if (daily.hasPlayedToday) {
              showDailyResult = true;
            } else {
              onDailyStart();
            }
          }}
        >
          <span class="menu-icon icon-violet">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
          </span>
          <span class="menu-info">
            <span class="menu-title">Frase del giorno</span>
            <span class="menu-sub">
              {#if daily.hasPlayedToday}
                Già giocata oggi, vedi il risultato
              {:else}
                Puzzle n. {daily.dailyNumber}, una sola partita al giorno
              {/if}
            </span>
          </span>
          {#if daily.streak > 0}
            <span class="streak-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2c1 4-3 5-3 9a3 3 0 0 0 6 .2C15 8 19 8 17 3c3 3 5 6.5 5 10a8 8 0 1 1-16 0c0-4.5 3.5-8 6-11z"/></svg>
              {daily.streak}
            </span>
          {/if}
        </button>

        <button class="menu-row" onclick={() => { section = 'multi'; }}>
          <span class="menu-icon icon-mint">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="8" cy="8" r="3.2"/><circle cx="17" cy="10" r="2.6"/><path d="M2.5 20c.6-3.4 2.9-5.2 5.5-5.2S12.9 16.6 13.5 20M14.5 19.5c.5-2.6 1.9-4 3.8-4 1.6 0 2.8 1 3.4 2.8"/></svg>
          </span>
          <span class="menu-info">
            <span class="menu-title">Multiplayer</span>
            <span class="menu-sub">Sullo stesso schermo o online con codice stanza</span>
          </span>
          <svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
        </button>
      </div>

    {:else}
      <!-- ========== MULTIPLAYER (locale + online unificati) ========== -->
      <div class="section-view">
        <div class="section-head">
          <button class="back-icon" onclick={handleBackHome} title="Indietro" aria-label="Indietro" disabled={inLobby}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
          </button>
          <h2 class="section-title">Multiplayer</h2>
        </div>

        {#if !inLobby}
          <div class="mode-toggle">
            <button class="chip" class:active={multiMode === 'online'} onclick={() => { multiMode = 'online'; }}>
              Online
            </button>
            <button class="chip" class:active={multiMode === 'local'} onclick={() => { multiMode = 'local'; }}>
              Stesso schermo
            </button>
          </div>
        {/if}

        {#if multiMode === 'local'}
          <!-- Locale 2-4 giocatori -->
          <div class="panel">
            <div class="opt-row">
              <span class="opt-label">Giocatori</span>
              {#each [2, 3, 4] as n}
                <button
                  class="round-chip"
                  class:active={numPlayers === n}
                  onclick={() => updateNumPlayers(n)}
                >{n}</button>
              {/each}
            </div>

            <div class="name-inputs">
              {#each playerNames as _, i}
                <input
                  type="text"
                  placeholder={`Giocatore ${i + 1}`}
                  bind:value={playerNames[i]}
                />
              {/each}
            </div>

            <div class="opt-row">
              <span class="opt-label">Ruota</span>
              {#each SEED_LIST as seed}
                <button
                  class="chip"
                  class:active={selectedSeed === seed.id}
                  title={seed.description}
                  onclick={() => { selectedSeed = seed.id; }}
                >{seed.name}</button>
              {/each}
            </div>
            <div class="opt-row">
              <span class="opt-label">Round</span>
              {#each [1, 2, 3, 4, 5] as n}
                <button
                  class="round-chip"
                  class:active={numRounds === n}
                  onclick={() => { numRounds = n; }}
                >{n}</button>
              {/each}
            </div>
          </div>

          <button class="cta-primary" onclick={handleMultiStart}>
            <span>Gioca</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>

        {:else}
          <!-- Online -->
          {#if online.error}
            <div class="online-error">{online.error}</div>
          {/if}

          {#if !inLobby && !onlineMode}
            <div class="panel">
              <div class="name-inputs">
                <input
                  type="text"
                  placeholder="Il tuo nome"
                  bind:value={onlineName}
                />
              </div>
              <div class="online-actions">
                <button class="online-btn create" onclick={() => { handleCreateRoom(); if (!online.error) onlineMode = 'create'; }}>
                  Crea stanza
                </button>
                <button class="online-btn join" onclick={() => { onlineMode = 'join'; }}>
                  Entra in stanza
                </button>
              </div>
            </div>
          {/if}

          {#if onlineMode === 'join' && !inLobby}
            <div class="panel">
              <div class="name-inputs">
                <input
                  type="text"
                  placeholder="Il tuo nome"
                  bind:value={onlineName}
                />
                <div class="join-row">
                  <input
                    type="text"
                    placeholder="Codice stanza"
                    bind:value={joinCode}
                    maxlength="6"
                    class="code-input"
                    oninput={(e) => { joinCode = e.target.value.toUpperCase(); }}
                  />
                  <button class="online-btn join" onclick={handleJoinRoom} disabled={joinCode.trim().length < 3}>
                    Entra
                  </button>
                </div>
              </div>
              <button class="back-btn" onclick={() => { onlineMode = null; }}>
                Indietro
              </button>
            </div>
          {/if}

          {#if online.mode === 'host'}
            <div class="lobby">
              <div class="room-code-display">
                <span class="room-label">Codice stanza</span>
                <div class="room-code-row">
                  <span class="room-code">{online.roomCode}</span>
                  <button class="copy-btn" onclick={copyRoomCode} title="Copia codice">
                    {copied ? 'Copiato!' : 'Copia'}
                  </button>
                </div>
              </div>

              <div class="players-lobby">
                <span class="lobby-label">Giocatori connessi ({online.connectedPlayers.length})</span>
                <ul class="player-list">
                  {#each online.connectedPlayers as player}
                    <li class="player-item" class:is-host={player.isHost}>
                      <span class="player-avatar">{player.name[0].toUpperCase()}</span>
                      <span class="player-name">{player.name}</span>
                      {#if player.isHost}
                        <span class="host-badge">HOST</span>
                      {/if}
                    </li>
                  {/each}
                </ul>
              </div>

              <div class="panel">
                <div class="opt-row">
                  <span class="opt-label">Ruota</span>
                  {#each SEED_LIST as seed}
                    <button
                      class="chip"
                      class:active={selectedSeed === seed.id}
                      title={seed.description}
                      onclick={() => { selectedSeed = seed.id; }}
                    >{seed.name}</button>
                  {/each}
                </div>
                <div class="opt-row">
                  <span class="opt-label">Round</span>
                  {#each [1, 2, 3, 4, 5] as n}
                    <button
                      class="round-chip"
                      class:active={onlineRounds === n}
                      onclick={() => { onlineRounds = n; }}
                    >{n}</button>
                  {/each}
                </div>
              </div>

              <button
                class="cta-primary"
                onclick={handleOnlineStart}
                disabled={online.connectedPlayers.length < 2}
              >
                <span>Inizia partita</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </button>
              <button class="back-btn" onclick={handleLeaveRoom}>
                Annulla
              </button>
            </div>
          {/if}

          {#if online.mode === 'client'}
            <div class="lobby">
              <div class="room-code-display">
                <span class="room-label">Stanza</span>
                <span class="room-code">{online.roomCode}</span>
              </div>

              <div class="players-lobby">
                <span class="lobby-label">Giocatori connessi ({online.connectedPlayers.length})</span>
                <ul class="player-list">
                  {#each online.connectedPlayers as player}
                    <li class="player-item" class:is-host={player.isHost}>
                      <span class="player-avatar">{player.name[0].toUpperCase()}</span>
                      <span class="player-name">{player.name}</span>
                      {#if player.isHost}
                        <span class="host-badge">HOST</span>
                      {/if}
                      {#if player.name === online.myName}
                        <span class="you-badge">TU</span>
                      {/if}
                    </li>
                  {/each}
                </ul>
              </div>

              <div class="waiting-msg">
                In attesa che l'host avvii la partita...
              </div>

              <button class="back-btn" onclick={handleLeaveRoom}>
                Esci dalla stanza
              </button>
            </div>
          {/if}
        {/if}
      </div>
    {/if}

    <footer class="footer">
      <button class="footer-link" onclick={() => { showRules = true; }}>
        Come si gioca
      </button>
      <button class="footer-link" onclick={() => { showStats = true; }}>
        Statistiche
      </button>
      <button class="footer-link" onclick={() => { showSettings = true; }}>
        Impostazioni
      </button>
      <button class="footer-link" onclick={() => { showPrivacy = true; }}>
        Privacy Policy
      </button>
    </footer>
  </div>

  <HowToPlay open={showRules} onClose={() => { showRules = false; }} />
  <PrivacyPolicy open={showPrivacy} onClose={() => { showPrivacy = false; }} />
  <SettingsModal open={showSettings} onClose={() => { showSettings = false; }} />
  <StatsModal open={showStats} stats={daily.stats} streak={daily.streak} generalStats={generalStats.stats} matchHistory={generalStats.history} onClose={() => { showStats = false; }} />
  {#if showDailyResult}
    <DailyResultCard
      result={daily.dailyResult}
      streak={daily.streak}
      shareText={daily.getShareText()}
      isModal={true}
      onClose={() => { showDailyResult = false; }}
    />
  {/if}
</div>

<style>
  .start-screen {
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
  }

  /* --- Ruota decorativa a destra --- */
  .hero {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 55%;
    pointer-events: none;
  }
  .hero-glow {
    position: absolute;
    right: -320px;
    top: 50%;
    transform: translateY(-50%);
    width: 1100px;
    height: 1100px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(245,182,63,0.14) 0%, rgba(124,108,255,0.08) 45%, rgba(10,14,35,0) 70%);
  }
  .hero-wheel {
    /* la ruota della Home si puo' toccare: gira al passaggio del mouse e si trascina */
    pointer-events: auto;
    position: absolute;
    right: -300px;
    top: 50%;
    transform: translateY(-50%) rotate(-14deg);
    width: 880px;
    height: 880px;
  }
  .hero-vignette {
    pointer-events: none;
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(10,14,35,0) 45%, rgba(10,14,35,0.55) 100%);
  }



  .content {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 520px;
    padding: 3rem 2rem 2rem;
    margin-left: 7%;
    display: flex;
    flex-direction: column;
    gap: 1.8rem;
    text-align: left;
  }

  /* --- Wordmark --- */
  .brand-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .tagline {
    font-family: var(--font-ui);
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .title {
    font-family: var(--font-display);
    font-size: 3.4rem;
    font-weight: 900;
    color: var(--text);
    line-height: 1.02;
    margin: -0.6rem 0 0;
    text-transform: uppercase;
  }
  .title span {
    color: var(--amber);
  }
  .subtitle {
    color: rgba(244,242,255,0.6);
    font-family: var(--font-ui);
    font-size: 1.02rem;
    margin: -1rem 0 0;
  }

  /* --- Menu principale --- */
  .menu {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .play-btn-wrapper {
    position: relative;
  }
  .cta-primary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 64px;
    padding: 0 26px;
    border: none;
    border-radius: var(--radius-lg);
    background: var(--amber);
    color: var(--ink);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.15rem;
    letter-spacing: 1px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.25s;
    box-shadow: 0 10px 34px rgba(245,182,63,0.35);
  }
  .cta-primary:hover:not(:disabled) {
    background: var(--amber-bright);
    transform: translateY(-2px);
  }
  .cta-primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .menu-row {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: 62px;
    padding: 0.7rem 1.3rem;
    border-radius: var(--radius-lg);
    background: var(--glass-strong);
    border: 1px solid var(--glass-border-strong);
    cursor: pointer;
    transition: all 0.25s;
    text-align: left;
    color: var(--text);
  }
  .menu-row:hover {
    background: rgba(244,242,255,0.08);
    border-color: rgba(244,242,255,0.2);
  }
  .menu-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .icon-violet { color: var(--violet); }
  .icon-mint { color: var(--mint); }
  .menu-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }
  .menu-title {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 1rem;
  }
  .menu-sub {
    font-family: var(--font-ui);
    font-size: 0.8rem;
    color: rgba(244,242,255,0.5);
  }
  .chevron {
    color: rgba(244,242,255,0.4);
    flex-shrink: 0;
  }
  .streak-chip {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: var(--font-ui);
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--amber);
    flex-shrink: 0;
  }

  /* --- Opzioni compatte (chip) --- */
  .opts {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .opt-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .opt-label {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-faint);
    width: 76px;
    flex-shrink: 0;
  }
  .chip {
    padding: 8px 16px;
    border-radius: 12px;
    font-family: var(--font-ui);
    font-size: 0.82rem;
    font-weight: 600;
    color: rgba(244,242,255,0.6);
    border: 1.5px solid var(--glass-border-strong);
    background: transparent;
    cursor: pointer;
    transition: all 0.2s;
  }
  .chip.active {
    color: var(--amber);
    font-weight: 700;
    border-color: rgba(245,182,63,0.6);
    background: rgba(245,182,63,0.08);
  }
  .chip:hover:not(.active) {
    background: var(--glass-strong);
    color: rgba(244,242,255,0.8);
  }
  .round-chip {
    width: 36px;
    height: 34px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-ui);
    font-size: 0.82rem;
    font-weight: 600;
    color: rgba(244,242,255,0.6);
    border: 1.5px solid var(--glass-border-strong);
    background: transparent;
    cursor: pointer;
    transition: all 0.2s;
  }
  .round-chip.active {
    color: var(--amber);
    font-weight: 700;
    border-color: rgba(245,182,63,0.6);
    background: rgba(245,182,63,0.08);
  }

  /* --- Sezione multiplayer --- */
  .section-view {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }
  .section-head {
    display: flex;
    align-items: center;
    gap: 0.9rem;
  }
  .back-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--glass-strong);
    border: 1px solid var(--glass-border-strong);
    color: rgba(244,242,255,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .back-icon:hover:not(:disabled) {
    background: rgba(244,242,255,0.1);
    color: var(--text);
  }
  .back-icon:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .section-title {
    font-family: var(--font-display);
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--text);
    margin: 0;
  }
  .mode-toggle {
    display: flex;
    gap: 0.5rem;
  }
  .panel {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    padding: 1.2rem;
    border-radius: var(--radius-lg);
    background: var(--glass);
    border: 1px solid var(--glass-border);
  }
  .name-inputs {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .name-inputs input {
    padding: 0.75rem 1rem;
    border: 1px solid var(--glass-border-strong);
    border-radius: 12px;
    background: rgba(244,242,255,0.05);
    color: var(--text);
    font-family: var(--font-ui);
    font-size: 0.95rem;
    transition: border-color 0.2s;
  }
  .name-inputs input::placeholder {
    color: rgba(244,242,255,0.3);
  }
  .name-inputs input:focus {
    border-color: rgba(245,182,63,0.5);
    outline: none;
  }

  /* --- Online --- */
  .online-error {
    background: rgba(255,93,115,0.1);
    border: 1px solid rgba(255,93,115,0.35);
    color: var(--coral);
    font-family: var(--font-ui);
    font-weight: 600;
    font-size: 0.85rem;
    padding: 0.6rem 1rem;
    border-radius: 10px;
    text-align: center;
  }
  .online-actions {
    display: flex;
    gap: 0.8rem;
  }
  .online-btn {
    flex: 1;
    padding: 0.85rem 1.2rem;
    border-radius: 14px;
    font-family: var(--font-ui);
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.25s;
    border: none;
  }
  .online-btn.create {
    background: var(--amber);
    color: var(--ink);
  }
  .online-btn.create:hover {
    background: var(--amber-bright);
  }
  .online-btn.join {
    background: var(--glass-strong);
    border: 1px solid var(--glass-border-strong);
    color: rgba(244,242,255,0.85);
  }
  .online-btn.join:hover:not(:disabled) {
    background: rgba(244,242,255,0.1);
  }
  .online-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .join-row {
    display: flex;
    gap: 0.5rem;
  }
  .code-input {
    text-transform: uppercase;
    font-family: var(--font-display) !important;
    font-size: 1.05rem !important;
    letter-spacing: 3px;
    text-align: center;
    min-width: 0;
    flex: 1;
  }
  .back-btn {
    display: block;
    margin: 0 auto;
    background: none;
    border: none;
    color: var(--text-faint);
    font-family: var(--font-ui);
    font-size: 0.85rem;
    cursor: pointer;
    text-decoration: underline;
    transition: color 0.2s;
  }
  .back-btn:hover {
    color: var(--text-dim);
  }

  /* --- Lobby --- */
  .lobby {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }
  .room-code-display {
    padding: 1.1rem 1.2rem;
    border-radius: var(--radius-lg);
    background: var(--glass);
    border: 1px solid var(--glass-border);
    text-align: center;
  }
  .room-label {
    display: block;
    color: var(--text-faint);
    font-family: var(--font-ui);
    font-size: 0.72rem;
    font-weight: 700;
    margin-bottom: 0.3rem;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .room-code-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
  }
  .room-code {
    font-family: var(--font-display);
    font-size: 2.1rem;
    font-weight: 700;
    color: var(--amber);
    letter-spacing: 6px;
    user-select: all;
  }
  .copy-btn {
    background: rgba(245,182,63,0.1);
    border: 1px solid rgba(245,182,63,0.35);
    color: var(--amber);
    padding: 0.35rem 0.9rem;
    border-radius: 999px;
    font-family: var(--font-ui);
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }
  .copy-btn:hover {
    background: rgba(245,182,63,0.2);
  }

  .players-lobby {
    text-align: left;
  }
  .lobby-label {
    display: block;
    color: var(--text-faint);
    font-family: var(--font-ui);
    font-size: 0.72rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .player-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .player-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.55rem 0.9rem;
    background: var(--glass);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    transition: all 0.2s;
  }
  .player-item.is-host {
    border-color: rgba(245,182,63,0.35);
    background: rgba(245,182,63,0.05);
  }
  .player-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--amber);
    color: var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.85rem;
    flex-shrink: 0;
  }
  .player-name {
    color: var(--text);
    font-family: var(--font-ui);
    font-size: 0.95rem;
    flex: 1;
    text-align: left;
  }
  .host-badge {
    color: var(--amber);
    font-family: var(--font-ui);
    font-size: 0.75rem;
    font-weight: 700;
  }
  .you-badge {
    color: var(--mint);
    font-family: var(--font-ui);
    font-size: 0.75rem;
    font-weight: 700;
  }
  .waiting-msg {
    color: var(--text-dim);
    font-family: var(--font-ui);
    font-size: 0.9rem;
    text-align: center;
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  /* --- Footer --- */
  .footer {
    display: flex;
    align-items: center;
    gap: 1.4rem;
    flex-wrap: wrap;
  }
  .footer-link {
    background: none;
    border: none;
    color: rgba(244,242,255,0.35);
    font-family: var(--font-ui);
    font-size: 0.82rem;
    cursor: pointer;
    padding: 0;
    transition: color 0.2s;
  }
  .footer-link:hover {
    color: var(--amber);
  }

  /* --- Responsive --- */
  @media (max-width: 1020px) {
    /* la ruota passa sotto al menu, tagliata a meta' dal bordo inferiore */
    .start-screen {
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
    }
    .hero {
      position: relative;
      order: 2;
      width: 100%;
      height: calc(var(--hero-size, 460px) * 0.66);
      margin-top: 1.2rem;
    }
    .hero-glow {
      left: 50%;
      right: auto;
      top: 0;
      transform: translateX(-50%);
    }
    .hero-wheel {
      right: auto;
      left: 50%;
      top: 0;
      transform: translateX(-50%) rotate(-14deg);
      width: var(--hero-size, 460px);
      height: var(--hero-size, 460px);
    }
    .content {
      margin-left: 0;
      text-align: center;
      align-items: center;
    }
    .brand-row {
      justify-content: center;
    }
    .opt-row {
      justify-content: center;
    }
    .opt-label {
      width: auto;
    }
    .menu,
    .opts,
    .section-view {
      width: 100%;
    }
    .menu-row {
      text-align: left;
    }
    .footer {
      justify-content: center;
    }
  }
  @media (max-width: 480px) {
    .title { font-size: 2.4rem; }
    .tagline { letter-spacing: 2px; font-size: 0.7rem; }
    .content { padding: 2.5rem 1.2rem 1.5rem; }
    .online-actions { flex-direction: column; }
  }
</style>
