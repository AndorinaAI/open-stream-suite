
function insertCssTemplateIntoChat(templateKey) {
  const cssEl = document.getElementById('cfg-chat-custom-css');
  if (!cssEl) return;
  const templates = {
    cyber_neon: `/* Preset Neón Cyber Gamer */
.chat-msg {
  background: linear-gradient(135deg, rgba(14, 18, 26, 0.94), rgba(5, 7, 12, 0.96)) !important;
  border-left: 4px solid var(--chat-accent, #57D6C4) !important;
  border-right: 1px solid rgba(87, 214, 196, 0.25) !important;
  border-radius: 4px 14px 14px 4px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8), 0 0 16px rgba(87, 214, 196, 0.35) !important;
}
.username-text {
  text-shadow: 0 0 8px currentColor !important;
}`,
    floating_clean: `/* Flotante Directo en Pantalla (Alta Legibilidad) */
.chat-msg {
  background: rgba(10, 14, 20, 0.32) !important;
  border-radius: 30px !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-left: 3px solid #38BDF8 !important;
  backdrop-filter: blur(10px) !important;
  padding: 8px 16px !important;
}
.msg-body, .username-text {
  text-shadow: 0 1px 3px #000, 0 2px 8px rgba(0,0,0,0.95), 0 0 14px #000 !important;
}`,
    esports_slant: `/* Esports Slant Inclinado */
.chat-msg {
  clip-path: polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%) !important;
  border-radius: 0 !important;
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.22), rgba(18, 18, 24, 0.96)) !important;
  border-left: 4px solid #EF4444 !important;
  padding: 10px 22px !important;
}
.chat-msg .username-text {
  text-transform: uppercase;
  letter-spacing: 1px;
}`,
    kawaii_soft: `/* Nube Kawaii Pastel */
.chat-msg {
  border-radius: 18px !important;
  background: linear-gradient(135deg, rgba(244, 114, 182, 0.22), rgba(30, 20, 45, 0.92)) !important;
  border: 1.5px solid rgba(244, 114, 182, 0.4) !important;
  box-shadow: 0 8px 24px rgba(244, 114, 182, 0.2) !important;
}
.badge-chip { border-radius: 12px !important; }`,
    retro_pixel: `/* Retro 8-Bit Arcade */
.chat-msg {
  border-radius: 0 !important;
  border: 2px solid var(--chat-accent, #57D6C4) !important;
  background: #0B0E14 !important;
  box-shadow: 4px 4px 0 #000 !important;
}
.username-text {
  text-transform: uppercase;
}`
  };

  const code = templates[templateKey];
  if (!code) return;
  cssEl.value = (cssEl.value ? cssEl.value.trim() + '\n\n' : '') + code;
  updateChatPipPreview();
  alert('✓ Plantilla CSS insertada en la casilla de CSS Personalizado y aplicada a la vista previa.');
}

