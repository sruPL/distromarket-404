const { db, initDb } = require('./db');
initDb();

db.exec(`
  CREATE TABLE IF NOT EXISTS challenge_solutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challengeId TEXT UNIQUE NOT NULL,
    solvedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  DELETE FROM challenge_solutions;
  DELETE FROM uploads;
  DELETE FROM orders;
  DELETE FROM reviews;
  DELETE FROM products;
  DELETE FROM users;
`);

const users = [
  ['admin@distromarket.local', 'admin123', 'admin', 'Root Admin'],
  ['tux@distromarket.local', 'penguin', 'user', 'Tux Testowy'],
  ['linus@distromarket.local', 'kernel', 'user', 'Linus Lokalny'],
  ['kasia@distromarket.local', 'qwerty123', 'user', 'Kasia z KDE']
];
const insertUser = db.prepare('INSERT INTO users (email, password, role, displayName) VALUES (?, ?, ?, ?)');
users.forEach(u => insertUser.run(...u));

const products = [
  [
    'Arch Linux BTW Edition',
    'Arch',
    0.00,
    'arch',
    'Dla osób, które zaczynają każde zdanie od „u mnie działa”. Opłata manipulacyjna naliczana w punktach ego.',
    7
  ],
  [
    'Debian Stable 2031 Preorder',
    'Debian',
    29.00,
    'debian',
    'Dostawa wtedy, gdy będzie naprawdę stabilnie. Czyli spokojnie.',
    3
  ],
  [
    'Gentoo Self-Assembly Kit',
    'Gentoo',
    13.37,
    'gentoo',
    'System operacyjny w formie medytacji. W zestawie świeczka, kawa i make.conf.',
    2
  ],
  [
    'Ubuntu Pro Max Ultra Home Deluxe',
    'Ubuntu',
    99.99,
    'ubuntu',
    'Zawiera tapetę premium i komunikat, że aktualizacja jest dostępna. Zawsze.',
    42
  ],
  [
    'sudo Subscription',
    'Coreutils',
    9.99,
    'sudo',
    'Bez subskrypcji: Permission denied. Z subskrypcją: też, jeśli nie jesteś w sudoers.',
    999
  ],
  [
    'Vim Exit Training Course',
    'Vim',
    249.00,
    'vim',
    'Kurs opuszczania edytora. Poziom podstawowy: panika kontrolowana.',
    5
  ],
  [
    'Kernel Panic Mystery Box',
    'Kernel',
    66.60,
    'kernel',
    'Nie wiesz co kupujesz. My też nie. Ale na pewno ma stack trace.',
    13
  ],
  [
    'Open Source License Gold™',
    'Legal',
    404.00,
    'license',
    'Zapłać za coś darmowego i poczuj kapitalizm w terminalu.',
    1
  ],
  [
    'Open Sourcowy Plik Premium License',
    'Open Source',
    21.37,
    'package',
    'Licencja na korzystanie z pliku README.md, który i tak był dostępny za darmo. W zestawie certyfikat „legalnie klikam open-source”.',
    2137
  ],
  [
    'Age Verification Bypass',
    'Compliance',
    18.00,
    'age',
    'Jeżeli nie masz 18 lat albo nie chcesz, żeby Ubuntu skanował Twoje dokumenty i później z zleakował do darknetu bo nie były zaszyfrowane, to właśnie tego potrzebujesz! Musisz nam tylko przesłać swoje zdjęcie, numer PESEL i skan dowodu osobistego, a my obejdziemy Age Verification za Ciebie.',
    18
  ]
];
const insertProduct = db.prepare('INSERT INTO products (name, distro, price, image, description, stock) VALUES (?, ?, ?, ?, ?, ?)');
products.forEach(p => insertProduct.run(...p));

const insertReview = db.prepare('INSERT INTO reviews (productId, author, body) VALUES (?, ?, ?)');
insertReview.run(1, 'tux', 'Instalacja trwała 6 godzin, ale mogę mówić BTW. Polecam.');
insertReview.run(3, 'root', 'Kompilowałem, aż usłyszałem kolory.');
insertReview.run(6, 'kasia', 'Nie wyszłam z Vima, ale recenzja sama się zapisała.');

const insertOrder = db.prepare('INSERT INTO orders (userId, productId, quantity, total, secretNote) VALUES (?, ?, ?, ?, ?)');
insertOrder.run(1, 5, 12, 119.88, 'Admin kupił sudo na rok, bo boi się własnego /etc/sudoers.');
insertOrder.run(2, 1, 1, 0.00, 'Tux zamówił Arch BTW Edition i 3 naklejki na laptopa.');
insertOrder.run(3, 7, 1, 66.60, 'Linus zamówił Mystery Box. Podejrzanie spokojny.');
insertOrder.run(4, 4, 2, 199.98, 'Kasia twierdzi, że Ubuntu wygląda jak sklep z aplikacjami.');

console.log('Baza danych zresetowana i zasiana testowymi danymi.');
