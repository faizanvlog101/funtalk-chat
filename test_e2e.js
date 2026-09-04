// test_e2e.js - End-to-end test against server.js
const ioClient = require('socket.io-client');
const http = require('http');

console.log('>>> Starting End-to-End Test for Mibbit WebChat...');

// Connect client to server at port 3000
const socket = ioClient('http://localhost:3000', { reconnection: false });

let joinedReceived = false;
let namesReceived = false;
let pmReplied = false;
let channelMessageSeen = false;

const config = require('./bot_config');
const rawChan = (config.server && config.server.channel ? config.server.channel : '#lobby').trim();
const targetChan = (rawChan.startsWith('#') ? rawChan : '#' + rawChan).toLowerCase();

socket.on('connect', () => {
  console.log('1. Connected to Socket.IO server at port 3000');

  // Request connection
  socket.emit('connect_irc', {
    nick: 'TestTester'
  });
});

socket.on('init_config', (data) => {
  console.log('2. Received init_config, available bots:', data.availableBots.length);
});

socket.on('irc_connected', (data) => {
  console.log('3. Received irc_connected:', data);
  joinedReceived = true;
});

socket.on('irc_names', (data) => {
  console.log(`4. Received irc_names for ${data.channel}: ${data.users.length} users`);
  const botNames = data.users.filter(u => u.bot).map(u => u.nick);
  console.log('   Bots in channel:', botNames.join(', '));
  namesReceived = true;

  // Send a greeting in channel
  setTimeout(() => {
    console.log(`5. Sending channel message to ${targetChan}: "Hello everyone, how is it going?"`);
    socket.emit('send_message', {
      channel: targetChan,
      text: 'Hello everyone, how is it going?'
    });
  }, 1000);

  // Send a PM to an online bot
  const targetBot = botNames[0] || 'Hamza_99';
  setTimeout(() => {
    console.log(`6. Sending PM to ${targetBot}: "hey, how are you?"`);
    socket.emit('send_pm', {
      to: targetBot,
      text: 'hey, how are you?'
    });
  }, 2000);
});

socket.on('irc_message', (data) => {
  console.log(`7. [Channel ${data.channel}] <${data.nick}>: ${data.text}`);
  if (data.isBot) {
    console.log('   => Detected Bot response in channel!');
    channelMessageSeen = true;
  }
});

socket.on('irc_pm_sent', (data) => {
  console.log(`8. Echo of PM sent to ${data.to}: "${data.text}"`);
});

socket.on('irc_pm', (data) => {
  console.log(`9. Received PM from ${data.from}: "${data.text}" (isBot: ${data.isBot})`);
  pmReplied = true;
});

let joinEventSeen = false;
let partEventSeen = false;

socket.on('irc_join', (data) => {
  console.log(`   => [JOIN Event] ${data.nick} has joined ${data.channel}`);
  joinEventSeen = true;
});

socket.on('irc_part', (data) => {
  console.log(`   => [PART Event] ${data.nick} has left ${data.channel} (${data.message || ''})`);
  partEventSeen = true;
});

// Run for 12 seconds to observe bot responses, PMs, etc.
setTimeout(() => {
  console.log('\n--- Test Summary ---');
  console.log('Joined Received:', joinedReceived);
  console.log('Names with Bots Received:', namesReceived);
  console.log('PM Reply from Bot Received:', pmReplied);
  console.log('Channel Bot Activity:', channelMessageSeen);

  if (joinedReceived && namesReceived && pmReplied) {
    console.log('\n>>> ALL CORE TESTS PASSED! <<<');
    socket.disconnect();
    process.exit(0);
  } else {
    console.error('\n>>> TEST FAILED: Missing expected events <<<');
    socket.disconnect();
    process.exit(1);
  }
}, 16000);
