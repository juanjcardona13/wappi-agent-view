import { connectors } from '../content/connectors';
import { facts } from '../content/facts';
import { glossary } from '../content/glossary';
import { lessons } from '../content/lessons';
import { nav } from '../content/nav';
import { nodes } from '../content/nodes';
import { swaps } from '../content/swaps';
import { norm } from './text';

export interface Hit {
  href: string;
  title: string;
  kind: string;
  text: string;
}

const index: Hit[] = [
  ...nav.map((item) => ({ href: item.href, title: item.label, kind: 'Página', text: item.description })),
  ...lessons.map((lesson) => ({
    href: `/conceptos/${lesson.slug}`,
    title: lesson.title,
    kind: 'Lección',
    text: lesson.summary,
  })),
  ...glossary.map((term) => ({
    href: `/glosario#${term.id}`,
    title: term.term,
    kind: 'Glosario',
    text: term.definition,
  })),
  ...facts.map((fact) => ({ href: `/verificado#${fact.id}`, title: fact.id, kind: 'Hecho', text: fact.text })),
  ...nodes.map((node) => ({ href: `/mapa?nodo=${node.id}`, title: node.title, kind: 'Mapa', text: node.summary })),
  ...connectors.map((item) => ({
    href: `/conectores#${item.id}`,
    title: item.title,
    kind: 'Conector',
    text: item.summary,
  })),
  ...swaps.map((swap) => ({
    href: `/intercambiable#${swap.id}`,
    title: swap.piece,
    kind: 'Pieza',
    text: swap.replaces,
  })),
];

export function searchContent(query: string): Hit[] {
  const needle = norm(query.trim());
  if (needle.length < 2) return [];
  return index
    .filter((hit) => norm(`${hit.title} ${hit.kind} ${hit.text}`).includes(needle))
    .slice(0, 12);
}
