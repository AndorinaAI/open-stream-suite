"""
launcher/tabs/server_tab.py — Pestaña de control del servidor local y avisos de actualización
"""

import tkinter as tk
from tkinter import ttk
import webbrowser
from launcher.i18n import _
from launcher.tabs.constants import *
from version import VERSION

def build_server_tab(gui):
    # Tarjeta de estado
    card = tk.Frame(gui.tab_server, bg=C_PANEL, bd=1, relief="solid", highlightbackground=C_BORDER, padx=16, pady=14)
    card.pack(fill="x", pady=(0, 16))

    top_row = tk.Frame(card, bg=C_PANEL)
    top_row.pack(fill="x")

    tk.Label(top_row, text="ESTADO DEL SERVIDOR", font=("Helvetica", 9, "bold"), fg=C_MUTED, bg=C_PANEL).pack(side="left")

    gui.lbl_server_badge = tk.Label(
        top_row, text="DETENIDO", font=("Helvetica", 10, "bold"),
        fg=C_RED, bg="#2A1616", padx=8, pady=2, bd=1, relief="solid"
    )
    gui.lbl_server_badge.pack(side="right")

    gui.lbl_server_info = tk.Label(
        card, text="http://127.0.0.1:8080 · WebSocket listo para OBS",
        font=("Helvetica", 11), fg=C_TEXT, bg=C_PANEL, anchor="w"
    )
    gui.lbl_server_info.pack(fill="x", pady=(10, 4))

    gui.lbl_clients_info = tk.Label(
        card, text=_("launcher.clients_line_empty"),
        font=("Helvetica", 10), fg=C_MUTED, bg=C_PANEL, anchor="w"
    )
    gui.lbl_clients_info.pack(fill="x")

    # Botones de acción principales
    btn_frame = tk.Frame(gui.tab_server, bg=C_BG)
    btn_frame.pack(fill="x", pady=(0, 16))

    gui.btn_toggle_server = tk.Button(
        btn_frame, text="⚡ Iniciar Servidor", font=("Helvetica", 11, "bold"),
        bg=C_CYAN, fg="#000000", activebackground="#45B6A6", activeforeground="#000000",
        relief="flat", padx=16, pady=8, cursor="hand2", command=gui.on_toggle_server
    )
    gui.btn_toggle_server.pack(side="left", padx=(0, 10))

    gui.btn_open_catalog = tk.Button(
        btn_frame, text="🏠 Portada / Inicio", font=("Helvetica", 11, "bold"),
        bg="#21262D", fg=C_CYAN, activebackground="#30363D", activeforeground=C_TEXT,
        relief="flat", padx=14, pady=8, cursor="hand2", command=gui.on_open_catalog
    )
    gui.btn_open_catalog.pack(side="left", padx=(0, 10))

    gui.btn_open_panel = tk.Button(
        btn_frame, text="🎛️ Panel de Alertas", font=("Helvetica", 10),
        bg="#21262D", fg=C_TEXT, activebackground="#30363D", activeforeground=C_TEXT,
        relief="flat", padx=12, pady=8, cursor="hand2", command=gui.on_open_panel
    )
    gui.btn_open_panel.pack(side="left", padx=(0, 10))

    btn_folder = tk.Button(
        btn_frame, text="📂 Overlays", font=("Helvetica", 10),
        bg="#21262D", fg=C_TEXT, activebackground="#30363D", activeforeground=C_TEXT,
        relief="flat", padx=12, pady=8, cursor="hand2", command=gui.on_open_folder
    )
    btn_folder.pack(side="left")

    # Opciones de comportamiento
    opts_frame = tk.Frame(gui.tab_server, bg=C_PANEL, bd=1, relief="solid", highlightbackground=C_BORDER, padx=16, pady=12)
    opts_frame.pack(fill="x")

    tk.Label(opts_frame, text="OPCIONES DE ARRANQUE", font=("Helvetica", 9, "bold"), fg=C_MUTED, bg=C_PANEL).pack(anchor="w", pady=(0, 8))

    cb_browser = tk.Checkbutton(
        opts_frame, text="Abrir el panel en el navegador automáticamente al iniciar",
        variable=gui.var_open_browser, fg=C_TEXT, bg=C_PANEL, selectcolor=C_INPUT,
        activebackground=C_PANEL, activeforeground=C_TEXT, font=("Helvetica", 10)
    )
    cb_browser.pack(anchor="w", pady=2)

    cb_tray = tk.Checkbutton(
        opts_frame, text="Minimizar a la bandeja del sistema al pulsar la X de cerrar",
        variable=gui.var_minimize_tray, fg=C_TEXT, bg=C_PANEL, selectcolor=C_INPUT,
        activebackground=C_PANEL, activeforeground=C_TEXT, font=("Helvetica", 10)
    )
    cb_tray.pack(anchor="w", pady=2)

    # Tarjeta de actualizaciones
    upd_card = tk.Frame(gui.tab_server, bg=C_PANEL, bd=1, relief="solid", highlightbackground=C_BORDER, padx=16, pady=10)
    upd_card.pack(fill="x", pady=(12, 0))

    u_row = tk.Frame(upd_card, bg=C_PANEL)
    u_row.pack(fill="x")
    tk.Label(u_row, text="ACTUALIZACIONES", font=("Helvetica", 9, "bold"), fg=C_MUTED, bg=C_PANEL).pack(side="left")

    tk.Label(u_row, text="Rama:", font=("Helvetica", 9), fg=C_TEXT, bg=C_PANEL).pack(side="left", padx=(14, 4))
    gui.branch_combo = ttk.Combobox(
        u_row, textvariable=gui.var_update_branch, values=["main", "dev"],
        state="readonly", width=7, font=("Helvetica", 9)
    )
    gui.branch_combo.pack(side="left", padx=(0, 8))

    gui.btn_check_updates = tk.Button(
        u_row, text="🔄 Comprobar", font=("Helvetica", 9),
        bg="#21262D", fg=C_CYAN, activebackground="#30363D", activeforeground=C_TEXT,
        relief="flat", padx=8, pady=1, cursor="hand2", command=gui.on_check_updates
    )
    gui.btn_check_updates.pack(side="left")

    # Banner interactivo si hay actualización disponible (oculto por defecto)
    gui.upd_banner = tk.Frame(upd_card, bg="#13232A", bd=1, relief="solid", highlightbackground=C_CYAN, padx=8, pady=6)

    gui.lbl_upd_banner = tk.Label(gui.upd_banner, text="", font=("Helvetica", 9), fg=C_CYAN, bg="#13232A")
    gui.lbl_upd_banner.pack(side="left")

    gui.btn_apply_upd = tk.Button(
        gui.upd_banner, text="📥 Actualizar ahora", font=("Helvetica", 9, "bold"),
        bg=C_CYAN, fg="#000000", activebackground="#45B6A6", activeforeground="#000000",
        relief="flat", padx=8, pady=2, cursor="hand2", command=gui.on_apply_update
    )
    gui.btn_apply_upd.pack(side="right", padx=(8, 0))

    gui.btn_view_release = tk.Button(
        gui.upd_banner, text="🌐 GitHub", font=("Helvetica", 9),
        bg="#21262D", fg=C_TEXT, activebackground="#30363D", activeforeground=C_TEXT,
        relief="flat", padx=8, pady=2, cursor="hand2", command=gui.on_open_release_url
    )
    gui.btn_view_release.pack(side="right")

    gui.lbl_update_status = tk.Label(
        upd_card, text=_("launcher.installed_version", version=VERSION),
        font=("Helvetica", 9), fg=C_MUTED, bg=C_PANEL, anchor="w"
    )
    gui.lbl_update_status.pack(fill="x", pady=(6, 0))

# --- PESTAÑA TWITCH ---
