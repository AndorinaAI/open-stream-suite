"""Escrituras atómicas y locks por ruta para los JSON/CSS de Open Stream Suite.

Los servicios escribían directamente sobre el archivo final. Un corte a mitad de
`json.dump` dejaba un JSON truncado y dos peticiones concurrentes podían pisarse.
"""
from __future__ import annotations

import json
import os
import tempfile
import threading
from pathlib import Path

_LOCKS = {}
_LOCKS_GUARD = threading.Lock()


def lock_for(path) -> threading.RLock:
    """Lock reentrante por ruta absoluta (el mismo archivo comparte lock)."""
    key = str(Path(path).resolve())
    with _LOCKS_GUARD:
        return _LOCKS.setdefault(key, threading.RLock())


def atomic_write_text(path, text: str) -> None:
    """Escribe texto en el mismo directorio y reemplaza de forma atómica."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with lock_for(path):
        fd, tmp = tempfile.mkstemp(dir=str(path.parent), prefix=f".{path.name}.tmp.")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                f.write(text)
            os.replace(tmp, path)
        finally:
            if os.path.exists(tmp):
                try:
                    os.unlink(tmp)
                except OSError:
                    pass


def atomic_write_json(path, data) -> None:
    atomic_write_text(path, json.dumps(data, indent=2, ensure_ascii=False))


def ensure_private_file(path, mode: int = 0o600) -> None:
    """Reduce un estado persistente a lectura/escritura del propietario."""
    try:
        Path(path).chmod(mode)
    except OSError:
        pass
