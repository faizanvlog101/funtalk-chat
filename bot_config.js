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

  // --- Bot Presence Settings (50+ users in room) ---
  presence: {
    targetOnlineBots: 54,
    minBotsOnline: 50,
    maxBotsOnline: 64,
    initialOnlineCount: 52
  },

  // --- Active Chatting Pool Dynamics ---
  // 6-10 chatters active on main; chatters rotate naturally between chatting and going quiet
  activeChattingPool: {
    minActiveSpeakers: 6,
    maxActiveSpeakers: 10,
    maxMessagesBeforeQuiet: {
      min: 2,
      max: 4
    },
    rotationCheckIntervalSeconds: 20
  },

  // --- Timing Settings ---
  timing: {
    // Slower, comfortable conversation pace between spontaneous messages
    channelChatterInterval: {
      minSeconds: 10,
      maxSeconds: 22
    },

    // Realistic human typing simulation delay
    replyDelay: {
      minMs: 1400,
      maxMs: 3200,
      charsPerSecond: 28
    },

    // Multi-bot conversation / topic interval
    interBotDialogueInterval: {
      minSeconds: 25,
      maxSeconds: 50
    },

    // Frequent, lively join / part activity in the room (seconds)
    // Runs regularly so user sees continuous joins and parts
    joinLeaveInterval: {
      minSeconds: 7,
      maxSeconds: 18
    },

    // How long a departed bot stays away before rejoining (seconds)
    rejoinDelay: {
      minSeconds: 8,
      maxSeconds: 22
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
