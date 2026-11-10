import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { factsById } from '../content/facts';
import { Explorer } from '../explorer/Explorer';
import { diagramNodeIds, wires } from '../explorer/diagram';
import { renderPlan } from '../vendor/isoplan/core';
import { graph } from '../explorer/diagram';
import { scenarioById, scenarios, stepsFor, variantOf } from '../explorer/scenarios';
import { useExplorer } from '../explorer/store';
import { wordCount } from '../explorer/words';
import {
  DESKTOP_CANVAS,
  LABEL_FONT_DESKTOP,
  LABEL_INK,
  LABEL_PAPER,
  LEGEND_DARK,
  LEGEND_LIGHT,
  boxesOverlap,
  contrast,
  inkOn,
  placeLabels,
} from '../explorer/labels';
import { kindColor } from '../explorer/fromJourney';

function stageProblem(stages: string[]): string | null {
  const rank: Record<string, number> = {
    admitted: 1,
    webhook_accepted: 2,
    webhook_ambiguous: 2,
    webhook_rejected: 2,
    callback: 3,
    transport_accepted: 4,
    delivered: 5,
    read: 6,
  };
  let last = 0;
  let closed = false;
  for (const stage of stages) {
    if (!(stage in rank)) return stage;
    if (closed) return stage;
    if (rank[stage] <= last) return stage;
    last = rank[stage];
    if (stage === 'webhook_ambiguous' || stage === 'webhook_rejected') closed = true;
  }
  if (stages.includes('delivered') && stages.indexOf('transport_accepted') > stages.indexOf('delivered')) return 'delivered';
  if (stages.includes('read') && stages.indexOf('delivered') > stages.indexOf('read')) return 'read';
  return null;
}

describe('escenarios', () => {
  it('plays every scenario and variant to the end', () => {
    expect(scenarios).toHaveLength(15);
    for (const def of scenarios) {
      expect(def.variants.length).toBeGreaterThan(0);
      for (const variant of def.variants) {
        const steps = stepsFor(def, variant);
        expect(steps.length, `${def.id}/${variant.id}`).toBeGreaterThan(0);
        const stages = steps.flatMap((step) => (step.stage ? [step.stage] : []));
        expect(stageProblem(stages), `${def.id}/${variant.id}`).toBeNull();
        for (const step of steps) {
          expect(diagramNodeIds).toContain(step.nodeId);
          expect(wordCount(step.title)).toBeLessThanOrEqual(3);
          expect(wordCount(step.desc)).toBeLessThanOrEqual(8);
          expect(wordCount(step.detail)).toBeLessThanOrEqual(50);
          for (const id of step.factIds) expect(factsById[id], id).toBeTruthy();
          for (const event of step.events) {
            if (event.type === 'packet') expect(wires.some((wire) => wire.id === event.edge)).toBe(true);
            if (event.type === 'note') expect(wordCount(event.text)).toBeLessThanOrEqual(5);
            if (event.type === 'packet') expect(wordCount(event.label)).toBeLessThanOrEqual(3);
          }
        }
        expect(steps.at(-1)?.terminal || def.outro.title).toBeTruthy();
      }
    }
  });

  it('keeps blocked chats and help away from the webhook', () => {
    const blocked = stepsFor(scenarioById['bloqueado-politica'], variantOf(scenarioById['bloqueado-politica'], 'ajeno'));
    expect(blocked.some((step) => step.stage === 'webhook_accepted')).toBe(false);
    const help = stepsFor(scenarioById['comando-ayuda'], variantOf(scenarioById['comando-ayuda']));
    expect(help.some((step) => step.nodeId === 'dispatcher')).toBe(false);
    const duplicate = stepsFor(scenarioById.duplicado, variantOf(scenarioById.duplicado));
    expect(duplicate.filter((step) => step.stage === 'admitted')).toHaveLength(0);
    expect(duplicate.some((step) => step.nodeId === 'dispatcher')).toBe(false);
  });

  it('snapshots the isometric plan', () => {
    const plan = renderPlan(graph, { flows: false });
    expect(plan.tracks.length).toBe(wires.length);
    expect(plan.pieces.map((piece) => piece.id).sort()).toEqual([...diagramNodeIds].sort());
    expect(plan.viewBox).toMatch(/^[-\d.]+ [-\d.]+ [-\d.]+ [-\d.]+$/);
  });

  it('keeps desktop labels at least 13px and clear of each other', () => {
    const plan = renderPlan(graph, { flows: false });
    const boxes = placeLabels(
      plan.pieces.map((piece) => ({ id: piece.id, label: piece.label, at: plan.anchors[piece.id] })),
      plan.viewBox,
      DESKTOP_CANVAS,
      LABEL_FONT_DESKTOP,
    );
    expect(boxes).toHaveLength(plan.pieces.length);
    for (const box of boxes) expect(box.font).toBeGreaterThanOrEqual(13);
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        expect(boxesOverlap(boxes[i], boxes[j]), `${boxes[i].id} ${boxes[j].id}`).toBe(false);
      }
    }
    expect(contrast(LABEL_INK, LABEL_PAPER)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(LEGEND_LIGHT.fg, LEGEND_LIGHT.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(LEGEND_DARK.fg, LEGEND_DARK.bg)).toBeGreaterThanOrEqual(4.5);
    for (const fill of Object.values(kindColor)) expect(contrast('#ffffff', inkOn(fill))).toBeGreaterThanOrEqual(4.5);
  });
});

