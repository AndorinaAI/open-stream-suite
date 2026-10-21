"""
launcher/tabs/twitch_tab.py — Pestaña de conexión y credenciales de Twitch API
"""

import tkinter as tk
from tkinter import ttk
from launcher.i18n import _
from launcher.tabs.constants import *

def build_twitch_tab(gui):
    # Tarjeta de usuario
    user_card = tk.Frame(gui.tab_twitch, bg=C_PANEL, bd=1, relief="solid", highlightbackground=C_BORDER, padx=16, pady=12)
    user_card.pack(fill="x", pady=(0, 16))

    top_row = tk.Frame(user_card, bg=C_PANEL)
    top_row.pack(fill="x")
    gui.lbl_twitch_acc_title = tk.Label(top_row, text=_("twitch.account_title", "CUENTA DE TWITCH"), font=("Helvetica", 9, "bold"), fg=C_MUTED, bg=C_PANEL)
    gui.lbl_twitch_acc_title.pack(side="left")

    gui.lbl_twitch_badge = tk.Label(
        top_row, text=_("twitch.badge_disconnected", "NO CONECTADO"), font=("Helvetica", 9, "bold"),
        fg=C_MUTED, bg="#21262D", padx=8, pady=2
    )
    gui.lbl_twitch_badge.pack(side="right")

    gui.lbl_twitch_user = tk.Label(
        user_card, text=_("twitch.user_disconnected", "Inicia sesión para recibir alertas de followers, subs y chat en directo"),
        font=("Helvetica", 10), fg=C_TEXT, bg=C_PANEL, anchor="w"
    )
    gui.lbl_twitch_user.pack(fill="x", pady=(8, 0))

    # Formulario de credenciales
    form = tk.Frame(gui.tab_twitch, bg=C_PANEL, bd=1, relief="solid", highlightbackground=C_BORDER, padx=16, pady=14)
    form.pack(fill="x", pady=(0, 16))

    gui.lbl_twitch_creds_title = tk.Label(form, text=_("twitch.creds_title", "CREDENCIALES DE LA APLICACIÓN (dev.twitch.tv)"), font=("Helvetica", 9, "bold"), fg=C_MUTED, bg=C_PANEL)
    gui.lbl_twitch_creds_title.pack(anchor="w", pady=(0, 10))

    # Client ID
    gui.lbl_client_id = tk.Label(form, text=_("twitch.client_id", "Client ID:"), font=("Helvetica", 10), fg=C_TEXT, bg=C_PANEL)
    gui.lbl_client_id.pack(anchor="w")
    gui.entry_client_id = tk.Entry(form, font=("Courier", 10), bg=C_INPUT, fg=C_TEXT, insertbackground=C_TEXT, relief="flat", bd=4)
    gui.entry_client_id.pack(fill="x", pady=(2, 8))

    # Client Secret
    secret_row = tk.Frame(form, bg=C_PANEL)
    secret_row.pack(fill="x")
    gui.lbl_client_secret = tk.Label(secret_row, text=_("twitch.client_secret", "Client Secret:"), font=("Helvetica", 10), fg=C_TEXT, bg=C_PANEL)
    gui.lbl_client_secret.pack(side="left")
    gui.btn_toggle_secret = tk.Button(secret_row, text=_("twitch.toggle_secret", "👁️ Ver / Ocultar"), font=("Helvetica", 8), bg=C_PANEL, fg=C_MUTED, relief="flat", cursor="hand2", command=gui.on_toggle_secret)
    gui.btn_toggle_secret.pack(side="right")

    gui.entry_client_secret = tk.Entry(form, font=("Courier", 10), bg=C_INPUT, fg=C_TEXT, insertbackground=C_TEXT, relief="flat", bd=4, show="*")
    gui.entry_client_secret.pack(fill="x", pady=(2, 12))

    # Botones de acción Twitch
    tw_btn_frame = tk.Frame(gui.tab_twitch, bg=C_BG)
    tw_btn_frame.pack(fill="x")

    gui.btn_save_creds = tk.Button(
        tw_btn_frame, text=_("twitch.btn_save_creds", "💾 Guardar Credenciales"), font=("Helvetica", 10, "bold"),
        bg="#21262D", fg=C_TEXT, activebackground="#30363D", activeforeground=C_TEXT,
        relief="flat", padx=14, pady=7, cursor="hand2", command=gui.on_save_credentials
    )
    gui.btn_save_creds.pack(side="left", padx=(0, 8))

    gui.btn_twitch_auth = tk.Button(
        tw_btn_frame, text=_("twitch.btn_connect", "🟣 Conectar con Twitch"), font=("Helvetica", 10, "bold"),
        bg="#9146FF", fg="#FFFFFF", activebackground="#772CE8", activeforeground="#FFFFFF",
        relief="flat", padx=14, pady=7, cursor="hand2", command=gui.on_twitch_auth
    )
    gui.btn_twitch_auth.pack(side="left", padx=(0, 8))

    gui.btn_logout_twitch = tk.Button(
        tw_btn_frame, text=_("twitch.btn_logout", "Cerrar Sesión"), font=("Helvetica", 10),
        bg="#21262D", fg=C_RED, activebackground="#30363D", activeforeground=C_RED,
        relief="flat", padx=10, pady=7, cursor="hand2", command=gui.on_twitch_logout
    )
    gui.btn_logout_twitch.pack(side="left")
