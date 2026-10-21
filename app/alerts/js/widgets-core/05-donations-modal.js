
// Modal interactivo: Asistente Fácil de Conexión de Donaciones (Streamlabs, Ko-fi, PayPal, BMC)
var activeDonationWizardTab = 'streamlabs'; // 'streamlabs' | 'webhooks' | 'test'

async function openDonationsModal() {
  const modalContainer = document.getElementById('miniapp-modal-container');
  if (!modalContainer) return;

  const currentHost = window.location.hostname || 'localhost';
  const currentPort = window.location.port || '8080';
  const localBaseUrl = `http://${currentHost}:${currentPort}`;

  // Cargar configuración guardada del backend
  let savedCfg = { tunnelUrl: '', streamlabsToken: '', streamlabsConnected: false };
  try {
    const res = await fetch('/api/donations/config');
    if (res.ok) {
      const d = await res.json();
      if (d && d.config) savedCfg = Object.assign({}, savedCfg, d.config);
    }
  } catch (e) {}

  window._donationsModalState = {
    localBaseUrl,
    tunnelUrl: savedCfg.tunnelUrl || '',
    streamlabsToken: savedCfg.streamlabsToken || '',
    streamlabsConnected: savedCfg.streamlabsConnected || false,
    activeTab: activeDonationWizardTab || 'streamlabs'
  };

  renderDonationsModalContent();
}

function switchDonationModalTab(tab) {
  activeDonationWizardTab = tab;
  if (window._donationsModalState) {
    window._donationsModalState.activeTab = tab;
  }
  renderDonationsModalContent();
}

