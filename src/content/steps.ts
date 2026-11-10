import { faultOptions } from './labels';
import type {
  AdminScenario,
  ChatKind,
  Fault,
  InputKind,
  PhoneBubble,
  PhoneEffect,
  ProactiveScenario,
  Scenario,
  Step,
} from './types';

type Draft = Omit<Step, 'id'>;

export const attachmentFaults: Fault[] = ['sha-mismatch', 'html-script', 'media-rate'];

const claimFaults: Fault[] = ['bad-handle', 'completion-conflict', 'media-rate'];
const schemaFaults: Fault[] = ['extra-to', 'sha-mismatch', 'html-script'];

function faultLabel(fault: Fault): string {
  return faultOptions.find((item) => item.id === fault)?.label ?? fault;
}

function pack(drafts: Draft[], extra?: string): Step[] {
  const steps: Step[] = drafts.map((draft, index) => ({
    ...draft,
    id: String(index + 1).padStart(2, '0'),
  }));
  const last = steps[steps.length - 1];
  if (!last.terminal) last.terminal = { outcome: 'Fin', lesson: [] };
  if (extra) last.terminal.lesson = [...last.terminal.lesson, extra];
  return steps;
}

function finalize(drafts: Draft[], scenario: Scenario, faultApplied: boolean): Step[] {
  const extra =
    scenario.fault !== 'none' && !faultApplied
      ? `El fallo «${faultLabel(scenario.fault)}» no llega a ejecutarse: este camino se corta antes.`
      : undefined;
  return pack(drafts, extra);
}

function textOf(scenario: Scenario): string {
  if (scenario.chat === 'help') return '!ayuda';
  if (scenario.chat === 'group-mention') return '@Wappi ¿me resumes esto?';
  if (scenario.chat === 'group-quote') return '¿y eso qué significa?';
  if (scenario.chat === 'group-silent') return 'hola a todos';
  if (scenario.chat === 'unauthorized') return 'Hola';
  return 'Hola Wappi';
}

function isGroup(chat: ChatKind): boolean {
  return chat === 'group-mention' || chat === 'group-quote' || chat === 'group-silent';
}

function incoming(scenario: Scenario): PhoneBubble {
  if (scenario.chat === 'help' && scenario.input !== 'video') {
    return { kind: 'text', from: 'user', text: '!ayuda' };
  }
  if (scenario.input === 'text') return { kind: 'text', from: 'user', text: textOf(scenario) };
  if (scenario.input === 'voice') return { kind: 'voice', from: 'user', label: 'Nota de voz' };
  if (scenario.input === 'image') return { kind: 'image', from: 'user', label: 'Imagen' };
  if (scenario.input === 'pdf') return { kind: 'document', from: 'user', label: 'Documento PDF' };
  if (scenario.input === 'txt') return { kind: 'document', from: 'user', label: 'Archivo de texto' };
  return { kind: 'text', from: 'user', text: '[video o sticker]' };
}

function replyBubbles(scenario: Scenario): PhoneEffect[] {
  const sample = 'Respuesta de ejemplo del simulador.';
  if (scenario.reply === 'text') return [{ type: 'bubble', bubble: { kind: 'text', from: 'wappi', text: sample } }];
  if (scenario.reply === 'image') {
    return [{ type: 'bubble', bubble: { kind: 'image', from: 'wappi', label: 'Imagen JPEG' } }];
  }
  if (scenario.reply === 'document') {
    return [{ type: 'bubble', bubble: { kind: 'document', from: 'wappi', label: 'Documento' } }];
  }
  if (scenario.reply === 'voice') {
    return [{ type: 'bubble', bubble: { kind: 'voice', from: 'wappi', label: 'Nota de voz' } }];
  }
  return [
    { type: 'bubble', bubble: { kind: 'text', from: 'wappi', text: sample } },
    { type: 'bubble', bubble: { kind: 'document', from: 'wappi', label: 'Adjunto' } },
  ];
}

function note(text: string): PhoneEffect {
  return { type: 'bubble', bubble: { kind: 'note', text } };
}

function untrusted(scenario: Scenario): Record<string, unknown> {
  const base = { pushName: '<NOMBRE_VISIBLE>', quotedText: null as string | null };
  if (scenario.chat === 'group-quote') {
    return {
      ...base,
      text: '¿y eso qué significa?',
      quotedText: '<fragmento citado>',
      replyToWappi: true,
      quotedKind: 'voice',
      quotedLabel: 'nota de voz de Wappi',
    };
  }
  if (scenario.input === 'voice') {
    return {
      ...base,
      text: '<transcripción de whisper.cpp>',
      media: [{ id: 'med_<24_HEX>', mime: 'audio/ogg', size: 18000, sha256: '<SHA256_HEX>' }],
    };
  }
  if (scenario.input === 'image') {
    return {
      ...base,
      text: 'Mira esto',
      media: [{ id: 'med_<24_HEX>', mime: 'image/jpeg', size: 120000, sha256: '<SHA256_HEX>' }],
    };
  }
  if (scenario.input === 'pdf') {
    return {
      ...base,
      text: '.',
      media: [{ id: 'med_<24_HEX>', mime: 'application/pdf', size: 120000, sha256: '<SHA256_HEX>' }],
    };
  }
  if (scenario.input === 'txt') {
    return {
      ...base,
      text: '.',
      media: [{ id: 'med_<24_HEX>', mime: 'text/plain', size: 800, sha256: '<SHA256_HEX>' }],
    };
  }
  return { ...base, text: textOf(scenario), media: [] };
}

function messageShape(scenario: Scenario): Record<string, unknown> {
  if (scenario.input === 'voice') {
    return { audioMessage: { mimetype: 'audio/ogg', seconds: scenario.fault === 'voice-too-long' ? 90 : 12 } };
  }
  if (scenario.input === 'image') return { imageMessage: { mimetype: 'image/jpeg', caption: 'Mira esto' } };
  if (scenario.input === 'pdf') return { documentMessage: { mimetype: 'application/pdf' } };
  if (scenario.input === 'txt') return { documentMessage: { mimetype: 'text/plain' } };
  if (scenario.input === 'video') return { stickerMessage: { mimetype: 'image/webp' } };
  return { extendedTextMessage: { text: textOf(scenario) } };
}

