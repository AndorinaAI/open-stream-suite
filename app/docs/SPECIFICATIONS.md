# PROYECTO: OPEN STREAM SUITE — SISTEMA COMPLETO DE OVERLAYS PARA TWITCH Y OBS STUDIO

<p align="center">
  <b>Español</b> | <a href="SPECIFICATIONS.en.md">English</a>
</p>

> [!NOTE]
> **DOCUMENTO DE DISEÑO HISTÓRICO (FASE CERO)**  
> Este documento representa el *brief* y las especificaciones originales iniciales con las que nació el proyecto.  
> La arquitectura técnica del producto ha evolucionado hacia un backend modular en Python (`aiohttp`), comunicación WebSocket bidireccional, API REST (`/api/*`), integración con Decks y Twitch EventSub/IRC, y un motor universal de 20 formas físicas (`data-theme-shape`).  
> Para consultar la arquitectura, convenciones y contratos actuales en producción, consulta [CONVENTIONS.md](../CONVENTIONS.md) y [GUIA_DESARROLLO_Y_TEMAS.md](GUIA_DESARROLLO_Y_TEMAS.md).

## 1. OBJETIVO GENERAL

Quiero que diseñes e implementes un sistema visual completo, profesional y coherente para mi canal de Twitch. El proyecto debe incluir overlays para videojuegos, programación, creación de contenido, charlas y pantallas de transición.

No quiero una overlay gaming genérica ni una plantilla recargada comprada en un paquete de streamer. Quiero una identidad visual propia que represente un espacio en el que se mezclan los videojuegos, la tecnología, la experimentación y la fabricación creativa.

El concepto central del canal es:

**JUGAR. CREAR. TRASTEAR.**

El canal puede pasar de una partida de videojuegos a un proyecto electrónico, de una sesión de programación a una prueba de sublimación, o de una charla informal a un experimento improvisado. La identidad debe permitir que todas esas actividades convivan bajo una misma marca, sin que parezca que pertenecen a canales diferentes.

El sistema debe ser modular, editable, ligero y práctico. Debe poder utilizarse en OBS Studio y funcionar cargando archivos locales, preferiblemente sin dependencias de Internet.

No quiero solamente una propuesta visual, una maqueta o una explicación de cómo hacerlo. Quiero que implementes el proyecto y generes los archivos necesarios para poder probarlo.

Si hay decisiones que no están especificadas, elige una solución profesional y coherente con las indicaciones siguientes, sin detenerte a preguntarme por cada detalle. Utiliza textos provisionales cuando sea necesario y centraliza todos los valores personalizables en un archivo de configuración.

---

## 2. CONCEPTO Y PERSONALIDAD VISUAL

El concepto estético es el de un **estudio de stream contemporáneo**, a medio camino entre una interfaz técnica, un estudio de producción creativa y un panel de control de misión.

La identidad debe transmitir curiosidad, creatividad, experimentación, tecnología y profesionalidad, pero también cercanía y espontaneidad.

Debe resultar moderna y reconocible, sin parecer una interfaz militar, una cabina futurista o un overlay competitivo de esports.

Quiero un diseño con personalidad, pero visualmente contenido.

### Referencias conceptuales

Combina sutilmente elementos inspirados en:

- Tecnología, programación y herramientas digitales.
- Interfaces de terminales y herramientas de desarrollo.
- Etiquetas técnicas de equipos y maquinaria.
- Marcas de registro utilizadas en impresión y corte de vinilo.
- Líneas vectoriales y guías de posicionamiento de software de diseño.
- Pequeños detalles de estética retroinformática y pixel art.

Estos elementos deben ser recursos gráficos secundarios, no ilustraciones gigantes. No llenes la interfaz de microchips, engranajes, robots, mandos de videojuegos o circuitos decorativos.

La estética debe ser suficientemente neutra para funcionar durante un videojuego real, mostrando una placa Raspberry Pi, trabajando en un editor de código o utilizando una máquina de sublimación.

### Principios fundamentales

1. El contenido del directo es siempre el protagonista.
2. La overlay debe ocupar el mínimo espacio necesario.
3. Cada elemento gráfico debe tener una finalidad.
4. Todas las escenas deben compartir identidad visual.
5. La información importante debe ser legible a resolución 1920 × 1080.
6. Las cámaras, capturas y fuentes de vídeo deben gestionarse en OBS; la overlay proporciona los gráficos y la composición visual.
7. Los efectos y las animaciones deben ser sutiles y no distraer.
8. No inventes contenido dinámico que parezca real, como mensajes de chat, nombres de seguidores o estadísticas de Twitch.

---

