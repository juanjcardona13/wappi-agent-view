import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { corrections } from '../content/corrections';
import { factsById } from '../content/facts';
import type { Certainty, Step } from '../content/types';
import { resolvePayload } from '../content/payloads';
import { plain } from '../lib/text';

const labels: Record<Certainty, string> = {
  verificado: 'Verificado',
  general: 'Conocimiento general',
  'no-verificado': 'No verificado',
};

export function Certainty({ value }: { value: Certainty }) {
  const tone =
    value === 'verificado'
      ? 'border-accent text-accent'
      : value === 'general'
        ? 'border-clay text-clay'
        : 'border-danger text-danger';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${tone}`}>
      <span aria-hidden="true">{value === 'verificado' ? '●' : value === 'general' ? '◆' : '▲'}</span>
      {labels[value]}
    </span>
  );
}

export function FactList({ ids }: { ids: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const fact = open ? factsById[open] : undefined;
  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="list">
        {ids.map((id) => (
          <button
            key={id}
            type="button"
            role="listitem"
            aria-expanded={open === id}
            className="rounded-full border border-line bg-bg px-2 py-0.5 font-mono text-xs hover:border-accent"
            onClick={() => setOpen((current) => (current === id ? null : id))}
          >
            {id}
          </button>
        ))}
      </div>
      {fact ? (
        <div id={`fact-${fact.id}`} className="mt-2 rounded-xl border border-line bg-bg p-3 text-sm">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <strong className="font-mono">{fact.id}</strong>
            <Certainty value={fact.certainty} />
          </div>
          <p>{plain(fact.text)}</p>
          <p className="mt-2 font-mono text-xs text-muted">Fuente: {plain(fact.source)}</p>
          <Link className="mt-1 inline-block text-sm text-accent underline" to={`/verificado#${fact.id}`}>
            Ver en la tabla
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function Correction({ n }: { n: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 }) {
  const item = corrections.find((correction) => correction.n === n);
  if (!item) return null;
  return (
    <aside className="rounded-2xl border border-clay/40 bg-clay/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-clay">Corrección {item.n}</p>
      <h3 className="font-serif text-lg">{item.title}</h3>
      <p className="mt-1 text-sm">{item.text}</p>
      <div className="mt-2">
        <FactList ids={item.factIds} />
      </div>
    </aside>
  );
}

export function Deepen({
  children,
  codePath,
  codeNote,
}: {
  children: ReactNode;
  codePath?: string;
  codeNote?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <details className="rounded-xl border border-line bg-bg px-3 py-2">
        <summary className="font-semibold">Profundizar</summary>
        <div className="mt-2 space-y-2 text-sm">{children}</div>
      </details>
      {codePath ? (
        <details className="rounded-xl border border-line bg-bg px-3 py-2">
          <summary className="font-semibold">Ver en el código</summary>
          <p className="mt-2 font-mono text-sm">{codePath}</p>
          {codeNote ? <p className="mt-1 text-sm text-muted">{codeNote}</p> : null}
        </details>
      ) : null}
    </div>
  );
}

export function JsonBlock({ value, label = 'Qué datos viajan' }: { value: unknown; label?: string }) {
  const [open, setOpen] = useState(true);
  if (value === undefined) return <p className="text-sm text-muted">Este paso no mueve un payload de ejemplo.</p>;
  return (
    <div>
      <button type="button" className="text-sm font-semibold underline" aria-expanded={open} onClick={() => setOpen((valueOpen) => !valueOpen)}>
        {open ? 'Ocultar' : 'Mostrar'} {label}
      </button>
      {open ? (
        <pre className="mt-2 max-h-80 overflow-auto rounded-xl border border-line bg-bg p-3 text-xs leading-relaxed">
          {JSON.stringify(value, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

export function stepPayload(step: Step): unknown | undefined {
  const resolved = resolvePayload(step.payloadKey, step.payloadPatch);
  return resolved === undefined ? step.example : resolved;
}

export function PageIntro({ kicker, title, lede }: { kicker?: string; title: string; lede: string }) {
  return (
    <header className="mb-6 max-w-3xl">
      {kicker ? <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{kicker}</p> : null}
      <h1 className="mt-1 font-serif text-4xl leading-tight">{title}</h1>
      <p className="mt-3 text-lg text-muted">{lede}</p>
    </header>
  );
}
