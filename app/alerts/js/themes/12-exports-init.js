
// Exportación global explícita a window para llamadas inline desde HTML
window.openSceneEditor = openSceneEditor;
window.closeSceneEditor = closeSceneEditor;
window.switchSceneModalSubTab = switchSceneModalSubTab;
window.openCurrentSceneFullscreen = openCurrentSceneFullscreen;
window.copyCurrentSceneUrl = copyCurrentSceneUrl;
window.openSceneEditorFromTheme = openSceneEditorFromTheme;
window.onOverlayThemeChange = onOverlayThemeChange;
window.openThemeEditorByThemeId = openThemeEditorByThemeId;
window.onSceneModalThemeChange = onSceneModalThemeChange;
window.goToThemeEditorFromModal = goToThemeEditorFromModal;
window.onPreviewSceneDropdownChange = onPreviewSceneDropdownChange;
window.updatePreviewScene = updatePreviewScene;
window.openFullscreenPreview = openFullscreenPreview;
window.openOverlayFullscreen = openOverlayFullscreen;
window.copyOverlaySceneUrl = copyOverlaySceneUrl;
window.restoreOverlayTheme = restoreOverlayTheme;
window.restoreAllOverlaysToDefaultThemes = restoreAllOverlaysToDefaultThemes;
window.restoreOverlayThemeFromModal = restoreOverlayThemeFromModal;
window.assignThemeToScene = assignThemeToScene;
window.applyThemeToAllScenes = applyThemeToAllScenes;
window.refreshThemePreview = refreshThemePreview;
window.showOverlayFoldersView = showOverlayFoldersView;
window.openOverlayFolder = openOverlayFolder;
window.filterFolderSubCategory = filterFolderSubCategory;
window.applyThemeToAllOverlaysFromFolderCard = applyThemeToAllOverlaysFromFolderCard;
window.applyThemeToAllFromInside = applyThemeToAllFromInside;
window.applyThemeToCurrentOpenFolder = applyThemeToCurrentOpenFolder;
window.restoreCurrentFolderTexts = restoreCurrentFolderTexts;
window.restoreCurrentSceneTexts = restoreCurrentSceneTexts;
window.restoreSceneTexts = restoreSceneTexts;
window.restoreAllOverlaysTexts = restoreAllOverlaysTexts;
window.openThemeEditor = openThemeEditor;
window.closeThemeEditor = closeThemeEditor;

// Inicialización al cargar la sección de temas
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadThemePacks();
  });
} else {
  loadThemePacks();
}
