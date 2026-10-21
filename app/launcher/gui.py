"""
Open Stream Suite — Interfaz Gráfica de Escritorio (Tkinter)
Dashboard de control del servidor, estado de Twitch, logs y configuración.
"""

import sys
import threading
import webbrowser
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
from pathlib import Path

from launcher.updater import UpdateManager
from launcher.i18n import _, get_current_language, set_current_language
from launcher.tabs import build_server_tab, build_twitch_tab, build_guide_tab, build_logs_tab
from version import VERSION

APP_DIR = Path(__file__).resolve().parent.parent
OVERLAYS_DIR = APP_DIR / "overlays"
ICON_PATH = APP_DIR / "assets" / "favicon.png"

# Paleta de colores Obsidian
C_BG = "#0B0E14"
C_PANEL = "#161B22"
C_BORDER = "#30363D"
C_CYAN = "#57D6C4"
C_CORAL = "#FF783F"
C_GREEN = "#3FB950"
C_RED = "#F85149"
C_TEXT = "#F0F6FC"
C_MUTED = "#8B949E"
C_INPUT = "#0D1117"


class LauncherGUI:
    def __init__(self, root, server_ctl, twitch_ctl, tray_ctl=None):
        self.root = root
        self.server_ctl = server_ctl
        self.twitch_ctl = twitch_ctl
        self.tray_ctl = tray_ctl

        self.root.title("Open Stream Suite — Control")
        self.root.geometry("680x560")
        self.root.minsize(620, 500)
        self.root.configure(bg=C_BG)

        # Opciones
        self.var_open_browser = tk.BooleanVar(value=True)
        self.var_minimize_tray = tk.BooleanVar(value=True)
        self.var_show_secret = tk.BooleanVar(value=False)
        self.var_update_branch = tk.StringVar(value="main")

        # Gestor de actualizaciones
        self.updater = UpdateManager()
        self._last_update_info = None

        # Estado en memoria
        self._last_server_status = False

        self._setup_icon()
        self._setup_styles()
        self._build_ui()
        self._load_initial_data()

        # Ciclo de polling no bloqueante
        self.root.protocol("WM_DELETE_WINDOW", self.on_close_window)
        self.root.after(800, self._poll_status)
        # Aviso automático de nuevas versiones al abrir el launcher
        self.root.after(3000, self.on_check_updates)

    def _setup_icon(self):
        if ICON_PATH.exists():
            try:
                img = tk.PhotoImage(file=str(ICON_PATH))
                self.root.iconphoto(True, img)
            except Exception:
                pass

    def _setup_styles(self):
        style = ttk.Style(self.root)
        style.theme_use("clam")

        # Configurar pestañas Notebook
        style.configure("TNotebook", background=C_BG, borderwidth=0)
        style.configure("TNotebook.Tab", background=C_PANEL, foreground=C_MUTED, padding=[16, 8], font=("Helvetica", 10, "bold"), borderwidth=0)
        style.map("TNotebook.Tab",
                  background=[("selected", C_BG), ("active", "#1F242C")],
                  foreground=[("selected", C_CYAN), ("active", C_TEXT)])

    def _build_ui(self):
        # Header superior
        header = tk.Frame(self.root, bg=C_BG, pady=12, padx=20)
        header.pack(fill="x")

        title_frame = tk.Frame(header, bg=C_BG)
        title_frame.pack(side="left")

        lbl_title = tk.Label(title_frame, text="OPEN STREAM SUITE", font=("Helvetica", 15, "bold"), fg=C_TEXT, bg=C_BG)
        lbl_title.pack(side="left")

        lbl_sub = tk.Label(title_frame, text="v1.0.0-α", font=("Courier", 10, "bold"), fg=C_CORAL, bg=C_BG, padx=8)
        lbl_sub.pack(side="left")

        # Selector de idioma en el header
        lang_frame = tk.Frame(header, bg=C_BG)
        lang_frame.pack(side="right")
        tk.Label(lang_frame, text="🌐", font=("Helvetica", 11), bg=C_BG, fg=C_MUTED).pack(side="left", padx=(0, 4))
        self.var_gui_lang = tk.StringVar(value=get_current_language())
        self.combo_gui_lang = ttk.Combobox(
            lang_frame, textvariable=self.var_gui_lang,
            values=["es", "en"], state="readonly", width=4, font=("Helvetica", 9)
        )
        self.combo_gui_lang.pack(side="left")
        self.combo_gui_lang.bind("<<ComboboxSelected>>", self.on_change_gui_lang)

        # Pestañas principales
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill="both", expand=True, padx=16, pady=(0, 16))

        self.tab_server = tk.Frame(self.notebook, bg=C_BG, padx=16, pady=16)
        self.tab_twitch = tk.Frame(self.notebook, bg=C_BG, padx=16, pady=16)
        self.tab_guide = tk.Frame(self.notebook, bg=C_BG, padx=16, pady=16)
        self.tab_logs = tk.Frame(self.notebook, bg=C_BG, padx=16, pady=16)

        self.notebook.add(self.tab_server, text=_("tabs.server", "🚀 Servidor"))
        self.notebook.add(self.tab_twitch, text=_("tabs.twitch", "🟣 Twitch"))
        self.notebook.add(self.tab_guide, text=_("tabs.guide", "📖 Guía"))
        self.notebook.add(self.tab_logs, text=_("tabs.logs", "📜 Registro"))

        self._build_tab_server()
        self._build_tab_twitch()
        self._build_tab_guide()
        self._build_tab_logs()

    # --- PESTAÑA SERVIDOR ---
    # --- VISTAS DE PESTAÑAS (MODULARIZADAS EN launcher/tabs/) ---
    def _build_tab_server(self):
        build_server_tab(self)

    def _build_tab_twitch(self):
        build_twitch_tab(self)

    def _build_tab_guide(self):
        build_guide_tab(self)

    def _build_tab_logs(self):
        build_logs_tab(self)
    def add_log_line(self, line):
        try:
            self.txt_logs.insert("end", line + "\n")
            self.txt_logs.see("end")
        except Exception:
            pass

    def on_clear_logs(self):
        self.txt_logs.delete("1.0", "end")

    def _load_initial_data(self):
        creds = self.twitch_ctl.load_env_credentials()
        self.entry_client_id.insert(0, creds.get("client_id", ""))
        self.entry_client_secret.insert(0, creds.get("client_secret", ""))

    def on_toggle_secret(self):
        show = self.var_show_secret.get()
        self.var_show_secret.set(not show)
        self.entry_client_secret.configure(show="" if not show else "*")

    def on_save_credentials(self):
        cid = self.entry_client_id.get().strip()
        sec = self.entry_client_secret.get().strip()
        if not cid or not sec:
            messagebox.showwarning(_("twitch.msg_creds_incomplete_title", "Credenciales incompletas"), _("twitch.msg_creds_incomplete", "Por favor introduce tanto el Client ID como el Client Secret."))
            return

        self.twitch_ctl.save_env_credentials(cid, sec)
        messagebox.showinfo(_("twitch.msg_creds_saved_title", "Guardado"), _("twitch.msg_creds_saved", "Credenciales guardadas con éxito en el archivo .env."))

    def on_toggle_server(self):
        alive, _data = self.server_ctl.is_running()
        if alive:
            self.server_ctl.stop()
            self._update_server_ui(False, {})
        else:
            ok, msg = self.server_ctl.start()
            if not ok:
                messagebox.showerror(_("server.start_error_title", "Error al iniciar"), msg)
            else:
                self.root.after(300, lambda: self._check_after_start(0))

    def _check_after_start(self, attempts=0):
        alive, data = self.server_ctl.is_running()
        if alive:
            self._update_server_ui(True, data)
            if self.var_open_browser.get():
                self.on_open_panel()
        elif attempts < 15:
            self.root.after(250, lambda: self._check_after_start(attempts + 1))
        else:
            if self.var_open_browser.get():
                self.on_open_panel()

    def _open_url(self, url):
        try:
            webbrowser.open(url)
        except Exception:
            if sys.platform == "darwin":
                import subprocess
                subprocess.Popen(["open", url])
            elif sys.platform != "win32":
                import subprocess
                subprocess.Popen(["xdg-open", url])

    def on_open_panel(self):
        url = f"{self.server_ctl.base_url}/alerts/panel.html"
        self._open_url(url)

    def on_open_catalog(self):
        self.on_open_panel()

    def on_open_folder(self):
        target = APP_DIR / "streamthemes"
        if not target.exists():
            target = APP_DIR
        if sys.platform == "win32":
            os.startfile(str(target))
        elif sys.platform == "darwin":
            import subprocess
            subprocess.Popen(["open", str(target)])
        else:
            import subprocess
            subprocess.Popen(["xdg-open", str(target)])

    def on_twitch_auth(self):
        alive, _data = self.server_ctl.is_running()
        if not alive:
            messagebox.showinfo(_("launcher.server_not_started_title"), _("launcher.twitch_not_started"))
            self.server_ctl.start()

        self.root.after(1000, self.twitch_ctl.open_twitch_login)

    def on_twitch_logout(self):
        ok, msg = self.twitch_ctl.logout_twitch()
        if ok:
            messagebox.showinfo(_("launcher.logged_out_title"), msg)
            self._update_twitch_ui({"connected": False})
        else:
            messagebox.showwarning("Aviso", msg)

    def on_close_window(self):
        """Gestiona el cierre de ventana: minimiza a la bandeja del sistema en lugar de cerrar"""
        if self.tray_ctl and self.tray_ctl.is_available():
            self.root.withdraw()
            return

        if messagebox.askokcancel(_("app.title", "Open Stream Suite"), _("launcher.confirm_exit")):
            self.server_ctl.stop()
            if self.tray_ctl:
                self.tray_ctl.stop()
            self.root.destroy()
            sys.exit(0)

    def show_window(self):
        self.root.deiconify()
        self.root.lift()
        try:
            self.root.attributes("-topmost", True)
            self.root.after_idle(self.root.attributes, "-topmost", False)
        except Exception:
            pass
        self.root.focus_force()

    # --- POLLING Y ACTUALIZACIÓN ---
    def _poll_status(self):
        try:
            alive, s_data = self.server_ctl.is_running()
            self._update_server_ui(alive, s_data)

            if alive:
                t_data = self.twitch_ctl.get_connection_status()
                self._update_twitch_ui(t_data)
        except Exception:
            pass

        self.root.after(1800, self._poll_status)

    def _update_server_ui(self, is_alive, data):
        if is_alive != self._last_server_status:
            self._last_server_status = is_alive
            if self.tray_ctl:
                self.tray_ctl.update_state(is_alive, base_url=self.server_ctl.base_url)

        if is_alive:
            self.lbl_server_badge.configure(text="ACTIVO", fg=C_GREEN, bg="#0E2818")
            self.btn_toggle_server.configure(text="⏹️ Detener Servidor", bg="#2D1A1A", fg=C_RED)
            clients = data.get("connected_clients", 0)
            theme = data.get("active_theme", "maker")
            self.lbl_clients_info.configure(text=_("launcher.clients_line", clients=clients, theme=theme))
        else:
            self.lbl_server_badge.configure(text="DETENIDO", fg=C_RED, bg="#2A1616")
            self.btn_toggle_server.configure(text="⚡ Iniciar Servidor", bg=C_CYAN, fg="#000000")
            self.lbl_clients_info.configure(text=_("launcher.clients_line_empty"))

    def _update_twitch_ui(self, data):
        if data.get("connected"):
            user = data.get("username", "Conectado")
            self.lbl_twitch_badge.configure(text="CONECTADO", fg=C_GREEN, bg="#0E2818")
            self.lbl_twitch_user.configure(text=f"Sesión iniciada como: {user}")
        else:
            self.lbl_twitch_badge.configure(text=_("twitch.badge_disconnected", "NO CONECTADO"), fg=C_MUTED, bg="#21262D")
            self.lbl_twitch_user.configure(text=_("launcher.twitch_hint"))

    # --- MÉTODOS DE ACTUALIZACIÓN ---
    def on_check_updates(self):
        branch = self.var_update_branch.get().strip() or "main"
        self.btn_check_updates.configure(state="disabled", text="⏳ Buscando...")
        self.lbl_update_status.configure(text=f"Consultando rama '{branch}'...")

        def _worker():
            info = self.updater.check_updates(branch=branch)
            self.root.after(0, lambda: self._on_check_updates_done(info))

        threading.Thread(target=_worker, daemon=True).start()

    def _on_check_updates_done(self, info):
        self._last_update_info = info
        self.btn_check_updates.configure(state="normal", text="🔄 Comprobar")

        branch = info.get("branch", "main")
        if info.get("update_available"):
            msg = info.get("message", "Nueva versión disponible")
            self.lbl_upd_banner.configure(text=f"🚀 {msg}")
            self.upd_banner.pack(fill="x", pady=(8, 4))
            self.lbl_update_status.configure(text=_("launcher.remote_version", version=info.get('remote_version'), branch=branch))
        else:
            self.upd_banner.pack_forget()
            self.lbl_update_status.configure(text=f"Versión v{VERSION} · Al día con la rama '{branch}'")

    def on_open_release_url(self):
        url = self._last_update_info.get("release_url") if self._last_update_info else f"https://github.com/{self.updater.get_repo_name()}/releases"
        webbrowser.open(url)

    def on_apply_update(self):
        branch = self.var_update_branch.get().strip() or "main"
        if not messagebox.askyesno(
            _("updates.confirm_title", "Confirmar actualización"),
            _("updates.confirm_body", branch=branch)
        ):
            return

        self.btn_apply_upd.configure(state="disabled", text="⏳ Actualizando...")

        def _worker():
            res = self.updater.apply_update(branch=branch)
            self.root.after(0, lambda: self._on_apply_update_done(res))

        threading.Thread(target=_worker, daemon=True).start()

    def _on_apply_update_done(self, res):
        self.btn_apply_upd.configure(state="normal", text="📥 Actualizar ahora")
        if res.get("status") == "ok":
            messagebox.showinfo(_("updates.success_title", "Actualización completada"), res.get("message", ""))
            self.on_check_updates()
        else:
            messagebox.showerror(_("updates.error_title", "Error al actualizar"), res.get("message", _("launcher.update_apply_error")))

    def on_change_gui_lang(self, event=None):
        import os
        new_lang = self.var_gui_lang.get()
        set_current_language(new_lang)
        os.environ["APP_LANG"] = new_lang

        # Pestañas
        self.notebook.tab(self.tab_server, text=_("tabs.server", "🚀 Servidor"))
        self.notebook.tab(self.tab_twitch, text=_("tabs.twitch", "🟣 Twitch"))
        self.notebook.tab(self.tab_guide, text=_("tabs.guide", "📖 Guía"))
        self.notebook.tab(self.tab_logs, text=_("tabs.logs", "📜 Registro"))

        # Pestaña Servidor
        if hasattr(self, "lbl_server_title"):
            self.lbl_server_title.configure(text=_("server.status_title", "ESTADO DEL SERVIDOR"))
        if hasattr(self, "lbl_server_info"):
            self.lbl_server_info.configure(text=_("server.address_info", "http://127.0.0.1:8080 · WebSocket listo para OBS"))
        if hasattr(self, "lbl_opts_title"):
            self.lbl_opts_title.configure(text=_("server.options_title", "OPCIONES DE ARRANQUE"))
        if hasattr(self, "cb_browser"):
            self.cb_browser.configure(text=_("server.opt_auto_browser", "Abrir el panel en el navegador automáticamente al iniciar"))
        if hasattr(self, "cb_tray"):
            self.cb_tray.configure(text=_("server.opt_minimize_tray", "Minimizar a la bandeja del sistema al pulsar la X de cerrar"))
        if hasattr(self, "lbl_upd_title"):
            self.lbl_upd_title.configure(text=_("updates.title", "ACTUALIZACIONES"))
        if hasattr(self, "lbl_branch_label"):
            self.lbl_branch_label.configure(text=_("updates.branch_label", "Rama:"))

        try:
            alive, _alive_data = self.server_ctl.is_running()
        except Exception:
            alive = False
        self.lbl_server_badge.configure(
            text=_("server.badge_active", "ACTIVO") if alive else _("server.badge_stopped", "DETENIDO"))
        self.btn_toggle_server.configure(
            text=_("server.btn_stop", "⏹️ Detener Servidor") if alive else _("server.btn_start", "⚡ Iniciar Servidor"))

        if hasattr(self, "btn_open_panel"):
            self.btn_open_panel.configure(text=_("server.btn_open_panel", "🎛️ Abrir Panel de Control"))
        if hasattr(self, "btn_folder"):
            self.btn_folder.configure(text=_("server.btn_folder", "📂 Overlays"))
        if hasattr(self, "btn_check_updates"):
            self.btn_check_updates.configure(text=_("updates.btn_check", "🔄 Comprobar"))
        if hasattr(self, "btn_apply_upd"):
            self.btn_apply_upd.configure(text=_("updates.btn_update_now", "📥 Actualizar ahora"))
        if hasattr(self, "btn_view_release"):
            self.btn_view_release.configure(text=_("updates.btn_github", "🌐 GitHub"))

        # Pestaña Twitch
        if hasattr(self, "lbl_twitch_acc_title"):
            self.lbl_twitch_acc_title.configure(text=_("twitch.account_title", "CUENTA DE TWITCH"))
        if hasattr(self, "lbl_twitch_creds_title"):
            self.lbl_twitch_creds_title.configure(text=_("twitch.creds_title", "CREDENCIALES DE LA APLICACIÓN (dev.twitch.tv)"))
        if hasattr(self, "lbl_client_id"):
            self.lbl_client_id.configure(text=_("twitch.client_id", "Client ID:"))
        if hasattr(self, "lbl_client_secret"):
            self.lbl_client_secret.configure(text=_("twitch.client_secret", "Client Secret:"))
        if hasattr(self, "btn_toggle_secret"):
            self.btn_toggle_secret.configure(text=_("twitch.toggle_secret", "👁️ Ver / Ocultar"))
        if hasattr(self, "btn_save_creds"):
            self.btn_save_creds.configure(text=_("twitch.btn_save_creds", "💾 Guardar Credenciales"))
        if hasattr(self, "btn_twitch_auth"):
            self.btn_twitch_auth.configure(text=_("twitch.btn_connect", "🟣 Conectar con Twitch"))
        if hasattr(self, "btn_logout_twitch"):
            self.btn_logout_twitch.configure(text=_("twitch.btn_logout", "Cerrar Sesión"))

        # Pestaña Guía y Logs
        if getattr(self, "guide_txt", None):
            self.guide_txt.configure(state="normal")
            self.guide_txt.delete("1.0", "end")
            self.guide_txt.insert("1.0", _("launcher.guide_text"))
            self.guide_txt.configure(state="disabled")
        if hasattr(self, "lbl_update_status"):
            self.lbl_update_status.configure(text=_("launcher.installed_version", version=VERSION))
        if hasattr(self, "btn_clear_logs"):
            self.btn_clear_logs.configure(text=_("logs.btn_clear", "Limpiar Registro"))

        if self.tray_ctl:
            self.tray_ctl.refresh_menu()

