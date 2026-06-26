# YowYob Search Engine — Stack technique complète

Liste de **toutes les technologies** utilisées dans le projet, avec leurs versions et leur rôle, organisées par couche.

---

## 🗂️ Vue d'ensemble

| Couche | Technologies principales |
|---|---|
| **Frontend (site web)** | Next.js, React, TypeScript, TailwindCSS, Leaflet |
| **Backend (services)** | Java, Spring Boot, Spring Cloud Gateway |
| **Service d'IA / embeddings** | Python, FastAPI, Sentence-Transformers |
| **Intelligence artificielle** | Google Gemini (réponses), MiniLM (sémantique) |
| **Recherche** | Elasticsearch |
| **Bases de données** | PostgreSQL, Redis |
| **Messagerie inter-services** | Apache Kafka, RabbitMQ |
| **Cartographie & géo** | Leaflet, OpenStreetMap/Nominatim, MaxMind GeoIP2 |
| **Conteneurisation** | Docker, Docker Compose |
| **Supervision (monitoring)** | Prometheus, Grafana, Loki, Tempo |

---

## 1. Frontend — Site web

| Technologie | Version | Rôle |
|---|---|---|
| **Next.js** | 15.0.0 | Framework du site web (rendu des pages, routage) |
| **React** | 19.0.0 | Bibliothèque d'interface (composants) |
| **React DOM** | 19.0.0 | Affichage des composants React dans le navigateur |
| **TypeScript** | 5 | Langage (JavaScript typé, plus fiable) |
| **TailwindCSS** | 3.4.0 | Mise en forme / design (styles) |
| **Zustand** | 4.4.7 | Gestion de l'état de l'application (mémoire de l'interface) |
| **NextAuth (Auth.js)** | 5.0.0-beta + @auth/core 0.41.0 | Connexion / sessions (email + Google) |
| **TanStack React Query** | 5.17.0 | Récupération et mise en cache des données |
| **Leaflet** | 1.9.4 | Carte interactive |
| **React-Leaflet** | 4.2.1 | Intégration de Leaflet dans React |
| **Lucide React** | 0.562.0 | Icônes |
| **Sonner** | 2.0.7 | Notifications visuelles (toasts) |
| **date-fns** | 3.3.1 | Gestion des dates |
| **clsx / tailwind-merge** | 2.1.1 / 2.2.0 | Utilitaires de styles |

**Outils de développement :** ESLint 9, Prettier 3.1.0, PostCSS 8, Autoprefixer 10.0.1.

---

## 2. Backend — Microservices

**Langage & framework de base :** **Java** + **Spring Boot**.

| Service | Spring Boot | Java |
|---|---|---|
| API Gateway | 3.2.0 | 17 |
| Auth-Service | 3.2.0 | 17 |
| User-Service | 3.2.0 | 17 |
| Listing-Service | 3.2.0 | 17 |
| Search-Service | 3.2.0 | 17 |
| Geo-Service | 3.2.0 | 17 |
| Notification-Service | 3.2.0 | 17 |
| Crawler (reconfiguré) | 3.4.5 | 21 |
| Monolith (version unifiée) | 4.0.5 | 21 |

### Bibliothèques (modules Spring) utilisées
| Module | Rôle |
|---|---|
| **Spring Cloud Gateway** | Porte d'entrée / routage des requêtes |
| **Spring Web** | API REST classiques |
| **Spring WebFlux** | API réactives (asynchrones, performantes) — utilisé par Search & Geo |
| **Spring Data JPA** | Accès aux bases de données relationnelles (PostgreSQL) |
| **Spring Data Elasticsearch** | Accès au moteur de recherche |
| **Spring Data Redis** | Cache / sessions |
| **Spring Security** | Sécurité et authentification |
| **Spring AMQP** | Communication via RabbitMQ |
| **Spring Mail** | Envoi d'emails (notifications) |
| **Spring Validation** | Validation des données reçues |
| **Spring Actuator** | Endpoints de santé et de supervision |

### Autres bibliothèques notables
| Bibliothèque | Rôle |
|---|---|
| **JJWT (jjwt-api/impl/jackson)** | Création et validation des jetons JWT (connexion sécurisée) |
| **Google API Client** | Authentification Google (vérification du jeton) |
| **MaxMind GeoIP2** | Localisation à partir de l'adresse IP |
| **JSoup** | Extraction de données de pages web (crawler) |
| **Resilience4j** | Tolérance aux pannes (circuit breaker) |
| **Micrometer + Brave** | Mesures et traçage des requêtes |
| **Micrometer Prometheus** | Export des métriques vers Prometheus |

---

## 3. Service d'IA / Embeddings — Python

| Technologie | Version | Rôle |
|---|---|---|
| **Python** | 3.x | Langage du service |
| **FastAPI** | 0.111.0 | Framework de l'API |
| **Uvicorn** | 0.29.0 | Serveur qui exécute l'API |
| **Sentence-Transformers** | 3.0.1 | Transformation des textes en vecteurs (sémantique) |
| **Pydantic** | 2.7.1 | Validation des données |
| **Modèle : paraphrase-multilingual-MiniLM-L12-v2** | — | Modèle IA multilingue (384 dimensions, 50+ langues) |

---

## 4. Intelligence artificielle

| Technologie | Rôle |
|---|---|
| **Google Gemini 1.5 Flash** | Rédige les réponses en langage naturel (recherche IA / RAG) |
| **MiniLM (Sentence-Transformers)** | Comprend le « sens » des textes pour la recherche sémantique |
| **Approche RAG** (Retrieval-Augmented Generation) | Combine les résultats de recherche réels + l'IA pour répondre avec des sources |

---

## 5. Données, recherche & messagerie (Infrastructure)

| Technologie | Version (image Docker) | Rôle |
|---|---|---|
| **PostgreSQL** | 17-alpine | Base de données principale (comptes, annonces, profils) |
| **Elasticsearch** | 8.11.0 | Moteur de recherche rapide |
| **Redis** | 7-alpine | Cache et sessions |
| **Apache Kafka** | Confluent 7.0.1 | Flux d'événements entre services (crawler → annonces) |
| **Zookeeper** | Confluent 7.0.1 | Coordination de Kafka |
| **RabbitMQ** | 3-management-alpine | Messagerie (annonces → recherche & notifications) |

---

## 6. Cartographie & Géolocalisation

| Technologie | Rôle |
|---|---|
| **Leaflet / React-Leaflet** | Affichage de la carte interactive |
| **OpenStreetMap** | Fond de carte (données géographiques libres) |
| **Nominatim** | Conversion adresse ↔ coordonnées (géocodage) |
| **MaxMind GeoIP2** | Localisation par adresse IP |

---

## 7. Sources de données externes (collecte)

| Source | Rôle |
|---|---|
| **Google Places API** | Récupère les commerces (restaurants, pharmacies, etc.) |
| **Kernel API** | Annuaire central des organisations (intégration en cours) |
| **BusinessBook API** | Source alternative de données commerciales |

---

## 8. Déploiement & Supervision

| Technologie | Rôle |
|---|---|
| **Docker** | Conteneurisation de chaque service |
| **Docker Compose** | Orchestration de l'ensemble (lancement de tout en une commande) |
| **Prometheus** | Collecte des métriques (optionnel) |
| **Grafana** | Tableaux de bord visuels (optionnel) |
| **Loki + Promtail** | Centralisation des logs (optionnel) |
| **Tempo** | Traçage des requêtes (optionnel) |
| **Maven** | Construction (build) des services Java |
| **Git** | Gestion de versions du code |

---

## Résumé en une phrase

> Le projet repose sur **Java/Spring Boot** côté serveur (9 microservices), **Next.js/React** côté site web, **Python/FastAPI** pour l'IA sémantique, **Elasticsearch** pour la recherche, **Google Gemini** pour les réponses intelligentes, **PostgreSQL + Redis** pour les données, **Kafka + RabbitMQ** pour la communication interne, et **Docker** pour faire tourner le tout ensemble.
