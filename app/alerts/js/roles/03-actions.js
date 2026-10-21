// ====================================================================
// ROLES - ACCIONES, MIEMBROS Y FORMULARIO DE EDICIÓN
// ====================================================================

async function quickAddMember(roleId) {
  const role = cachedRoles.find(r => r.id === roleId);
  if (!role) return;
  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  const locRole = getRoleLocalized(role);
  const promptTitle = tr('roles.prompt_quick_add', 'Asignar usuario a la función');
  const promptDesc = tr('roles.prompt_enter_twitch_user', 'Introduce su nombre de Twitch (con o sin @):');
  const username = prompt(`${promptTitle} "${locRole.name}":\n\n${promptDesc}`);
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
  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  const locRole = getRoleLocalized(role);
  const promptTitle = tr('roles.prompt_batch_add', 'Pegar lista de usuarios para la función');
  const promptDesc = tr('roles.prompt_paste_list', 'Pega una lista de nombres de Twitch separados por comas, espacios o saltos de línea:');
  const raw = prompt(`${promptTitle} "${locRole.name}":\n\n${promptDesc}`);
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
  alert(`✓ Se añadieron ${added} usuarios a la función "${locRole.name}".`);
}

async function removeMemberFromRole(roleId, username) {
  const role = cachedRoles.find(r => r.id === roleId);
  if (!role || !Array.isArray(role.members)) return;
  role.members = role.members.filter(m => m.toLowerCase() !== username.toLowerCase());

  await API.saveRoles(cachedRoles);
  renderRoles();
  populatePermissionRolesSelect();
}

function editRole(id) {
  const role = cachedRoles.find(r => r.id === id);
  if (!role) return;

  const tr = (k, fb, params) => (window.i18n && window.i18n.tr(k, params)) || fb;
  const locRole = getRoleLocalized(role);

  document.getElementById('role-edit-id').value = role.id;
  document.getElementById('role-edit-name').value = locRole.name || '';
  document.getElementById('role-edit-badge').value = role.badge || '⭐';
  document.getElementById('role-edit-color').value = role.color || '#8B5CF6';
  document.getElementById('role-edit-color-hex').value = (role.color || '#8B5CF6').toUpperCase();
  document.getElementById('role-edit-members').value = Array.isArray(role.members) ? role.members.join(', ') : '';
  
  const title = document.getElementById('role-form-title');
  if (title) title.textContent = tr('roles.title_editing', `✏️ EDITANDO: ${locRole.name}`, { name: locRole.name });
  const modeBadge = document.getElementById('role-mode-badge');
  if (modeBadge) {
    modeBadge.textContent = tr('roles.badge_editing', 'EDITANDO');
    modeBadge.style.color = '#F59E0B';
    modeBadge.style.borderColor = '#F59E0B';
    modeBadge.style.background = 'rgba(245, 158, 11, 0.15)';
  }
  const saveBtn = document.getElementById('btn-save-role');
  if (saveBtn) saveBtn.textContent = tr('roles.btn_update_role', '💾 Actualizar Función');
  
  toggleRoleForm(true);
}

function resetRoleForm() {
  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  document.getElementById('role-edit-id').value = '';
  document.getElementById('role-edit-name').value = '';
  document.getElementById('role-edit-badge').value = '⭐';
  document.getElementById('role-edit-color').value = '#8B5CF6';
  document.getElementById('role-edit-color-hex').value = '#8B5CF6';
  document.getElementById('role-edit-members').value = '';

  const title = document.getElementById('role-form-title');
  if (title) title.textContent = tr('triggers.role_form_title', '➕ CONFIGURAR FUNCIÓN / ROL');
  const modeBadge = document.getElementById('role-mode-badge');
  if (modeBadge) {
    modeBadge.textContent = tr('triggers.mode_new', 'NUEVA');
    modeBadge.style.color = '#C4B5FD';
    modeBadge.style.borderColor = '#8B5CF6';
    modeBadge.style.background = 'rgba(139, 92, 246, 0.15)';
  }
  const saveBtn = document.getElementById('btn-save-role');
  if (saveBtn) saveBtn.textContent = tr('roles.btn_save_role', '💾 Guardar Función');
  toggleRoleForm(false);
}

async function saveRoleForm(e) {
  e.preventDefault();
  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  const id = document.getElementById('role-edit-id').value.trim() || ('role_' + Date.now());
  const name = document.getElementById('role-edit-name').value.trim();
  const badge = document.getElementById('role-edit-badge').value.trim() || '⭐';
  const color = document.getElementById('role-edit-color').value || '#8B5CF6';
  const rawMembers = document.getElementById('role-edit-members').value;
  const members = rawMembers.split(/[\s,]+/).map(m => m.trim().replace(/^@/, '')).filter(Boolean);

  if (!name) {
    alert(tr('roles.alert_enter_name', 'Por favor escribe un nombre para la función o rol.'));
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
  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  const locRole = getRoleLocalized(role);
  if (!confirm(`${tr('roles.confirm_delete_role', '¿Seguro que deseas eliminar la función')} "${locRole.name}"?`)) return;

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
