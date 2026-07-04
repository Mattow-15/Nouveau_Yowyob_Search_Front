# Variables d'environnement — YowYob Search Engine

Référence complète des variables d'environnement du projet (frontend + backend),
recensées depuis `.env.local`, `docker-compose.yml` et tous les `application*.yml`.

## Comment elles sont chargées

| Couche | Fichier | Mécanisme |
|---|---|---|
| **Frontend** (Next.js) | `YowYob-Search-Frontend/.env.local` | Lu au build/run. Les variables `NEXT_PUBLIC_*` sont **exposées au navigateur**, les autres restent côté serveur. |
| **Backend** (docker-compose) | `YowYob-Search-BackEnd/.env` | `docker compose` substitue les `${VAR}` du `docker-compose.yml`. |
| **Backend** (Spring, par service) | `src/main/resources/application*.yml` | Syntaxe `${VAR:valeur_par_défaut}` → la valeur par défaut s'applique si la variable n'est pas fournie. |

> La plupart des variables backend **ont une valeur par défaut** (colonne « Défaut »).
> Seules les **clés/secrets** sont réellement à renseigner pour un usage complet.

---

## 1. Frontend (`YowYob-Search-Frontend/.env.local`)

| Variable | Rôle | Valeur locale | Requis ? |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL de base de l'API gateway (exposée navigateur) | `http://localhost:8080` | **Oui** |
| `NEXT_PUBLIC_API_BASE_URL` | Alias de repli de `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Non |
| `NEXTAUTH_URL` | URL publique du front pour NextAuth | `http://localhost:3000` | Oui (si login) |
| `NEXTAUTH_SECRET` | Secret de signature des sessions NextAuth | _(chaîne aléatoire)_ | Oui (si login) |
| `GOOGLE_CLIENT_ID` | OAuth Google — côté serveur | _(client ID Google)_ | Si login Google |
| `GOOGLE_CLIENT_SECRET` | OAuth Google — secret | _(secret Google)_ | Si login Google |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | ⚠️ présent dans `.env.local` mais **non référencé dans le code** (legacy) | — | Non |

### Connexion au backend — proxy serveur (variables côté serveur, NON exposées)

Le front peut taper le backend de deux façons (`src/lib/api/http-client.ts`) :

- **Mode PROXY (défaut)** — si `NEXT_PUBLIC_API_URL` est **vide**, le front appelle sa
  propre origine `/api/gateway/...`, et la route serveur
  `src/app/api/gateway/[...path]/route.ts` relaie vers `BACKEND_API_URL` en injectant
  les clés. Les clés **ne touchent jamais le navigateur** et il n'y a pas de CORS.
- **Mode DIRECT** — si `NEXT_PUBLIC_API_URL` est une URL absolue (`http…`), le front
  l'appelle directement (utile pour le back local sans proxy).

