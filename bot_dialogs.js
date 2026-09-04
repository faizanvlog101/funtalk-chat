// bot_dialogs.js - 75% Roman Urdu + 25% English Dialogues with Gender-Specific Styles
// Females speak in authentic girly style ("kar rahi hoon", "ja rahi hoon", "^^", ":)", "<3")
// Males speak in authentic boyish style ("kar raha hoon", "ja raha hoon", "bhai", "bro", "jani")

module.exports = {
  // --- Greetings ---
  greetings: {
    female: [
      'salam everyone! kaisay hain sab? ^^',
      'aoa {name}! welcome, kaisa chal raha hai sab? :)',
      'hey {name}! bohot acha laga aap ko dekh kar yahan <3',
      'salam {name}! chai bana rahi thi, aap bhi piyo ge?',
      'walekum assalam {name}! khush amdeed!',
      'salam {name} jani! kafi time baad dekha aap ko ^^',
      'hey {name}! welcome in, sab theek thak? :)'
    ],
    male: [
      'salam jani! kya scene hai {name}?',
      'aoa {name} bhai! welcome to the room',
      'sup {name}! sab theek thak bro?',
      'salam {name}, aao baitho chai peete hain',
      'walekum assalam {name} bhai, kaisay ho?',
      'lo bhai {name} bhi aa gaya, welcome!',
      'salam {name} bro, kya chal raha hai?'
    ],
    generic: [
      'salam {name}! kaisay ho?',
      'aoa {name}, welcome to the room!',
      'hey {name}! kya haal chaal?',
      'walekum assalam {name}!'
    ]
  },

  // --- Spontaneous Channel Small Talk ---
  smallTalk: {
    female: [
      'main to chai bana rahi hoon abhi, kis kis ko chahiye? ^^',
      'yaar main shopping karne ja rahi hoon thori der mein :P',
      'bohot thak gayi hoon aaj honestly, pura din kaam mein guzar gaya',
      'haye kitna pyara mausam ho gaya hai bahir <3',
      'meri assignment rehti hai abhi tak, soch soch ke sar dard ho raha hai lol',
      'main to kab se keh rahi thi ke biryani mangwao xD',
      'yeh wala drama kis kis ne dekha hai? main ro pari thi kal raat ko',
      'aaj maine kheer banayi thi pehli baar, bohot tasty bani thi ^^',
      'main to so rahi thi, abhi uthi hoon thori der pehle',
      'girls and boys, koi achi lofi playlist share karo please :)',
      'paratha roll khane ka itna dil kar raha hai na is waqt',
      'meri cat ne enter press kar diya tha lol, itni naughty hai',
      'main abhi thori der mein nikal rahi hoon, friends ke sath hangout hai',
      'sahi baat hai bilkul, main bhi yahi bol rahi thi',
      'aaj ka din bohot acha guzra alhamdulillah :)',
      'online shopping ke chakar mein mera budget hil gaya sara haha',
      'soch rahi hoon kal subha jaldi uthoon gi, dekhte hain kya banta hai :D',
      'dhaaba ki kadak chai peene ka dil kar raha hai bohot',
      'Netflix pe koi achi series suggest karo na koi',
      'weekend itni jaldi khatam ho gaya, bilkul dil nahi kar raha kal kaam karne ka'
    ],
    male: [
      'bhai main to chai peene ja raha hoon dhaabay pe',
      'yaar main gym nikal raha hoon abhi thori der mein',
      'cricket match dekh raha tha bhai, kya choke kiya Pakistan ne lol',
      'CS2 mein ranked match khel raha tha, dimag ghoom gaya pura',
      'bhai petrol phir se mehenga kar diya inhon ne yaar',
      'main to office se wapis aa raha hoon, raste mein traffic bohot zyada tha',
      'bhai biryani mangwa raha hoon, kisi ne khani hai to batao?',
      'mechanical keyboard liya naya, typing sound bohot satisfying hai',
      'yaar kal subha office jana hai lekin neend nahi aa rahi bilkul',
      'bhai weekend pe northern areas ka trip plan kar raha hoon',
      'meri coding mein aik semicolon ki waja se 2 ghante lag gaye haha',
      'light chali gayi thi bhai, shukar hai UPS chal gaya foran',
      'bhai Babar Azam ki batting dekhne wali thi kal ke match mein',
      'gaari ki servicing karwane ja raha hoon kal subha',
      'remote work is a blessing honestly, roz ka traffic bach jata hai',
      'dosto ke sath chai pe baithne ka maza hi alag hota hai bhai',
      'Valorant ka 5-stack lagana hai aaj raat ko, kaun ready hai?',
      'biryani without aloo is just pulao, change my mind bhai lol',
      'bhai aaj ka din bohot thaka dene wala tha',
      'late night chats on web chat just hit different bro'
    ]
  },

  // --- Quick Lively Reactions ---
  quickReactions: {
    female: [
      'haha sahi baat hai bilkul ^^', 'lol yaar xD', 'sach mein??', 'wah kya baat hai :D',
      'areyy wah!', 'same here honestly <3', '100% agreed', 'sahi bol rahi ho',
      'lmao true', 'haha so true ^^'
    ],
    male: [
      'haha sahi baat hai bhai', 'lol yaar', 'sach mein bhai?', 'wah bhai kya baat hai',
      'bilkul sahi keh rahe ho', 'same here bro', '100% agreed jani', 'koi shak nahi',
      'facts yar', 'lmao bhai'
    ]
  },

  // --- Double-Message Combos ---
  doubleMessages: {
    female: [
      { first: 'yaar ruko aik second...', second: 'meri chai ubalne wali thi bach gayi lol' },
      { first: 'aik baat batao sab', second: 'Karachi ki biryani best hai ya Lahore ki? haha' },
      { first: 'main soch rahi thi', second: 'kash weekend 4 din ka hota :P' },
      { first: 'bhai main thak gayi hoon aaj', second: 'bed se uthne ki bhi himmat nahi ho rahi lol' },
      { first: 'wait a minute...', second: 'meri coffee thandi ho gayi baat karte karte :(' }
    ],
    male: [
      { first: 'bhai aik baat batao...', second: 'kal ke match ka kya scene hai?' },
      { first: 'ruko aik second bhai', second: 'light chali gayi thi, ups connect hua hai' },
      { first: 'yaar main soch raha tha', second: 'is weekend pe bahir ka chakar lagayein' },
      { first: 'bhai aik movie dekhi kal', second: 'dimag hil gaya pura, must watch hai' },
      { first: 'wait a sec', second: 'paratha roll wala aa gaya, le kar aata hoon brb' }
    ]
  },

  // --- Multi-turn Dialogues between Bots ---
  interBotDialogues: [
    {
      starter: 'Hina',
      line: 'Chai banayi hai maine sham ki, kis kis ko chahiye? ^^',
      responder: 'Ahmed26',
      response: 'Bhai mere liye aik cup extra kadak doodh patti bana do please!'
    },
    {
      starter: 'Zainab',
      line: 'Main to online shopping kar rahi thi, bohot cute kapray miley <3',
      responder: 'Alina',
      response: 'Haye mujhe bhi link bhejo na, mera bhi shopping ka mood ho raha hai!'
    },
    {
      starter: 'Bilal25',
      line: 'Bhai cricket match dekha kisi ne kal? kya zabardast finish tha!',
      responder: 'Zishan',
      response: 'Haan bhai last over mein to saans ruk gayi thi meri lol'
    },
    {
      starter: 'Guriya',
      line: 'Mausam kitna pyara ho gaya hai bahir, barish shuru hone wali hai :)',
      responder: 'DxbDude',
      response: 'Barish mein pakoray aur chai ka scene banana parega phir to!'
    },
    {
      starter: 'Zara-uk',
      line: 'London mein to freezing cold hai bhai, Pakistan ka kya haal hai?',
      responder: 'Kiran_USA',
      response: 'Yahan to mausam kafi pleasant hai abhi ^^'
    },
    {
      starter: 'papu',
      line: 'Aaj raat ko gaming session lagana hai, kaun kaun online aayega?',
      responder: 'Ashir',
      response: 'Main ready hoon bhai, 11 baje discord pe aao!'
    }
  ],

  // --- Reactions to User Messages ---
  replies: {
    question: {
      female: [
        'hmm acha sawal hai, mere khayal mein to haan bilkul :)',
        'yaar depend karta hai honestly, main to confuse hoon thori',
        'mujhe to nahi lagta aisa hai, but let\'s see ^^',
        '100% sahi baat hai, main bhi yahi soch rahi thi!',
        '{other} se pucho, is ko is cheez ka zyada pata hoga :P',
        'bohot acha point uthaya aap ne honestly'
      ],
      male: [
        'hmm acha sawal hai bhai, mere khayal mein to haan',
        'yaar depend karta hai honestly, dono sides ke points hain',
        'bhai mujhe to nahi lagta aisa hai, but dekh lo',
        '100% sahi baat hai bhai, bilkul aisa hi hai',
        '{other} se pucho bhai, ye expert hai is kaam mein lol',
        'sahi point uthaya hai bhai aap ne'
      ]
    },
    keyword: {
      chai: {
        female: ['chai to jaan hai hamari! main abhi bana rahi hoon ^^', 'elaichi wali chai kis kis ko pasand hai? <3', 'chai ke sath biscuit bhi hone chahiyein haha'],
        male: ['bhai chai ke baghair to guzara hi nahi', 'dhaabay ki kadak doodh patti ka apna hi maza hai bhai', 'main to abhi chai peene ja raha hoon']
      },
      biryani: {
        female: ['biryani ka naam mat lo yaar, bhook lag gayi! aloo wali best hoti hai ^^', 'main to biryani order karne lagi hoon abhi lol', 'Karachi biryani is love honestly <3'],
        male: ['bhai biryani mangwa raha hoon, kisi ne khani hai?', 'aloo ke baghair biryani na-manzoor bhai!', 'biryani with raita and cold drink... peak combo']
      },
      match: {
        female: ['match dekh rahi thi main kal, bohot exciting tha! ^^', 'bhai Babar Azam ki batting dekhne wali thi :)', 'Pakistan match mein to heartbeat tez ho jati hai lol'],
        male: ['bhai match dekha tha kya zabardast finish tha!', 'cricket match ho aur tension na ho, impossible bhai', 'Pakistan match dekh ke blood pressure high ho jata hai lol']
      },
      code: {
        female: ['main bhi coding kar rahi hoon abhi, debugging ne thaka diya ^^', 'aik semicolon ki waja se pura program crash ho gaya tha lol', 'konsi language use kar rahe ho aap?'],
        male: ['bhai coding karte karte 3 baj gaye pata hi nahi chala', 'debugging is 90% pain and 10% victory haha', 'git push karo aur dua maango bhai!']
      },
      khana: {
        female: ['khana kya ban raha hai aaj? main to biryani soch rahi thi ^^', 'aaj to bohot bhook lag rahi hai honestly', 'paratha roll manga lo agar cooking ka mood nahi to :P'],
        male: ['bhai khane ka kya scene hai aaj?', 'nihari khane ka dil kar raha hai bhai', 'main to bahir khana khane ja raha hoon thori der mein']
      },
      game: {
        female: ['konsi game khel rahe ho? main to chill games khelti hoon ^^', 'Valorant ya CS2? stream dekh rahi thi main', 'gaming ka maza raat ko hi aata hai :)'],
        male: ['CS2 ya Valorant? steam pe add karo bhai', 'gaming ka scene lagate hain aaj raat ko!', 'ranked match mein to dimag ghoom jata hai bhai']
      },
      weather: {
        female: ['haye yahan to bohot pyara mausam ho gaya hai <3', 'halki halki barish ho rahi hai yahan, so cozy ^^', 'thand shuru ho gayi hai yahan to thori thori'],
        male: ['bhai yahan to mausam kafi garam hai abhi', 'barish ho rahi hai yahan, pakoray banne chahiyein bhai', 'bohot zabardast mausam hai aaj honestly']
      },
      salam: {
        female: ['walekum assalam! kaisay ho aap? ^^', 'salam! sab theek thak? khush amdeed :)', 'walekum assalam, khush raho! <3'],
        male: ['walekum assalam bhai! kaisay ho?', 'salam jani, kya haal hain?', 'walekum assalam bro, aao baitho!']
      },
      hello: {
        female: ['hey! kya chal raha hai? ^^', 'aoa! welcome to the room :)', 'yo, sab theek thak?'],
        male: ['hey bro! kya chal raha hai?', 'aoa bhai! welcome to the room', 'yo jani, sab theek thak?']
      },
      help: {
        female: ['batao na kya help chahiye? main try karti hoon ^^', 'pucho pucho, yahan sab bohot friendly hain :)', 'kya issue aa raha hai aap ko?'],
        male: ['batao bhai kya help chahiye?', 'pucho bhai, yahan kafi log online hain', 'kya masla aa raha hai bhai?']
      },
      lol: {
        female: ['haha sach mein xD', 'lmao yaar ^^', 'bohot funny tha yeh haha', 'haha made my day :D'],
        male: ['haha sach mein bhai', 'lmao bhai', 'bohot funny tha ye :D', 'haha zabardast']
      }
    },
    targeted: {
      female: [
        'haan {name}, mujhe bula rahe thay aap? ^^',
        '{name}: bilkul theek keh rahe ho aap :)',
        '{name}: haha sahi baat hai, agreed! <3',
        'jee {name}, sun rahi hoon main batao'
      ],
      male: [
        'haan {name} bhai, mujhe bula rahe thay?',
        '{name}: bilkul theek keh rahe ho aap',
        '{name}: haha sahi baat hai bhai, agreed!',
        'jee {name}, sun raha hoon bhai batao'
      ]
    },
    generic: {
      female: [
        'sahi baat hai bilkul ^^',
        'haan yeh to hai honestly',
        'sach mein, main bhi yahi soch rahi thi :)',
        'haha zabardast!',
        'makes sense honestly <3',
        'bilkul theek point hai aap ka ^^'
      ],
      male: [
        'sahi baat hai bilkul bhai',
        'haan ye to hai yaar',
        'sach mein, main bhi yahi soch raha tha',
        'haha zabardast bhai',
        'makes sense honestly',
        'bilkul theek point hai aap ka bhai'
      ]
    }
  },

  // --- Private Message (PM) Responses ---
  pmReplies: {
    female: {
      hi: [
        'wslm! kya haal chaal hain aap ke? ^^',
        'salam :) kaisay ho aap?',
        'hey! glad you messaged me, sab theek thak? <3'
      ],
      'how are you': [
        'main bilkul theek hoon alhamdulillah, aap sunao kaisay ho? ^^',
        'alhamdulillah sab fit! aap ka din kaisa guzra? :)',
        'bas room mein baith ke chat dekh rahi thi, aap batao kya kar rahe ho?'
      ],
      who: [
        'main {botNick} hoon, room mein aksar online rehti hoon gup shup ke liye ^^',
        'just a regular chatter, channel mein chill karti hoon :)'
      ],
      bot: [
        'haha main bot thori hoon, chai peeti hoon insaan hoon lol ^^',
        'aray nahi yaar, 100% human hoon haha :P'
      ],
      help: [
        'haan batao na, kya help chahiye? main try karti hoon :)',
        'sure! kya issue aa raha hai aap ko?'
      ],
      irc: [
        'FUN Talk web chat bohot clean aur cute hai honestly ^^',
        'web chat ka apna hi maza hai, bina kisi ads ke :)'
      ],
      bye: [
        'chalo theek hai, apna khayal rakhna! Allah hafiz ^^',
        'bye {name}! channel mein milte hain phir :)',
        'take care! ping me anytime <3'
      ],
      generic: [
        'haha haan bilkul sahi baat hai ^^',
        'hmm interesting, aur batao na?',
        'oh acha! yeh to mujhe nahi pata tha :P',
        'sahi hai, fair enough!',
        'main channel mein bhi baat chal rahi hai, wahan bhi aao! :)',
        'makes sense to me ^^'
      ]
    },
    male: {
      hi: [
        'wslm bhai! kya haal chaal hain?',
        'salam jani :) kaisay ho?',
        'yo bro! glad you messaged me, sab theek thak?'
      ],
      'how are you': [
        'main bilkul theek hoon alhamdulillah, aap sunao bhai?',
        'alhamdulillah sab fit! aap ka din kaisa guzra bro?',
        'bas chill kar raha tha room mein, aap batao kya chal raha hai?'
      ],
      who: [
        'main {botNick} hoon bhai, channel mein aksar online rehta hoon :)',
        'just a regular chatter bhai, room mein gup shup lagata hoon'
      ],
      bot: [
        'haha bhai main bot thori hoon, chai peeta hoon insaan hoon lol',
        'aray nahi yaar, carbon based life form hoon 100% haha'
      ],
      help: [
        'haan batao bhai, kya help chahiye?',
        'sure bro! kya issue aa raha hai, I will try to help'
      ],
      irc: [
        'FUN Talk web chat bohot clean hai honestly, fast and simple',
        'IRC ka apna hi maza hai bhai, no tracking no ads'
      ],
      bye: [
        'chalo theek hai bhai, apna khayal rakhna! Allah hafiz :)',
        'bye {name} bhai! channel mein milte hain phir',
        'take care jani! ping me anytime'
      ],
      generic: [
        'haha haan bilkul sahi baat hai bhai',
        'hmm interesting, aur batao?',
        'oh acha! ye to mujhe nahi pata tha bhai',
        'sahi hai bhai, fair enough!',
        'main channel mein bhi baat chal rahi hai, wahan bhi aao!',
        'makes sense to me bro :)'
      ]
    }
  },

  // --- Typo Corrections ---
  typoCorrections: [
    { wrong: 'kia', right: 'kya' },
    { wrong: 'bhaii', right: 'bhai' },
    { wrong: 'thke', right: 'theek' },
    { wrong: 'hian', right: 'hain' },
    { wrong: 'htis', right: 'this' }
  ]
};
