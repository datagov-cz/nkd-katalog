# Komponenta katalogu národního katalogu otevřených dat

## Sestavení a spuštění ze zdrojového kódu

Po naklonování repositáře je nejprve zapotřebí nainstalovat knihovny pomocí následujícího příkazu.
```bash
npm ci
```

Dalším krokem je nastavení proměnných prostředí nebo vytvoření `.env` souboru.
Zde je vhodné vyjít ze šablony `.env.example`.
Šablona neobsahuje všechny hodnotu a je nutné je doplnit.
```bash
cp .env.example .env
```

Pak je již možné provést samotné spuštění.
```bash
npm --env-file-if-exists=.env run start
```

## Spuštění pomocí Dockeru

Prvním krokem je nastavení proměnných prostředí nebo vytvoření `.env` souboru.
Zde je vhodné vyjít ze šablony `.env.example`.
Šablona neobsahuje všechny hodnotu a je nutné je doplnit.
```bash
cp .env.example .env
```

Sestavený Docker image je možné pustit pomocí:
```bash
docker run -p 3000:3000 -e PORT=3000 ghcr.io/datagov-cz/nkd-catalog:latest
```
