import type { PhoneBubble, PhoneEffect, Step } from '../content/types';
import { findPath, frameOf } from './diagram';
import type { ExplorerStep, InspectorLayer, PacketKind, SceneEvent, Tone } from './types';
import { clipWords, wordCount } from './words';

const titles: Record<string, string> = {
  'Alguien envía un mensaje': 'Llega el texto',
  'El mensaje cifrado se reparte': 'Viaja cifrado',
  'El puente es otro WhatsApp Web': 'Dispositivo vinculado',
  'El socket descifra y emite notify': 'Baileys descifra',
  'Video o sticker: se ignora': 'Se ignora',
  'Se queda el mensaje de una persona': 'Mensaje de persona',
  'Se reserva la clave única': 'Clave única',
  'El duplicado no crea otra petición': 'Duplicado bloqueado',
  'Pausa global: no se admite nada': 'Pausa global',
  'Grupo sin disparador': 'Sin disparador',
  'Chat fuera de la lista': 'Fuera de lista',
  'Es un comando local': 'Comando local',
  'El puente responde solo': 'Responde el puente',
  'Es el dueño: al cerebro': 'Pasa el dueño',
  'El grupo sí dispara': 'El grupo dispara',
  'Se guarda el archivo una hora': 'Archivo una hora',
  'Dura más de 60 s': 'Pasa de 60 s',
  'La transcripción falla': 'Falla el STT',
  'whisper.cpp escribe el texto': 'Transcribe local',
  'El entrante queda cifrado': 'Queda cifrado',
  'Entra en el carril de este chat': 'Entra en cola',
  'Hay una petición anterior en este chat': 'La cola espera',
  'Nace la petición': 'Nace la petición',
  'El POST no contesta a tiempo': 'Webhook timeout',
  'El POST vuelve con otro status': 'Webhook rechazado',
  'POST a la rutina': 'Webhook 200',
  'El carril se queda esperando': 'Cola en espera',
  'Rechazado, sin reintento': 'Sin reintento',
  'El hueco espera la vuelta': 'Espera la vuelta',
  'Nadie llama a complete_request': 'Caduca en 10 min',
  'Si la completion llegara tarde': 'Tarde es 410',
  'Arranca un run': 'Arranca la rutina',
  'Trata la petición como datos': 'Datos, no órdenes',
  'El wrapper sintetiza el audio': 'TTS en la box',
  'El archivo queda en la carpeta de la petición': 'Archivo de salida',
  'complete_request v1': 'complete_request v1',
  'complete_request v2': 'complete_request v2',
  'stdio y luego loopback': 'Vuelve por loopback',
  'Campo de destino prohibido': 'Destino prohibido',
  'El archivo no cuadra': 'sha256 distinto',
  'HTML rechazado': 'HTML rechazado',
  'Entra en complete': 'Entra en aduana',
  'Mismo texto, sin reenvío': 'Replay sin envío',
  'El handle no coincide': 'Handle incorrecto',
  'Misma completion, otro texto': 'Conflicto 409',
  'Cupo de medios': 'Cupo de medios',
  'El envío no deja un id': 'Resultado unknown',
  'WhatsApp acepta el envío': 'Acepta el envío',
  'Se cierra el ciclo del chat': 'Suelta la cola',
  'No llega DELIVERY_ACK': 'Solo un tick',
  DELIVERY_ACK: 'Entregado',
  Leído: 'Leído',
  'Pide un mensaje proactivo': 'Pide un envío',
  'send_message con alias': 'Alias, no número',
  'stdio y POST de loopback': 'POST loopback',
  'Proactivo apagado': 'Proactivo apagado',
  'Hora de silencio': 'Hora de silencio',
  'Cupo del día': 'Cupo del día',
  'Demasiado pronto': 'Demasiado pronto',
  'Hay una respuesta entrante en vuelo': 'Entrante en vuelo',
  'No hay chat previo': 'Sin chat previo',
  'El socket no está abierto': 'Socket cerrado',
  'Breaker abierto': 'Breaker abierto',
  'Las guardas dejan pasar': 'Guardas abiertas',
  'El alias apunta a un chat que ya existe': 'Chat que existe',
  'Sale el mensaje proactivo': 'Sale el aviso',
  list_chats: 'Lista de chats',
  pause_all: 'Pausa total',
  deny_chat: 'Apaga el chat',
  'allow_chat se niega': 'No cabe',
  'allow_chat con confirm': 'Activa el chat',
  chat_status: 'Estado del chat',
};

