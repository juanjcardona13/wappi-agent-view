# Wappi View

App estática, en español, para entender cómo funciona Wappi de punta a punta: WhatsApp y el dispositivo vinculado, Baileys, el puente Node, SQLite, el webhook con bearer, la rutina de Grok Bot, la box, los tres conectores MCP y el camino de vuelta.

El corte de los hechos es la release `7e8b50a`, leída el 10 nov 2026. La app no se conecta a WhatsApp, al puente ni a Grok Bot. El simulador corre en el navegador.

## Cómo correrla

Hace falta Node 22.13 o más nuevo.

```bash
npm install
npm run dev
```

Abre la URL que imprime Vite (por defecto `http://localhost:5173`).

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run preview
```

`npm run build` genera `dist/`. No hay variables de entorno, base de datos ni autenticación: es una app estática lista para publicar.

## Estructura

- `docs/SPEC.md`, `docs/ARCHITECTURE-FACTS.md`, `docs/sample-payloads.json`: las fuentes, copiadas tal cual.
- `src/content/facts.ts` y `src/content/unknowns.ts`: generados desde la hoja de hechos.
- `src/content/`: lecciones, nodos, módulos, conectores, piezas, seguridad, glosario, operación y el catálogo de pasos del simulador (`steps.ts`).
- `src/pages/`: una ruta por sección.
- `src/test/`: el motor del viaje, los ids de hechos y el test de sanitización.

Rutas: `/`, `/mapa`, `/conceptos`, `/codigo`, `/simulador`, `/conectores`, `/intercambiable`, `/seguridad`, `/operacion`, `/glosario`, `/verificado`.

## Cómo actualizar el contenido cuando Wappi cambie

1. Sustituye `docs/ARCHITECTURE-FACTS.md` por la hoja nueva, sin secretos.
2. Si cambian las formas, sustituye `docs/sample-payloads.json`. Sigue usando solo placeholders (`<OWNER_PHONE>`, `req_<32_HEX>`, `<SHA256_HEX>`, …).
3. Regenera los hechos: `npm run facts`.
4. Ajusta `src/content/meta.ts` (`verifiedRelease`, `verifiedAt`, el texto del pie).
5. Revisa lecciones, nodos, pasos del simulador y glosario si un módulo, un estado o un contrato cambió. El texto de la UI vive en `src/content/`, no dentro de los componentes.
6. `npm test`. El test de hechos falla si un `F-xxx` citado no existe. El test de sanitización falla si entra un JID, un teléfono, un bearer real o un id con pinta de producción.

## Etiquetas

- **Verificado:** está en la hoja, leído en el código o en los docs de esa release.
- **Conocimiento general:** industria (Signal, multi-dispositivo, tradeoffs de proveedores). No se comprobó en este código.
- **No verificado:** es un `U-xx`, o un dato que la especificación pide y la hoja no numera.

Los ocho supuestos corregidos de la sección 15 de la hoja están en la UI, en la lección o la página que les corresponde y otra vez juntos en `/verificado`.

## Despliegue

### Cursor, apps en vivo

Cursor puede construir una app y compartirla con un enlace. El agente prepara el repo; la publicación la haces tú desde la bandeja de la app de Cursor (eliges el dominio y pasan los chequeos). No hace falta base de datos ni login: esta app es estática. Desde este agente no hay herramienta para pulsar «publicar» ni para devolver el enlace. Por eso no hay URL en vivo en el PR.

Cuando la bandeja aparezca: publica sin base de datos y sin autenticación. Si prefieres hacerlo a mano desde el chat de Cursor, el prompt que documenta el producto es «Deploy this repo as an app», y luego publicas tú desde la bandeja.

### Vercel, sin configuración extra

El build es estático (Vite). Vercel detecta Vite, corre `npm run build` y publica `dist`. No hay variables de entorno.

`vercel.json` solo reescribe las rutas del navegador a `index.html`. Sin eso, abrir `/simulador` directo devolvería 404. Los archivos de `dist` se sirven antes que la reescritura.

1. En Vercel: Add New Project, importa `juanjcardona13/wappi-agent-view`, Deploy.
2. O, desde un clon local, con la CLI ya autenticada: `npx vercel` y luego `npx vercel --prod`.

## Nunca en el repo

No commits de secretos, teléfonos, JID, ids de grupo, handles reales, URLs de webhook ni llaves. En los ejemplos solo van los placeholders de la hoja. El test `src/test/sanitize.test.ts` recorre `src/` y `docs/`.

## Spec frente a los hechos

Los hechos ganan cuando chocan con otra redacción.

- El encargo habla de un «webhook firmado». No lo está. F-065 y la corrección 1: es un bearer sobre HTTPS. HMAC se usa para ids internos, no para firmar ese POST.
- `9e55aca`, `b111a76` y PR11 salen de la especificación como resumen público del DEPLOY-LOG y no tienen un `F-xxx`. En Operación van como **No verificado**. `f18bba8` (F-055) y `7e8b50a` (F-004) sí están en la hoja.
- La especificación nombra el rechazo de HTML como `media_unsafe`. La hoja describe el rechazo y no usa ese identificador. La UI lo dice así.
- El texto literal de `!ayuda` no está en la hoja. El simulador no lo inventa: muestra que el puente responde un texto fijo.
- No hay latencias. U-04. La velocidad del simulador es solo la de la animación.
- No se nombra el modelo que Grok Bot usa por dentro (F-003). Gemini, OpenAI o Claude aparecen solo como ejemplos de reemplazo, marcados como conocimiento general (U-09).
- El soporte de grupos de la Cloud API oficial no se afirma.

## Qué no hace

No llama a WhatsApp, al puente, a Grok Bot ni a ninguna API en tiempo de ejecución. No copia el código de `juanjcardona13/wappi-agent`.
