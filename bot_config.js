// bot_config.js - Configuration for FUN Talk Chat
module.exports = {
  // --- Server Connection Settings (Hardcoded via Config File) ---
  // Works with local demo mode or any real IRC server (e.g. irc.libera.chat, irc.oftc.net)
  // Bots are strictly isolated and displayed on web chat regardless of server chosen!
  server: {
    host: 'irc.libera.chat',
    port: 6667,
    ssl: false,
    channel: '#cric',
    networkName: 'FUN Talk Network'
  },

  // --- Bot Presence Settings (50+ to 75+ active users in room from pool of 400) ---
  presence: {
    targetOnlineBots: 65,
    minBotsOnline: 55,
    maxBotsOnline: 78,
    initialOnlineCount: 62
  },

  // --- Active Chatting Pool Dynamics ---
  // 5-8 chatters active on main at any given time; chatters rotate naturally
  activeChattingPool: {
    minActiveSpeakers: 5,
    maxActiveSpeakers: 8,
    maxMessagesBeforeQuiet: {
      min: 2,
      max: 4
    },
    rotationCheckIntervalSeconds: 30
  },

  // --- Timing Settings ---
  timing: {
    // Slower, relaxed conversation pace between spontaneous messages (18-38 seconds)
    channelChatterInterval: {
      minSeconds: 18,
      maxSeconds: 38
    },

    // Realistic human typing simulation delay
    replyDelay: {
      minMs: 1800,
      maxMs: 4000,
      charsPerSecond: 24
    },

    // Multi-bot conversation / topic interval (45-90 seconds)
    interBotDialogueInterval: {
      minSeconds: 45,
      maxSeconds: 90
    },

    // Increased join / part activity in the room (every 4-10 seconds)
    joinLeaveInterval: {
      minSeconds: 4,
      maxSeconds: 10
    },

    // How long a departed bot stays away before rejoining (seconds)
    rejoinDelay: {
      minSeconds: 5,
      maxSeconds: 15
    }
  },

  // --- Chatter Dynamics ---
  dynamics: {
    burstChance: 0.35,
    maxConcurrentChatters: 2,
    burstReplySpacingMs: {
      minMs: 2500,
      maxMs: 5000
    },
    doubleMessageChance: 0.18,
    typoCorrectionChance: 0.08
  },

  // --- Reaction Probabilities to Web User ---
  reactions: {
    onDirectMention: 0.95,
    onGreeting: 0.85,
    onQuestion: 0.70,
    onKeyword: 0.75,
    onGeneralChat: 0.40,
    onPrivateMessage: 1.0
  }
};
