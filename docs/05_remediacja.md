# 05. Remediacja — jak naprawić podatności

## SQL Injection

Problem:

```js
const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
```

Poprawa:

```js
const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
```

Dodatkowo:

- hashowanie haseł przez bcrypt/argon2,
- brak zwracania zapytań SQL w błędach,
- logowanie błędów tylko po stronie serwera.

## XSS

Problem:

```js
element.innerHTML = userInput;
```

Poprawa:

```js
element.textContent = userInput;
```

Dodatkowo:

- sanityzacja HTML, jeśli HTML jest naprawdę potrzebny,
- Content Security Policy,
- encoding danych na wyjściu.

## Brute-force

Poprawki:

- rate limiting per IP i per konto,
- opóźnienia po wielu błędnych próbach,
- blokada konta lub step-up MFA,
- neutralne komunikaty błędów,
- monitoring nietypowej liczby prób.

## File upload

Poprawki:

- whitelist typów i rozszerzeń,
- sprawdzanie magic bytes,
- limit rozmiaru pliku,
- losowe nazwy plików,
- storage poza katalogiem publicznym,
- skanowanie antymalware,
- pobieranie plików przez kontrolowany endpoint z autoryzacją.

## Broken Access Control

Problem:

```js
app.get('/api/admin/users', requireLogin, handler)
```

Poprawa:

```js
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

app.get('/api/admin/users', requireLogin, requireAdmin, handler)
```

Dla IDOR:

```js
SELECT * FROM orders WHERE id = ? AND userId = ?
```

Zasady:

- kontrola dostępu zawsze po stronie backendu,
- nie ufać ukrytym przyciskom w frontendzie,
- sprawdzać właściciela zasobu,
- stosować zasadę najmniejszych uprawnień.
