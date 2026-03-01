<script>
  import { online } from '../lib/stores/onlineStore.svelte.js';
  import HowToPlay from './HowToPlay.svelte';

  let { onStart = () => {}, onOnlineStart = () => {} } = $props();

  let showRules = $state(false);

  let mode = $state('single'); // single | multi | online
  let numPlayers = $state(2);
  let playerNames = $state(['', '']);
  let numRounds = $state(1);

  // Online state
  let onlineMode = $state(null); // null | 'create' | 'join'
  let onlineName = $state('');
  let joinCode = $state('');
  let onlineRounds = $state(1);

  function updateNumPlayers(n) {
    numPlayers = n;
    playerNames = Array.from({ length: n }, (_, i) => playerNames[i] || '');
  }

  function handleStart() {
    if (mode === 'single') {
      onStart(['Giocatore'], numRounds);
    } else if (mode === 'multi') {
      const names = playerNames.map((n, i) => n.trim() || `Giocatore ${i + 1}`);
      onStart(names, numRounds);
    }
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
    const playerNames = online.connectedPlayers.map(p => p.name);
    onOnlineStart(playerNames, onlineRounds);
  }

  function handleBackToOnline() {
    online.leaveRoom();
    onlineMode = null;
  }

  function copyRoomCode() {
    navigator.clipboard.writeText(online.roomCode);
  }
</script>