function openChatThemeGuideModal() {
  const modalContainer = document.getElementById('miniapp-modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="miniapp-modal-overlay" onclick="if(event.target === this) closeMiniAppModal()">
      <div class="miniapp-modal-box" style="max-width: 860px; max-height: 85vh; display: flex; flex-direction: column;">
        <div class="miniapp-modal-header" style="flex-shrink: 0;">
          <div style="font-family: var(--font-tech); font-size: 14px; font-weight: 700; color: var(--color-accent-cyan); display: flex; align-items: center; gap: 8px;">
            <span>📖</span>
            <span>Manual Técnico y Guía Integral de Estilos CSS para el Chat</span>
          </div>
          <button type="button" class="btn-stage-preset" onclick="closeMiniAppModal()" style="font-size: 12px; padding: 4px 8px;">✕ Cerrar</button>
        </div>

        <div class="miniapp-modal-body" style="font-size: 13px; color: #E2E8F0; line-height: 1.6; overflow-y: auto; padding-right: 12px;">
          
          <!-- SECCIÓN 1: MODOS DE USO Y OBS -->
          <div style="margin-bottom: 20px; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 14px;">
            <h4 style="margin: 0 0 8px 0; color: var(--color-accent-cyan); font-family: var(--font-tech); font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span>🎯</span> 1. Modos de Uso y Parámetros URL en OBS Studio
            </h4>
            <div style="font-size: 12px; color: var(--color-text-dim); margin-bottom: 8px;">
              El widget detecta automáticamente el modo de despliegue mediante parámetros en la URL de OBS:
            </div>
            <ul style="margin: 0; padding-left: 20px; font-size: 12px; display: flex; flex-direction: column; gap: 6px;">
              <li><strong>Enmarcado en caja de overlay (Box)</strong>: <code>/widgets/chat/?layout=box</code> (ocupa el 100% del cuadro asignado en tu plantilla, ideal para columnas de chat laterales).</li>
              <li><strong>Flotante Directo en Pantalla</strong>: <code>/widgets/chat/?theme=screen_no_overlay</code> (diseñado para fuentes de 1920×1080 sobre gameplay con fondo sutil y sombras de alto contraste).</li>
              <li><strong>100% Transparente sin bordes (Ghost)</strong>: <code>/widgets/chat/?theme=ghost</code> (solo el texto y emoticonos flotando con sombra profunda).</li>
              <li><strong>Posicionamiento automático en pantalla</strong>: <code>?pos=bottom-left</code>, <code>?pos=bottom-right</code>, <code>?pos=top-left</code> o <code>?pos=top-right</code>.</li>
            </ul>
          </div>

          <!-- SECCIÓN 2: JERARQUÍA DEL DOM Y SELECTORES -->
          <div style="margin-bottom: 20px; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 14px;">
            <h4 style="margin: 0 0 8px 0; color: var(--color-accent-cyan); font-family: var(--font-tech); font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span>📐</span> 2. Jerarquía del DOM y Selectores CSS Clave
            </h4>
            <div style="font-size: 12px; color: var(--color-text-dim); margin-bottom: 10px;">
              Todos los elementos del chat cuentan con clases semánticas identificables para control total con CSS:
            </div>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--color-border-dim); color: var(--color-accent-cyan);">
                    <th style="padding: 6px 8px;">Selector CSS</th>
                    <th style="padding: 6px 8px;">Elemento Representado</th>
                    <th style="padding: 6px 8px;">Propiedades Útiles</th>
                  </tr>
                </thead>
                <tbody style="color: #CBD5E1;">
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 6px 8px; font-family: monospace; color: #57D6C4;">.chat-container</td>
                    <td style="padding: 6px 8px;">Contenedor vertical de mensajes</td>
                    <td style="padding: 6px 8px;">gap, max-width, justify-content</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 6px 8px; font-family: monospace; color: #57D6C4;">.chat-msg</td>
                    <td style="padding: 6px 8px;">Burbuja / tarjeta del mensaje individual</td>
                    <td style="padding: 6px 8px;">background, border, border-radius, clip-path, box-shadow</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 6px 8px; font-family: monospace; color: #57D6C4;">.chat-msg.role-*</td>
                    <td style="padding: 6px 8px;">Variantes por rango (broadcaster, moderator, vip, subscriber, artist, follower, viewer)</td>
                    <td style="padding: 6px 8px;">border-left-color, background, box-shadow</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 6px 8px; font-family: monospace; color: #57D6C4;">.msg-header</td>
                    <td style="padding: 6px 8px;">Cabecera (insignias + nombre)</td>
                    <td style="padding: 6px 8px;">display: flex, align-items: center, gap</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 6px 8px; font-family: monospace; color: #57D6C4;">.badge-chip</td>
                    <td style="padding: 6px 8px;">Insignias individuales (👑, 🛡️, 💎, ⭐, 🎨, 💜, 👤)</td>
                    <td style="padding: 6px 8px;">background, border-radius, font-size</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 6px 8px; font-family: monospace; color: #57D6C4;">.username-text</td>
                    <td style="padding: 6px 8px;">Nombre del espectador de Twitch</td>
                    <td style="padding: 6px 8px;">font-weight, text-transform, text-shadow</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 6px 8px; font-family: monospace; color: #57D6C4;">.msg-body</td>
                    <td style="padding: 6px 8px;">Cuerpo de texto del mensaje</td>
                    <td style="padding: 6px 8px;">color, line-height, text-shadow, font-size</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 6px 8px; font-family: monospace; color: #57D6C4;">.msg-body img.twitch-emote</td>
                    <td style="padding: 6px 8px;">Emoticonos de Twitch, BTTV y 7TV</td>
                    <td style="padding: 6px 8px;">height (por defecto 28px), margin</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 6px 8px; font-family: monospace; color: #57D6C4;">.chat-msg.fading</td>
                    <td style="padding: 6px 8px;">Estado de desvanecimiento tras N segundos</td>
                    <td style="padding: 6px 8px;">opacity, transform, transition</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 6px 8px; font-family: monospace; color: #57D6C4;">#chat-spotlight-box</td>
                    <td style="padding: 6px 8px;">Tarjeta de mensaje fijado (Spotlight)</td>
                    <td style="padding: 6px 8px;">top, left, width, animation</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- SECCIÓN 3: VARIABLES CSS DEL SISTEMA -->
          <div style="margin-bottom: 20px; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 14px;">
            <h4 style="margin: 0 0 8px 0; color: var(--color-accent-cyan); font-family: var(--font-tech); font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span>🎨</span> 3. Variables CSS Nativas (:root)
            </h4>
            <div style="font-size: 12px; color: var(--color-text-dim); margin-bottom: 8px;">
              Puedes redefinir los colores de roles, acentos y fuentes globales con solo reasignar estas variables:
            </div>
            <pre style="background: #080A0C; border: 1px solid var(--color-border-dim); border-radius: 4px; padding: 10px; font-size: 11px; color: #57D6C4; margin: 0; overflow-x: auto;">
:root {
  /* Acento Neón Global */
  --chat-accent: #57D6C4;

  /* Colores Reactivos por Rol */
  --color-broadcaster: #EF4444; /* 👑 Streamer */
  --color-moderator:   #22C55E; /* 🛡️ Moderador */
  --color-vip:         #EC4899; /* 💎 VIP */
  --color-subscriber:  #F59E0B; /* ⭐ Suscriptor */
  --color-artist:      #8B5CF6; /* 🎨 Artista */
  --color-follower:    #38BDF8; /* 💜 Seguidor Normal */
  --color-viewer:      #94A3B8; /* 👤 Espectador sin rol */
}</pre>
          </div>

          <!-- SECCIÓN 4: RECETAS LISTAS PARA APLICAR -->
          <div style="margin-bottom: 20px; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 14px;">
            <h4 style="margin: 0 0 8px 0; color: var(--color-accent-cyan); font-family: var(--font-tech); font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span>🚀</span> 4. Biblioteca de Recetas CSS Listas para Usar (1 Clic)
            </h4>
            <div style="font-size: 12px; color: var(--color-text-dim); margin-bottom: 12px;">
              Haz clic en cualquier receta para insertarla instantáneamente en tu casilla de CSS Personalizado y verla en la previsualización:
            </div>

            <!-- Receta 1: Neón Cyber Gamer -->
            <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-weight: 700; color: #57D6C4; font-size: 12px;">⚡ 1. Neón Cyber Gamer (Glow + Borde Asimétrico)</span>
                <button type="button" class="btn-action-primary" style="font-size: 10px; padding: 3px 8px;" onclick="insertCssTemplateIntoChat('cyber_neon')">📥 Aplicar este Estilo</button>
              </div>
              <pre style="background: #080A0C; padding: 8px; border-radius: 4px; font-size: 10px; color: #94A3B8; margin: 0; overflow-x: auto;">
.chat-msg {
  background: linear-gradient(135deg, rgba(14, 18, 26, 0.94), rgba(5, 7, 12, 0.96)) !important;
  border-left: 4px solid var(--chat-accent, #57D6C4) !important;
  border-right: 1px solid rgba(87, 214, 196, 0.25) !important;
  border-radius: 4px 14px 14px 4px !important;
  box-shadow: 0 4px 20px rgba(0,0,0,0.8), 0 0 16px rgba(87, 214, 196, 0.35) !important;
}
.username-text { text-shadow: 0 0 8px currentColor !important; }</pre>
            </div>

            <!-- Receta 2: Flotante Alta Lectura Directo Pantalla -->
            <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-weight: 700; color: #38BDF8; font-size: 12px;">📺 2. Flotante Directo en Pantalla (Máxima Lectura sobre Juegos)</span>
                <button type="button" class="btn-action-primary" style="font-size: 10px; padding: 3px 8px;" onclick="insertCssTemplateIntoChat('floating_clean')">📥 Aplicar este Estilo</button>
              </div>
              <pre style="background: #080A0C; padding: 8px; border-radius: 4px; font-size: 10px; color: #94A3B8; margin: 0; overflow-x: auto;">
.chat-msg {
  background: rgba(10, 14, 20, 0.32) !important;
  border-radius: 30px !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-left: 3px solid #38BDF8 !important;
  backdrop-filter: blur(10px) !important;
  padding: 8px 16px !important;
}
.msg-body, .username-text {
  text-shadow: 0 1px 3px #000, 0 2px 8px rgba(0,0,0,0.95), 0 0 14px #000 !important;
}</pre>
            </div>

            <!-- Receta 3: Esports Slant Inclinado -->
            <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-weight: 700; color: #EF4444; font-size: 12px;">🎮 3. Esports Arena (Corte Inclinado con Clip-Path)</span>
                <button type="button" class="btn-action-primary" style="font-size: 10px; padding: 3px 8px;" onclick="insertCssTemplateIntoChat('esports_slant')">📥 Aplicar este Estilo</button>
              </div>
              <pre style="background: #080A0C; padding: 8px; border-radius: 4px; font-size: 10px; color: #94A3B8; margin: 0; overflow-x: auto;">
.chat-msg {
  clip-path: polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%) !important;
  border-radius: 0 !important;
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.22), rgba(18, 18, 24, 0.96)) !important;
  border-left: 4px solid #EF4444 !important;
  padding: 10px 22px !important;
}
.chat-msg .username-text { text-transform: uppercase; letter-spacing: 1px; }</pre>
            </div>

            <!-- Receta 4: Nube Kawaii Pastel -->
            <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-weight: 700; color: #F472B6; font-size: 12px;">🌸 4. Nube Kawaii Pastel (Ultra Curvo Suave)</span>
                <button type="button" class="btn-action-primary" style="font-size: 10px; padding: 3px 8px;" onclick="insertCssTemplateIntoChat('kawaii_soft')">📥 Aplicar este Estilo</button>
              </div>
              <pre style="background: #080A0C; padding: 8px; border-radius: 4px; font-size: 10px; color: #94A3B8; margin: 0; overflow-x: auto;">
