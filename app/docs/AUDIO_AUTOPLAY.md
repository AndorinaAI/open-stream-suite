# Audio y política de autoplay (W26)

Los avisos de `AudioContext` en Chrome no son un fallo de la app: el navegador
exige una interacción del usuario para iniciar audio. El panel los muestra como
advertencia, no como excepción.

## Comportamiento esperado

- **Panel local:** el audio de previsualización puede requerir un clic; después
  de esa interacción se reproduce normalmente.
- **OBS Browser Source:** OBS permite autoplay; el overlay reproduce el audio
  del evento sin gesto adicional.
- **Widgets y alertas:** no se fuerza `AudioContext.resume()` ni se simulan
  clics; hacerlo sería un hack que el navegador puede bloquear.

## Verificación

- No debe haber excepciones JS por audio; solo el aviso de política del
  navegador cuando no hubo interacción.
- En OBS, comprobar que el Browser Source tiene audio habilitado y que el
  evento reproduce el sonido esperado.
- Los tests automáticos no afirman reproducción real de audio; validan que no
  se lanza una excepción.
