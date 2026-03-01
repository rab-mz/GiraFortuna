import { supabase } from '../supabase.js';

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

  function createRoom(playerName) {
    if (channel) leaveRoom();

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
      // Avoid duplicates
      if (!connectedPlayers.find(p => p.name === payload.name)) {
        connectedPlayers = [...connectedPlayers, { name: payload.name, isHost: false }];
        // Broadcast updated lobby to all
        ch.send({
          type: 'broadcast',
          event: 'lobby_update',
          payload: { players: connectedPlayers, roomCode },
        });
      }
    });

    ch.on('broadcast', { event: 'player_left' }, ({ payload }) => {
      connectedPlayers = connectedPlayers.filter(p => p.name !== payload.name);
      ch.send({
        type: 'broadcast',
        event: 'lobby_update',
        payload: { players: connectedPlayers, roomCode },
      });
    });

    ch.on('broadcast', { event: 'player_action' }, ({ payload }) => {
      if (_onPlayerAction) _onPlayerAction(payload);
    });

    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        isReady = true;
      }
    });

    channel = ch;
  }

  function joinRoom(code, playerName) {
    if (channel) leaveRoom();

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

  function leaveRoom() {
    if (channel) {
      if (mode === 'host') {
        channel.send({
          type: 'broadcast',
          event: 'host_disconnected',
          payload: {},
        });
      } else if (mode === 'client') {
        channel.send({
          type: 'broadcast',
          event: 'player_left',
          payload: { name: myName },
        });
      }
      supabase.removeChannel(channel);
    }
    channel = null;
    mode = 'offline';
    roomCode = '';
    connectedPlayers = [];
    isReady = false;
    myName = '';
    error = '';
    hostDisconnected = false;
    _onStateUpdate = null;
    _onPlayerAction = null;
    _onGameStart = null;
  }

  return {
    get mode() { return mode; },
    get roomCode() { return roomCode; },
    get connectedPlayers() { return connectedPlayers; },
    get isReady() { return isReady; },
    get myName() { return myName; },
    get error() { return error; },
    get hostDisconnected() { return hostDisconnected; },
    createRoom,
    joinRoom,
    broadcastState,
    broadcastGameStart,
    sendAction,
    onStateUpdate,
    onPlayerAction,
    onGameStart,
    leaveRoom,
  };
}

export const online = createOnlineStore();