## 3. PALETA CROMÁTICA

Utiliza estas variables CSS como paleta oficial del proyecto:

- Grafito oscuro: `#191D21`
- Crema claro: `#F2EEE5`
- Turquesa electrónico: `#57D6C4`
- Naranja de acento: `#FF783F`
- Gris de panel: `#2E363B`
- Gris secundario: `#8B969C`

### Función de cada color

**Grafito oscuro:** color de fondo de las pantallas que tengan un fondo propio y de los paneles que necesiten opacidad.

**Crema claro:** texto principal, títulos, elementos de lectura y detalles de alto contraste.

**Turquesa (acento principal):** color principal de interacción, líneas, marcos de cámara, pequeños indicadores y elementos de interfaz.

**Naranja (acento secundario):** color de acento secundario, para el modo PRINT, indicadores puntuales y detalles que deban destacar.

**Gris de panel:** superficies secundarias de las pantallas completas y pequeños bloques informativos.

**Gris secundario:** textos auxiliares, subtítulos y metadatos.

No utilices todos los colores con la misma intensidad al mismo tiempo. El turquesa debe ser el acento predominante en GAME y MAKER. El naranja puede ganar protagonismo en PRINT. Las escenas de charla pueden combinar ambos tonos.

No uses degradados intensos, efectos glow exagerados, sombras gigantes ni neones que conviertan el diseño en una estética cyberpunk genérica.

Los degradados, cuando existan, deben ser muy sutiles y utilizarse preferentemente en las pantallas de inicio, pausa y despedida.

---

## 4. TIPOGRAFÍA

Utiliza dos familias tipográficas con funciones distintas.

### Tipografía principal

Una sans serif moderna, limpia y legible. Puedes utilizar Montserrat, Inter o una alternativa similar.

Debe utilizarse para títulos de escenas, títulos principales, encabezados, mensajes de espera y textos destacados.

### Tipografía técnica

Una fuente monoespaciada, como JetBrains Mono, IBM Plex Mono o una alternativa similar.

Debe utilizarse para etiquetas, nombres de modos, detalles de proyecto, pequeños indicadores técnicos y elementos que recuerden a una interfaz de ordenador.

Evita emplear tipografías futuristas difíciles de leer.

No dependas de fuentes remotas. El proyecto debe poder funcionar sin conexión. Si decides incluir archivos tipográficos locales, comprueba sus licencias y documenta su instalación. Si no están disponibles, utiliza una pila de fuentes de sistema con alternativas razonables.

Todos los tamaños, grosores y espaciados tipográficos deben estar centralizados mediante variables CSS.

---

## 5. ARQUITECTURA TÉCNICA

Implementa el sistema con HTML, CSS, JavaScript y SVG.

La solución preferida es una colección de páginas HTML locales que puedan cargarse por separado como fuentes de navegador de OBS Studio.

### Requisitos técnicos

- Resolución de diseño: 1920 × 1080 píxeles.
- Relación de aspecto: 16:9.
- Fondo transparente en todas las overlays que deban colocarse sobre una cámara o una captura.
- Fondo opaco solamente en las pantallas completas de inicio, pausa y despedida.
- Compatible con OBS Studio en sistemas Linux.
- Sin necesidad de un servidor remoto.
- Sin llamadas a servicios externos.
- Sin frameworks innecesarios.
- Sin paquetes npm obligatorios ni proceso de compilación.
- Sin claves API, cuentas, tokens o credenciales.
- Sin dependencias de CDN.
- Sin rutas absolutas que dependan de mi ordenador.
- Recursos locales y rutas relativas.
- Código organizado, legible y comentado.
- Ningún elemento gráfico debe requerir una conexión a Internet para mostrarse.

Usa HTML y CSS para la composición, y SVG inline o archivos SVG locales para iconos, marcos y elementos vectoriales.

La aplicación no debe necesitar acceso a la API de OBS para funcionar.

No intentes controlar OBS desde JavaScript ni implementes un backend. La selección de escenas y la colocación de cámaras se harán desde OBS Studio.

### Transparencia

En las páginas transparentes, el fondo del documento debe ser verdaderamente transparente. No utilices un rectángulo negro de fondo que oculte el juego o las cámaras.

Las áreas reservadas para las fuentes de vídeo deben dejar ver el contenido situado debajo. Los marcos deben estar dibujados alrededor de esas áreas, no por encima de ellas.

### Reutilización

Crea componentes visuales compartidos y variables comunes para que todas las páginas reutilicen los mismos colores, tipografías, márgenes, formas de paneles, indicadores y animaciones.

No dupliques estilos innecesariamente en cada escena.

