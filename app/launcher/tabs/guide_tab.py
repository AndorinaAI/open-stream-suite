"""
launcher/tabs/guide_tab.py — Pestaña de documentación, guías de OBS y atajos rápidos
"""

import tkinter as tk
import webbrowser
from launcher.i18n import _
from launcher.tabs.constants import *

def build_guide_tab(gui):
    container = tk.Frame(gui.tab_guide, bg=C_PANEL, bd=1, relief="solid", highlightbackground=C_BORDER, padx=16, pady=14)
    container.pack(fill="both", expand=True)

    guide_text = _("launcher.guide_text")

    txt = scrolledtext.ScrolledText(
        container, wrap="word", font=("Courier", 10),
        bg=C_INPUT, fg=C_TEXT, insertbackground=C_TEXT, bd=0, padx=10, pady=10
    )
    txt.insert("1.0", guide_text)
    txt.configure(state="disabled")
    gui.guide_txt = txt
    txt.pack(fill="both", expand=True)

# --- PESTAÑA REGISTRO ---
