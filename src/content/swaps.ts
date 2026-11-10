import type { Certainty, SwapEffect } from './types';

export interface Swap {
  id: string;
  piece: string;
  replaces: string;
  contract: string;
  touch: string;
  unchanged: string;
  risks: string;
  certainty: Certainty;
  certaintyNote: string;
  effects: Record<string, SwapEffect>;
  factIds: string[];
}

const keepCore = (ids: string[], effect: SwapEffect): Record<string, SwapEffect> =>
  Object.fromEntries(ids.map((id) => [id, effect]));

export const swaps: Swap[] = [
  {
    id: 'brain',
    piece: 'Cerebro',
    replaces: 'Grok Bot por otro bucle de agente. Ejemplos de proveedor: Gemini, OpenAI u otro motor local. Sin nombres de modelo.',
    contract:
      'Recibir el webhook (bearer sobre HTTPS) y devolver por POST /v1/complete con complete_request v1 o v2. El puente solo exige una URL https y un bearer. El modo se llama grok-bot, pero el despacho es un POST genérico.',
    touch:
      'Un receptor HTTPS del webhook, el bucle del agente (leer media/, generar imagen o documento, TTS) y la ruta de retorno. Como /v1/complete escucha solo en loopback y el MCP exige URL loopback, el cerebro nuevo tiene que correr en la misma máquina, o haría falta un cambio de código que hoy no existe (túnel o un endpoint HTTPS autenticado).',
    unchanged: 'Baileys, la política, la cola, SQLite, el outbox y los recibos.',
    risks:
      'Hoy está decidido que el cerebro sea Grok Bot y que el repo no llame APIs de modelos. Esto es un ejercicio, no un plan. Cómo se integra cada proveedor es conocimiento general: no se probó con Wappi (U-09).',
    certainty: 'verificado',
    certaintyNote: 'El contrato está verificado. La integración de cada proveedor es conocimiento general.',
    effects: {
      ...keepCore(
        ['phone', 'wa-servers', 'linked-device', 'baileys', 'normalize', 'dedup', 'policy', 'media', 'sqlite', 'queue', 'box-tools', 'send', 'receipts'],
        'keep',
      ),
      routine: 'change',
      agent: 'change',
      dispatcher: 'contract',
      'mcp-responder': 'contract',
      validate: 'contract',
    },
    factIds: ['F-001', 'F-019', 'F-062', 'F-065', 'F-091', 'F-100', 'F-021', 'F-092', 'F-143'],
  },
  {
    id: 'transport',
    piece: 'Transporte',
    replaces: 'Baileys por la Cloud API oficial de Meta, por Twilio WhatsApp o por otro BSP.',
    contract:
      'Seguir entregando al cerebro el mismo webhook y aceptar la vuelta por /v1/complete. La política, la cola y los MCP pueden quedarse si el evento ya está normalizado.',
    touch:
      'src/transport/*, src/inbound/normalize.ts (la forma del evento), src/receipts.ts (los estados), la descarga y el envío de medios, y la sesión. Desaparecen las claves Signal y el QR. Aparecen tokens de la API y un webhook entrante público HTTPS.',
    unchanged: 'La decisión de política, la cola por chat, el contrato con el cerebro y el esquema MCP, si el mensaje ya viene normalizado.',
    risks:
      'Conocimiento general, no probado aquí: la API oficial suele pedir cuenta de negocio verificada, un número dedicado, plantillas para abrir conversación fuera de la ventana de 24 h y un costo por conversación. A cambio está soportada. Baileys es un cliente de usuario, sin ese costo, y no es oficial (F-145), es un RC (F-006) y exige un socket con una sola sesión (F-153). El soporte de grupos en la API oficial no se afirma: no está verificado. Hay que leer la documentación vigente antes de decidir.',
    certainty: 'general',
    certaintyNote: 'Qué archivos se tocan sale del mapa del código. Los tradeoffs de proveedores son conocimiento general (U-09).',
    effects: {
      phone: 'keep',
      'wa-servers': 'change',
      'linked-device': 'change',
      baileys: 'change',
      normalize: 'change',
      dedup: 'keep',
      policy: 'keep',
      media: 'change',
      sqlite: 'contract',
      queue: 'keep',
      dispatcher: 'keep',
      routine: 'keep',
      agent: 'keep',
      'box-tools': 'keep',
      'mcp-responder': 'keep',
      validate: 'keep',
      send: 'change',
      receipts: 'change',
    },
    factIds: ['F-012', 'F-015', 'F-026', 'F-030', 'F-006', 'F-145', 'F-153'],
  },
  {
    id: 'stt',
    piece: 'STT',
    replaces: 'whisper.cpp tiny por un modelo más grande, otro motor local o un servicio en la nube.',
    contract: 'El punto único es src/media/stt.ts: bytes y mime entran, texto o null salen. El texto sigue yendo solo en untrusted.text.',
    touch: 'src/media/stt.ts y los binarios de la box (whisper-cli, ffmpeg, ffprobe).',
    unchanged: 'La política, el webhook, el MCP y el envío.',
    risks:
      'Precisión contra CPU y RAM contra privacidad. Hoy es local (F-052). Un servicio en la nube sacaría el audio de la máquina: eso no está hecho y sería otra decisión. El tiny ya confundió «Wappi» con «Papi» (F-054).',
    certainty: 'verificado',
    certaintyNote: 'El contrato del módulo está verificado. Comparar motores concretos que no están en el repo es conocimiento general.',
    effects: {
      ...keepCore(
        ['phone', 'wa-servers', 'linked-device', 'baileys', 'normalize', 'dedup', 'policy', 'sqlite', 'queue', 'dispatcher', 'routine', 'agent', 'box-tools', 'mcp-responder', 'validate', 'send', 'receipts'],
        'keep',
      ),
      media: 'change',
    },
    factIds: ['F-052', 'F-053', 'F-054'],
  },
  {
    id: 'tts',
    piece: 'TTS',
    replaces: 'edge-tts y Piper por otro motor.',
    contract:
      'Dejar un audio en attachmentDir y pasar su sha256. El puente transcodifica a OGG/Opus. El puente no sintetiza.',
    touch: 'El wrapper /workspace/wappi/tools/tts, fuera del proceso del puente. Lo llama el agente.',
    unchanged: 'Baileys, la validación del sha256 y la transcodificación.',
    risks: 'edge-tts no tiene clave ni SLA, y no es local (F-111). Otro motor tiene que seguir escribiendo un archivo, no devolver el audio dentro del webhook.',
    certainty: 'verificado',
    certaintyNote: 'El contrato está verificado. Elegir otro motor es conocimiento general.',
    effects: {
      ...keepCore(
        ['phone', 'wa-servers', 'linked-device', 'baileys', 'normalize', 'dedup', 'policy', 'media', 'sqlite', 'queue', 'dispatcher', 'routine', 'agent', 'mcp-responder', 'validate', 'send', 'receipts'],
        'keep',
      ),
      'box-tools': 'change',
    },
    factIds: ['F-110', 'F-111', 'F-104'],
  },
  {
    id: 'storage',
    piece: 'Almacenamiento',
    replaces: 'SQLite por Postgres, o el disco local por S3.',
    contract:
      'Transacciones en el guardado de claves, la clave única de dedup y el cifrado de columnas. Es un diseño futuro de puertos y adaptadores, no código de hoy.',
    touch: 'Hoy todo pasa por src/persistence/store.ts, un archivo grande. No es un cambio de una interfaz ya extraída.',
    unchanged: 'El contrato externo del webhook y de complete_request, si el ledger sigue teniendo el destino y el hash del handle.',
    risks: 'Perder la transacción o la unicidad rompe dedup o la sesión. Dos escritores de la sesión de Baileys no caben.',
    certainty: 'verificado',
    certaintyNote: 'El estado actual está verificado. Postgres y S3 aparecen como diseño futuro, no como algo probado.',
    effects: {
      ...keepCore(
        ['phone', 'wa-servers', 'linked-device', 'baileys', 'normalize', 'policy', 'media', 'queue', 'dispatcher', 'routine', 'agent', 'box-tools', 'mcp-responder', 'validate', 'send', 'receipts'],
        'keep',
      ),
      dedup: 'contract',
      sqlite: 'change',
    },
    factIds: ['F-130', 'F-131', 'F-013', 'F-153'],
  },
  {
    id: 'hosting',
    piece: 'Hosting',
    replaces: 'La box de Grok Bot por una sola instancia en EC2, ECS o un VPS.',
    contract: 'Una sola instancia. Nunca dos réplicas: Baileys es una sola sesión.',
    touch:
      'El despliegue y, si los MCP dejan de ver 127.0.0.1, el transporte de los conectores. Harían falta MCP remotos por HTTPS con auth, o seguir en la misma máquina. Ese remoto no existe hoy.',
    unchanged: 'El código de admisión, si la red sigue dejando el loopback como está.',
    risks: 'Se evita la hibernación de la box (F-083). Se gana operación de una máquina. Se pierde el «todo en localhost» si se separan los procesos.',
    certainty: 'verificado',
    certaintyNote: 'La restricción de una sola sesión está verificada. El detalle de cada nube es diseño (F-153), no un despliegue hecho.',
    effects: {
      ...keepCore(
        ['phone', 'wa-servers', 'linked-device', 'baileys', 'normalize', 'dedup', 'policy', 'media', 'sqlite', 'queue', 'dispatcher', 'send', 'receipts'],
        'keep',
      ),
      routine: 'contract',
      agent: 'contract',
      'box-tools': 'contract',
      'mcp-responder': 'change',
      validate: 'contract',
    },
    factIds: ['F-083', 'F-092', 'F-143', 'F-153'],
  },
  {
    id: 'channel',
    piece: 'Canal',
    replaces: 'WhatsApp por Telegram, correo u otro canal.',
    contract: 'El plan nombra paquetes wappi-channel-<nombre>. El cerebro seguiría recibiendo una petición y devolviendo complete_request, si se conserva ese borde.',
    touch: 'No hay código de otro canal. Sería un paquete nuevo, más el transporte y la normalización.',
    unchanged: 'Nada de forma automática: hoy el canal es WhatsApp.',
    risks: 'Es diseño del plan de migración, no una pieza que se pueda enchufar. Afirmar que «solo se cambia un adaptador» sería mentira con el código actual.',
    certainty: 'verificado',
    certaintyNote: 'Está verificado que es diseño y que no está implementado.',
    effects: {
      phone: 'change',
      'wa-servers': 'change',
      'linked-device': 'change',
      baileys: 'change',
      normalize: 'change',
      dedup: 'contract',
      policy: 'contract',
      media: 'change',
      sqlite: 'contract',
      queue: 'contract',
      dispatcher: 'contract',
      routine: 'keep',
      agent: 'keep',
      'box-tools': 'keep',
      'mcp-responder': 'contract',
      validate: 'contract',
      send: 'change',
      receipts: 'change',
    },
    factIds: ['F-002', 'F-153'],
  },
];

export const swapsById: Record<string, Swap> = Object.fromEntries(swaps.map((swap) => [swap.id, swap]));