function completeCall(scenario: Scenario): { payloadKey: string; payloadPatch: unknown } {
  const badSha = scenario.fault === 'sha-mismatch';
  const sha = badSha ? '<SHA_NO_COINCIDE>' : '<SHA256_HEX>';
  if (scenario.fault === 'html-script') {
    return {
      payloadKey: 'mcp_toolsCall_completeRequest_v2_imageAndDoc',
      payloadPatch: {
        params: {
          arguments: {
            schemaVersion: 2,
            text: 'Te dejo el archivo.',
            attachments: [{ kind: 'document', file: 'nota.html', sha256: '<SHA256_HEX>', fileName: 'Nota.html' }],
          },
        },
      },
    };
  }
  const args: Record<string, unknown> = {};
  if (scenario.fault === 'extra-to') args.to = '<NO_DESTINO>';
  if (scenario.fault === 'bad-handle') args.replyHandle = '<REPLY_HANDLE_INCORRECTO>';

  if (scenario.reply === 'text' && !attachmentFaults.includes(scenario.fault)) {
    return {
      payloadKey: 'mcp_toolsCall_completeRequest_v1',
      payloadPatch: { params: { arguments: { ...args, text: 'Claro. Te respondo en texto.' } } },
    };
  }
  if (scenario.reply === 'voice') {
    return {
      payloadKey: 'mcp_toolsCall_completeRequest_v2_voice',
      payloadPatch: {
        params: {
          arguments: {
            ...args,
            schemaVersion: 2,
            text: 'Te mando la explicación en audio.',
            attachments: [{ kind: 'voice', file: 'nota.mp3', sha256: sha }],
          },
        },
      },
    };
  }
  const attachment =
    scenario.reply === 'image'
      ? { kind: 'image', file: 'grafica.png', sha256: sha, caption: 'Gráfica' }
      : { kind: 'document', file: 'resumen.pdf', sha256: sha, fileName: 'Resumen.pdf' };
  return {
    payloadKey: 'mcp_toolsCall_completeRequest_v2_imageAndDoc',
    payloadPatch: {
      params: {
        arguments: {
          ...args,
          schemaVersion: 2,
          text: scenario.reply === 'text-attachment' ? 'Aquí va el texto y luego el archivo.' : 'Aquí va el archivo.',
          attachments: [attachment],
        },
      },
    },
  };
}

function errorPayload(status: number, error: string, why: string) {
  return {
    payloadKey: 'completeResponse_errors' as const,
    payloadPatch: { examples: [{ status, body: { ok: false, error }, why }] },
  };
}

function receiptPayload(scenario: Scenario): { payloadKey: string; payloadPatch?: unknown } {
  if (scenario.reply === 'text') return { payloadKey: 'completeResponse_ok_v1' };
  const parts =
    scenario.reply === 'text-attachment'
      ? [
          { kind: 'text', state: 'accepted' },
          { kind: 'document', state: 'accepted' },
        ]
      : [{ kind: scenario.reply === 'voice' ? 'voice' : scenario.reply, state: 'accepted' }];
  return {
    payloadKey: 'completeResponse_ok_v2',
    payloadPatch: { receipt: { outcome: 'transport_accepted', outboxState: 'accepted', parts } },
  };
}

function needsTools(scenario: Scenario): boolean {
  return scenario.reply !== 'text' || attachmentFaults.includes(scenario.fault);
}

