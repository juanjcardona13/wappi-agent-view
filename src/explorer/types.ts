import type { AdminScenario, Certainty, PhoneEffect, ProactiveScenario, Scenario } from '../content/types';

export type ScenarioId =
  | 'texto-privado'
  | 'nota-de-voz'
  | 'imagen'
  | 'documento'
  | 'grupo-mencion'
  | 'comando-ayuda'
  | 'bloqueado-politica'
  | 'duplicado'
  | 'cola-y-caducidad'
  | 'webhook-falla'
  | 'aduana-retorno'
  | 'entrega'
  | 'proactivo'
  | 'admin'
  | 'cambiar-cerebro';

export type Group = 'mensajes' | 'defensas' | 'control' | 'arquitectura';
export type Tone = 'info' | 'ok' | 'warn' | 'error';
export type PacketKind = 'text' | 'voice' | 'image' | 'document' | 'encrypted' | 'ticket' | 'https' | 'mcp' | 'http-local' | 'receipt' | 'control';
export type FrameId = 'whatsapp' | 'entrada' | 'estado' | 'salida' | 'cerebro' | 'mcp' | 'full';
export type KV = [label: string, value: string];
export type ProviderId = 'gemini' | 'openai' | 'otro';

export interface InspectorField {
  name: string;
  value: string;
  note?: string;
  tag?: 'EJEMPLO' | 'CIFRADO' | 'PLACEHOLDER';
  factIds?: string[];
}

export interface InspectorLayer {
  name: string;
  certainty: Certainty;
  fields: InspectorField[];
}

export type SceneEvent =
  | { type: 'show'; nodes: string[]; frame?: FrameId }
  | { type: 'type-message'; text: string; kind: PacketKind }
  | {
      type: 'packet';
      from: string;
      to: string;
      edge: string;
      kind: PacketKind;
      color: string;
      label: string;
      lines?: string[];
      payloadKey?: string;
      payloadPatch?: unknown;
      layers?: InspectorLayer[];
      outcome?: 'arrives' | 'dropped' | 'bounced' | 'stuck';
    }
  | { type: 'note'; at: string; text: string; tone: Tone }
  | { type: 'light'; node: string; state: 'active' | 'ok' | 'error' | 'dim' }
  | { type: 'phone'; effect: PhoneEffect }
  | { type: 'clock'; label: string }
  | { type: 'swap'; slot: 'brain'; to: ProviderId; insideBox: boolean };

export interface ExplorerStep {
  id: string;
  title: string;
  desc: string;
  detail: string;
  facts: KV[];
  events: SceneEvent[];
  nodeId: string;
  code?: { file: string; fn?: string; summary: string; pseudo?: string[] };
  stage?: string;
  requestState?: string;
  outboxState?: string;
  factIds: string[];
  certainty: Certainty;
  longBody?: string;
  terminal?: { outcome: string; lesson: string[] };
}

export interface Variant {
  id: string;
  label: string;
  scenario?: Scenario | ProactiveScenario | AdminScenario;
  mode: 'journey' | 'proactive' | 'admin' | 'swap';
  swapId?: string;
  provider?: ProviderId;
  insideBox?: boolean;
}

export interface ScenarioDef {
  id: ScenarioId;
  group: Group;
  name: string;
  title: string;
  overview: { full: string; description: string; facts: KV[] };
  legend: [color: string, label: string][];
  start: { nodes: string[]; frame: FrameId };
  variants: Variant[];
  defaultVariant: string;
  outro: { title: string; desc: string; text: string; facts: KV[] };
  factIds: string[];
}
