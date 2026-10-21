// ====================================================================
// PROMO / SHOUTOUT PANEL - PESTAÑA 1 Y 2: CREADOR Y GENERADOR QR
// ====================================================================

window.buildPromoCreatorTabHtml = function(activeTab, presetsOptionsHtml, isStreamerMode, activePreset, p, tr) {
  return `
    <div id="promo-tab-creator" style="display: ${activeTab === 'creator' ? 'block' : 'none'};">
      <!-- BARRA DE PRESETS COMPACTA -->
      <div style="background: rgba(0,0,0,0.35); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 240px;">
          <label style="font-size: 11px; font-weight: 700; color: #57D6C4; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
            ⭐ Preset:
          </label>
          <select id="cfg-promo-preset-select" class="form-select" style="flex: 1; font-weight: 600; font-size: 12px; padding: 4px 8px;" onchange="onPromoPresetChange(this.value)">
            ${presetsOptionsHtml}
          </select>
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 4px 10px;" onclick="onPromoPresetChange(document.getElementById('cfg-promo-preset-select').value)" title="Cargar este preset">
            📥 Cargar
          </button>
          <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 4px 10px;" onclick="saveCurrentPromoPreset()" title="Guardar cambios">
            💾 Guardar
          </button>
          <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 4px 8px;" onclick="renameCurrentPromoPreset()" title="Renombrar">
            ✏️
          </button>
          <button type="button" class="btn-action-primary" style="font-size: 11px; padding: 4px 10px;" onclick="saveCurrentPromoAsPreset()" title="Guardar como nuevo preset">
            ➕ Nuevo...
          </button>
          <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 4px 8px; color: #EF4444;" onclick="deleteCurrentPromoPreset()" title="Eliminar preset">
            🗑️
          </button>
        </div>
      </div>

      <!-- GRID 2 COLUMNAS: FORMULARIO A LA IZQUIERDA, PREVIEW Y LANZADOR A LA DERECHA -->
      <div style="display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 16px; align-items: start;">
        <!-- COLUMNA IZQUIERDA: CAMPOS DE LA PROMOCIÓN -->
        <div style="background: rgba(25,29,33,0.7); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 14px;">
          <!-- Selector de Modo: Streamer vs Personalizada -->
          <div style="display: flex; gap: 6px; margin-bottom: 12px;">
            <button type="button" id="btn-promo-mode-streamer" class="btn-stage-preset ${isStreamerMode ? 'active' : ''}" style="flex: 1; font-size: 11px; padding: 6px 10px; font-weight: 700; border-color: ${isStreamerMode ? '#57D6C4' : 'var(--color-border-dim)'};" onclick="setPromoMode('shoutout')">
              👤 Streamer / Usuario
            </button>
            <button type="button" id="btn-promo-mode-custom" class="btn-stage-preset ${!isStreamerMode ? 'active' : ''}" style="flex: 1; font-size: 11px; padding: 6px 10px; font-weight: 700; border-color: ${!isStreamerMode ? '#FF783F' : 'var(--color-border-dim)'};" onclick="setPromoMode('custom')">
              📦 Promo Personalizada (Maker / Merch / Redes)
            </button>
          </div>

          <input type="hidden" id="cfg-promo-current-mode" value="${isStreamerMode ? 'shoutout' : 'custom'}">

          <!-- MODO A: STREAMER / SHOUTOUT -->
          <div id="box-promo-streamer" style="display: ${isStreamerMode ? 'block' : 'none'};">
            <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 10px; margin-bottom: 10px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Usuario Twitch:</label>
                <div style="display: flex; gap: 4px;">
                  <input type="text" id="cfg-promo-streamer" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="ej. midudev" value="${activePreset.streamer || 'andorina'}" oninput="updatePromoPipPreview()">
                  <button type="button" class="btn-stage-preset" style="white-space: nowrap; font-size: 11px; padding: 0 8px;" onclick="searchTwitchUserForPromo()" title="Consultar en Twitch">
                    🔍
                  </button>
                </div>
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Nombre a Mostrar:</label>
                <input type="text" id="cfg-promo-display-name" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="ej. Midudev" value="${activePreset.display_name || activePreset.title || 'Andorina'}" oninput="updatePromoPipPreview()">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Juego / Categoría:</label>
                <input type="text" id="cfg-promo-game" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="ej. Software Development" value="${activePreset.game || activePreset.subtitle || 'Cacharreo & Directos'}" oninput="updatePromoPipPreview()">
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Avatar URL (opcional):</label>
                <input type="text" id="cfg-promo-avatar" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="Dejar vacío para usar Twitch" value="${activePreset.avatar || ''}" oninput="updatePromoPipPreview()">
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 0;">Mensaje o Recomendación (opcional):</label>
                <button type="button" class="btn-stage-preset" style="font-size: 9px; padding: 2px 6px; color: #57D6C4;" onclick="openWidgetDevGuideModal('promo')">📖 Tokens & Stream Deck</button>
              </div>
              <input type="text" id="cfg-promo-message" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="ej. ¡Pasaos a saludar a {streamer} jugando a {game}!" value="${activePreset.message || ''}" oninput="updatePromoPipPreview()">
              
              <!-- CHIPS DE TOKENS PROMO -->
              <div style="margin-top: 4px; display: flex; gap: 4px; flex-wrap: wrap;">
                <button type="button" class="btn-stage-preset" style="font-size: 9px; padding: 1px 5px; color: #57D6C4;" onclick="insertPromoToken('{streamer}')" title="Nombre de usuario del canal">{streamer}</button>
                <button type="button" class="btn-stage-preset" style="font-size: 9px; padding: 1px 5px; color: #38BDF8;" onclick="insertPromoToken('{game}')" title="Juego o categoría de Twitch">{game}</button>
                <button type="button" class="btn-stage-preset" style="font-size: 9px; padding: 1px 5px; color: #A78BFA;" onclick="insertPromoToken('{title}')" title="Nombre o título visible">{title}</button>
              </div>
            </div>

            <!-- OPCIÓN CLIP DE TWITCH -->
            <div style="background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.3); border-radius: 6px; padding: 8px 12px; margin-bottom: 10px;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 11px; font-weight: 700; color: #fff;">
                <input type="checkbox" id="cfg-promo-play-clip" ${activePreset.playClip ? 'checked' : ''} onchange="document.getElementById('box-promo-clip-details').style.display = this.checked ? 'block' : 'none'; updatePromoPipPreview();">
                <span>🎬 Reproducir Clip destacado de su canal en OBS</span>
              </label>
              <div id="box-promo-clip-details" style="display: ${activePreset.playClip ? 'block' : 'none'}; margin-top: 6px;">
                <input type="text" id="cfg-promo-clip-url" class="form-input" style="font-size: 11px; padding: 4px 8px;" placeholder="URL/ID Clip específico (o vacío para el más visto de Twitch)" value="${activePreset.clip_url || ''}" oninput="updatePromoPipPreview()">
              </div>
            </div>

            <!-- OPCIÓN MOSTRAR QR -->
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 11px; color: #fff;">
                <input type="checkbox" id="cfg-promo-show-qr" ${activePreset.showQR !== false ? 'checked' : ''} onchange="updatePromoPipPreview()">
                <span>📱 Mostrar Código QR escaneable con enlace al canal</span>
              </label>
            </div>
          </div>

          <!-- MODO B: PROMO PERSONALIZADA (MAKER / MERCH / REDES) -->
          <div id="box-promo-custom" style="display: ${!isStreamerMode ? 'block' : 'none'};">
            <div style="display: grid; grid-template-columns: 1.3fr 0.7fr; gap: 10px; margin-bottom: 10px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Título / Asunto:</label>
                <input type="text" id="cfg-promo-title" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="ej. Pegatinas Holográficas Maker" value="${activePreset.title || 'Pegatinas Holográficas Maker'}" oninput="updatePromoPipPreview()">
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Distintivo Superior:</label>
                <input type="text" id="cfg-promo-eyebrow" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="ej. 🛒 TIENDA" value="${activePreset.eyebrow || '🛒 DESTACADO DEL STREAM'}" oninput="updatePromoPipPreview()">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1.3fr 0.7fr; gap: 10px; margin-bottom: 10px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Descripción o Subtítulo:</label>
                <input type="text" id="cfg-promo-subtitle" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="ej. Vinilo impermeable" value="${activePreset.subtitle || 'Vinilo troquelado impermeable'}" oninput="updatePromoPipPreview()">
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Precio / Distintivo:</label>
                <input type="text" id="cfg-promo-price" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="ej. 3.50€ o ¡GRATIS!" value="${activePreset.price || '3.50€'}" oninput="updatePromoPipPreview()">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Enlace de Destino (Texto / QR):</label>
                <input type="text" id="cfg-promo-link" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="ej. https://tienda.com" value="${activePreset.link || 'https://twitch.tv/andorina'}" oninput="updatePromoPipPreview()">
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 4px; display: block;">Imagen / GIF Animado (URL):</label>
                <input type="text" id="cfg-promo-image-url" class="form-input" style="font-size: 12px; padding: 5px 8px;" placeholder="ej. /media/pegatina.png" value="${activePreset.image_url || activePreset.media_url || ''}" oninput="updatePromoPipPreview()">
              </div>
            </div>

            <!-- OPCIÓN MOSTRAR QR -->
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 11px; color: #fff;">
                <input type="checkbox" id="cfg-promo-custom-show-qr" ${activePreset.showQR !== false ? 'checked' : ''} onchange="updatePromoPipPreview()">
                <span>📱 Mostrar Código QR escaneable con este enlace o datos</span>
              </label>
            </div>
          </div>

          <!-- BANNER DE ESTADO DEL QR INTEGRADO -->
          <div style="margin-top: 12px; background: rgba(0,0,0,0.3); border: 1px dashed var(--color-border-dim); border-radius: 6px; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between;">
            <span id="lbl-promo-current-qr-status" style="font-size: 11px; color: #94A3B8;">
              📱 QR configurado: <strong>Enlace Web</strong> | Logo: <strong>Ninguno</strong>
            </span>
            <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 3px 8px; color: #57D6C4;" onclick="switchPromoSubTab('qr')">
              ⚙️ Cambiar a Contacto / Wi-Fi / Logo ➔
            </button>
          </div>
        </div>

        <!-- COLUMNA DERECHA: VISTA PREVIA Y BOTÓN DE LANZAMIENTO (STICKY) -->
        <div style="display: flex; flex-direction: column; gap: 10px; position: sticky; top: 10px;">
          <!-- VISTA PREVIA EN VIVO -->
          <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; font-family: var(--font-tech); font-weight: 700; color: #57D6C4; text-transform: uppercase;">
                👁️ Vista Previa en Vivo (OBS)
              </span>
              <span style="font-size: 9px; color: var(--color-text-dim);">Actualizado en tiempo real</span>
            </div>
            <div id="promo-live-preview-container" style="background: #0B0D0F; border: 1px dashed var(--color-border-dim); border-radius: 6px; padding: 12px; min-height: 100px; display: flex; justify-content: center; align-items: center; overflow: hidden;">
            </div>
          </div>

          <!-- CONTROLES COMPACTOS DE DURACIÓN Y SONIDO -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 8px 12px; display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center;">
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                <span style="font-size: 11px; font-weight: 600; color: #fff;">Duración:</span>
                <span id="lbl-promo-duration" style="font-size: 11px; font-family: var(--font-tech); font-weight: 700; color: #57D6C4;">
                  ${Math.round((p.duration || 8000) / 1000)}s
                </span>
              </div>
              <input type="range" id="cfg-promo-duration" min="4" max="30" value="${Math.round((p.duration || 8000) / 1000)}" oninput="document.getElementById('lbl-promo-duration').textContent = this.value + 's';" style="width: 100%;">
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: #fff;">
                <input type="checkbox" id="cfg-promo-sound" ${p.soundChime !== false ? 'checked' : ''}>
                <span>🔔 Sonido</span>
              </label>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 10px; color: var(--color-text-dim);">Acento:</span>
                <input type="color" id="cfg-promo-color" value="${activePreset.color || '#57D6C4'}" style="height: 22px; width: 34px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 3px;" onchange="updatePromoPipPreview()">
              </div>
            </div>
          </div>

          <!-- BOTÓN PRINCIPAL DE LANZAMIENTO -->
          <button type="button" class="btn-action-primary" style="width: 100%; font-size: 13px; padding: 12px 14px; font-weight: 800; letter-spacing: 0.5px; box-shadow: 0 4px 16px rgba(87,214,196,0.3); text-align: center;" onclick="launchCurrentPromoToOBS()">
            ${tr('widgets.promo_btn_launch_obs', '🚀 ¡LANZAR A PANTALLA (OBS)!')}
          </button>

          <!-- ACCIONES SECUNDARIAS COMPACTAS -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 7px;" onclick="saveCurrentPromoAsPreset()">
              💾 Guardar Preset
            </button>
            <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 7px; color: #57D6C4; border-color: #57D6C4;" onclick="saveCurrentPromoAsShortcut()">
              ➕ Acción Rápida
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
};

window.buildPromoQRTabHtml = function(activeTab) {
  return `
    <div id="promo-tab-qr" style="display: ${activeTab === 'qr' ? 'block' : 'none'};">
      <div style="display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 16px; align-items: start;">
        <!-- COLUMNA IZQUIERDA: CONFIGURACIÓN MULTI-FORMATO Y LOGOTIPO -->
        <div style="background: rgba(25,29,33,0.7); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 14px;">
          <!-- 1. TIPO DE INFORMACIÓN -->
          <div style="margin-bottom: 12px;">
            <label style="font-size: 11px; font-weight: 700; color: #57D6C4; text-transform: uppercase; margin-bottom: 6px; display: block;">
              1. ¿Qué información llevará el Código QR?
            </label>
            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
              <button type="button" id="btn-qr-type-url" class="btn-stage-preset active" style="font-size: 11px; padding: 5px 9px; border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15);" onclick="setQRDataType('url')">
                🌐 Enlace Web
              </button>
              <button type="button" id="btn-qr-type-vcard" class="btn-stage-preset" style="font-size: 11px; padding: 5px 9px;" onclick="setQRDataType('vcard')">
                📇 Contacto (vCard)
              </button>
              <button type="button" id="btn-qr-type-wifi" class="btn-stage-preset" style="font-size: 11px; padding: 5px 9px;" onclick="setQRDataType('wifi')">
                📶 Clave Wi-Fi
              </button>
              <button type="button" id="btn-qr-type-social" class="btn-stage-preset" style="font-size: 11px; padding: 5px 9px;" onclick="setQRDataType('social')">
                📱 Red Social
              </button>
              <button type="button" id="btn-qr-type-text" class="btn-stage-preset" style="font-size: 11px; padding: 5px 9px;" onclick="setQRDataType('text')">
                💬 Texto Libre
              </button>
            </div>
          </div>

          <!-- CONTENEDOR TIPO A: ENLACE WEB -->
          <div id="box-qr-type-url" style="margin-bottom: 12px;">
            <label style="font-size: 11px; color: #fff; display: block; margin-bottom: 4px;">URL o Enlace Web de Destino:</label>
            <input type="text" id="cfg-qr-url-val" class="form-input" style="font-size: 12px; padding: 6px 8px;" placeholder="https://twitch.tv/andorina o https://tienda.com" value="https://twitch.tv/andorina" oninput="updateQRGeneratorPreview()">
          </div>

          <!-- CONTENEDOR TIPO B: CONTACTO VCARD -->
          <div id="box-qr-type-vcard" style="display: none; margin-bottom: 12px; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
            <div style="font-size: 10px; color: #57D6C4; font-weight: 700; margin-bottom: 8px;">
              📇 TARJETA DE CONTACTO (Se guarda en la agenda del espectador con 1 escaneo):
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px;">
              <div>
                <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Nombre Completo:</label>
                <input type="text" id="cfg-qr-vcard-name" class="form-input" style="font-size: 11px; padding: 4px 6px;" placeholder="Andorina Maker" value="Andorina" oninput="updateQRGeneratorPreview()">
              </div>
              <div>
                <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Teléfono:</label>
                <input type="text" id="cfg-qr-vcard-tel" class="form-input" style="font-size: 11px; padding: 4px 6px;" placeholder="+34 600 000 000" oninput="updateQRGeneratorPreview()">
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px;">
              <div>
                <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Correo Electrónico:</label>
                <input type="email" id="cfg-qr-vcard-email" class="form-input" style="font-size: 11px; padding: 4px 6px;" placeholder="contacto@taller.com" oninput="updateQRGeneratorPreview()">
              </div>
              <div>
                <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Organización / Taller:</label>
                <input type="text" id="cfg-qr-vcard-org" class="form-input" style="font-size: 11px; padding: 4px 6px;" placeholder="Taller Maker" value="Taller de Andorina" oninput="updateQRGeneratorPreview()">
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div>
                <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Página Web:</label>
                <input type="text" id="cfg-qr-vcard-url" class="form-input" style="font-size: 11px; padding: 4px 6px;" placeholder="https://twitch.tv/andorina" value="https://twitch.tv/andorina" oninput="updateQRGeneratorPreview()">
              </div>
              <div>
                <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Nota / Bio:</label>
                <input type="text" id="cfg-qr-vcard-note" class="form-input" style="font-size: 11px; padding: 4px 6px;" placeholder="Contacto directo" value="Contacto desde directo Twitch" oninput="updateQRGeneratorPreview()">
              </div>
            </div>
          </div>

          <!-- CONTENEDOR TIPO C: RED WI-FI -->
          <div id="box-qr-type-wifi" style="display: none; margin-bottom: 12px; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
            <div style="font-size: 10px; color: #57D6C4; font-weight: 700; margin-bottom: 8px;">
              📶 CONEXIÓN WI-FI RÁPIDA (Conecta el móvil automáticamente a la red):
            </div>
            <div style="display: grid; grid-template-columns: 1.2fr 1fr 0.8fr; gap: 8px; align-items: end;">
              <div>
                <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Nombre de Red (SSID):</label>
                <input type="text" id="cfg-qr-wifi-ssid" class="form-input" style="font-size: 11px; padding: 4px 6px;" placeholder="ej. Taller_Maker_Invitados" value="Taller_Maker" oninput="updateQRGeneratorPreview()">
              </div>
              <div>
                <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Contraseña:</label>
                <input type="text" id="cfg-qr-wifi-pass" class="form-input" style="font-size: 11px; padding: 4px 6px;" placeholder="Contraseña Wi-Fi" oninput="updateQRGeneratorPreview()">
              </div>
              <div>
                <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Seguridad:</label>
                <select id="cfg-qr-wifi-type" class="form-select" style="font-size: 11px; padding: 4px 6px;" onchange="updateQRGeneratorPreview()">
                  <option value="WPA" selected>WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">Abierta (Sin clave)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- CONTENEDOR TIPO D: RED SOCIAL DIRECTA -->
          <div id="box-qr-type-social" style="display: none; margin-bottom: 12px; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
            <div style="font-size: 10px; color: #57D6C4; font-weight: 700; margin-bottom: 8px;">
              📱 ENLACE RÁPIDO A RED SOCIAL:
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 8px;">
              <div>
                <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Plataforma:</label>
                <select id="cfg-qr-social-plat" class="form-select" style="font-size: 11px; padding: 4px 6px;" onchange="updateQRGeneratorPreview()">
                  <option value="twitch">🟣 Twitch</option>
                  <option value="youtube">🔴 YouTube</option>
                  <option value="instagram">📸 Instagram</option>
                  <option value="twitter">🐦 Twitter / X</option>
                  <option value="tiktok">🎵 TikTok</option>
                  <option value="discord">🎮 Discord</option>
                  <option value="github">🐙 GitHub</option>
                </select>
              </div>
              <div>
                <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Usuario o ID Servidor:</label>
                <input type="text" id="cfg-qr-social-user" class="form-input" style="font-size: 11px; padding: 4px 6px;" placeholder="ej. andorina" value="andorina" oninput="updateQRGeneratorPreview()">
              </div>
            </div>
          </div>

          <!-- CONTENEDOR TIPO E: TEXTO LIBRE -->
          <div id="box-qr-type-text" style="display: none; margin-bottom: 12px;">
            <label style="font-size: 11px; color: #fff; display: block; margin-bottom: 4px;">Texto Libre para el Código QR:</label>
            <textarea id="cfg-qr-text-val" class="form-input" rows="3" style="font-size: 11px; padding: 6px 8px; resize: vertical;" placeholder="Escribe el texto exacto que aparecerá al escanear..." oninput="updateQRGeneratorPreview()"></textarea>
          </div>

          <!-- 2. LOGOTIPO INCORPORADO EN EL CENTRO -->
          <div style="margin-bottom: 12px; border-top: 1px solid var(--color-border-dim); padding-top: 10px;">
            <label style="font-size: 11px; font-weight: 700; color: #57D6C4; text-transform: uppercase; margin-bottom: 6px; display: block;">
              2. Logotipo Central (Embebe icono dentro del QR):
            </label>
            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
              <button type="button" id="btn-qr-logo-none" class="btn-stage-preset active" style="font-size: 11px; padding: 4px 8px; border-color: #57D6C4; color: #57D6C4; background: rgba(87,214,196,0.15);" onclick="setQRLogo('none')">
                🚫 Sin Logo
              </button>
              <button type="button" id="btn-qr-logo-twitch" class="btn-stage-preset" style="font-size: 11px; padding: 4px 8px;" onclick="setQRLogo('twitch')">
                🟣 Twitch
              </button>
              <button type="button" id="btn-qr-logo-youtube" class="btn-stage-preset" style="font-size: 11px; padding: 4px 8px;" onclick="setQRLogo('youtube')">
                📺 YouTube
              </button>
              <button type="button" id="btn-qr-logo-maker" class="btn-stage-preset" style="font-size: 11px; padding: 4px 8px;" onclick="setQRLogo('maker')">
                ⚡ Maker
              </button>
              <button type="button" id="btn-qr-logo-shop" class="btn-stage-preset" style="font-size: 11px; padding: 4px 8px;" onclick="setQRLogo('shop')">
                🛒 Tienda
              </button>
              <button type="button" id="btn-qr-logo-custom" class="btn-stage-preset" style="font-size: 11px; padding: 4px 8px;" onclick="setQRLogo('custom')">
                🖼️ Subir Propia...
              </button>
            </div>

            <div id="box-qr-custom-logo" style="display: none; background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 8px; margin-top: 6px;">
              <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">URL de Imagen o Subir archivo:</label>
              <input type="text" id="cfg-qr-custom-logo-url" class="form-input" style="font-size: 11px; padding: 4px 6px; margin-bottom: 4px;" placeholder="https://... o /media/logo.png" oninput="updateQRGeneratorPreview()">
              <input type="file" id="cfg-qr-custom-logo-file" accept="image/*" style="font-size: 10px; color: #94A3B8;" onchange="handleQRLogoUpload(event)">
            </div>
          </div>

          <!-- 3. COLORES Y RESOLUCIÓN -->
          <div style="border-top: 1px solid var(--color-border-dim); padding-top: 10px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
            <div>
              <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Color Puntos:</label>
              <input type="color" id="cfg-qr-fg-color" value="#000000" style="width: 100%; height: 28px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="updateQRGeneratorPreview()">
            </div>
            <div>
              <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Color Fondo:</label>
              <input type="color" id="cfg-qr-bg-color" value="#FFFFFF" style="width: 100%; height: 28px; background: transparent; cursor: pointer; border: 1px solid var(--color-border-dim); border-radius: 4px;" onchange="updateQRGeneratorPreview()">
            </div>
            <div>
              <label style="font-size: 10px; color: var(--color-text-dim); display: block; margin-bottom: 2px;">Resolución:</label>
              <select id="cfg-qr-size" class="form-select" style="font-size: 11px; padding: 4px 6px;" onchange="updateQRGeneratorPreview()">
                <option value="250">250px (Pantalla)</option>
                <option value="500" selected>500px (OBS Alta)</option>
                <option value="1000">1000px (Impresión)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- COLUMNA DERECHA: PREVIEW EN CANVAS CON LOGO & BOTONES DE ACCIÓN -->
        <div style="display: flex; flex-direction: column; gap: 10px; align-items: center; background: rgba(0,0,0,0.4); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 14px; text-align: center;">
          <div style="font-size: 11px; font-weight: 700; color: #57D6C4; text-transform: uppercase;">
            VISTA PREVIA DEL CÓDIGO QR
          </div>
          <div style="background: #fff; padding: 8px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.6); display: inline-block;">
            <canvas id="qr-gen-canvas" width="220" height="220" style="display: block; width: 170px; height: 170px;"></canvas>
          </div>
          <div id="lbl-qr-result-summary" style="font-size: 10px; color: #94A3B8; max-width: 240px; word-break: break-word;">
            Listo para escanear con la cámara del móvil
          </div>

          <!-- BOTONES DE ACCIÓN DEL QR -->
          <div style="display: flex; flex-direction: column; gap: 6px; width: 100%; margin-top: 4px;">
            <button type="button" class="btn-action-primary" style="font-size: 11px; padding: 8px 12px;" onclick="downloadGeneratedQR()">
              📥 Descargar PNG (Con Logotipo)
            </button>
            <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 7px 10px;" onclick="copyGeneratedQRLink()">
              📋 Copiar Texto / Contenido
            </button>
            <button type="button" class="btn-stage-preset" style="font-size: 11px; padding: 7px 10px; color: #57D6C4; border-color: #57D6C4;" onclick="applyGeneratedQRToPromo()">
              🚀 Usar en Creador de Promo
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
};