export function buildJourney(scenario: Scenario): Step[] {
  const drafts: Draft[] = [];
  const push = (draft: Draft) => drafts.push(draft);

  push({
    lane: 'ida',
    nodeId: 'phone',
    actor: 'Teléfono',
    codePath: 'WhatsApp en el teléfono. Fuera del repo.',
    title: 'Alguien envía un mensaje',
    body: 'La persona usa WhatsApp normal. El puente no es esta pantalla: es otro dispositivo de la misma cuenta.',
    phoneEffect: { type: 'bubble', bubble: incoming(scenario) },
    factIds: ['F-030'],
    certainty: 'verificado',
  });

  push({
    lane: 'ida',
    nodeId: 'wa-servers',
    actor: 'Servidores de WhatsApp',
    codePath: 'Fuera del repo. El reparto interno no está leído en el código.',
    title: 'El mensaje cifrado se reparte',
    body: 'Conocimiento general: cada dispositivo vinculado tiene sus claves y el servidor le entrega el mensaje cifrado. El detalle de los servidores es U-05, no un hecho del código.',
    factIds: ['F-031'],
    certainty: 'general',
  });

  push({
    lane: 'ida',
    nodeId: 'linked-device',
    actor: 'Dispositivo vinculado',
    codePath: 'src/transport/baileys-transport.ts',
    title: 'El puente es otro WhatsApp Web',
    body: 'Para WhatsApp, el proceso Node es un dispositivo vinculado. Se declaró como Ubuntu / Wappi, no se marca en línea al conectar y no pide el historial completo.',
    factIds: ['F-030', 'F-012', 'F-032'],
    certainty: 'verificado',
  });

  push({
    lane: 'ida',
    nodeId: 'baileys',
    actor: 'Baileys',
    codePath: 'src/transport/baileys-transport.ts',
    title: 'El socket descifra y emite notify',
    body: 'Baileys descifra con las claves Signal de SQLite y emite messages.upsert de tipo notify. Otros tipos de upsert no crean petición: solo suben appendIgnored.',
    payloadKey: 'baileysUpsertEvent_simplified',
    payloadPatch: {
      type: 'notify',
      messages: [
        {
          key: {
            remoteJid: '<CHAT_JID>',
            fromMe: false,
            id: '<WA_MESSAGE_ID>',
            ...(isGroup(scenario.chat) ? { participant: '<SENDER_JID_solo_en_grupos>' } : {}),
          },
          messageTimestamp: '<UNIX_SECONDS>',
          pushName: '<NOMBRE_VISIBLE>',
          message: messageShape(scenario),
        },
      ],
    },
    factIds: ['F-012', 'F-013', 'F-033'],
    certainty: 'verificado',
  });

  if (scenario.input === 'video') {
    push({
      lane: 'ida',
      nodeId: 'normalize',
      actor: 'Normalizar',
      codePath: 'src/inbound/normalize.ts · src/media/',
      title: 'Video o sticker: se ignora',
      body: 'Ese tipo no entra. No hay dedup de una petición, no hay webhook y el teléfono no recibe respuesta. El simulador lo corta aquí, que es lo que describe la especificación para video y stickers.',
      phoneEffect: note('Ignorado. Wappi no responde.'),
      factIds: ['F-015', 'F-050'],
      certainty: 'verificado',
      terminal: {
        outcome: 'Ignorado',
        lesson: [
          'Video, stickers y notas de video no despiertan a Wappi.',
          'Ignorar no es un mensaje de error: no sale nada al chat.',
        ],
      },
    });
    return finalize(drafts, scenario, false);
  }

  push({
    lane: 'ida',
    nodeId: 'normalize',
    actor: 'Normalizar',
    codePath: 'src/inbound/normalize.ts',
    title: 'Se queda el mensaje de una persona',
    body:
      scenario.chat === 'group-quote'
        ? 'No es propio, ni un estado, ni un broadcast. Se extraen el texto, las menciones y la cita: tipo y un fragmento de hasta 200 caracteres.'
        : 'No es propio, ni un estado, ni un broadcast. Se extraen el texto y las menciones. Reacciones, encuestas, contactos o ubicación no seguirían.',
    factIds: ['F-015'],
    certainty: 'verificado',
  });

  push({
    lane: 'ida',
    nodeId: 'dedup',
    actor: 'Dedup',
    codePath: 'src/persistence/store.ts',
    title: 'Se reserva la clave única',
    body: 'La clave es cuenta + chat + remitente + mensaje, guardada como HMAC. El mismo evento no puede crear otra petición. Esto todavía no es la idempotencia de la respuesta.',
    example: {
      _nota: 'Forma conceptual. Los HMAC reales no se muestran.',
      table: 'inbound',
      key: ['account_id', 'chat_mac', 'sender_mac', 'message_mac'],
      inbound: 'received',
    },
    factIds: ['F-040', 'F-131'],
    certainty: 'verificado',
  });

  if (scenario.fault === 'duplicate') {
    push({
      lane: 'ida',
      nodeId: 'dedup',
      actor: 'Dedup',
      codePath: 'src/persistence/store.ts',
      title: 'El duplicado no crea otra petición',
      body: 'El mismo evento llega otra vez. La clave única ya está reservada, así que no nace una segunda petición ni se llama al webhook.',
      phoneEffect: note('Duplicado. No hay segunda respuesta.'),
      factIds: ['F-040'],
      certainty: 'verificado',
      terminal: {
        outcome: 'Duplicado',
        lesson: [
          'Dedup es de la entrada: una clave, una petición.',
          'El segundo aviso no enciende el cerebro.',
        ],
      },
    });
    return finalize(drafts, scenario, true);
  }

  if (scenario.fault === 'pause') {
    push({
      lane: 'ida',
      nodeId: 'policy',
      actor: 'Política',
      codePath: 'src/runtime.ts · src/admin/mcp.ts',
      title: 'Pausa global: no se admite nada',
      body: 'pause_all vacía las listas efectivas. Hasta resume_all no hay cerebro, ni comando, ni respuesta. El nombre en código es pause_all, no pause.',
      phoneEffect: note('Silencio. La pausa no avisa en el chat.'),
      factIds: ['F-047', 'F-094'],
      certainty: 'verificado',
      terminal: {
        outcome: 'Silencio',
        lesson: [
          'La pausa corta la admisión entera.',
          'resume_all exige confirm. No se llama pause/resume.',
        ],
      },
    });
    return finalize(drafts, scenario, true);
  }

  if (scenario.chat === 'unauthorized' || scenario.chat === 'group-silent') {
    const code = scenario.chat === 'group-silent' ? 'group_not_triggered' : 'not_allowed o group_disabled';
    push({
      lane: 'ida',
      nodeId: 'policy',
      actor: 'Política',
      codePath: 'src/policy/policy.ts',
      title: scenario.chat === 'group-silent' ? 'Grupo sin disparador' : 'Chat fuera de la lista',
      body:
        scenario.chat === 'group-silent'
          ? 'El grupo puede estar activo, pero no hay mención real ni cita a Wappi. El resultado es group_not_triggered. El entrante queda ignored. Silencio.'
          : 'Un privado que no es el dueño ni está activo cae en not_allowed. Un grupo apagado cae en group_disabled. El simulador no elige uno de los dos: los dos son silencio. Wappi no contesta «no estás autorizado», para no confirmar que existe.',
      example: { decision: 'ignore', code, inbound: 'ignored' },
      phoneEffect: note('Sin respuesta. No hay un mensaje de rechazo.'),
      factIds: ['F-042', 'F-043'],
      certainty: 'verificado',
      terminal: {
        outcome: 'Silencio',
        lesson: [
          'No autorizado significa silencio, no un texto de rechazo.',
          'El nombre visible o «soy admin» no cambian esta decisión.',
        ],
      },
    });
    return finalize(drafts, scenario, false);
  }

  if (scenario.chat === 'help') {
    push({
      lane: 'ida',
      nodeId: 'policy',
      actor: 'Política',
      codePath: 'src/policy/policy.ts',
      title: 'Es un comando local',
      body: '¡ayuda y !wappi piden la ayuda. También existen !privacidad y !reset. Los responde el puente. No se crea el webhook. El literal del texto de ayuda vive en el código y no se copia aquí.',
      example: { decision: 'command', command: '!ayuda' },
      factIds: ['F-045'],
      certainty: 'verificado',
    });
    push({
      lane: 'vuelta',
      nodeId: 'send',
      actor: 'Puente',
      codePath: 'src/runtime.ts (runDecision)',
      title: 'El puente responde solo',
      body: 'Sale un texto fijo al mismo chat, sin rutina y sin etapas de webhook. Los recibos de ese envío concreto no están descritos aparte en la hoja, así que el teléfono no finge palomitas.',
      phoneEffect: [
        { type: 'bubble', bubble: { kind: 'text', from: 'wappi', text: '[texto fijo de ayuda del puente]' } },
        note('Lo escribe el puente. El literal no está en la hoja de hechos.'),
      ],
      factIds: ['F-045'],
      certainty: 'verificado',
      terminal: {
        outcome: 'Respuesta local',
        lesson: [
          '!ayuda no toca el webhook ni al agente.',
          '!reset borra el historial de ese chat. En un grupo, solo si quien escribe es admin.',
        ],
      },
    });
    return finalize(drafts, scenario, false);
  }

  push({
    lane: 'ida',
    nodeId: 'policy',
    actor: 'Política',
    codePath: 'src/policy/policy.ts',
    title: scenario.chat === 'owner' ? 'Es el dueño: al cerebro' : 'El grupo sí dispara',
    body:
      scenario.chat === 'owner'
        ? 'Antes se miran el reloj (no más de 5 min en el futuro, ni más viejo de 15 min) y el tope de 4000 caracteres. En este escenario pasan. El privado del dueño está en modo all, así que la decisión es brain.'
        : scenario.chat === 'group-mention'
          ? 'El grupo está activo y el evento trae una mención real. La decisión es brain. Quien escribe viaja como senderRef seudónimo. El destino sigue siendo el grupo, no esa persona.'
          : 'El grupo está activo y la cita apunta a Wappi. Se agregan replyToWappi, quotedKind y quotedLabel. El destino sigue siendo el grupo.',
    example: {
      decision: 'brain',
      ...(scenario.chat === 'group-quote'
        ? { replyToWappi: true, quotedKind: 'voice', quotedLabel: 'nota de voz de Wappi' }
        : {}),
      ...(scenario.chat === 'group-mention' ? { senderRef: 's_<16_HEX>', destination: 'el grupo' } : {}),
    },
    factIds: scenario.chat === 'owner' ? ['F-041', 'F-042', 'F-046'] : ['F-043', 'F-044', 'F-018'],
    certainty: 'verificado',
  });

  if (scenario.input !== 'text') {
    const limits: Record<InputKind, string> = {
      text: '',
      voice: 'audio/ogg, audio/mpeg o audio/mp4, hasta 8 MB',
      image: 'image/jpeg, image/png o image/webp, hasta 5 MB',
      pdf: 'application/pdf, hasta 8 MB',
      txt: 'text/plain, hasta 1 MB',
      video: '',
    };
    push({
      lane: 'ida',
      nodeId: 'media',
      actor: 'Medios',
      codePath: 'src/media/baileys-download.ts · src/media/inbox.ts',
      title: 'Se guarda el archivo una hora',
      body: `El tipo permitido aquí es ${limits[scenario.input]}. El archivo queda en {DATA_DIR}/media/med_<24_HEX> con permiso 0600. Al cerebro solo irán id, mime, size y sha256. Se borra a la hora.`,
      example: {
        _nota: 'Metadatos que sí viajan. El archivo no.',
        id: 'med_<24_HEX>',
        mime: scenario.input === 'voice' ? 'audio/ogg' : scenario.input === 'image' ? 'image/jpeg' : scenario.input === 'pdf' ? 'application/pdf' : 'text/plain',
        sha256: '<SHA256_HEX>',
      },
      factIds: ['F-050', 'F-051'],
      certainty: 'verificado',
    });
    if (scenario.input === 'voice') {
      if (scenario.fault === 'voice-too-long' || scenario.fault === 'stt-fail') {
        push({
          lane: 'ida',
          nodeId: 'media',
          actor: 'STT',
          codePath: 'src/media/stt.ts',
          title: scenario.fault === 'voice-too-long' ? 'Dura más de 60 s' : 'La transcripción falla',
          body:
            scenario.fault === 'voice-too-long'
              ? 'ffprobe ve más de 60 s. El mensaje se ignora. No se llama a la rutina y no se inventa un texto.'
              : 'whisper-cli no devuelve texto. El mensaje se ignora. No hay campo transcript que rellenar con un aviso.',
          phoneEffect: note('Ignorado. No hay respuesta y no hay webhook.'),
          factIds: ['F-052', 'F-053'],
          certainty: 'verificado',
          terminal: {
            outcome: 'Ignorado',
            lesson: [
              'Un audio demasiado largo o ilegible no se convierte en una petición.',
              'El STT es local. Que falle no enciende el TTS ni el cerebro.',
            ],
          },
        });
        return finalize(drafts, scenario, true);
      }
      push({
        lane: 'ida',
        nodeId: 'media',
        actor: 'STT',
        codePath: 'src/media/stt.ts',
        title: 'whisper.cpp escribe el texto',
        body: 'ffprobe acepta la duración, ffmpeg pasa a WAV mono de 16 kHz y whisper-cli corre en español, sin shell. El texto entra en untrusted.text. No hay un campo transcript. El modelo tiny puede confundir nombres: en una prueba real escribió Papi en vez de Wappi.',
        payloadKey: 'webhookRequest_voiceNoteWithStt',
        factIds: ['F-052', 'F-053', 'F-054'],
        certainty: 'verificado',
      });
    }
  }

  push({
    lane: 'ida',
    nodeId: 'sqlite',
    actor: 'SQLite',
    codePath: 'src/persistence/store.ts',
    title: 'El entrante queda cifrado',
    body: 'inbound.payload_enc guarda el mensaje. Las columnas sensibles van con AES-256-GCM. Un solo archivo: data/wappi.sqlite.',
    factIds: ['F-060', 'F-130', 'F-131'],
    certainty: 'verificado',
  });

  push({
    lane: 'ida',
    nodeId: 'queue',
    actor: 'Cola',
    codePath: 'src/queue/chat-queue.ts',
    title: 'Entra en el carril de este chat',
    body: 'Como máximo hay 8 en espera por chat y 2 trabajos globales. Si el tope de espera ya está lleno, el mensaje queda shed y no sigue.',
    factIds: ['F-060'],
    certainty: 'verificado',
  });

  if (scenario.fault === 'queue-busy') {
    push({
      lane: 'lateral',
      nodeId: 'queue',
      actor: 'Cola',
      codePath: 'src/runtime.ts',
      title: 'Hay una petición anterior en este chat',
      body: 'Este mensaje espera su turno. El hueco de la anterior no se suelta hasta la completion o los 10 min. El salto que sigue es didáctico: no es una latencia medida. Si ya hubiera 8 en espera, este quedaría shed.',
      phoneEffect: note('En espera de este chat. Nada nuevo sale todavía.'),
      factIds: ['F-067', 'F-060'],
      certainty: 'verificado',
    });
  }

  push({
    lane: 'ida',
    nodeId: 'sqlite',
    actor: 'Runtime',
    codePath: 'src/runtime.ts (dispatchBrain)',
    title: 'Nace la petición',
    body: 'requestId con el patrón req_ y 32 hex. replyHandle de 32 bytes, guardado solo como sha256. expiresAt es ahora más 10 min. Se guarda el turno de la persona y un historial de hasta 12 turnos de este chat, no de otros. Etapa admitted. Si la salida con medios está activa, se crea outgoing/<requestId>/.',
    stage: 'admitted',
    example: {
      _nota: 'Patrón, no un id real.',
      requestId: 'req_<32_HEX>',
      replyHandle: '<REPLY_HANDLE_REDACTED>',
      storedAs: 'sha256',
      expiresIn: '10 min',
      historyTurns: 'hasta 12',
    },
    factIds: ['F-061', 'F-064'],
    certainty: 'verificado',
  });

  const dispatchStage = scenario.fault === 'webhook-timeout' ? 'webhook_ambiguous' : scenario.fault === 'webhook-rejected' ? 'webhook_rejected' : 'webhook_accepted';
  const dispatchState = scenario.fault === 'webhook-timeout' ? 'dispatch_unknown' : scenario.fault === 'webhook-rejected' ? 'failed_dispatch' : 'dispatched';

  push({
    lane: 'ida',
    nodeId: 'dispatcher',
    actor: 'Despachador',
    codePath: 'src/brain/grok-webhook.ts',
    title: scenario.fault === 'webhook-timeout' ? 'El POST no contesta a tiempo' : scenario.fault === 'webhook-rejected' ? 'El POST vuelve con otro status' : 'POST a la rutina',
    body:
      scenario.fault === 'webhook-timeout'
        ? 'HTTPS, bearer, sin redirecciones, tope 15 s. El cuerpo de la respuesta se descarta. Un timeout o una excepción dejan webhook_ambiguous y dispatch_unknown. No hay reintento automático. El run pudo haber empezado. No es una firma HMAC.'
        : scenario.fault === 'webhook-rejected'
          ? 'Un status que no es 200 deja webhook_rejected y failed_dispatch. Un 429 entra aquí y no se reintenta solo. Los techos publicados de rutinas no son un SLA.'
          : 'HTTPS, bearer, sin redirecciones, tope 15 s. Llega un 200. Eso solo dice que la rutina arrancó: en ese 200 no viene la respuesta. No es una firma HMAC.',
    payloadKey: 'webhookRequest_inbound',
    payloadPatch: {
      body: {
        request: {
          untrusted: untrusted(scenario),
          ...(scenario.chat === 'group-mention' ? { senderRef: 's_<16_HEX>' } : {}),
        },
      },
    },
    stage: dispatchStage,
    requestState: dispatchState,
    factIds: ['F-062', 'F-065', 'F-066', 'F-029'],
    certainty: 'verificado',
  });

  if (scenario.fault === 'webhook-timeout') {
    push({
      lane: 'lateral',
      nodeId: 'queue',
      actor: 'Cola',
      codePath: 'src/runtime.ts',
      title: 'El carril se queda esperando',
      body: 'No se reintenta el POST. El hueco espera una completion o la caducidad. Si nadie completa, el barrido de los 10 min suelta el chat. Esta pantalla se queda en el estado ambiguo, que es el resultado del fallo.',
      factIds: ['F-066', 'F-067', 'F-068'],
      certainty: 'verificado',
      terminal: {
        outcome: 'Despacho ambiguo',
        lesson: [
          'Timeout no significa «no pasó nada». El run pudo haber empezado.',
          'No hay reintento automático. La cola no se libera por el timeout en sí.',
        ],
      },
    });
    return finalize(drafts, scenario, true);
  }

  if (scenario.fault === 'webhook-rejected') {
    push({
      lane: 'lateral',
      nodeId: 'queue',
      actor: 'Cola',
      codePath: 'src/runtime.ts',
      title: 'Rechazado, sin reintento',
      body: 'El estado de la petición es failed_dispatch. La hoja no dice que un 429 libere el carril al instante: el gate documentado espera completion o caducidad. Un fallo por el cupo de runs no se reintenta solo.',
      factIds: ['F-066', 'F-067', 'F-070'],
      certainty: 'verificado',
      terminal: {
        outcome: 'Despacho rechazado',
        lesson: [
          'Cualquier status distinto de 200 es webhook_rejected.',
          '429 y timeout no tienen reintento propio.',
        ],
      },
    });
    return finalize(drafts, scenario, true);
  }

  push({
    lane: 'ida',
    nodeId: 'queue',
    actor: 'Cola',
    codePath: 'src/runtime.ts',
    title: 'El hueco espera la vuelta',
    body: 'La promesa gate de este chat no se suelta hasta la completion o hasta que pasen los 10 min. Por eso una rutina colgada bloquea los mensajes siguientes de ese chat.',
    factIds: ['F-067'],
    certainty: 'verificado',
  });

  if (scenario.fault === 'routine-silent') {
    push({
      lane: 'lateral',
      nodeId: 'routine',
      actor: 'Barrido',
      codePath: 'src/runtime.ts',
      title: 'Nadie llama a complete_request',
      body: 'A los 10 min el barrido, cada 15 s y contra el reloj de pared, marca la petición expired y suelta la cola. Los mensajes de ese chat esperaron ese tiempo. No hay una latencia intermedia que mostrar.',
      requestState: 'expired',
      phoneEffect: note('Caducó. El chat no recibió respuesta.'),
      factIds: ['F-067', 'F-068', 'F-069'],
      certainty: 'verificado',
    });
    push({
      lane: 'lateral',
      nodeId: 'validate',
      actor: 'Puente',
      codePath: 'src/runtime.ts (complete)',
      title: 'Si la completion llegara tarde',
      body: 'Un complete_request después de expiresAt responde 410 expired. No se envía nada. Una petición caducada no se reabre.',
      ...errorPayload(410, 'expired', 'pasaron los 10 minutos'),
      factIds: ['F-101', 'F-102'],
      certainty: 'verificado',
      terminal: {
        outcome: 'Caducada',
        lesson: [
          'El silencio de la rutina bloquea el chat hasta el TTL.',
          'Una completion tarde no se convierte en un envío.',
        ],
      },
    });
    return finalize(drafts, scenario, true);
  }

  push({
    lane: 'ida',
    nodeId: 'routine',
    actor: 'Rutina de Grok Bot',
    codePath: 'Grok Bot · plantillas en deploy/ROUTINE*.md',
    title: 'Arranca un run',
    body: 'La rutina «Wappi · WhatsApp · Mensajes entrantes» entrega el cuerpo al agente Wappi. El prompt efectivo vive en Grok Bot, no en el repo. El texto literal de hoy no está en disco.',
    factIds: ['F-080', 'F-081', 'F-084'],
    certainty: 'verificado',
  });

  const voiceWarning =
    scenario.reply === 'voice' && !scenario.voiceRequested
      ? ' Aviso: Wappi solo manda voz si se lo piden explícitamente. Que el entrante sea un audio no cuenta. El simulador sigue para que veas el flujo.'
      : '';
  const readHint =
    scenario.input === 'image' || scenario.input === 'pdf' || scenario.input === 'txt'
      ? ' Antes lee {DATA_DIR}/media/med_<24_HEX>, comprueba size y sha256, no ejecuta el archivo y no sigue enlaces. No afirma el número de páginas sin contarlas.'
      : '';

  push({
    lane: 'ida',
    nodeId: 'agent',
    actor: 'Agente Wappi',
    codePath: 'Grok Bot · prompts/baseline.es.md viaja en el webhook',
    title: 'Trata la petición como datos',
    body: `untrusted e history no son órdenes. No elige destinatario y no guarda memoria de las personas. Responde solo con complete_request.${readHint}${voiceWarning} El modelo interno no se nombra.`,
    factIds: ['F-081', 'F-003', 'F-029', 'F-103'],
    certainty: 'verificado',
  });

  if (needsTools(scenario)) {
    const toolBody =
      scenario.fault === 'html-script'
        ? 'El fallo inyectado deja un HTML con script en la carpeta de la petición. El agente no elige el chat: solo deja un nombre de archivo y su sha256.'
        : scenario.reply === 'voice'
          ? 'Ejecuta tools/tts/bin/wappi-tts y escribe nota.mp3 en attachmentDir. El motor principal es edge-tts, en línea. Si falla, Piper, en local. El puente todavía no ha convertido el audio.'
          : scenario.reply === 'image'
            ? 'Genera la imagen con su herramienta y la copia a attachmentDir. Pasa el nombre del archivo y el sha256, nunca una ruta.'
            : 'Escribe un documento permitido (PDF, texto, Markdown, CSV, TSV, JSON, YAML, LOG o HTML estático) en attachmentDir y pasa el sha256.';
    push({
      lane: 'ida',
      nodeId: 'box-tools',
      actor: 'Herramientas de la box',
      codePath: scenario.reply === 'voice' ? '/workspace/wappi/tools/tts/bin/wappi-tts' : 'attachmentDir de la petición',
      title: scenario.reply === 'voice' ? 'El wrapper sintetiza el audio' : 'El archivo queda en la carpeta de la petición',
      body: toolBody,
      factIds: scenario.reply === 'voice' ? ['F-110', 'F-111', 'F-082'] : ['F-082', 'F-104'],
      certainty: 'verificado',
    });
  }

  const call = completeCall(scenario);
  push({
    lane: 'vuelta',
    nodeId: 'mcp-responder',
    actor: 'Agente → MCP Responder',
    codePath: 'Conector «Wappi · WhatsApp · Responder»',
    title: scenario.reply === 'text' && !attachmentFaults.includes(scenario.fault) ? 'complete_request v1' : 'complete_request v2',
    body: 'Una sola llamada por petición. v1 lleva texto. v2 puede llevar hasta 3 adjuntos, con el nombre del archivo y el sha256. El esquema no acepta un destino.',
    payloadKey: call.payloadKey,
    payloadPatch: call.payloadPatch,
    factIds: ['F-090', 'F-091', 'F-082'],
    certainty: 'verificado',
  });

  push({
    lane: 'vuelta',
    nodeId: 'mcp-responder',
    actor: 'MCP Responder',
    codePath: 'src/return/mcp.ts → dist/return-mcp.js',
    title: 'stdio y luego loopback',
    body: 'Valida que la URL sea loopback y termine en /v1/complete. Un argumento del modelo no puede cambiarla. Hace POST con su propio bearer, distinto del de la rutina.',
    payloadKey: 'returnHttp_toBridge',
    factIds: ['F-092', 'F-095', 'F-143'],
    certainty: 'verificado',
  });

  if (schemaFaults.includes(scenario.fault)) {
    const schemaBody =
      scenario.fault === 'extra-to'
        ? 'El campo to no está en el esquema. additionalProperties es false, así que la respuesta es 400 destination_forbidden. No se envía nada. El destino nunca iba a salir de ese campo.'
        : scenario.fault === 'sha-mismatch'
          ? 'El archivo no coincide con el sha256, o no está dentro de la carpeta de la petición (también caen el enlace simbólico y el enlace duro). Rechazo, sin envío.'
          : 'El HTML trae un script. El puente lo rechaza y no envía nada. La especificación llama a ese rechazo media_unsafe; la hoja describe las etiquetas prohibidas y la CSP, sin ese identificador.';
    push({
      lane: 'vuelta',
      nodeId: 'validate',
      actor: 'Puente',
      codePath: scenario.fault === 'extra-to' ? 'src/return/mcp.ts · src/runtime.ts' : 'src/media/outbound-content.ts',
      title: scenario.fault === 'extra-to' ? 'Campo de destino prohibido' : scenario.fault === 'sha-mismatch' ? 'El archivo no cuadra' : 'HTML rechazado',
      body: schemaBody,
      ...(scenario.fault === 'extra-to' ? errorPayload(400, 'destination_forbidden', 'se envió un campo extra') : {}),
      phoneEffect: note('Nada sale al chat.'),
      factIds: scenario.fault === 'extra-to' ? ['F-091', 'F-103'] : ['F-104'],
      certainty: 'verificado',
      terminal: {
        outcome: 'Rechazada',
        lesson:
          scenario.fault === 'extra-to'
            ? ['El cerebro no elige el chat.', 'Un campo extra no se ignora en silencio: es un error y no hay envío.']
            : ['La preparación del adjunto es anterior al envío.', 'Si el archivo no es seguro, no sale ni el texto de esa llamada.'],
      },
    });
    return finalize(drafts, scenario, true);
  }

  push({
    lane: 'vuelta',
    nodeId: 'validate',
    actor: 'Puente',
    codePath: 'src/runtime.ts (complete)',
    title: 'Entra en complete',
    body: 'Pasan el bearer, el esquema, que la petición exista y la preparación de adjuntos. Se escribe la etapa callback. Luego claimCompletion mira el hash del handle, la caducidad, la idempotencia, que el chat siga permitido, la salida y el cupo de medios.',
    stage: 'callback',
    factIds: ['F-100'],
    certainty: 'verificado',
  });

  if (scenario.fault === 'replay') {
    push({
      lane: 'vuelta',
      nodeId: 'validate',
      actor: 'Puente',
      codePath: 'src/runtime.ts (claimCompletion)',
      title: 'Mismo texto, sin reenvío',
      body: 'La misma completionId y el mismo contenido devuelven el recibo ya guardado. No hay un segundo envío.',
      payloadKey: 'completeResponse_ok_v1',
      phoneEffect: note('Replay. No se vuelve a enviar.'),
      factIds: ['F-102'],
      certainty: 'verificado',
      terminal: {
        outcome: 'Replay',
        lesson: ['Mismo id y mismo contenido no reenvían.', 'Otro contenido sería 409 conflict.'],
      },
    });
    return finalize(drafts, scenario, true);
  }

  if (claimFaults.includes(scenario.fault)) {
    const claim =
      scenario.fault === 'bad-handle'
        ? {
            title: 'El handle no coincide',
            body: '401 handle. El replyHandle no corresponde al hash guardado. No se envía nada.',
            error: errorPayload(401, 'handle', 'replyHandle no coincide con el hash guardado'),
            facts: ['F-101', 'F-061'],
          }
        : scenario.fault === 'completion-conflict'
          ? {
              title: 'Misma completion, otro texto',
              body: '409 conflict. Si el contenido fuera idéntico, la respuesta sería replay: el recibo ya guardado, sin reenviar. Una petición completada no se reabre.',
              error: errorPayload(409, 'conflict', 'mismo completionId con otro contenido'),
              facts: ['F-102'],
            }
          : {
              title: 'Cupo de medios',
              body: '429 media_rate. El tope documentado es 30 medios salientes por hora. No se envía este adjunto.',
              error: errorPayload(429, 'media_rate', 'más de 30 medios salientes por hora'),
              facts: ['F-100', 'F-101'],
            };
    push({
      lane: 'vuelta',
      nodeId: 'validate',
      actor: 'Puente',
      codePath: 'src/runtime.ts (claimCompletion)',
      title: claim.title,
      body: claim.body,
      ...claim.error,
      phoneEffect: note('Nada nuevo sale al chat.'),
      factIds: claim.facts,
      certainty: 'verificado',
      terminal: {
        outcome: 'Rechazada',
        lesson: [claim.body, 'La etapa callback ya quedó escrita. transport_accepted no.'],
      },
    });
    return finalize(drafts, scenario, true);
  }

  if (scenario.fault === 'delivery-unknown') {
    push({
      lane: 'vuelta',
      nodeId: 'send',
      actor: 'Envío',
      codePath: 'src/transport/baileys-transport.ts',
      title: 'El envío no deja un id',
      body: 'Sin id de transporte, o si el proceso muere en sending, el outbox queda unknown y el outcome es delivery_unknown. No hay reintento automático. No se anota transport_accepted.',
      outboxState: 'unknown',
      phoneEffect: note('Resultado desconocido. No hay palomitas de entrega.'),
      factIds: ['F-107', 'F-106'],
      certainty: 'verificado',
      terminal: {
        outcome: 'Resultado desconocido',
        lesson: [
          'Unknown no se promueve solo a entregado.',
          'No es exactly-once: tampoco se reintenta solo.',
        ],
      },
    });
    return finalize(drafts, scenario, true);
  }

  const sendBody =
    scenario.reply === 'text'
      ? 'sendMessage va al chat guardado en el ledger y cita el mensaje original. WhatsApp devuelve un id.'
      : scenario.reply === 'voice'
        ? 'El puente transcodifica el MP3 a OGG/Opus mono, 48 kHz, 32 kbps, con duración y forma de onda, máximo 180 s, y lo manda al chat del ledger citando el mensaje.'
        : scenario.reply === 'image'
          ? 'La imagen se re-codifica a JPEG. Si el texto cabe en 1024 caracteres y es el único adjunto, puede ir de pie. El destino sale del ledger.'
          : scenario.reply === 'text-attachment'
            ? 'Primero el texto, que es la única parte que cita, y después el adjunto. Si una parte fallara, las siguientes quedarían skipped y el outcome podría ser partial. En este camino las dos pasan.'
            : 'El documento sale al chat del ledger. Solo la primera parte cita el mensaje original.';

  push({
    lane: 'vuelta',
    nodeId: 'send',
    actor: 'Baileys',
    codePath: 'src/transport/baileys-transport.ts · src/runtime.ts (transmitParts)',
    title: 'WhatsApp acepta el envío',
    body: sendBody,
    stage: 'transport_accepted',
    requestState: 'completed',
    outboxState: 'accepted',
    ...receiptPayload(scenario),
    phoneEffect: [...replyBubbles(scenario), { type: 'ticks', level: 'accepted' }],
    factIds: ['F-103', 'F-105', 'F-106'],
    certainty: 'verificado',
  });

  push({
    lane: 'vuelta',
    nodeId: 'send',
    actor: 'Runtime',
    codePath: 'src/runtime.ts',
    title: 'Se cierra el ciclo del chat',
    body: 'Se guarda el turno del asistente. Un adjunto queda descrito, por ejemplo como [imagen: …] o [nota de voz: …]. Se borra outgoing/<requestId>/ y se suelta la cola. El recibo vuelve al MCP y de ahí al agente.',
    ...receiptPayload(scenario),
    factIds: ['F-108'],
    certainty: 'verificado',
  });

  if (scenario.fault === 'phone-off') {
    push({
      lane: 'vuelta',
      nodeId: 'receipts',
      actor: 'Recibos',
      codePath: 'src/receipts.ts',
      title: 'No llega DELIVERY_ACK',
      body: 'Hay transport_accepted, que es el SERVER_ACK: una palomita. No hay delivered ni read. Aceptado por WhatsApp no es entregado al teléfono.',
      phoneEffect: note('Una palomita. El teléfono de destino no confirmó la entrega.'),
      factIds: ['F-107', 'F-026'],
      certainty: 'verificado',
      terminal: {
        outcome: 'Aceptado, no entregado',
        lesson: [
          'transport_accepted, delivered y read son tres evidencias.',
          'El simulador no inventa la entrega si WhatsApp no la confirmó.',
        ],
      },
    });
    return finalize(drafts, scenario, true);
  }

  push({
    lane: 'vuelta',
    nodeId: 'receipts',
    actor: 'Recibos',
    codePath: 'src/receipts.ts',
    title: 'DELIVERY_ACK',
    body: 'messages.update trae DELIVERY_ACK y la evidencia sube a delivered. No baja de rango si luego llega algo menor.',
    payloadKey: 'receiptUpdate_fromWhatsApp',
    stage: 'delivered',
    outboxState: 'delivered',
    phoneEffect: { type: 'ticks', level: 'delivered' },
    factIds: ['F-026', 'F-107'],
    certainty: 'verificado',
  });

  push({
    lane: 'vuelta',
    nodeId: 'receipts',
    actor: 'Teléfono',
    codePath: 'src/receipts.ts',
    title: 'Leído',
    body: 'READ o PLAYED suben la evidencia a read. En el teléfono son dos palomitas azules, con la palabra «leído» para no depender del color. La respuesta cita tu mensaje.',
    stage: 'read',
    outboxState: 'read',
    phoneEffect: { type: 'ticks', level: 'read' },
    factIds: ['F-026', 'F-107'],
    certainty: 'verificado',
    terminal: {
      outcome: 'Respondido',
      lesson: [
        'La vuelta no va en el 200 del webhook: va por MCP y luego por Baileys.',
        'Entregado y leído solo aparecen cuando WhatsApp los confirma.',
        scenario.reply === 'voice'
          ? 'La voz la sintetizó la box. El puente solo comprobó el hash y la convirtió a OGG/Opus.'
          : 'El destino salió del ledger, no de un argumento del agente.',
      ],
    },
  });

  return finalize(drafts, scenario, scenario.fault === 'queue-busy');
}

