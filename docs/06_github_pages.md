# 06. GitHub Pages

GitHub Pages można wykorzystać jako stronę informacyjną projektu, ale pełne podatności wymagają backendu.

## Dlaczego?

GitHub Pages hostuje statyczne pliki HTML/CSS/JS. Nie uruchamia backendu Node.js, nie obsługuje SQLite i nie wykona endpointów `/api/*`.

## Rekomendacja

- Repozytorium trzymaj na GitHubie.
- Lab uruchamiaj lokalnie przez Docker.
- Ewentualnie opublikuj statyczny landing page albo dokumentację przez GitHub Pages.

## Jak włączyć Pages dla dokumentacji

1. Wejdź w Settings repozytorium.
2. Otwórz Pages.
3. Wybierz branch `main` i katalog `/docs` albo GitHub Actions.
4. Zapisz.

Pamiętaj: to opublikuje dokumentację, nie backend aplikacji.
