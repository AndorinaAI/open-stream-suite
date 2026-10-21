"""
launcher/tabs/logs_tab.py — Pestaña de visor de registros y actividad en tiempo real
"""

import tkinter as tk
from tkinter import scrolledtext
from launcher.i18n import _
from launcher.tabs.constants import *

def build_logs_tab(gui):
    container = tk.Frame(gui.tab_logs, bg=C_PANEL, bd=1, relief="solid", highlightbackground=C_BORDER, padx=10, pady=10)
    container.pack(fill="both", expand=True)

    gui.txt_logs = scrolledtext.ScrolledText(
        container, wrap="none", font=("Courier", 9),
        bg="#05070A", fg=C_CYAN, insertbackground=C_TEXT, bd=0, padx=8, pady=8
    )
    gui.txt_logs.pack(fill="both", expand=True, pady=(0, 8))

    btn_clear = tk.Button(
        container, text="Limpiar Registro", font=("Helvetica", 9),
        bg="#21262D", fg=C_MUTED, activebackground="#30363D", activeforeground=C_TEXT,
        relief="flat", padx=10, pady=4, cursor="hand2", command=gui.on_clear_logs
    )
    btn_clear.pack(anchor="e")

# --- MÉTODOS Y ACCIONES ---