export function buildProactiveJourney(scenario: ProactiveScenario): Step[] {
  const drafts: Draft[] = [
    {
      lane: 'lateral',
      nodeId: 'agent',
      actor: 'Juanjo, en el chat de Grok Bot',
      codePath: 'Fuera del puente. No es la rutina entrante.',
      title: 'Pide un mensaje proactivo',
      body: 'No hay un cron. Enviar solo se usa cuando Juanjo lo pide. La rutina de mensajes entrantes tiene prohibido usar este conector.',
      factIds: ['F-096', 'F-120', 'F-084'],
      certainty: 'verificado',
    },
    {
      lane: 'lateral',
      nodeId: 'mcp-enviar',
      actor: 'Agente → MCP Enviar',
      codePath: 'src/proactive/schema.ts',
      title: 'send_message con alias',
      body: 'destination es owner o grupo-prueba. Nunca un número. idempotencyKey identifica este envío.',
      payloadKey: 'mcp_sendMessage_proactive',
      factIds: ['F-093'],
      certainty: 'verificado',
    },
    {
      lane: 'lateral',
      nodeId: 'mcp-enviar',
      actor: 'MCP Enviar',
      codePath: 'dist/proactive-mcp.js',
      title: 'stdio y POST de loopback',
      body: 'El proceso habla JSON-RPC por stdio y llama a 127.0.0.1 con su bearer. proactive además exige origen loopback.',
      factIds: ['F-090', 'F-143', 'F-095'],
      certainty: 'verificado',
    },
  ];

  const rejection = proactiveRejection(scenario);
  if (rejection) {
    drafts.push({
      lane: 'lateral',
      nodeId: 'mcp-enviar',
      actor: 'Guardas',
      codePath: 'src/proactive/handle.ts',
      title: rejection.title,
      body: `${rejection.body} El simulador mira las guardas en un orden didáctico. La hoja lista los códigos y no publica el orden de los if.`,
      example: { error: rejection.code },
      phoneEffect: note('No se envía nada. No hay reintento automático.'),
      factIds: rejection.factIds,
      certainty: 'verificado',
      terminal: {
        outcome: 'Rechazado',
        lesson: [rejection.body, 'La respuesta a un mensaje entrante no usa estas guardas.'],
      },
    });
    return pack(drafts);
  }

  drafts.push(
    {
      lane: 'lateral',
      nodeId: 'mcp-enviar',
      actor: 'Guardas',
      codePath: 'src/proactive/handle.ts · src/proactive/budget.ts',
      title: 'Las guardas dejan pasar',
      body: 'Está habilitado, el bearer cuadra, no es horario de silencio, cabe en 10 al día, pasaron 120 s, no hay una respuesta entrante en vuelo, el socket está abierto y el breaker está cerrado. El preflight de dispositivos cabe en unos 15 s, dentro de un presupuesto de unos 45 s.',
      factIds: ['F-120', 'F-122', 'F-124'],
      certainty: 'verificado',
    },
    {
      lane: 'lateral',
      nodeId: 'send',
      actor: 'Destino',
      codePath: 'src/proactive/destination.ts',
      title: 'El alias apunta a un chat que ya existe',
      body: 'owner es el último chat directo del dueño. grupo-prueba es la fila con ese role. Si no hubiera chat previo, sería no_existing_chat y no se abriría uno nuevo.',
      factIds: ['F-121'],
      certainty: 'verificado',
    },
    {
      lane: 'vuelta',
      nodeId: 'send',
      actor: 'Baileys',
      codePath: 'src/transport/baileys-transport.ts',
      title: 'Sale el mensaje proactivo',
      body: 'No cita un entrante, porque no hay uno. El cupo del día cuenta este envío. La reactiva seguiría funcionando aunque el breaker se abriera después.',
      phoneEffect: { type: 'bubble', bubble: { kind: 'text', from: 'wappi', text: 'Recordatorio que pediste.' } },
      factIds: ['F-120', 'F-123'],
      certainty: 'verificado',
      terminal: {
        outcome: 'Enviado',
        lesson: [
          'Proactivo es opt-in de Juanjo, con cupo y horario.',
          'El alias no es un número y no crea chats.',
        ],
      },
    },
  );
  return pack(drafts);
}