<div class="start-screen">
  <div class="bg-wheel"></div>

  <div class="content">
    <h1 class="title">Gira<br><span>Fortuna</span></h1>
    <p class="subtitle"></p>

    <div class="mode-selector">
      <button
        class="mode-btn" class:active={mode === 'single'}
        onclick={() => { mode = 'single'; }}
      >
        1 Giocatore
      </button>
      <button
        class="mode-btn" class:active={mode === 'multi'}
        onclick={() => { mode = 'multi'; }}
      >
        Locale
      </button>
      <button
        class="mode-btn" class:active={mode === 'online'}
        onclick={() => { mode = 'online'; }}
      >
        Online
      </button>
    </div>

    {#if mode === 'multi'}
      <div class="multi-setup">
        <div class="num-select">
          <span>Numero giocatori:</span>
          <div class="num-btns">
            {#each [2, 3, 4] as n}
              <button
                class="num-btn" class:active={numPlayers === n}
                onclick={() => updateNumPlayers(n)}
              >{n}</button>
            {/each}
          </div>
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
      </div>

      <div class="round-select">
        <span>Numero round:</span>
        <div class="num-btns">
          {#each [1, 2, 3, 4, 5] as n}
            <button
              class="num-btn" class:active={numRounds === n}
              onclick={() => { numRounds = n; }}
            >{n}</button>
          {/each}
        </div>
      </div>

      <button class="play-btn" onclick={handleStart}>
        GIOCA!
      </button>
    {/if}

    {#if mode === 'single'}
      <div class="round-select">
        <span>Numero round:</span>
        <div class="num-btns">
          {#each [1, 2, 3, 4, 5] as n}
            <button
              class="num-btn" class:active={numRounds === n}
              onclick={() => { numRounds = n; }}
            >{n}</button>
          {/each}
        </div>
      </div>

      <button class="play-btn" onclick={handleStart}>
        GIOCA!
      </button>
    {/if}

    {#if mode === 'online'}
      <div class="online-setup">
        {#if online.mode === 'offline' && !onlineMode}
          <div class="name-inputs">
            <input
              type="text"
              placeholder="Il tuo nome"
              bind:value={onlineName}
            />
          </div>

          <div class="online-actions">
            <button class="online-btn create" onclick={() => { onlineMode = 'create'; handleCreateRoom(); }}>
              Crea Stanza
            </button>
            <button class="online-btn join" onclick={() => { onlineMode = 'join'; }}>
              Entra in Stanza
            </button>
          </div>
        {/if}

        {#if onlineMode === 'join' && online.mode === 'offline'}
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
        {/if}

        {#if online.mode === 'host'}
          <div class="lobby">
            <div class="room-code-display">
              <span class="room-label">Codice Stanza</span>
              <div class="room-code-row">
                <span class="room-code">{online.roomCode}</span>
                <button class="copy-btn" onclick={copyRoomCode} title="Copia codice">
                  Copia
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

            <div class="round-select">
              <span>Numero round:</span>
              <div class="num-btns">
                {#each [1, 2, 3, 4, 5] as n}
                  <button
                    class="num-btn" class:active={onlineRounds === n}
                    onclick={() => { onlineRounds = n; }}
                  >{n}</button>
                {/each}
              </div>
            </div>

            <button
              class="play-btn"
              onclick={handleOnlineStart}
              disabled={online.connectedPlayers.length < 2}
            >
              INIZIA PARTITA
            </button>
            <button class="back-btn" onclick={handleBackToOnline}>
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

            <button class="back-btn" onclick={handleBackToOnline}>
              Esci dalla stanza
            </button>
          </div>
        {/if}
      </div>
    {/if}
    <button class="rules-btn" onclick={() => { showRules = true; }}>
      Come si gioca?
    </button>
  </div>

  <HowToPlay open={showRules} onClose={() => { showRules = false; }} />
</div>

<style>
  .start-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding: 2rem;
  }
  .bg-wheel {
    position: absolute;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: conic-gradient(
      from 0deg,
      #E74C3C, #3498DB, #2ECC71, #F39C12,
      #9B59B6, #1ABC9C, #E67E22, #2980B9,
      #27AE60, #F1C40F, #E74C3C, #3498DB
    );
    opacity: 0.06;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: bgSpin 30s linear infinite;
    pointer-events: none;
  }
  @keyframes bgSpin {
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }
  .content {
    position: relative;
    text-align: center;
    z-index: 1;
    max-width: 440px;
    width: 100%;
  }
  .title {
    font-family: 'Oswald', sans-serif;
    font-size: 3rem;
    font-weight: 700;
    color: #ffd700;
    text-shadow: 0 0 30px rgba(255,215,0,0.4), 0 4px 8px rgba(0,0,0,0.3);
    line-height: 1.1;
    margin: 0 0 0.3rem;
  }
  .title span {
    font-size: 2.2rem;
    display: block;
  }
  .subtitle {
    color: rgba(255,255,255,0.5);
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    margin-bottom: 2.5rem;
    letter-spacing: 1px;
  }
  .mode-selector {
    display: flex;
    gap: 0;
    border-radius: 10px;
    overflow: hidden;
    border: 2px solid rgba(255,215,0,0.3);
    margin-bottom: 1.5rem;
  }
  .mode-btn {
    flex: 1;
    padding: 0.8rem 1rem;
    background: rgba(255,255,255,0.05);
    border: none;
    color: rgba(255,255,255,0.6);
    font-family: 'Oswald', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s;
  }
  .mode-btn.active {
    background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,215,0,0.1));
    color: #ffd700;
  }
  .multi-setup {
    margin-bottom: 1.5rem;
    animation: fadeIn 0.3s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .num-select, .round-select {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    margin-bottom: 1rem;
    color: rgba(255,255,255,0.7);
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
  }
  .round-select {
    margin-bottom: 1.5rem;
  }
  .num-btns {
    display: flex;
    gap: 0.4rem;
  }
  .num-btn {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: 2px solid rgba(255,215,0,0.3);
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.6);
    font-family: 'Oswald', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .num-btn.active {
    background: rgba(255,215,0,0.2);
    color: #ffd700;
    border-color: #ffd700;
  }
  .name-inputs {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .name-inputs input {
    padding: 0.7rem 1rem;
    border: 2px solid rgba(255,215,0,0.2);
    border-radius: 8px;
    background: rgba(255,255,255,0.07);
    color: #fff;
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    transition: border-color 0.2s;
  }
  .name-inputs input::placeholder {
    color: rgba(255,255,255,0.3);
  }
  .name-inputs input:focus {
    border-color: rgba(255,215,0,0.5);
    outline: none;
  }
  .play-btn {
    padding: 1rem 4rem;
    background: linear-gradient(135deg, #ffd700, #e6b800);
    color: #1a237e;
    border: none;
    border-radius: 12px;
    font-family: 'Oswald', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 3px;
    transition: all 0.25s;
    box-shadow: 0 4px 20px rgba(255,215,0,0.3);
  }
  .play-btn:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 6px 28px rgba(255,215,0,0.4);
  }
  .play-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Online styles */
  .online-setup {
    animation: fadeIn 0.3s ease;
  }
  .online-actions {
    display: flex;
    gap: 0.8rem;
    margin-bottom: 1rem;
  }
  .online-btn {
    flex: 1;
    padding: 0.9rem 1.2rem;
    border: 2px solid rgba(255,215,0,0.3);
    border-radius: 10px;
    font-family: 'Oswald', sans-serif;
    font-size: 1.05rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s;
  }
  .online-btn.create {
    background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,215,0,0.1));
    color: #ffd700;
    border-color: rgba(255,215,0,0.4);
  }
  .online-btn.create:hover {
    background: linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,215,0,0.15));
  }
  .online-btn.join {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.8);
  }
  .online-btn.join:hover:not(:disabled) {
    background: rgba(255,255,255,0.12);
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
    font-family: 'Oswald', sans-serif !important;
    font-size: 1.2rem !important;
    letter-spacing: 3px;
    text-align: center;
  }
  .back-btn {
    display: block;
    margin: 0.8rem auto 0;
    background: none;
    border: none;
    color: rgba(255,255,255,0.4);
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    cursor: pointer;
    text-decoration: underline;
    transition: color 0.2s;
  }
  .back-btn:hover {
    color: rgba(255,255,255,0.7);
  }

  /* Lobby */
  .lobby {
    animation: fadeIn 0.3s ease;
  }
  .room-code-display {
    margin-bottom: 1.2rem;
  }
  .room-label {
    display: block;
    color: rgba(255,255,255,0.5);
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    margin-bottom: 0.3rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .room-code-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
  }
  .room-code {
    font-family: 'Oswald', sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: #ffd700;
    letter-spacing: 6px;
    text-shadow: 0 0 20px rgba(255,215,0,0.3);
  }
  .copy-btn {
    background: rgba(255,215,0,0.15);
    border: 1px solid rgba(255,215,0,0.3);
    color: #ffd700;
    padding: 0.3rem 0.8rem;
    border-radius: 6px;
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .copy-btn:hover {
    background: rgba(255,215,0,0.25);
  }

  .players-lobby {
    margin-bottom: 1.2rem;
  }
  .lobby-label {
    display: block;
    color: rgba(255,255,255,0.5);
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 1px;
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
    padding: 0.5rem 0.8rem;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    transition: all 0.2s;
  }
  .player-item.is-host {
    border-color: rgba(255,215,0,0.3);
    background: rgba(255,215,0,0.05);
  }
  .player-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ffd700, #e6b800);
    color: #1a237e;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Oswald', sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
    flex-shrink: 0;
  }
  .player-name {
    color: rgba(255,255,255,0.9);
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    flex: 1;
    text-align: left;
  }
  .host-badge {
    background: rgba(255,215,0,0.2);
    color: #ffd700;
    font-family: 'Oswald', sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    letter-spacing: 1px;
  }
  .you-badge {
    background: rgba(76,175,80,0.2);
    color: #4CAF50;
    font-family: 'Oswald', sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    letter-spacing: 1px;
  }
  .waiting-msg {
    color: rgba(255,255,255,0.5);
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    margin: 1rem 0;
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  .rules-btn {
    display: block;
    margin: 1.5rem auto 0;
    background: none;
    border: none;
    color: rgba(255,255,255,0.4);
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    cursor: pointer;
    text-decoration: underline;
    transition: color 0.2s;
  }
  .rules-btn:hover {
    color: rgba(255,215,0,0.8);
  }

  @media (max-width: 480px) {
    .title { font-size: 2.2rem; }
    .title span { font-size: 1.6rem; }
    .play-btn { padding: 0.8rem 2.5rem; font-size: 1.2rem; }
    .room-code { font-size: 2rem; }
    .online-actions { flex-direction: column; }
  }
</style>