const notes: Record<string, { text: string; tone: Tone }> = {
  'El mensaje cifrado se reparte': { text: 'CIFRADO DE EXTREMO', tone: 'info' },
  'POST a la rutina': { text: '200 ES ARRANQUE', tone: 'warn' },
  'El POST no contesta a tiempo': { text: 'PUDO HABER ARRANCADO', tone: 'warn' },
  'El POST vuelve con otro status': { text: 'SIN REINTENTO', tone: 'error' },
  'Chat fuera de la lista': { text: 'SILENCIO', tone: 'error' },
  'Grupo sin disparador': { text: 'SILENCIO', tone: 'error' },
  'Pausa global: no se admite nada': { text: 'PAUSA TOTAL', tone: 'error' },
  'El duplicado no crea otra petición': { text: 'SEGUNDA VEZ NO', tone: 'warn' },
  'Dura más de 60 s': { text: 'SE IGNORA', tone: 'error' },
  'La transcripción falla': { text: 'SIN WEBHOOK', tone: 'error' },
  'whisper.cpp escribe el texto': { text: 'STT ES LOCAL', tone: 'info' },
  'El wrapper sintetiza el audio': { text: 'TTS NO ES LOCAL', tone: 'warn' },
  'Campo de destino prohibido': { text: 'NO ELIGE DESTINO', tone: 'error' },
  'No llega DELIVERY_ACK': { text: 'ACEPTADO NO ES ENTREGA', tone: 'warn' },
  DELIVERY_ACK: { text: 'ENTREGADO', tone: 'ok' },
  Leído: { text: 'LEÍDO', tone: 'ok' },
  'Es un comando local': { text: 'SIN CEREBRO', tone: 'info' },
  'Mismo texto, sin reenvío': { text: 'REPLAY', tone: 'ok' },
  'Misma completion, otro texto': { text: 'CONFLICTO', tone: 'error' },
  'HTML rechazado': { text: 'HTML RECHAZADO', tone: 'error' },
  pause_all: { text: 'PAUSE_ALL', tone: 'warn' },
};

export const kindColor: Record<PacketKind, string> = {
  text: '#2f6db5',
  voice: '#d98a00',
  image: '#c2418c',
  document: '#0f8f9c',
  encrypted: '#5b6b7a',
  ticket: '#2f6db5',
  https: '#7a5bd3',
  mcp: '#5b6b7a',
  'http-local': '#2f6db5',
  receipt: '#17a067',
  control: '#5b6b7a',
};

const dangling = new Set(['ni', 'y', 'o', 'u', 'de', 'con', 'en', 'por', 'a', 'al', 'del', 'que', 'no', 'el', 'la', 'los', 'las', 'un', 'una', 'su', 'sus']);

function tidy(words: string[], max: number): string {
  const cut = words.slice(0, max);
  while (cut.length > 3 && dangling.has(cut[cut.length - 1].toLowerCase())) cut.pop();
  return cut.join(' ');
}

function caption(text: string): string {
  const clean = text.replace(/[«»“”]/g, '').replace(/\s+/g, ' ').trim();
  const sentence = (clean.split(/[.!?]/)[0] ?? clean).trim();
  const words = sentence.split(/\s+/).filter(Boolean);
  if (words.length <= 8 && !dangling.has(words[words.length - 1]?.toLowerCase() ?? '')) return sentence;
  return tidy(words, 8);
}

function completeSentences(text: string, max: number): string {
  const clean = text.replace(/[«»“”]/g, '').replace(/\s+/g, ' ').trim();
  const parts = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
  const kept: string[] = [];
  for (const part of parts) {
    const next = [...kept, part].join(' ');
    if (wordCount(next) > max) break;
    kept.push(part);
  }
  return kept.length ? kept.join(' ') : tidy(clean.split(/\s+/).filter(Boolean), max);
}

function kindFor(step: Step): PacketKind {
  if (step.nodeId === 'receipts') return 'receipt';
  if (step.nodeId === 'dispatcher') return 'https';
  if (step.nodeId.startsWith('mcp')) return 'mcp';
  if (step.nodeId === 'validate') return 'http-local';
  if (step.nodeId === 'queue' || step.nodeId === 'sqlite') return 'ticket';
  if (step.nodeId === 'e2e' || step.nodeId === 'wa-servers') return 'encrypted';
  if (step.title.toLowerCase().includes('voz') || step.title.toLowerCase().includes('audio') || step.title.toLowerCase().includes('tts')) return 'voice';
  if (step.title.toLowerCase().includes('imagen')) return 'image';
  if (step.title.toLowerCase().includes('html') || step.title.toLowerCase().includes('archivo') || step.title.toLowerCase().includes('documento')) return 'document';
  return 'text';
}

function labelFor(kind: PacketKind, step: Step): string {
  if (step.stage === 'webhook_accepted') return '200 OK';
  if (step.stage === 'webhook_ambiguous') return 'TIMEOUT';
  if (step.stage === 'webhook_rejected') return 'RECHAZADO';
  const map: Record<PacketKind, string> = {
    text: 'TEXTO',
    voice: 'NOTA DE VOZ',
    image: 'IMAGEN',
    document: 'DOCUMENTO',
    encrypted: 'CIFRADO',
    ticket: 'PETICIÓN',
    https: 'WEBHOOK',
    mcp: 'MCP',
    'http-local': 'LOOPBACK',
    receipt: 'RECIBO',
    control: 'CONTROL',
  };
  return map[kind];
}

function outcomeFor(step: Step): 'arrives' | 'dropped' | 'bounced' | 'stuck' {
  const name = step.terminal?.outcome ?? '';
  if (/rechaz|ignor|silencio|duplic|caduc|negad|apagado|replay/i.test(name)) return 'dropped';
  if (/ambiguo|desconocido/i.test(name)) return 'stuck';
  if (/conflict|prohib|handle|html|cupo/i.test(step.title)) return 'bounced';
  return 'arrives';
}