describe('explorador', () => {
  it('stays inside the word budget on the first step', async () => {
    useExplorer.getState().reset();
    render(
      <MemoryRouter initialEntries={['/e/texto-privado?paso=1']}>
        <Routes>
          <Route path="/e/:scenarioId" element={<Explorer />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('img', { name: 'Diagrama de Wappi' })).toBeInTheDocument();
    const scene = document.querySelector('[data-budget="scene"]')?.textContent ?? '';
    const all = document.querySelector('[data-budget="all"]')?.textContent ?? '';
    expect(wordCount(scene)).toBeLessThanOrEqual(40);
    expect(wordCount(all)).toBeLessThanOrEqual(120);
  });

  it('steps with the keyboard and announces the step', async () => {
    const user = userEvent.setup();
    useExplorer.getState().reset();
    render(
      <MemoryRouter initialEntries={['/e/texto-privado?paso=1']}>
        <Routes>
          <Route path="/e/:scenarioId" element={<Explorer />} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByRole('img', { name: 'Diagrama de Wappi' });
    await user.keyboard('{ArrowRight}');
    expect(document.querySelector('.now-title')?.textContent).toMatch(/2 de/);
    expect(document.querySelector('.sr-only[aria-live="polite"]')?.textContent).toMatch(/Paso 2/);
    await user.keyboard('v');
    expect(screen.getByRole('table', { name: 'Secuencia' })).toBeInTheDocument();
    await user.keyboard('?');
    expect(screen.getByRole('dialog', { name: 'Atajos' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
  });

  it('cuts the camera when motion is reduced', async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
    useExplorer.getState().reset();
    render(
      <MemoryRouter initialEntries={['/e/texto-privado?paso=1']}>
        <Routes>
          <Route path="/e/:scenarioId" element={<Explorer />} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByRole('img', { name: 'Diagrama de Wappi' });
    expect(document.querySelector('[data-motion="cut"]')).toBeTruthy();
    window.matchMedia = original;
  });

  it('focuses a piece and opens it with Enter', async () => {
    const user = userEvent.setup();
    useExplorer.getState().reset();
    render(
      <MemoryRouter initialEntries={['/e/texto-privado?paso=1']}>
        <Routes>
          <Route path="/e/:scenarioId" element={<Explorer />} />
        </Routes>
      </MemoryRouter>,
    );
    const diagram = await screen.findByRole('img', { name: 'Diagrama de Wappi' });
    const piece = diagram.querySelector('.iso-piece');
    expect(piece).toBeTruthy();
    (piece as HTMLElement).focus();
    await user.keyboard('{Enter}');
    expect(useExplorer.getState().selectedNode).toBeTruthy();
  });
});
