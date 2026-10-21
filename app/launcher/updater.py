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
                    cwd=str(self.root_dir),
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
                cwd=str(self.root_dir),
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
                    cwd=str(self.root_dir),
                    stderr=subprocess.DEVNULL,
                    text=True
                ).strip()

                if "origin" in remotes:
                    subprocess.run(
                        ["git", "fetch", "origin", branch],
                        cwd=str(self.root_dir),
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        timeout=5.0
                    )
                    count_str = subprocess.check_output(
                        ["git", "rev-list", f"HEAD..origin/{branch}", "--count"],
                        cwd=str(self.root_dir),
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
        Aplica la actualización mediante git pull y pip install si es un repositorio Git.
        """
        if not self.is_git_repo():
            return {
                "status": "error",
                "message": _("launcher.update_not_git")
            }

        try:
            # 1. Asegurar la rama correcta
            subprocess.run(
                ["git", "checkout", branch],
                cwd=str(self.root_dir),
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            # 2. git pull
            pull_res = subprocess.run(
                ["git", "pull", "origin", branch],
                cwd=str(self.root_dir),
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            # 3. Actualizar dependencias si existe el venv
            pip_cmd = None
            if (self.app_dir / "venv" / "bin" / "pip").is_file():
                pip_cmd = str(self.app_dir / "venv" / "bin" / "pip")
            elif (self.app_dir / "venv" / "Scripts" / "pip.exe").is_file():
                pip_cmd = str(self.app_dir / "venv" / "Scripts" / "pip.exe")

            if pip_cmd:
                subprocess.run(
                    [pip_cmd, "install", "-r", str(self.app_dir / "requirements.txt")],
                    cwd=str(self.app_dir),
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    timeout=30.0
                )

            return {
                "status": "ok",
                "message": _("launcher.update_success_msg", branch=branch),
                "details": pull_res.stdout
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
