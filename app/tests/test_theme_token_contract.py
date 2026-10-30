#!/usr/bin/env python3
"""Contrato de tokens `--skin-*`: nadie usa un token que no existe.

El sistema de temas se rompia justo asi: un token se usaba en un sitio y se
declaraba en otro, o se renombraba en `style.css` y se dejaba el nombre viejo
en `style.default.css` (restaurar a fabrica devolvia un token fantasma).

Se comprueban tres cosas:

  1. todo `var(--skin-*)` usado esta DECLARADO en algun sitio
     (`common/archetypes.json` o el `style.css` de un tema);
  2. los nombres de token de `style.css` estan tambien en `style.default.css`
     (la copia de fabrica no se queda atras);
  3. no sobreviven nombres obsoletos (`--skin-panel-pattern`).
"""
import json
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "app"
if str(APP) not in sys.path:
    sys.path.insert(0, str(APP))

STREAMTHEMES = APP / "streamthemes"

# Nombres que se renombraron y no deben volver a aparecer.
OBSOLETE_TOKENS = ("--skin-panel-pattern",)

USE_RE = re.compile(r"var\(\s*(--skin-[a-zA-Z0-9-]+)")


def _declared_in(text: str) -> set:
    return set(re.findall(r"(?m)^\s*(--skin-[a-zA-Z0-9-]+)\s*:", text))


def _css_files() -> list:
    roots = [APP / "common", STREAMTHEMES, APP / "alerts", APP / "widgets"]
    files = []
    for root in roots:
        files.extend(sorted(root.rglob("*.css")))
    return [p for p in files if "generated" not in p.parts and ".backups" not in p.parts]


def _archetype_tokens() -> set:
    data = json.loads((APP / "common" / "archetypes.json").read_text(encoding="utf-8"))
    out = set()
    for arch in data.get("archetypes", []):
        out |= set(arch.get("tokens") or {})
        out |= set(arch.get("skin") or {})
    return out


class TestThemeTokenContract(unittest.TestCase):
    def test_1_todo_token_usado_esta_declarado(self):
        declared = _archetype_tokens()
        for path in _css_files():
            declared |= _declared_in(path.read_text(encoding="utf-8", errors="ignore"))
        missing = {}
        for path in _css_files():
            text = path.read_text(encoding="utf-8", errors="ignore")
            for token in sorted(set(USE_RE.findall(text)) - declared):
                missing.setdefault(token, []).append(str(path.relative_to(APP)))
        self.assertEqual(
            {}, missing,
            "Tokens --skin-* usados pero no declarados en ningun sitio: "
            + json.dumps(missing, indent=2, ensure_ascii=False))

    def test_2_la_copia_de_fabrica_no_pierde_tokens(self):
        themes = sorted(p for p in STREAMTHEMES.glob("*/styles/*") if p.is_dir())
        self.assertTrue(themes, "no se encontraron temas en disco")
        for theme_dir in themes:
            current = theme_dir / "style.css"
            factory = theme_dir / "style.default.css"
            self.assertTrue(current.is_file(), f"{theme_dir.name}: falta style.css")
            self.assertTrue(factory.is_file(), f"{theme_dir.name}: falta style.default.css")
            tokens_current = _declared_in(current.read_text(encoding="utf-8"))
            tokens_factory = _declared_in(factory.read_text(encoding="utf-8"))
            sobra = sorted(tokens_current - tokens_factory)
            self.assertEqual(
                [], sobra,
                f"{theme_dir.name}: `style.css` declara tokens que la copia de "
                f"fabrica no tiene (restaurar perderia: {sobra})")

    def test_3_no_quedan_tokens_obsoletos(self):
        for path in _css_files():
            text = path.read_text(encoding="utf-8", errors="ignore")
            for token in OBSOLETE_TOKENS:
                self.assertNotIn(
                    token, text,
                    f"{path.relative_to(APP)}: usa el token obsoleto {token}")


if __name__ == "__main__":
    unittest.main()
