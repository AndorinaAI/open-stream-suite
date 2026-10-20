# Directorio de Packs de Temas (streamthemes)

Este directorio alberga los packs de temas y overlays modulares de Open Stream Suite.

## Estructura por Pack

Cada pack se organiza de manera autónoma e independiente:

```
streamthemes/
└── <NombreDelPack>/
    ├── pack.json         # Metadatos del pack (id, nombre, versión, autor, etc.)
    ├── styles/           # Conjuntos de estilos / temas CSS y JSON
    │   ├── maker/
    │   ├── cyberpunk/
    │   └── ...
    └── overlays/         # Vistas HTML, componentes visuales y escenas
        ├── game/
        ├── maker/
        ├── chill/
        └── ...
```

### Pack Oficial:
- **`Open_stream_Pack/`**: Pack principal de Open Stream Suite con 6 estilos visuales y overlays completos.
