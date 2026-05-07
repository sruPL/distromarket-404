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

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

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

const views = {
  async home() {
    el('app').innerHTML = `
      <section class="hero">
        <div>
          <span class="badge">laboratorium pentestów</span>
          <h1>DistroMarket <span class="gradient">404</span></h1>
          <p class="muted">
            Absurdalny e-commerce z Linuxami, płatnymi licencjami open-source
            i celowymi podatnościami do legalnych testów.
          </p>
          <div class="row">
            <a class="btn primary" href="#/products">Kup darmowego Linuxa</a>
            <a class="btn" href="#/scoreboard">Zobacz challenge</a>
            <a class="btn" href="#/docs">Instrukcje</a>
          </div>
        </div>

        <div class="card">
          <h2>Dzisiejsza promocja</h2>
          <p class="price">sudo -50%</p>
          <p>Teraz tylko połowa uprawnień administratora. Druga połowa po restarcie.</p>
          <pre>sudo apt install poczucie-bezpieczenstwa
E: Unable to locate package</pre>
        </div>
      </section>
    `;
  },

  async products() {
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const q = params.get('q') || '';

    const r = await api('/api/products' + (q ? `?q=${encodeURIComponent(q)}` : ''));

    state.products = r.products;

    el('app').innerHTML = `
      <div class="row">
        <h2>Produkty</h2>
        <form onsubmit="search(event)" class="row">
          <input
            name="q"
            placeholder="Szukaj np. Arch, sudo albo testowego payloadu"
            value="${q.replaceAll('"', '&quot;')}"
          >
          <button class="btn">Szukaj</button>
        </form>
      </div>

      ${q ? `<div class="alert">Wyniki dla: <strong id="reflected"></strong></div>` : ''}

      <div class="grid">
        ${r.products.map(p => `
          <article class="card product">
            <div class="productIcon">${icons[p.image] || '🐧'}</div>
            <span class="badge">${p.distro}</span>
            <h3>${p.name}</h3>
            <p class="muted">${p.description}</p>
            <p class="price">${money(p.price)}</p>
            <p>Zapas: ${p.stock}</p>
            <div class="row">
              <a class="btn primary" href="#/product/${p.id}">Szczegóły</a>
              <button class="btn" onclick="buy(${p.id})">Do koszyka-ish</button>
            </div>
          </article>
        `).join('')}
      </div>
    `;

    if (q) {
      document.getElementById('reflected').innerHTML = q;
    }
  },

  async product(id) {
    const r = await api('/api/products/' + id);
    const p = r.product;

    el('app').innerHTML = `
      <section class="two">
        <div class="card">
          <div class="productIcon">${icons[p.image] || '🐧'}</div>
          <span class="badge">${p.distro}</span>
          <h2>${p.name}</h2>
          <p>${p.description}</p>
          <p class="price">${money(p.price)}</p>
          <button class="btn primary" onclick="buy(${p.id})">Zamów teraz</button>
        </div>

        <div class="card">
          <h2>Recenzje</h2>
          <form onsubmit="review(event, ${p.id})">
            <input name="author" placeholder="Autor" value="anon">
            <textarea name="body" placeholder="Napisz recenzję. Moderacja śpi."></textarea>
            <button class="btn">Dodaj recenzję</button>
          </form>

          <div>
            ${r.reviews.map(rv => `
              <div class="review">
                <strong>${rv.author}</strong>
                <div class="muted">${rv.createdAt}</div>
                <div class="reviewBody">${rv.body}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  },

  async login() {
    el('app').innerHTML = `
      <section class="two">
        <div class="card">
          <h2>Login</h2>
          <p class="muted">
            Konta testowe są w dokumentacji.
            System jest celowo podatny na SQL Injection i brute-force.
          </p>

          <form onsubmit="login(event)">
            <input name="email" placeholder="email" value="tux@distromarket.local">
            <input name="password" placeholder="password" type="password" value="penguin">
            <button class="btn primary">Zaloguj</button>
          </form>

          <pre id="loginOut"></pre>
        </div>

        <div class="card">
          <h2>Regulamin</h2>
          <p>Logując się, akceptujesz, że pingwin może oceniać twoje hasło.</p>
          <p class="dangerText">
            Aplikacja laboratoryjna — tylko do testów w kontrolowanym środowisku.
          </p>
        </div>
      </section>
    `;
  },

  async orders() {
    if (!state.user) return location.hash = '#/login';

    const r = await api('/api/my-orders');

    el('app').innerHTML = `
      <div class="card">
        <h2>Moje zamówienia</h2>
        <p class="muted">
          Broken Access Control/IDOR:
          spróbuj ręcznie otworzyć <code>#/order/1</code>,
          <code>#/order/2</code> itd.
        </p>

        ${
          r.orders.map(o => `
            <p>
              <a class="btn" href="#/order/${o.id}">#${o.id}</a>
              ${o.productName} — ${money(o.total)}
            </p>
          `).join('') || '<p>Brak zamówień.</p>'
        }
      </div>
    `;
  },

  async order(id) {
    if (!state.user) return location.hash = '#/login';

    const r = await api('/api/orders/' + id);

    el('app').innerHTML = `
      <div class="card">
        <h2>Zamówienie #${r.order.id}</h2>
        <pre>${JSON.stringify(r, null, 2)}</pre>
      </div>
    `;
  },

  async upload() {
    if (!state.user) return location.hash = '#/login';

    const r = await api('/api/uploads').catch(() => ({ uploads: [] }));

    el('app').innerHTML = `
      <section class="two">
        <div class="card">
          <h2>Upload dowodu licencji open-source</h2>
          <p class="muted">
            Celowo słaby upload: brak sensownej walidacji i publiczny katalog /uploads.
          </p>

          <form onsubmit="uploadFile(event)">
            <input type="file" name="proof">
            <button class="btn primary">Wyślij plik</button>
          </form>

          <pre id="uploadOut"></pre>
        </div>

        <div class="card">
          <h2>Ostatnie uploady</h2>
          ${
            r.uploads.map(u => `
              <p>
                <a class="btn" target="_blank" href="/uploads/${u.fileName}">
                  ${u.originalName}
                </a>
                <span class="muted">${u.mimeType || ''}</span>
              </p>
            `).join('')
          }
        </div>
      </section>
    `;
  },

  async admin() {
    if (!state.user) return location.hash = '#/login';

    const r = await api('/api/admin/users');

    el('app').innerHTML = `
      <div class="card">
        <h2>Panel admina-ish</h2>
        <p class="alert">${r.warning}</p>
        <pre>${JSON.stringify(r.users, null, 2)}</pre>
      </div>
    `;
  },

  async scoreboard() {
    const r = await api('/api/scoreboard');

    const solvedCount = r.challenges.filter(c => c.solved).length;
    const totalCount = r.challenges.length;

    el('app').innerHTML = `
      <div class="card">
        <h2>Scoreboard</h2>
        <p class="muted">
          Automatyczny scoreboard challenge’y.
          Rozwiązane: <strong>${solvedCount}/${totalCount}</strong>
        </p>

        <div class="grid">
          ${r.challenges.map(c => `
            <div class="card ${c.solved ? 'challengeSolved' : ''}">
              <span class="badge">${c.category}</span>
              <h3>${c.solved ? '✅ ' : '⬜ '} ${c.name}</h3>
              <p>${c.goal}</p>
              <p class="muted">
                Status:
                <strong>${c.solved ? 'Zrobione' : 'Do zrobienia'}</strong>
              </p>
              ${c.solvedAt ? `<p class="muted">Odblokowano: ${c.solvedAt}</p>` : ''}
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
        <p>Pełna dokumentacja jest w katalogu <code>docs/</code> repozytorium:</p>
        <ul>
          <li><code>docs/01_uruchomienie.md</code></li>
          <li><code>docs/02_plan_testow_penetracyjnych.md</code></li>
          <li><code>docs/03_scenariusze_testowe.md</code></li>
          <li><code>docs/04_szablon_raportu.md</code></li>
          <li><code>docs/05_remediacja.md</code></li>
        </ul>
        <p class="alert">Zakres testów: wyłącznie własna instancja DistroMarket 404.</p>
      </div>
    `;
  }
};

async function login(e) {
  e.preventDefault();

  const f = new FormData(e.target);

  try {
    const r = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(f))
    });

    el('loginOut').textContent = JSON.stringify(r, null, 2);
    state.user = r.user;
    renderUser();
  } catch (err) {
    el('loginOut').textContent = JSON.stringify(err, null, 2);
  }
}

function search(e) {
  e.preventDefault();

  const q = new FormData(e.target).get('q');
  location.hash = '#/products?q=' + encodeURIComponent(q);
}

async function review(e, id) {
  e.preventDefault();

  const f = new FormData(e.target);

  await api('/api/products/' + id + '/reviews', {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(f))
  });

  location.reload();
}

async function buy(id) {
  if (!state.user) {
    location.hash = '#/login';
    return;
  }

  const r = await api('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      productId: id,
      quantity: 1
    })
  });

  alert(r.message + ' ID: ' + r.orderId);
  location.hash = '#/order/' + r.orderId;
}

async function uploadFile(e) {
  e.preventDefault();

  const fd = new FormData(e.target);

  const res = await fetch('/api/upload-license-proof', {
    method: 'POST',
    credentials: 'include',
    body: fd
  });

  const data = await res.json();

  el('uploadOut').textContent = JSON.stringify(data, null, 2);

  setTimeout(checkForNewChallenges, 300);
}

async function router() {
  await loadMe();

  const h = location.hash || '#/';
  const [path] = h.slice(2).split('?');
  const parts = path.split('/').filter(Boolean);

  try {
    if (!parts.length) return views.home();
    if (parts[0] === 'products') return views.products();
    if (parts[0] === 'product') return views.product(parts[1]);
    if (parts[0] === 'login') return views.login();
    if (parts[0] === 'orders') return views.orders();
    if (parts[0] === 'order') return views.order(parts[1]);
    if (parts[0] === 'upload') return views.upload();
    if (parts[0] === 'admin') return views.admin();
    if (parts[0] === 'scoreboard') return views.scoreboard();
    if (parts[0] === 'docs') return views.docs();

    return views.home();
  } catch (err) {
    el('app').innerHTML = `
      <div class="card">
        <h2>Ups, kernel panic</h2>
        <pre>${JSON.stringify(err, null, 2)}</pre>
      </div>
    `;
  }
}

window.addEventListener('hashchange', router);
router();

checkForNewChallenges();
setInterval(checkForNewChallenges, 2000);
``