function proactiveRejection(scenario: ProactiveScenario): { title: string; body: string; code: string; factIds: string[] } | null {
  if (scenario.fault === 'disabled') {
    return { title: 'Proactivo apagado', body: 'El rechazo es proactive_disabled.', code: 'proactive_disabled', factIds: ['F-122', 'F-142'] };
  }
  if (scenario.hour === 'quiet') {
    return {
      title: 'Hora de silencio',
      body: 'Entre las 22:00 y las 07:00, hora de Bogotá, el rechazo es quiet_hours.',
      code: 'quiet_hours',
      factIds: ['F-120', 'F-122'],
    };
  }
  if (scenario.fault === 'daily-cap') {
    return { title: 'Cupo del día', body: 'El tope es 10 envíos al día. El rechazo es daily_cap.', code: 'daily_cap', factIds: ['F-120', 'F-122'] };
  }
  if (scenario.fault === 'too-soon') {
    return { title: 'Demasiado pronto', body: 'La separación mínima es 120 s. El rechazo es too_soon.', code: 'too_soon', factIds: ['F-120', 'F-122'] };
  }
  if (scenario.reactiveBusy) {
    return {
      title: 'Hay una respuesta entrante en vuelo',
      body: '409 reactive_busy. El proactivo espera; no se mete en medio de un entrante.',
      code: 'reactive_busy',
      factIds: ['F-122'],
    };
  }
  if (scenario.fault === 'no-chat') {
    return {
      title: 'No hay chat previo',
      body: 'no_existing_chat. No se abre una conversación nueva.',
      code: 'no_existing_chat',
      factIds: ['F-121', 'F-122'],
    };
  }
  if (scenario.fault === 'socket') {
    return {
      title: 'El socket no está abierto',
      body: 'socket_not_open o transport_not_ready. El 503 de transporte no gasta cupo.',
      code: 'socket_not_open',
      factIds: ['F-122'],
    };
  }
  if (scenario.fault === 'breaker') {
    return {
      title: 'Breaker abierto',
      body: 'breaker_open. Solo se cierra con proactive-reset y el OK de Juanjo. La respuesta reactiva no depende de este interruptor.',
      code: 'breaker_open',
      factIds: ['F-123', 'F-122'],
    };
  }
  return null;
}

