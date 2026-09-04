// server.js - Mibbit-like Web IRC Gateway with Local Virtual Bots
const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const irc = require('irc-framework');
const bots = require('./bots');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const config = require('./bot_config');

const DEFAULT_SERVER = config.server || {
  host: 'local',
  port: 6667,
  ssl: false,
  channel: '#lobby',
  networkName: 'FUN Talk Network'
};
const DEFAULT_CHANNEL = DEFAULT_SERVER.channel || '#lobby';

// Initialize bot simulation engine
bots.init(DEFAULT_CHANNEL, io);

// Map of socket.id -> session
const sessions = new Map();

io.on('connection', (socket) => {
  const session = {
    socketId: socket.id,
    nick: null,
    ircClient: null,
    channels: new Set(),
    isLocal: false,
    connected: false
  };
  sessions.set(socket.id, session);

  // Send initial server info
  socket.emit('init_config', {
    server: DEFAULT_SERVER,
    defaultChannel: DEFAULT_CHANNEL,
    availableBots: bots.getChannelUserList(DEFAULT_CHANNEL)
  });

  // Connect to IRC (or Local Mode)
  socket.on('connect_irc', (data) => {
    const rawNick = String(data.nick || '').trim();
    let nick = rawNick.replace(/[^a-zA-Z0-9_\-\[\]\\`^{}]/g, '').slice(0, 20);
    if (!nick) {
      nick = 'Guest' + Math.floor(Math.random() * 9000 + 1000);
    }
    session.nick = nick;

    // Hardcoded server settings from config (can still be overridden if needed)
    const host = (data.host || DEFAULT_SERVER.host || 'local').trim();
    const port = parseInt(data.port, 10) || DEFAULT_SERVER.port || 6667;
    const ssl = data.ssl !== undefined ? !!data.ssl : !!DEFAULT_SERVER.ssl;
    const password = data.password ? String(data.password).trim() : undefined;
    // Strictly lock to the configured channel
    session.channels.clear();
    session.channels.add(DEFAULT_CHANNEL);
    bots.addChannel(DEFAULT_CHANNEL);

    if (host.toLowerCase() === 'local' || host.toLowerCase() === 'demo') {
      // Local Mode: simulated IRC server with fake bots
      session.isLocal = true;
      session.connected = true;

      socket.emit('irc_connected', {
        server: 'FUN Talk Server',
        nick: session.nick,
        local: true
      });

      socket.emit('irc_raw', {
        type: 'motd',
        text: '*** Welcome to FUN Talk ***'
      });
      socket.emit('irc_raw', {
        type: 'motd',
        text: `*** Channel: ${DEFAULT_CHANNEL} ***`
      });

      setupLocalChannel(socket, session, DEFAULT_CHANNEL);
      return;
    }

    // Real IRC Connection using irc-framework
    session.isLocal = false;
    const client = new irc.Client();
    session.ircClient = client;

    socket.emit('irc_status', {
      text: `Connecting to ${host}:${port} (${ssl ? 'TLS/SSL' : 'Plain'})...`
    });

    try {
      client.connect({
        host: host,
        port: port,
        tls: ssl,
        nick: session.nick,
        username: session.nick,
        gecos: 'FUN Talk Web User',
        password: password,
        rejectUnauthorized: false
      });
    } catch (err) {
      socket.emit('irc_error', { message: 'Connection initialization failed: ' + err.message });
      return;
    }

    // Handle real IRC events
    client.on('registered', () => {
      session.connected = true;
      session.nick = client.user.nick;
      socket.emit('irc_connected', {
        server: host,
        nick: session.nick,
        local: false
      });

      // Join initial channels
      session.channels.forEach(chan => {
        client.join(chan);
      });
    });

    client.on('motd', (event) => {
      socket.emit('irc_raw', { type: 'motd', text: event.motd });
    });

    client.on('message', (event) => {
      const isChannel = event.target && event.target.startsWith('#');
      if (isChannel) {
        socket.emit('irc_message', {
          channel: event.target,
          nick: event.nick,
          text: event.message,
          time: new Date().toISOString(),
          isBot: false
        });

        // Pass real IRC chatter to Bot Engine so bots can react locally
        bots.onUserMessage(event.target, event.nick, event.message);
      } else {
        // Private Message from real IRC
        socket.emit('irc_pm', {
          from: event.nick,
          target: event.target,
          text: event.message,
          time: new Date().toISOString(),
          isBot: false
        });
      }
    });

    client.on('action', (event) => {
      socket.emit('irc_action', {
        channel: event.target,
        nick: event.nick,
        text: event.message,
        time: new Date().toISOString()
      });
    });

    client.on('notice', (event) => {
      socket.emit('irc_notice', {
        from: event.nick || 'Server',
        target: event.target,
        text: event.message
      });
    });

    client.on('join', (event) => {
      const chan = event.channel;
      session.channels.add(chan.toLowerCase());
      bots.addChannel(chan);

      socket.emit('irc_join', {
        channel: chan,
        nick: event.nick,
        prefix: '',
        isBot: false
      });

      // Send initial bot userlist immediately so userlist is never empty while waiting for server RPL_NAMREPLY
      if (event.nick.toLowerCase() === (session.nick || '').toLowerCase()) {
        const botUsers = bots.getChannelUserList(chan);
        socket.emit('irc_names', {
          channel: chan,
          users: [{ nick: session.nick, prefix: '', bot: false }, ...botUsers]
        });
      }
    });

    client.on('part', (event) => {
      socket.emit('irc_part', {
        channel: event.channel,
        nick: event.nick,
        message: event.message,
        isBot: false
      });
    });

    client.on('quit', (event) => {
      socket.emit('irc_quit', {
        nick: event.nick,
        message: event.message
      });
    });

    client.on('nick', (event) => {
      if (event.nick === session.nick) {
        session.nick = event.new_nick;
      }
      socket.emit('irc_nick', {
        oldNick: event.nick,
        newNick: event.new_nick
      });
    });

    client.on('topic', (event) => {
      socket.emit('irc_topic', {
        channel: event.channel,
        topic: event.topic,
        setBy: event.nick
      });
    });

    // Real IRC Channel Modes (Ops @ and Voiced +)
    client.on('mode', (event) => {
      socket.emit('irc_mode', {
        channel: event.target,
        nick: event.nick,
        modes: event.modes,
        raw: event.raw_modes
      });
    });

    // Merge real IRC userlist with local fake bots
    client.on('userlist', (event) => {
      const modeToPrefix = (modes, fallbackPrefix) => {
        if (Array.isArray(modes)) {
          if (modes.includes('o') || modes.includes('@')) return '@';
          if (modes.includes('v') || modes.includes('+')) return '+';
          if (modes.includes('h') || modes.includes('%')) return '%';
          if (modes.includes('a') || modes.includes('&')) return '&';
          if (modes.includes('q') || modes.includes('~')) return '~';
        }
        if (typeof fallbackPrefix === 'string') {
          if (fallbackPrefix === 'o') return '@';
          if (fallbackPrefix === 'v') return '+';
          if (['@', '+', '%', '&', '~'].includes(fallbackPrefix)) return fallbackPrefix;
        }
        return '';
      };

      const realUsers = (event.users || []).map(u => ({
        nick: u.nick,
        prefix: modeToPrefix(u.modes, u.prefix),
        bot: false
      }));

      const botUsers = bots.getChannelUserList(event.channel);

      // Merge avoiding duplicate nicks
      const realNickSet = new Set(realUsers.map(u => u.nick.toLowerCase()));
      const combined = [...realUsers];

      botUsers.forEach(b => {
        if (!realNickSet.has(b.nick.toLowerCase())) {
          combined.push(b);
        }
      });

      socket.emit('irc_names', {
        channel: event.channel,
        users: combined
      });
    });

    client.on('raw', (event) => {
      if (event.command && (event.command.startsWith('ERR_') || event.command === 'NOTICE')) {
        socket.emit('irc_raw', {
          type: 'notice',
          text: (event.params && event.params.length > 1) ? event.params.slice(1).join(' ') : event.raw_command
        });
      }
    });

    client.on('close', () => {
      session.connected = false;
      socket.emit('irc_status', { text: 'Disconnected from IRC server.' });
    });

    client.on('socket error', (err) => {
      socket.emit('irc_error', { message: 'IRC socket error: ' + (err.message || err) });
    });
  });

  // User sends a message in a channel
  socket.on('send_message', (data) => {
    const { channel, text } = data;
    if (!channel || !text || typeof text !== 'string') return;
    const cleanText = text.trim();
    if (!cleanText) return;

    if (session.ircClient && session.connected && !session.isLocal) {
      // Send to real IRC server
      try {
        session.ircClient.say(channel, cleanText);
      } catch (err) {
        socket.emit('irc_error', { message: 'Failed to send message: ' + err.message });
      }
    }

    // Always emit local echo back to the web user (or broadcast if multiple web sockets)
    io.emit('irc_message', {
      channel: channel,
      nick: session.nick || 'You',
      text: cleanText,
      time: new Date().toISOString(),
      isBot: false
    });

    // Pass message to Bot Engine so bots can respond locally
    bots.onUserMessage(channel, session.nick, cleanText);
  });

  // User sends a Private Message (PM)
  socket.on('send_pm', (data) => {
    const { to, text } = data;
    if (!to || !text || typeof text !== 'string') return;
    const cleanText = text.trim();
    if (!cleanText) return;

    // Display sent PM in sender's UI
    socket.emit('irc_pm_sent', {
      to: to,
      text: cleanText,
      time: new Date().toISOString()
    });

    // Check if target is a fake display bot
    if (bots.isBot(to)) {
      // INTERCEPT: Do NOT dispatch to real IRC! Route strictly to local bot engine
      bots.onPM(socket, to, session.nick, cleanText);
    } else {
      // Target is a real IRC user
      if (session.ircClient && session.connected && !session.isLocal) {
        try {
          session.ircClient.say(to, cleanText);
        } catch (err) {
          socket.emit('irc_error', { message: 'Failed to send PM: ' + err.message });
        }
      }
    }
  });

  // User sends an action (/me smiles)
  socket.on('send_action', (data) => {
    const { channel, text } = data;
    if (!channel || !text) return;
    const cleanText = text.trim();

    if (session.ircClient && session.connected && !session.isLocal) {
      session.ircClient.action(channel, cleanText);
    }

    io.emit('irc_action', {
      channel: channel,
      nick: session.nick || 'You',
      text: cleanText,
      time: new Date().toISOString()
    });
  });

  // Channel is locked to the configured channel
  socket.on('join_channel', (data) => {
    socket.emit('irc_notice', {
      from: 'System',
      text: `Channel is locked to ${DEFAULT_CHANNEL}. Joining other channels is disabled.`
    });
  });

  socket.on('part_channel', (data) => {
    socket.emit('irc_notice', {
      from: 'System',
      text: `Leaving ${DEFAULT_CHANNEL} is disabled.`
    });
  });

  // User changes nick (/nick NewName)
  socket.on('change_nick', (data) => {
    const newNick = String(data.nick || '').trim();
    if (!newNick) return;
    const oldNick = session.nick;

    if (session.ircClient && session.connected && !session.isLocal) {
      session.ircClient.changeNick(newNick);
    } else {
      session.nick = newNick;
      socket.emit('irc_nick', { oldNick, newNick });
    }
  });

  // User sets channel topic (/topic #chan New Topic)
  socket.on('set_topic', (data) => {
    const { channel, topic } = data;
    if (!channel) return;

    if (session.ircClient && session.connected && !session.isLocal) {
      session.ircClient.raw('TOPIC', channel, topic);
    } else {
      io.emit('irc_topic', {
        channel: channel,
        topic: topic,
        setBy: session.nick
      });
    }
  });

  // User sends raw IRC command (/raw ...)
  socket.on('send_raw', (data) => {
    const raw = String(data.command || '').trim();
    if (!raw) return;

    if (session.ircClient && session.connected && !session.isLocal) {
      session.ircClient.raw(raw);
      socket.emit('irc_raw', { type: 'raw', text: '-> ' + raw });
    } else {
      socket.emit('irc_raw', { type: 'raw', text: 'Local mode: command noted (' + raw + ')' });
    }
  });

  // Request refreshed userlist for a channel
  socket.on('get_names', (data) => {
    const chan = (data.channel || DEFAULT_CHANNEL).toLowerCase();
    const botUsers = bots.getChannelUserList(chan);
    const myEntry = { nick: session.nick || 'Guest', prefix: '', bot: false };
    socket.emit('irc_names', {
      channel: data.channel || DEFAULT_CHANNEL,
      users: [myEntry, ...botUsers]
    });
  });

  // Disconnect from IRC
  socket.on('disconnect_irc', () => {
    if (session.ircClient) {
      try { session.ircClient.quit('User disconnected'); } catch (_) {}
      session.ircClient = null;
    }
    session.connected = false;
    socket.emit('irc_status', { text: 'Disconnected from IRC.' });
  });

  socket.on('disconnect', () => {
    if (session.ircClient) {
      try { session.ircClient.quit('Browser session closed'); } catch (_) {}
    }
    sessions.delete(socket.id);
  });
});

// Helper for local demo channel setup
function setupLocalChannel(socket, session, channel) {
  const normChan = channel.startsWith('#') ? channel : '#' + channel;

  socket.emit('irc_join', {
    channel: normChan,
    nick: session.nick,
    prefix: '',
    isBot: false
  });

  socket.emit('irc_topic', {
    channel: normChan,
    topic: 'Welcome to FUN Talk! Chat in the room or click any nickname to PM.',
    setBy: 'System'
  });

  const botUsers = bots.getChannelUserList(normChan);
  const myEntry = { nick: session.nick, prefix: '', bot: false };

  socket.emit('irc_names', {
    channel: normChan,
    users: [myEntry, ...botUsers]
  });

  // Send a warm welcome message from a random bot after 2-4 seconds
  const b = bots.randomBotData(normChan);
  if (b) {
    setTimeout(() => {
      bots.say(normChan, b.nick, `Hey ${session.nick}, welcome to ${normChan}!`);
    }, 2500);
  }
}

server.listen(PORT, () => {
  console.log(`FUN Talk Web IRC Gateway running at http://localhost:${PORT}`);
});
