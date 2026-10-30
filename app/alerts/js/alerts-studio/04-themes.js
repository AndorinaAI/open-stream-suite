/**
 * alerts-studio/04-themes.js — RETIRADO
 *
 * Aquí vivía el sistema legacy de 9 "temas de alerta" (cyberpunk, neon,
 * minimal…): catálogo propio, galería, guardar/borrar temas y aplicar a todas
 * las alertas. Se eliminó porque el aspecto de una alerta lo define el
 * **tema del pack** (`theme.json`), no un catálogo paralelo.
 *
 * `onAnimationChange` era la única función con vida y se movió a
 * `03-controls.js`.
 *
 * El fichero se conserva vacío durante una versión: si un panel cacheado pide
 * `js/alerts-studio/04-themes.js`, recibe un 200 vacío en lugar de un 404.
 * Se puede borrar en la siguiente limpieza.
 */
