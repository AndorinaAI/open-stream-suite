"""
Open Stream Suite — Gestor de Actualizaciones
Permite comprobar si hay nuevas versiones (en rama main o dev) y aplicar actualizaciones vía Git.
"""

import os
import sys
import re
import json
import urllib.request
import subprocess
from pathlib import Path

from version import VERSION, DEFAULT_GITHUB_REPO
from launcher.i18n import _

APP_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = APP_DIR.parent


def parse_version(ver):
    """Convierte '1.0.0-Alpha' en una clave comparable: (nums, es_estable, prerelease)."""
    ver = (ver or "").strip().lower().lstrip("v")
    core, _, pre = ver.partition("-")
    nums = tuple(int(x) for x in re.findall(r"\d+", core)[:4]) or (0,)
    nums = nums + (0,) * (4 - len(nums))
    pre_parts = tuple(
        (0, int(p)) if p.isdigit() else (1, p)
        for p in re.split(r"[.\-_]", pre) if p
    )
    return (nums, 0 if pre else 1, pre_parts)


def is_newer_version(remote, current):
    """True sólo si 'remote' es estrictamente posterior a 'current' (alpha < beta < rc < estable)."""
    return parse_version(remote) > parse_version(current)


class UpdateManager:
    def __init__(self, app_dir=APP_DIR, root_dir=ROOT_DIR):
        self.app_dir = Path(app_dir)
        self.root_dir = Path(root_dir)

    def get_git_root(self):
        """Devuelve el directorio raíz del repositorio Git"""
        if (self.root_dir / ".git").is_dir():
            return self.root_dir
        if (self.app_dir / ".git").is_dir():
            return self.app_dir
        return self.root_dir

    def is_git_repo(self):
        """Verifica si el proyecto está gestionado por Git"""
        return (self.root_dir / ".git").is_dir() or (self.app_dir / ".git").is_dir()

    def get_repo_name(self):
        """Obtiene el nombre 'propietario/repo' desde .env, git remote o por defecto"""
        env_repo = os.environ.get("GITHUB_REPO")
        if env_repo:
            return env_repo.strip()

        if self.is_git_repo():
            try:
                out = subprocess.check_output(
                    ["git", "remote", "get-url", "origin"],
                    cwd=str(self.get_git_root()),
                    stderr=subprocess.DEVNULL,
                    text=True
                ).strip()
                m = re.search(r"github\.com[:/]([^/]+/[^/.]+)", out)
                if m:
                    return m.group(1)
            except Exception:
                pass

        return DEFAULT_GITHUB_REPO

    def get_current_branch(self):
        """Obtiene la rama activa actual de Git"""
        if not self.is_git_repo():
            return "main"
        try:
            branch = subprocess.check_output(
                ["git", "rev-parse", "--abbrev-ref", "HEAD"],
                cwd=str(self.get_git_root()),
                stderr=subprocess.DEVNULL,
                text=True
            ).strip()
            return branch if branch else "main"
        except Exception:
            return "main"

    def check_updates(self, branch="main"):
        """
        Comprueba si hay actualizaciones disponibles en la rama elegida ('main' o 'dev').
        Devuelve un diccionario con el diagnóstico.
        """
        repo = self.get_repo_name()
        current_version = VERSION
        git_root = self.get_git_root()
        result = {
            "update_available": False,
            "current_version": current_version,
            "remote_version": current_version,
            "branch": branch,
            "commits_behind": 0,
            "is_git": self.is_git_repo(),
            "repo": repo,
            "release_url": f"https://github.com/{repo}/releases",
            "message": _("launcher.update_latest")
        }

        # 1. Comprobar vía Git si el repo está disponible y tiene remote origin
        if self.is_git_repo():
            try:
                # Comprobar si existe el remote origin
                remotes = subprocess.check_output(
                    ["git", "remote"],
                    cwd=str(git_root),
                    stderr=subprocess.DEVNULL,
                    text=True
                ).strip()

                if "origin" in remotes:
                    subprocess.run(
                        ["git", "fetch", "origin", branch],
                        cwd=str(git_root),
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        timeout=15.0
                    )
                    count_str = subprocess.check_output(
                        ["git", "rev-list", f"HEAD..origin/{branch}", "--count"],
                        cwd=str(git_root),
                        stderr=subprocess.DEVNULL,
                        text=True
                    ).strip()
                    commits_behind = int(count_str) if count_str.isdigit() else 0
                    result["commits_behind"] = commits_behind
                    if commits_behind > 0:
                        result["update_available"] = True
                        result["message"] = _("launcher.update_behind", commits_behind=commits_behind, branch=branch)
            except Exception:
                pass

        # 2. Comprobar versión remota en GitHub raw
        raw_url = f"https://raw.githubusercontent.com/{repo}/{branch}/app/version.py"
        try:
            req = urllib.request.Request(
                raw_url,
                headers={"User-Agent": f"OpenStreamSuite-Updater/{VERSION}"}
            )
            with urllib.request.urlopen(req, timeout=3.5) as resp:
                if resp.status == 200:
                    content = resp.read().decode("utf-8")
                    m = re.search(r'VERSION\s*=\s*["\']([^"\']+)["\']', content)
                    if m:
                        remote_ver = m.group(1).strip()
                        result["remote_version"] = remote_ver
                        if is_newer_version(remote_ver, current_version):
                            result["update_available"] = True
                            result["message"] = _("launcher.update_new_version", remote_ver=remote_ver, branch=branch)
        except Exception:
            pass

        return result

    def apply_update(self, branch="main"):
        """
        Aplica la actualización mediante Git y pip install.
        Preserva las configuraciones de usuario (temas, fusiones, textos, widgets)
        y resuelve de forma no destructiva colisiones de archivos rastreados.
        """
        if not self.is_git_repo():
            return {
                "status": "error",
                "message": _("launcher.update_not_git")
            }

        git_root = self.get_git_root()

        try:
            # 1. Respaldar configuración de usuario para no perderla en la actualización
            user_configs_to_backup = [
                "themes_state.json",
                "fusions.json",
                "overlay_texts_config.json",
                "overlay_texts_config.en.json",
                "widgets_config.json",
                "widgets/goal/config.json",
                "roles.json",
            ]
            saved_user_data = {}
            for rel_path in user_configs_to_backup:
                p = self.app_dir / rel_path
                if p.is_file():
                    try:
                        with open(p, "r", encoding="utf-8") as f:
                            saved_user_data[rel_path] = json.load(f)
                    except Exception:
                        pass

            # 2. Descargar los últimos cambios del repositorio
            subprocess.run(
                ["git", "fetch", "origin", branch],
                cwd=str(git_root),
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=60.0
            )

            # 3. Asegurar la rama correcta
            subprocess.run(
                ["git", "checkout", "-f", branch],
                cwd=str(git_root),
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=30.0
            )

            # 4. Aplicar actualización (reset --hard a origin/branch para resolver colisiones de archivos modificados/rastreados)
            reset_res = subprocess.run(
                ["git", "reset", "--hard", f"origin/{branch}"],
                cwd=str(git_root),
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=30.0
            )

            # 5. Restaurar y fusionar configuraciones de usuario de forma no destructiva
            if "themes_state.json" in saved_user_data and isinstance(saved_user_data["themes_state.json"], dict):
                p = self.app_dir / "themes_state.json"
                current_disk = {}
                if p.is_file():
                    try:
                        with open(p, "r", encoding="utf-8") as f:
                            current_disk = json.load(f)
                    except Exception:
                        pass
                for k in ("activePack", "activeTheme", "overlayThemes", "overlayShapes", "backdrops", "customScenes"):
                    if k in saved_user_data["themes_state.json"]:
                        current_disk[k] = saved_user_data["themes_state.json"][k]
                try:
                    with open(p, "w", encoding="utf-8") as f:
                        json.dump(current_disk, f, indent=2, ensure_ascii=False)
                except Exception:
                    pass

            if "fusions.json" in saved_user_data:
                p = self.app_dir / "fusions.json"
                disk_fusions = []
                if p.is_file():
                    try:
                        with open(p, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            if isinstance(data, list):
                                disk_fusions = data
                    except Exception:
                        pass
                saved_list = saved_user_data["fusions.json"]
                if isinstance(saved_list, list):
                    existing_ids = {f["id"]: i for i, f in enumerate(disk_fusions) if isinstance(f, dict) and "id" in f}
                    for uf in saved_list:
                        if isinstance(uf, dict) and "id" in uf:
                            if uf["id"] in existing_ids:
                                disk_fusions[existing_ids[uf["id"]]] = uf
                            else:
                                disk_fusions.append(uf)
                    try:
                        with open(p, "w", encoding="utf-8") as f:
                            json.dump(disk_fusions, f, indent=2, ensure_ascii=False)
                    except Exception:
                        pass

            for text_cfg in ("overlay_texts_config.json", "overlay_texts_config.en.json"):
                if text_cfg in saved_user_data and isinstance(saved_user_data[text_cfg], dict):
                    p = self.app_dir / text_cfg
                    disk_texts = {}
                    if p.is_file():
                        try:
                            with open(p, "r", encoding="utf-8") as f:
                                disk_texts = json.load(f)
                        except Exception:
                            pass
                    user_texts = saved_user_data[text_cfg]
                    for k, v in user_texts.items():
                        if k == "customScenes" and isinstance(v, dict):
                            if "customScenes" not in disk_texts or not isinstance(disk_texts["customScenes"], dict):
                                disk_texts["customScenes"] = {}
                            disk_texts["customScenes"].update(v)
                        else:
                            disk_texts[k] = v
                    try:
                        with open(p, "w", encoding="utf-8") as f:
                            json.dump(disk_texts, f, indent=2, ensure_ascii=False)
                    except Exception:
                        pass

            for other_cfg in ("widgets_config.json", "widgets/goal/config.json", "roles.json"):
                if other_cfg in saved_user_data:
                    p = self.app_dir / other_cfg
                    try:
                        with open(p, "w", encoding="utf-8") as f:
                            json.dump(saved_user_data[other_cfg], f, indent=2, ensure_ascii=False)
                    except Exception:
                        pass

            # 6. Actualizar dependencias de Python si existe el entorno virtual
            pip_cmd = None
            if (self.app_dir / "venv" / "bin" / "pip").is_file():
                pip_cmd = str(self.app_dir / "venv" / "bin" / "pip")
            elif (self.app_dir / "venv" / "Scripts" / "pip.exe").is_file():
                pip_cmd = str(self.app_dir / "venv" / "Scripts" / "pip.exe")

            if pip_cmd and (self.app_dir / "requirements.txt").is_file():
                subprocess.run(
                    [pip_cmd, "install", "-r", str(self.app_dir / "requirements.txt")],
                    cwd=str(self.app_dir),
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    timeout=60.0
                )

            return {
                "status": "ok",
                "message": _("launcher.update_success_msg", branch=branch),
                "details": reset_res.stdout
            }
        except subprocess.CalledProcessError as e:
            err = e.stderr or str(e)
            return {
                "status": "error",
                "message": _("launcher.update_git_error", err=err)
            }
        except Exception as e:
            return {
                "status": "error",
                "message": _("launcher.update_unexpected_error", e=e)
            }
