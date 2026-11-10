export interface Correction {
  n: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  title: string;
  text: string;
  factIds: string[];
}

/** ARCHITECTURE-FACTS §15. Wording stays faithful to the sheet. */
export const corrections: Correction[] = [
  {
    n: 1,
    title: 'El webhook no va firmado con HMAC',
    text: 'El webhook no está firmado con HMAC: se autentica con un bearer token sobre HTTPS (F-065). HMAC se usa dentro de la base para ids seudónimos (F-040, F-131).',
    factIds: ['F-065', 'F-040', 'F-131'],
  },
  {
    n: 2,
    title: 'El TTS principal no es local',
    text: 'El TTS principal no es local (edge-tts, servicio en línea de Microsoft); Piper es el respaldo local (F-111). El STT sí es local (F-052).',
    factIds: ['F-111', 'F-052'],
  },
  {
    n: 3,
    title: 'El 200 no trae la respuesta',
    text: 'El 200 del webhook no trae la respuesta; la respuesta vuelve después por MCP (F-066, F-090).',
    factIds: ['F-066', 'F-090'],
  },
  {
    n: 4,
    title: 'El cerebro no elige destinatario',
    text: 'El cerebro nunca elige destinatario; el puente lo saca de su ledger (F-103).',
    factIds: ['F-103'],
  },
  {
    n: 5,
    title: 'Un chat no autorizado recibe silencio',
    text: 'Un chat no autorizado no recibe un rechazo: recibe silencio (F-042).',
    factIds: ['F-042'],
  },
  {
    n: 6,
    title: 'Tres evidencias distintas',
    text: 'transport_accepted no es entregado, y entregado no es leído (F-107).',
    factIds: ['F-107'],
  },
  {
    n: 7,
    title: 'Los interruptores se llaman pause_all y resume_all',
    text: 'Las herramientas del conector Admin se llaman pause_all y resume_all en el código. Algunos documentos dicen «pause/resume».',
    factIds: ['F-047', 'F-094'],
  },
  {
    n: 8,
    title: 'Una nota de voz larga se ignora',
    text: 'Una nota de voz de más de 60 s se ignora por completo cuando el STT está activo (F-053). No hay webhook ni respuesta.',
    factIds: ['F-053'],
  },
];
