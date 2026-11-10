import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { corrections } from '../content/corrections';
import { connectors } from '../content/connectors';
import { facts, factsById } from '../content/facts';
import { glossary } from '../content/glossary';
import { lessons } from '../content/lessons';
import { commands, homes, tree } from '../content/modules';
import { nodes } from '../content/nodes';
import { releases } from '../content/operations';
import { quiz, securityCards } from '../content/security';
import { swaps } from '../content/swaps';
import { unknowns } from '../content/unknowns';
import { buildJourney } from '../lib/journey';

const factSchema = z.object({
  id: z.string().regex(/^F-\d{3}$/),
  section: z.string().min(3),
  text: z.string().min(10),
  source: z.string().min(1),
  certainty: z.enum(['verificado', 'general', 'no-verificado']),
});

function collect(value: unknown, found: string[]) {
  if (Array.isArray(value)) {
    value.forEach((item) => collect(item, found));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (key === 'factIds' && Array.isArray(item)) found.push(...item.filter((id): id is string => typeof id === 'string'));
    else collect(item, found);
  }
}

describe('facts', () => {
  it('matches ARCHITECTURE-FACTS.md and parses', () => {
    const markdown = readFileSync('docs/ARCHITECTURE-FACTS.md', 'utf8');
    const ids = [...markdown.matchAll(/^\| (F-\d{3}) \|/gm)].map((match) => match[1]);
    expect(facts.map((fact) => fact.id)).toEqual(ids);
    expect(new Set(ids).size).toBe(ids.length);
    for (const fact of facts) expect(factSchema.parse(fact).id).toBe(fact.id);
    expect(factsById['F-065']?.text.toLowerCase()).toContain('bearer');
    expect(factsById['F-065']?.text.toLowerCase()).not.toContain('firma hmac del cuerpo');
  });

  it('lists every unknown and the eight corrections', () => {
    expect(unknowns.map((item) => item.id)).toEqual([
      'U-01',
      'U-02',
      'U-03',
      'U-04',
      'U-05',
      'U-06',
      'U-07',
      'U-08',
      'U-09',
    ]);
    expect(corrections).toHaveLength(8);
    for (const correction of corrections) {
      for (const id of correction.factIds) expect(factsById[id]).toBeTruthy();
    }
  });

  it('only cites fact ids that exist', () => {
    const found: string[] = [];
    collect({ lessons, nodes, glossary, connectors, swaps, quiz, securityCards, commands, homes, tree, releases, corrections }, found);
    const sample = buildJourney({ input: 'image', chat: 'group-quote', reply: 'document', fault: 'none' });
    collect(sample, found);
    for (const id of found) expect(factsById[id], id).toBeTruthy();
  });
});
