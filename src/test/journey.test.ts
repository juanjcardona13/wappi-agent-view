import { describe, expect, it } from 'vitest';
import { factsById } from '../content/facts';
import { resolvePayload } from '../content/payloads';
import type { ChatKind, Fault, InputKind, ReplyKind, Scenario, Step } from '../content/types';
import {
  attachmentFaults,
  buildAdminJourney,
  buildJourney,
  buildProactiveJourney,
  stagesOf,
} from '../lib/journey';

const inputs: InputKind[] = ['text', 'voice', 'image', 'pdf', 'txt', 'video'];
const chats: ChatKind[] = ['owner', 'group-mention', 'group-quote', 'group-silent', 'unauthorized', 'help'];
const replies: ReplyKind[] = ['text', 'image', 'document', 'voice', 'text-attachment'];
const faults: Fault[] = [
  'none',
  'webhook-timeout',
  'webhook-rejected',
  'routine-silent',
  'extra-to',
  'bad-handle',
  'sha-mismatch',
  'html-script',
  'completion-conflict',
  'media-rate',
  'phone-off',
  'delivery-unknown',
  'voice-too-long',
  'stt-fail',
  'queue-busy',
  'pause',
];

const rank: Record<string, number> = {
  admitted: 1,
  webhook_accepted: 2,
  webhook_ambiguous: 2,
  webhook_rejected: 2,
  callback: 3,
  transport_accepted: 4,
  delivered: 5,
  read: 6,
  receipt_failed: 5,
};

function stageProblem(stages: string[]): string | null {
  let last = 0;
  let closed = false;
  for (const stage of stages) {
    if (!(stage in rank)) return `etapa desconocida ${stage}`;
    if (closed) return `etapa después de un webhook terminal: ${stage}`;
    if (rank[stage] <= last) return `fuera de orden ${stage}`;
    last = rank[stage];
    if (stage === 'webhook_ambiguous' || stage === 'webhook_rejected') closed = true;
  }
  if (stages.includes('delivered') && !stages.includes('transport_accepted')) return 'delivered sin accepted';
  if (stages.includes('read') && !stages.includes('delivered')) return 'read sin delivered';
  if (stages.includes('transport_accepted') && !stages.includes('callback')) return 'envío sin callback';
  if (stages.includes('callback') && !stages.includes('webhook_accepted')) return 'callback sin 200';
  return null;
}

function assertFacts(steps: Step[]) {
  for (const step of steps) {
    expect(step.factIds.length).toBeGreaterThan(0);
    for (const id of step.factIds) expect(factsById[id], id).toBeTruthy();
  }
}

function completeArgs(steps: Step[]): Record<string, unknown> | null {
  const step = steps.find((item) => item.payloadKey?.startsWith('mcp_toolsCall_completeRequest'));
  if (!step) return null;
  const payload = resolvePayload(step.payloadKey, step.payloadPatch) as {
    params?: { arguments?: Record<string, unknown> };
  };
  return payload.params?.arguments ?? null;
}

