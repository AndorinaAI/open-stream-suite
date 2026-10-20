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
- **Recommended On-Screen Theme**: `http://localhost:8080/widgets/chat/?theme=screen_no_overlay` (deep contrast drop-shadow and translucent bubble for readability).
- **Ghost Transparent Theme**: `http://localhost:8080/widgets/chat/?theme=ghost` (100% transparent text without borders).

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
