# 03. Scenariusze testowe

> Wszystkie kroki wykonuj wyłącznie na własnej instancji DistroMarket 404.

## S1 — SQL Injection w logowaniu

### Cel

Udowodnić, że endpoint logowania buduje zapytanie SQL z niesprawdzonych danych użytkownika.

### Endpoint

```text
POST /api/login
```

### Kroki

1. Otwórz `#/login`.
2. Przechwyć request w Burp Suite/ZAP.
3. Zmień wartość pola `email` na kontrolowany ciąg testowy SQLi, np. warunek logiczny zawsze prawdziwy.
4. Wyślij request.
5. Sprawdź, czy aplikacja zwraca token i dane użytkownika bez znajomości poprawnego hasła.

### Dowód

- request i response,
- widok zalogowanego użytkownika,
- ewentualnie komunikat błędu SQL pokazujący zapytanie.

### Wpływ

Ominięcie uwierzytelniania i potencjalne przejęcie konta.

### Naprawa

Prepared statements, hashowanie haseł, generyczne komunikaty błędów.

---

## S2 — Reflected XSS w wyszukiwarce

### Cel

Sprawdzić, czy parametr `q` jest bezpiecznie renderowany.

### Endpoint

```text
GET /api/products?q=...
```

### Kroki

1. Wejdź na stronę produktów.
2. Wyszukaj frazę zawierającą prosty, kontrolowany kod HTML/JS używany wyłącznie w labie.
3. Sprawdź, czy wartość pojawia się w DOM jako HTML zamiast tekstu.
4. Udokumentuj wykonanie kodu.

### Wpływ

Możliwość wykonania JavaScriptu w przeglądarce użytkownika.

### Naprawa

Output encoding, `textContent` zamiast `innerHTML`, walidacja wejścia.

---

## S3 — Stored XSS w recenzjach

### Cel

Udowodnić, że recenzje produktów są zapisywane i później renderowane bez sanityzacji.

### Endpoint

```text
POST /api/products/:id/reviews
```

### Kroki

1. Otwórz dowolny produkt.
2. Dodaj recenzję zawierającą kontrolowany kod HTML/JS do demonstracji.
3. Odśwież produkt.
4. Sprawdź, czy payload wykonuje się ponownie.

### Wpływ

Stored XSS działa na każdego użytkownika odwiedzającego produkt.

### Naprawa

Sanityzacja HTML, output encoding, Content Security Policy.

---

## S4 — Brute-force logowania

### Cel

Wykazać brak rate limitingu, blokady konta i mechanizmów antyautomatyzacyjnych.

### Endpoint

```text
POST /api/login
```

### Kroki

1. Przygotuj krótką listę haseł laboratoryjnych.
2. Wykonaj serię prób logowania dla znanego użytkownika testowego.
3. Sprawdź, czy aplikacja blokuje konto lub spowalnia odpowiedzi.
4. Udokumentuj liczbę prób i wynik.

### Przykładowe konto do testu

```text
tux@distromarket.local
```

### Wpływ

Możliwość odgadnięcia słabego hasła.

### Naprawa

Rate limiting, blokada konta, MFA, hasła hashowane silnym algorytmem, neutralne komunikaty błędów.

---

## S5 — File upload

### Cel

Sprawdzić, czy aplikacja dopuszcza niepożądane typy plików i publikuje je w katalogu dostępnym z weba.

### Endpoint

```text
POST /api/upload-license-proof
GET /uploads/NazwaPliku
```

### Kroki

1. Zaloguj się jako zwykły użytkownik.
2. Przejdź do `#/upload`.
3. Prześlij plik, który nie powinien być traktowany jako dowód zakupu, np. plik tekstowy lub HTML.
4. Otwórz zwrócony link `/uploads/...`.
5. Udokumentuj brak walidacji i publiczną dostępność.

### Wpływ

Ryzyko publikacji niechcianych treści, XSS przez pliki HTML, nadużycie przestrzeni dyskowej.

### Naprawa

Whitelist typów MIME, sprawdzanie magic bytes, limity rozmiaru, losowe nazwy, prywatny storage, skanowanie plików.

---

## S6 — Broken Access Control / IDOR w zamówieniach

### Cel

Sprawdzić, czy użytkownik może odczytać cudze zamówienie przez zmianę ID.

### Endpoint

```text
GET /api/orders/:id
```

### Kroki

1. Zaloguj się jako `tux@distromarket.local`.
2. Otwórz własne zamówienia.
3. Zmień ID w URL, np. `#/order/1`, `#/order/2`, `#/order/3`.
4. Sprawdź, czy aplikacja pokazuje dane innego użytkownika.

### Wpływ

Ujawnienie danych zamówień i informacji o klientach.

### Naprawa

Sprawdzanie właściciela zasobu po stronie backendu.

---

## S7 — Broken Access Control / panel admina

### Cel

Sprawdzić, czy zwykły użytkownik może odczytać dane administracyjne.

### Endpoint

```text
GET /api/admin/users
```

### Kroki

1. Zaloguj się jako zwykły użytkownik.
2. Wejdź w `#/admin`.
3. Sprawdź, czy endpoint zwraca listę użytkowników.
4. Udokumentuj ujawnienie danych.

### Wpływ

Zwykły użytkownik może odczytać dane administracyjne, w tym w tej wersji demonstracyjnej hasła zapisane jawnie.

### Naprawa

Kontrola roli na backendzie, zasada najmniejszych uprawnień, hashowanie haseł.
