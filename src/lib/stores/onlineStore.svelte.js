import { supabase, isSupabaseConfigured } from '../supabase.js';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createOnlineStore() {
  let mode = $state('offline'); // 'offline' | 'host' | 'client'
  let roomCode = $state('');
  let channel = $state(null);
  let connectedPlayers = $state([]);
  let isReady = $state(false);
  let myName = $state('');
  let error = $state('');
  let hostDisconnected = $state(false);

  // Callbacks set by the game
  let _onStateUpdate = null;
  let _onPlayerAction = null;
  let _onGameStart = null;
  let _onPlayerJoined = null;
  let _onPlayerLeft = null;
  let _onDiceRoll = null;

  // Track pending cleanup timeout so we can cancel it
  let _cleanupTimeout = null;

  // Immediately tear down old channel (cancel any delayed cleanup)
  function cleanupOldChannel() {
    if (_cleanupTimeout) {
      clearTimeout(_cleanupTimeout);
      _cleanupTimeout = null;
    }
    if (channel) {
      const ch = channel;
      channel = null;
      try { ch.unsubscribe(); } catch (_) {}
      try { supabase.removeChannel(ch); } catch (_) {}
    }
  }

  function createRoom(playerName) {
    if (!isSupabaseConfigured) { error = 'Modalita online non disponibile'; return; }
    cleanupOldChannel();

    myName = playerName;
    roomCode = generateRoomCode();
    mode = 'host';
    connectedPlayers = [{ name: playerName, isHost: true }];
    error = '';
    hostDisconnected = false;

    const ch = supabase.channel(`room:${roomCode}`, {
      config: { broadcast: { self: false } },
    });

    ch.on('broadcast', { event: 'player_joined' }, ({ payload }) => {
      // Add player if not already present (dedup by name)
      if (!connectedPlayers.find(p => p.name === payload.name)) {
        connectedPlayers = [...connectedPlayers, { name: payload.name, isHost: false }];
      }
      // Always respond with lobby_update (handles reconnects too)
      ch.send({
        type: 'broadcast',
        event: 'lobby_update',
        payload: { players: connectedPlayers, roomCode },
      });
      if (_onPlayerJoined) _onPlayerJoined(payload.name);
    });

    ch.on('broadcast', { event: 'player_left' }, ({ payload }) => {
      connectedPlayers = connectedPlayers.filter(p => p.name !== payload.name);
      ch.send({
        type: 'broadcast',
        event: 'lobby_update',
        payload: { players: connectedPlayers, roomCode },
      });
      if (_onPlayerLeft) _onPlayerLeft(payload.name);
    });

    ch.on('broadcast', { event: 'player_action' }, ({ payload }) => {
      if (_onPlayerAction) _onPlayerAction(payload);
    });

    ch.on('broadcast', { event: 'dice_roll' }, ({ payload }) => {
      if (_onDiceRoll) _onDiceRoll(payload);
    });

    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        isReady = true;
      }
    });

    channel = ch;
  }

  function joinRoom(code, playerName) {
    if (!isSupabaseConfigured) { error = 'Modalita online non disponibile'; return; }
    cleanupOldChannel();

    myName = playerName;
    roomCode = code.toUpperCase();
    mode = 'client';
    connectedPlayers = [];
    error = '';
    hostDisconnected = false;

    const ch = supabase.channel(`room:${roomCode}`, {
      config: { broadcast: { self: false } },
    });

    ch.on('broadcast', { event: 'lobby_update' }, ({ payload }) => {
      connectedPlayers = payload.players;
    });

    ch.on('broadcast', { event: 'state_update' }, ({ payload }) => {
      if (_onStateUpdate) _onStateUpdate(payload);
    });

    ch.on('broadcast', { event: 'game_start' }, ({ payload }) => {
      if (_onGameStart) _onGameStart(payload);
    });

    ch.on('broadcast', { event: 'host_disconnected' }, () => {
      hostDisconnected = true;
    });

    ch.on('broadcast', { event: 'dice_roll' }, ({ payload }) => {
      if (_onDiceRoll) _onDiceRoll(payload);
    });

    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        isReady = true;
        // Announce ourselves
        ch.send({
          type: 'broadcast',
          event: 'player_joined',
          payload: { name: playerName },
        });
      }
    });

    channel = ch;
  }

  function broadcastState(gameState) {
    if (mode !== 'host' || !channel) return;
    channel.send({
      type: 'broadcast',
      event: 'state_update',
      payload: gameState,
    });
  }

  function broadcastGameStart(gameState) {
    if (mode !== 'host' || !channel) return;
    channel.send({
      type: 'broadcast',
      event: 'game_start',
      payload: gameState,
    });
  }

  function sendAction(action, data = {}) {
    if (mode !== 'client' || !channel) return;
    channel.send({
      type: 'broadcast',
      event: 'player_action',
      payload: { action, data, playerName: myName },
    });
  }


  function onStateUpdate(callback) {
    _onStateUpdate = callback;
  }

  function onPlayerAction(callback) {
    _onPlayerAction = callback;
  }

  function onGameStart(callback) {
    _onGameStart = callback;
  }

  function onPlayerJoined(callback) {
    _onPlayerJoined = callback;
  }

  function onPlayerLeft(callback) {
    _onPlayerLeft = callback;
  }

  function onDiceRoll(callback) {
    _onDiceRoll = callback;
  }

  function broadcastDiceRoll(playerIndex) {
    if (!channel) return;
    channel.send({ type: 'broadcast', event: 'dice_roll', payload: { playerIndex } });
  }

  function leaveRoom() {
    if (_cleanupTimeout) {
      clearTimeout(_cleanupTimeout);
      _cleanupTimeout = null;
    }
    if (channel) {
      const ch = channel;
      channel = null; // stop any further sends on the old channel
      if (mode === 'host') {
        ch.send({
          type: 'broadcast',
          event: 'host_disconnected',
          payload: {},
        });
      } else if (mode === 'client') {
        ch.send({
          type: 'broadcast',
          event: 'player_left',
          payload: { name: myName },
        });
      }
      // Delay teardown so the broadcast above has time to be delivered
      _cleanupTimeout = setTimeout(() => {
        _cleanupTimeout = null;
        try { ch.unsubscribe(); } catch (_) {}
        try { supabase.removeChannel(ch); } catch (_) {}
      }, 400);
    }
    mode = 'offline';
    roomCode = '';
    connectedPlayers = [];
    isReady = false;
    myName = '';
    error = '';
    hostDisconnected = false;
    // Intentionally keep _onStateUpdate / _onPlayerAction / _onGameStart / _onPlayerJoined
    // so they survive across multiple room sessions in the same page lifetime.
  }

  return {
    get mode() { return mode; },
    get roomCode() { return roomCode; },
    get connectedPlayers() { return connectedPlayers; },
    get isReady() { return isReady; },
    get myName() { return myName; },
    get error() { return error; },
    get hostDisconnected() { return hostDisconnected; },
    get isConfigured() { return isSupabaseConfigured; },
    createRoom,
    joinRoom,
    broadcastState,
    broadcastGameStart,
    sendAction,
    broadcastDiceRoll,
    onDiceRoll,
    onStateUpdate,
    onPlayerAction,
    onGameStart,
    onPlayerJoined,
    onPlayerLeft,
    leaveRoom,
  };
}

export const online = createOnlineStore();
