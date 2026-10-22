# 🎨 On-Screen Chat Theme Development Guide

<p align="center">
  <a href="CHAT_THEMES.md">Español</a> | <b>English</b>
</p>

This guide documents the technical architecture, DOM hierarchy, and CSS classes of the **Open Stream Suite** chat widget, enabling developers and designers to build custom visual styles for both **framed overlay boxes** and **direct floating on-screen broadcast**.

---

## 1. Usage Modes & URL Parameters

The chat widget (`/widgets/chat/index.html`) supports two integration modes in OBS Studio:

### Mode 1: Framed in Overlay Box (`?layout=box`)
Use this when nesting chat within an overlay frame (e.g. 400px width × 650px height).
- **URL**: `http://localhost:8080/widgets/chat/?layout=box`
- **Behavior**: Occupies 100% of container with bottom auto-scroll.

### Mode 2: Direct Floating On-Screen (Borderless / Transparent)
Use as a 1920×1080 browser source directly overlaid onto gameplay or camera without background frames.
- **Default URL**: `http://localhost:8080/widgets/chat/`
- **Bottom-Right Corner**: `http://localhost:8080/widgets/chat/?pos=bottom-right`
- **Top-Left Corner**: `http://localhost:8080/widgets/chat/?pos=top-left`

### Mode 3: Multi-Style OBS Links by Scene Profile (`?profile=<id>`)
Allows streamers to assign unique chat aesthetics to different scenes in OBS Studio by simply passing `?profile=...` in the Browser Source URL:
- **🌿 Cozy Scene (Just Chatting / Relax)**: `http://localhost:8080/widgets/chat/index.html?profile=cozy_lofi` (warm polaroid soft card, 85% translucent glass, pastel amber)
- **⚡ Gamer Scene (Gameplay / Esports)**: `http://localhost:8080/widgets/chat/index.html?profile=gamer_pro` (45° sci-fi chamfered card, cyan & emerald neon glow, Orbitron font)
- **🛠️ Maker Scene (Workshop / CAD / 3D)**: `http://localhost:8080/widgets/chat/index.html?profile=maker_glass` (frosted tech glass, cyan left neon strip)
- **📺 Fullscreen Gameplay (No Overlay)**: `http://localhost:8080/widgets/chat/index.html?profile=screen_no_overlay` (clean 28% pill overlay)
- **👻 Ghost Minimal 100% Transparent**: `http://localhost:8080/widgets/chat/index.html?profile=ghost` (borderless, deep drop-shadow on text)
- **💬 Comic / Pop Scene**: `http://localhost:8080/widgets/chat/index.html?profile=bubble` (asymmetrical speech bubble with dual gradient)

#### Optional Fine-Tuning Query Parameters:
Any style property can be fine-tuned or overridden on the fly:
- `&shape=rounded|soft_card|scifi|bubble|pill|arcade|box|tag|slant` (message card shape)
- `&opacity=0..100` (background opacity percentage)
- `&size=12..24` (font size in px)
- `&font=outfit|orbitron|poppins|inter|comfortaa|rajdhani|mono` (typography)
- `&border=57D6C4` (hex border accent color)

---

## 2. DOM Hierarchy (HTML)

The widget dynamically constructs this DOM structure:

```html
<body class="theme-maker_glass layout-box">
  <!-- 1. Reactive particle canvas (hype & confetti) -->
  <canvas id="particle-canvas"></canvas>

  <!-- 2. Spotlight Pinned Message -->
  <div id="chat-spotlight-box">
    <div class="spotlight-card">
      <div class="spotlight-badge">📌 PINNED MESSAGE</div>
      <div id="spotlight-author" class="spotlight-user">Username</div>
      <div id="spotlight-content" class="spotlight-text">Question or pinned comment...</div>
    </div>
  </div>

  <!-- 3. Message Stream Container -->
  <div id="chat-box" class="chat-container">
    <div class="chat-msg role-moderator" data-role="moderator" data-user="viewer">
      <div class="msg-header">
        <div class="user-badges">
          <span class="badge-chip broadcaster">👑</span>
          <span class="badge-chip moderator">🛡️</span>
          <span class="badge-chip vip">💎</span>
          <span class="badge-chip subscriber">⭐</span>
          <span class="badge-chip artist">🎨</span>
        </div>
        <span class="username-text" style="color: #22C55E;">Username</span>
      </div>
      <div class="msg-body">
        <span class="msg-text">Hello stream!</span>
      </div>
    </div>
  </div>
</body>
```
