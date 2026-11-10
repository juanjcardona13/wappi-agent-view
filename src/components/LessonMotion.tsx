import type { AnimationId } from '../content/lessons';

const frames: Record<AnimationId, { left: string; mid: string; right: string; caption: string }> = {
  devices: { left: 'Teléfono', mid: 'Servidores', right: 'Puente', caption: 'Tres puntas, un mensaje cifrado.' },
  baileys: { left: 'upsert', mid: 'notify', right: 'texto', caption: 'Solo notify sigue adelante.' },
  channels: { left: 'WebSocket', mid: 'abierto', right: 'Webhook', caption: 'Tubo persistente contra un POST.' },
  session: { left: 'Signal', mid: 'SQLite', right: 'un proceso', caption: 'Claves cifradas, un lockfile.' },
  dedup: { left: 'mensaje', mid: 'HMAC', right: 'una fila', caption: 'La segunda copia no nace.' },
  queue: { left: 'chat A', mid: 'uno en vuelo', right: 'espera', caption: 'El siguiente no adelanta.' },
  states: { left: 'admitted', mid: 'webhook', right: 'read', caption: 'La etapa solo sube.' },
  allow: { left: 'dueño', mid: 'mención', right: 'silencio', caption: 'Sin disparador no hay respuesta.' },
  media: { left: 'archivo', mid: 'med_', right: 'texto', caption: 'El archivo se queda. Viaja el hash.' },
  routine: { left: 'POST', mid: '200', right: 'run', caption: 'Arrancó. Todavía no respondió.' },
  brainbody: { left: 'cerebro', mid: 'MCP', right: 'cuerpo', caption: 'Decide uno. Ejecuta el otro.' },
  mcp: { left: 'stdio', mid: 'JSON-RPC', right: '127.0.0.1', caption: 'Una línea, luego loopback.' },
  receipts: { left: '✓', mid: '✓✓', right: '✓✓ azul', caption: 'Aceptado, entregado, leído.' },
  tts: { left: 'edge-tts', mid: 'MP3', right: 'Opus', caption: 'En línea primero. Local si falla.' },
  proactive: { left: 'alias', mid: 'guardas', right: 'chat', caption: 'Sin número y sin chat nuevo.' },
};

export function LessonMotion({ name }: { name: AnimationId }) {
  const frame = frames[name];
  return (
    <figure className="rounded-2xl border border-line bg-bg p-4">
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 text-center text-sm">
        <span className="rounded-xl border border-line bg-elev px-2 py-3">{frame.left}</span>
        <span className="motion-safe:animate-pulse text-accent" aria-hidden="true">→</span>
        <span className="rounded-xl border border-accent bg-elev px-2 py-3 font-semibold">{frame.mid}</span>
        <span className="motion-safe:animate-pulse text-clay" aria-hidden="true">→</span>
        <span className="rounded-xl border border-line bg-elev px-2 py-3">{frame.right}</span>
      </div>
      <figcaption className="mt-2 text-sm text-muted">{frame.caption}</figcaption>
    </figure>
  );
}