---

## 6. IDENTIDAD DE MARCA

Utiliza provisionalmente el texto:

**TU NOMBRE**

Y el lema:

**JUGAR. CREAR. TRASTEAR.**

No inventes un nombre de canal definitivo ni un logotipo con iniciales que pudieran no corresponder a mi nombre.

Diseña un símbolo geométrico provisional y sencillo que pueda recordar a una herramienta técnica, un cursor o un pequeño módulo electrónico. Debe ser reconocible a tamaños reducidos.

El símbolo y el nombre deben poder modificarse sin rehacer las páginas.

Crea una identidad visual que funcione en:

- Las overlays de juego.
- Las escenas de stream.
- Los títulos de proyecto.
- Las pantallas de espera.
- Los separadores.
- Las etiquetas de modo.
- Los iconos y pequeños indicadores.

No añadas de forma permanente barras de últimos seguidores, objetivos de suscripciones, estadísticas, contador de espectadores o redes sociales. Pueden incorporarse más adelante, pero deben estar desactivados u omitidos por defecto.

No inventes usuarios, nombres de cuentas ni URLs sociales. Deja las redes sociales configurables y ocultas cuando no tengan datos.

---

## 7. ESCENAS QUE DEBES IMPLEMENTAR

Crea una página HTML independiente para cada escena. Cada una debe poder abrirse y utilizarse por separado como fuente de navegador local de OBS.

### ESCENA 1: GAME

Nombre de archivo sugerido: `scenes/game/index.html`

Uso: videojuegos de cualquier tipo.

Debe ser la escena más discreta de todo el sistema. El videojuego ocupará la totalidad del lienzo subyacente.

#### Elementos visuales

1. Identificación pequeña y opcional del canal.
2. Etiqueta compacta `GAME MODE`.
3. Marco de webcam.
4. Pequeños acentos gráficos de color turquesa y naranja.
5. Posibilidad de mostrar iconos sociales discretos si están configurados.
6. Ninguna otra información innecesaria.

#### Composición

Diseña el marco de la webcam en la zona inferior izquierda, como posición inicial configurable:

- Lienzo: 1920 × 1080.
- Margen izquierdo aproximado: 48 píxeles.
- Margen inferior aproximado: 110 píxeles.
- Anchura de la ventana de webcam: 360 píxeles.
- Altura de la ventana de webcam: 203 píxeles.

El tamaño debe mantener una relación de aspecto de 16:9.

Dibuja un borde fino alrededor de la cámara con esquinas discretamente técnicas. El interior debe ser completamente transparente.

Debajo de la ventana, añade una pequeña etiqueta `GAME MODE`, acompañada de un icono geométrico sencillo.

La identificación del canal, cuando esté activada, debe ser pequeña y colocarse cerca de la esquina superior izquierda. Debe existir una opción para ocultarla, porque algunos juegos muestran elementos importantes en esa zona.

Los elementos de esta escena tienen que poder recolocarse y cambiar de tamaño mediante las variables de configuración.

No añadas paneles laterales, chat, información de rendimiento o decoración que cubra el juego.

No dibujes el contenido de la webcam: esta fuente de vídeo se añadirá aparte en OBS.

### ESCENA 2: MAKER — MESA

Nombre de archivo sugerido: `scenes/maker-desk/index.html`

Uso: mostrar cámara principal, hands-on, montaje de proyectos o cualquier tarea que requiera una vista cenital o frontal prominente.

Esta escena debe dar protagonismo a la mesa real.

#### Estructura

Utiliza un encabezado superior compacto, una región principal grande y una pequeña banda informativa inferior.

El encabezado debe incluir:

- Símbolo de marca.
- Texto `MAKER MODE`.
- Subtítulo `RASPBERRY PI / ELECTRÓNICA / PROGRAMACIÓN`.
- Indicador `EN DIRECTO` opcional.
- Pequeño detalle gráfico que identifique el modo.

La zona principal debe distribuirse así:

**Vista principal de mesa**

- Posición inicial: x = 32, y = 112.
- Anchura: 1376 píxeles.
- Altura: 774 píxeles.

Esta zona está destinada a la cámara que apunta a la mesa. Debe quedar libre por dentro, salvo el contenido real de la cámara.

Añade un borde turquesa fino y una pequeña señal gráfica en las esquinas, como si fueran marcas de registro técnico.

**Vista de rostro**

- Posición inicial: x = 1432, y = 112.
- Anchura: 456 píxeles.
- Altura: 257 píxeles.

Este espacio está reservado para la cámara que me enfoca a mí.

**Vista auxiliar de ordenador**

