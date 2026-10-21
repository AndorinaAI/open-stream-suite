
function updateDonationTunnelUrlFromInput(val) {
  if (window._donationsModalState) {
    window._donationsModalState.tunnelUrl = val;
    const base = val && val.trim().length > 4 ? val.trim().replace(/\/+$/, '') : window._donationsModalState.localBaseUrl;
    const elKofi = document.getElementById('webhook-url-kofi');
    const elPaypal = document.getElementById('webhook-url-paypal');
    const elBmc = document.getElementById('webhook-url-bmc');
    if (elKofi) elKofi.value = `${base}/api/webhooks/kofi`;
    if (elPaypal) elPaypal.value = `${base}/api/webhooks/paypal`;
    if (elBmc) elBmc.value = `${base}/api/webhooks/buymeacoffee`;

    const cleanDomain = (val || '').replace(/^https?:\/\//, '').replace(/\/+$/, '') || 'stream.tudominio.com';
    const elCmdCf = document.getElementById('cmd-auto-cloudflare');
    const elCmdVps = document.getElementById('cmd-auto-vps');
    if (elCmdCf) elCmdCf.value = `./scripts/setup_cloudflare.sh ${cleanDomain}`;
    if (elCmdVps) elCmdVps.value = `./scripts/setup_vps_tunnel.sh root@tu-vps.com ${cleanDomain}`;
  }
}

async function saveStreamlabsToken() {
  const input = document.getElementById('input-streamlabs-token');
  if (!input) return;
  const token = input.value.trim();
  try {
    const res = await fetch('/api/donations/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Local-Token': window.__LOCAL_AUTH_TOKEN__ || ''
      },
      body: JSON.stringify({ streamlabsToken: token })
    });
    if (res.ok) {
      if (window._donationsModalState) {
        window._donationsModalState.streamlabsToken = token;
        window._donationsModalState.streamlabsConnected = token.length > 0;
      }
      const badge = document.getElementById('streamlabs-status-badge');
      if (badge) {
        badge.textContent = token.length > 0 ? '● CONECTADO EN VIVO' : '○ NO CONECTADO';
        badge.style.color = token.length > 0 ? '#10B981' : '#EF4444';
        badge.style.borderColor = token.length > 0 ? '#10B981' : '#EF4444';
      }
      alert('✓ Token de Streamlabs guardado. El servidor está escuchando alertas de donaciones.');
    }
  } catch (e) {
    alert('Error guardando token: ' + e);
  }
}

async function saveTunnelUrl() {
  const input = document.getElementById('input-tunnel-url');
  if (!input) return;
  let url = input.value.trim();
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
    input.value = url;
  }
  url = url.replace(/\/+$/, '');
  try {
    const res = await fetch('/api/donations/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Local-Token': window.__LOCAL_AUTH_TOKEN__ || ''
      },
      body: JSON.stringify({ tunnelUrl: url })
    });
    if (res.ok) {
      if (window._donationsModalState) window._donationsModalState.tunnelUrl = url;
      alert('✓ Dominio / URL de túnel guardada correctamente.');
    }
  } catch (e) {
    alert('Error guardando URL: ' + e);
  }
}

function togglePasswordVisibility(id) {
  const el = document.getElementById(id);
  if (el) el.type = el.type === 'password' ? 'text' : 'password';
}

async function simulateTipTest(platform) {
  try {
    const payloads = {
      kofi: { platform: 'kofi', user: 'KofiMaker', amount: '5.00', currency: 'EUR', message: '¡Gran stream!' },
      paypal: { platform: 'paypal', user: 'PayPalFan', amount: '15.00', currency: 'EUR', message: 'Para estaño y placas.' },
      buymeacoffee: { platform: 'buymeacoffee', user: 'CafeSupporter', amount: '9.00', currency: 'EUR', message: '3 cafés para el stream.' }
    };
    const body = payloads[platform] || payloads.kofi;
    const resp = await fetch('/api/tips/simulate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Local-Token': window.__LOCAL_AUTH_TOKEN__ || ''
      },
      body: JSON.stringify(body)
    });
    if (resp.ok) {
      const simToast = `✓ Donación simulada de ${body.user} (${body.amount}€)`;
      if (window.OverlayTexts && typeof OverlayTexts.showToast === 'function') {
        OverlayTexts.showToast(simToast);
      } else if (window.showToast) {
        window.showToast(simToast);
      }
      else alert(`✓ Donación simulada de ${body.user} (${body.amount}€)`);
    }
  } catch (e) {
    console.error('Error simulando propina:', e);
  }
}

function toggleCustomDomainHelp() {
  const el = document.getElementById('custom-domain-tutorial');
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
}

window.openDonationsModal = openDonationsModal;
window.simulateTipTest = simulateTipTest;
window.switchDonationModalTab = switchDonationModalTab;
window.updateDonationTunnelUrlFromInput = updateDonationTunnelUrlFromInput;
window.saveStreamlabsToken = saveStreamlabsToken;
window.saveTunnelUrl = saveTunnelUrl;
window.toggleCustomDomainHelp = toggleCustomDomainHelp;
window.togglePasswordVisibility = togglePasswordVisibility;

