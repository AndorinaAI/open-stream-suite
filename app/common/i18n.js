// ============================================================================
// Open Stream Suite — Sistema de Internacionalización (i18n) Modular
// Carga archivos de traducción por sección desde /languages/
// Incluye MutationObserver para traducir elementos inyectados dinámicamente por JS
// ============================================================================

const i18n = (() => {
  const LANGUAGES_DIR = '/languages/';
  const MODULES = ['alerts', 'widgets', 'overlays', 'common'];
  const AVAILABLE_LANGS = ['es', 'en'];

  let currentLang = 'es';
  let dictionaries = {};  // { es: {...}, en: {...} }
  let loadCallbacks = [];
  let loaded = false;
  let loadErrors = [];
  let observer = null;

  // Índice inverso para traducción por contenido: texto ES normalizado -> clave
  let esTextToKey = {};

  // Fusionar diccionarios modulares en uno plano con notación de punto
  function flatten(obj, prefix = '') {
    const out = {};
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(out, flatten(value, fullKey));
      } else {
        out[fullKey] = value;
      }
    }
    return out;
  }

  // Construir índice inverso de texto ES -> clave
  function buildEsIndex(dict) {
    const index = {};
    for (const [key, text] of Object.entries(dict)) {
      const norm = String(text).replace(/\s+/g, ' ').trim();
      if (norm && !index[norm]) {
        index[norm] = key;
      }
    }
    return index;
  }

  // Cargar todos los módulos de un idioma
  async function loadLanguage(lang) {
    const merged = {};
    for (const module of MODULES) {
      try {
        const res = await fetch(`${LANGUAGES_DIR}${lang}.${module}.json`);
        if (res.ok) {
          const data = await res.json();
          for (const [section, content] of Object.entries(data)) {
            if (section === 'lang_code' || section === 'lang_name' || section === 'lang_flag') continue;
            if (content && typeof content === 'object') {
              Object.assign(merged, flatten(content, section));
            }
          }
        } else {
          console.warn(`[i18n] No se pudo cargar ${lang}.${module}.json (${res.status})`);
        }
      } catch (e) {
        console.warn(`[i18n] Error cargando ${lang}.${module}.json:`, e);
      }
    }
    dictionaries[lang] = merged;
    if (lang === 'es') {
      esTextToKey = buildEsIndex(merged);
    }
    console.log(`[i18n] Diccionario ${lang}: ${Object.keys(merged).length} claves`);
  }

  // Cargar todos los idiomas disponibles
  async function loadAllLanguages() {
    loaded = false;
    loadErrors = [];
    for (const lang of AVAILABLE_LANGS) {
      await loadLanguage(lang);
    }
    loaded = true;
    loadCallbacks.forEach(cb => cb());
    loadCallbacks = [];
  }

  // Traducir una clave (notación de punto, ej. "nav.triggers")
  function tr(key, params = {}) {
    const dict = dictionaries[currentLang] || {};
    let text = dict[key] || key;

    if (params && typeof params === 'object') {
      for (const [p, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), v);
      }
    }
    return text;
  }

  // Cambiar idioma y aplicar traducciones
  async function setLanguage(lang) {
    if (!AVAILABLE_LANGS.includes(lang)) return;
    currentLang = lang;

    document.documentElement.lang = lang;

    try { localStorage.setItem('oss-lang', lang); } catch (e) {}

    applyTranslations(document);

    window.dispatchEvent(new CustomEvent('oss-lang-change', { detail: { lang } }));
  }

  // Verificar si un texto contiene variables dinámicas tipo {clave}
  function hasDynamicVars(text) {
    return /\{[a-zA-Z_]+\}/.test(text);
  }

  // Traducir un nodo por su contenido de texto (para elementos inyectados por JS)
  function translateTextNodeByContent(node) {
    if (node.nodeType !== Node.TEXT_NODE) return;
    const parent = node.parentElement;
    if (!parent) return;
    const tag = parent.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'CODE' || tag === 'PRE' || tag === 'INPUT' || tag === 'SELECT') return;
    if (parent.closest && parent.closest('script, style, textarea, code, pre')) return;
    if (parent.hasAttribute('data-i18n')) return;

    const text = node.textContent;
    if (!text || !text.trim()) return;
    if (hasDynamicVars(text)) return;

    const norm = text.replace(/\s+/g, ' ').trim();
    const key = esTextToKey[norm];
    if (!key) return;

    const translated = tr(key);
    if (translated && translated !== key) {
      node.textContent = translated;
    }
  }

  // Traducir todos los nodos de texto dentro de un elemento (por contenido)
  function translateContentByText(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let node;
    while (node = walker.nextNode()) {
      nodes.push(node);
    }
    for (const n of nodes) {
      translateTextNodeByContent(n);
    }
  }

  // Aplicar traducciones a un elemento del DOM (y sus hijos)
  function applyTranslations(root = document) {
    if (!root) return;

    // 1. Traducir nodos con atributo data-i18n (texto)
    const nodes = root.querySelectorAll('[data-i18n]');
    for (const node of nodes) {
      const key = node.getAttribute('data-i18n');
      if (!key) continue;
      const translated = tr(key);
      if (translated && translated !== key) {
        if (node.childNodes.length === 0 || Array.from(node.childNodes).every(n => n.nodeType === Node.TEXT_NODE)) {
          node.textContent = translated;
        } else {
          let textNode = null;
          for (const child of node.childNodes) {
            if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
              textNode = child;
              break;
            }
          }
          if (textNode) {
            textNode.textContent = translated;
          }
        }
      }
    }

    // 2. Traducir placeholders con data-i18n-placeholder
    const placeholders = root.querySelectorAll('[data-i18n-placeholder]');
    for (const node of placeholders) {
      const key = node.getAttribute('data-i18n-placeholder');
      const translated = tr(key);
      if (translated && translated !== key) {
        node.placeholder = translated;
      }
    }

    // 3. Traducir títulos con data-i18n-title
    const titles = root.querySelectorAll('[data-i18n-title]');
    for (const node of titles) {
      const key = node.getAttribute('data-i18n-title');
      const translated = tr(key);
      if (translated && translated !== key) {
        node.title = translated;
      }
    }

    // 4. Traducir valores de option con data-i18n
    const options = root.querySelectorAll('option[data-i18n]');
    for (const opt of options) {
      const key = opt.getAttribute('data-i18n');
      const translated = tr(key);
      if (translated && translated !== key) {
        opt.textContent = translated;
      }
    }

    // 5. Traducir por contenido de texto (para elementos inyectados por JS sin data-i18n)
    translateContentByText(root);
  }

  // Obtener idioma actual
  function getLanguage() {
    return currentLang;
  }

  // Depuración
  function debugDict(lang = null) {
    const l = lang || currentLang;
    console.log(`[i18n debug] Diccionario ${l}:`, dictionaries[l] || {});
    return dictionaries[l] || {};
  }

  // Inicializar MutationObserver para traducir elementos dinámicos
  function initMutationObserver() {
    if (observer) return;
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              applyTranslations(node);
            } else if (node.nodeType === Node.TEXT_NODE) {
              translateTextNodeByContent(node);
            }
          }
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  // Inicialización
  (function init() {
    try {
      const saved = localStorage.getItem('oss-lang');
      if (saved && AVAILABLE_LANGS.includes(saved)) {
        currentLang = saved;
      }
    } catch (e) {}

    window.i18n = {
      setLanguage,
      applyTranslations,
      tr,
      getLanguage,
      debugDict,
      onLoad: (cb) => {
        if (loaded) cb();
        else loadCallbacks.push(cb);
      },
      isLoaded: () => loaded,
    };

    loadAllLanguages().then(() => {
      applyTranslations(document);
      initMutationObserver();
      const selector = document.getElementById('oss-lang-selector');
      if (selector) selector.value = currentLang;
    });
  })();

  return window.i18n;
})();
