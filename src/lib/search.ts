import { facts } from '../content/facts';
import { glossary } from '../content/glossary';
import { scenarios } from '../explorer/scenarios';
import { norm } from './text';

export interface Hit {
  href: string;
  title: string;
  kind: string;
  text: string;
}

const index: Hit[] = [
  ...scenarios.map((item) => ({ href: `/e/${item.id}`, title: item.name, kind: 'Escenario', text: item.overview.description })),
  ...glossary.map((term) => ({ href: `/biblioteca/glosario#${term.id}`, title: term.term, kind: 'Glosario', text: term.definition })),
  ...facts.map((fact) => ({ href: `/biblioteca/hechos#${fact.id}`, title: fact.id, kind: 'Hecho', text: fact.text })),
];

export function searchContent(query: string): Hit[] {
  const needle = norm(query.trim());
  if (needle.length < 2) return [];
  return index.filter((hit) => norm(`${hit.title} ${hit.kind} ${hit.text}`).includes(needle)).slice(0, 12);
}
