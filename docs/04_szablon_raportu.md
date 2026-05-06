# 04. Szablon raportu z testów penetracyjnych

## 1. Informacje ogólne

**Projekt:** DistroMarket 404  
**Tester:** Imię i nazwisko  
**Data testów:** YYYY-MM-DD  
**Środowisko:** lokalne / VM / Docker  
**Adres aplikacji:** `http://localhost:3000` lub `http://ADRES_IP_HOSTA:3000`

## 2. Streszczenie zarządcze

W trakcie testów wykryto celowo zaimplementowane podatności pozwalające m.in. na obejście logowania, wykonanie JavaScriptu w przeglądarce użytkownika, odczyt cudzych zamówień, dostęp do panelu admina bez odpowiedniej roli oraz upload niedozwolonych plików.

## 3. Zakres testów

W zakresie:

- aplikacja DistroMarket 404,
- endpointy `/api/*`,
- interfejs webowy,
- lokalny katalog uploadów.

Poza zakresem:

- zewnętrzne systemy,
- infrastruktura GitHub,
- publiczne domeny,
- system operacyjny hosta poza elementami koniecznymi do uruchomienia labu.

## 4. Metodyka

Testy wykonano zgodnie z podejściem inspirowanym OWASP WSTG i OWASP Top 10. Zastosowano ręczną analizę requestów HTTP oraz wybrane narzędzia automatyzujące w ograniczonym, laboratoryjnym zakresie.

## 5. Podsumowanie podatności

| ID | Podatność | Ryzyko | Status |
|---|---|---:|---|
| V-01 | SQL Injection w logowaniu | Krytyczne | Potwierdzone |
| V-02 | Reflected XSS | Wysokie | Potwierdzone |
| V-03 | Stored XSS | Wysokie | Potwierdzone |
| V-04 | Brute-force | Średnie/Wysokie | Potwierdzone |
| V-05 | Niebezpieczny upload | Wysokie | Potwierdzone |
| V-06 | IDOR w zamówieniach | Wysokie | Potwierdzone |
| V-07 | Panel admina bez kontroli roli | Krytyczne | Potwierdzone |

## 6. Szczegóły podatności

### V-01 — SQL Injection w logowaniu

**Endpoint:** `POST /api/login`  
**Opis:** Aplikacja buduje zapytanie SQL przez konkatenację danych użytkownika.  
**Dowód:** wkleić request/response lub zrzut ekranu.  
**Wpływ:** obejście uwierzytelniania.  
**Rekomendacja:** prepared statements, hashowanie haseł, neutralne komunikaty błędów.

### V-02 — Reflected XSS

**Endpoint:** `GET /api/products?q=`  
**Opis:** Parametr wyszukiwania jest renderowany jako HTML.  
**Dowód:** wkleić zrzut ekranu/DOM.  
**Wpływ:** wykonanie JavaScriptu w kontekście użytkownika.  
**Rekomendacja:** output encoding, `textContent`, CSP.

### V-03 — Stored XSS

**Endpoint:** `POST /api/products/:id/reviews`  
**Opis:** Recenzja jest zapisywana i renderowana bez sanityzacji.  
**Dowód:** wkleić zrzut ekranu.  
**Wpływ:** atak na każdego odwiedzającego produkt.  
**Rekomendacja:** sanityzacja HTML, encoding, CSP.

### V-04 — Brute-force

**Endpoint:** `POST /api/login`  
**Opis:** Brak rate limitingu i blokady konta.  
**Dowód:** liczba prób i wynik.  
**Wpływ:** możliwość odgadnięcia słabego hasła.  
**Rekomendacja:** rate limiting, blokada konta, MFA, monitoring.

### V-05 — File upload

**Endpoint:** `POST /api/upload-license-proof`  
**Opis:** Brak walidacji typu pliku i publiczny katalog uploadów.  
**Dowód:** link do przesłanego pliku.  
**Wpływ:** publikacja niepożądanych treści, XSS przez HTML.  
**Rekomendacja:** whitelist MIME, magic bytes, prywatny storage, limity.

### V-06 — IDOR

**Endpoint:** `GET /api/orders/:id`  
**Opis:** Użytkownik może odczytać zamówienie po zmianie ID.  
**Dowód:** response z cudzym zamówieniem.  
**Wpływ:** ujawnienie danych.  
**Rekomendacja:** sprawdzanie właściciela zasobu na backendzie.

### V-07 — Panel admina bez kontroli roli

**Endpoint:** `GET /api/admin/users`  
**Opis:** Endpoint wymaga tylko logowania, ale nie roli admina.  
**Dowód:** response z listą użytkowników.  
**Wpływ:** ujawnienie danych i możliwa eskalacja uprawnień.  
**Rekomendacja:** middleware `requireAdmin`, zasada najmniejszych uprawnień.

## 7. Wnioski

Aplikacja spełnia cel edukacyjny, ponieważ pokazuje typowe błędy projektowe i implementacyjne spotykane w aplikacjach webowych.

## 8. Retest

Po wdrożeniu poprawek należy powtórzyć scenariusze S1–S7 i oznaczyć każdą podatność jako:

- naprawiona,
- częściowo naprawiona,
- nadal występuje,
- niezweryfikowana.
