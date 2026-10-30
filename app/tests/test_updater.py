"""
Tests unitarios para launcher/updater.py
Verifica el diagnóstico de actualizaciones, la detección de versiones semánticas
y la preservación de configuraciones del usuario durante la actualización.
"""

import os
import sys
import json
import unittest
import tempfile
import subprocess
from pathlib import Path

# Asegurar import de app
TEST_DIR = Path(__file__).resolve().parent
APP_DIR = TEST_DIR.parent
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

from launcher.updater import UpdateManager, parse_version, is_newer_version


class TestUpdaterLogic(unittest.TestCase):
    def test_version_parsing_and_comparison(self):
        """Verifica que el comparador semántico funcione correctamente con alphas, betas y estables"""
        # alpha < beta < rc < estable
        self.assertTrue(is_newer_version("1.0.1-alpha", "1.0.0-alpha"))
        self.assertTrue(is_newer_version("1.0.1", "1.0.1-alpha"))
        self.assertTrue(is_newer_version("1.0.0-beta", "1.0.0-alpha"))
        self.assertTrue(is_newer_version("1.0.0-rc1", "1.0.0-beta"))
        self.assertTrue(is_newer_version("1.0.0", "1.0.0-rc1"))
        self.assertTrue(is_newer_version("1.1.0", "1.0.9"))
        self.assertTrue(is_newer_version("2.0.0", "1.9.9"))

        # No es más nueva si es igual o menor
        self.assertFalse(is_newer_version("1.0.0-alpha", "1.0.0-alpha"))
        self.assertFalse(is_newer_version("1.0.0-alpha", "1.0.1-alpha"))
        self.assertFalse(is_newer_version("1.0.0-alpha", "1.0.0"))

    def test_apply_update_preserves_user_configs(self):
        """
        Simula un repositorio Git remoto y local, modifica configs locales de usuario,
        y comprueba que apply_update realice reset --hard sin fallar y preserve configs.
        """
        with tempfile.TemporaryDirectory() as td:
            remote_root = Path(td) / "remote_repo"
            local_root = Path(td) / "local_repo"
            remote_root.mkdir()

            # Configurar repo remoto (origin)
            subprocess.run(["git", "init", "-b", "main"], cwd=str(remote_root), check=True, stdout=subprocess.DEVNULL)
            subprocess.run(["git", "config", "user.email", "test@updater.com"], cwd=str(remote_root), check=True)
            subprocess.run(["git", "config", "user.name", "Updater Test"], cwd=str(remote_root), check=True)

            remote_app = remote_root / "app"
            remote_app.mkdir()

            # Archivos iniciales en commit 1
            themes_state_file = remote_app / "themes_state.json"
            fusions_file = remote_app / "fusions.json"
            version_file = remote_app / "version.py"
            code_file = remote_app / "code.py"

            with open(version_file, "w", encoding="utf-8") as f:
                f.write('VERSION = "1.0.0-alpha"\nDEFAULT_GITHUB_REPO = "test/repo"\n')
            with open(themes_state_file, "w", encoding="utf-8") as f:
                json.dump({"activePack": "Pack1", "overlayThemes": {}}, f)
            with open(fusions_file, "w", encoding="utf-8") as f:
                json.dump([{"id": "default_fusion", "name": "Default"}], f)
            with open(code_file, "w", encoding="utf-8") as f:
                f.write("print('v1')\n")

            subprocess.run(["git", "add", "."], cwd=str(remote_root), check=True)
            subprocess.run(["git", "commit", "-m", "v1.0.0"], cwd=str(remote_root), check=True, stdout=subprocess.DEVNULL)

            # Clonar a local
            subprocess.run(["git", "clone", str(remote_root), str(local_root)], cwd=td, check=True, stdout=subprocess.DEVNULL)
            subprocess.run(["git", "config", "user.email", "test@updater.com"], cwd=str(local_root), check=True)
            subprocess.run(["git", "config", "user.name", "Updater Test"], cwd=str(local_root), check=True)

            local_app = local_root / "app"

            # En remoto, preparar commit v1.0.1 con nuevo código y nueva fusión por defecto
            with open(remote_app / "version.py", "w", encoding="utf-8") as f:
                f.write('VERSION = "1.0.1-alpha"\nDEFAULT_GITHUB_REPO = "test/repo"\n')
            with open(remote_app / "code.py", "w", encoding="utf-8") as f:
                f.write("print('v2 updated code')\n")
            with open(remote_app / "new_module.py", "w", encoding="utf-8") as f:
                f.write("# New untracked conflict candidate\n")
            subprocess.run(["git", "add", "."], cwd=str(remote_root), check=True)
            subprocess.run(["git", "commit", "-m", "v1.0.1"], cwd=str(remote_root), check=True, stdout=subprocess.DEVNULL)

            # En local: el usuario modificó su themes_state, añadió una fusión personalizada y tiene código sucio
            with open(local_app / "themes_state.json", "w", encoding="utf-8") as f:
                json.dump({"activePack": "UserCustomPack", "overlayThemes": {"scene1": "custom_theme"}}, f)
            with open(local_app / "fusions.json", "w", encoding="utf-8") as f:
                json.dump([
                    {"id": "default_fusion", "name": "Default"},
                    {"id": "user_fusion_1", "name": "Mi Fusión"}
                ], f)
            # Archivo de código local sucio
            with open(local_app / "code.py", "w", encoding="utf-8") as f:
                f.write("print('dirty local modification')\n")
            # Archivo local sin seguimiento que colisiona con el commit entrante
            with open(local_app / "new_module.py", "w", encoding="utf-8") as f:
                f.write("# Local untracked file\n")

            # Ejecutar apply_update
            updater = UpdateManager(app_dir=local_app, root_dir=local_root)
            res = updater.apply_update(branch="main")

            self.assertEqual(res["status"], "ok", f"Update failed: {res.get('message')}")

            # 1. Verificar que el código se actualizó al nuevo del repo
            with open(local_app / "code.py", "r", encoding="utf-8") as f:
                self.assertIn("v2 updated code", f.read())

            # 2. Verificar que las preferencias de themes_state.json se preservaron
            with open(local_app / "themes_state.json", "r", encoding="utf-8") as f:
                saved_themes = json.load(f)
                self.assertEqual(saved_themes.get("activePack"), "UserCustomPack")
                self.assertEqual(saved_themes.get("overlayThemes", {}).get("scene1"), "custom_theme")

            # 3. Verificar que la fusión creada por el usuario no se borró
            with open(local_app / "fusions.json", "r", encoding="utf-8") as f:
                fusions_data = json.load(f)
                fusion_ids = [item["id"] for item in fusions_data]
                self.assertIn("user_fusion_1", fusion_ids)

    def test_apply_update_rescata_el_trabajo_local_en_un_stash(self):
        """`reset --hard` no puede llevarse por delante trabajo sin versionar.

        Antes de tocar el árbol se guarda TODO (modificados y ficheros nuevos
        sin seguimiento) en un stash con nombre, recuperable con
        `git stash list` / `git stash apply`. Es la red de seguridad que faltaba:
        una actualización podía borrar código a medias sin avisar.
        """
        with tempfile.TemporaryDirectory() as td:
            remote_root = Path(td) / "remote_repo"
            local_root = Path(td) / "local_repo"
            remote_root.mkdir()

            subprocess.run(["git", "init", "-b", "main"], cwd=str(remote_root),
                           check=True, stdout=subprocess.DEVNULL)
            subprocess.run(["git", "config", "user.email", "t@t.com"], cwd=str(remote_root), check=True)
            subprocess.run(["git", "config", "user.name", "T"], cwd=str(remote_root), check=True)

            remote_app = remote_root / "app"
            remote_app.mkdir()
            (remote_app / "version.py").write_text(
                'VERSION = "1.0.0-alpha"\nDEFAULT_GITHUB_REPO = "test/repo"\n', encoding="utf-8")
            (remote_app / "code.py").write_text("print('v1')\n", encoding="utf-8")
            subprocess.run(["git", "add", "."], cwd=str(remote_root), check=True)
            subprocess.run(["git", "commit", "-m", "v1"], cwd=str(remote_root),
                           check=True, stdout=subprocess.DEVNULL)

            subprocess.run(["git", "clone", str(remote_root), str(local_root)],
                           cwd=td, check=True, stdout=subprocess.DEVNULL)
            subprocess.run(["git", "config", "user.email", "t@t.com"], cwd=str(local_root), check=True)
            subprocess.run(["git", "config", "user.name", "T"], cwd=str(local_root), check=True)
            local_app = local_root / "app"

            # Commit nuevo en remoto para que la actualización avance.
            (remote_app / "version.py").write_text(
                'VERSION = "1.0.1-alpha"\nDEFAULT_GITHUB_REPO = "test/repo"\n', encoding="utf-8")
            (remote_app / "code.py").write_text("print('v2')\n", encoding="utf-8")
            subprocess.run(["git", "add", "."], cwd=str(remote_root), check=True)
            subprocess.run(["git", "commit", "-m", "v2"], cwd=str(remote_root),
                           check=True, stdout=subprocess.DEVNULL)

            # Trabajo local sin versionar: un tracked modificado + un fichero nuevo.
            (local_app / "code.py").write_text("MI_TRABAJO_LOCAL = True\n", encoding="utf-8")
            (local_app / "nota_local.txt").write_text("no me borres\n", encoding="utf-8")

            updater = UpdateManager(app_dir=local_app, root_dir=local_root)
            res = updater.apply_update(branch="main")

            self.assertEqual("ok", res["status"], res.get("message"))
            stash = (res.get("saved") or {}).get("stash")
            self.assertIsNotNone(stash, "la actualización no dejó stash de rescate")

            listed = subprocess.check_output(
                ["git", "stash", "list"], cwd=str(local_root), text=True)
            self.assertIn(stash, listed)

            # El tracked modificado está en el stash.
            diff = subprocess.check_output(
                ["git", "stash", "show", "-p", "stash@{0}"],
                cwd=str(local_root), text=True)
            self.assertIn("MI_TRABAJO_LOCAL", diff)

            # El fichero sin seguimiento viaja en el tercer padre del stash.
            untracked = subprocess.check_output(
                ["git", "ls-tree", "-r", "--name-only", "stash@{0}^3"],
                cwd=str(local_root), text=True)
            self.assertIn("nota_local.txt", untracked)

            # El árbol de trabajo sí quedó en la versión nueva.
            self.assertIn("v2", (local_app / "code.py").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
