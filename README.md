# 🔍 Yowyob - Moteur de Recherche Local

> **Un moteur de recherche intelligent qui connecte votre communauté locale**

Yowyob est une plateforme web moderne conçue pour faciliter la découverte de commerces, services et produits dans votre région. C'est un **projet académique** développé par des étudiants en 4e année de Génie Informatique.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-18%2B-brightgreen.svg)

## 📋 Table des matières

- [Caractéristiques](#-caractéristiques)
- [Stack Technologique](#-stack-technologique)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Démarrage](#-démarrage)
- [Architecture](#-architecture)
- [Équipe](#-équipe)

## ✨ Caractéristiques

- 🔎 **Recherche Avancée** - Filtrage par type, prix, distance et catégorie
- 🗺️ **Localisation Géographique** - Recherche basée sur la proximité
- 🌙 **Mode Sombre** - Interface adaptée pour tout environnement
- 🔐 **Authentification JWT** - Sécurisation avec NextAuth.js
- 📱 **Design Responsive** - Optimisé pour tous les appareils
- ⚡ **Performance** - Built avec Next.js et React
- 🎯 **Pagination** - Navigation fluide dans les résultats
- 💾 **Cache Redis** - Optimisation des performances

## 🛠️ Stack Technologique

### Frontend
- **Framework**: Next.js 13+ (App Router)
- **Styling**: Tailwind CSS
- **Auth**: NextAuth.js
- **HTTP Client**: Custom HttpClient
- **State Management**: React Hooks + Context API

### Backend (Architecture Microservices)
- **API Gateway**: Spring Cloud Gateway (Port 8080)
- **Services**: Auth, Search, Listing, User, Geo (Ports 8081-8085)
- **Database**: PostgreSQL, Redis
- **Build**: Maven

## 📦 Prérequis

- Node.js >= 18.x
- npm ou yarn
- Git
- Backend API Gateway (http://localhost:8080)

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone <repository-url>
cd yowyob-search-frontend
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration des variables d'environnement

Créer `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

## 🎯 Démarrage

### Mode Développement

```bash
npm run dev
```

Accédez à [http://localhost:3000](http://localhost:3000)

### Mode Production

```bash
npm run build
npm run start
```

## 🏗️ Architecture du Projet

```
src/
├── app/                 # Pages (Next.js App Router)
├── components/          # Composants réutilisables
├── lib/                # API, Auth, Utils
├── store/              # État global
└── types/              # Types TypeScript
```

## 📊 Endpoints API

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/search` | GET | Recherche produits |
| `/api/products/{id}` | GET | Détail produit |
| `/api/auth/login` | POST | Connexion |
| `/api/geo/distance` | GET | Distance géo |

## 👥 Équipe

### Encadrants
- **Dr Djotio Thomas** - Professeur / Responsable
- **Dr Kutche** - Assistant / Encadrant Technique

### Développeurs (4e année Génie Informatique)
- **Matteo Owona** - Lead Developer
- **Rouchda Yampen** - Full Stack Developer
- **Rolain Tchapet** - Backend Developer
- **Heudep Brusly** - DevOps Engineer
- **Freddy Ela Foe** - Frontend Developer
- **Freddy Nzungang** - UI/UX Designer

## 📄 Licence

MIT License

## 📞 Contact

- **Email**: yowyob@example.com
- **GitHub**: [yowyob-project](https://github.com/yowyob)

---

**Mise à jour**: 16 janvier 2026 | **Version**: 1.0.0
