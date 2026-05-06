# DistroMarket 404

**DistroMarket 404** to celowo podatna aplikacja e-commerce do nauki testów penetracyjnych aplikacji webowych.

Motyw: absurdalny sklep z Linuxami, płatnymi licencjami open-source i subskrypcją `sudo`.

> ⚠️ Projekt jest przeznaczony wyłącznie do edukacji, laboratoriów i demonstracji. Nie wdrażaj go produkcyjnie i nie wystawiaj publicznie bez izolacji.

## Podatności do pokazania

- SQL Injection
- Cross-Site Scripting, stored i reflected
- Brute-force / brak rate limitingu
- Niebezpieczny file upload
- Broken Access Control / IDOR / brak kontroli roli

## Szybkie uruchomienie

### Docker

```bash
git clone https://github.com/sruPL/distromarket-404.git
cd distromarket-404
docker compose up --build
```

Aplikacja: <http://localhost:3000>

### Bez Dockera

```bash
npm install
npm run reset-db
npm start
```

## Konta testowe

```text
admin@distromarket.local : admin123
tux@distromarket.local   : penguin
linus@distromarket.local : kernel
kasia@distromarket.local : qwerty123
```

## Dokumentacja

- [Uruchomienie i środowisko](docs/01_uruchomienie.md)
- [Plan testów penetracyjnych](docs/02_plan_testow_penetracyjnych.md)
- [Scenariusze testowe](docs/03_scenariusze_testowe.md)
- [Szablon raportu](docs/04_szablon_raportu.md)
- [Remediacja](docs/05_remediacja.md)

## Ważne

Zakres testów obejmuje wyłącznie Twoją własną instancję aplikacji, np. `localhost:3000`, maszynę lokalną lub prywatną sieć laboratoryjną.
