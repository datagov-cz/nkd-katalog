# Komponenta katalogu národního katalogu otevřených dat

## Konfigurace
Konfiguraci je možné provést skrze proměnné prostředí, nebo soubor `.env` umístěný v `/opt/catalog/`.

K dispozici jsou následující proměnné:
- `NODE_ENV` - `production` nebo `development`. Výchozí hodnota je `production`.
- `PORT` - Port na kterém poslouchá HTTP server, není nutné nastavit pro Docker.
- `HOST` - Adresa na kterém poslouchá HTTP server, není nutné nastavit pro Docker.
- `SOLR_URL` - URL na Solr bez '/' na konci.
- `COUCHDB_URL` - URL na CouchDB bez '/' na konci.
- `HTTP_SERVE_STATIC` - Obslouží požadavky na statické zdroje z adresáře `assets`.
- `CLIENT_APPLICATION_FORM_URL` - URL pro registrační formulář aplikací.
- `CLIENT_SUGGESTION_FORM_URL` - URL pro registrační formulář návrhů ke zveřejnění dat.
- `LABEL_CACHE_RELOAD_CRON` - Volitelné, pokud je uvedeno tak v [Cron formátu](https://crontab.guru/) popisuje jak často se má re-inicializovat interní cache pro labely.
- `CLIENT_DEREFERENCE` - Volitelná šablona pro externí IRI, datasety, katalogy. Příklad `http://all-knowing.example.com/describe/?uri={}`

## Sestavení a spuštění
Po naklonování repositáře je nejprve zapotřebí nainstalovat knihovny pomocí následujícího příkazu.
```bash
npm ci
```

Dalším krokem je nastavení proměnných prostředí nebo vytvoření `.env` souboru, ten může mít třeba následující podobu.
```
NODE_ENV = "production"
PORT = "3000"
HOST = "127.0.0.1"
SOLR_URL = "http://localhost:8983/solr/applications"
COUCHDB_URL = "http://localhost:5984"
HTTP_SERVE_STATIC = "1"
CLIENT_APPLICATION_URL = ""
# Reload every 15 minutes.
LABEL_CACHE_RELOAD_CRON = "0/15 * * * *"
# Optional Matomo configuration.
CLIENT_MATOMO_URL = "http://matomo.localhost/"
CLIENT_MATOMO_SITE_ID = "1"
# Links to catalog validator.
CLIENT_CATALOG_VALIDATOR_LANDING_PAGE = "https://datagov-cz.github.io/lkod-validator/"
CLIENT_CATALOG_VALIDATOR_RUN_VALIDATION = "https://datagov-cz.github.io/lkod-validator?catalog={}"
```

Pak je již možné provést samotné spuštění.
```bash
npm run start
```

## Sestavení a spuštění pomocí Dockeru
Sestavení je možné provést pomocí Dockeru v kořeni repozitáře následujícím příkazem:
```bash
docker build -t ghcr.io/datagov-cz/nkod-application-catalog .
```

Sestavený Docker image je možné pustit pomocí:
```bash
docker run -p 3000:3000 -e "SOLR_URL={solr-url}" -e "COUCHDB_URL={couchdb-url}" -e "HTTP_SERVE_STATIC=1" -e "DATASET_CATALOG_URL={catalog-url}" ghcr.io/datagov-cz/nkod-application-catalog
```
