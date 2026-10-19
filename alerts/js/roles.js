// ====================================================================
// GESTOR DE FUNCIONES DEL CANAL Y ROLES PERSONALIZADOS (TWITCH)
// ====================================================================

let cachedRoles = [];

async function loadRoles() {
  try {
    const data = await API.getRoles();
    cachedRoles = data.roles || [];
    renderRoles();
    populatePermissionRolesSelect();
  } catch (e) {
    console.error('Error cargando roles:', e);
  }
}

function toggleRolesDrawer(forceOpen = null) {
  const drawer = document.getElementById('roles-manager-drawer');
  if (!drawer) return;
  const twDrawer = document.getElementById('twitch-reward-creator-drawer');
  
  const isOpen = drawer.style.display !== 'none';
  const shouldOpen = forceOpen !== null ? forceOpen : !isOpen;
  
  drawer.style.display = shouldOpen ? 'block' : 'none';
  if (shouldOpen) {
    if (twDrawer) twDrawer.style.display = 'none';
    drawer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    loadRoles();
    document.getElementById('role-edit-name')?.focus();
  }
}

function toggleRoleForm(forceOpen = null) {
  const panel = document.getElementById('role-form-panel');
  if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  const shouldOpen = forceOpen !== null ? forceOpen : !isOpen;
  panel.style.display = shouldOpen ? 'block' : 'none';
  if (shouldOpen) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    document.getElementById('role-edit-name')?.focus();
  }
}

