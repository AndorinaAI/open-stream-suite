"""
Open Stream Suite — Desktop Launcher Package
Control de ciclo de vida del servidor, integración con Twitch y bandeja del sistema.
"""
import re as _re
from pathlib import Path as _Path

# La versión se toma SIEMPRE de app/version.py (fuente única de verdad): así el
# launcher no puede quedarse desactualizado respecto al resto del proyecto.
try:  # el launcher se ejecuta con app/ en sys.path
    from version import VERSION as __version__
except ImportError:  # importado como paquete desde otro contexto
    _vf = _Path(__file__).resolve().parents[1] / "version.py"
    _m = _re.search(r'VERSION\s*=\s*["\']([^"\']+)["\']', _vf.read_text(encoding="utf-8"))
    __version__ = _m.group(1) if _m else "0.0.0-desconocida"