- Posición inicial: x = 1432, y = 389.
- Anchura: 456 píxeles.
- Altura: 257 píxeles.

Este espacio permite mostrar una captura del ordenador cuando sea útil, por ejemplo para explicar un programa mientras trabajo sobre un circuito.

**Panel informativo lateral**

Utiliza la zona inferior de la columna derecha para los detalles del proyecto:

- Nombre del proyecto.
- Fase actual.
- Estado opcional del trabajo.
- Uno o dos detalles técnicos breves.

Ejemplo:

`PROYECTO: NAS CON RASPBERRY PI`

`FASE: MONTAJE`

Estos textos deben ser configurables. Son ejemplos, no información fija del canal.

**Banda de proyecto inferior**

Añade una franja horizontal fina que muestre el nombre del proyecto a la izquierda y, si está habilitado, una secuencia de fases:

`01 PLANIFICACIÓN · 02 MONTAJE · 03 SOFTWARE · 04 PRUEBAS`

No representes el avance como un porcentaje real a menos que se configure expresamente.

El diseño debe estar preparado para que la cámara de mesa, la cámara de rostro y la captura del ordenador sean fuentes independientes de OBS.

### ESCENA 3: MAKER — PC

Nombre de archivo sugerido: `scenes/maker-pc/index.html`

Uso: programación, terminal, instalación de software, configuración de Raspberry Pi, proyectos de IA, desarrollo de aplicaciones o explicación de herramientas.

El contenido principal es la pantalla del ordenador.

Reutiliza la identidad visual de `MAKER MODE`, pero adapta la composición al nuevo contenido.

#### Composición

**Vista principal de ordenador**

- Posición inicial: x = 32, y = 112.
- Anchura: 1376 píxeles.
- Altura: 774 píxeles.

Aquí aparecerá la captura del ordenador, que se añadirá en OBS.

**Vista de rostro**

- Posición inicial: x = 1432, y = 112.
- Anchura: 456 píxeles.
- Altura: 257 píxeles.

**Vista auxiliar de mesa**

- Posición inicial: x = 1432, y = 389.
- Anchura: 456 píxeles.
- Altura: 257 píxeles.

**Panel de proyecto**

En la zona inferior de la columna derecha debe aparecer el título del proyecto y una descripción muy breve.

La banda inferior reutiliza el mismo sistema de fases que MAKER — MESA.

El diseño no debe interferir con la lectura del código, la terminal ni los controles del software.

Cuando no se use la cámara de mesa, debe existir una opción para ocultar el marco correspondiente.

### ESCENA 4: PRINT — MÁQUINAS

Nombre de archivo sugerido: `scenes/print-machine/index.html`

Uso: cámara directa sobre cualquier proceso o acción en curso (maquinaria, proceso manual, proceso técnico, etc.).

Esta escena debe mantener el sistema de diseño general, pero utilizar el naranja como color de acento principal.

#### Composición

**Vista principal de máquina o área de trabajo**

- Posición inicial: x = 32, y = 112.
- Anchura: 1376 píxeles.
- Altura: 774 píxeles.

Debe permitir mostrar una cámara que apunte a la máquina o al proceso de trabajo.

**Vista de rostro**

- Posición inicial: x = 1432, y = 112.
- Anchura: 456 píxeles.
- Altura: 257 píxeles.

**Vista de detalle**

- Posición inicial: x = 1432, y = 389.
- Anchura: 456 píxeles.
- Altura: 257 píxeles.

Esta segunda cámara puede enseñar un acercamiento al material, al resultado o al proceso, cuando disponga de ella.

**Panel de proyecto**

Incluye campos configurables para el nombre del proyecto, el material o la fase.

Ejemplo:

`PROYECTO: PEGATINAS PERSONALIZADAS`

`FASE: CORTE DE VINILO`

Añade pequeños elementos gráficos inspirados en el trazado vectorial y las marcas de registro de impresión.

No añadas ilustraciones grandes de herramientas o máquinas específicas. Utiliza iconografía SVG simple y pequeña.

### ESCENA 5: PRINT — DISEÑO

Nombre de archivo sugerido: `scenes/print-design/index.html`

Uso: trabajar en Inkscape, editar diseños, preparar archivos de corte, crear gráficos para sublimación o ajustar parámetros de impresión.

La pantalla del ordenador debe ser el contenido principal, con una composición similar a MAKER — PC.

Utiliza:

- El mismo encabezado que PRINT — MÁQUINAS.
- Una región principal para la captura del ordenador.
- Una ventana de cámara con el rostro.
- Una ventana auxiliar para la máquina o el material, opcional.
- Una banda inferior de proyecto.

