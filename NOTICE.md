# Avisos de terceros (NOTICE) — Open Stream Suite

Este proyecto incluye recursos y dependencias de terceros. **No están cubiertos
por la licencia del Proyecto** (AGPL-3.0-or-later) ni por su licencia comercial:
mantienen sus propias condiciones, que se reproducen o referencian aquí.

## 0. Licencia, copyright y relicencia

- **Copyright (C) 2026 Jorge García Formoso** — titular único de los derechos de explotación.
- **Licencia pública vigente:** **GNU AGPL v3.0 o posterior** — el fichero `LICENSE` contiene el **texto canónico íntegro e inalterado**, para que lo reconozcan el detector de licencias de GitHub y los escáneres SPDX (`SPDX-License-Identifier: AGPL-3.0-or-later`).
- **Alcance de la relicencia (2026-10-26):** al ser el titular único del copyright, la licencia AGPL/comercial **cubre todo el contenido del repositorio, todas las versiones publicadas y la totalidad del historial**, con independencia de la licencia indicada en commits, ficheros o etiquetas anteriores.
- **Copias anteriores ya entregadas:** las copias de versiones anteriores al 2026-10-26 que ya estuvieran en manos de terceros conservan los términos con los que se entregaron (**CC BY-NC-SA 4.0**); **cualquier uso o redistribución nuevo**, de esa o de cualquier otra versión, se rige ya por la AGPL-3.0-or-later o por la licencia comercial.
- **Licencia comercial (excepción):** el titular puede conceder una licencia comercial separada que exime de las obligaciones de la AGPL (integración o embebido sin publicar el código derivado, marca blanca, redistribución, soporte). **No se concede automáticamente**: ver `LICENSE-COMMERCIAL.md` y **admin@andorina.dev**.
- Este fichero es donde viven el aviso de copyright, el alcance de la relicencia y las condiciones adicionales; `LICENSE` se reserva al texto canónico de la licencia.

---

## 1. Tipografías (SIL Open Font License 1.1)

Las fuentes se redistribuyen empaquetadas localmente en `app/common/fonts/`,
convertidas a **WOFF2** (por pesos) para uso en navegador. La OFL permite
explícitamente **empaquetar, incrustar, redistribuir y vender software que las
incluya**; no se venden por separado y **no se han modificado sus glifos**.

| Familia | Aviso de copyright (línea oficial) | Nombre reservado |
| :--- | :--- | :--- |
| Bebas Neue | `Copyright © 2010 by Dharma Type.` | — |
| Cinzel | `Copyright 2020 The Cinzel Project Authors (https://github.com/NDISCOVER/Cinzel)` | — |
| Comfortaa | `Copyright 2011 The Comfortaa Project Authors (https://github.com/alexeiva/comfortaa), with Reserved Font Name "Comfortaa".` | **«Comfortaa»** |
| Fira Code | `Copyright 2014-2020 The Fira Code Project Authors (https://github.com/tonsky/FiraCode)` | — |
| Inter | `Copyright 2020 The Inter Project Authors (https://github.com/rsms/inter)` | — |
| JetBrains Mono | `Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono)` | — |
| Montserrat | `Copyright 2024 The Montserrat.Git Project Authors (https://github.com/JulietaUla/Montserrat.git)` | — |
| Orbitron | `Copyright 2018 The Orbitron Project Authors (https://github.com/theleagueof/orbitron), with Reserved Font Name: "Orbitron"` | **«Orbitron»** |
| Outfit | `Copyright 2021 The Outfit Project Authors (https://github.com/Outfitio/Outfit-Fonts)` | — |
| Poppins | `Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins)` | — |
| Press Start 2P | `Copyright 2012 The Press Start 2P Project Authors (cody@zone38.net), with Reserved Font Name "Press Start 2P".` | **«Press Start 2P»** |
| Quicksand | `Copyright 2011 The Quicksand Project Authors (https://github.com/andrew-paglinawan/QuicksandFamily), with Reserved Font Name “Quicksand”.` | **«Quicksand»** |
| Rajdhani | `Copyright (c) 2014, Indian Type Foundry (info@indiantypefoundry.com).` | — |
| Share Tech Mono | `Copyright (c) 2012, Carrois Type Design, Ralph du Carrois (post@carrois.com www.carrois.com), with Reserved Font Name 'Share'` | **«Share»** |
| Teko | `Copyright 2023 The Teko Project Authors (https://www.github.com/googlefonts/teko)` | — |

- **15 familias**, todas bajo **SIL OFL 1.1**. Incluye `cinzel_variable.ttf` (fuente
  variable, formato original TTF) usada como sustituto local.
- Texto íntegro de cada licencia: `app/common/fonts/LICENSES/OFL-<familia>.txt`
  (`bebasneue`, `cinzel`, `comfortaa`, `firacode`, `inter`, `jetbrainsmono`,
  `montserrat`, `orbitron`, `outfit`, `poppins`, `pressstart2p`, `quicksand`,
  `rajdhani`, `sharetechmono`, `teko`). Nota: existe además una copia suelta en
  `app/common/fonts/LICENSE-cinzel.txt` del episodio inicial de integración.
- **Nombres reservados:** si en el futuro se **modifican los glifos** de Comfortaa,
  Orbitron, Press Start 2P, Quicksand o Share Tech Mono, la versión derivada **no
  puede seguir usando ese nombre**. La conversión de formato (TTF→WOFF2) y el
  subconjunto de pesos que hace este proyecto **no** requieren renombrar.
- La OFL no permite **vender las fuentes por sí solas**.

## 2. Dependencias de Python (runtime)

Se instalan como dependencias dinámicas en un virtualenv (`app/venv/`) y **no se
modifican**. Licencias verificadas en los metadatos del entorno:

| Paquete | Licencia |
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
> **Nota LGPL:** el uso como dependencia dinámica en un virtualenv es conforme.
> Si en el futuro se distribuye un **binario único empaquetado** (PyInstaller u
> otro), deberá garantizarse que `pystray` y `python-xlib` puedan seguir siendo
> **sustituibles** por el usuario (distribución separada, enlaces dinámicos o
> entrega de los ficheros objeto correspondientes).

## 3. Otros recursos

- **Logotipos, iconos y símbolos** de `app/assets/imagencorp/`, `app/assets/*.png`
  y `plugins/assets/*.svg`: son obra del Proyecto (ver `TRADEMARK.md` para su uso).
- **Capturas de pantalla** de la documentación: muestran el software en uso. Si
  alguna contiene material de terceros (gameplay, caras de otras personas,
  ilustraciones), ese contenido **no queda licenciado** por este proyecto.
- **Emojis**: se usan caracteres del sistema/navegador; no se redistribuye ningún
  set de emojis.
- **Media del usuario** (vídeos, sonidos, imágenes en `app/media/`): no forma
  parte del repositorio ni de la distribución.

---

*Versión 1.0 · Última verificación de licencias: 2026-10-26*
