#!/usr/bin/env python3
"""
Open Stream Suite — Lanzador de Escritorio Multiplataforma
"""

import sys
from pathlib import Path

# Asegurar que app/ esté en sys.path
APP_DIR = Path(__file__).resolve().parent
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

from launcher.main import main

if __name__ == "__main__":
    sys.exit(main())