El color naranja debe seguir siendo un acento y no convertirse en un fondo que dificulte leer el software.

### ESCENA 6: CHILL — CHARLA

Nombre de archivo sugerido: `scenes/chill/index.html`

Uso: charlas, preguntas y respuestas, conversaciones con el chat, comentarios sobre tecnología o sesiones informales.

Esta escena puede ser más personal y visualmente cálida que las escenas técnicas, pero debe conservar la identidad del canal.

Utiliza `CHILL MODE` como etiqueta principal y el subtítulo:

`CHARLA / DUDAS / IDEAS / COMUNIDAD`

#### Composición

Reserva una zona principal de cámara con estas dimensiones orientativas:

- x = 32.
- y = 112.
- Anchura = 1280 píxeles.
- Altura = 720 píxeles.

La ventana debe tener un borde elegante y discreto.

A la derecha, reserva un panel vertical de aproximadamente 520 × 700 píxeles para el chat.

El chat real no debe generarse artificialmente mediante la overlay. Debe incorporarse como una fuente independiente de navegador en OBS o mediante la herramienta que corresponda.

La overlay debe dibujar el encabezado y los contornos, dejando el interior transparente para que se vea el contenido real.

Incluye una opción para desactivar el panel de chat. Cuando esté desactivado, el diseño debe reajustarse sin dejar un rectángulo vacío.

Los detalles de marca deben ser mínimos y no competir con el rostro.

### ESCENA 7: STARTING SOON

Nombre de archivo sugerido: `scenes/starting-soon/index.html`

Uso: pantalla de espera antes de empezar el directo.

Esta es una pantalla completa, por lo que puede utilizar un fondo opaco.

Diseña una composición de fondo grafito con una cuadrícula técnica extremadamente sutil, pequeños puntos de referencia, trazos vectoriales y detalles inspirados en una terminal.

No utilices fotografías de stock como elemento principal.

#### Contenido

- Símbolo del canal.
- Nombre provisional del canal.
- Lema `JUGAR. CREAR. TRASTEAR.`
- Texto principal `EMPEZAMOS ENSEGUIDA`.
- Texto secundario opcional `PREPARANDO EL DIRECTO...`
- Indicadores visuales de GAME, MAKER, CHILL y más.
- Espacio opcional para redes sociales configuradas.

Incluye una animación de progreso decorativa, suave y discreta. Si se implementa un contador real, debe ser opcional, configurable y representar el tiempo correctamente. No simules un contador con números aleatorios.

La animación no debe depender de Internet.

### ESCENA 8: BE RIGHT BACK

Nombre de archivo sugerido: `scenes/be-right-back/index.html`

Uso: descansos breves durante el directo.

Mantén la estética de STARTING SOON, pero con menor cantidad de información.

Texto principal:

`AHORA VUELVO`

Texto secundario:

`UN MOMENTO...`

Puedes añadir un pequeño bloque decorativo con frases relacionadas con el concepto del canal:

- `TOMANDO UN CAFÉ...`
- `PREPARANDO TODO...`
- `PROBANDO COSAS...`

Deben ser elementos puramente decorativos y no afirmaciones automáticas de lo que estoy haciendo.

Incluye movimiento ambiental muy suave, como una línea que recorre un indicador técnico. No uses transiciones rápidas, parpadeos intensos o animaciones estridentes.

### ESCENA 9: ENDING

Nombre de archivo sugerido: `scenes/ending/index.html`

Uso: despedida al acabar un directo.

Texto principal:

`GRACIAS POR PASARTE`

Texto secundario:

`NOS VEMOS EN EL PRÓXIMO DIRECTO`

La pantalla debe conservar la misma identidad gráfica de STARTING SOON, pero transmitir cierre, tranquilidad y cercanía.

Incluye el nombre del canal y las redes sociales únicamente cuando se configuren.

No inventes datos sociales ni información de próximos directos.

---

## 8. SISTEMA COMÚN DE MARCOS Y PANELES

Los marcos son uno de los elementos más importantes del sistema visual. Deben ser elegantes, limpios y reconocibles.

Utiliza:

- Bordes finos de uno o dos píxeles.
- Esquinas ligeramente redondeadas cuando resulte apropiado.
- Cortes geométricos discretos en una o dos esquinas.
- Pequeñas marcas técnicas en posiciones estratégicas.
- Un color de acento principal por escena.
- Fondo interior totalmente transparente en las regiones destinadas a las cámaras y capturas.

No dibujes todos los lados del marco con un grosor excesivo. Puedes utilizar una línea fina continua y pequeños segmentos de mayor énfasis en las esquinas.

