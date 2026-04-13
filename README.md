## TP-02 : OGSL Data Portal (Django + React)

Ce dépôt contient un projet **full‑stack** réalisé dans le cadre du cours INF37407, qui :
- **moissonne** des jeux de données sur l'état écologique du fleuve Saint-Laurent depuis des catalogues **CKAN** (provenant d'*OpenGouv Canada / open.canada.ca*)
- stocke les données en dans une base **MySQL** (pour la version locale) ou **PostgreSQL** (pour la version déployée) 
- expose un **backend Django** en **REST** (DRF) + **GraphQL** (Graphene)
- fournit un **frontend React/TypeScript** (Vite + Tailwind) avec pages protégées (auth), liste/détails datasets, stats, et moissonnage.

### Structure

- **`backend/`** : Django (apps `catalogue`, `api`, `dashboard`)
- **`frontend/`** : React + TS (Vite)

### Prérequis

- **Python 3.x**
- **Node.js 18+** (recommandé)
- **React/TypeScript 19+**
- **MySQL** (local)

### Configuration (backend)

1) Créer le fichier d’environnement :
- Créer un nouveau fichier ou adapter les variables (MySQL) de `backend/db.env` selon votre configuration

2) Installer les dépendances Python :

```bash
# Via le terminal:
cd backend
.\venv_django\Scripts\Activate
pip install -r requirements.txt
```

3) Migrations + superuser :

```bash
python manage.py migrate
python manage.py createsuperuser
```

4) Lancer le serveur Django :

```bash
python manage.py runserver
```

### Configuration (frontend)

1) Installer les dépendances :

```bash
cd frontend
npm install

# sans oublier toutes les dépendances dans Dépendances.txt
```

2) variables d’environnement Vite (copier `frontend/.env.example` vers `frontend/.env`) :
- `VITE_REST_BASE_URL` (défaut: `http://localhost:8000/api/`)
- `VITE_GRAPHQL_URL` (défaut: `http://localhost:8000/graphql/`)

3) Lancer le frontend :

```bash
npm run dev
# ou npm start
```

### Endpoints utiles (backend)

**En local (développement) :**
- **REST**: `http://localhost:8000/api/`
- **Swagger**: `http://localhost:8000/swagger/`
- **GraphQL**: `http://localhost:8000/graphql/`
- **Dashboard Django**: `http://localhost:8000/`

**En production (déployé sur Render) :**
- **REST**: `https://ogsl-k0us.onrender.com/api/`
- **Swagger**: `https://ogsl-k0us.onrender.com/swagger/`
- **GraphQL**: `https://ogsl-k0us.onrender.com/graphql/`


### Endpoints utiles (frontend)

**En local (développement) :**
- **Application**: `http://localhost:5173/`

**En production (déployé sur Vercel) :**
- **Application**: `https://ogsl.vercel.app/`

Sur le tableau Vercel du projet, configure les variables de build (Settings → Environment Variables) :
`VITE_REST_BASE_URL` = `https://ogsl-k0us.onrender.com/api/` et
`VITE_GRAPHQL_URL` = `https://ogsl-k0us.onrender.com/graphql/` pour que le front parle au backend Render après chaque déploiement.

### Déploiement backend sur Render (Travail Pratique 1)

Sur Render, **le dossier `backend/`** est déployé comme un **Web Service**.

- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
- **Start Command**: `gunicorn ogsl.wsgi:application`

Variables d’environnement Render (à définir dans le dashboard Render, **ne pas committer les secrets**) :
- **`DJANGO_SECRET_KEY`** : chaîne aléatoire longue
- **`DJANGO_DEBUG`** : `false`
- **`DJANGO_ALLOWED_HOSTS`** : ton domaine Render (ex. `ogsl-xxxx.onrender.com`)
- **`CORS_ALLOWED_ORIGINS`** : `https://ogsl.vercel.app`
- **`CSRF_TRUSTED_ORIGINS`** : `https://ogsl.vercel.app`
- **`DATABASE_URL`** : URL interne PostgreSQL fournie par Render


