// ====================================================================
// ROLES - SINCRONIZACIÓN AUTOMÁTICA CON TWITCH
// ====================================================================

async function importTwitchModsAndVips() {
  try {
    const { ok, status, data } = await API.getTwitchModsAndVips();

    if (data.status === 'need_auth' || status === 401 || status === 403) {
      if (confirm('Twitch requiere que autorices el permiso para leer las Funciones de tu canal (moderadores, VIPs y editores).\n\n¿Deseas abrir la autorización de Twitch ahora mismo? (Solo tardará un segundo)')) {
        window.location.href = data.auth_url || '/auth';
      }
      return;
    }

    if (!data.connected) {
      alert('Twitch no está conectado o el token ha expirado. Por favor reconecta Twitch desde la barra superior.');
      return;
    }

    const mods = data.moderators || [];
    const vips = data.vips || [];
    const editors = data.editors || [];

    // Rol Moderadores
    let modRole = cachedRoles.find(r => r.id === 'role_moderador' || r.id === 'role_moderadores' || (r.name.toLowerCase().includes('moderador') && !r.name.toLowerCase().includes('principal')));
    if (modRole) {
      modRole.members = Array.from(new Set([...(modRole.members || []), ...mods]));
    }

    // Rol VIPs
    let vipRole = cachedRoles.find(r => r.id === 'role_vip' || r.id === 'role_vips' || r.name.toLowerCase().includes('vip'));
    if (vipRole) {
      vipRole.members = Array.from(new Set([...(vipRole.members || []), ...vips]));
    }

    // Rol Editores
    let editRole = cachedRoles.find(r => r.id === 'role_editor' || r.id === 'role_editores' || r.name.toLowerCase().includes('editor'));
    if (editRole) {
      editRole.members = Array.from(new Set([...(editRole.members || []), ...editors]));
    }

    await API.saveRoles(cachedRoles);
    renderRoles();
    populatePermissionRolesSelect();

    const msg = `✓ ¡Sincronización con Twitch completada!\n\n` +
      `• 🛡️ Moderadores sincronizados: ${mods.length}\n` +
      `• 💎 VIPs sincronizados: ${vips.length}\n` +
      `• 🎬 Editores sincronizados: ${editors.length}\n\n` +
      `ℹ️ INFORMACIÓN SOBRE OTRAS FUNCIONES:\n` +
      `• 🎨 Artistas: La API pública de Twitch no ofrece endpoint para listar artistas, pero nuestro sistema los detecta y autoriza automáticamente al hablar por su insignia oficial en chat, o puedes asignarlos aquí con "+ Asignar" o "Pegar lista".\n` +
      `• ⚔️ Moderador principal y 💼 Director comercial: Funciones exclusivas del panel web de Twitch; se configuran y asignan en este panel.`;
    alert(msg);
  } catch (err) {
    alert('Error al importar desde Twitch: ' + err.message);
  }
}
