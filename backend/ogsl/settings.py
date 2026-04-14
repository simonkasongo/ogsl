import os
from pathlib import Path
from urllib.parse import urlparse
from dotenv import load_dotenv
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / "db.env")

def _env_bool(name: str, default: bool = False) -> bool:
    v = os.getenv(name)
    if v is None:
        return default
    return v.strip().lower() in {"1", "true", "yes", "y", "on"}

def _env_csv(name: str) -> list[str]:
    raw = (os.getenv(name) or "").strip()
    if not raw:
        return []
    return [x.strip() for x in raw.split(",") if x.strip()]

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-key")
DEBUG = _env_bool("DJANGO_DEBUG", True)

ALLOWED_HOSTS = _env_csv("DJANGO_ALLOWED_HOSTS") or ["localhost", "127.0.0.1"]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    "corsheaders",
    "django_filters",
    "rest_framework",
    "rest_framework.authtoken",
    "drf_yasg",
    "graphene_django",
    "catalogue",
    "api",
    "dashboard",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    'django.middleware.security.SecurityMiddleware',
    "whitenoise.middleware.WhiteNoiseMiddleware",
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'ogsl.urls'

WSGI_APPLICATION = 'ogsl.wsgi.application'

def _first_non_empty_env(*keys: str) -> str:
    for key in keys:
        value = (os.getenv(key) or "").strip()
        if value:
            return value
    return ""

def _looks_like_valid_db_url(url_value: str) -> bool:
    parsed = urlparse(url_value)
    return bool(parsed.scheme and parsed.hostname)

def _postgres_from_env() -> dict:
    host = _first_non_empty_env("PGHOST", "POSTGRES_HOST")
    name = _first_non_empty_env("PGDATABASE", "POSTGRES_DB")
    user = _first_non_empty_env("PGUSER", "POSTGRES_USER")
    password = _first_non_empty_env("PGPASSWORD", "POSTGRES_PASSWORD")
    port = _first_non_empty_env("PGPORT", "POSTGRES_PORT") or "5432"

    if not (host and name and user and password):
        return {}

    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": name,
        "USER": user,
        "PASSWORD": password,
        "HOST": host,
        "PORT": port,
        "CONN_MAX_AGE": 600,
        "OPTIONS": {"sslmode": "require"},
    }

_database_url = _first_non_empty_env("DATABASE_URL", "RENDER_DATABASE_URL", "INTERNAL_DATABASE_URL")
if _database_url and _looks_like_valid_db_url(_database_url):
    DATABASES = {"default": dj_database_url.parse(_database_url, conn_max_age=600, ssl_require=True)}
else:
    _postgres_database = _postgres_from_env()
    if _postgres_database:
        DATABASES = {"default": _postgres_database}
    else:
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.mysql",
                "NAME": os.getenv("MYSQL_DB"),
                "USER": os.getenv("MYSQL_USER"),
                "PASSWORD": os.getenv("MYSQL_PASSWORD"),
                "HOST": os.getenv("MYSQL_HOST", "127.0.0.1"),
                "PORT": os.getenv("MYSQL_PORT", "3306"),
                "OPTIONS": {"charset": "utf8mb4"},
            }
        }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LOGIN_URL = "/admin/login/"

LOGIN_REDIRECT_URL = "dashboard"

LOGOUT_REDIRECT_URL = "/admin/login/"

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

STORAGES = {
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication", 
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
}


GRAPHENE = {"SCHEMA": "api.schema.schema"}

_default_cors = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "https://ogsl-68mim5wzr-simon-kasongos-projects.vercel.app",
    "https://ogsl.vercel.app",
}

CORS_ALLOWED_ORIGINS = sorted(_default_cors.union(_env_csv("CORS_ALLOWED_ORIGINS")))

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
]

CSRF_TRUSTED_ORIGINS = _env_csv("CSRF_TRUSTED_ORIGINS") or [
    "https://ogsl-68mim5wzr-simon-kasongos-projects.vercel.app",
    "https://ogsl.vercel.app",
]

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
