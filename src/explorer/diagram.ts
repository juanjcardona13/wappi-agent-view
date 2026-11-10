import type { Graph } from '../vendor/isoplan/core';
import type { FrameId } from './types';

export interface Wire {
  id: string;
  from: string;
  to: string;
  wire: 'socket' | 'bus' | 'https' | 'mcp' | 'loop' | 'tool';
  both?: boolean;
}

const chain = (ids: string[], wire: Wire['wire'], both = false): Wire[] =>
  ids.slice(0, -1).map((from, index) => {
    const to = ids[index + 1];
    return { id: `${from}>${to}`, from, to, wire, both };
  });

export const wires: Wire[] = [
  ...chain(['phone', 'e2e', 'wa-servers', 'linked-device', 'baileys'], 'socket', true),
  ...chain(['baileys', 'normalize', 'dedup', 'policy', 'media', 'sqlite', 'queue', 'dispatcher'], 'bus'),
  { id: 'dispatcher>routine', from: 'dispatcher', to: 'routine', wire: 'https' },
  { id: 'routine>agent', from: 'routine', to: 'agent', wire: 'bus' },
  { id: 'agent>box-tools', from: 'agent', to: 'box-tools', wire: 'tool' },
  { id: 'agent>mcp-responder', from: 'agent', to: 'mcp-responder', wire: 'mcp' },
  { id: 'agent>mcp-enviar', from: 'agent', to: 'mcp-enviar', wire: 'mcp' },
  { id: 'agent>mcp-admin', from: 'agent', to: 'mcp-admin', wire: 'mcp' },
  { id: 'mcp-responder>validate', from: 'mcp-responder', to: 'validate', wire: 'loop' },
  { id: 'mcp-enviar>validate', from: 'mcp-enviar', to: 'validate', wire: 'loop' },
  { id: 'mcp-admin>validate', from: 'mcp-admin', to: 'validate', wire: 'loop' },
  ...chain(['validate', 'send', 'receipts', 'phone'], 'bus'),
  { id: 'policy>send', from: 'policy', to: 'send', wire: 'bus' },
  { id: 'policy>sqlite', from: 'policy', to: 'sqlite', wire: 'bus' },
  { id: 'box-tools>mcp-responder', from: 'box-tools', to: 'mcp-responder', wire: 'tool' },
];

export const graph: Graph = {
  zones: [
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'box', label: 'Box' },
    { id: 'entrada', label: 'Entrada', parent: 'box' },
    { id: 'estado', label: 'Estado', parent: 'box' },
    { id: 'salida', label: 'Salida', parent: 'box' },
    { id: 'mcp', label: 'MCP', parent: 'box' },
    { id: 'cerebro', label: 'Cerebro' },
  ],
  nodes: [
    { id: 'phone', label: 'Teléfono', kind: 'phone', zone: 'whatsapp', col: 0, row: 0 },
    { id: 'e2e', label: 'Cifrado', kind: 'lock', zone: 'whatsapp', col: 0, row: 1 },
    { id: 'wa-servers', label: 'Servidores', kind: 'cloud', zone: 'whatsapp', col: 0, row: 2 },
    { id: 'linked-device', label: 'Vinculado', kind: 'link', zone: 'whatsapp', col: 0, row: 3 },
    { id: 'baileys', label: 'Baileys', kind: 'antenna', zone: 'entrada', col: 0, row: 0 },
    { id: 'normalize', label: 'Normalizar', kind: 'funnel', zone: 'entrada', col: 0, row: 1 },
    { id: 'dedup', label: 'Dedup', kind: 'stamp', zone: 'entrada', col: 0, row: 2 },
    { id: 'policy', label: 'Política', kind: 'gate', zone: 'entrada', col: 0, row: 3 },
    { id: 'media', label: 'Medios', kind: 'mic', zone: 'entrada', col: 0, row: 4 },
    { id: 'sqlite', label: 'SQLite', kind: 'cylinder-lock', zone: 'estado', col: 1, row: 0 },
    { id: 'queue', label: 'Cola', kind: 'queue', zone: 'estado', col: 1, row: 1 },
    { id: 'dispatcher', label: 'Webhook', kind: 'cannon', zone: 'salida', col: 2, row: 0 },
    { id: 'validate', label: 'Aduana', kind: 'customs', zone: 'salida', col: 2, row: 1 },
    { id: 'send', label: 'Envío', kind: 'antenna', zone: 'salida', col: 2, row: 2 },
    { id: 'receipts', label: 'Recibos', kind: 'web', zone: 'salida', col: 2, row: 3 },
    { id: 'box-tools', label: 'TTS', kind: 'toolbox', zone: 'salida', col: 2, row: 4 },
    { id: 'mcp-responder', label: 'Responder', kind: 'plug', zone: 'mcp', col: 3, row: 0 },
    { id: 'mcp-enviar', label: 'Enviar', kind: 'plug', zone: 'mcp', col: 3, row: 1 },
    { id: 'mcp-admin', label: 'Admin', kind: 'plug', zone: 'mcp', col: 3, row: 2 },
    { id: 'routine', label: 'Rutina', kind: 'function', zone: 'cerebro', col: 0, row: 0 },
    { id: 'agent', label: 'Agente', kind: 'brain', zone: 'cerebro', col: 0, row: 1 },
  ],
  edges: wires.map((wire) => ({
    id: wire.id,
    from: wire.from,
    to: wire.to,
    wire: wire.wire,
    both: wire.both,
  })),
};

const frames: Record<string, FrameId> = {
  phone: 'whatsapp',
  e2e: 'whatsapp',
  'wa-servers': 'whatsapp',
  'linked-device': 'whatsapp',
  baileys: 'entrada',
  normalize: 'entrada',
  dedup: 'entrada',
  policy: 'entrada',
  media: 'entrada',
  sqlite: 'estado',
  queue: 'estado',
  dispatcher: 'salida',
  validate: 'salida',
  send: 'salida',
  receipts: 'salida',
  'box-tools': 'salida',
  'mcp-responder': 'mcp',
  'mcp-enviar': 'mcp',
  'mcp-admin': 'mcp',
  routine: 'cerebro',
  agent: 'cerebro',
};

export function frameOf(nodeId: string): FrameId {
  return frames[nodeId] ?? 'full';
}

export function findPath(from: string, to: string): Wire[] {
  if (from === to) return [];
  const queue: string[][] = [[from]];
  const seen = new Set([from]);
  while (queue.length) {
    const path = queue.shift()!;
    const tip = path[path.length - 1];
    for (const wire of wires) {
      if (wire.from !== tip || seen.has(wire.to)) continue;
      const next = [...path, wire.to];
      if (wire.to === to) {
        return next.slice(0, -1).map((node, index) => wires.find((item) => item.from === node && item.to === next[index + 1])!);
      }
      seen.add(wire.to);
      queue.push(next);
    }
  }
  return [];
}

export const diagramNodeIds = graph.nodes.map((node) => node.id);
