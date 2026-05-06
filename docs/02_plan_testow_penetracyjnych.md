# 02. Plan testów penetracyjnych

## 1. Określenie celów

Celem testów jest pokazanie procesu pentestowania aplikacji webowej na przykładzie celowo podatnego sklepu e-commerce **DistroMarket 404**.

Test ma wykazać następujące klasy podatności:

- SQL Injection,
- Cross-Site Scripting,
- brute-force / brak zabezpieczeń antyautomatyzacyjnych,
- niebezpieczny upload plików,
- Broken Access Control, w tym IDOR i brak kontroli roli.

## 2. Zakres testów

Zakres obejmuje wyłącznie lokalną lub laboratoryjną instancję aplikacji:

```text
http://localhost:3000
http://ADRES_IP_HOSTA:3000
```

Endpointy w zakresie:

```text
/api/login
/api/products
/api/products/:id/reviews
/api/orders/:id
/api/admin/users
/api/admin/users/:id/role
/api/upload-license-proof
/uploads/*
```

Poza zakresem:

- zewnętrzne serwisy,
- GitHub,
- infrastruktura uczelni,
- publiczne strony internetowe,
- cudze hosty i domeny.

## 3. Zebranie informacji

Tester powinien zebrać:

- mapę funkcji aplikacji,
- listę formularzy,
- listę endpointów API,
- role użytkowników,
- przykładowe konta,
- przepływy biznesowe: logowanie, zakupy, recenzje, upload, panel admina.

Przykładowe działania:

```text
1. Otworzyć stronę główną.
2. Przejść przez produkty, login, upload, zamówienia, panel admina.
3. Włączyć Burp Suite/ZAP jako proxy.
4. Zapisać requesty do najważniejszych endpointów.
5. Sprawdzić plik README i dokumentację projektu.
```

## 4. Wybór metodologii

Proponowana metodyka:

- **OWASP Web Security Testing Guide** jako struktura testów aplikacji webowej,
- **OWASP Top 10** jako klasyfikacja ryzyk,
- podejście black-box z elementami gray-box, bo tester zna cel edukacyjny i dokumentację labu.

## 5. Narzędzia

Rekomendowane narzędzia w Kali Linux:

- Burp Suite Community — proxy, repeater, intruder w ograniczonym zakresie,
- OWASP ZAP — proxy i pasywna analiza,
- sqlmap — potwierdzenie SQL Injection w labie,
- ffuf lub wfuzz — enumeracja i testy automatyzacji,
- Hydra — demonstracja brute-force na lokalnym endpointcie,
- curl/httpie — ręczne requesty,
- przeglądarka z DevTools.

## 6. Scenariusze ataku

Scenariusze opisano szczegółowo w pliku:

```text
docs/03_scenariusze_testowe.md
```

Minimalny zestaw:

1. SQL Injection w logowaniu.
2. Reflected XSS w wyszukiwarce.
3. Stored XSS w recenzjach.
4. Brute-force na `/api/login`.
5. File upload bez walidacji.
6. IDOR w `/api/orders/:id`.
7. Dostęp do `/api/admin/users` bez roli administratora.

## 7. Eksploatacja

Eksploatacja ma być wykonana wyłącznie w celu udowodnienia wpływu podatności.

Dla każdego przypadku tester powinien zebrać:

- endpoint,
- parametry wejściowe,
- opis kroku testowego,
- dowód w postaci zrzutu ekranu lub request/response,
- wpływ biznesowy,
- rekomendację naprawy.

## 8. Kryteria zakończenia testów

Testy można zakończyć, gdy:

- wszystkie zaplanowane scenariusze zostały wykonane albo świadomie pominięte,
- dla każdej podatności istnieje dowód wystąpienia,
- ryzyko zostało ocenione,
- przygotowano rekomendacje,
- raport zawiera podsumowanie techniczne i nietechniczne.

## 9. Analiza posteksploatacyjna

Po eksploatacji należy określić:

- jakie dane można było odczytać,
- czy możliwe było przejęcie konta,
- czy zwykły użytkownik mógł wykonać akcje admina,
- czy upload umożliwiał publikację niepożądanych plików,
- jak podatności mogą się łączyć, np. XSS + kradzież tokenu w labie.

## 10. Raport

Raport powinien zawierać:

- streszczenie dla osoby nietechnicznej,
- zakres i ograniczenia testów,
- zastosowaną metodykę,
- listę podatności,
- dowody,
- ocenę ryzyka,
- rekomendacje,
- załączniki z requestami i zrzutami ekranu.

Szablon znajduje się w:

```text
docs/04_szablon_raportu.md
```

## 11. Monitorowanie i weryfikacja

Po wdrożeniu poprawek należy wykonać retest:

- sprawdzić, czy SQLi nie działa po użyciu prepared statements,
- sprawdzić, czy XSS nie wykonuje JavaScriptu po encodingu/sanityzacji,
- sprawdzić rate limiting i blokadę kont,
- sprawdzić walidację uploadu,
- sprawdzić kontrolę właściciela zamówień i ról admina.
