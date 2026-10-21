// ====================================================================
// ROLES - ESTADO, CARGA Y CACHÉ LOCAL
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
    if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
      window.i18n.applyTranslations(drawer);
    }
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
    if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
      window.i18n.applyTranslations(panel);
    }
    document.getElementById('role-edit-name')?.focus();
  }
}

function getRoleLocalized(role) {
  if (!role) return role;
  const tr = (k, fb) => (window.i18n && window.i18n.tr(k)) || fb;
  const nameKey = `roles.${role.id}.name`;
  const descKey = `roles.${role.id}.desc`;
  const locName = tr(nameKey, role.name);
  const locDesc = tr(descKey, role.description);
  return {
    ...role,
    name: (locName && locName !== nameKey) ? locName : role.name,
    description: (locDesc && locDesc !== descKey) ? locDesc : role.description
  };
}