function renderRoles() {
  const container = document.getElementById('roles-list-container');
  const badge = document.getElementById('roles-count-badge');
  if (!container) return;
  if (badge) badge.textContent = cachedRoles.length;

  if (!cachedRoles || cachedRoles.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; color: var(--color-text-dim); font-size: 13px; padding: 24px; text-align: center; border: 1px dashed var(--color-border-dim); border-radius: 8px;">
        No hay funciones configuradas todavía. Pulsa en "Importar de Twitch" o en "➕ Nueva Función".
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  cachedRoles.forEach((role) => {
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

    // Miembros asignados tags
    const membersHtml = members.length > 0 
      ? members.map(m => `
          <span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.5); border: 1px solid ${color}60; border-radius: 12px; padding: 2px 8px; font-family: var(--font-tech); font-size: 11px; color: #fff;">
            @${m}
            <button type="button" onclick="removeMemberFromRole('${role.id}', '${m}')" style="background: none; border: none; color: #EF4444; font-size: 10px; cursor: pointer; padding: 0 2px;" title="Quitar">✕</button>
          </span>
        `).join('')
      : `<span style="font-size: 11px; color: var(--color-text-dim); font-style: italic;">Sin usuarios asignados aún</span>`;

    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">${role.badge || '⭐'}</span>
          <div>
            <div style="font-family: var(--font-tech); font-weight: 800; font-size: 14px; color: #fff; letter-spacing: 0.5px;">
              ${role.name}
            </div>
            <div style="font-size: 10px; color: ${color}; font-weight: 600;">
              ${members.length} miembro${members.length === 1 ? '' : 's'} asignado${members.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 5px;">
          <button type="button" class="btn-stage-preset" style="padding: 2px 8px; font-size: 11px; color: var(--color-accent-cyan);" onclick="editRole('${role.id}')" title="Editar Función">✏️</button>
          <button type="button" class="btn-stage-preset" style="padding: 2px 8px; font-size: 11px; color: #EF4444;" onclick="deleteRole('${role.id}')" title="Eliminar Función">🗑️</button>
        </div>
      </div>

      <!-- Lista de Miembros -->
      <div style="background: rgba(0,0,0,0.25); border-radius: 6px; padding: 8px 10px; min-height: 48px; max-height: 90px; overflow-y: auto; display: flex; flex-wrap: wrap; gap: 5px; align-content: flex-start;">
        ${membersHtml}
      </div>

      <!-- Acciones de Asignación Rápida -->
      <div style="display: flex; gap: 6px; margin-top: auto; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.06);">
        <button type="button" class="btn-stage-preset" style="flex: 1; padding: 4px 8px; font-size: 11px;" onclick="quickAddMember('${role.id}')">
          ➕ Asignar @usuario
        </button>
        <button type="button" class="btn-stage-preset" style="padding: 4px 8px; font-size: 11px; color: #C4B5FD;" onclick="batchAddMembers('${role.id}')" title="Pegar varios nombres de usuarios separados por comas o espacios">
          📋 Pegar lista
        </button>
      </div>
    `;

    container.appendChild(item);
  });
}

async function quickAddMember(roleId) {
  const role = cachedRoles.find(r => r.id === roleId);
  if (!role) return;
  const username = prompt(`Asignar usuario a la función "${role.name}":\n\nIntroduce su nombre de Twitch (con o sin @):`);
  if (!username) return;
  const clean = username.trim().toLowerCase().replace(/^@/, '');
  if (!clean) return;

  if (!Array.isArray(role.members)) role.members = [];
  if (!role.members.map(m => m.toLowerCase()).includes(clean)) {
    role.members.push(clean);
  }

  await API.saveRoles(cachedRoles);
  renderRoles();
  populatePermissionRolesSelect();
}

async function batchAddMembers(roleId) {
  const role = cachedRoles.find(r => r.id === roleId);
  if (!role) return;
  const raw = prompt(`Pegar lista de usuarios para la función "${role.name}":\n\nPega una lista de nombres de Twitch separados por comas, espacios o saltos de línea:`);
  if (!raw) return;

  const names = raw.split(/[\s,]+/).map(n => n.trim().toLowerCase().replace(/^@/, '')).filter(Boolean);
  if (names.length === 0) return;

  if (!Array.isArray(role.members)) role.members = [];
  const currentSet = new Set(role.members.map(m => m.toLowerCase()));
  let added = 0;
  names.forEach(n => {
    if (!currentSet.has(n)) {
      role.members.push(n);
      currentSet.add(n);
      added++;
    }
  });

  await API.saveRoles(cachedRoles);
  renderRoles();
  populatePermissionRolesSelect();
  alert(`✓ Se añadieron ${added} usuarios a la función "${role.name}".`);
}

async function removeMemberFromRole(roleId, username) {
  const role = cachedRoles.find(r => r.id === roleId);
  if (!role || !Array.isArray(role.members)) return;
  role.members = role.members.filter(m => m.toLowerCase() !== username.toLowerCase());

  await API.saveRoles(cachedRoles);
  renderRoles();
  populatePermissionRolesSelect();
}

function populatePermissionRolesSelect() {
  const sel = document.getElementById('trig-permission');
  if (!sel) return;

  const standard = [
    { val: 'everyone', text: 'Todos los espectadores (Público)' },
    { val: 'broadcaster', text: 'Solo Streamer / Creador' },
    { val: 'mod', text: '🛡️ Moderadores y Streamer' },
    { val: 'vip', text: '💎 VIPs, Moderadores y Streamer' },
    { val: 'sub', text: '⭐ Suscriptores del canal' }
  ];

  const currentVal = sel.value;
  sel.innerHTML = '<optgroup label="Permisos Estándar de Twitch"></optgroup>';
  const stdGroup = sel.querySelector('optgroup');
  standard.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.val;
    opt.textContent = s.text;
    stdGroup.appendChild(opt);
  });

  if (cachedRoles.length > 0) {
    const customGroup = document.createElement('optgroup');
    customGroup.label = 'Funciones Personalizadas del Taller';
    cachedRoles.forEach(r => {
      const opt = document.createElement('option');
      opt.value = 'role:' + r.id;
      const memCount = Array.isArray(r.members) ? r.members.length : 0;
      opt.textContent = `${r.badge || '⭐'} ${r.name} (${memCount} miembros)`;
      customGroup.appendChild(opt);
    });
    sel.appendChild(customGroup);
  }

  if (currentVal) sel.value = currentVal;
}

function editRole(id) {
  const role = cachedRoles.find(r => r.id === id);
  if (!role) return;

  document.getElementById('role-edit-id').value = role.id;
  document.getElementById('role-edit-name').value = role.name || '';
  document.getElementById('role-edit-badge').value = role.badge || '⭐';
  document.getElementById('role-edit-color').value = role.color || '#8B5CF6';
  document.getElementById('role-edit-color-hex').value = (role.color || '#8B5CF6').toUpperCase();
  document.getElementById('role-edit-members').value = Array.isArray(role.members) ? role.members.join(', ') : '';
  
  const title = document.getElementById('role-form-title');
  if (title) title.textContent = `✏️ EDITANDO: ${role.name}`;
  const modeBadge = document.getElementById('role-mode-badge');
  if (modeBadge) {
    modeBadge.textContent = 'EDITANDO';
    modeBadge.style.color = '#F59E0B';
    modeBadge.style.borderColor = '#F59E0B';
    modeBadge.style.background = 'rgba(245, 158, 11, 0.15)';
  }
  const saveBtn = document.getElementById('btn-save-role');
  if (saveBtn) saveBtn.textContent = '💾 Actualizar Función';
  
  toggleRoleForm(true);
}

function resetRoleForm() {
  document.getElementById('role-edit-id').value = '';
  document.getElementById('role-edit-name').value = '';
  document.getElementById('role-edit-badge').value = '⭐';
  document.getElementById('role-edit-color').value = '#8B5CF6';
  document.getElementById('role-edit-color-hex').value = '#8B5CF6';
  document.getElementById('role-edit-members').value = '';

  const title = document.getElementById('role-form-title');
  if (title) title.textContent = '➕ CONFIGURAR FUNCIÓN / ROL';
  const modeBadge = document.getElementById('role-mode-badge');
  if (modeBadge) {
    modeBadge.textContent = 'NUEVA';
    modeBadge.style.color = '#C4B5FD';
    modeBadge.style.borderColor = '#8B5CF6';
    modeBadge.style.background = 'rgba(139, 92, 246, 0.15)';
  }
  const saveBtn = document.getElementById('btn-save-role');
  if (saveBtn) saveBtn.textContent = '💾 Guardar Función';
  toggleRoleForm(false);
}

async function saveRoleForm(e) {
  e.preventDefault();
  const id = document.getElementById('role-edit-id').value.trim() || ('role_' + Date.now());
  const name = document.getElementById('role-edit-name').value.trim();
  const badge = document.getElementById('role-edit-badge').value.trim() || '⭐';
  const color = document.getElementById('role-edit-color').value || '#8B5CF6';
  const rawMembers = document.getElementById('role-edit-members').value;
  const members = rawMembers.split(/[\s,]+/).map(m => m.trim().replace(/^@/, '')).filter(Boolean);

  if (!name) {
    alert('Por favor escribe un nombre para la función o rol.');
    return;
  }

  const existingIdx = cachedRoles.findIndex(r => r.id === id);
  const roleObj = { id, name, badge, color, members };

  if (existingIdx !== -1) {
    cachedRoles[existingIdx] = roleObj;
  } else {
    cachedRoles.push(roleObj);
  }

  try {
    await API.saveRoles(cachedRoles);
    renderRoles();
    populatePermissionRolesSelect();
    resetRoleForm();
    alert(`✓ Función "${name}" guardada con éxito (${members.length} miembros asignados).`);
  } catch (err) {
    alert('Error al guardar función: ' + err.message);
  }
}

async function deleteRole(id) {
  const role = cachedRoles.find(r => r.id === id);
  if (!role) return;
  if (!confirm(`¿Seguro que deseas eliminar la función "${role.name}"?`)) return;

  cachedRoles = cachedRoles.filter(r => r.id !== id);
  try {
    await API.saveRoles(cachedRoles);
    renderRoles();
    populatePermissionRolesSelect();
    resetRoleForm();
  } catch (err) {
    alert('Error al eliminar función: ' + err.message);
  }
}

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
