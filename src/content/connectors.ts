export interface ConnectorTool {
  name: string;
  summary: string;
  fields: string[];
}

export interface Connector {
  id: 'responder' | 'enviar' | 'admin';
  title: string;
  server: string;
  binary: string;
  endpoint: string;
  who: string;
  summary: string;
  tools: ConnectorTool[];
  rules: string[];
  errors: string[];
  payloadKey: string;
  factIds: string[];
}

export const connectors: Connector[] = [
  {
    id: 'responder',
    title: 'Responder',
    server: 'wappi-return',
    binary: 'dist/return-mcp.js',
    endpoint: 'POST http://127.0.0.1:<PORT>/v1/complete',
    who: 'Solo la rutina entrante. Enviar y Admin no se usan desde esa rutina.',
    summary: 'Cierra una petición que ya existe. El destino no viaja en la llamada.',
    tools: [
      {
        name: 'complete_request',
        summary: 'Una llamada por petición. v1 es texto. v2 puede llevar hasta 3 adjuntos.',
        fields: [
          'schemaVersion: 1 o 2',
          'requestId: 16–80 caracteres',
          'replyHandle: 20–200',
          'completionId: 8–80',
          'v1: text obligatorio',
          'v2: text y/o attachments (image, document, audio, voice)',
          'file: solo nombre, con extensión permitida, nunca una ruta ni un id med_ u out_',
          'sha256: 64 hex',
          'caption solo en image o document, hasta 1024',
          'fileName solo en document, hasta 80',
        ],
      },
    ],
    rules: [
      'additionalProperties en false. Un campo to, chatId, phone o callbackUrl es destination_forbidden.',
      'La URL la fija el proceso y tiene que ser loopback terminada en /v1/complete.',
      'El mismo completionId y el mismo contenido es replay, sin reenviar. Otro contenido es conflict.',
      'Nota de voz solo si la persona la pidió explícitamente.',
    ],
    errors: [
      '400 destination_forbidden',
      '401 handle o unauthorized',
      '404 not_found',
      '409 conflict, cancelled, state o clock',
      '410 expired',
      '413 too_large',
      '429 media_rate (30 medios por hora)',
      '403 media_disabled si los adjuntos están apagados',
    ],
    payloadKey: 'mcp_toolsCall_completeRequest_v1',
    factIds: ['F-090', 'F-091', 'F-092', 'F-096', 'F-100', 'F-101', 'F-102'],
  },
  {
    id: 'enviar',
    title: 'Enviar',
    server: 'wappi-proactive',
    binary: 'dist/proactive-mcp.js',
    endpoint: 'POST http://127.0.0.1:<PORT>/v1/proactive',
    who: 'Solo cuando Juanjo lo pide. Nunca desde la rutina entrante.',
    summary: 'Escribe primero, a un alias. No abre un chat que no exista.',
    tools: [
      {
        name: 'send_message',
        summary: 'Mensaje proactivo con clave de idempotencia.',
        fields: [
          'schemaVersion: 1',
          'destination: owner o grupo-prueba',
          'idempotencyKey: 8–80, del conjunto de caracteres del esquema',
          'text',
          'attachments opcional',
        ],
      },
      {
        name: 'prepare_attachments',
        summary: 'Crea la carpeta outgoing/pro_<id>/ para los archivos.',
        fields: ['Prepara la carpeta. El id usa el prefijo pro_ y no se muestra un ejemplo real.'],
      },
    ],
    rules: [
      'Los destinos son alias. Nunca un número.',
      'Silencio 22:00–07:00 hora de Bogotá, 10 al día, 120 s de separación.',
      'Si hay una respuesta entrante en vuelo, 409 reactive_busy.',
      'El breaker no afecta a la respuesta reactiva. Reabrirlo pide proactive-reset y el OK de Juanjo.',
    ],
    errors: [
      'proactive_disabled',
      'quiet_hours',
      'daily_cap',
      'too_soon',
      'reactive_busy',
      'socket_not_open',
      'transport_not_ready (503, no gasta cupo)',
      'breaker_open',
      'idempotency_conflict',
      'destination_forbidden',
      'no_existing_chat',
    ],
    payloadKey: 'mcp_sendMessage_proactive',
    factIds: ['F-093', 'F-096', 'F-120', 'F-121', 'F-122', 'F-123'],
  },
  {
    id: 'admin',
    title: 'Admin',
    server: 'wappi-whatsapp-admin',
    binary: 'dist/admin-mcp.js',
    endpoint: 'POST http://127.0.0.1:<PORT>/v1/admin',
    who: 'Cuando Juanjo pide activar o desactivar chats.',
    summary: 'Mueve la lista de chats. Las herramientas de pausa se llaman pause_all y resume_all.',
    tools: [
      {
        name: 'list_chats',
        summary: 'Activos, tope y conocidos. Sin números ni JID.',
        fields: ['Devuelve handles opacos, alias, kind, mode y state.'],
      },
      {
        name: 'chat_status',
        summary: 'Estado de un chat por su handle.',
        fields: ['handle opaco'],
      },
      {
        name: 'allow_chat',
        summary: 'Activa un chat. Exige confirm true.',
        fields: ['confirm: true', 'Se niega con un entrante en proceso o si ya hay 5 activos.', 'Un grupo queda en mención o cita.'],
      },
      {
        name: 'deny_chat',
        summary: 'Apaga un chat. Apagar el privado del dueño exige confirm.',
        fields: ['confirm cuando es el dueño'],
      },
      {
        name: 'pause_all',
        summary: 'Vacía las listas efectivas. Nada se admite hasta resume_all.',
        fields: ['Sin alias «pause». El nombre del código es pause_all.'],
      },
      {
        name: 'resume_all',
        summary: 'Vuelve a admitir. Exige confirm.',
        fields: ['confirm: true'],
      },
    ],
    rules: [
      'Nunca devuelve el teléfono ni el JID.',
      'Tope de 5 chats activos.',
      'El bearer de Admin no sirve para complete ni para proactive.',
    ],
    errors: [
      'Negativa por tope de 5.',
      'Negativa si hay un entrante en proceso.',
      'Bearer de otro conector: rechazo.',
    ],
    payloadKey: 'mcp_admin_listChats_response_shape',
    factIds: ['F-094', 'F-046', 'F-047', 'F-095', 'F-096'],
  },
];
