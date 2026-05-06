# 01. Uruchomienie i środowisko

## Cel

Uruchomić własną instancję **DistroMarket 404** i wykonać testy wyłącznie w kontrolowanym środowisku.

## Wariant A: jeden komputer, Kali jako maszyna wirtualna

To działa i jest wygodne do prezentacji.

1. Na komputerze hosta uruchom aplikację:

```bash
docker compose up --build
```

2. Backend nasłuchuje na `0.0.0.0:3000`, więc Kali w VM może połączyć się z hostem.
3. W Kali otwórz w przeglądarce adres hosta, np.:

```text
http://ADRES_IP_HOSTA:3000
```

4. Jeśli używasz VirtualBox/VMware:
   - ustaw sieć VM jako NAT + port forwarding albo Host-only Adapter,
   - sprawdź IP hosta poleceniem `ipconfig`/`ip a`, zależnie od systemu.

## Wariant B: wszystko na jednym systemie

Można testować z Kali uruchomionego jako główny system lub z narzędzi zainstalowanych lokalnie.

```bash
npm install
npm run reset-db
npm start
```

Adres:

```text
http://localhost:3000
```

## Reset bazy

```bash
npm run reset-db
```

W Dockerze:

```bash
docker compose exec distromarket npm run reset-db
```

## Konta testowe

```text
admin@distromarket.local : admin123
tux@distromarket.local   : penguin
linus@distromarket.local : kernel
kasia@distromarket.local : qwerty123
```

## Zakres bezpieczeństwa

Dozwolone:

- testy własnej instancji,
- użycie Burp Suite, ZAP, sqlmap, ffuf/wfuzz, Hydra wyłącznie na lokalnym labie,
- modyfikacja kodu i porównanie wersji podatnej z poprawioną.

Niedozwolone:

- testowanie cudzych systemów,
- publikowanie instancji jako prawdziwego sklepu,
- wystawianie aplikacji do internetu bez izolacji.
