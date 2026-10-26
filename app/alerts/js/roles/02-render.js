function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

// ====================================================================
// ROLES - RENDERIZADO VISUAL Y SELECTOR DE PERMISOS
// ====================================================================

function renderRoles() {
  const container = document.getElementById('roles-list-container');
  const badge = document.getElementById('roles-count-badge');
  if (!container) return;
  if (badge) badge.textContent = cachedRoles.length;
  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;

  if (!cachedRoles || cachedRoles.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; color: var(--color-text-dim); font-size: 13px; padding: 24px; text-align: center; border: 1px dashed var(--color-border-dim); border-radius: 8px;">
        ${tr('roles.no_roles_configured', 'No hay funciones configuradas todavía. Pulsa en "Importar de Twitch" o en "➕ Nueva Función".')}
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  cachedRoles.forEach((rawRole) => {
    const role = getRoleLocalized(rawRole);
    const item = document.createElement('div');
    const color = role.color || '#8B5CF6';
    const members = Array.isArray(role.members) ? role.members : [];

    item.style.cssText = `
      background: rgba(20, 24, 28, 0.85);
      border: 1px solid ${color}40;
      border-top: 3px solid ${color};
      border-radius: 8px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.4);
      transition: transform 0.15s, border-color 0.15s;
    `;
    item.onmouseenter = () => { item.style.transform = 'translateY(-2px)'; item.style.borderColor = color; };
    item.onmouseleave = () => { item.style.transform = 'translateY(0)'; item.style.borderColor = `${color}40`; };

    const membersHtml = members.length > 0 
      ? members.map(m => `
          <span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.5); border: 1px solid ${color}60; border-radius: 12px; padding: 2px 8px; font-family: var(--font-tech); font-size: 11px; color: #fff;">
            @${escapeHtml(m)}
            <button type="button" onclick="removeMemberFromRole('${escapeHtml(role.id)}', '${String(m).replace(/'/g, "\\'")}')" style="background: none; border: none; color: #EF4444; font-size: 10px; cursor: pointer; padding: 0 2px;" title="${tr('roles.btn_remove_user', 'Quitar')}">✕</button>
          </span>
        `).join('')
      : `<span style="font-size: 11px; color: var(--color-text-dim); font-style: italic;">${tr('roles.no_users_assigned', 'Sin usuarios asignados aún')}</span>`;

    const memText = members.length === 1 
      ? tr('roles.member_single', '1 miembro asignado')
      : tr('roles.members_count', `${members.length} miembros asignados`, { count: members.length });

    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">${escapeHtml(role.badge || "⭐")}</span>
          <div>
            <div style="font-family: var(--font-tech); font-weight: 800; font-size: 14px; color: #fff; letter-spacing: 0.5px;">
              ${escapeHtml(role.name)}
            </div>
            <div style="font-size: 10px; color: ${color}; font-weight: 600;">
              ${escapeHtml(memText)}
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 5px;">
          <button type="button" class="btn-stage-preset" style="padding: 2px 8px; font-size: 11px; color: var(--color-accent-cyan);" onclick="editRole('${role.id}')" title="${tr('roles.edit_role_title', 'Editar Función')}">✏️</button>
          <button type="button" class="btn-stage-preset" style="padding: 2px 8px; font-size: 11px; color: #EF4444;" onclick="deleteRole('${role.id}')" title="${tr('roles.delete_role_title', 'Eliminar Función')}">🗑️</button>
        </div>
      </div>

      <!-- Lista de Miembros -->
      <div style="background: rgba(0,0,0,0.25); border-radius: 6px; padding: 8px 10px; min-height: 48px; max-height: 90px; overflow-y: auto; display: flex; flex-wrap: wrap; gap: 5px; align-content: flex-start;">
        ${membersHtml}
      </div>

      <!-- Acciones de Asignación Rápida -->
      <div style="display: flex; gap: 6px; margin-top: auto; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.06);">
        <button type="button" class="btn-stage-preset" style="flex: 1; padding: 4px 8px; font-size: 11px;" onclick="quickAddMember('${role.id}')">
          ➕ ${tr('roles.quick_add_btn', 'Asignar @usuario')}
        </button>
        <button type="button" class="btn-stage-preset" style="padding: 4px 8px; font-size: 11px; color: #C4B5FD;" onclick="batchAddMembers('${role.id}')" title="${tr('roles.paste_list_tooltip', 'Pegar varios nombres de usuarios separados por comas o espacios')}">
          📋 ${tr('roles.paste_list_btn', 'Pegar lista')}
        </button>
      </div>
    `;

    container.appendChild(item);
  });

  if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
    window.i18n.applyTranslations(container);
  }
}

function populatePermissionRolesSelect() {
  const sel = document.getElementById('trig-permission');
  if (!sel) return;

  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  const standard = [
    { val: 'everyone', text: tr('roles.perm_everyone', 'Todos los espectadores (Público)') },
    { val: 'broadcaster', text: tr('roles.perm_broadcaster', 'Solo Streamer / Creador') },
    { val: 'mod', text: tr('roles.perm_mod', '🛡️ Moderadores y Streamer') },
    { val: 'vip', text: tr('roles.perm_vip', '💎 VIPs, Moderadores y Streamer') },
    { val: 'sub', text: tr('roles.perm_sub', '⭐ Suscriptores del canal') }
  ];

  const currentVal = sel.value;
  sel.innerHTML = `<optgroup label="${tr('roles.optgroup_standard', 'Permisos Estándar de Twitch')}"></optgroup>`;
  const stdGroup = sel.querySelector('optgroup');
  standard.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.val;
    opt.textContent = s.text;
    stdGroup.appendChild(opt);
  });

  if (cachedRoles.length > 0) {
    const customGroup = document.createElement('optgroup');
    customGroup.label = tr('roles.optgroup_custom', 'Funciones Personalizadas del Stream');
    cachedRoles.forEach(rawR => {
      const r = getRoleLocalized(rawR);
      const opt = document.createElement('option');
      opt.value = 'role:' + r.id;
      const memCount = Array.isArray(r.members) ? r.members.length : 0;
      opt.textContent = `${r.badge || '⭐'} ${r.name} (${memCount} ${tr('roles.members_word', 'miembros')})`;
      customGroup.appendChild(opt);
    });
    sel.appendChild(customGroup);
  }

  if (currentVal) sel.value = currentVal;
}