describe('buildJourney', () => {
  it('covers the full control matrix without breaking the stage rules', () => {
    let count = 0;
    for (const input of inputs) {
      for (const chat of chats) {
        for (const reply of replies) {
          for (const fault of faults) {
            count += 1;
            const scenario: Scenario = { input, chat, reply, fault };
            const steps = buildJourney(scenario);
            expect(steps.length).toBeGreaterThan(0);
            expect(stageProblem(stagesOf(steps)), JSON.stringify(scenario)).toBeNull();
            assertFacts(steps);
            const stages = stagesOf(steps);
            if (chat === 'unauthorized' || chat === 'group-silent' || chat === 'help' || input === 'video') {
              expect(stages).not.toContain('webhook_accepted');
            }
            if (chat === 'help' && input !== 'video' && fault !== 'pause') {
              expect(steps.some((step) => step.payloadKey === 'webhookRequest_inbound')).toBe(false);
              expect(stages.some((stage) => stage.startsWith('webhook'))).toBe(false);
            }
            const args = completeArgs(steps);
            if (reply === 'text' && !attachmentFaults.includes(fault)) {
              expect(args === null || !('attachments' in args)).toBe(true);
              if (args) expect(args.schemaVersion ?? 1).not.toBe(2);
            }
            if (stages.includes('delivered')) expect(stages.indexOf('transport_accepted')).toBeLessThan(stages.indexOf('delivered'));
            if (stages.includes('read')) expect(stages.indexOf('delivered')).toBeLessThan(stages.indexOf('read'));
          }
        }
      }
    }
    expect(count).toBeGreaterThanOrEqual(25);
  });

  it('keeps a voice note over 60s from reaching the webhook', () => {
    const steps = buildJourney({ input: 'voice', chat: 'owner', reply: 'text', fault: 'voice-too-long' });
    expect(stagesOf(steps)).not.toContain('webhook_accepted');
    expect(steps.at(-1)?.terminal?.outcome).toBe('Ignorado');
    const replied = steps.some((step) => {
      const effects = Array.isArray(step.phoneEffect) ? step.phoneEffect : step.phoneEffect ? [step.phoneEffect] : [];
      return effects.some((effect) => effect.type === 'bubble' && effect.bubble.kind !== 'note' && effect.bubble.from === 'wappi');
    });
    expect(replied).toBe(false);
  });

  it('shows silence for an unauthorized chat and a local reply for !ayuda', () => {
    const silent = buildJourney({ input: 'text', chat: 'unauthorized', reply: 'image', fault: 'none' });
    expect(silent.at(-1)?.terminal?.outcome).toBe('Silencio');
    const help = buildJourney({ input: 'text', chat: 'help', reply: 'text', fault: 'webhook-timeout' });
    expect(help.at(-1)?.terminal?.outcome).toBe('Respuesta local');
    expect(help.some((step) => step.nodeId === 'dispatcher')).toBe(false);
  });

  it('uses v1 without attachments on the happy text path', () => {
    const steps = buildJourney({ input: 'text', chat: 'owner', reply: 'text', fault: 'none' });
    const args = completeArgs(steps);
    expect(args?.text).toBeTruthy();
    expect(args).not.toHaveProperty('attachments');
    expect(stagesOf(steps)).toEqual([
      'admitted',
      'webhook_accepted',
      'callback',
      'transport_accepted',
      'delivered',
      'read',
    ]);
  });

  it('rejects an extra destination field before transport', () => {
    const steps = buildJourney({ input: 'text', chat: 'owner', reply: 'text', fault: 'extra-to' });
    expect(stagesOf(steps)).not.toContain('transport_accepted');
    expect(steps.at(-1)?.terminal?.outcome).toBe('Rechazada');
  });

  it('does not mark delivered when the phone never acknowledges', () => {
    const steps = buildJourney({ input: 'text', chat: 'group-mention', reply: 'voice', fault: 'phone-off' });
    const stages = stagesOf(steps);
    expect(stages).toContain('transport_accepted');
    expect(stages).not.toContain('delivered');
  });
});

describe('extra modes', () => {
  it('rejects proactive sends during quiet hours and while a reply is in flight', () => {
    const quiet = buildProactiveJourney({ hour: 'quiet', reactiveBusy: false, fault: 'none' });
    expect(JSON.stringify(quiet)).toContain('quiet_hours');
    const busy = buildProactiveJourney({ hour: 'day', reactiveBusy: true, fault: 'none' });
    expect(JSON.stringify(busy)).toContain('reactive_busy');
    const ok = buildProactiveJourney({ hour: 'day', reactiveBusy: false, fault: 'none' });
    expect(ok.at(-1)?.terminal?.outcome).toBe('Enviado');
    for (const steps of [quiet, busy, ok]) assertFacts(steps);
  });

  it('refuses admin changes at the cap or while inbound work is in flight', () => {
    expect(buildAdminJourney({ situation: 'cap' }).at(-1)?.terminal?.outcome).toBe('Negado');
    expect(buildAdminJourney({ situation: 'inflight' }).at(-1)?.terminal?.outcome).toBe('Negado');
    expect(buildAdminJourney({ situation: 'allow' }).at(-1)?.terminal?.outcome).toBe('Lista actualizada');
    expect(buildAdminJourney({ situation: 'pause' }).some((step) => step.title === 'pause_all')).toBe(true);
  });
});
