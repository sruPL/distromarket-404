const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
const { db, initDb } = require('./db');

initDb();

/**
 * Dodatkowa tabela scoreboardu.
 * Tworzymy ją tutaj również defensywnie, żeby aplikacja działała nawet,
 * jeśli ktoś jeszcze nie dopisał jej w src/db.js.
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS challenge_solutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challengeId TEXT UNIQUE NOT NULL,
    solvedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

try {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (count === 0) require('./seed');
} catch (e) {
  console.error('Błąd inicjalizacji danych:', e.message);
}

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-super-secret-change-me';

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/**
 * INTENCJONALNIE PODATNE:
 * Publiczny katalog uploadów.
 */
app.use('/uploads', express.static(uploadsDir));

app.use(express.static(path.join(__dirname, '..', 'public')));

/**
 * Prosty licznik nieudanych logowań do challenge'a brute-force.
 * Wystarczy do demo. Po restarcie serwera licznik się zeruje.
 */
const failedLoginAttempts = {};

function signUser(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName
    },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
}

function getCurrentUser(req) {
  const header = req.headers.authorization || '';
  const token = req.cookies.token || header.replace('Bearer ', '');

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function requireLogin(req, res, next) {
  const user = getCurrentUser(req);

  if (!user) {
    return res.status(401).json({
      error: 'Musisz się zalogować. Pingwin patrzy.'
    });
  }

  req.user = user;
  next();
}

/**
 * SCOREBOARD HELPERS
 */

function solveChallenge(challengeId) {
  try {
    db.prepare(`
      INSERT OR IGNORE INTO challenge_solutions (challengeId)
      VALUES (?)
    `).run(challengeId);

    console.log(`[SCOREBOARD] Solved: ${challengeId}`);
  } catch (err) {
    console.error('[SCOREBOARD] Error:', err.message);
  }
}

function looksLikeSqlInjection(value = '') {
  const text = String(value).toLowerCase();

  return (
    text.includes("'") ||
    text.includes('"') ||
    text.includes('--') ||
    text.includes('/*') ||
    text.includes('*/') ||
    text.includes(' or ') ||
    text.includes(' and ') ||
    text.includes('union') ||
    text.includes('select')
  );
}

function looksLikeXss(value = '') {
  const text = String(value).toLowerCase();

  return (
    text.includes('<script') ||
    text.includes('</script') ||
    text.includes('onerror=') ||
    text.includes('onload=') ||
    text.includes('javascript:') ||
    text.includes('<img') ||
    text.includes('<svg')
  );
}

function isSuspiciousUpload(file) {
  if (!file) return false;

  const name = String(file.originalname || '').toLowerCase();
  const mime = String(file.mimetype || '').toLowerCase();

  return (
    name.endsWith('.html') ||
    name.endsWith('.htm') ||
    name.endsWith('.js') ||
    name.endsWith('.php') ||
    name.endsWith('.sh') ||
    name.endsWith('.txt') ||
    mime.includes('html') ||
    mime.includes('javascript') ||
    mime.includes('text/plain')
  );
}

/**
 * AUTH
 *
 * INTENCJONALNIE PODATNE:
 * SQL Injection przez konkatenację danych użytkownika.
 */
app.post('/api/login', (req, res) => {
  const { email = '', password = '' } = req.body;

  const query = `
    SELECT id, email, role, displayName
    FROM users
    WHERE email = '${email}'
    AND password = '${password}'
    LIMIT 1
  `;

  try {
    const user = db.prepare(query).get();

    if (!user) {
      const key = String(email || req.ip || 'unknown');
      failedLoginAttempts[key] = (failedLoginAttempts[key] || 0) + 1;

      if (failedLoginAttempts[key] >= 5) {
        solveChallenge('brute-force');
      }

      return res.status(401).json({
        error: `Niepoprawne hasło dla ${email}. Tak, zdradzamy zbyt dużo.`
      });
    }

    if (looksLikeSqlInjection(email) || looksLikeSqlInjection(password)) {
      solveChallenge('sqli-login');
    }

    const token = signUser(user);

    /**
     * INTENCJONALNIE SŁABE:
     * httpOnly: false, żeby można było omawiać ryzyka XSS/tokenów w labie.
     */
    res.cookie('token', token, {
      httpOnly: false,
      sameSite: 'lax'
    });

    res.json({
      message: 'Logowanie udane. Backend udaje, że wszystko jest dobrze.',
      token,
      user
    });
  } catch (err) {
    res.status(500).json({
      error: 'Błąd SQL: ' + err.message,
      query
    });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  res.json({
    user: getCurrentUser(req)
  });
});

/**
 * PRODUCTS
 */
app.get('/api/products', (req, res) => {
  const q = req.query.q;

  if (q) {
    if (looksLikeSqlInjection(q)) {
      solveChallenge('sqli-login');
    }

    if (looksLikeXss(q)) {
      solveChallenge('xss-review');
    }

    /**
     * INTENCJONALNIE PODATNE:
     * SQL Injection w wyszukiwarce.
     */
    const query = `
      SELECT *
      FROM products
      WHERE name LIKE '%${q}%'
      OR distro LIKE '%${q}%'
    `;

    try {
      return res.json({
        query,
        products: db.prepare(query).all(),
        reflected: q
      });
    } catch (err) {
      return res.status(500).json({
        error: err.message,
        query
      });
    }
  }

  res.json({
    products: db.prepare('SELECT * FROM products').all()
  });
});

app.get('/api/products/:id', (req, res) => {
  const product = db
    .prepare('SELECT * FROM products WHERE id = ?')
    .get(req.params.id);

  if (!product) {
    return res.status(404).json({
      error: 'Produkt zniknął jak dokumentacja po deadline.'
    });
  }

  const reviews = db
    .prepare('SELECT * FROM reviews WHERE productId = ? ORDER BY id DESC')
    .all(req.params.id);

  res.json({
    product,
    reviews
  });
});

/**
 * REVIEWS
 *
 * INTENCJONALNIE PODATNE:
 * Stored XSS — recenzja zapisywana bez sanityzacji.
 */
app.post('/api/products/:id/reviews', (req, res) => {
  const { author = 'anon', body = '' } = req.body;

  if (looksLikeXss(author) || looksLikeXss(body)) {
    solveChallenge('xss-review');
  }

  db.prepare(`
    INSERT INTO reviews (productId, author, body)
    VALUES (?, ?, ?)
  `).run(req.params.id, author, body);

  res.json({
    message: 'Recenzja dodana. Moderacja jest na urlopie w /dev/null.'
  });
});

/**
 * ORDERS
 */
app.post('/api/orders', requireLogin, (req, res) => {
  const { productId, quantity = 1 } = req.body;

  const product = db
    .prepare('SELECT * FROM products WHERE id = ?')
    .get(productId);

  if (!product) {
    return res.status(404).json({
      error: 'Nie ma takiego produktu.'
    });
  }

  const total = Number(quantity) * product.price;

  const info = db.prepare(`
    INSERT INTO orders (userId, productId, quantity, total, secretNote)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    product.id,
    quantity,
    total,
    `Zakup ${product.name}; klient zaakceptował EULA napisaną w bashu.`
  );

  res.json({
    message: 'Zamówienie złożone. Faktura została wysłana gołębiem przez SMTP.',
    orderId: info.lastInsertRowid
  });
});

/**
 * INTENCJONALNIE PODATNE:
 * IDOR/Broken Access Control — każdy zalogowany może zobaczyć dowolne zamówienie po ID.
 */
app.get('/api/orders/:id', requireLogin, (req, res) => {
  const order = db.prepare(`
    SELECT
      orders.*,
      users.email,
      users.displayName,
      products.name AS productName
    FROM orders
    JOIN users ON users.id = orders.userId
    JOIN products ON products.id = orders.productId
    WHERE orders.id = ?
  `).get(req.params.id);

  if (!order) {
    return res.status(404).json({
      error: 'Zamówienie nie istnieje albo zostało skompilowane.'
    });
  }

  if (order.userId !== req.user.id) {
    solveChallenge('idor-order');
  }

  res.json({
    order,
    warning: 'INTENCJONALNIE: brak sprawdzenia właściciela zamówienia.'
  });
});

app.get('/api/my-orders', requireLogin, (req, res) => {
  const orders = db.prepare(`
    SELECT
      orders.*,
      products.name AS productName
    FROM orders
    JOIN products ON products.id = orders.productId
    WHERE orders.userId = ?
    ORDER BY orders.id DESC
  `).all(req.user.id);

  res.json({
    orders
  });
});

/**
 * ADMIN
 *
 * INTENCJONALNIE PODATNE:
 * Endpoint admina sprawdza tylko logowanie, ale nie sprawdza roli.
 */
app.get('/api/admin/users', requireLogin, (req, res) => {
  if (req.user.role !== 'admin') {
    solveChallenge('admin-bac');
  }

  const users = db
    .prepare('SELECT id, email, password, role, displayName FROM users ORDER BY id')
    .all();

  res.json({
    users,
    warning: 'INTENCJONALNIE: endpoint admina bez kontroli roli.'
  });
});

/**
 * INTENCJONALNIE PODATNE:
 * Dowolny zalogowany użytkownik może zmienić rolę dowolnego konta.
 */
app.post('/api/admin/users/:id/role', requireLogin, (req, res) => {
  const { role = 'user' } = req.body;

  db.prepare('UPDATE users SET role = ? WHERE id = ?')
    .run(role, req.params.id);

  res.json({
    message: `Rola zmieniona na ${role}. Backend zapomniał zapytać: „czy wolno?”.`
  });
});

/**
 * FILE UPLOAD
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

/**
 * INTENCJONALNIE PODATNE:
 * Brak limitów i prawdziwej walidacji typu pliku.
 */
const upload = multer({ storage });

app.post('/api/upload-license-proof', requireLogin, upload.single('proof'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'Brak pliku.'
    });
  }

  // Achievement za file upload.
  // W tej aplikacji podatność polega na tym, że backend przyjmuje pliki bez sensownej walidacji.
  solveChallenge('file-upload');

  db.prepare(`
    INSERT INTO uploads (userId, originalName, fileName, mimeType)
    VALUES (?, ?, ?, ?)
  `).run(
    req.user.id,
    req.file.originalname,
    req.file.filename,
    req.file.mimetype
  );

  res.json({
    message: 'Plik przesłany. Ufamy społeczności open-source, więc prawie niczego nie sprawdziliśmy.',
    achievement: 'file-upload',
    url: `/uploads/${req.file.filename}`,
    file: req.file
  });
});

  if (isSuspiciousUpload(req.file)) {
    solveChallenge('file-upload');
  }

  db.prepare(`
    INSERT INTO uploads (userId, originalName, fileName, mimeType)
    VALUES (?, ?, ?, ?)
  `).run(
    req.user.id,
    req.file.originalname,
    req.file.filename,
    req.file.mimetype
  );

  res.json({
    message: 'Plik przesłany. Ufamy społeczności open-source, więc prawie niczego nie sprawdziliśmy.',
    url: `/uploads/${req.file.filename}`,
    file: req.file
  });
});

app.get('/api/uploads', requireLogin, (req, res) => {
  const uploads = db
    .prepare('SELECT * FROM uploads ORDER BY id DESC')
    .all();

  res.json({
    uploads
  });
});

/**
 * SCOREBOARD
 */
app.get('/api/scoreboard', (req, res) => {
  const solvedRows = db.prepare(`
    SELECT challengeId, solvedAt
    FROM challenge_solutions
  `).all();

  const solvedMap = Object.fromEntries(
    solvedRows.map(row => [row.challengeId, row.solvedAt])
  );

  const challenges = [
    {
      id: 'sqli-login',
      name: 'SELECT * FROM godmode',
      category: 'SQL Injection',
      goal: 'Omiń logowanie lub zaloguj się jako admin bez znajomości hasła.'
    },
    {
      id: 'xss-review',
      name: 'Alertowy Wojownik',
      category: 'XSS',
      goal: 'Dodaj recenzję produktu, która wykonuje kontrolowany JavaScript w labie.'
    },
    {
      id: 'brute-force',
      name: 'Hasło: hasło',
      category: 'Brute-force',
      goal: 'Wykaż brak blokady konta i rate limitingu na /api/login.'
    },
    {
      id: 'file-upload',
      name: 'Uploadowa Ruletka',
      category: 'File Upload',
      goal: 'Prześlij niedozwolony typ pliku i otwórz go z publicznego katalogu.'
    },
    {
      id: 'idor-order',
      name: 'Czytałem URL-e i wygrałem',
      category: 'Broken Access Control',
      goal: 'Odczytaj cudze zamówienie po zmianie ID.'
    },
    {
      id: 'admin-bac',
      name: 'Admin z przypadku',
      category: 'Broken Access Control',
      goal: 'Wejdź do danych admina jako zwykły użytkownik.'
    }
  ].map(challenge => ({
    ...challenge,
    solved: Boolean(solvedMap[challenge.id]),
    solvedAt: solvedMap[challenge.id] || null
  }));

  res.json({
    challenges
  });
});

/**
 * Fallback SPA
 */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`DistroMarket 404 działa na http://localhost:${PORT}`);
  console.log('UWAGA: to jest celowo podatna aplikacja laboratoryjna. Nie wystawiaj publicznie.');
});