Los paneles que contengan textos deben tener contraste suficiente.

Los paneles de texto pequeños pueden incorporar un fondo grafito semitransparente, pero evita superficies oscuras opacas encima del gameplay.

Define componentes reutilizables para:

- Marcos de cámara.
- Encabezados de modo.
- Etiquetas.
- Paneles informativos.
- Indicadores de directo.
- Separadores.
- Bandas inferiores.
- Pantallas completas.
- Pequeños iconos.

Las diferencias entre escenas deben proceder de la distribución, el contenido y el acento cromático, no de utilizar diseños incompatibles.

---

## 9. ANIMACIONES Y TRANSICIONES

Las animaciones deben ser muy contenidas.

Para las overlays de gameplay, mesa y PC:

- Entrada opcional mediante una aparición suave.
- Ninguna animación continua obligatoria.
- Sin destellos.
- Sin partículas.
- Sin grandes elementos que crucen la imagen.
- Sin elementos que se muevan por encima de la zona principal de vídeo.

Para las pantallas completas:

- Aparición suave del título.
- Movimiento lento de una línea técnica.
- Pequeños cambios de opacidad.
- Animaciones decorativas de baja intensidad.

Utiliza CSS para las animaciones sencillas.

Respeta `prefers-reduced-motion` y permite desactivar todas las animaciones desde la configuración.

No implementes transiciones de escena que dependan de controlar OBS mediante JavaScript. Los cambios entre escenas se gestionarán en OBS.

---

## 10. CONFIGURACIÓN CENTRALIZADA

Crea un archivo `config.js` en la raíz del proyecto para personalizar los elementos comunes.

Debe incluir como mínimo:

- Nombre del canal.
- Lema del canal.
- Paleta cromática.
- Visibilidad de la marca.
- Estado del indicador de directo.
- Visibilidad de los iconos sociales.
- URLs sociales.
- Título del proyecto.
- Fase del proyecto.
- Texto secundario del proyecto.
- Visibilidad de cada marco auxiliar.
- Activación o desactivación de animaciones.
- Tamaño y posición de los elementos principales.
- Configuración opcional del contador de inicio.
- Opciones específicas por escena.

Utiliza valores de ejemplo fácilmente reconocibles, como `TU NOMBRE` y `MI PROYECTO`, y explica cómo sustituirlos.

Los campos de configuración deben estar documentados. Cambiar el nombre del canal no debe requerir editar nueve archivos HTML.

No utilices `fetch()` para cargar el archivo de configuración si la solución se ejecutará directamente mediante archivos locales. Diseña una estructura compatible con la carga de `config.js` desde las páginas HTML.

Cuando una opción esté desactivada, su elemento debe desaparecer limpiamente y no dejar un hueco que arruine el diseño.

---

## 11. ESTRUCTURA DE CARPETAS

Organiza el proyecto de forma clara. Puedes utilizar esta estructura como referencia:

```text
open-stream-suite-overlay/
├── README.md
├── config.js
├── index.html
├── common/
│   ├── styles.css
│   ├── components.css
│   └── overlay.js
├── assets/
│   ├── icons/
│   ├── logos/
│   └── fonts/
├── scenes/
│   ├── game/
│   │   └── index.html
│   ├── maker-desk/
│   │   └── index.html
│   ├── maker-pc/
│   │   └── index.html
│   ├── print-machine/
│   │   └── index.html
│   ├── print-design/
│   │   └── index.html
│   ├── chill/
│   │   └── index.html
│   ├── starting-soon/
│   │   └── index.html
│   ├── be-right-back/
│   │   └── index.html
│   └── ending/
│       └── index.html
└── docs/
    └── OBS_SETUP.md
```

Puedes modificar la estructura si existe una razón técnica, pero mantenla sencilla y modular.

No dejes archivos vacíos, páginas sin terminar o recursos externos inexistentes.

---

## 12. PÁGINA DE PREVISUALIZACIÓN

Crea también un `index.html` en la raíz que sirva como catálogo local de previsualización del sistema.

Esta página no es una fuente de overlay definitiva. Es una herramienta para revisar visualmente las diferentes escenas antes de cargarlas en OBS.

Debe mostrar las nueve escenas en un catálogo organizado, con:

- Nombre de la escena.
- Vista previa de su composición.
- Etiqueta que indique si la escena es transparente o de pantalla completa.
- Enlace para abrir la página individual.
- Resolución objetivo.

En las escenas transparentes puedes utilizar fondos de muestra únicamente dentro del catálogo para que sea posible apreciar los marcos. Esos fondos de muestra no deben aparecer en las páginas definitivas de overlay.