function renderDonationsModalContent() {
  const modalContainer = document.getElementById('miniapp-modal-container');
  if (!modalContainer || !window._donationsModalState) return;

  const st = window._donationsModalState;
  const activeUrl = st.tunnelUrl && st.tunnelUrl.trim().length > 4 ? st.tunnelUrl.trim().replace(/\/+$/, '') : st.localBaseUrl;

  modalContainer.innerHTML = `
    <div class="miniapp-modal-overlay" onclick="if(event.target === this) closeMiniAppModal()">
      <div class="miniapp-modal-box" style="max-width: 880px; max-height: 90vh; display: flex; flex-direction: column;">
        
        <!-- Cabecera -->
        <div class="miniapp-modal-header" style="flex-shrink: 0;">
          <div style="font-family: var(--font-tech); font-size: 14px; font-weight: 700; color: #10B981; display: flex; align-items: center; gap: 8px;">
            <span>💰</span>
            <span>Asistente de Conexión de Donaciones (Ko-fi, PayPal, Buy Me a Coffee)</span>
          </div>
          <button type="button" class="btn-stage-preset" onclick="closeMiniAppModal()" style="font-size: 12px; padding: 4px 8px;">✕ Cerrar</button>
        </div>

        <!-- Pestañas de Métodos de Conexión -->
        <div style="display: flex; gap: 4px; border-bottom: 2px solid var(--color-border-dim); padding: 8px 16px 0; background: rgba(0,0,0,0.25); flex-shrink: 0;">
          <button type="button" class="btn-stage-preset ${st.activeTab === 'streamlabs' ? 'active' : ''}" style="font-size: 11px; padding: 6px 14px; font-weight: 700; ${st.activeTab === 'streamlabs' ? 'background: #10B981; color: #061A12;' : ''}" onclick="switchDonationModalTab('streamlabs')">
            ⚡ 1. Método Fácil: Streamlabs (Cero Túneles)
          </button>
          <button type="button" class="btn-stage-preset ${st.activeTab === 'webhooks' ? 'active' : ''}" style="font-size: 11px; padding: 6px 14px; font-weight: 700; ${st.activeTab === 'webhooks' ? 'background: #38BDF8; color: #041420;' : ''}" onclick="switchDonationModalTab('webhooks')">
            🌐 2. Webhooks Directos (Ko-fi / PayPal / BMC)
          </button>
          <button type="button" class="btn-stage-preset ${st.activeTab === 'test' ? 'active' : ''}" style="font-size: 11px; padding: 6px 14px; font-weight: 700; ${st.activeTab === 'test' ? 'background: #A78BFA; color: #140924;' : ''}" onclick="switchDonationModalTab('test')">
            🕹️ 3. Simulador y Pruebas en Vivo
          </button>
        </div>

        <div class="miniapp-modal-body" style="font-size: 12px; color: #E2E8F0; line-height: 1.6; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px;">
          
          <!-- ============================================================== -->
          <!-- PESTAÑA 1: MÉTODO STREAMLABS SOCKET (CERO TÚNELES)             -->
          <!-- ============================================================== -->
          <div style="display: ${st.activeTab === 'streamlabs' ? 'flex' : 'none'}; flex-direction: column; gap: 12px;">
            
            <div style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; padding: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="font-size: 13px; font-weight: 700; color: #10B981; display: flex; align-items: center; gap: 6px;">
                  <span>⚡</span>
                  <span>¿Por qué es el método más recomendado?</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; font-size: 11px;">
                  <span>Estado:</span>
                  <span id="streamlabs-status-badge" style="font-weight: 700; padding: 2px 8px; border-radius: 9999px; font-size: 10px; ${st.streamlabsConnected ? 'background: rgba(16,185,129,0.2); color: #10B981; border: 1px solid #10B981;' : 'background: rgba(239,68,68,0.2); color: #EF4444; border: 1px solid #EF4444;'}">
                    ${st.streamlabsConnected ? '● CONECTADO EN VIVO' : '○ NO CONECTADO'}
                  </span>
                </div>
              </div>
              <p style="margin: 0; font-size: 11px; color: var(--color-text-dim);">
                Si ya tienes tu cuenta de PayPal o Ko-fi vinculada a Streamlabs, tu overlay local puede conectarse como cliente seguro en segundo plano. 
                <strong>No necesitas instalar túneles, ni abrir puertos en el router, ni configurar dominios.</strong>
              </p>
            </div>

            <!-- Paso a Paso Streamlabs -->
            <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 14px;">
              <div style="font-weight: 700; color: #fff; font-size: 12px; margin-bottom: 10px;">
                📋 Pasos para conectar en 30 segundos:
              </div>
              <ol style="margin: 0 0 12px 18px; padding: 0; font-size: 11px; color: var(--color-text-dim); display: flex; flex-direction: column; gap: 6px;">
                <li>Entra en tu panel de Streamlabs en la sección: <a href="https://streamlabs.com/dashboard#/settings/api-settings" target="_blank" style="color: #38BDF8; text-decoration: underline;">Streamlabs API Settings</a></li>
                <li>Haz clic en la pestaña <strong>API Tokens</strong> y copia tu <strong>Socket API Token</strong>.</li>
                <li>Pégalo en el campo de abajo y pulsa <strong>Conectar Streamlabs</strong>. ¡Listo! Cada propina se reflejará sola.</li>
              </ol>

              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="password" id="input-streamlabs-token" class="form-input" style="flex: 1; font-family: monospace; font-size: 11px; background: #0B0D0F; color: #57D6C4;" placeholder="Pega aquí tu Socket API Token (comienza por eyJ...)" value="${st.streamlabsToken || ''}">
                <button type="button" class="btn-stage-preset" onclick="togglePasswordVisibility('input-streamlabs-token')" style="font-size: 11px; padding: 6px 10px;">👁️</button>
                <button type="button" class="btn-action-primary" style="font-size: 11px; padding: 6px 14px; background: #10B981; color: #061A12; font-weight: 700;" onclick="saveStreamlabsToken()">
                  🟢 Conectar Streamlabs
                </button>
              </div>
            </div>

          </div>

          <!-- ============================================================== -->
          <!-- PESTAÑA 2: MÉTODO WEBHOOKS DIRECTOS CON TÚNEL                 -->
          <!-- ============================================================== -->
          <div style="display: ${st.activeTab === 'webhooks' ? 'flex' : 'none'}; flex-direction: column; gap: 12px;">
            
            <div style="background: rgba(56,189,248,0.08); border: 1px solid rgba(56,189,248,0.3); border-radius: 8px; padding: 14px;">
              <div style="font-size: 13px; font-weight: 700; color: #38BDF8; margin-bottom: 6px;">
                🌐 Tu Dominio Propio o Túnel Público (Ko-fi / PayPal / Buy Me a Coffee)
              </div>
              <p style="margin: 0 0 10px 0; font-size: 11px; color: var(--color-text-dim); line-height: 1.5;">
                Para que Ko-fi, PayPal o BMC puedan notificar donaciones a tu ordenador en tiempo real, introduce aquí tu <strong>Dominio Propio</strong> o tu <strong>URL de túnel</strong>. Las URLs para cada plataforma se generarán listas para copiar:
              </p>
              
              <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
                <input type="text" id="input-tunnel-url" class="form-input" style="flex: 1; font-family: monospace; font-size: 11px; background: #0B0D0F; color: #38BDF8;" placeholder="Ej: https://stream.tudominio.com o https://mi-tunnel.trycloudflare.com" value="${st.tunnelUrl || ''}" oninput="updateDonationTunnelUrlFromInput(this.value)">
                <button type="button" class="btn-action-primary" style="font-size: 11px; padding: 6px 14px;" onclick="saveTunnelUrl()">
                  💾 Guardar URL
                </button>
              </div>

              <!-- GUÍA CLARA: DOMINIO PROPIO VS TÚNEL -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px;">
                <div style="background: rgba(56,189,248,0.06); border: 1px solid rgba(56,189,248,0.25); border-radius: 6px; padding: 10px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <div style="font-size: 11px; font-weight: 700; color: #38BDF8;">🏷️ Si tienes un Dominio Propio:</div>
                    <button type="button" class="btn-stage-preset" style="font-size: 9px; padding: 2px 6px;" onclick="toggleCustomDomainHelp()">📘 Ver Pasos</button>
                  </div>
                  <div style="font-size: 10px; color: var(--color-text-dim); line-height: 1.4;">
                    Usa tu subdominio (ej: <code style="color: #57D6C4;">https://stream.tudominio.com</code>). Debe tener <strong>HTTPS</strong> activo para que PayPal y Ko-fi lo acepten.
                  </div>
                </div>
                <div style="background: rgba(167,139,250,0.06); border: 1px solid rgba(167,139,250,0.25); border-radius: 6px; padding: 10px;">
                  <div style="font-size: 11px; font-weight: 700; color: #A78BFA; margin-bottom: 4px;">⚡ Si NO tienes dominio (Túnel Gratis):</div>
                  <div style="font-size: 10px; color: var(--color-text-dim); line-height: 1.4;">
                    Abre un túnel temporal gratuito en 1 segundo ejecutando en tu terminal:<br>
                    <code style="color: #57D6C4;">npx localtunnel --port 8080</code><br>
                    o <code style="color: #38BDF8;">cloudflared tunnel --url ${st.localBaseUrl}</code>
                  </div>
                </div>
              </div>

              <!-- DESPLEGABLE GUÍA PASO A PASO DOMINIO PROPIO -->
              <div id="custom-domain-tutorial" style="display: none; background: #07090B; border: 1px solid #38BDF8; border-radius: 6px; padding: 14px; margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <strong style="color: #38BDF8; font-size: 13px;">⚡ Auto-Configuradores: Sin tocar tu Router</strong>
                  <button type="button" style="background: none; border: none; color: var(--color-text-dim); cursor: pointer; font-size: 14px;" onclick="toggleCustomDomainHelp()">✕</button>
                </div>
                
                <p style="font-size: 11px; color: var(--color-text-dim); margin: 0 0 10px 0; line-height: 1.4;">
                  Elige cómo quieres conectar tu dominio permanente. Ambos métodos incluyen scripts automáticos en la carpeta <code>scripts/</code> que hacen todo el trabajo por ti:
                </p>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  
                  <!-- OPCION 1: CLOUDFLARE -->
                  <div style="background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.3); border-radius: 6px; padding: 10px;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                      <span style="font-size: 13px;">🚀</span>
                      <strong style="color: #10B981; font-size: 11px;">OPCIÓN 1: Cloudflare Tunnel Automático</strong>
                    </div>
                    <div style="font-size: 10px; color: var(--color-text-dim); margin-bottom: 8px; line-height: 1.4;">
                      • Solo necesitas tener tu dominio en Cloudflare (gratis).<br>
                      • El script descarga el conector, crea el túnel, enruta el DNS de tu subdominio y lo deja funcionando.
                    </div>
                    <div style="font-size: 10px; color: #57D6C4; margin-bottom: 4px; font-weight: 700;">Ejecuta en tu terminal:</div>
                    <div style="display: flex; gap: 6px; align-items: center;">
                      <input type="text" id="cmd-auto-cloudflare" readonly class="form-input" style="flex: 1; font-family: monospace; font-size: 10px; background: #000; color: #57D6C4; padding: 4px 6px;" value="./scripts/setup_cloudflare.sh ${st.tunnelUrl ? st.tunnelUrl.replace(/^https?:\/\//, '') : 'stream.tudominio.com'}">
                      <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 4px 8px; white-space: nowrap;" onclick="copyText(document.getElementById('cmd-auto-cloudflare').value)">📋 Copiar</button>
                    </div>
                  </div>

                  <!-- OPCION 2: VPS SSH REVERSE -->
                  <div style="background: rgba(56,189,248,0.06); border: 1px solid rgba(56,189,248,0.3); border-radius: 6px; padding: 10px;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                      <span style="font-size: 13px;">🖥️</span>
                      <strong style="color: #38BDF8; font-size: 11px;">OPCIÓN 2: VPS + Nginx / Traefik Inverso</strong>
                    </div>
                    <div style="font-size: 10px; color: var(--color-text-dim); margin-bottom: 8px; line-height: 1.4;">
                      • Si tienes un servidor VPS (Hetzner, OVH, etc.).<br>
                      • El script genera el bloque Nginx para tu VPS y crea un servicio systemd en tu PC para auto-reconectar siempre.
                    </div>
                    <div style="font-size: 10px; color: #38BDF8; margin-bottom: 4px; font-weight: 700;">Ejecuta en tu terminal:</div>
                    <div style="display: flex; gap: 6px; align-items: center;">
                      <input type="text" id="cmd-auto-vps" readonly class="form-input" style="flex: 1; font-family: monospace; font-size: 10px; background: #000; color: #38BDF8; padding: 4px 6px;" value="./scripts/setup_vps_tunnel.sh root@tu-vps.com ${st.tunnelUrl ? st.tunnelUrl.replace(/^https?:\/\//, '') : 'stream.tudominio.com'}">
                      <button type="button" class="btn-stage-preset" style="font-size: 10px; padding: 4px 8px; white-space: nowrap;" onclick="copyText(document.getElementById('cmd-auto-vps').value)">📋 Copiar</button>
                    </div>
                  </div>

                </div>

                <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: var(--color-text-dim); border-top: 1px solid var(--color-border-dim); padding-top: 8px;">
                  <span>📖 Guía detallada con explicaciones paso a paso en <a href="../docs/DOMINIO_PROPIO_Y_WEBHOOKS.md" target="_blank" style="color: #38BDF8; text-decoration: underline; font-weight: 700;">docs/DOMINIO_PROPIO_Y_WEBHOOKS.md</a></span>
                  <button type="button" class="btn-stage-preset" style="font-size: 9px; padding: 2px 8px;" onclick="toggleCustomDomainHelp()">Ocultar Asistente</button>
                </div>
              </div>
            </div>

            <!-- TARJETAS CON URLs LISTAS PARA COPIAR -->
            <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
              
              <!-- KO-FI -->
              <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(41,171,226,0.3); border-radius: 6px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <strong style="color: #29ABE2; font-size: 12px;">☕ 1. Webhook para Ko-fi:</strong>
                  <span style="font-size: 10px; color: var(--color-text-dim);">Ko-fi > Settings > API > Advanced Webhooks</span>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <input type="text" readonly class="form-input" style="flex: 1; font-family: monospace; font-size: 11px; background: #07090B; color: #29ABE2;" value="${activeUrl}/api/webhooks/kofi" id="webhook-url-kofi">
                  <button type="button" class="btn-stage-preset" onclick="copyText(document.getElementById('webhook-url-kofi').value)" style="font-size: 11px; white-space: nowrap;">📋 Copiar</button>
                </div>
              </div>

              <!-- PAYPAL -->
              <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(0,121,193,0.3); border-radius: 6px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <strong style="color: #38BDF8; font-size: 12px;">🅿️ 2. Webhook / IPN para PayPal:</strong>
                  <span style="font-size: 10px; color: var(--color-text-dim);">PayPal > Notificación de Pago IPN o Developer Webhook</span>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <input type="text" readonly class="form-input" style="flex: 1; font-family: monospace; font-size: 11px; background: #07090B; color: #38BDF8;" value="${activeUrl}/api/webhooks/paypal" id="webhook-url-paypal">
                  <button type="button" class="btn-stage-preset" onclick="copyText(document.getElementById('webhook-url-paypal').value)" style="font-size: 11px; white-space: nowrap;">📋 Copiar</button>
                </div>
              </div>

              <!-- BUY ME A COFFEE -->
              <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,221,0,0.3); border-radius: 6px; padding: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <strong style="color: #FFDD00; font-size: 12px;">🟡☕ 3. Webhook para Buy Me a Coffee:</strong>
                  <span style="font-size: 10px; color: var(--color-text-dim);">BMC > Settings > Integrations & Webhooks > Supporter</span>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <input type="text" readonly class="form-input" style="flex: 1; font-family: monospace; font-size: 11px; background: #07090B; color: #FFDD00;" value="${activeUrl}/api/webhooks/buymeacoffee" id="webhook-url-bmc">
                  <button type="button" class="btn-stage-preset" onclick="copyText(document.getElementById('webhook-url-bmc').value)" style="font-size: 11px; white-space: nowrap;">📋 Copiar</button>
                </div>
              </div>

            </div>

            <!-- Comandos de Túnel de 1 línea -->
            <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--color-border-dim); border-radius: 6px; padding: 10px;">
              <div style="font-size: 11px; font-weight: 700; color: #fff; margin-bottom: 6px;">
                💡 ¿Cómo abrir un túnel gratuito en tu terminal en 1 segundo?
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div style="background: #0B0D0F; padding: 8px; border-radius: 4px; border: 1px solid var(--color-border-dim);">
                  <div style="font-size: 10px; color: #57D6C4; font-weight: 700;">Opción A (Usa Node.js ya instalado):</div>
                  <code style="font-size: 10px; color: #A78BFA; display: block; margin-top: 3px;">npx localtunnel --port 8080</code>
                </div>
                <div style="background: #0B0D0F; padding: 8px; border-radius: 4px; border: 1px solid var(--color-border-dim);">
                  <div style="font-size: 10px; color: #38BDF8; font-weight: 700;">Opción B (Cloudflare Oficial):</div>
                  <code style="font-size: 10px; color: #A78BFA; display: block; margin-top: 3px;">cloudflared tunnel --url ${st.localBaseUrl}</code>
                </div>
              </div>
            </div>

          </div>

          <!-- ============================================================== -->
          <!-- PESTAÑA 3: PRUEBAS EN VIVO Y SIMULACIÓN                        -->
          <!-- ============================================================== -->
          <div style="display: ${st.activeTab === 'test' ? 'flex' : 'none'}; flex-direction: column; gap: 12px;">
            
            <div style="background: rgba(167,139,250,0.08); border: 1px solid rgba(167,139,250,0.3); border-radius: 8px; padding: 14px;">
              <div style="font-size: 13px; font-weight: 700; color: #A78BFA; margin-bottom: 6px;">
                🕹️ Simular Donaciones en Vivo (Sin Internet)
              </div>
              <p style="margin: 0 0 10px 0; font-size: 11px; color: var(--color-text-dim);">
                Haz clic en cualquiera de estos botones para disparar una donación de prueba y verificar cómo se ve la animación en el Ticker y en OBS:
              </p>
              
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button type="button" class="btn-action-test" style="border-color: #29ABE2; color: #29ABE2; font-size: 11px; padding: 8px 14px;" onclick="simulateTipTest('kofi')">
                  ☕ Simular Ko-fi (5.00 €)
                </button>
                <button type="button" class="btn-action-test" style="border-color: #0079C1; color: #38BDF8; font-size: 11px; padding: 8px 14px;" onclick="simulateTipTest('paypal')">
                  🅿️ Simular PayPal (15.00 EUR)
                </button>
                <button type="button" class="btn-action-test" style="border-color: #FFDD00; color: #FFDD00; font-size: 11px; padding: 8px 14px;" onclick="simulateTipTest('buymeacoffee')">
                  🟡 Simular BuyMeACoffee (3 Cafés - 9 €)
                </button>
              </div>
            </div>

            <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--color-border-dim); border-radius: 8px; padding: 12px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--color-text-dim); text-transform: uppercase; margin-bottom: 6px;">
                🎮 Botón para Stream Deck / OpenDeck (Petición HTTP Local):
              </div>
              <pre style="margin: 0; background: #0B0D0F; color: #57D6C4; padding: 8px; border-radius: 4px; font-size: 10px; overflow-x: auto;">curl -X POST ${st.localBaseUrl}/api/tips/simulate \\
  -H "Content-Type: application/json" \\
  -d '{"platform":"paypal","user":"MakerAmigo","amount":"10.00","currency":"EUR"}'</pre>
            </div>

          </div>

        </div>
      </div>
    </div>
  `;
  if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
    window.i18n.applyTranslations(modalContainer);
  }
}
