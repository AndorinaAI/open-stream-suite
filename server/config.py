import logging
import os
from pathlib import Path

# Configurar logging limpio
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("TallerAlerts")

# Rutas del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent
ALERTS_DIR = BASE_DIR / "alerts"
MEDIA_DIR = ALERTS_DIR / "media"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

ENV_FILE = BASE_DIR / ".env"
TOKEN_FILE = BASE_DIR / "token.json"
TRIGGERS_FILE = BASE_DIR / "triggers.json"
ROLES_FILE = BASE_DIR / "roles.json"
WIDGETS_DIR = BASE_DIR / "widgets"
WIDGETS_CONFIG_FILE = BASE_DIR / "widgets_config.json"

WIDGET_CONFIG_MAPPING = {
    "timer": WIDGETS_DIR / "timer" / "config.json",
    "chat": WIDGETS_DIR / "chat" / "config.json",
    "goal": WIDGETS_DIR / "goal" / "config.json",
    "promo": WIDGETS_DIR / "shoutout" / "config.json",
    "ticker": WIDGETS_DIR / "ticker" / "config.json",
}

WIDGET_ALIASES = {
    "shoutout": "promo",
}

# Cargar variables de entorno de .env
def load_env():
    env = {}
    if ENV_FILE.exists():
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip()
    return env

ENV_VARS = load_env()
CLIENT_ID = ENV_VARS.get("TWITCH_CLIENT_ID", "")
CLIENT_SECRET = ENV_VARS.get("TWITCH_CLIENT_SECRET", "")
REDIRECT_URI = ENV_VARS.get("TWITCH_REDIRECT_URI", "http://localhost:8080/callback")
PORT = int(ENV_VARS.get("SERVER_PORT", 8080))

LOCAL_TOKEN_FILE = BASE_DIR / ".local_token"

def get_or_create_local_token():
    """Obtiene o crea un token criptográfico local para proteger las llamadas POST del dashboard"""
    env_token = ENV_VARS.get("LOCAL_AUTH_TOKEN", "").strip()
    if env_token:
        return env_token
    if LOCAL_TOKEN_FILE.exists():
        try:
            with open(LOCAL_TOKEN_FILE, "r", encoding="utf-8") as f:
                token = f.read().strip()
                if token:
                    return token
        except Exception as e:
            logger.warning(f"No se pudo leer .local_token: {e}")

    import secrets
    token = secrets.token_hex(24)
    try:
        with open(LOCAL_TOKEN_FILE, "w", encoding="utf-8") as f:
            f.write(token)
        try:
            os.chmod(LOCAL_TOKEN_FILE, 0o600)
        except Exception:
            pass
    except Exception as e:
        logger.warning(f"No se pudo persistir .local_token: {e}")
    return token

LOCAL_AUTH_TOKEN = get_or_create_local_token()

# Scopes estrictamente necesarios para alertas, triggers, moderación, funciones y recompensas
# (Se eliminaron scopes de alto riesgo no usados: channel:manage:vips, channel:manage:broadcast, moderator:manage:chat_messages)
SCOPES = [
    "moderator:read:followers",
    "channel:read:subscriptions",
    "bits:read",
    "channel:read:redemptions",
    "channel:manage:redemptions",
    "user:read:chat",
    "user:write:chat",
    "moderator:manage:chat_settings",
    "channel:read:vips",
    "moderation:read",
    "channel:read:editors"
]
