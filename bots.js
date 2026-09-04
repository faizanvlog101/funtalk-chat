// bots.js - Virtual Bot Simulation Engine for FUN Talk
// Strictly bound to whatever channel is configured in bot_config.js
// 50+ users, 50/50 female & male presence, girly vs boyish Roman Urdu chat, and clean frequent joins/parts

const config = require('./bot_config');
const botNicks = require('./bot_nicks');
const dialogs = require('./bot_dialogs');

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => (arr && arr.length ? arr[rand(0, arr.length - 1)] : '');

class BotEngine {
  constructor() {
    this.io = null;
    this.channels = new Set();
    this.state = {}; // nick -> bot data
    this.lastSpeaker = null;
    this.userNick = null;
    this.timers = [];

    // Active speakers pool: Map of nick -> { messageCount, maxMessages, addedAt }
    // Manages 5-8 chatters (mixed female & male) actively speaking on main
    this.activeSpeakers = new Map();

    // Anti-repetition tracking: keeps recent lines across the channel so bots never repeat dialogs
    this.recentLines = [];
    this.maxRecentLines = 30;
  }

  // Get the single configured channel (e.g. #lobby, #funtalk, #pakistan)
  getDefaultChannel() {
    if (config && config.server && config.server.channel) {
      const c = String(config.server.channel).trim();
      if (c) {
        return (c.startsWith('#') ? c : '#' + c).toLowerCase();
      }
    }
    if (this.channels && this.channels.size > 0) {
      return Array.from(this.channels)[0];
    }
    return '#lobby';
  }

  init(defaultChannel, io) {
    this.io = io;
    const targetChan = (defaultChannel || this.getDefaultChannel()).trim();
    const normalized = (targetChan.startsWith('#') ? targetChan : '#' + targetChan).toLowerCase();

    // Clear any existing timers
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];

    // STRICTLY bound to the configured channel only!
    this.channels = new Set([normalized]);
    this.state = {};
    this.activeSpeakers.clear();

    // Load authentic roster (317 diverse Pakistani local, NRP, handles)
    botNicks.forEach((b) => {
      this.state[b.nick] = {
        nick: b.nick,
        style: b.style || 'friendly',
        gender: b.gender || 'f', // 'f' or 'm'
        prefix: b.prefix || '',
        online: false,
        channels: new Set([normalized])
      };
    });

    const initialTarget = Math.min(
      config.presence.initialOnlineCount || 52,
      Object.keys(this.state).length
    );

    // Ensure 50% females and 50% males start online
    const females = Object.keys(this.state).filter(n => this.state[n].gender === 'f');
    const males = Object.keys(this.state).filter(n => this.state[n].gender === 'm');
    const targetF = Math.floor(initialTarget / 2);
    const targetM = initialTarget - targetF;

    females.slice(0, targetF).forEach(n => { this.state[n].online = true; });
    males.slice(0, targetM).forEach(n => { this.state[n].online = true; });

    // Populate initial active chatting pool (6-10 speakers)
    this.replenishActiveSpeakers(normalized);

    // Start lively autonomous scheduler loops
    this.scheduleChatter();
    this.scheduleSpeakerRotation();
    this.scheduleJoinLeave();
    this.scheduleInterBotChat();

