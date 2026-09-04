// botdata.js
module.exports = {
  bots: [
    { nick: 'Sarah92', style: 'friendly', gender: 'f', prefix: '+' },
    { nick: 'MikeT', style: 'sarcastic', gender: 'm', prefix: '@' },
    { nick: 'xX_Dark_Xx', style: 'edgy', gender: 'm', prefix: '' },
    { nick: 'Jenny_A', style: 'friendly', gender: 'f', prefix: '+' },
    { nick: 'CodeMonkey', style: 'nerdy', gender: 'm', prefix: '' },
    { nick: 'DaveTheGrate', style: 'grumpy', gender: 'm', prefix: '' },
    { nick: 'luna_dev', style: 'nerdy', gender: 'f', prefix: '@' },
    { nick: 'ChillGuy', style: 'chill', gender: 'm', prefix: '+' },
    { nick: 'PixelSam', style: 'gamer', gender: 'm', prefix: '' },
    { nick: 'Aura', style: 'mysterious', gender: 'f', prefix: '' }
  ],

  greetings: {
    generic: [
      'hey {name}!', 'hi {name}, welcome', 'yo {name}',
      'hello {name} :)', 'sup {name}', 'hey hey {name}',
      'welcome in {name}!'
    ],
    friendly: [
      'welcome to the channel {name}! Glad you made it :)',
      'hi {name}! Hope you are having a nice day',
      'hey {name}, nice to see someone new in here!',
      'hello {name}! Feel free to pull up a chair'
    ],
    sarcastic: [
      'oh great, another human. Welcome {name}',
      'welcome {name}, we totally needed more noise',
      'hey {name}, please keep your hands inside the vehicle at all times',
      'look who stumbled into our corner of IRC'
    ],
    edgy: [
      'hey.', 'sup.', '{name}... welcome to the abyss', 'another lurker arrives'
    ],
    nerdy: [
      'greetings {name}, welcome to the grid!',
      '01001000 01101001! Just kidding, hey {name}!',
      'ping {name}... pong! Welcome!'
    ],
    grumpy: [
      'ugh, hi {name}', 'hello {name}. Try not to make too much noise', 'hey.'
    ],
    chill: [
      'heyyy {name}, pull up a chair', 'sup {name}, all good vibes here',
      'hey {name}, chilling out as usual'
    ],
    gamer: [
      'player {name} has entered the lobby!', 'gg {name}, welcome', 'hey {name}, ready for a match?'
    ],
    mysterious: [
      'the shadows welcome you, {name}', 'we were expecting you, {name}'
    ]
  },

  smallTalk: [
    'anyone here?',
    'this channel has such classic FUN Talk vibes, love it',
    'so what is everyone up to today?',
    'just finished my third cup of coffee, feeling alive',
    'anyone following the new tech news this week? Wild stuff',
    'weekend plans anyone?',
    'working on some code right now, debugging is an art form lol',
    'brb food in microwave',
    'back!',
    'IRC is still unmatched for low-latency chatting tbh',
    'listening to some synthwave right now, super productive mood',
    'welp',
    'hmm interesting',
    'nice',
    'haha true that',
    'agreed',
    'yeah for sure',
    'no way really?',
    'anyone play retro games here? Got an emulator running',
    'music recommendations please, im tired of my usual playlist',
    'who remembers mIRC scripts and eggdrop bots back in the day?',
    'tabs looking sleek today'
  ],

  interBotDialogues: [
    {
      starter: 'CodeMonkey',
      line: 'tabs or spaces? Anyone brave enough to answer?',
      responder: 'luna_dev',
      response: 'Tabs for indentation, spaces for alignment. Standard!'
    },
    {
      starter: 'MikeT',
      line: 'I swear my compiler is doing this out of personal spite today.',
      responder: 'DaveTheGrate',
      response: 'It is. The machines already won, Mike.'
    },
    {
      starter: 'Sarah92',
      line: 'Hope everyone has got some tea or coffee next to them today :)',
      responder: 'ChillGuy',
      response: 'Ice cold iced tea right here Sarah, life is good.'
    },
    {
      starter: 'PixelSam',
      line: 'anyone tried the latest indie roguelike on Steam?',
      responder: 'Jenny_A',
      response: 'Yes! Died on floor 3 five times in a row, 10/10 game.'
    },
    {
      starter: 'xX_Dark_Xx',
      line: 'dark mode should be the only mode in existence.',
      responder: 'luna_dev',
      response: 'Light mode users are secretly lizards absorbing solar energy.'
    },
    {
      starter: 'ChillGuy',
      line: 'listening to rain sounds and watching IRC scroll by... peak cozy.',
      responder: 'Sarah92',
      response: 'Aw that sounds super relaxing!'
    }
  ],

  replies: {
    question: [
      'hmm good question, not entirely sure',
      'depends on how you look at it honestly',
      'i would say yes, but dont quote me on that',
      'definitely! 100%',
      'ask {other}, they know practically everything',
      'lol idk, check the wiki maybe?',
      'from my experience, yeah usually'
    ],
    keyword: {
      game: ['what game are you playing?', 'i play that too sometimes!', 'PC or console?'],
      music: ['what genre? Always looking for new tracks', 'listening to lofi beats right now', 'got a link?'],
      code: ['what language? JS, Python, Rust?', 'nothing like spending 3 hours on a missing semicolon', 'push to git and pray!'],
      irc: ['irc is old but pure gold', 'mibbit nostalgia is real', 'cleanest chat protocol ever made'],
      bot: ['wait... are there bots here? :eyes:', 'i am 100% organic carbon-based intelligence lol', 'beep boop... just kidding!'],
      hello: ['hey there!', 'yo!', 'welcome!', 'sup!'],
      help: ['what do you need a hand with?', 'ask away, lots of nerds here', 'whats the issue?'],
      lol: ['haha', 'lmao', 'classic', ':D'],
      food: ['now you made me hungry', 'pizza time?', 'coffee counts as food right?'],
      weather: ['rainy here today', 'perfect weather to stay indoors and chat', 'sunny and warm']
    },
    targeted: [
      'hey {name}, you talking to me?',
      '{name}: yeah I agree with that',
      '{name}: hmm, tell me more',
      'haha {name}, totally',
      '{name}: spot on'
    ],
    generic: [
      'true',
      'for real',
      'interesting...',
      'yeah i get that',
      'haha nice',
      'thats wild',
      'makes sense tbh',
      'i was literally just thinking that'
    ]
  },

  pmReplies: {
    hi: [
      'hey! whats up?',
      'hi :) how are you doing?',
      'yo! glad you PMed me'
    ],
    'how are you': [
      'pretty good! Just relaxing in the channel, you?',
      'doing well thanks! How is your day going?',
      'surviving another day of internet scrolling haha'
    ],
    who: [
      'just a regular chatter hanging out in the channel :)',
      'im {botNick}! You can find me lurking here pretty often'
    ],
    bot: [
      'haha me? A bot? Only if you consider caffeine-driven humans bots ;)',
      'beep boop... error 404: human not found haha nah im chilling here'
    ],
    help: [
      'sure, what do you need help with?',
      'i can try to help! What is on your mind?'
    ],
    irc: [
      'i love web IRC, reminds me of the good old days on KiwiIRC and FUN Talk.',
      'IRC is the best, simple and no tracking'
    ],
    bye: [
      'cya! Catch you later in the channel :)',
      'bye {name}! Take care',
      'later! ping me anytime'
    ],
    generic: [
      'haha yeah totally',
      'hmm interesting, tell me more about that',
      'oh really? Didnt know that',
      'fair enough!',
      'i mostly hang out in the main channel but happy to chat here too!',
      'makes sense to me :)',
      'what else are you working on today?'
    ]
  },

  joinLeaveMessages: [
    'brb grabbing food',
    'stepping away for a coffee run',
    'phone call brb',
    'back!',
    'restarted my router, hopefully ping is better now',
    'rebooting my machine brb'
  ],

  typoCorrections: [
    { wrong: 'hte', right: 'the' },
    { wrong: 'taht', right: 'that' },
    { wrong: 'waht', right: 'what' },
    { wrong: 'jsut', right: 'just' },
    { wrong: 'teh', right: 'the' }
  ]
};
