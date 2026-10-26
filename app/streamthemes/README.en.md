# Theme Packs Directory (streamthemes)

This directory hosts modular theme packs and overlays for Open Stream Suite.

## Structure per Pack

Each pack is organized autonomously:

```
streamthemes/
└── <PackName>/
    ├── pack.json         # Pack metadata (id, name, version, author, etc.)
    ├── styles/           # CSS and JSON theme styling bundles
    │   ├── <theme_id>/
    │   │   ├── style.css
    │   │   ├── style.default.css
    │   │   ├── theme.json
    │   │   └── theme.default.json
    │   └── ...
    └── overlays/         # HTML views, components, and broadcast scenes
        ├── <scene_id>/
        │   └── index.html
        └── ...
```

## Official Available Packs Catalog

> Note: the *scene keys* used by the control panel (e.g. `maker-desk`, `oss_chatting`) can differ from the *folder path* (`maker/desk/`, `just_chatting/`). The public URL is always `/streamthemes/<Pack>/overlays/<path>/index.html`.

1. **`Maker_Theme_Pack/`** (6 styles):
   - Specialized in makers, hardware workshops, electronics, CAD, and 3D printing.
   - Scenes: 9 workshop broadcast scenes (`maker-desk`, `maker-pc`, `print-machine`, `print-design`, `chill`, `game`, `screens/`).
   - Themes: Maker Electronic, Print & Vinyl, Retro Terminal, Chill Lavender, Cyberpunk Industrial, and Retro Synthwave.

2. **`Open_stream_Pack/`** (5 styles):
   - Specialized in variety streaming, talk shows, podcasts, and multitasking.
   - Scenes: `just_chatting`, `desktop_share`, `podcast_talk`, and screens (`starting-soon`, `be-right-back`, `ending`).
   - Themes: Neon Streamer, Sunset Glow, Clean Minimal, Emerald Flow, and Crimson Pulse.

3. **`Gamer_Pro_Pack/`** (5 styles):
   - Specialized in competitive gaming, esports, speedruns, and tactical shooters with angular HUD styling.
   - Scenes: `gameplay_hud`, `speedrun_split`, `victory_clutch`, and screens (`starting-soon`, `be-right-back`, `ending`).
   - Themes: Crimson Esport, Toxic Radiation, Cyber Glitch, Golden Glory, and Stealth Titanium.

4. **`Cozy_LoFi_Pack/`** (5 styles):
   - Specialized in chill sessions, "Study With Me", digital art, Lo-Fi beats, and coffeehouse aesthetics.
   - Scenes: `study_pomodoro`, `art_dual_cam`, `cafe_chat`, and screens (`starting-soon`, `coffee-break`, `ending`).
   - Themes: Latte Caramel, Lavender Dream, Matcha Bamboo, Sakura Bloom, and Nordic Twilight.

---

## Universal Semantic Compatibility Contract (`data-oss-*`)

All scenes implement the universal semantic standard:
- `data-oss-cam="true"`: Primary camera frame container. Automatically receives all 20 physical shapes (45° chamfers, polaroids, hex shields, parchments, pixel cabinets, blueprint brackets, etc.).
- `data-oss-viewport="true"`: Transparent inner window area for OBS video capture and SVG backdrop aperture masks.
- `data-oss-cam-label="true|bar|bottom"`: Camera title or identification badge. Use `"bar"` or `.cam-bottom-bar` for full-width bottom chin bars.
- `data-oss-panel="true"`: Chat boxes, task cards, stats, or victory podiums.
- `data-oss-bar="top|bottom|left|right"`: Top headers, bottom news/stage ticker bars, or side columns.
- `data-oss-badge="true"`: Badges, chips and status labels (auto-injected at runtime when a scene does not declare them).
- `data-oss-orientation="horizontal|vertical"`: Element orientation (auto-detected at runtime; optional override).
- `data-text-key="section.field"`: Strict key isolation for live on-canvas editing and persistent WebSocket broadcasting.

### URL Control Query Parameters
- `?theme=<id>`: Force a specific color theme.
- `?shape=<id>`: Force one of the 20 universal physical shapes (`maker_blueprint`, `openstream_glass`, `gamer_mecha`, etc.).
- `?lock=1` / `?lockTheme=1`: Permanently locks the scene in OBS Studio to the URL parameters, ignoring incoming WebSocket changes.
- `?lang=en` / `?lang=es`: Reserved — currently only the `/api/overlays/texts` endpoint honours it; scenes do not consume this parameter yet.

### Multi-Aspect Ratio Fluidity
Using relative CSS coordinates (`calc(100% - 24px)`), physical shapes adapt fluidly across **16:9** (widescreen), **4:3** (retro/classic), **21:9** (ultrawide), and **9:16** (vertical mobile / TikTok / Shorts) camera captures without geometric distortion.