La página de catálogo debe ser funcional sin Internet y adaptarse a una ventana normal de ordenador.

No conviertas el catálogo en una aplicación compleja ni añadas dependencias innecesarias.

---

## 13. PREPARACIÓN PARA OBS STUDIO

Genera un README muy claro, en español, explicando cómo utilizar el proyecto.

Debe explicar que las overlays son páginas HTML locales destinadas a cargarse como fuentes de navegador en OBS Studio.

Incluye instrucciones concretas para:

1. Abrir OBS Studio.
2. Crear una escena para cada modo.
3. Añadir las cámaras y capturas como fuentes independientes.
4. Añadir la página de overlay correspondiente como fuente de navegador local.
5. Establecer una resolución de 1920 × 1080.
6. Colocar las fuentes de vídeo en las posiciones documentadas.
7. Colocar la overlay por encima de las fuentes para que aparezcan los marcos y las etiquetas.
8. Comprobar que el fondo de las overlays transparentes deja ver el juego o la cámara.
9. Ajustar el tamaño y la posición de los marcos.
10. Configurar los atajos de teclado para cambiar de escena.
11. Grabar unos segundos de prueba y comprobar el resultado.

Para cada escena documenta la posición inicial y las dimensiones de cada región reservada para vídeo.

La cámara real no forma parte del archivo HTML. La overlay solamente dibuja el marco y los elementos decorativos que deben aparecer encima de la cámara.

Para las ventanas de vídeo, el orden habitual de composición será:

- Fuente de fondo o captura principal.
- Fuentes de cámara auxiliares.
- Elementos gráficos de overlay.

Es importante que las cámaras queden perfectamente alineadas con los marcos. El README debe explicar cómo ajustar sus dimensiones si utilizo cámaras distintas.

Añade también instrucciones para editar el nombre del canal, los textos y los colores mediante `config.js`.

No inventes opciones de OBS ni afirmes que las escenas se crean automáticamente si el proyecto solamente genera páginas HTML. Debes diferenciar claramente las funciones del paquete visual y la configuración que se realiza en OBS.

---

## 14. CALIDAD DEL CÓDIGO

Quiero un código sencillo de mantener.

Requisitos:

- HTML semántico cuando proceda.
- CSS organizado en bloques comprensibles.
- Variables CSS centralizadas.
- JavaScript mínimo.
- SVG limpios y escalables.
- Nombres de clases comprensibles.
- Ausencia de estilos duplicados innecesarios.
- Ausencia de dependencias externas.
- Ausencia de errores de consola.
- Ninguna solicitud de red necesaria para el funcionamiento.
- Ninguna credencial ni dato privado.
- Ninguna función que requiera permisos especiales.

No generes un único HTML gigantesco con cientos de líneas repetidas para cada escena. Mantén los componentes compartidos y la configuración de manera que el proyecto pueda ampliarse.

No sacrifiques la calidad visual por escribir menos código.

---

## 15. VALIDACIÓN VISUAL Y FUNCIONAL

Antes de dar por terminado el proyecto, comprueba todas las escenas.

Verifica que:

1. Las nueve páginas existen y pueden abrirse por separado.
2. El código no tiene errores de sintaxis.
3. Las páginas transparentes tienen realmente el fondo transparente.
4. Las pantallas de inicio, pausa y despedida sí tienen su propio fondo.
5. Ninguna fuente gráfica cubre las regiones reservadas para las cámaras.
6. Los marcos de cámara respetan la proporción 16:9.
7. Las posiciones y dimensiones corresponden al lienzo de 1920 × 1080.
8. Los textos no se salen de los paneles.
9. Los nombres y colores se pueden cambiar mediante la configuración centralizada.
10. Las opciones desactivadas desaparecen sin dejar espacios extraños.
11. Las páginas funcionan sin conexión a Internet.
12. La vista previa muestra todas las escenas.
13. El diseño sigue siendo legible al capturar la salida en 1080p.
14. Las animaciones no consumen recursos innecesarios ni distraen.
15. No se han dejado recursos gráficos rotos ni enlaces inexistentes.

Si dispones de un navegador de pruebas o una herramienta de captura, realiza capturas de las páginas y revisa la distribución antes de finalizar.

Corrige los problemas de alineación, contraste, desbordamiento y transparencia que detectes. No declares que las pruebas visuales se han realizado si no las has podido ejecutar realmente.

---

## 16. CRITERIOS ESTÉTICOS DE ACEPTACIÓN

El resultado final debe parecer diseñado por un diseñador de interfaces que conoce el entorno de streaming y la producción de contenido.

No debe parecer:

