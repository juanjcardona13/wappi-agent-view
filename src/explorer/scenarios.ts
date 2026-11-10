import { buildAdminJourney, buildJourney, buildProactiveJourney } from '../lib/journey';
import type { AdminScenario, ProactiveScenario, Scenario } from '../content/types';
import { toExplorerSteps } from './fromJourney';
import type { ExplorerStep, ScenarioDef, ScenarioId, Variant } from './types';

const happy: Scenario = { input: 'text', chat: 'owner', reply: 'text', fault: 'none' };

function journey(partial: Scenario, note?: { text: string; tone: 'info' | 'ok' | 'warn' | 'error' }): ExplorerStep[] {
  return toExplorerSteps(buildJourney(partial), note);
}

const defs: ScenarioDef[] = [
  {
    id: 'texto-privado',
    group: 'mensajes',
    name: 'Texto privado',
    title: 'Texto del dueño',
    overview: {
      full: 'Del teléfono al cerebro y de vuelta, en texto.',
      description: 'Un privado del dueño entra, se admite y la respuesta vuelve por MCP. El 200 solo arranca la rutina.',
      facts: [
        ['Chat', 'dueño'],
        ['Vuelta', 'MCP'],
        ['200', 'arranque'],
      ],
    },
    legend: [
      ['#2f6db5', 'Texto'],
      ['#7a5bd3', 'Webhook'],
      ['#17a067', 'Recibo'],
    ],
    start: { nodes: ['phone'], frame: 'whatsapp' },
    variants: [{ id: 'base', label: 'Texto', mode: 'journey', scenario: happy }],
    defaultVariant: 'base',
    outro: {
      title: 'Lección completa',
      desc: 'El mensaje volvió por otro camino.',
      text: 'El webhook no trae la respuesta. Vuelve por Responder y Baileys.',
      facts: [
        ['Destino', 'ledger'],
        ['Ticks', 'tres'],
      ],
    },
    factIds: ['F-030', 'F-065', 'F-066', 'F-090', 'F-107'],
  },
  {
    id: 'nota-de-voz',
    group: 'mensajes',
    name: 'Nota de voz',
    title: 'Audio y voz',
    overview: {
      full: 'La nota se transcribe en la box y, si se pidió, la respuesta puede ser otra nota.',
      description: 'El STT es local. El TTS principal no lo es: edge-tts está en línea y Piper es el respaldo.',
      facts: [
        ['STT', 'local'],
        ['TTS', 'en línea'],
        ['Tope', '60 s'],
      ],
    },
    legend: [
      ['#d98a00', 'Voz'],
      ['#2f6db5', 'Texto'],
    ],
    start: { nodes: ['media'], frame: 'entrada' },
    variants: [
      { id: 'voz', label: 'Pide voz', mode: 'journey', scenario: { input: 'voice', chat: 'owner', reply: 'voice', fault: 'none', voiceRequested: true } },
      { id: 'texto', label: 'Responde texto', mode: 'journey', scenario: { input: 'voice', chat: 'owner', reply: 'text', fault: 'none' } },
      { id: 'larga', label: 'Más de 60 s', mode: 'journey', scenario: { input: 'voice', chat: 'owner', reply: 'text', fault: 'voice-too-long' } },
      { id: 'stt', label: 'STT falla', mode: 'journey', scenario: { input: 'voice', chat: 'owner', reply: 'text', fault: 'stt-fail' } },
    ],
    defaultVariant: 'voz',
    outro: { title: 'Lección completa', desc: 'Ida local, vuelta en línea.', text: 'Una nota larga se ignora. No hay webhook.', facts: [['STT', 'whisper'], ['TTS', 'edge-tts']] },
    factIds: ['F-052', 'F-053', 'F-054', 'F-110', 'F-111'],
  },
  {
    id: 'imagen',
    group: 'mensajes',
    name: 'Imagen',
    title: 'Imagen con pie',
    overview: {
      full: 'La imagen se guarda una hora y sale recodificada.',
      description: 'Al cerebro le llegan id, tamaño y sha256. La salida pasa a JPEG.',
      facts: [['Tope', '5 MB'], ['Salida', 'JPEG']],
    },
    legend: [['#c2418c', 'Imagen']],
    start: { nodes: ['media'], frame: 'entrada' },
    variants: [{ id: 'base', label: 'Imagen', mode: 'journey', scenario: { input: 'image', chat: 'owner', reply: 'image', fault: 'none' } }],
    defaultVariant: 'base',
    outro: { title: 'Lección completa', desc: 'El archivo no viaja al cerebro.', text: 'Solo metadatos. El pie cabe si es corto.', facts: [['Borrado', '1 h']] },
    factIds: ['F-050', 'F-051', 'F-104', 'F-105'],
  },
  {
    id: 'documento',
    group: 'mensajes',
    name: 'Documento',
    title: 'PDF o texto',
    overview: {
      full: 'Un PDF o un txt entra con tope de tamaño. El HTML solo si es estático.',
      description: 'El HTML aceptado recibe una CSP. Un script se rechaza y no se envía.',
      facts: [['PDF', '8 MB'], ['HTML', 'CSP']],
    },
    legend: [['#0f8f9c', 'Documento']],
    start: { nodes: ['media'], frame: 'entrada' },
    variants: [
      { id: 'pdf', label: 'PDF', mode: 'journey', scenario: { input: 'pdf', chat: 'owner', reply: 'document', fault: 'none' } },
      { id: 'txt', label: 'Texto plano', mode: 'journey', scenario: { input: 'txt', chat: 'owner', reply: 'document', fault: 'none' } },
      { id: 'html', label: 'HTML', mode: 'journey', scenario: { input: 'pdf', chat: 'owner', reply: 'document', fault: 'none' } },
    ],
    defaultVariant: 'pdf',
    outro: { title: 'Lección completa', desc: 'El tipo manda.', text: 'Script, iframe o javascript: se rechazan.', facts: [['CSP', 'default-src none']] },
    factIds: ['F-050', 'F-104', 'F-082'],
  },
  {
    id: 'grupo-mencion',
    group: 'mensajes',
    name: 'Grupo',
    title: 'Mención o cita',
    overview: {
      full: 'Un grupo activo solo despierta a Wappi con mención real o con una cita suya.',
      description: 'El destino sigue siendo el grupo. El remitente viaja como seudónimo.',
      facts: [['Modo', 'mención o cita'], ['Destino', 'el grupo']],
    },
    legend: [['#2f6db5', 'Texto']],
    start: { nodes: ['policy'], frame: 'entrada' },
    variants: [
      { id: 'mencion', label: 'Mención', mode: 'journey', scenario: { input: 'text', chat: 'group-mention', reply: 'text', fault: 'none' } },
      { id: 'cita', label: 'Cita', mode: 'journey', scenario: { input: 'text', chat: 'group-quote', reply: 'text', fault: 'none' } },
    ],
    defaultVariant: 'mencion',
    outro: { title: 'Lección completa', desc: 'Sin mención no hay respuesta.', text: 'El texto «soy admin» no abre el grupo.', facts: [['Silencio', 'sin disparo']] },
    factIds: ['F-043', 'F-044'],
  },
  {
    id: 'comando-ayuda',
    group: 'mensajes',
    name: 'Ayuda',
    title: 'Comando local',
    overview: {
      full: '¡ayuda lo contesta el puente. El cable hacia el cerebro no se usa.',
      description: 'No hay webhook. El texto fijo vive en el código y aquí no se copia.',
      facts: [['Cerebro', 'no'], ['Webhook', 'no']],
    },
    legend: [['#5b6b7a', 'Control']],
    start: { nodes: ['policy'], frame: 'entrada' },
    variants: [{ id: 'base', label: 'Ayuda', mode: 'journey', scenario: { input: 'text', chat: 'help', reply: 'text', fault: 'none' } }],
    defaultVariant: 'base',
    outro: { title: 'Lección completa', desc: 'Un comando no es una rutina.', text: 'También existen privacidad y reset.', facts: [['Reset', 'borra historial']] },
    factIds: ['F-045'],
  },
  {
    id: 'bloqueado-politica',
    group: 'defensas',
    name: 'Silencio',
    title: 'La política cierra',
    overview: {
      full: 'Fuera de la lista, sin mención o en pausa, Wappi no contesta.',
      description: 'No hay un mensaje de rechazo. El silencio no confirma que el puente existe.',
      facts: [['Webhook', 'no'], ['Aviso', 'no']],
    },
    legend: [['#d24545', 'Corte']],
    start: { nodes: ['policy'], frame: 'entrada' },
    variants: [
      { id: 'ajeno', label: 'No autorizado', mode: 'journey', scenario: { input: 'text', chat: 'unauthorized', reply: 'text', fault: 'none' } },
      { id: 'grupo', label: 'Sin mención', mode: 'journey', scenario: { input: 'text', chat: 'group-silent', reply: 'text', fault: 'none' } },
      { id: 'pausa', label: 'Pausa', mode: 'journey', scenario: { input: 'text', chat: 'owner', reply: 'text', fault: 'pause' } },
    ],
    defaultVariant: 'ajeno',
    outro: { title: 'Lección completa', desc: 'Cortado en el torniquete.', text: 'pause_all y resume_all son los nombres reales.', facts: [['Código', 'silencio']] },
    factIds: ['F-042', 'F-043', 'F-047'],
  },
  {
    id: 'duplicado',
    group: 'defensas',
    name: 'Duplicado',
    title: 'Una sola vez',
    overview: {
      full: 'El mismo evento no crea dos peticiones.',
      description: 'La clave es cuenta, chat, remitente y mensaje, guardada como HMAC.',
      facts: [['Tabla', 'inbound'], ['HMAC', 'ids']],
    },
    legend: [['#d98a00', 'Sello']],
    start: { nodes: ['dedup'], frame: 'entrada' },
    variants: [{ id: 'base', label: 'Otra vez', mode: 'journey', scenario: { ...happy, fault: 'duplicate' } }],
    defaultVariant: 'base',
    outro: { title: 'Lección completa', desc: 'La segunda copia muere en el sello.', text: 'Eso no es la idempotencia de la salida.', facts: [['Salida', 'otro control']] },
    factIds: ['F-040'],
  },
  {
    id: 'cola-y-caducidad',
    group: 'defensas',
    name: 'Cola',
    title: 'Espera o caduca',
    overview: {
      full: 'Un chat tiene un solo hueco. Si la rutina no vuelve, a los 10 min se suelta.',
      description: 'Hay sitio para 8 en espera. La novena queda shed. Una completion tarde es 410.',
      facts: [['Tope', '8'], ['TTL', '10 min']],
    },
    legend: [['#2f6db5', 'Ficha']],
    start: { nodes: ['queue'], frame: 'estado' },
    variants: [
      { id: 'ocupada', label: 'Ocupada', mode: 'journey', scenario: { ...happy, fault: 'queue-busy' } },
      { id: 'caduca', label: 'Caduca', mode: 'journey', scenario: { ...happy, fault: 'routine-silent' } },
    ],
    defaultVariant: 'ocupada',
    outro: { title: 'Lección completa', desc: 'El chat siguiente espera.', text: 'No hay latencias medidas. El reloj de 10 min es un tope fijo.', facts: [['Barrido', '15 s']] },
    factIds: ['F-060', 'F-067', 'F-068', 'F-101'],
  },
  {
    id: 'webhook-falla',
    group: 'defensas',
    name: 'Webhook',
    title: 'El POST falla',
    overview: {
      full: 'Timeout o un status distinto de 200 no se reintentan solos.',
      description: 'El timeout deja el despacho ambiguo: la rutina pudo haber arrancado.',
      facts: [['Timeout', 'ambiguo'], ['429', 'rechazado']],
    },
    legend: [['#d24545', 'Fallo']],
    start: { nodes: ['dispatcher'], frame: 'salida' },
    variants: [
      { id: 'timeout', label: 'Timeout', mode: 'journey', scenario: { ...happy, fault: 'webhook-timeout' } },
      { id: 'rechazo', label: '429', mode: 'journey', scenario: { ...happy, fault: 'webhook-rejected' } },
    ],
    defaultVariant: 'timeout',
    outro: { title: 'Lección completa', desc: 'No hay segundo intento.', text: 'La cola sigue hasta completion o caducidad.', facts: [['Cupo', 'publicado']] },
    factIds: ['F-066', 'F-070'],
  },
  {
    id: 'aduana-retorno',
    group: 'defensas',
    name: 'Aduana',
    title: 'El regreso se revisa',
    overview: {
      full: 'complete_request pasa bearer, esquema, handle, hash y cupo.',
      description: 'Un campo to, un handle malo o un archivo inseguro no se envían.',
      facts: [['to', 'prohibido'], ['Mismo texto', 'replay']],
    },
    legend: [['#d24545', 'Rechazo']],
    start: { nodes: ['validate'], frame: 'salida' },
    variants: [
      { id: 'to', label: 'Campo to', mode: 'journey', scenario: { ...happy, fault: 'extra-to' } },
      { id: 'handle', label: 'Handle', mode: 'journey', scenario: { ...happy, fault: 'bad-handle' } },
      { id: 'sha', label: 'sha256', mode: 'journey', scenario: { ...happy, reply: 'image', fault: 'sha-mismatch' } },
      { id: 'script', label: 'Script', mode: 'journey', scenario: { ...happy, reply: 'document', fault: 'html-script' } },
      { id: 'conflicto', label: 'Conflicto', mode: 'journey', scenario: { ...happy, fault: 'completion-conflict' } },
      { id: 'replay', label: 'Replay', mode: 'journey', scenario: { ...happy, fault: 'replay' } },
      { id: 'cupo', label: 'Cupo', mode: 'journey', scenario: { ...happy, reply: 'image', fault: 'media-rate' } },
    ],
    defaultVariant: 'to',
    outro: { title: 'Lección completa', desc: 'La aduana no negocia el destino.', text: 'El chat sale del ledger, no del agente.', facts: [['Loopback', 'solo']] },
    factIds: ['F-091', 'F-100', 'F-101', 'F-102', 'F-104'],
  },
  {
    id: 'entrega',
    group: 'defensas',
    name: 'Recibos',
    title: 'Tres evidencias',
    overview: {
      full: 'Aceptado, entregado y leído son cosas distintas.',
      description: 'Un teléfono apagado se queda en el primer tick. Sin id, el resultado es unknown.',
      facts: [['✓', 'accepted'], ['✓✓', 'delivered'], ['Azul', 'read']],
    },
    legend: [['#17a067', 'Recibo']],
    start: { nodes: ['receipts'], frame: 'salida' },
    variants: [
      { id: 'completo', label: 'Leído', mode: 'journey', scenario: happy },
      { id: 'apagado', label: 'Apagado', mode: 'journey', scenario: { ...happy, fault: 'phone-off' } },
      { id: 'unknown', label: 'Unknown', mode: 'journey', scenario: { ...happy, fault: 'delivery-unknown' } },
    ],
    defaultVariant: 'completo',
    outro: { title: 'Lección completa', desc: 'El color no basta: va el nombre.', text: 'Nada de esto es exactly-once.', facts: [['Unknown', 'sin reintento']] },
    factIds: ['F-026', 'F-106', 'F-107'],
  },
  {
    id: 'proactivo',
    group: 'control',
    name: 'Proactivo',
    title: 'Enviar primero',
    overview: {
      full: 'Juanjo pide un aviso. Enviar usa un alias y varias guardas.',
      description: 'Silencio de noche, cupo diario, separación y breaker. No abre chats nuevos.',
      facts: [['Noche', '22 a 07'], ['Día', '10']],
    },
    legend: [['#d98a00', 'Aviso']],
    start: { nodes: ['mcp-enviar'], frame: 'mcp' },
    variants: [
      { id: 'ok', label: 'De día', mode: 'proactive', scenario: { hour: 'day', reactiveBusy: false, fault: 'none' } satisfies ProactiveScenario },
      { id: 'noche', label: 'De noche', mode: 'proactive', scenario: { hour: 'quiet', reactiveBusy: false, fault: 'none' } },
      { id: 'cupo', label: 'Cupo', mode: 'proactive', scenario: { hour: 'day', reactiveBusy: false, fault: 'daily-cap' } },
      { id: 'pronto', label: 'Muy pronto', mode: 'proactive', scenario: { hour: 'day', reactiveBusy: false, fault: 'too-soon' } },
      { id: 'vuelo', label: 'En vuelo', mode: 'proactive', scenario: { hour: 'day', reactiveBusy: true, fault: 'none' } },
      { id: 'breaker', label: 'Breaker', mode: 'proactive', scenario: { hour: 'day', reactiveBusy: false, fault: 'breaker' } },
      { id: 'nuevo', label: 'Sin chat', mode: 'proactive', scenario: { hour: 'day', reactiveBusy: false, fault: 'no-chat' } },
    ],
    defaultVariant: 'ok',
    outro: { title: 'Lección completa', desc: 'Proactivo no es la rutina entrante.', text: 'La respuesta a un mensaje no depende del breaker.', facts: [['Alias', 'owner']] },
    factIds: ['F-120', 'F-121', 'F-122', 'F-123'],
  },
  {
    id: 'admin',
    group: 'control',
    name: 'Admin',
    title: 'La lista de chats',
    overview: {
      full: 'Admin activa, apaga o pausa. Nunca devuelve un número.',
      description: 'El tope es 5. Un entrante en proceso bloquea el alta. La pausa se llama pause_all.',
      facts: [['Tope', '5'], ['Pausa', 'pause_all']],
    },
    legend: [['#5b6b7a', 'Admin']],
    start: { nodes: ['mcp-admin'], frame: 'mcp' },
    variants: [
      { id: 'alta', label: 'Activar', mode: 'admin', scenario: { situation: 'allow' } satisfies AdminScenario },
      { id: 'tope', label: 'Tope 5', mode: 'admin', scenario: { situation: 'cap' } },
      { id: 'vuelo', label: 'En vuelo', mode: 'admin', scenario: { situation: 'inflight' } },
      { id: 'pausa', label: 'Pausar', mode: 'admin', scenario: { situation: 'pause' } },
      { id: 'baja', label: 'Apagar', mode: 'admin', scenario: { situation: 'deny' } },
    ],
    defaultVariant: 'alta',
    outro: { title: 'Lección completa', desc: 'La lista no sale del chat.', text: 'resume_all pide confirm.', facts: [['Handles', 'opacos']] },
    factIds: ['F-046', 'F-047', 'F-094'],
  },
  {
    id: 'cambiar-cerebro',
    group: 'arquitectura',
    name: 'Cerebro',
    title: 'Cambiar el cerebro',
    overview: {
      full: 'Un ejercicio: otro proveedor, mismos contratos. No es un plan.',
      description: 'Gemini, OpenAI u otro motor local. Si vive fuera de la box, el cable de loopback no llega.',
      facts: [
        ['Saber', 'general'],
        ['Loopback', '127.0.0.1'],
      ],
    },
    legend: [
      ['#d24545', 'Cambia'],
      ['#17a067', 'Se queda'],
      ['#d98a00', 'Contrato'],
    ],
    start: { nodes: ['agent'], frame: 'full' },
    variants: [
      { id: 'gemini-dentro', label: 'Gemini dentro', mode: 'swap', provider: 'gemini', insideBox: true, swapId: 'brain' },
      { id: 'gemini-fuera', label: 'Gemini fuera', mode: 'swap', provider: 'gemini', insideBox: false, swapId: 'brain' },
      { id: 'openai-dentro', label: 'OpenAI dentro', mode: 'swap', provider: 'openai', insideBox: true, swapId: 'brain' },
      { id: 'openai-fuera', label: 'OpenAI fuera', mode: 'swap', provider: 'openai', insideBox: false, swapId: 'brain' },
      { id: 'otro-dentro', label: 'Otro dentro', mode: 'swap', provider: 'otro', insideBox: true, swapId: 'brain' },
      { id: 'otro-fuera', label: 'Otro fuera', mode: 'swap', provider: 'otro', insideBox: false, swapId: 'brain' },
      { id: 'transporte', label: 'Transporte', mode: 'swap', swapId: 'transport', insideBox: true },
      { id: 'stt', label: 'STT', mode: 'swap', swapId: 'stt', insideBox: true },
      { id: 'tts', label: 'TTS', mode: 'swap', swapId: 'tts', insideBox: true },
      { id: 'disco', label: 'Disco', mode: 'swap', swapId: 'storage', insideBox: true },
      { id: 'host', label: 'Hosting', mode: 'swap', swapId: 'hosting', insideBox: false },
      { id: 'canal', label: 'Canal', mode: 'swap', swapId: 'channel', insideBox: true },
    ],
    defaultVariant: 'gemini-dentro',
    outro: {
      title: 'Lección completa',
      desc: 'El contrato queda. El sitio del proceso importa.',
      text: 'Fuera de la box el retorno no alcanza validate. Hoy no hay túnel.',
      facts: [['Modelo', 'sin nombre']],
    },
    factIds: ['F-001', 'F-021', 'F-062', 'F-091', 'F-092', 'F-143'],
  },
];

