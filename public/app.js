const API = '';

const icons = {
  arch: '🧩',
  debian: '🌀',
  gentoo: '🛠️',
  ubuntu: '🟠',
  sudo: '🔐',
  vim: '🚪',
  kernel: '💥',
  license: '📜',
  package: '📦',
  age: '🔞'
};

let state = {
  user: null,
  products: [],
  notifiedChallenges: new Set(),
  challengesInitialized: false
};

let activeNotifications = 0;

/* ===================== NOTIFICATIONS ===================== */

function showNotification(challenge) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.style.top = `${20 + activeNotifications * 120}px`;
  activeNotifications++;

  notification.innerHTML = `
    <div class="notificationContent">
      <strong>🎉 Challenge odblokowany!</strong>
      <h3>${challenge.name}</h3>
      <p>${challenge.category}</p>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => notification.classList.add('show'), 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
      activeNotifications = Math.max(0, activeNotifications - 1);
    }, 300);
  }, 4000);
}

async function checkForNewChallenges() {
  try {
    const r = await api('/api/scoreboard');

    r.challenges.forEach(c => {
      if (!c.solved) return;

      if (!state.challengesInitialized) {
        state.notifiedChallenges.add(c.id);
        return;
      }

      if (!state.notifiedChallenges.has(c.id)) {
        state.notifiedChallenges.add(c.id);
        showNotification(c);
      }
    });

    state.challengesInitialized = true;
  } catch (err) {
    console.error('Error checking challenges:', err);
  }
}

/* ===================== API ===================== */

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

function money(n) {
  return Number(n).toLocaleString('pl-PL', {
    style: 'currency',
    currency: 'PLN'
  });
}

function el(id) {
  return document.getElementById(id);
}

/* ===================== USER ===================== */

function renderUser() {
  const box = el('userBox');
  if (!state.user) {
    box.innerHTML = `<a class="btn" href="#/login">Login</a>`;
  } else {
    box.innerHTML = `
      ${state.user.displayName}
      <span class="pill">${state.user.role}</span>
      <button class="btn" onclick="logout()">Wyloguj</button>
    `;
  }
}

async function loadMe() {
  try {
    const r = await api('/api/me');
    state.user = r.user;
  } catch {
    state.user = null;
  }
  renderUser();
}

async function logout() {
  await api('/api/logout', { method: 'POST' });
  state.user = null;
  location.hash = '#/';
  renderUser();
}

/* ===================== VIEWS ===================== */

const views = {
  async home() {
    el('app').innerHTML = `
      <section class="hero">
        <div>
          <span class="badge">laboratorium pentestów</span>
          <h1>DistroMarket <span class="gradient">404</span></h1>
          <p class="muted">
            Absurdalny e-commerce z Linuxami i celowymi podatnościami.
          </p>
          <div class="row">
            <a class="btn primary" href="#/products">Produkty</a>
            <a class="btn" href="#/scoreboard">Scoreboard</a>
            <a class="btn" href="#/docs">Instrukcje</a>
          </div>
        </div>
      </section>
    `;
  },

  async products() {
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const q = params.get('q') || '';
    const r = await api('/api/products' + (q ? `?q=${encodeURIComponent(q)}` : ''));

    el('app').innerHTML = `
      <h2>Produkty</h2>
      <div class="grid">
        ${r.products.map(p => `
          <div class="card product">
            <div class="productIcon">${icons[p.image] || '🐧'}</div>
            <span class="badge">${p.distro}</span>
            <h3>${p.name}</h3>
            <p>${p.description}</p>
            <p class="price">${money(p.price)}</p>
            <button class="btn" onclick="buy(${p.id})">Kup</button>
          </div>
        `).join('')}
      </div>
    `;
  },

  async admin() {
    if (!state.user) return location.hash = '#/login';
    const r = await api('/api/admin/users');
    el('app').innerHTML = `
      <div class="card">
        <h2>Admin</h2>
        <pre>${JSON.stringify(r.users, null, 2)}</pre>
      </div>
    `;
  },

  async scoreboard() {
    const r = await api('/api/scoreboard');

    el('app').innerHTML = `
      <div class="card">
        <h2>Scoreboard</h2>
        <div class="grid">
          ${r.challenges.map(c => `
            <div class="card ${c.solved ? 'challengeSolved' : ''}">
              <span class="badge">${c.category}</span>
              <h3>${c.solved ? '✅ ' : '⬜ '} ${c.name}</h3>
              <p>${c.goal}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  async docs() {
    el('app').innerHTML = `
      <div class="card">
        <h2>Instrukcje</h2>
        <p>Dokumentacja w katalogu <code>docs/</code>.</p>
      </div>
    `;
  }
};

/* ===================== ACTIONS ===================== */

async function buy(id) {
  if (!state.user) return location.hash = '#/login';
  const r = await api('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ productId: id, quantity: 1 })
  });
  alert(r.message);
}

/* ===================== ROUTER ===================== */

async function router() {
  await loadMe();
  const h = location.hash || '#/';
  const page = h.replace('#/', '').split('?')[0];
  if (!views[page]) return views.home();
  return views[page]();
}

window.addEventListener('hashchange', router);
router();
checkForNewChallenges();
setInterval(checkForNewChallenges, 2000);