- Una plantilla gamer genérica.
- Un overlay competitivo de esports.
- Una interfaz cyberpunk saturada.
- Un panel repleto de información irrelevante.
- Una colección de nueve diseños incompatibles.
- Un diseño basado en enormes marcos de colores.
- Una página web normal colocada encima de un videojuego.

Sí debe parecer:

- Un sistema de identidad para un canal de Twitch con personalidad propia.
- Una interfaz técnica, elegante y funcional.
- Un diseño coherente entre videojuegos, programación, creación y charlas.
- Una overlay en la que el contenido visual del directo sigue siendo protagonista.
- Un paquete gráfico sencillo de mantener y ampliar.

La diferencia entre escenas debe notarse, pero todas tienen que ser reconocibles como parte del mismo canal.

El diseño debe seguir funcionando incluso cuando las cámaras muestren entornos reales llenos de herramientas, materiales, pantallas o cualquier fondo de trabajo del streamer.

No añadas decoraciones que compitan innecesariamente con ese contenido.

---

## 17. ORDEN DE EJECUCIÓN

Trabaja en este orden:

**Fase 1 — Estructura y configuración**

Crea las carpetas, `config.js`, los componentes comunes y una base visual compartida.

**Fase 2 — Primeras escenas funcionales**

Implementa GAME, MAKER — MESA y MAKER — PC. Estas son las escenas prioritarias porque permitirán comprobar que la identidad visual funciona tanto con videojuegos como con trabajo técnico.

**Fase 3 — Escenas de impresión y charla**

Implementa PRINT — MÁQUINAS, PRINT — DISEÑO y CHILL reutilizando componentes existentes.

**Fase 4 — Pantallas completas**

Implementa STARTING SOON, BE RIGHT BACK y ENDING.

**Fase 5 — Catálogo y documentación**

Crea la página de previsualización y la guía de configuración de OBS.

**Fase 6 — Revisión final**

Comprueba archivos, rutas locales, transparencia, distribución visual y funcionamiento de todas las páginas.

No te limites a explicar lo que habría que programar. Implementa los archivos del proyecto dentro del espacio de trabajo disponible, comprueba lo que puedas comprobar y documenta honestamente cualquier limitación.

Al terminar, proporciona un resumen breve de los archivos creados, las escenas incluidas, las pruebas realizadas y los pasos exactos que debo seguir para empezar a utilizar el paquete en OBS Studio.

El resultado esperado es un paquete de overlays funcional, coherente y personalizable que represente un canal dedicado a jugar, crear, experimentar y compartir proyectos de tecnología y fabricación creativa.

**Prioridad absoluta: buen diseño, transparencia real, legibilidad, sencillez de uso y coherencia entre todas las escenas.**

---

## 18. ARQUITECTURA MODULAR, RESPALDO DE FÁBRICA Y CONTROL HARDWARE

### A. Estructura Modular de Temas y Copias de Seguridad de Fábrica
Los estilos visuales se organizan en carpetas modulares (`themes/<pack>/<tema>/`). Cada tema cuenta obligatoriamente con 4 archivos:
1. `theme.json`: metadatos activos del tema (colores, fuentes, resplandor, anclaje de chat).
2. `style.css`: reglas CSS aplicadas dinámicamente sobre `body[data-theme="..."]`.
3. `theme.default.json`: **copia de seguridad original de fábrica** para recuperación.
4. `style.default.css`: **CSS original de fábrica** para recuperación.

El endpoint `POST /api/themes/restore` permite restablecer cualquier tema modificado a sus valores originales de fábrica de forma no destructiva con un solo clic en el botón `🔄 Restablecer Original`.

### B. Asignación de Estilos Visuales Independientes por Overlay
Cada overlay en OBS Studio tiene elementos y propósitos distintos:
- En `themes_state.json`, el objeto `overlayThemes` mapea qué tema viste a cada overlay (`game`, `maker-desk`, `maker-pc`, `print-machine`, `print-design`, `chill`, `startingSoon`, `beRightBack`, `ending`).
- Cada escena detecta su identidad automáticamente a través de `common/overlay.js` y aplica su `data-theme` específico.
- El panel de control ofrece selectores interactivos independientes en cada tarjeta de overlay y enlaces bidireccionales con las tarjetas de los temas.

### C. Integración Hardware (Elgato Stream Deck, Ajazz AKP y OpenDeck)
La suite expone la API REST `POST /api/widgets/action` e incluye configuraciones y perfiles nativos en `plugins/` para controlar temporizadores, chats, ruletas, triggers y metas desde cualquier hardware de macros sin necesidad de plugins privativos.
