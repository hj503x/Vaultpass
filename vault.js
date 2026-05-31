// ===== VAULT CORE JS =====
// All data stored in localStorage for GitHub Pages (no backend needed)

const VAULT = {
  // ===== STORAGE KEYS =====
  KEYS: {
    USERS: 'vault_users',
    MESSAGES: 'vault_messages',
    CURRENT_USER: 'vault_current_user',
    CONVERSATIONS: 'vault_conversations',
  },

  // ===== INIT =====
  init() {
    if (!localStorage.getItem(this.KEYS.USERS)) localStorage.setItem(this.KEYS.USERS, JSON.stringify([]));
    if (!localStorage.getItem(this.KEYS.MESSAGES)) localStorage.setItem(this.KEYS.MESSAGES, JSON.stringify([]));
    if (!localStorage.getItem(this.KEYS.CONVERSATIONS)) localStorage.setItem(this.KEYS.CONVERSATIONS, JSON.stringify([]));
    this.seedDemoData();
  },

  // ===== SEED DEMO USERS =====
  seedDemoData() {
    const users = this.getUsers();
    if (users.length === 0) {
      const demos = [
        { id: 'demo_1', name: 'Alex Rivera', username: 'alexrivera', email: 'alex@demo.com', password: 'demo123', bio: 'Founder & CEO. Building in public. 180k followers.', price: 50, role: 'receiver', avatar: 'AR', joinedAt: Date.now() - 86400000 * 30 },
        { id: 'demo_2', name: 'Maya Chen', username: 'mayachen', email: 'maya@demo.com', password: 'demo123', bio: 'Content creator & investor. 2.1M followers.', price: 100, role: 'receiver', avatar: 'MC', joinedAt: Date.now() - 86400000 * 15 },
        { id: 'demo_3', name: 'Jordan Blake', username: 'jordanblake', email: 'jordan@demo.com', password: 'demo123', bio: 'VC Partner. Early stage startups.', price: 250, role: 'receiver', avatar: 'JB', joinedAt: Date.now() - 86400000 * 7 },
      ];
      localStorage.setItem(this.KEYS.USERS, JSON.stringify(demos));
    }
  },

  // ===== USER METHODS =====
  getUsers() { return JSON.parse(localStorage.getItem(this.KEYS.USERS) || '[]'); },
  saveUsers(users) { localStorage.setItem(this.KEYS.USERS, JSON.stringify(users)); },

  getUserById(id) { return this.getUsers().find(u => u.id === id) || null; },
  getUserByUsername(username) { return this.getUsers().find(u => u.username === username.toLowerCase()) || null; },
  getUserByEmail(email) { return this.getUsers().find(u => u.email === email.toLowerCase()) || null; },

  registerUser({ name, username, email, password, price, bio }) {
    const users = this.getUsers();
    if (users.find(u => u.email === email.toLowerCase())) return { error: 'Email already registered.' };
    if (users.find(u => u.username === username.toLowerCase())) return { error: 'Username already taken.' };
    const user = {
      id: 'u_' + Date.now() + Math.random().toString(36).slice(2, 7),
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      bio: bio || '',
      price: parseFloat(price) || 25,
      role: 'receiver',
      avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      joinedAt: Date.now(),
    };
    users.push(user);
    this.saveUsers(users);
    return { user };
  },

  loginUser(email, password) {
    const user = this.getUserByEmail(email);
    if (!user) return { error: 'No account found with that email.' };
    if (user.password !== password) return { error: 'Incorrect password.' };
    return { user };
  },

  updateUser(id, updates) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    users[idx] = { ...users[idx], ...updates };
    // Recompute avatar if name changed
    if (updates.name) users[idx].avatar = updates.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    this.saveUsers(users);
    return users[idx];
  },

  // ===== SESSION =====
  getCurrentUser() {
    const id = localStorage.getItem(this.KEYS.CURRENT_USER);
    return id ? this.getUserById(id) : null;
  },
  setCurrentUser(user) { localStorage.setItem(this.KEYS.CURRENT_USER, user ? user.id : ''); },
  logout() { localStorage.removeItem(this.KEYS.CURRENT_USER); },
  requireAuth(redirectTo = 'login.html') {
    const user = this.getCurrentUser();
    if (!user) { window.location.href = redirectTo; return null; }
    return user;
  },

  // ===== MESSAGES =====
  getMessages() { return JSON.parse(localStorage.getItem(this.KEYS.MESSAGES) || '[]'); },
  saveMessages(msgs) { localStorage.setItem(this.KEYS.MESSAGES, JSON.stringify(msgs)); },

  sendMessage({ senderId, receiverId, subject, body, amountPaid }) {
    const msgs = this.getMessages();
    const convId = this.getOrCreateConversation(senderId, receiverId);
    const msg = {
      id: 'm_' + Date.now() + Math.random().toString(36).slice(2, 6),
      conversationId: convId,
      senderId,
      receiverId,
      subject,
      body,
      amountPaid,
      sentAt: Date.now(),
      read: false,
      type: 'initial', // initial | reply
    };
    msgs.push(msg);
    this.saveMessages(msgs);
    // Update conversation last message
    this.updateConversation(convId, { lastMessage: body.slice(0, 80), lastAt: Date.now(), subject });
    return msg;
  },

  sendReply({ conversationId, senderId, receiverId, body }) {
    const msgs = this.getMessages();
    const msg = {
      id: 'm_' + Date.now() + Math.random().toString(36).slice(2, 6),
      conversationId,
      senderId,
      receiverId,
      subject: '',
      body,
      amountPaid: 0,
      sentAt: Date.now(),
      read: false,
      type: 'reply',
    };
    msgs.push(msg);
    this.saveMessages(msgs);
    this.updateConversation(conversationId, { lastMessage: body.slice(0, 80), lastAt: Date.now() });
    return msg;
  },

  getMessagesForConversation(conversationId) {
    return this.getMessages()
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => a.sentAt - b.sentAt);
  },

  markConversationRead(conversationId, userId) {
    const msgs = this.getMessages();
    msgs.forEach(m => { if (m.conversationId === conversationId && m.receiverId === userId) m.read = true; });
    this.saveMessages(msgs);
  },

  getUnreadCount(userId) {
    return this.getMessages().filter(m => m.receiverId === userId && !m.read).length;
  },

  // ===== CONVERSATIONS =====
  getConversations() { return JSON.parse(localStorage.getItem(this.KEYS.CONVERSATIONS) || '[]'); },
  saveConversations(convs) { localStorage.setItem(this.KEYS.CONVERSATIONS, JSON.stringify(convs)); },

  getOrCreateConversation(senderId, receiverId) {
    const convs = this.getConversations();
    const existing = convs.find(c =>
      (c.senderId === senderId && c.receiverId === receiverId) ||
      (c.senderId === receiverId && c.receiverId === senderId)
    );
    if (existing) return existing.id;
    const conv = {
      id: 'c_' + Date.now() + Math.random().toString(36).slice(2, 6),
      senderId, receiverId,
      subject: '',
      lastMessage: '',
      lastAt: Date.now(),
      createdAt: Date.now(),
    };
    convs.push(conv);
    this.saveConversations(convs);
    return conv.id;
  },

  updateConversation(id, updates) {
    const convs = this.getConversations();
    const idx = convs.findIndex(c => c.id === id);
    if (idx !== -1) { convs[idx] = { ...convs[idx], ...updates }; this.saveConversations(convs); }
  },

  getConversationsForUser(userId) {
    return this.getConversations()
      .filter(c => c.senderId === userId || c.receiverId === userId)
      .sort((a, b) => b.lastAt - a.lastAt);
  },

  getConversationById(id) { return this.getConversations().find(c => c.id === id) || null; },

  hasConversationWith(senderId, receiverId) {
    return this.getConversations().some(c =>
      (c.senderId === senderId && c.receiverId === receiverId) ||
      (c.senderId === receiverId && c.receiverId === senderId)
    );
  },

  // ===== PUBLIC RECEIVERS =====
  getPublicReceivers() {
    return this.getUsers().filter(u => u.role === 'receiver');
  },

  // ===== UTILS =====
  formatPrice(amount) { return '$' + parseFloat(amount).toFixed(2); },
  formatTime(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },
  formatDate(ts) { return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); },
  generateId() { return Date.now() + Math.random().toString(36).slice(2, 8); },
};