| Variable | Rôle | Exemple | Requis ? |
|---|---|---|---|
| `BACKEND_API_URL` | Cible réelle du proxy (gateway back) | `https://search.yowyob.com` | Mode proxy |
| `AUTH_BACKEND_URL` | Cible kernel dédiée aux routes `/api/auth/*` | `https://votre-kernel` | Connexion réelle |
| `BACKEND_API_CLIENT_ID` | Injecté en en-tête **`X-Client-Id`** (identité machine Kernel) | _(fourni par l'admin Kernel)_ | Si le back l'exige |
| `BACKEND_API_KEY` | Injecté en en-tête **`X-Api-Key`** (identité machine Kernel) | _(fourni par l'admin Kernel)_ | Si le back l'exige |
| `BACKEND_API_TENANT_ID` | Injecté en en-tête **`X-Tenant-Id`** (optionnel, schéma Kernel) | _(fourni par l'admin Kernel)_ | Si le back l'exige |

> `search.yowyob.com` renvoie **401 `Missing X-Client-Id or X-Api-Key`** sans ces clés.

> Repli en dur si rien n'est défini : proxy `/api/gateway` → `http://localhost:8080`
> (`src/lib/api/http-client.ts` + `route.ts`).
> Pour **juste afficher des résultats de recherche** en local, seule `NEXT_PUBLIC_API_URL`
> (mode direct) **ou** `BACKEND_API_URL` (mode proxy) est indispensable.

---

## 2. Backend — par thème

Valeur par défaut entre parenthèses dans la description quand utile.

### 2.1 Ports des services

| Variable | Service | Défaut |
|---|---|---|
| `PORT` | api-gateway | `8080` |
| `PORT` | auth-service | `8081` |
| `PORT` | listing-service | `8083` |
| `PORT` | user-service | `8084` |
| `SERVER_PORT` | crawler-service | `8086` |

> search-service (`8082`), geo (`8085`), notification (`8087`) et embeddings (`8000`)
> sont fixés dans leur config / `network_mode: host`.

### 2.2 Routage de l'API gateway (URLs des services en aval)

| Variable | Défaut (réseau docker) |
|---|---|
| `AUTH_SERVICE_URL` | `http://auth-service:8081` |
| `SEARCH_SERVICE_URL` | `http://search-final:8082` |
| `GEO_SERVICE_URL` | `http://geo-final:8085` |
| `USER_SERVICE_URL` | `http://user-service:8084` |
| `LISTING_SERVICE_URL` | `http://listing-service:8083` |
| `NOTIFICATION_SERVICE_URL` | `http://notification-service:8087` |
| `CRAWLER_SERVICE_URL` | `http://crawler-service:8086` |

### 2.3 Base de données PostgreSQL

| Variable | Rôle | Défaut |
|---|---|---|
| `SPRING_DATASOURCE_URL` | URL JDBC générique | `jdbc:postgresql://localhost:5432/yowyob_*` |
| `SPRING_DATASOURCE_USERNAME` | Utilisateur | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | Mot de passe | `postgres` |
| `SPRING_DATASOURCE_AUTH_URL` / `_USERNAME` / `_PASSWORD` | DB `yowyob_auth` (auth-service) | `…/yowyob_auth`, `postgres`, `postgres` |
| `SPRING_DATASOURCE_LISTINGS_URL` / `_USERNAME` / `_PASSWORD` | DB `yowyob_listings` (listing-service) | `…/yowyob_listings`, `postgres`, `postgres` |
| `SPRING_DATASOURCE_USERS_URL` / `_USERNAME` / `_PASSWORD` | DB `yowyob_users` (user-service) | `…/yowyob_users`, `postgres`, `postgres` |

### 2.4 Redis

| Variable | Rôle | Défaut |
|---|---|---|
| `SPRING_REDIS_HOST` / `SPRING_DATA_REDIS_HOST` | Hôte Redis | `localhost` (`yowyob-redis` en docker) |
| `SPRING_REDIS_PORT` / `SPRING_DATA_REDIS_PORT` | Port | `6379` |
| `SPRING_REDIS_PASSWORD` / `SPRING_DATA_REDIS_PASSWORD` | Mot de passe | _(vide)_ |
| `SPRING_REDIS_SSL_ENABLED` | TLS Redis | `false` |

### 2.5 RabbitMQ

| Variable | Rôle | Défaut |
|---|---|---|
| `SPRING_RABBITMQ_HOST` / `RABBITMQ_HOST` | Hôte | `localhost` (`rabbitmq` en docker) |
| `SPRING_RABBITMQ_PORT` / `RABBITMQ_PORT` | Port | `5672` |
| `SPRING_RABBITMQ_USERNAME` / `RABBITMQ_USERNAME` | Utilisateur | `guest` |
| `SPRING_RABBITMQ_PASSWORD` / `RABBITMQ_PASSWORD` | Mot de passe | `guest` |
| `RABBITMQ_DEFAULT_USER` / `RABBITMQ_DEFAULT_PASS` | Identifiants du conteneur RabbitMQ | `guest` / `guest` |

### 2.6 Kafka

| Variable | Rôle | Défaut |
|---|---|---|
| `SPRING_KAFKA_BOOTSTRAP_SERVERS` / `KAFKA_BOOTSTRAP_SERVERS` | Brokers | `kafka:9092` / `localhost:9092` |
| `KAFKA_SECURITY_PROTOCOL` | Protocole | `PLAINTEXT` |
| `KAFKA_SASL_MECHANISM` | Mécanisme SASL | _(vide)_ |
| `KAFKA_SASL_JAAS_CONFIG` | Config JAAS | _(vide)_ |
| `KAFKA_SSL_ENDPOINT_ID_ALGO` | Algo de vérif TLS | `https` |
| `SPRING_KAFKA_CONSUMER_PROPERTIES_SPRING_JSON_*` | Désérialisation JSON (trusted packages, type headers, default type) | _(défini en docker-compose)_ |

### 2.7 Elasticsearch

| Variable | Rôle | Défaut |
|---|---|---|
| `SPRING_ELASTICSEARCH_URIS` | URI(s) Elasticsearch | `http://localhost:9200` (`http://yowyob-elasticsearch:9200` en docker) |
| `ELASTICSEARCH_URL` | Variante utilisée par le crawler | _(idem)_ |

### 2.8 Sécurité / JWT

| Variable | Rôle | Défaut |
|---|---|---|
| `JWT_SECRET` | Secret JWT (gateway, auth) | `yowyob-super-secret-key-…` ⚠️ à changer en prod |
| `YOWYOB_JWT_SECRET` | Secret JWT (search-service) | `yowyob-super-secret-key-…` ⚠️ à changer en prod |
| `JWT_EXPIRATION` | Durée de vie token (ms) | `3600000` (1 h) |
| `JWT_REFRESH_EXPIRATION` | Durée de vie refresh token (ms) | `604800000` (7 j) |
| `CORS_ALLOWED_ORIGINS` | Origines CORS autorisées | `http://localhost:3000,https://yowyob.com` |

### 2.9 APIs externes — IA & Google

| Variable | Rôle | Défaut | Requis pour |
|---|---|---|---|
| `GROQ_API_KEY` | LLM Groq (recherche IA `/api/search/ai`, `/ai-mode`) | _(vide)_ | Recherche IA |
| `GROQ_MODEL` | Modèle Groq | `llama-3.3-70b-versatile` | — |
| `GEMINI_API_KEY` | LLM Gemini (repli) | _(vide)_ | Repli IA |
| `GEMINI_MODEL` | Modèle Gemini | `gemini-2.0-flash` | — |
| `GOOGLE_PLACES_API_KEY` | Crawler Google Places (ingestion) | _(vide)_ | Crawling |
| `GOOGLE_CLIENT_ID` | OAuth Google (auth-service) | _(client ID par défaut)_ | Login Google |

### 2.10 Intégration Kernel

| Variable | Rôle | Défaut |
|---|---|---|
| `KERNEL_AUTH_ENABLED` | Active la vérification d'auth Kernel | `false` |
| `KERNEL_API_URL` | URL de l'API Kernel | `http://localhost:8090` |
| `KERNEL_JWKS_URI` | URI JWKS (validation des tokens) | `http://localhost:8090/.well-known/jwks.json` |
| `KERNEL_CLIENT_ID` | Identifiant client | `yowyob-search` |
| `KERNEL_API_KEY` | Clé API Kernel | `placeholder-key` |
| `KERNEL_TENANT_ID` | Identifiant tenant | `placeholder-tenant` |
| `KERNEL_ORGANIZATION_IDS` | Liste d'IDs d'organisations à synchroniser | _(vide)_ |
| `KERNEL_SYNC_CRON` | Planification de la synchro Kernel | `0 0 */6 * * *` |

### 2.11 Crawler & BusinessBook

| Variable | Rôle | Défaut |
|---|---|---|
| `SCRAPER_GOOGLELOCALMOCK_ENABLED` | Active le mock du scraper Google Local | _(défini en docker-compose)_ |
| `BUSINESSBOOK_BASE_URL` | URL du service BusinessBook | `http://localhost:8095` |
| `BUSINESSBOOK_SERVICE_NAME` | Nom de service BusinessBook | `business-book` |
| `BUSINESSBOOK_S2S_TOKEN` | Token service-to-service | `placeholder-jwt` |
| `BUSINESSBOOK_SYNC_CRON` | Planification de la synchro BusinessBook | `0 */5 * * * *` |

### 2.12 Geo (fournisseurs externes)

| Variable | Rôle | Défaut |
|---|---|---|
| `APP_NOMINATIM_URL` | Géocodage Nominatim | `https://nominatim.openstreetmap.org` |
| `APP_NOMINATIM_USER_AGENT` | User-Agent requis par Nominatim | `Yowyob-Service-1.0 (contact@yowyob.com)` |
| `APP_IPAPI_URL` | Géolocalisation par IP | `https://ipapi.co` |

### 2.13 Mail (auth / notification)

| Variable | Rôle | Défaut |
|---|---|---|
| `MAIL_HOST` | Serveur SMTP | `smtp.gmail.com` |
| `MAIL_PORT` | Port SMTP | `587` |
| `MAIL_USERNAME` | Identifiant SMTP | _(vide)_ |
| `MAIL_PASSWORD` | Mot de passe SMTP | _(vide)_ |

### 2.14 Observabilité

| Variable | Rôle | Défaut |
|---|---|---|
| `ZIPKIN_ENDPOINT` | Endpoint de traçage Zipkin | `http://tempo:9411/api/v2/spans` |
| `MANAGEMENT_ZIPKIN_TRACING_ENDPOINT` | Idem (clé Spring Boot 3) | `http://tempo:9411/api/v2/spans` |

### 2.15 Divers (runtime conteneurs)

| Variable | Rôle | Défaut |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | Profil Spring actif | `docker` |
| `JAVA_OPTS` | Options JVM (mémoire) | `-Xmx256m -Xms128m` (selon service) |

---

## 3. Templates prêts à copier

### `YowYob-Search-Frontend/.env.local`

```dotenv
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-moi-par-une-chaine-aleatoire

# --- Connexion backend ---
# Mode PROXY (recommandé) : laisser NEXT_PUBLIC_API_URL vide.
# NEXT_PUBLIC_API_URL=http://localhost:8080   # ← décommenter pour le back LOCAL en direct
BACKEND_API_URL=https://search.yowyob.com
BACKEND_API_CLIENT_ID=        # ← X-Client-Id Kernel (à renseigner)
BACKEND_API_KEY=              # ← X-Api-Key Kernel (à renseigner)
BACKEND_API_TENANT_ID=        # ← X-Tenant-Id Kernel (si exigé)

# Google OAuth (optionnel — login Google)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### `YowYob-Search-BackEnd/.env`

```dotenv
# --- Clés IA (recherche IA) ---
GROQ_API_KEY=
GEMINI_API_KEY=

# --- Crawler ---
GOOGLE_PLACES_API_KEY=
SCRAPER_GOOGLELOCALMOCK_ENABLED=true

# --- Intégration Kernel (auth désactivée par défaut → facultatif) ---
KERNEL_API_URL=http://api.10.50.30.102.nip.io
KERNEL_CLIENT_ID=
KERNEL_API_KEY=
KERNEL_TENANT_ID=
KERNEL_ORGANIZATION_IDS=

# --- À durcir en production ---
# JWT_SECRET=...
# YOWYOB_JWT_SECRET=...
# SPRING_DATASOURCE_PASSWORD=...
```

> **Recherche basique** (données déjà indexées dans Elasticsearch) : aucune clé
> n'est obligatoire, les valeurs par défaut suffisent.
> **Recherche IA** : `GROQ_API_KEY` (et/ou `GEMINI_API_KEY`).
> **Crawling de nouvelles données** : `GOOGLE_PLACES_API_KEY`.
> **Auth Kernel** : variables `KERNEL_*` + `KERNEL_AUTH_ENABLED=true`.