.chat-msg {
  border-radius: 18px !important;
  background: linear-gradient(135deg, rgba(244, 114, 182, 0.22), rgba(30, 20, 45, 0.92)) !important;
  border: 1.5px solid rgba(244, 114, 182, 0.4) !important;
  box-shadow: 0 8px 24px rgba(244, 114, 182, 0.2) !important;
}
.badge-chip { border-radius: 12px !important; }</pre>
            </div>

            <!-- Receta 5: Retro Arcade 8-Bit -->
            <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-weight: 700; color: #F59E0B; font-size: 12px;">👾 5. Retro Arcade 8-Bit (Caja Sólida con Sombra Pixel)</span>
                <button type="button" class="btn-action-primary" style="font-size: 10px; padding: 3px 8px;" onclick="insertCssTemplateIntoChat('retro_pixel')">📥 Aplicar este Estilo</button>
              </div>
              <pre style="background: #080A0C; padding: 8px; border-radius: 4px; font-size: 10px; color: #94A3B8; margin: 0; overflow-x: auto;">
.chat-msg {
  border-radius: 0 !important;
  border: 2px solid var(--chat-accent, #57D6C4) !important;
  background: #0B0E14 !important;
  box-shadow: 4px 4px 0 #000 !important;
}
.username-text { text-transform: uppercase; }</pre>
            </div>
          </div>

          <!-- SECCIÓN 5: ANIMACIONES Y FÍSICAS -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 14px;">
            <h4 style="margin: 0 0 8px 0; color: var(--color-accent-cyan); font-family: var(--font-tech); font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span>✨</span> 5. Animación de Entrada Personalizada (@keyframes)
            </h4>
            <div style="font-size: 12px; color: var(--color-text-dim); margin-bottom: 8px;">
              Cambia la animación por defecto de los mensajes que van apareciendo en el stream:
            </div>
            <pre style="background: #080A0C; border: 1px solid var(--color-border-dim); border-radius: 4px; padding: 10px; font-size: 11px; color: #57D6C4; margin: 0; overflow-x: auto;">
/* Entrada con rebote y escala elástica */
@keyframes msg-pop-in {
  0%   { opacity: 0; transform: scale(0.85) translateY(10px); }
  70%  { opacity: 1; transform: scale(1.03) translateY(-2px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.chat-msg {
  animation: msg-pop-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
}</pre>
          </div>

        </div>

        <div class="miniapp-modal-footer" style="flex-shrink: 0; padding-top: 12px; border-top: 1px solid var(--color-border-dim);">
          <button type="button" class="btn-action-primary" onclick="closeMiniAppModal()">Cerrar Manual</button>
        </div>
      </div>
    </div>
  `;
}

function closeMiniAppModal() {
  const modalContainer = document.getElementById('miniapp-modal-container');
  if (modalContainer) modalContainer.innerHTML = '';
}