// ===== TOAST SYSTEM =====
function toast(message, type = 'default') {
  const container = document.getElementById('toast-container') || (() => {
    const el = document.createElement('div'); el.id = 'toast-container'; document.body.appendChild(el); return el;
  })();
  const icons = { success: '✦', error: '✕', default: '◆' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || icons.default}</span><span class="toast-text">${message}</span>`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; el.style.transition = 'all 0.3s'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ===== MODAL UTILITY =====
function openModal(html) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'active-modal';
  overlay.innerHTML = `<div class="modal">${html}<button class="modal-close" onclick="closeModal()">✕</button></div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
}
function closeModal() { document.getElementById('active-modal')?.remove(); }

// ===== NAV RENDER =====
function renderNav(activePage = '') {
  const user = VAULT.getCurrentUser();
  const logoHref = user ? 'dashboard.html' : 'index.html';
  const navEl = document.querySelector('.nav');
  if (!navEl) return;

  const unread = user ? VAULT.getUnreadCount(user.id) : 0;
  const unreadBadge = unread > 0 ? `<span style="background:var(--gold);color:var(--black);border-radius:100px;padding:1px 7px;font-size:0.65rem;font-weight:700;">${unread}</span>` : '';

  navEl.innerHTML = `
    <a href="${logoHref}" class="nav-logo">Vault<span>Pass</span></a>
    <div class="nav-actions">
      ${user ? `
        <a href="dashboard.html" class="btn btn-ghost btn-sm" style="${activePage==='dashboard'?'color:var(--gold)':''}">Inbox ${unreadBadge}</a>
        <a href="discover.html" class="btn btn-ghost btn-sm" style="${activePage==='discover'?'color:var(--gold)':''}">Discover</a>
        <a href="settings.html" class="btn btn-ghost btn-sm" style="${activePage==='settings'?'color:var(--gold)':''}">Settings</a>
        <button class="btn btn-outline btn-sm" onclick="VAULT.logout(); window.location.href='index.html'">Sign Out</button>
      ` : `
        <a href="login.html" class="btn btn-ghost btn-sm">Sign In</a>
        <a href="signup.html" class="btn btn-gold btn-sm">Get Started</a>
      `}
    </div>
  `;
}

// ===== INIT ON LOAD =====
VAULT.init();
