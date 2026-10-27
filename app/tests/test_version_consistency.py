"""La versión vive en un solo sitio (`app/version.py`) y todo lo demás la sigue.

Regresión real (auditoría 1.0.2): el launcher mostraba «v1.0.0-α» y
`app/launcher/__init__.py` declaraba 1.0.1-alpha mientras el proyecto ya iba por
1.0.2-alpha, así que el usuario veía una versión antigua en la interfaz.
"""
import json
import unittest
from pathlib import Path

from server.config import BASE_DIR
from version import VERSION

APP = Path(BASE_DIR)
ROOT = APP.parent
I18N_DIRS = (APP / "languages", ROOT / "languages")


class TestVersionConsistency(unittest.TestCase):
    def test_1_launcher_toma_la_version_de_version_py(self):
        from launcher import __version__
        self.assertEqual(__version__, VERSION, "el launcher no sigue app/version.py")
        txt = (APP / "launcher" / "__init__.py").read_text(encoding="utf-8")
        self.assertNotRegex(txt, r'__version__\s*=\s*["\']1\.0\.', "versión literal en el launcher")

    def test_2_la_interfaz_del_launcher_no_tiene_versiones_literales(self):
        txt = (APP / "launcher" / "gui.py").read_text(encoding="utf-8")
        self.assertNotRegex(txt, r'v1\.0\.\d', "el launcher GUI vuelve a fijar una versión a mano")

    def test_3_diccionarios_i18n_al_dia(self):
        """Recorre el JSON en profundidad: la clave vive en `app.version`."""
        esperado = f"v{VERSION}"

        def versiones(node, path=""):
            encontradas = []
            if isinstance(node, dict):
                for k, v in node.items():
                    if k == "version" and isinstance(v, str):
                        encontradas.append((path or "/", v))
                    else:
                        encontradas.extend(versiones(v, f"{path}/{k}"))
            elif isinstance(node, list):
                for i, v in enumerate(node):
                    encontradas.extend(versiones(v, f"{path}[{i}]"))
            return encontradas

        ficheros = [f for d in I18N_DIRS if d.is_dir() for f in sorted(d.glob("*.json"))]
        self.assertTrue(ficheros, "no se encontraron diccionarios i18n")
        desfasados, revisadas = [], 0
        for f in ficheros:
            data = json.loads(f.read_text(encoding="utf-8"))
            for ruta, valor in versiones(data):
                revisadas += 1
                if valor != esperado:
                    desfasados.append(f"{f.name}{ruta}={valor}")
        self.assertGreater(revisadas, 0, "no se revisó ninguna clave de versión")
        self.assertEqual(desfasados, [], f"diccionarios i18n desactualizados ({revisadas} revisadas): {desfasados}")

    def test_4_assets_y_plantilla_de_issues(self):
        readme = (APP / "assets" / "imagencorp" / "README.md").read_text(encoding="utf-8")
        self.assertIn(f"v{VERSION}", readme, "el README de marca no refleja la versión actual")
        tmpl = (ROOT / ".github" / "ISSUE_TEMPLATE" / "bug_report.yml").read_text(encoding="utf-8")
        self.assertIn(VERSION, tmpl, "la plantilla de bugs no refleja la versión actual")


    def test_5_el_cla_esta_enlazado_en_plantillas_y_guias(self):
        for name in (".github/CONTRIBUTING.md", ".github/CONTRIBUTING.en.md",
                     ".github/PULL_REQUEST_TEMPLATE.md"):
            txt = (ROOT / name).read_text(encoding="utf-8")
            self.assertIn("CLA", txt, f"{name}: no menciona el CLA")

    def test_6_el_banner_y_las_guias_son_visibles_y_deben_estar_al_dia(self):
        """El banner de marca y los mockups de las guías se ven: deben seguir version.py.

        Regresión: el banner decía «v1.0.0-α» y las guías «v1.0.2-alpha» con el
        proyecto ya en 1.0.3.
        """
        banner = (APP / "assets" / "imagencorp" / "banner_github_header.svg").read_text(encoding="utf-8")
        self.assertIn(f"v{VERSION.replace('-alpha', '-α')}", banner,
                      "el banner de marca muestra una versión distinta a version.py")
        for name in ("INSTALACION_E_INICIO.md", "INSTALLATION_AND_STARTUP.md"):
            txt = (APP / "docs" / name).read_text(encoding="utf-8")
            self.assertIn(f"v{VERSION}", txt, f"{name}: el mockup del launcher muestra otra versión")


if __name__ == "__main__":
    unittest.main(verbosity=2)
