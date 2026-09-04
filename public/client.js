// client.js - Mibbit-style Web IRC Client
(function () {
  'use strict';

  const socket = io();

  // Application State
  const state = {
    connected: false,
    myNick: 'Guest',
    serverName: 'Not Connected',
    activeTab: 'Status',
    tabs: new Map(), // key -> { type: 'status'|'channel'|'pm', name, unread: 0, topic: '', users: [] }
    messages: new Map(), // key -> Array of msg objects
    commandHistory: [],
    historyIndex: -1,
    tabCompleteIndex: -1,
    tabCompleteMatches: [],
    tabCompleteOriginal: ''
  };

  // Color hash for IRC nicknames (deterministic vibrant colors)
  const NICK_COLORS = [
    '#38bdf8', '#fb7185', '#34d399', '#f472b6', '#fbbf24',
    '#a78bfa', '#2dd4bf', '#f87171', '#4ade80', '#60a5fa',
    '#c084fc', '#facc15', '#e879f9', '#22d3ee', '#fb923c'
  ];

  function getNickColor(nick) {
    if (!nick) return '#94a3b8';
    let hash = 0;
    for (let i = 0; i < nick.length; i++) {
      hash = nick.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % NICK_COLORS.length;
    return NICK_COLORS[index];
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatLinks(str) {
    const escaped = escapeHtml(str);
    const urlPattern = /(https?:\/\/[^\s<]+)/g;
    return escaped.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  }

  function formatTime(isoString) {
    const d = isoString ? new Date(isoString) : new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `[${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}]`;
  }

  // DOM Elements
  const el = {
    connectionDot: document.getElementById('connection-dot'),
    serverLabel: document.getElementById('server-label'),
    tabList: document.getElementById('tab-list'),
    topicBar: document.getElementById('topic-bar'),
    topicText: document.getElementById('topic-text'),
    channelStats: document.getElementById('channel-stats'),
    messageContainer: document.getElementById('message-container'),
    typingIndicator: document.getElementById('typing-indicator'),
    chatInput: document.getElementById('chat-input'),
    sendBtn: document.getElementById('btn-send'),
    userSidebar: document.getElementById('user-sidebar'),
    userList: document.getElementById('user-list'),
    userCount: document.getElementById('user-count'),
    userSearch: document.getElementById('user-search'),
    userMenu: document.getElementById('user-menu'),
    btnToggleUsers: document.getElementById('btn-toggle-users'),
    btnCloseSidebar: document.getElementById('btn-close-sidebar'),
    headerUserCount: document.getElementById('header-user-count'),
    // Modals
    connectModal: document.getElementById('connect-modal'),
    helpModal: document.getElementById('help-modal'),
    btnOpenConnect: document.getElementById('btn-connect'),
    btnOpenHelp: document.getElementById('btn-help'),
    btnClearChat: document.getElementById('btn-clear'),
    // Connect Form
    connectForm: document.getElementById('connect-form'),
    serverNick: document.getElementById('server-nick'),
    serverPass: document.getElementById('server-pass')
  };

  let selectedUserForMenu = null;

  // Initialize tabs: Status tab is permanent
  function initTabs() {
    createTab('Status', 'status');
    setActiveTab('Status');
  }

  function createTab(key, type) {
    if (state.tabs.has(key)) return state.tabs.get(key);
    const tabData = {
      key: key,
      name: key,
      type: type, // 'status', 'channel', 'pm'
      unread: 0,
      topic: type === 'status' ? 'System Console & Server Notices' : '',
      users: []
    };
    state.tabs.set(key, tabData);
    if (!state.messages.has(key)) {
      state.messages.set(key, []);
    }
    renderTabs();
    return tabData;
  }

  function closeTab(key) {
    if (key === 'Status') return; // Cannot close status tab
    // Cannot close main configured channel tab
    if (state.defaultChannel && key.toLowerCase() === state.defaultChannel.toLowerCase()) {
      return;
    }
    const tabData = state.tabs.get(key);
    if (!tabData) return;

    if (tabData.type === 'channel') {
      socket.emit('part_channel', { channel: key });
    }

    state.tabs.delete(key);
    state.messages.delete(key);

    if (state.activeTab === key) {
      // Switch to previous tab or Status
      const remaining = Array.from(state.tabs.keys());
      const nextKey = remaining[remaining.length - 1] || 'Status';
      setActiveTab(nextKey);
    } else {
      renderTabs();
    }
  }

  function setActiveTab(key) {
    if (!state.tabs.has(key)) return;
    state.activeTab = key;
    const tabData = state.tabs.get(key);
    tabData.unread = 0; // Clear unread counter

    renderTabs();
    renderActiveMessages();
    renderTopic();
    renderUserList();

    // Update input placeholder
    if (tabData.type === 'channel') {
      el.chatInput.placeholder = `Message ${key} — /help for commands`;
      el.userSidebar.style.display = 'flex';
      el.topicBar.style.display = 'flex';
    } else if (tabData.type === 'pm') {
      el.chatInput.placeholder = `Private message with ${key}`;
      el.userSidebar.style.display = 'none';
      el.topicBar.style.display = 'flex';
      el.topicText.innerHTML = `Private conversation with <b>${escapeHtml(key)}</b>`;
      el.channelStats.textContent = 'Query';
    } else {
      el.chatInput.placeholder = `Send raw command or /join #channel...`;
      el.userSidebar.style.display = 'none';
      el.topicBar.style.display = 'flex';
      el.topicText.textContent = 'Status Console — connection logs and server messages';
      el.channelStats.textContent = 'Console';
    }

    el.chatInput.focus();
  }

  function renderTabs() {
    el.tabList.innerHTML = '';
    state.tabs.forEach((tab, key) => {
      const tabEl = document.createElement('div');
      tabEl.className = 'chat-tab' + (key === state.activeTab ? ' active' : '');
      
      let icon = '#';
      if (tab.type === 'status') icon = '🌐';
      else if (tab.type === 'pm') icon = '💬';

      const isMainChannel = state.defaultChannel && key.toLowerCase() === state.defaultChannel.toLowerCase();
      const canClose = key !== 'Status' && !isMainChannel;

      tabEl.innerHTML = `
        <span class="tab-icon">${icon}</span>
        <span class="tab-title">${escapeHtml(key)}</span>
        <span class="tab-badge ${tab.unread > 0 ? 'active' : ''}">${tab.unread}</span>
        ${canClose ? `<span class="tab-close" title="Close tab">&times;</span>` : ''}
      `;

      tabEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-close')) {
          e.stopPropagation();
          closeTab(key);
        } else {
          setActiveTab(key);
        }
      });

      el.tabList.appendChild(tabEl);
    });
  }

  function addMessageToTab(targetKey, msg) {
    if (!state.messages.has(targetKey)) {
      state.messages.set(targetKey, []);
    }
    const list = state.messages.get(targetKey);
    list.push(msg);

    // If not active tab, increment unread count
    if (state.activeTab !== targetKey) {
      const tabData = state.tabs.get(targetKey);
      if (tabData) {
        tabData.unread = (tabData.unread || 0) + 1;
        renderTabs();
      }
    } else {
      // Append directly to view
      appendMessageElement(msg);
    }
  }

  function appendMessageElement(msg) {
    const isAtBottom = (el.messageContainer.scrollHeight - el.messageContainer.scrollTop) <= (el.messageContainer.clientHeight + 60);

    const div = document.createElement('div');
    div.className = `msg-line ${msg.type || ''}`;

    const timeStr = formatTime(msg.time);
    let bodyHtml = '';

    if (msg.type === 'action') {
      bodyHtml = `
        <span class="msg-time">${timeStr}</span>
        <span class="msg-text">* <b>${escapeHtml(msg.from)}</b> ${formatLinks(msg.text)}</span>
      `;
    } else if (msg.type === 'join') {
      bodyHtml = `
        <span class="msg-time">${timeStr}</span>
        <span class="msg-text">→ <b>${escapeHtml(msg.from)}</b> has joined ${escapeHtml(msg.channel || '')}</span>
      `;
    } else if (msg.type === 'part') {
      bodyHtml = `
        <span class="msg-time">${timeStr}</span>
        <span class="msg-text">← <b>${escapeHtml(msg.from)}</b> has left ${escapeHtml(msg.channel || '')} ${msg.text ? `(${escapeHtml(msg.text)})` : ''}</span>
      `;
    } else if (msg.type === 'quit') {
      bodyHtml = `
        <span class="msg-time">${timeStr}</span>
        <span class="msg-text">← <b>${escapeHtml(msg.from)}</b> has quit (${escapeHtml(msg.text || '')})</span>
      `;
    } else if (msg.type === 'system') {
      bodyHtml = `
        <span class="msg-time">${timeStr}</span>
        <span class="msg-text">*** ${formatLinks(msg.text)}</span>
      `;
    } else if (msg.type === 'notice') {
      bodyHtml = `
        <span class="msg-time">${timeStr}</span>
        <span class="msg-text"><b>-${escapeHtml(msg.from)}-</b> ${formatLinks(msg.text)}</span>
      `;
    } else {
      // Regular message
      const nickColor = getNickColor(msg.from);
      bodyHtml = `
        <span class="msg-time">${timeStr}</span>
        <span class="msg-nick" style="color: ${nickColor}" data-nick="${escapeHtml(msg.from)}">&lt;${escapeHtml(msg.from)}&gt;</span>
        <span class="msg-text">${formatLinks(msg.text)}</span>
      `;
    }

    div.innerHTML = bodyHtml;

    // Click nick to PM or mention
    const nickEl = div.querySelector('.msg-nick');
    if (nickEl) {
      nickEl.addEventListener('click', (e) => {
        e.stopPropagation();
        openPMTab(msg.from);
      });
    }

    el.messageContainer.appendChild(div);

    if (isAtBottom) {
      el.messageContainer.scrollTop = el.messageContainer.scrollHeight;
    }
  }

  function renderActiveMessages() {
    el.messageContainer.innerHTML = '';
    const msgs = state.messages.get(state.activeTab) || [];
    msgs.forEach(appendMessageElement);
    el.messageContainer.scrollTop = el.messageContainer.scrollHeight;
  }

  function renderTopic() {
    const tabData = state.tabs.get(state.activeTab);
    if (!tabData) return;

    if (tabData.type === 'channel') {
      el.topicText.innerHTML = tabData.topic
        ? `<b>Topic:</b> ${formatLinks(tabData.topic)}`
        : `<i>No topic set. Type <b>/topic &lt;text&gt;</b> to set one.</i>`;
      el.channelStats.textContent = `${tabData.users ? tabData.users.length : 0} users`;
    }
  }

  function renderUserList() {
    const tabData = state.tabs.get(state.activeTab);
    if (!tabData || tabData.type !== 'channel') return;

    const filter = el.userSearch.value.trim().toLowerCase();
    let users = (tabData.users || []).filter(u => {
      if (!filter) return true;
      return u.nick.toLowerCase().includes(filter);
    });

    // Sort: Ops (@) first, Voices (+) second, then standard users
    users.sort((a, b) => {
      const getRank = (u) => (u.prefix === '@' ? 3 : u.prefix === '+' ? 2 : 1);
      const rankDiff = getRank(b) - getRank(a);
      if (rankDiff !== 0) return rankDiff;
      return a.nick.localeCompare(b.nick, undefined, { sensitivity: 'base' });
    });

    const userCountNum = tabData.users ? tabData.users.length : 0;
    el.userCount.textContent = `(${userCountNum})`;
    if (el.headerUserCount) {
      el.headerUserCount.textContent = userCountNum;
    }
    el.userList.innerHTML = '';

    users.forEach(u => {
      const item = document.createElement('div');
      item.className = 'user-item';
      
      let prefixCls = '';
      if (u.prefix === '@') prefixCls = 'op';
      else if (u.prefix === '+') prefixCls = 'voice';

      const isMe = u.nick.toLowerCase() === state.myNick.toLowerCase();

      // Realistic user display: NO bot indicators
      item.innerHTML = `
        <div class="user-info">
          <span class="user-prefix ${prefixCls}">${escapeHtml(u.prefix || '')}</span>
          <span class="user-name ${isMe ? 'is-self' : ''}" style="color: ${getNickColor(u.nick)}">${escapeHtml(u.nick)}</span>
        </div>
      `;

      // Single click: show context menu; Double click: open PM directly
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        showUserMenu(u.nick, e.clientX, e.clientY);
      });

      item.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        openPMTab(u.nick);
      });

      el.userList.appendChild(item);
    });
  }

  function openPMTab(nick) {
    if (!nick || nick.toLowerCase() === state.myNick.toLowerCase()) return;
    if (el.userSidebar) {
      el.userSidebar.classList.remove('open-mobile');
    }
    createTab(nick, 'pm');
    setActiveTab(nick);
  }

  // User Context Menu
  function showUserMenu(nick, x, y) {
    selectedUserForMenu = nick;
    el.userMenu.style.left = `${Math.min(x, window.innerWidth - 160)}px`;
    el.userMenu.style.top = `${Math.min(y, window.innerHeight - 120)}px`;
    el.userMenu.classList.remove('hidden');
  }

  function hideUserMenu() {
    el.userMenu.classList.add('hidden');
    selectedUserForMenu = null;
  }

  document.addEventListener('click', () => hideUserMenu());

  el.userMenu.addEventListener('click', (e) => {
    const action = e.target.getAttribute('data-action');
    if (!action || !selectedUserForMenu) return;

    if (action === 'pm') {
      openPMTab(selectedUserForMenu);
    } else if (action === 'mention') {
      el.chatInput.value = `${selectedUserForMenu}: ` + el.chatInput.value;
      el.chatInput.focus();
    } else if (action === 'whois') {
      socket.emit('send_raw', { command: `WHOIS ${selectedUserForMenu}` });
      addMessageToTab(state.activeTab, {
        time: new Date().toISOString(),
        type: 'system',
        text: `Querying WHOIS for ${selectedUserForMenu}...`
      });
    }
    hideUserMenu();
  });

  // Slash command parser
  function handleSendMessage() {
    const raw = el.chatInput.value.trim();
    if (!raw) return;

    // Record command history
    state.commandHistory.push(raw);
    state.historyIndex = state.commandHistory.length;
    el.chatInput.value = '';

    const currentTab = state.tabs.get(state.activeTab);

    // Check for IRC slash command
    if (raw.startsWith('/')) {
      const parts = raw.slice(1).split(' ');
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);
      const rest = args.join(' ');

      switch (cmd) {
        case 'join':
        case 'j': {
          addMessageToTab(state.activeTab, {
            time: new Date().toISOString(),
            type: 'system',
            text: `Channel is locked to ${state.defaultChannel || 'the configured channel'}. Joining other channels is disabled.`
          });
          if (state.defaultChannel) {
            setActiveTab(state.defaultChannel);
          }
          break;
        }

        case 'part':
        case 'leave': {
          const chan = args[0] || (currentTab && currentTab.type === 'channel' ? state.activeTab : null);
          if (chan) {
            closeTab(chan);
          }
          break;
        }

        case 'msg':
        case 'query': {
          if (args.length < 1) {
            addMessageToTab(state.activeTab, { time: new Date().toISOString(), type: 'system', text: 'Usage: /msg <nick> [message] or /query <nick>' });
            return;
          }
          const target = args[0];
          openPMTab(target);
          if (args.length > 1) {
            const pmText = args.slice(1).join(' ');
            socket.emit('send_pm', { to: target, text: pmText });
          }
          break;
        }

        case 'me': {
          if (!rest) return;
          if (currentTab.type === 'channel') {
            socket.emit('send_action', { channel: state.activeTab, text: rest });
          } else if (currentTab.type === 'pm') {
            socket.emit('send_pm', { to: state.activeTab, text: `* ${rest}` });
          }
          break;
        }

        case 'nick': {
          if (!args[0]) {
            addMessageToTab(state.activeTab, { time: new Date().toISOString(), type: 'system', text: 'Usage: /nick <new_nickname>' });
            return;
          }
          socket.emit('change_nick', { nick: args[0] });
          break;
        }

        case 'topic': {
          if (currentTab.type !== 'channel') {
            addMessageToTab(state.activeTab, { time: new Date().toISOString(), type: 'system', text: '/topic can only be used in a channel' });
            return;
          }
          socket.emit('set_topic', { channel: state.activeTab, topic: rest });
          break;
        }

        case 'clear': {
          state.messages.set(state.activeTab, []);
          renderActiveMessages();
          break;
        }

        case 'raw':
        case 'quote': {
          if (!rest) return;
          socket.emit('send_raw', { command: rest });
          break;
        }

        case 'help': {
          el.helpModal.classList.remove('hidden');
          break;
        }

        default:
          addMessageToTab(state.activeTab, {
            time: new Date().toISOString(),
            type: 'system',
            text: `Unknown command: /${cmd}. Type /help for a list of available commands.`
          });
          break;
      }
      return;
    }

    // Regular message
    if (currentTab.type === 'channel') {
      socket.emit('send_message', {
        channel: state.activeTab,
        text: raw
      });
    } else if (currentTab.type === 'pm') {
      socket.emit('send_pm', {
        to: state.activeTab,
        text: raw
      });
    } else {
      // Status tab
      addMessageToTab('Status', {
        time: new Date().toISOString(),
        type: 'system',
        text: `You are currently in the Status Console. Click the <b>${escapeHtml(state.defaultChannel || 'channel')}</b> tab above to enter the chat room.`
      });
    }
  }

  // Key event listeners for chat input (Enter, Up, Down, Tab completion)
  el.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
      state.tabCompleteMatches = [];
      return;
    }

    // Up / Down command history
    if (e.key === 'ArrowUp') {
      if (state.historyIndex > 0) {
        state.historyIndex--;
        el.chatInput.value = state.commandHistory[state.historyIndex] || '';
      }
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      if (state.historyIndex < state.commandHistory.length - 1) {
        state.historyIndex++;
        el.chatInput.value = state.commandHistory[state.historyIndex] || '';
      } else {
        state.historyIndex = state.commandHistory.length;
        el.chatInput.value = '';
      }
      e.preventDefault();
    }

    // Nickname Tab Completion
    if (e.key === 'Tab') {
      e.preventDefault();
      const currentTab = state.tabs.get(state.activeTab);
      if (!currentTab || currentTab.type !== 'channel') return;

      const inputVal = el.chatInput.value;
      if (!state.tabCompleteMatches.length) {
        state.tabCompleteOriginal = inputVal;
        const words = inputVal.split(' ');
        const lastWord = words[words.length - 1].toLowerCase();
        if (!lastWord) return;

        state.tabCompleteMatches = (currentTab.users || [])
          .map(u => u.nick)
          .filter(n => n.toLowerCase().startsWith(lastWord));
        state.tabCompleteIndex = 0;
      }

      if (state.tabCompleteMatches.length > 0) {
        const words = state.tabCompleteOriginal.split(' ');
        const match = state.tabCompleteMatches[state.tabCompleteIndex % state.tabCompleteMatches.length];
        words[words.length - 1] = words.length === 1 ? `${match}: ` : `${match} `;
        el.chatInput.value = words.join(' ');
        state.tabCompleteIndex++;
      }
    } else {
      state.tabCompleteMatches = [];
    }
  });

  el.sendBtn.addEventListener('click', handleSendMessage);

  // User search filter
  el.userSearch.addEventListener('input', renderUserList);

  // Mobile User Drawer Toggle
  if (el.btnToggleUsers) {
    el.btnToggleUsers.addEventListener('click', (e) => {
      e.stopPropagation();
      el.userSidebar.classList.toggle('open-mobile');
    });
  }

  if (el.btnCloseSidebar) {
    el.btnCloseSidebar.addEventListener('click', (e) => {
      e.stopPropagation();
      el.userSidebar.classList.remove('open-mobile');
    });
  }

  // Close mobile sidebar when clicking in chat message container
  el.messageContainer.addEventListener('click', () => {
    if (el.userSidebar.classList.contains('open-mobile')) {
      el.userSidebar.classList.remove('open-mobile');
    }
  });

  // Modal handlers
  el.btnOpenConnect.addEventListener('click', () => el.connectModal.classList.remove('hidden'));
  el.btnOpenHelp.addEventListener('click', () => el.helpModal.classList.remove('hidden'));
  el.btnClearChat.addEventListener('click', () => {
    state.messages.set(state.activeTab, []);
    renderActiveMessages();
  });

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal-backdrop').classList.add('hidden');
    });
  });

  // Nickname form submission (Server, port, and channel are configured on the backend)
  el.connectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const config = {
      nick: el.serverNick.value.trim(),
      password: el.serverPass ? el.serverPass.value.trim() : ''
    };
    initiateConnection(config);
  });

  function initiateConnection(config) {
    el.connectModal.classList.add('hidden');
    state.myNick = config.nick || 'Guest';

    addMessageToTab('Status', {
      time: new Date().toISOString(),
      type: 'system',
      text: `Connecting to FUN Talk as <b>${escapeHtml(state.myNick)}</b>...`
    });

    socket.emit('connect_irc', config);
  }

  // Socket.IO Server Events
  socket.on('init_config', (data) => {
    if (data.defaultChannel) {
      state.defaultChannel = data.defaultChannel;
    }
    if (!state.connected) {
      if (!el.serverNick.value) {
        el.serverNick.value = 'Guest' + Math.floor(Math.random() * 9000 + 1000);
      }
      el.connectModal.classList.remove('hidden');
      setTimeout(() => {
        el.serverNick.focus();
        el.serverNick.select();
      }, 100);
    }
  });

  socket.on('irc_connected', (data) => {
    state.connected = true;
    state.serverName = data.server || 'Connected';
    state.myNick = data.nick || state.myNick;

    el.connectionDot.classList.add('online');
    el.serverLabel.textContent = `${state.serverName} (${state.myNick})`;

    addMessageToTab('Status', {
      time: new Date().toISOString(),
      type: 'system',
      text: `Connected to ${state.serverName} as <b>${escapeHtml(state.myNick)}</b>.`
    });
  });

  socket.on('irc_status', (data) => {
    addMessageToTab('Status', {
      time: new Date().toISOString(),
      type: 'system',
      text: data.text
    });
  });

  socket.on('irc_raw', (data) => {
    addMessageToTab('Status', {
      time: new Date().toISOString(),
      type: 'system',
      text: data.text
    });
  });

  socket.on('irc_error', (data) => {
    addMessageToTab(state.activeTab, {
      time: new Date().toISOString(),
      type: 'system',
      text: `<span style="color: var(--danger)">[ERROR] ${escapeHtml(data.message)}</span>`
    });
  });

  // Channel Message Received
  socket.on('irc_message', (data) => {
    const chan = data.channel;
    createTab(chan, 'channel');

    addMessageToTab(chan, {
      time: data.time || new Date().toISOString(),
      from: data.nick,
      text: data.text,
      type: 'message'
    });
  });

  // Action (/me) Received
  socket.on('irc_action', (data) => {
    const chan = data.channel;
    createTab(chan, 'channel');

    addMessageToTab(chan, {
      time: data.time || new Date().toISOString(),
      from: data.nick,
      text: data.text,
      type: 'action'
    });
  });

  // Private Message Received (from bot or real user)
  socket.on('irc_pm', (data) => {
    const sender = data.from;
    createTab(sender, 'pm');

    addMessageToTab(sender, {
      time: data.time || new Date().toISOString(),
      from: sender,
      text: data.text,
      type: 'pm-in'
    });
  });

  // Sent PM echo
  socket.on('irc_pm_sent', (data) => {
    const target = data.to;
    createTab(target, 'pm');

    addMessageToTab(target, {
      time: data.time || new Date().toISOString(),
      from: state.myNick,
      text: data.text,
      type: 'pm-out'
    });
  });

  // Notice received
  socket.on('irc_notice', (data) => {
    addMessageToTab(state.activeTab, {
      time: new Date().toISOString(),
      from: data.from,
      text: data.text,
      type: 'notice'
    });
  });

  // Channel Join
  socket.on('irc_join', (data) => {
    const chan = data.channel;
    createTab(chan, 'channel');
    const tab = state.tabs.get(chan);

    // If I joined, switch active tab to it
    if (data.nick.toLowerCase() === state.myNick.toLowerCase()) {
      setActiveTab(chan);
    } else {
      addMessageToTab(chan, {
        time: new Date().toISOString(),
        from: data.nick,
        channel: chan,
        type: 'join'
      });
    }

    // Add to userlist if not already present
    if (tab && tab.users) {
      if (!tab.users.some(u => u.nick.toLowerCase() === data.nick.toLowerCase())) {
        tab.users.push({
          nick: data.nick,
          prefix: data.prefix || '',
          bot: !!data.isBot
        });
        if (state.activeTab === chan) {
          renderUserList();
          renderTopic();
        }
      }
    }
  });

  // Channel Part
  socket.on('irc_part', (data) => {
    const chan = data.channel;
    const tab = state.tabs.get(chan);

    addMessageToTab(chan, {
      time: new Date().toISOString(),
      from: data.nick,
      channel: chan,
      text: data.message,
      type: 'part'
    });

    if (tab && tab.users) {
      tab.users = tab.users.filter(u => u.nick.toLowerCase() !== data.nick.toLowerCase());
      if (state.activeTab === chan) {
        renderUserList();
        renderTopic();
      }
    }
  });

  // IRC Quit
  socket.on('irc_quit', (data) => {
    state.tabs.forEach((tab, chan) => {
      if (tab.type === 'channel' && tab.users) {
        const hadUser = tab.users.some(u => u.nick.toLowerCase() === data.nick.toLowerCase());
        if (hadUser) {
          tab.users = tab.users.filter(u => u.nick.toLowerCase() !== data.nick.toLowerCase());
          addMessageToTab(chan, {
            time: new Date().toISOString(),
            from: data.nick,
            text: data.message,
            type: 'quit'
          });
          if (state.activeTab === chan) {
            renderUserList();
            renderTopic();
          }
        }
      }
    });
  });

  // Nick change
  socket.on('irc_nick', (data) => {
    const { oldNick, newNick } = data;
    if (oldNick.toLowerCase() === state.myNick.toLowerCase()) {
      state.myNick = newNick;
      el.serverLabel.textContent = `${state.serverName} (${state.myNick})`;
    }

    state.tabs.forEach((tab, key) => {
      if (tab.type === 'channel' && tab.users) {
        tab.users.forEach(u => {
          if (u.nick.toLowerCase() === oldNick.toLowerCase()) {
            u.nick = newNick;
          }
        });
        addMessageToTab(key, {
          time: new Date().toISOString(),
          type: 'system',
          text: `<b>${escapeHtml(oldNick)}</b> is now known as <b>${escapeHtml(newNick)}</b>`
        });
      }
    });

    renderUserList();
  });

  // Topic change
  socket.on('irc_topic', (data) => {
    const tab = state.tabs.get(data.channel);
    if (tab) {
      tab.topic = data.topic;
      if (state.activeTab === data.channel) {
        renderTopic();
      }
    }
  });

  // Channel Names (Userlist)
  socket.on('irc_names', (data) => {
    const chan = data.channel;
    createTab(chan, 'channel');
    const tab = state.tabs.get(chan);
    if (tab) {
      tab.users = data.users || [];
      if (state.activeTab === chan) {
        renderUserList();
        renderTopic();
      }
    }
  });

  // Bot typing indicator
  socket.on('bot_typing', (data) => {
    if (state.activeTab === data.channel && data.typing) {
      el.typingIndicator.textContent = `${data.nick} is typing...`;
    } else if (state.activeTab === data.channel && !data.typing) {
      el.typingIndicator.textContent = '';
    }
  });

  // Initialize
  initTabs();

})();
