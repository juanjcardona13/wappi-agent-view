import type { Certainty } from './types';

export type AnimationId =
  | 'devices'
  | 'baileys'
  | 'channels'
  | 'session'
  | 'dedup'
  | 'queue'
  | 'states'
  | 'allow'
  | 'media'
  | 'routine'
  | 'brainbody'
  | 'mcp'
  | 'receipts'
  | 'tts'
  | 'proactive';

export interface Lesson {
  slug: string;
  title: string;
  summary: string;
  animation: AnimationId;
  wappi: string[];
  fail: string[];
  deepen: string[];
  codePath: string;
  codeNote: string;
  factIds: string[];
  certainty: Certainty;
  correction?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  unknowns?: string[];
}

export const lessons: Lesson[] = [
  {
    slug: 'multi-dispositivo',
    title: 'WhatsApp, WhatsApp Web y multi-dispositivo',
    summary:
      'Una cuenta tiene un teléfono principal y dispositivos vinculados. Cada uno descifra con sus propias claves.',
    animation: 'devices',
    wappi: [
      'El puente es un dispositivo vinculado más, no la Cloud API. Se declara como navegador Ubuntu / Wappi.',
      'No marca «en línea» al conectar y no sincroniza el historial completo.',
      'La cuenta ya existe, con SIM propia. link muestra el QR; serve nunca lo muestra.',
    ],
    fail: [
      'Si la box hiberna, ese dispositivo desaparece hasta que el socket vuelve.',
      'logged_out o replaced paran y esperan a una persona. No se re-vinculan solos.',
    ],
    deepen: [
      'El cifrado de extremo a extremo con el protocolo Signal, y el reparto del servidor a cada dispositivo, es conocimiento general. Encaja con los tipos Signal que referencia el código, pero el protocolo interno de los servidores no se leyó (U-05).',
      'Baileys mantiene el WebSocket persistente. Eso es distinto del webhook de una sola vez hacia Grok Bot.',
    ],
    codePath: 'src/transport/baileys-transport.ts',
    codeNote: 'makeWASocket, browser Ubuntu/Wappi, markOnlineOnConnect en false, syncFullHistory en false.',
    factIds: ['F-012', 'F-030', 'F-031', 'F-032'],
    certainty: 'verificado',
  },
  {
    slug: 'baileys',
    title: 'Baileys',
    summary: 'Librería TypeScript no oficial que habla el protocolo de WhatsApp Web. En Wappi es un release candidate.',
    animation: 'baileys',
    wappi: [
      'Dependencia directa @whiskeysockets/baileys 7.0.0-rc14. No hace falta un navegador.',
      'Eventos que importan: connection.update, creds.update, messages.upsert, messages.update, groups.update.',
      'Solo los upsert de tipo notify se procesan. El historial o append solo sube la métrica appendIgnored.',
    ],
    fail: [
      'No es la API oficial. Hay riesgo frente a los términos de WhatsApp y no hay soporte de Meta.',
      'Es un RC: la versión puede moverse. El socket es de una sola sesión.',
    ],
    deepen: [
      'Caché de grupos de 60 s. Envío de texto y de medios en el mismo módulo de transporte.',
      'Estados de conexión: stopped, connecting, pairing_required, open, reconnect_wait, logged_out, degraded, replaced.',
    ],
    codePath: 'src/transport/baileys-transport.ts',
    codeNote: 'El socket, el envío y la caché de grupos. La clasificación de la conexión está en src/lifecycle/.',
    factIds: ['F-006', 'F-012', 'F-030', 'F-033', 'F-034', 'F-145'],
    certainty: 'verificado',
  },
  {
    slug: 'websocket-webhook',
    title: 'WebSocket y webhook',
    summary: 'Uno es un tubo que se queda abierto. El otro es un aviso HTTP de una sola vez.',
    animation: 'channels',
    wappi: [
      'WebSocket: el puente y WhatsApp. Persistente y en los dos sentidos. Por ahí entran los mensajes y salen los envíos.',
      'Webhook: el puente hace un POST HTTPS a la rutina, con bearer, sin redirecciones, con tope de 15 s. El cuerpo de la respuesta se tira.',
      'Un 200 dice que la rutina arrancó. La respuesta de Wappi no viene en ese 200: vuelve después por MCP.',
    ],
    fail: [
      'Timeout o excepción: etapa webhook_ambiguous, estado dispatch_unknown. No se reintenta solo. El run pudo haber empezado.',
      'Cualquier otro status: webhook_rejected y failed_dispatch. Un 429 tampoco se reintenta solo.',
    ],
    deepen: [
      'El modo se llama grok-bot, pero el despachador solo exige una URL https (o http de loopback en pruebas) y un bearer. El POST es genérico.',
      'Límites publicados de rutinas: 300 runs/h agregados y 200/h por rutina. Son techos publicados, no un SLA.',
    ],
    codePath: 'src/brain/grok-webhook.ts',
    codeNote: 'Autenticación, timeout y traducción del resultado del POST a una etapa.',
    factIds: ['F-065', 'F-066', 'F-019', 'F-070', 'F-090'],
    certainty: 'verificado',
    correction: 1,
  },
  {
    slug: 'sesion',
    title: 'Sesión y claves',
    summary: 'Las credenciales de Signal viven cifradas en SQLite. Un solo proceso puede usarlas.',
    animation: 'session',
    wappi: [
      'scrypt deriva la clave; AES-256-GCM cifra. Los ids de clave se guardan como HMAC.',
      'Un lockfile con pid impide un segundo proceso. SIGTERM cierra sin hacer logout.',
      'logged_out exige a una persona. serve no muestra un QR para «arreglarlo» solo.',
    ],
    fail: [
      'Dos réplicas romperían la sesión. Por eso el diseño futuro, si hubiera nube, habla de una sola instancia.',
      'libsignal imprime datos de sesión por consola. Los logs están en 0600 y falta un filtro en código (F-146).',
    ],
    deepen: [
      'Reconexión con backoff exponencial de 2 s hasta 60 s, con un margen de ±20 %. replaced y degraded también paran.',
      'La vinculación (link) pide varias banderas en true y una terminal privada. Puede ser QR o un código de 8 caracteres.',
    ],
    codePath: 'src/auth/production-store.ts',
    codeNote: 'Junto con src/persistence/store.ts, src/crypto-box.ts y src/lifecycle/supervisor.ts.',
    factIds: ['F-013', 'F-014', 'F-035', 'F-032', 'F-146'],
    certainty: 'verificado',
  },
  {
    slug: 'dedup',
    title: 'Dedup e idempotencia',
    summary: 'Dedup evita dos peticiones por el mismo mensaje. Idempotencia evita dos envíos por la misma completion.',
    animation: 'dedup',
    wappi: [
      'Entrada: clave única (cuenta, chat, remitente, mensaje), con HMAC. El mismo evento no crea otra petición.',
      'Salida: completionId más el contenido. El mismo par devuelve el recibo guardado y no reenvía (replay).',
      'El mismo completionId con otro contenido responde 409 conflict. Una petición completada no se reabre.',
    ],
    fail: [
      'Confundirlas enseña mal el sistema. Dedup es de la entrada. Idempotencia es de la vuelta.',
      'HMAC aquí no firma el webhook. Firma ids internos.',
    ],
    deepen: [
      'El handle de respuesta se guarda solo como hash. Un replyHandle incorrecto es 401 handle, que es otro control.',
    ],
    codePath: 'src/persistence/store.ts',
    codeNote: 'La reserva está en runtime.reserveInbound. La idempotencia, en claimCompletion.',
    factIds: ['F-040', 'F-102', 'F-131'],
    certainty: 'verificado',
    correction: 1,
  },
  {
    slug: 'cola',
    title: 'Cola por chat y caducidad',
    summary: 'Cada chat tiene un carril. El siguiente mensaje espera a que el anterior termine o caduque.',
    animation: 'queue',
    wappi: [
      'Tope de 8 en espera por chat. Concurrencia global de 2. Si no cabe, el mensaje queda shed.',
      'El hueco es una promesa gate. Una petición colgada bloquea ese chat hasta 10 min.',
      'TTL de 10 min. Barrido cada 15 s contra el reloj de pared, además del temporizador. Al arrancar se re-despachan entrantes frescos que seguían en cola.',
    ],
    fail: [
      'La limpieza de retención de 6 h no libera la cola. Es un pendiente conocido.',
      'Matar un MCP a mitad de una petición deja ese chat colgado esos 10 min.',
    ],
    deepen: [
      'No hay cifras de latencia por etapa en esta app. Existen en request_stage y no se midieron (U-04).',
    ],
    codePath: 'src/queue/chat-queue.ts',
    codeNote: 'El gate y el barrido están en src/runtime.ts. Los topes salen de src/config.ts.',
    factIds: ['F-060', 'F-067', 'F-068', 'F-154'],
    certainty: 'verificado',
    unknowns: ['U-04'],
  },
  {
    slug: 'ciclo',
    title: 'Ciclo de vida de una petición',
    summary: 'Estados de la petición y etapas que quedan escritas. No son lo mismo.',
    animation: 'states',
    wappi: [
      'Estados: queued, dispatched, dispatch_unknown, failed_dispatch, brain_unconfigured, completed, expired, cancelled.',
      'Etapas: admitted, luego una de webhook_accepted / webhook_ambiguous / webhook_rejected, luego callback, transport_accepted, delivered, read o receipt_failed.',
      'El simulador solo avanza de etapa cuando el hecho correspondiente ocurrió. delivered no aparece sin transport_accepted antes.',
    ],
    fail: [
      'brain_unconfigured es el valor por defecto del cerebro. En el despliegue descrito el modo es grok-bot. No mezcles el defecto del código con lo que está encendido en la box: los flags en vivo no se releyeron (U-03).',
    ],
    deepen: [
      'outcome de la salida es otra lista: transport_accepted, partial, delivery_unknown, failed, suppressed.',
      'Estados de outbox: queued, sending, accepted, delivered, read, failed, unknown, suppressed.',
    ],
    codePath: 'src/runtime.ts',
    codeNote: 'stage() escribe request_stage. Los nombres de estado están en ARCHITECTURE.md y en el runtime.',
    factIds: ['F-069', 'F-106', 'F-011'],
    certainty: 'verificado',
  },
  {
    slug: 'lista',
    title: 'Lista de chats y disparadores',
    summary: 'El dueño siempre. Un grupo, solo con mención real o con una cita a Wappi. Máximo cinco activos.',
    animation: 'allow',
    wappi: [
      'Hoy hay dos activos: el privado del dueño (protegido, modo all) y el grupo «Prueba WhatsApp» (mención o cita, role grupo-prueba).',
      'La cita vale si el autor citado es la propia cuenta (PN o LID) o si el id citado es uno que Wappi envió y no nombra el teléfono de otra persona.',
      'El puente agrega replyToWappi, quotedKind y quotedLabel. El destino sigue siendo el grupo, no la persona que escribió.',
      'Comandos locales, sin cerebro: !ayuda o !wappi, !privacidad, y !reset (borra el historial de ese chat; en grupos, solo admins).',
    ],
    fail: [
      'Sin mención ni cita: group_not_triggered, silencio. Grupo apagado: group_disabled. Privado ajeno: not_allowed. Nadie recibe un cartel de rechazo.',
      'pause_all vacía las listas efectivas hasta resume_all.',
    ],
    deepen: [
      'PN y LID son el número y un identificador alterno de WhatsApp. El detalle de cómo los asigna WhatsApp es conocimiento general; el código solo los usa para reconocer una cita a sí mismo.',
      'Las respuestas de admin usan handles opacos, nunca el JID ni el teléfono.',
    ],
    codePath: 'src/policy/policy.ts',
    codeNote: 'commandOf, quoteAddressesSelf y la tabla chat_policy. Cada cambio queda en chat_policy_audit.',
    factIds: ['F-042', 'F-043', 'F-044', 'F-045', 'F-046', 'F-047'],
    certainty: 'verificado',
    correction: 5,
  },
  {
    slug: 'medios',
    title: 'Pipeline de medios',
    summary: 'Pocos tipos, tamaño máximo, carpeta privada una hora, y transcripción solo si el audio cabe en 60 s.',
    animation: 'media',
    wappi: [
      'Imagen jpeg/png/webp hasta 5 MB. PDF hasta 8 MB. text/plain hasta 1 MB. Audio ogg, mpeg o mp4 hasta 8 MB.',
      'id med_ + 24 hex, permiso 0600, borrado a la hora (purga cada 10 min). Al cerebro: id, mime, size, sha256.',
      'El pie de foto, o un punto si no hay pie, va en untrusted.text. La transcripción también va ahí. No existe un campo transcript.',
      'El agente lee el archivo solo por esa ruta, comprueba size y sha256, no lo ejecuta y no sigue enlaces. No afirma cuántas páginas tiene sin contarlas.',
    ],
    fail: [
      'Audio de más de 60 s, o transcripción fallida: se ignora. No hay webhook y no se inventa texto.',
      'Video, stickers y notas de video se ignoran.',
      'Medios en grupo y una prueba real de imagen o documento en grupo siguen pendientes (F-154, U-06).',
    ],
    deepen: [
      'whisper.cpp oficial de CPU, v1.9.2, modelo multilingüe ggml-tiny-q5_1, unos 32 MB, verificado por SHA-256. El hash concreto no está en la hoja: no se copia uno inventado.',
      'Sin shell, concurrencia 1, timeout 60 s, idioma es.',
      'Se activó en la release f18bba8 (9 nov). Que los flags sigan en true no se releyó en config (F-055, U-03).',
    ],
    codePath: 'src/media/stt.ts',
    codeNote: 'La descarga y la carpeta están en src/media/inbox.ts. El plan operativo está en deploy/STT-PLAN.md.',
    factIds: ['F-050', 'F-051', 'F-052', 'F-053', 'F-054', 'F-081', 'F-055'],
    certainty: 'verificado',
    correction: 8,
    unknowns: ['U-03', 'U-06'],
  },
  {
    slug: 'rutina',
    title: 'Qué es una rutina de Grok Bot',
    summary: 'Una tarea del agente que se dispara. Aquí, el disparador es el webhook del puente.',
    animation: 'routine',
    wappi: [
      'Nombre visible: «Wappi · WhatsApp · Mensajes entrantes». El agente se llama Wappi.',
      'El prompt vive en Grok Bot. En el repo solo están las plantillas deploy/ROUTINE*.md y el baseline que el puente adjunta en cada POST.',
      'Regla operativa del 10 nov 2026: la rutina responde solo por el conector Responder. Enviar y Admin están prohibidos ahí. Los conectores viejos «Wappi Retorno» y «Wappi Proactivo» se retiraron.',
    ],
    fail: [
      'El texto literal guardado en Grok Bot no está en disco (U-01). Esta lección enseña las plantillas y las reglas resumidas, no una cita del prompt en vivo.',
      'Cómo se agenda un run, qué modelo usa y la latencia son internos no verificados (U-02). No se nombra un modelo (F-003).',
    ],
    deepen: [
      'El baseline pide responder en español, breve, tratar lo externo como dato y no elegir destinatarios.',
      'Un fallo por el cupo de runs no se reintenta solo.',
    ],
    codePath: 'deploy/ROUTINE.md',
    codeNote: 'También ROUTINE-MEDIA.md y ROUTINE-OUTBOUND-MEDIA.md. El prompt efectivo no está en estos archivos.',
    factIds: ['F-080', 'F-081', 'F-084', 'F-029', 'F-003', 'F-070'],
    certainty: 'verificado',
    unknowns: ['U-01', 'U-02'],
  },
  {
    slug: 'cerebro-cuerpo',
    title: 'Cerebro y cuerpo',
    summary: 'El cerebro decide. El cuerpo guarda la sesión, mueve archivos y habla con WhatsApp.',
    animation: 'brainbody',
    wappi: [
      'Cerebro: el agente de Grok Bot. Piensa, decide y usa conectores.',
      'Cuerpo: la box. El mismo Linux donde corren el puente, el TTS, el STT y los tres MCP stdio.',
      'Los conectores son las manos. Responder, Enviar y Admin, cada uno con su bearer.',
    ],
    fail: [
      'Un MCP remoto no puede usar el localhost de la box.',
      'La box puede hibernar. No hay disponibilidad continua garantizada.',
      'El repo del puente no llama a ninguna API de modelos. El razonamiento no está en ese proceso.',
    ],
    deepen: [
      'Canal, hoy, es WhatsApp. El glosario oficial deja sitio a otro canal con el nombre wappi-channel-<nombre>. Eso es diseño, no código.',
    ],
    codePath: 'src/runtime.ts',
    codeNote: 'El orquestador del cuerpo. El cerebro no tiene carpeta de modelo dentro del repo.',
    factIds: ['F-001', 'F-002', 'F-083', 'F-153'],
    certainty: 'verificado',
  },
  {
    slug: 'mcp',
    title: 'MCP',
    summary: 'Servidores que exponen herramientas a un agente. Aquí viajan por stdio, en la misma máquina.',
    animation: 'mcp',
    wappi: [
      'Tres procesos: node con un env privado y dist/return-mcp.js, proactive-mcp.js o admin-mcp.js.',
      'Transporte MCP 2025-11-25: un mensaje JSON-RPC por línea, sin cabecera Content-Length. stdout solo lleva MCP. Los diagnósticos van a stderr.',
      'Cada uno hace POST a 127.0.0.1 con su bearer. Los bearers son excluyentes: si dos son iguales, el proceso no arranca.',
    ],
    fail: [
      'El endpoint de complete rechaza el bearer de Enviar. El de admin rechaza los de Responder y Enviar.',
      'Cambiar de máquina obliga a rehacer este tramo: loopback deja de verse.',
    ],
    deepen: [
      'La secuencia initialize, tools/list, tools/call es el patrón del protocolo. Es conocimiento general. El ejemplo animado de tools/call sale de sample-payloads.json, derivado del código. No se inventa un cuerpo de initialize.',
    ],
    codePath: 'src/return/mcp.ts',
    codeNote: 'Los otros dos entradas son src/proactive-mcp.ts y src/admin-mcp.ts.',
    factIds: ['F-090', 'F-095', 'F-092', 'F-083'],
    certainty: 'verificado',
  },
  {
    slug: 'salida',
    title: 'Salida y recibos',
    summary: 'Preparar archivos, enviar en orden y no confundir las tres evidencias.',
    animation: 'receipts',
    wappi: [
      'El archivo tiene que vivir dentro de outgoing/<requestId>/. Un enlace simbólico, un enlace duro o un sha256 distinto rechazan el envío entero.',
      'HTML: se rechaza script, iframe, object, embed, form, svg, javascript:, refresh o recursos externos. Al HTML aceptado se le inyecta una CSP default-src none.',
      'Imágenes: ffmpeg las pasa a JPEG. Voz: a OGG/Opus mono 48 kHz, 32 kbps, con duración y forma de onda, máximo 180 s.',
      'Solo la primera parte cita el mensaje original. Si una parte falla, el resto queda skipped.',
    ],
    fail: [
      'transport_accepted es el SERVER_ACK. delivered llega con DELIVERY_ACK. read llega con READ o PLAYED. Son tres cosas.',
      'Sin id de transporte, o si el proceso muere en sending: outbox unknown, outcome delivery_unknown, sin reintento automático.',
    ],
    deepen: [
      'Recibo público: requestId, completionId, outcome, outboxState, transportId solo en v1, y parts en v2.',
      'Después se guarda el turno del asistente (para un adjunto, una descripción como [imagen: …]) y se borra la carpeta.',
    ],
    codePath: 'src/media/outbound-content.ts',
    codeNote: 'La transcodificación está en outbound-transcode.ts. Los recibos, en src/receipts.ts.',
    factIds: ['F-103', 'F-104', 'F-105', 'F-106', 'F-107', 'F-108', 'F-026'],
    certainty: 'verificado',
    correction: 6,
  },
  {
    slug: 'voz',
    title: 'Voz (TTS)',
    summary: 'El agente pide el audio en la box. El puente no sintetiza: comprueba el hash y lo convierte en nota de voz.',
    animation: 'tts',
    wappi: [
      'Comando: tools/tts/bin/wappi-tts --out <attachmentDir>/nota.mp3 y el texto.',
      'Principal: edge-tts, voz es-MX-JorgeNeural, +8 % y +4 Hz. Usa el lector en línea de Microsoft Edge. No tiene clave ni SLA. No es local.',
      'Respaldo: Piper es_MX-ald-medium, en la máquina. En el audio, «Wappi» se pronuncia «Uápi».',
      'Texto hablado de hasta 1500 caracteres. Solo si la persona pidió voz de forma explícita. Que te manden un audio no cuenta como pedir audio.',
    ],
    fail: [
      'Si edge-tts falla, entra Piper. Si el sha256 no coincide, el puente no envía nada.',
      'El STT de la entrada sí es local. No los juntes.',
    ],
    deepen: [
      'La llamada v2 lleva kind voice, file nota.mp3 y el sha256. El puente produce el OGG/Opus.',
    ],
    codePath: 'deploy/wappi-tts/README.md',
    codeNote: 'El wrapper vive fuera del puente. El puente solo verifica y transcodifica.',
    factIds: ['F-110', 'F-111', 'F-082', 'F-104', 'F-052'],
    certainty: 'verificado',
    correction: 2,
  },
  {
    slug: 'proactivo',
    title: 'Proactivo',
    summary: 'Wappi escribe primero solo cuando Juanjo se lo pide. No hay rutinas programadas.',
    animation: 'proactive',
    wappi: [
      'Destinos por alias: owner (el último chat directo que ya exista del dueño) y grupo-prueba (la fila con ese role).',
      'Tope 10 al día, silencio de 22:00 a 07:00 en Bogotá, separación mínima de 120 s, con un jitter acotado.',
      'Si hay una respuesta entrante en vuelo: 409 reactive_busy. Si el socket no está abierto, no gasta cupo.',
      'Presupuesto de unos 45 s, con un preflight de dispositivos de 15 s, por debajo del timeout de 60 s del cliente MCP.',
    ],
    fail: [
      'Sin chat previo: no_existing_chat. No abre conversaciones nuevas.',
      'El breaker se abre con ack de error, timelock, device_removed, logged_out, forbidden, degraded o un unknown proactivo. Solo se cierra con proactive-reset y el OK de Juanjo.',
      'La respuesta a un mensaje entrante no depende de ese breaker.',
    ],
    deepen: [
      'Nunca se reintenta solo. idempotencyKey de 8 a 80 caracteres, del conjunto indicado en el esquema.',
      'Enviar no se usa desde la rutina entrante. Solo cuando Juanjo lo pide.',
    ],
    codePath: 'src/proactive/handle.ts',
    codeNote: 'Esquema en src/proactive/schema.ts. Destinos en src/proactive/destination.ts. Texto de operación en deploy/PROACTIVE.md.',
    factIds: ['F-120', 'F-121', 'F-122', 'F-123', 'F-124', 'F-096'],
    certainty: 'verificado',
  },
];

export const lessonsBySlug: Record<string, Lesson> = Object.fromEntries(
  lessons.map((lesson) => [lesson.slug, lesson]),
);
