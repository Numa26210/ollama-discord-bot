# Ollama Discord Bot

Bot Discord avec IA (Ollama), dashboard d'administration React et API backend FastAPI.

![Stack](https://img.shields.io/badge/Python-3.10+-blue)
![Stack](https://img.shields.io/badge/React-18-61dafb)
![Stack](https://img.shields.io/badge/FastAPI-0.100+-009688)
![Stack](https://img.shields.io/badge/Ollama-Local%20AI-black)

## Fonctionnalités

- **Bot Discord** avec réponses IA via Ollama (mention ou commande `!ask`)
- **6 commandes système** : `!ping`, `!ask`, `!summarize`, `!model`, `!help`, `!clear`
- **Commandes custom** : créer des commandes texte depuis le dashboard (réponse automatique)
- **Dashboard 12 pages** avec mode jour/nuit
- **Statistiques temps réel** : messages, utilisateurs actifs, déclenchements IA
- **Gestion complète** : quotas, outils IA, workflows, automatisations, diagnostics, logs

## Stack technique

| Service | Technologies | Port |
|---------|-------------|------|
| Bot | discord.py, aiohttp, Ollama | — |
| Backend | FastAPI, SQLAlchemy, SQLite, Pydantic v2 | 8000 |
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Axios | 3000 |

## Pages du dashboard

| Page | Description |
|------|-------------|
| Vue d'ensemble | KPI, graphique volume, leaderboards |
| Statistiques | Analyse par période (7/30/90j), bar chart, pie chart |
| Utilisateurs | Table triée, recherche, messages & IA triggers par user |
| Configuration | Modèle Ollama, température, tokens, system prompt, préfixe |
| Quotas | Barres de progression, limites jour/mois, top consommateurs |
| Outils IA | Activation/désactivation des outils du bot |
| Workflows | Chaînes d'automatisation |
| Exécutions | Historique des exécutions IA (jointure User + Channel) |
| Commandes | Commandes système + création de commandes custom |
| Automatisations | Règles automatiques avec toggle |
| Diagnostics | Vérification DB, Ollama, .env, token, bot.log |
| Logs | Terminal temps réel, polling 2s, filtres par niveau |

## Structure

```
├── bot/                   # Bot Discord
│   ├── main.py            # Cog principal (commandes + on_message)
│   ├── config.py          # Configuration depuis .env
│   ├── ollama_client.py   # Client async Ollama
│   ├── message_logger.py  # Logging messages en DB
│   └── run_bot.py         # Point d'entrée
├── backend/               # API FastAPI
│   ├── run.py             # Point d'entrée uvicorn
│   └── app/
│       ├── __init__.py    # App FastAPI + CORS + routers
│       ├── database.py    # SQLAlchemy engine + session
│       ├── models/        # User, Channel, Server, MessageLog
│       ├── routes/        # 11 routers (stats, bot, settings, tools, ...)
│       └── services/      # Logique métier stats
├── frontend/              # Dashboard React
│   └── src/
│       ├── App.jsx        # Routes (react-router-dom)
│       ├── layouts/       # AppLayout (sidebar + header + outlet)
│       ├── pages/         # 12 pages
│       ├── components/    # Header, SidebarNav, StatCard, ToggleSwitch, ...
│       └── api/           # Client Axios avec tous les services
├── start.bat              # Lanceur Windows (3 services)
├── docker-compose.yml     # Déploiement Docker
├── .env.example           # Template de configuration
└── requirements.txt       # Dépendances Python
```

## Prérequis

- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.ai) installé et lancé (`ollama serve`)
- Un bot Discord créé sur le [Developer Portal](https://discord.com/developers/applications) avec les intents `MESSAGE_CONTENT`, `GUILD_MEMBERS`, `GUILDS`

## Installation

```bash
# 1. Cloner le repo
git clone <repo-url>
cd discord-bot

# 2. Environnement Python
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt

# 3. Frontend
cd frontend
npm install
cd ..

# 4. Configuration
cp .env.example .env
# Éditer .env : ajouter DISCORD_TOKEN, ajuster OLLAMA_MODEL, etc.
```

## Lancement

### Windows (un clic)

Double-cliquer sur **`start.bat`** — lance backend, bot et frontend dans 3 fenêtres.

### Manuel

```bash
# Terminal 1 — Backend API
cd backend && python run.py

# Terminal 2 — Bot Discord
cd bot && python run_bot.py

# Terminal 3 — Dashboard
cd frontend && npm run dev
```

### Docker

```bash
docker-compose up --build
```

## Commandes du bot

| Commande | Description | Cooldown |
|----------|-------------|----------|
| `!ping` | Vérifie la latence du bot | — |
| `!ask <question>` | Pose une question à l'IA Ollama | 5s |
| `!summarize [n]` | Résume les n derniers messages du canal | 10s |
| `!model [name]` | Affiche ou change le modèle Ollama actif | 3s |
| `!help` | Affiche la liste des commandes | — |
| `!clear <n>` | Supprime n messages (admin) | 5s |
| *Custom* | Commandes texte créées via le dashboard | Configurable |

## Configuration (.env)

| Variable | Description | Défaut |
|----------|-------------|--------|
| `DISCORD_TOKEN` | Token du bot Discord | *requis* |
| `OLLAMA_API_URL` | URL de l'API Ollama | `http://localhost:11434` |
| `OLLAMA_MODEL` | Modèle IA à utiliser | `mistral` |
| `OLLAMA_TIMEOUT` | Timeout requêtes Ollama (s) | `60` |
| `COMMAND_PREFIX` | Préfixe des commandes | `!` |
| `RESPONSE_MAX_TOKENS` | Tokens max par réponse IA | `256` |
| `RESPONSE_TEMPERATURE` | Température (créativité) | `0.7` |
| `HOST` | Hôte du backend | `0.0.0.0` |
| `PORT` | Port du backend | `8000` |
| `LOG_LEVEL` | Niveau de log | `INFO` |
| `ALLOWED_ORIGINS` | Origines CORS (séparées par ,) | `http://localhost:3000,...` |
| `API_KEY` | Clé API pour toggle bot | *vide = pas d'auth* |
| `VITE_SERVER_ID` | ID du serveur Discord | `1` |
| `VITE_REFRESH_INTERVAL` | Intervalle refresh dashboard (ms) | `30000` |

## API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/servers/{id}/stats/overview` | KPIs (messages, users, IA) |
| GET | `/api/servers/{id}/stats/daily-volumes` | Volume journalier |
| GET | `/api/servers/{id}/stats/leaderboards` | Top users & channels |
| GET/POST | `/api/bot/status/{id}`, `/api/bot/toggle` | Statut et toggle du bot |
| GET/PUT | `/api/settings` | Configuration .env |
| GET | `/api/settings/ollama/status` | Statut Ollama + modèles |
| GET/PATCH | `/api/tools`, `/api/tools/{id}` | Outils IA |
| GET/POST/DELETE/PATCH | `/api/commands` | Commandes (système + custom) |
| GET | `/api/logs/recent` | Logs récents |
| GET | `/api/quotas/usage` | Quotas et consommation |
| GET | `/api/workflows` | Workflows |
| GET | `/api/executions` | Historique exécutions |
| GET/PATCH | `/api/automations` | Automatisations |
| GET | `/api/diagnostics` | Vérifications système |

## Licence

MIT