function bubbleText(effect: PhoneEffect | PhoneEffect[] | undefined): string | null {
  const list = !effect ? [] : Array.isArray(effect) ? effect : [effect];
  for (const item of list) {
    if (item.type !== 'bubble') continue;
    const bubble: PhoneBubble = item.bubble;
    if (bubble.kind === 'text') return bubble.text;
    if (bubble.kind === 'note') return bubble.text;
    return bubble.label;
  }
  return null;
}

function layersFor(step: Step): InspectorLayer[] {
  const base: InspectorLayer = {
    name: 'Ejemplo',
    certainty: step.certainty,
    fields: [
      { name: 'nodo', value: step.nodeId, tag: 'EJEMPLO', note: 'Identificador del componente.' },
      ...(step.stage ? [{ name: 'etapa', value: step.stage, tag: 'EJEMPLO' as const, note: 'Nombre de request_stage. Sin tiempos.' }] : []),
      { name: 'requestId', value: 'req_<32_HEX>', tag: 'PLACEHOLDER', note: 'Patrón, no un id real.' },
    ],
  };
  if (step.payloadKey?.includes('webhook')) {
    return [
      {
        name: 'Webhook',
        certainty: 'verificado',
        fields: [
          { name: 'authorization', value: 'Bearer <ROUTINE_BEARER>', tag: 'PLACEHOLDER', note: 'Bearer sobre HTTPS. No es HMAC.' },
          { name: 'timeout', value: '15 s', tag: 'EJEMPLO', note: 'Tope fijo del POST.' },
          { name: 'kind', value: 'wappi.inbound', tag: 'EJEMPLO' },
        ],
      },
    ];
  }
  if (step.nodeId === 'e2e' || step.nodeId === 'wa-servers') {
    return [
      {
        name: 'Mensaje WhatsApp',
        certainty: 'general',
        fields: [{ name: 'cuerpo', value: 'Signal E2E', tag: 'CIFRADO', note: 'Conocimiento general. El puente no ve el claro aquí.' }],
      },
    ];
  }
  return [base];
}

export function toExplorerSteps(steps: Step[], extraNote?: { text: string; tone: Tone }): ExplorerStep[] {
  let prev = steps[0]?.nodeId ?? 'phone';
  return steps.map((step, index) => {
    const kind = kindFor(step);
    const events: SceneEvent[] = [{ type: 'show', nodes: [step.nodeId], frame: frameOf(step.nodeId) }];
    if (index === 0) {
      const typed = bubbleText(step.phoneEffect);
      if (typed) events.push({ type: 'type-message', text: clipWords(typed, 8), kind });
    }
    if (step.nodeId !== prev) {
      const path = findPath(prev, step.nodeId);
      if (!path.length) throw new Error(`Sin cable de ${prev} a ${step.nodeId}`);
      for (const hop of path) {
        events.push({
          type: 'packet',
          from: hop.from,
          to: hop.to,
          edge: hop.id,
          kind,
          color: kindColor[kind],
          label: clipWords(labelFor(kind, step), 3),
          lines: ['req_…'],
          payloadKey: step.payloadKey,
          payloadPatch: step.payloadPatch,
          layers: layersFor(step),
          outcome: outcomeFor(step),
        });
      }
      prev = step.nodeId;
    }
    const dropped = outcomeFor(step) !== 'arrives';
    events.push({ type: 'light', node: step.nodeId, state: dropped ? 'error' : 'active' });
    const note = notes[step.title];
    if (note) events.push({ type: 'note', at: step.nodeId, text: clipWords(note.text, 5), tone: note.tone });
    if (extraNote && index === steps.length - 1) events.push({ type: 'note', at: step.nodeId, text: clipWords(extraNote.text, 5), tone: extraNote.tone });
    const phone = step.phoneEffect;
    if (phone) {
      const list = Array.isArray(phone) ? phone : [phone];
      for (const effect of list) events.push({ type: 'phone', effect });
    }
    if (step.requestState === 'expired') events.push({ type: 'clock', label: '10 min' });
    const title = clipWords(titles[step.title] ?? step.title, 3);
    return {
      id: step.id,
      title,
      desc: caption(step.body),
      detail: completeSentences(step.body, 40),
      facts: [
        ['Etapa', step.stage ?? 'ninguna'],
        ['Estado', step.requestState ?? 'sigue'],
        ['Hecho', step.factIds[0] ?? 'F-001'],
      ],
      events,
      nodeId: step.nodeId,
      code: {
        file: clipWords(step.codePath, 8),
        summary: clipWords(step.body, 25),
        pseudo: ['recibe el evento', 'aplica la regla del módulo', 'sigue o se detiene', 'resumen, no literal'],
      },
      stage: step.stage,
      requestState: step.requestState,
      outboxState: step.outboxState,
      factIds: step.factIds,
      certainty: step.certainty,
      longBody: step.body,
      terminal: step.terminal,
    };
  });
}