export const scenarios = defs;
export const scenarioById: Record<string, ScenarioDef> = Object.fromEntries(defs.map((item) => [item.id, item]));

export function variantOf(def: ScenarioDef, id?: string | null): Variant {
  return def.variants.find((item) => item.id === (id || def.defaultVariant)) ?? def.variants[0];
}

export function stepsFor(def: ScenarioDef, variant: Variant): ExplorerStep[] {
  if (variant.mode === 'proactive') return toExplorerSteps(buildProactiveJourney(variant.scenario as ProactiveScenario));
  if (variant.mode === 'admin') return toExplorerSteps(buildAdminJourney(variant.scenario as AdminScenario));
  if (variant.mode === 'swap') {
    const steps = journey(happy);
    const inside = variant.insideBox !== false;
    steps[0]?.events.push({
      type: 'swap',
      slot: 'brain',
      to: variant.provider ?? 'gemini',
      insideBox: inside,
    });
    if (def.id === 'cambiar-cerebro' && !inside) steps[0]?.events.push({ type: 'note', at: 'validate', text: 'SOLO 127.0.0.1', tone: 'warn' });
    return steps;
  }
  const scenario = variant.scenario as Scenario;
  const note = variant.id === 'html' ? { text: 'CSP INYECTADA', tone: 'ok' as const } : undefined;
  return journey(scenario, note);
}

export function scenarioIds(): ScenarioId[] {
  return defs.map((item) => item.id);
}
