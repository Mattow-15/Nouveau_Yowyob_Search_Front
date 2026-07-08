# YowYob Search Engine
### Moteur de recherche local intelligent pour le Cameroun

---

## 1. C'est quoi, en une phrase ?

**YowYob est un moteur de recherche qui aide les gens à trouver des produits et des services autour d'eux.**

L'utilisateur tape une question simple, par exemple :
- « Pharmacie ouverte près de moi »
- « Bon restaurant à Yaoundé »
- « Où acheter un téléphone à Douala ? »

…et l'application répond avec :
- une **liste de commerces géolocalisés** (comme Google),
- **une réponse rédigée par une intelligence artificielle** qui résume et conseille,
- une **carte interactive** pour visualiser où aller.

> En résumé : c'est un mélange entre **Google Maps**, **Google Search** et un **assistant IA**, mais conçu pour le contexte camerounais.

---

## 2. Que peut faire l'utilisateur ? (les fonctionnalités)

### 🔍 Rechercher
- Recherche classique par mots-clés.
- **Recherche intelligente (IA)** : l'application comprend le sens de la question et rédige une vraie réponse, pas juste une liste de liens.
- Suggestions automatiques pendant qu'on tape.
- Recherche « **près de moi** » avec un rayon (ex. dans un rayon de 10 km).

### 📍 Se repérer
- Carte interactive avec les commerces marqués dessus.
- Calcul de **distance** et d'**itinéraire** (voiture, marche, vélo).
- Détection automatique de la ville de l'utilisateur (via son adresse internet).

### 👤 Avoir un compte
- Inscription / connexion par email ou via **Google**.
- Profil personnel modifiable.
- Historique des recherches sauvegardé.

### 🏪 Vendre (espace marchand)
- Tableau de bord pour les commerçants.
- Créer et gérer ses annonces de produits/services.
- Système d'**avis et de notes** sur les commerces.

### 🔔 Être informé
- Notifications par email lorsqu'un nouvel élément est ajouté.

---

## 3. Comment ça marche ? (l'architecture, simplement)

Plutôt qu'un seul gros programme, l'application est découpée en **petits services spécialisés** qui travaillent ensemble. Chacun a **un seul rôle**, comme les employés d'une entreprise. Cela rend le système plus solide et plus facile à faire évoluer.

### Les services et leur rôle

| Service | Son rôle (en clair) |
|---|---|
| **Porte d'entrée** (API Gateway) | Le réceptionniste : reçoit toutes les demandes et les oriente vers le bon service. |
| **Service d'authentification** | Gère les inscriptions, connexions et mots de passe. |
| **Service utilisateurs** | Gère les profils et l'historique des recherches. |
| **Service d'annonces** | Stocke les commerces, produits et avis. |
| **Service de recherche** | Le cerveau : trouve les résultats et fait appel à l'IA pour rédiger les réponses. |
| **Service de géolocalisation** | Calcule les positions, distances et itinéraires. |
| **Robot collecteur** (Crawler) | Va chercher automatiquement les commerces sur internet pour remplir la base. |
| **Service de notifications** | Envoie les emails. |
| **Service d'IA / sémantique** | Transforme les textes en données que l'ordinateur peut « comprendre » par le sens. |

### Le parcours d'une recherche, étape par étape

```
1. Le ROBOT collecte automatiquement les commerces (Google Places, etc.)
              │
2. Les commerces sont enregistrés dans le SERVICE D'ANNONCES
              │
3. Le SERVICE DE RECHERCHE les classe et les rend "trouvables"
              │
4. L'utilisateur tape sa question sur le SITE WEB
              │
5. L'INTELLIGENCE ARTIFICIELLE (Google Gemini) rédige une réponse claire
              │
6. Résultats + réponse IA + carte → affichés à l'utilisateur
```

### Les technologies clés (pour information)
- **Site web** : Next.js / React (interface moderne et rapide).
- **Services** : Java / Spring Boot.
- **Moteur de recherche** : Elasticsearch (recherche ultra-rapide).
- **Intelligence artificielle** : Google Gemini (réponses rédigées).
- **Bases de données** : PostgreSQL, Redis.
- **Communication entre services** : Kafka et RabbitMQ (comme une messagerie interne).
- **Cartes** : Leaflet / OpenStreetMap.

---

## 4. Ce qui fonctionne déjà ✅

- La recherche classique **et** la recherche intelligente (IA).
- La géolocalisation et la carte interactive.
- Le robot qui collecte automatiquement les commerces.
- L'inscription / connexion (email + Google).
- L'affichage des résultats façon Google, avec le panneau de réponse IA.
- Les profils utilisateurs et l'historique.
- L'architecture complète des 9 services qui communiquent entre eux.

---

## 5. Ce qui reste à faire 🔧

### Chantier principal : l'intégration « Kernel »
La connexion avec le système central **Kernel** (l'annuaire officiel des organisations) n'est **pas encore terminée**. Il reste à :
- finir le branchement technique (une partie du code est encore un brouillon volontairement désactivé) ;
- confirmer avec l'équipe Kernel **3 points** : l'adresse exacte de leur service, le format des données échangées, et le mode d'authentification ;
- renseigner les clés et adresses de connexion.

### Fonctionnalités à compléter
- **Suppression** d'un commerce de l'index de recherche (non implémentée).
- Pages **Admin** et **Produits** du site : encore « en construction ».
- **Formulaire de contact** : affiche un succès mais n'envoie pas encore l'email.
- **Espace marchand** : les boutons « ajouter / modifier une annonce » ne sont pas encore actifs, et certaines statistiques sont fictives.
- Certaines pages utilisent des **données d'exemple** en attendant le branchement complet.

### Non démarré (pistes futures)
- Messagerie / chat entre utilisateurs.
- Système de favoris complet.
- Paiement en ligne.
- Vérification des vendeurs.
- Application mobile.

---

## 6. En résumé pour la soutenance

| | |
|---|---|
| **✅ Fonctionnel** | Recherche classique + IA, géolocalisation, carte, robot collecteur, authentification, 9 services qui communiquent. |
| **🔶 À finaliser** | Intégration Kernel, quelques fonctions du site (admin, marchand, contact). |
| **❌ À venir** | Messagerie, favoris, paiement, mobile. |

> **Le cœur du projet — chercher, comprendre la demande grâce à l'IA, et géolocaliser les résultats — est opérationnel.** Le travail restant concerne surtout le branchement final avec le système central de l'organisation et la finition de quelques écrans.