export function buildAdminJourney(scenario: AdminScenario): Step[] {
  const drafts: Draft[] = [
    {
      lane: 'lateral',
      nodeId: 'mcp-admin',
      actor: 'MCP Admin',
      codePath: 'src/admin/mcp.ts',
      title: 'list_chats',
      body: 'Devuelve handles opacos, alias y modo. Nunca el teléfono ni el JID. El ejemplo sanitizado trae 2 activos y un tope de 5. Si el escenario es el cupo lleno, la negativa va en el paso siguiente: no se reescribe el ejemplo como si hoy hubiera 5.',
      payloadKey: 'mcp_admin_listChats_response_shape',
      factIds: ['F-094', 'F-046'],
      certainty: 'verificado',
    },
  ];

  if (scenario.situation === 'pause') {
    drafts.push({
      lane: 'lateral',
      nodeId: 'mcp-admin',
      actor: 'MCP Admin',
      codePath: 'src/admin/mcp.ts',
      title: 'pause_all',
      body: 'Vacía las listas efectivas. El nombre de la herramienta es pause_all. Nada se admite hasta resume_all, y resume_all exige confirm.',
      example: { tool: 'pause_all' },
      factIds: ['F-047', 'F-094'],
      certainty: 'verificado',
      terminal: {
        outcome: 'Pausado',
        lesson: ['No se llama pause/resume en el código.', 'La pausa produce silencio, no un aviso en los chats.'],
      },
    });
    return pack(drafts);
  }

  if (scenario.situation === 'deny') {
    drafts.push({
      lane: 'lateral',
      nodeId: 'mcp-admin',
      actor: 'MCP Admin',
      codePath: 'src/admin/mcp.ts',
      title: 'deny_chat',
      body: 'Apaga un chat. Apagar el privado del dueño exige confirm. La respuesta sigue sin números ni JID.',
      example: { tool: 'deny_chat', handle: '<CHAT_HANDLE>', confirm: true },
      factIds: ['F-094'],
      certainty: 'verificado',
      terminal: {
        outcome: 'Chat apagado',
        lesson: ['deny_chat siempre puede apagar.', 'El privado del dueño pide confirm.'],
      },
    });
    return pack(drafts);
  }

  if (scenario.situation === 'cap' || scenario.situation === 'inflight') {
    drafts.push({
      lane: 'lateral',
      nodeId: 'mcp-admin',
      actor: 'MCP Admin',
      codePath: 'src/admin/mcp.ts',
      title: 'allow_chat se niega',
      body:
        scenario.situation === 'cap'
          ? 'Aunque llegue confirm true, por encima de 5 activos no se activa otro chat.'
          : 'Hay un entrante en proceso. allow_chat se niega hasta que ese carril se suelte.',
      example: { tool: 'allow_chat', confirm: true, refused: true },
      factIds: ['F-094'],
      certainty: 'verificado',
      terminal: {
        outcome: 'Negado',
        lesson: [
          scenario.situation === 'cap' ? 'El tope de activos es 5.' : 'Un entrante en vuelo bloquea el cambio de lista.',
          'La negativa no devuelve números ni JID.',
        ],
      },
    });
    return pack(drafts);
  }

  drafts.push(
    {
      lane: 'lateral',
      nodeId: 'mcp-admin',
      actor: 'MCP Admin',
      codePath: 'src/admin/mcp.ts',
      title: 'allow_chat con confirm',
      body: 'confirm tiene que ser true. Un grupo queda en modo mención o cita. No se puede usar este camino para darle al agente un JID.',
      example: { tool: 'allow_chat', handle: '<CHAT_HANDLE>', confirm: true, mode: 'mention-or-quote' },
      factIds: ['F-094', 'F-043'],
      certainty: 'verificado',
    },
    {
      lane: 'lateral',
      nodeId: 'mcp-admin',
      actor: 'MCP Admin',
      codePath: 'src/admin/mcp.ts',
      title: 'chat_status',
      body: 'El cambio queda en chat_policy_audit. La respuesta sigue usando el handle opaco.',
      factIds: ['F-046', 'F-094'],
      certainty: 'verificado',
      terminal: {
        outcome: 'Lista actualizada',
        lesson: ['Activar un grupo no lo pone en modo all.', 'Hace falta confirm, y el tope sigue siendo 5.'],
      },
    },
  );
  return pack(drafts);
}

export function stagesOf(steps: Step[]): string[] {
  return steps.flatMap((step) => (step.stage ? [step.stage] : []));
}
