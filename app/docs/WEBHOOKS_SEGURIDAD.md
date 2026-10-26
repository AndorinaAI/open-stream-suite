# Webhooks de donaciones — configuración segura

Desde la auditoría del 2026-10-24, los webhooks externos ya no se aceptan sin
verificación. El comportamiento nativo es:

- **Ko-fi:** compara `verification_token` del body con
  `kofiVerificationToken` de `donations_config.json`.
- **Buy Me a Coffee:** compara `?secret=` de la URL con `bmcWebhookSecret`.
- **PayPal:** compara `?secret=` de la URL con `paypalWebhookSecret`.
- **`/api/webhooks/tip`:** es un simulador local; exige `X-Local-Token` (o
  `?token=`) y ya no es una ruta pública.
- Si un proveedor no tiene secreto configurado, solo se acepta una petición
  desde loopback (pruebas locales). Una petición remota se rechaza con 403.

## Configurar

En `donations_config.json` (o con `POST /api/donations/config` usando el token
local):

```json
{
  "tunnelUrl": "https://tu-tunel.example",
  "streamlabsToken": "",
  "kofiVerificationToken": "el_token_que_muestra_kofi",
  "bmcWebhookSecret": "una_clave_larga_aleatoria",
  "paypalWebhookSecret": "otra_clave_larga_aleatoria"
}
```

El `GET /api/donations/config` devuelve esos secretos enmascarados y añade
`kofiVerificationTokenSet`, `bmcWebhookSecretSet`, `paypalWebhookSecretSet` y
`streamlabsTokenSet`; la UI no necesita recibir el valor completo.

## URLs

- Ko-fi: `https://tu-tunel.example/api/webhooks/kofi`
- BMC: `https://tu-tunel.example/api/webhooks/buymeacoffee?secret=...`
- PayPal: `https://tu-tunel.example/api/webhooks/paypal?secret=...`

El túnel debe ser el mismo `tunnelUrl` configurado para que el CORS/WS lo
reconozca como origen exacto.
