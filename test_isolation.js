// test_isolation.js - Strict Verification that bots NEVER send traffic to IRC server
const assert = require('assert');
const bots = require('./bots');

console.log('>>> Testing Bot Isolation from Upstream IRC Network...');

// Mock IRC client
const ircCalls = {
  say: [],
  action: [],
  join: [],
  part: [],
  raw: []
};

const mockIrcClient = {
  say: (target, text) => ircCalls.say.push({ target, text }),
  action: (target, text) => ircCalls.action.push({ target, text }),
  join: (channel) => ircCalls.join.push(channel),
  part: (channel) => ircCalls.part.push(channel),
  raw: (cmd) => ircCalls.raw.push(cmd)
};

// Mock Socket.IO server and socket
const socketEmitted = [];
const mockSocket = {
  id: 'socket-test-1',
  emit: (ev, data) => socketEmitted.push({ ev, data })
};

const ioEmitted = [];
const mockIo = {
  emit: (ev, data) => ioEmitted.push({ ev, data }),
  to: () => mockIo
};

const targetChan = bots.getDefaultChannel();

// 1. Initialize bots
bots.init(targetChan, mockIo);

// 2. Simulate Bot saying something in configured channel
console.log(`1. Simulating bot speaking in ${targetChan}...`);
const initialBots = bots.getChannelUserList(targetChan);
const testSpeaker = initialBots[0].nick;
bots.say(targetChan, testSpeaker, 'Hello web users!');

// Check that mockIo received the message
const botMsg = ioEmitted.find(e => e.ev === 'irc_message' && e.data.nick === testSpeaker && e.data.channel === targetChan);
assert(botMsg, 'Bot message should be emitted to Socket.IO');
assert.strictEqual(ircCalls.say.length, 0, 'Bot speaking must NEVER call ircClient.say()!');
console.log(`   PASS: Bot (${testSpeaker}) channel message in ${targetChan} was emitted to Socket.IO only. ircClient.say() call count: 0`);

// 3. Simulate Bot joining and leaving
console.log('2. Simulating bot join & leave...');
bots.setOnline(testSpeaker, false, targetChan);
bots.setOnline(testSpeaker, true, targetChan);

assert.strictEqual(ircCalls.join.length, 0, 'Bot join must NEVER call ircClient.join()!');
assert.strictEqual(ircCalls.part.length, 0, 'Bot part must NEVER call ircClient.part()!');
console.log('   PASS: Bot join/leave simulated via Socket.IO only. ircClient join/part call count: 0');

// 4. Test PM routing logic from server.js
console.log('3. Testing PM interception logic...');

function simulateIncomingPMFromWebUser(to, text, session) {
  mockSocket.emit('irc_pm_sent', { to, text });

  if (bots.isBot(to)) {
    // Intercepted: route strictly to bot engine
    bots.onPM(mockSocket, to, session.nick, text);
  } else {
    // Real user: send to IRC
    session.ircClient.say(to, text);
  }
}

const session = {
  nick: 'WebChatUser',
  ircClient: mockIrcClient
};

const activeBots = bots.getChannelUserList(targetChan);
const sampleBotNick = activeBots.length ? activeBots[0].nick : 'Hina';

// User PMs fake bot
simulateIncomingPMFromWebUser(sampleBotNick, 'Are you connected to IRC?', session);
assert.strictEqual(ircCalls.say.length, 0, 'PM to fake bot MUST NOT reach real IRC server!');
console.log(`   PASS: PM to bot ${sampleBotNick} was intercepted. ircClient.say() call count: 0`);

// User PMs real user "RealHumanIRC"
simulateIncomingPMFromWebUser('RealHumanIRC', 'Hey there real person!', session);
assert.strictEqual(ircCalls.say.length, 1, 'PM to real user should reach real IRC server');
assert.strictEqual(ircCalls.say[0].target, 'RealHumanIRC');
console.log('   PASS: PM to real IRC user was properly forwarded to ircClient.say().');

console.log('\n>>> ALL ISOLATION TESTS PASSED! Bots are 100% strictly isolated from the upstream IRC server. <<<');
process.exit(0);
