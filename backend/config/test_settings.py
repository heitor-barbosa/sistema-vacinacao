from .settings import *  # noqa: F403

# Somente testes: não conecta nem cria bancos no PostgreSQL configurado no .env.
SECRET_KEY = "chave-exclusiva-dos-testes-locais"
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
