# Netnook ERP

Netnook est une plateforme ERP locale destinée à un usage personnel par un seul utilisateur, sans authentification. L'application est entièrement fonctionnelle, testable en live localement, avec une interface moderne et une base de données PostgreSQL connectée.

## Stack technique

- **Frontend** : React + TypeScript + Tailwind CSS
- **Backend** : FastAPI (Python) avec SQLAlchemy + Pydantic
- **Base de données** : PostgreSQL locale
- **Outils de test** : Vite pour React, Uvicorn pour FastAPI
- **DevOps local** : Docker Compose (PostgreSQL, backend FastAPI, frontend React)

## Modules

1. Main (accueil)
2. Dashboard (KPIs, graphes, activité)
3. Projects (CRUD complet)
4. Clients (CRUD + projets liés)
5. Tasks (assignation à projets)
6. Finance (factures, transactions)
7. Analytics (graphes dynamiques)
8. Planning (événements)
9. Documents (upload et liaison)
10. HR, Inventory, Resources, AI Insights

## Fonctionnalités

- Création, modification, suppression et affichage des enregistrements en temps réel
- Mise à jour automatique de l'interface sans rechargement manuel
- Interface responsive adaptée pour écran large (desktop) et tablette
- Gestion des erreurs avec alertes UI
- Hot reload en développement

## Installation et démarrage

### Prérequis

- Docker et Docker Compose
- Git

### Installation

1. Cloner le dépôt
   ```
   git clone <repository-url>
   cd netnook
   ```

2. Lancer l'application avec Docker Compose
   ```
   docker-compose up -d
   ```

3. Accéder à l'application
   - Frontend: http://localhost:3000
   - API Backend: http://localhost:8000/docs

## Développement

Pour le développement, vous pouvez utiliser les commandes suivantes:

### Frontend

```
cd frontend
npm install
npm run dev
```

### Backend

```
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Structure du projet

```
netnook/
├── frontend/         # Application React
├── backend/          # API FastAPI
├── docker-compose.yml
├── README.md
└── todo.md
```
