"""
Open Stream Suite — Sistema de Internacionalización para Python y Launcher
Carga los diccionarios JSON de la carpeta languages/ y proporciona la función _().
"""

import os
import json
import locale
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = APP_DIR.parent
LANGUAGES_DIR = ROOT_DIR / "languages" if (ROOT_DIR / "languages").is_dir() else (APP_DIR / "languages")

SUPPORTED_LANGS = ("es", "en")
DEFAULT_LANG = "es"

_current_lang = DEFAULT_LANG
_translations = {}


def _detect_system_lang():
    env_lang = os.environ.get("APP_LANG")
    if env_lang and env_lang.lower() in SUPPORTED_LANGS:
        return env_lang.lower()

    try:
        loc, _ = locale.getdefaultlocale()
        if loc and loc.lower().startswith("en"):
            return "en"
    except Exception:
        pass

    return DEFAULT_LANG


def load_language(lang=None):
    global _current_lang, _translations
    if not lang or lang not in SUPPORTED_LANGS:
        lang = _detect_system_lang()

    file_path = LANGUAGES_DIR / f"{lang}.json"
    if not file_path.is_file():
        file_path = APP_DIR / "languages" / f"{lang}.json"

    if file_path.is_file():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                _translations = json.load(f)
                _current_lang = lang
                return _translations
        except Exception as e:
            print(f"[i18n] Error al cargar archivo {file_path}: {e}")

    _current_lang = DEFAULT_LANG
    return _translations


def get_current_language():
    return _current_lang


def set_current_language(lang):
    if lang in SUPPORTED_LANGS:
        load_language(lang)


def _(path, fallback=None, **kwargs):
    """
    Traduce una clave con notación de puntos, ej: _('server.badge_active')
    Interpolación opcional: _('server.clients_info', clients=2, theme='maker')
    """
    parts = path.split(".")
    val = _translations
    for p in parts:
        if isinstance(val, dict) and p in val:
            val = val[p]
        else:
            val = None
            break

    text = val if isinstance(val, str) else (fallback if fallback is not None else path)
    if kwargs:
        try:
            text = text.format(**kwargs)
        except Exception:
            pass
    return text


# Inicialización en la importación
load_language()