    // Early join demonstration so web user sees joins right away in the configured channel
    setTimeout(() => {
      const chan = this.getDefaultChannel();
      const offline = Object.keys(this.state).filter(n => !this.state[n].online);
      if (offline.length) {
        this.setOnline(offline[0], true, chan);
      }
    }, 4000);
  }

  addChannel(channel) {
    // Only lock to the configured channel
    const chan = this.getDefaultChannel();
    this.channels = new Set([chan]);
    Object.values(this.state).forEach(b => {
      b.channels = new Set([chan]);
    });
  }

  emit(ev, payload) {
    if (this.io) {
      this.io.emit(ev, payload);
    }
  }

  allNicks(channel) {
    const chan = (channel || this.getDefaultChannel()).toLowerCase();
    return Object.keys(this.state).filter(n => {
      const b = this.state[n];
      if (!b.online) return false;
      if (chan && !b.channels.has(chan)) return false;
      return true;
    });
  }

  isBot(nick) {
    if (!nick) return false;
    const clean = nick.replace(/^[@+]/, '').toLowerCase();
    return Object.keys(this.state).some(n => n.toLowerCase() === clean);
  }

  getBot(nick) {
    if (!nick) return null;
    const clean = nick.replace(/^[@+]/, '').toLowerCase();
    const foundKey = Object.keys(this.state).find(n => n.toLowerCase() === clean);
    return foundKey ? this.state[foundKey] : null;
  }

  // --- Active Speaker Pool (6-10 people chatting on main, rotating) ---

  replenishActiveSpeakers(channel) {
    const chan = channel ? (channel.startsWith('#') ? channel : '#' + channel).toLowerCase() : this.getDefaultChannel();
    const online = this.allNicks(chan);
    const targetCount = rand(
      config.activeChattingPool.minActiveSpeakers,
      config.activeChattingPool.maxActiveSpeakers
    );

    // Remove any speakers who went offline
    for (const [nick] of this.activeSpeakers) {
      if (!this.state[nick] || !this.state[nick].online) {
        this.activeSpeakers.delete(nick);
      }
    }

    // Add new online bots (balancing females and males)
    const available = online.filter(n => !this.activeSpeakers.has(n));
    while (this.activeSpeakers.size < targetCount && available.length > 0) {
      const idx = rand(0, available.length - 1);
      const chosen = available.splice(idx, 1)[0];
      const maxMsgs = rand(
        config.activeChattingPool.maxMessagesBeforeQuiet.min,
        config.activeChattingPool.maxMessagesBeforeQuiet.max
      );

      this.activeSpeakers.set(chosen, {
        messageCount: 0,
        maxMessages: maxMsgs,
        addedAt: Date.now()
      });
    }
  }

  // Pick a bot from the currently active chatting pool
  pickActiveSpeaker(channel, excludeNick = null) {
    const chan = channel ? (channel.startsWith('#') ? channel : '#' + channel).toLowerCase() : this.getDefaultChannel();
    this.replenishActiveSpeakers(chan);
    let candidates = Array.from(this.activeSpeakers.keys());

    if (excludeNick) {
      candidates = candidates.filter(n => n.toLowerCase() !== excludeNick.toLowerCase());
    }

    if (!candidates.length) {
      return this.randomBotData(chan, excludeNick);
    }

    const chosenNick = pick(candidates);
    const speakerData = this.activeSpeakers.get(chosenNick);

    if (speakerData) {
      speakerData.messageCount++;
      // If speaker reached their message limit, they get quiet and rotate out
      if (speakerData.messageCount >= speakerData.maxMessages) {
        this.activeSpeakers.delete(chosenNick);
        this.replenishActiveSpeakers(chan);
      }
    }

    return this.state[chosenNick];
  }

  // Periodic rotation: 1-2 chatters get quiet, new ones take over
  scheduleSpeakerRotation() {
    const intervalMs = (config.activeChattingPool.rotationCheckIntervalSeconds || 20) * 1000;

    const timer = setTimeout(() => {
      const chan = this.getDefaultChannel();
      const activeList = Array.from(this.activeSpeakers.keys());

      if (activeList.length > config.activeChattingPool.minActiveSpeakers) {
        const toRotateCount = rand(1, 2);
        for (let i = 0; i < toRotateCount; i++) {
          const retiringNick = pick(Array.from(this.activeSpeakers.keys()));
          if (retiringNick) {
            this.activeSpeakers.delete(retiringNick);
          }
        }
      }

      this.replenishActiveSpeakers(chan);
      this.scheduleSpeakerRotation();
    }, intervalMs);

    this.timers.push(timer);
  }

  randomBot(channel, excludeNick = null) {
    const chan = channel ? (channel.startsWith('#') ? channel : '#' + channel).toLowerCase() : this.getDefaultChannel();
    let list = this.allNicks(chan);
    if (excludeNick) {
      list = list.filter(n => n.toLowerCase() !== excludeNick.toLowerCase());
    }
    if (!list.length) return null;
    return pick(list);
  }

  randomBotData(channel, excludeNick = null) {
    const nick = this.randomBot(channel, excludeNick);
    return nick ? this.state[nick] : null;
  }

  getChannelUserList(channel) {
    const chan = channel ? (channel.startsWith('#') ? channel : '#' + channel).toLowerCase() : this.getDefaultChannel();
    return Object.values(this.state)
      .filter(b => b.online && b.channels.has(chan))
      .map(b => ({
        nick: b.nick,
        prefix: b.prefix,
        bot: true // internal routing flag only
      }));
  }

  // Set online / offline (joins & parts WITHOUT parting messages)
  setOnline(nick, online, channel) {
    const bot = this.state[nick];
    if (!bot) return;
    const targetChan = channel ? (channel.startsWith('#') ? channel : '#' + channel).toLowerCase() : this.getDefaultChannel();

    if (bot.online === online) return;
    bot.online = online;

    if (online) {
      bot.channels.add(targetChan);
      this.emit('irc_join', {
        channel: targetChan,
        nick: bot.nick,
        prefix: bot.prefix,
        isBot: true
      });

      // Occasional re-entry greeting (gender-styled)
      if (Math.random() < 0.30) {
        setTimeout(() => {
          if (bot.online) {
            const reGreeting = bot.gender === 'f'
              ? pick(['salam girls and boys! ^^', 'main wapis aa gayi :)', 'reconnected ^^'])
              : pick(['salam bhaiyo', 'wapis aa gaya main', 'reconnected bro']);
            this.say(targetChan, bot.nick, reGreeting);
          }
        }, rand(1500, 3000));
      }
    } else {
      this.activeSpeakers.delete(nick);

      // PART WITHOUT ANY PARTING MESSAGE
      this.emit('irc_part', {
        channel: targetChan,
        nick: bot.nick,
        message: '', // Empty parting message
        isBot: true
      });

      // Schedule spontaneous rejoin maintaining 50+ presence
      const rejoinDelay = rand(
        config.timing.rejoinDelay.minSeconds,
        config.timing.rejoinDelay.maxSeconds
      ) * 1000;

      setTimeout(() => {
        const currentCount = this.allNicks(targetChan).length;
        if (currentCount < config.presence.maxBotsOnline) {
          this.setOnline(nick, true, targetChan);
        }
      }, rejoinDelay);
    }
  }

  // Returns 'morning' (5-11), 'afternoon' (12-16), 'evening' (17-21), 'night' (22-4)
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  // Anti-repetition line selector
  pickFresh(arr) {
    if (!arr || !arr.length) return '';
    const unrecent = arr.filter(line => !this.recentLines.includes(line));
    const pool = unrecent.length > 0 ? unrecent : arr;
    const chosen = pick(pool);
    this.recordRecent(chosen);
    return chosen;
  }

  recordRecent(line) {
    if (!line) return;
    this.recentLines.push(line);
    if (this.recentLines.length > this.maxRecentLines) {
      this.recentLines.shift();
    }
  }

  say(channel, nick, text) {
    const targetChan = channel ? (channel.startsWith('#') ? channel : '#' + channel).toLowerCase() : this.getDefaultChannel();
    if (!targetChan || !nick || !text) return;
    this.lastSpeaker = nick;
    this.recordRecent(text);
    this.emit('irc_message', {
      channel: targetChan,
      nick: nick,
      text: text,
      time: new Date().toISOString(),
      isBot: true
    });
  }

  // Realistic human typing simulation scaled to message length
  sayWithTyping(channel, nick, text, delayExtra = 0) {
    const targetChan = channel ? (channel.startsWith('#') ? channel : '#' + channel).toLowerCase() : this.getDefaultChannel();
    if (!nick || !text) return;

    const charsPerSec = config.timing.replyDelay.charsPerSecond || 28;
    const baseTypingMs = (text.length / charsPerSec) * 1000;
    const typingTime = Math.min(
      Math.max(baseTypingMs, config.timing.replyDelay.minMs),
      config.timing.replyDelay.maxMs
    ) + delayExtra;

    this.emit('bot_typing', { channel: targetChan, nick, typing: true });

    setTimeout(() => {
      this.emit('bot_typing', { channel: targetChan, nick, typing: false });
      this.say(targetChan, nick, text);
    }, typingTime);
  }

  humanize(text, name, targetNick) {
    if (!text) return '';
    let res = text.replace(/{name}/g, name || 'there');
    res = res.replace(/{other}/g, () => {
      const other = this.randomBot();
      return other || 'someone';
    });
    res = res.replace(/{botNick}/g, targetNick || 'I');

    // Occasional typo simulation with correction
    if (Math.random() < config.dynamics.typoCorrectionChance) {
      const t = pick(dialogs.typoCorrections);
      if (t && res.includes(t.right)) {
        res = res.replace(t.right, t.wrong) + ' *' + t.right;
      }
    }
    return res;
  }

  // Continuous channel chatter driven by active chatters on configured channel
  scheduleChatter() {
    const minSec = config.timing.channelChatterInterval.minSeconds;
    const maxSec = config.timing.channelChatterInterval.maxSeconds;
    const intervalMs = rand(minSec, maxSec) * 1000;

    const timer = setTimeout(() => {
      const chan = this.getDefaultChannel();
      const b = this.pickActiveSpeaker(chan);

      if (b) {
        const genderKey = b.gender === 'f' ? 'female' : 'male';

        // Chance of double-message combo
        if (Math.random() < config.dynamics.doubleMessageChance) {
          const comboPool = dialogs.doubleMessages[genderKey] || dialogs.doubleMessages.female;
          const combo = pick(comboPool);
          if (combo && !this.recentLines.includes(combo.first)) {
            this.recordRecent(combo.first);
            this.sayWithTyping(chan, b.nick, combo.first);
            setTimeout(() => {
              if (b.online) {
                this.sayWithTyping(chan, b.nick, combo.second);
              }
            }, rand(1400, 2600));
          }
        } else {
          // Gender-specific small talk mixed with dynamic Time-of-Day contextual chatter
          const timeSlot = this.getTimeOfDay();
          let pool = (dialogs.smallTalk[genderKey] || dialogs.smallTalk.female).slice();
          if (dialogs.timeOfDaySmallTalk && dialogs.timeOfDaySmallTalk[timeSlot]) {
            const timePool = dialogs.timeOfDaySmallTalk[timeSlot][genderKey] || [];
            pool = pool.concat(timePool);
          }
          const freshLine = this.pickFresh(pool);
          const line = this.humanize(freshLine, this.userNick, b.nick);
          this.sayWithTyping(chan, b.nick, line);

          // Multi-bot burst
          if (Math.random() < config.dynamics.burstChance) {
            this.triggerBurst(chan, b.nick);
          }
        }
      }

      this.scheduleChatter();
    }, intervalMs);

    this.timers.push(timer);
  }

  // Multi-bot burst with gender-specific reactions
  triggerBurst(channel, triggerNick) {
    const chan = channel ? (channel.startsWith('#') ? channel : '#' + channel).toLowerCase() : this.getDefaultChannel();
    const burstCount = rand(1, Math.min(2, config.dynamics.maxConcurrentChatters));
    let accumulatedDelay = rand(
      config.dynamics.burstReplySpacingMs.minMs,
      config.dynamics.burstReplySpacingMs.maxMs
    );

    for (let i = 0; i < burstCount; i++) {
      const responder = this.pickActiveSpeaker(chan, triggerNick);
      if (!responder) break;

      const genderKey = responder.gender === 'f' ? 'female' : 'male';
      const pool = (dialogs.quickReactions[genderKey] || dialogs.quickReactions.female).concat(
        dialogs.replies.generic[genderKey] || dialogs.replies.generic.female
      );
      const reply = this.pickFresh(pool);

      setTimeout(() => {
        if (responder.online) {
          this.say(chan, responder.nick, reply);
        }
      }, accumulatedDelay);

      accumulatedDelay += rand(1800, 3200);
    }
  }

  // Frequent join & part scheduling on configured channel WITHOUT parting messages
  scheduleJoinLeave() {
    const minSec = config.timing.joinLeaveInterval.minSeconds;
    const maxSec = config.timing.joinLeaveInterval.maxSeconds;
    const intervalMs = rand(minSec, maxSec) * 1000;

    const timer = setTimeout(() => {
      const chan = this.getDefaultChannel();
      const onlineBots = this.allNicks(chan);
      const offlineBots = Object.keys(this.state).filter(n => !this.state[n].online);

      // Consistently cycle chatters to create active lobby feeling
      const shouldPart = (onlineBots.length > config.presence.minBotsOnline) &&
                         (onlineBots.length >= config.presence.targetOnlineBots || Math.random() < 0.5);

      if (shouldPart) {
        const eligible = onlineBots.filter(n => !this.activeSpeakers.has(n));
        const nickToLeave = pick(eligible.length ? eligible : onlineBots);
        if (nickToLeave) {
          this.setOnline(nickToLeave, false, chan);
        }
      } else if (offlineBots.length > 0 && onlineBots.length < config.presence.maxBotsOnline) {
        const nickToJoin = pick(offlineBots);
        if (nickToJoin) {
          this.setOnline(nickToJoin, true, chan);
        }
      }

      this.scheduleJoinLeave();
    }, intervalMs);

    this.timers.push(timer);
  }

  // Inter-bot dynamic dialogues on configured channel (broad topics, any online pair)
  scheduleInterBotChat() {
    const minSec = config.timing.interBotDialogueInterval.minSeconds;
    const maxSec = config.timing.interBotDialogueInterval.maxSeconds;
    const intervalMs = rand(minSec, maxSec) * 1000;

    const timer = setTimeout(() => {
      const chan = this.getDefaultChannel();
      const onlineBots = this.allNicks(chan);

      if (onlineBots.length >= 2) {
        // Use dynamic conversation topics
        if (dialogs.dynamicConversations && dialogs.dynamicConversations.length > 0) {
          const conv = pick(dialogs.dynamicConversations);
          const a = this.pickActiveSpeaker(chan);
          const b = this.pickActiveSpeaker(chan, a ? a.nick : null);

          if (a && b) {
            const starterLine = this.pickFresh(conv.starterLines);
            const respLine = this.pickFresh(conv.responderLines);

            this.sayWithTyping(chan, a.nick, starterLine);
            setTimeout(() => {
              if (b.online) {
                // Natural address or response
                const prefix = Math.random() < 0.4 ? `${a.nick}: ` : '';
                this.sayWithTyping(chan, b.nick, `${prefix}${respLine}`);
              }
            }, rand(2600, 5200));
          }
        } else {
          // Fallback
          const a = this.pickActiveSpeaker(chan);
          let b = this.pickActiveSpeaker(chan, a ? a.nick : null);
          if (a && b) {
            const genderA = a.gender === 'f' ? 'female' : 'male';
            const genderB = b.gender === 'f' ? 'female' : 'male';
            const lineA = this.pickFresh(dialogs.smallTalk[genderA] || dialogs.smallTalk.female);
            const lineB = this.pickFresh(dialogs.replies.generic[genderB] || dialogs.replies.generic.male);

            this.sayWithTyping(chan, a.nick, lineA);
            setTimeout(() => {
              this.sayWithTyping(chan, b.nick, `${a.nick}: ${lineB}`);
            }, rand(2500, 4800));
          }
        }
      }

      this.scheduleInterBotChat();
    }, intervalMs);

    this.timers.push(timer);
  }

  // Handle user speaking in channel
  onUserMessage(channel, nick, text) {
    this.userNick = nick;
    const lower = text.toLowerCase();
    const chan = channel ? (channel.startsWith('#') ? channel : '#' + channel).toLowerCase() : this.getDefaultChannel();

    // 1. Direct mention
    for (const botNick of Object.keys(this.state)) {
      const pattern = new RegExp(`(^|\\s)@?${botNick}[:,-]?(\\s|$)`, 'i');
      if (pattern.test(text)) {
        const bot = this.state[botNick];
        if (bot && bot.online && Math.random() < config.reactions.onDirectMention) {
          const genderKey = bot.gender === 'f' ? 'female' : 'male';
          let reply = '';
          if (lower.includes('?')) {
            reply = this.pickFresh(dialogs.replies.question[genderKey] || dialogs.replies.question.female);
          } else if (/\b(salam|aoa|hi|hello|hey|yo|kaisay)\b/.test(lower)) {
            reply = this.pickFresh(dialogs.greetings[genderKey] || dialogs.greetings.female);
          } else {
            reply = this.pickFresh(dialogs.replies.targeted[genderKey] || dialogs.replies.targeted.female);
          }
          this.sayWithTyping(chan, bot.nick, this.humanize(reply, nick, bot.nick), rand(400, 1200));
          return;
        }
      }
    }

    // 2. Greetings
    if (/\b(salam|aoa|assalam|hi|hello|hey|yo|sup|greetings|wb)\b/.test(lower) && text.length < 35) {
      if (Math.random() < config.reactions.onGreeting) {
        const b = this.pickActiveSpeaker(chan);
        if (b) {
          const genderKey = b.gender === 'f' ? 'female' : 'male';
          const pool = dialogs.greetings[genderKey] || dialogs.greetings.female;
          this.sayWithTyping(chan, b.nick, this.humanize(this.pickFresh(pool), nick, b.nick), rand(400, 1400));

          // 2nd chatter chimes in
          if (Math.random() < config.dynamics.burstChance) {
            setTimeout(() => {
              const b2 = this.pickActiveSpeaker(chan, b.nick);
              if (b2) {
                const b2Greeting = b2.gender === 'f'
                  ? this.pickFresh(['walekum assalam ' + nick + '! ^^', 'salam jani :)', 'welcome! <3'])
                  : this.pickFresh(['walekum assalam ' + nick + ' bhai', 'salam bro :)', 'welcome jani!']);
                this.say(chan, b2.nick, b2Greeting);
              }
            }, rand(1000, 2000));
          }
        }
      }
      return;
    }

    // 3. Keyword matching (chai, biryani, match, code, khana, weather, etc.)
    for (const [kw, genderReplies] of Object.entries(dialogs.replies.keyword)) {
      if (lower.includes(kw) && Math.random() < config.reactions.onKeyword) {
        const b = this.pickActiveSpeaker(chan);
        if (b) {
          const genderKey = b.gender === 'f' ? 'female' : 'male';
          const replies = genderReplies[genderKey] || genderReplies.female;
          this.sayWithTyping(chan, b.nick, this.humanize(this.pickFresh(replies), nick, b.nick), rand(600, 1800));
          return;
        }
      }
    }

    // 4. Questions in channel
    if (text.includes('?') && Math.random() < config.reactions.onQuestion) {
      const b = this.pickActiveSpeaker(chan);
      if (b) {
        const genderKey = b.gender === 'f' ? 'female' : 'male';
        const replies = dialogs.replies.question[genderKey] || dialogs.replies.question.female;
        this.sayWithTyping(chan, b.nick, this.humanize(this.pickFresh(replies), nick, b.nick), rand(800, 2000));
        return;
      }
    }

    // 5. General chatter reaction
    if (Math.random() < config.reactions.onGeneralChat) {
      const b = this.pickActiveSpeaker(chan);
      if (b) {
        const genderKey = b.gender === 'f' ? 'female' : 'male';
        const replies = dialogs.replies.generic[genderKey] || dialogs.replies.generic.female;
        this.sayWithTyping(chan, b.nick, this.humanize(this.pickFresh(replies), nick, b.nick), rand(1000, 2200));
      }
    }
  }

  // Handle Private Messages
  onPM(socket, botNick, userNick, text) {
    const bot = this.getBot(botNick);
    if (!bot) return;

    if (!bot.online) {
      const awayMsg = bot.gender === 'f'
        ? `[Away] Salam ${userNick}, main abhi thori busy hoon, thori der mein reply karti hoon! ^^`
        : `[Away] Salam ${userNick}, main abhi thora busy hoon, thori der mein reply karta hoon bhai!`;
      setTimeout(() => {
        socket.emit('irc_pm', {
          from: bot.nick,
          target: userNick,
          text: awayMsg,
          time: new Date().toISOString(),
          isBot: true
        });
      }, 600);
      return;
    }

    const lower = text.toLowerCase();
    const genderKey = bot.gender === 'f' ? 'female' : 'male';
    const pmPools = dialogs.pmReplies[genderKey] || dialogs.pmReplies.female;
    let replyPool = pmPools.generic;

    if (/\b(salam|aoa|hi|hello|hey|yo|sup)\b/.test(lower)) {
      replyPool = pmPools.hi;
    } else if (lower.includes('how are you') || lower.includes('kaisay') || lower.includes('kaise') || lower.includes('haal')) {
      replyPool = pmPools['how are you'];
    } else if (lower.includes('who are you') || lower.includes('kaun ho') || lower.includes('kon ho')) {
      replyPool = pmPools.who;
    } else if (lower.includes('bot') || lower.includes('ai') || lower.includes('robot')) {
      replyPool = pmPools.bot;
    } else if (lower.includes('help') || lower.includes('madad')) {
      replyPool = pmPools.help;
    } else if (lower.includes('irc') || lower.includes('funtalk') || lower.includes('fun talk')) {
      replyPool = pmPools.irc;
    } else if (/\b(bye|cya|later|gtg|allah hafiz|khuda hafiz)\b/.test(lower)) {
      replyPool = pmPools.bye;
    }

    const chosen = pick(replyPool);
    const replyText = this.humanize(chosen, userNick, bot.nick);
    const charsPerSec = config.timing.replyDelay.charsPerSecond || 28;
    const delay = Math.min(
      Math.max((replyText.length / charsPerSec) * 1000, 800),
      2200
    );

    setTimeout(() => {
      socket.emit('irc_pm', {
        from: bot.nick,
        target: userNick,
        text: replyText,
        time: new Date().toISOString(),
        isBot: true
      });
    }, delay);
  }
}

module.exports = new BotEngine();
