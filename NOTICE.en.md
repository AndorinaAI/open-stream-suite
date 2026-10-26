# Third-party notices (NOTICE) — Open Stream Suite

This project bundles third-party assets and depends on third-party libraries.
They are **not covered** by the project licence (AGPL-3.0-or-later) nor by its
commercial licence: they keep their own terms, reproduced or referenced here.

## 0. Project licence and copyright

- **Copyright (C) 2026 Jorge García Formoso** — holder of the exploitation rights.
- **Public licence:** **GNU AGPL v3.0 or later** — the `LICENSE` file contains the **complete, unmodified canonical text**, so that GitHub's licence detector and SPDX scanners recognise it (`SPDX-License-Identifier: AGPL-3.0-or-later`).
- **Commercial licence (exception):** the Licensor may grant a separate commercial licence that waives the AGPL obligations (embedding or integrating it without publishing the derivative source, white-labelling, redistribution, support). It is **not granted automatically**: see `LICENSE-COMMERCIAL.en.md` and **admin@andorina.dev**.
- **Historical note:** versions published **before 2026-10-26** were distributed under **CC BY-NC-SA 4.0**. Copies already delivered to third parties keep those terms; new versions are governed by AGPL-3.0-or-later.
- This file is where the copyright notice and the additional terms live; `LICENSE` is reserved for the canonical licence text.

---

## 1. Typefaces (SIL Open Font License 1.1)

Fonts are bundled locally in `app/common/fonts/`, converted to **WOFF2** (per
weight) for browser use. The OFL explicitly allows **bundling, embedding,
redistributing and selling software that includes them**; they are not sold
separately and their glyph outlines have **not** been modified.

| Family | Official copyright notice | Reserved Font Name |
| :--- | :--- | :--- |
| Bebas Neue | `Copyright © 2010 by Dharma Type.` | — |
| Cinzel | `Copyright 2020 The Cinzel Project Authors (https://github.com/NDISCOVER/Cinzel)` | — |
| Comfortaa | `Copyright 2011 The Comfortaa Project Authors (https://github.com/alexeiva/comfortaa), with Reserved Font Name "Comfortaa".` | **"Comfortaa"** |
| Fira Code | `Copyright 2014-2020 The Fira Code Project Authors (https://github.com/tonsky/FiraCode)` | — |
| Inter | `Copyright 2020 The Inter Project Authors (https://github.com/rsms/inter)` | — |
| JetBrains Mono | `Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono)` | — |
| Montserrat | `Copyright 2024 The Montserrat.Git Project Authors (https://github.com/JulietaUla/Montserrat.git)` | — |
| Orbitron | `Copyright 2018 The Orbitron Project Authors (https://github.com/theleagueof/orbitron), with Reserved Font Name: "Orbitron"` | **"Orbitron"** |
| Outfit | `Copyright 2021 The Outfit Project Authors (https://github.com/Outfitio/Outfit-Fonts)` | — |
| Poppins | `Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins)` | — |
| Press Start 2P | `Copyright 2012 The Press Start 2P Project Authors (cody@zone38.net), with Reserved Font Name "Press Start 2P".` | **"Press Start 2P"** |
| Quicksand | `Copyright 2011 The Quicksand Project Authors (https://github.com/andrew-paglinawan/QuicksandFamily), with Reserved Font Name “Quicksand”.` | **"Quicksand"** |
| Rajdhani | `Copyright (c) 2014, Indian Type Foundry (info@indiantypefoundry.com).` | — |
| Share Tech Mono | `Copyright (c) 2012, Carrois Type Design, Ralph du Carrois (post@carrois.com www.carrois.com), with Reserved Font Name 'Share'` | **"Share"** |
| Teko | `Copyright 2023 The Teko Project Authors (https://www.github.com/googlefonts/teko)` | — |

- **15 families**, all under **SIL OFL 1.1** (including `cinzel_variable.ttf`, a
  variable font kept in its original TTF format).
- Full licence texts: `app/common/fonts/LICENSES/OFL-<family>.txt`.
- **Reserved Font Names:** if the glyphs of Comfortaa, Orbitron, Press Start 2P,
  Quicksand or Share Tech Mono are **modified** in the future, the derivative
  **must not keep that name**. Format conversion (TTF→WOFF2) and weight
  subsetting, as done here, do **not** require renaming.
- The OFL does not allow **selling the fonts by themselves**.

## 2. Python runtime dependencies

Installed as dynamic dependencies inside a virtualenv (`app/venv/`); they are
**not modified**. Licences verified from the environment metadata:

| Package | Licence |
| :--- | :--- |
| aiohttp, yarl, multidict, propcache, frozenlist, aiosignal, requests | Apache-2.0 |
| websockets | BSD-3-Clause |
| idna | BSD-3-Clause |
| Pillow | MIT-CMU |
| certifi | MPL-2.0 |
| **pystray** | **LGPLv3** |
| **python-xlib** | **LGPLv2+** |
| attrs, six, charset-normalizer, urllib3 | MIT |
| typing-extensions, aiohappyeyeballs | PSF-2.0 |

> [!IMPORTANT]
> **LGPL note:** use as a dynamic dependency in a virtualenv is compliant. If a
> **single packaged binary** (PyInstaller or similar) is ever distributed,
> `pystray` and `python-xlib` must remain **replaceable** by the user (separate
> distribution, dynamic linking or shipping the relevant object files).

## 3. Other assets

- **Logos, icons and symbols** in `app/assets/imagencorp/`, `app/assets/*.png`
  and `plugins/assets/*.svg` are works of this project (see `TRADEMARK.md`).
- **Documentation screenshots** show the software in use. If any of them contains
  third-party material (gameplay, other people's faces, artwork), that content is
  **not** licensed by this project.
- **Emojis** are system/browser characters; no emoji set is redistributed.
- **User media** (videos, sounds, images in `app/media/`) is not part of the
  repository nor of the distribution.

---

*Version 1.0 · Last licence verification: 2026-10-26*
