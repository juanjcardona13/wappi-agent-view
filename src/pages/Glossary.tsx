import { useEffect, useMemo, useState } from 'react';
import { Certainty, FactList, PageIntro } from '../components/ui';
import { glossary } from '../content/glossary';
import { norm } from '../lib/text';

export function GlossaryPage() {
  const [query, setQuery] = useState('');
  useEffect(() => {
    document.title = 'Glosario · Wappi View';
  }, []);
  const terms = useMemo(() => {
    const needle = norm(query.trim());
    const sorted = [...glossary].sort((a, b) => a.term.localeCompare(b.term, 'es'));
    if (!needle) return sorted;
    return sorted.filter((term) => norm(`${term.term} ${term.definition}`).includes(needle));
  }, [query]);
  return (
    <div>
      <PageIntro kicker="A–Z" title="Glosario" lede="Los términos del viaje. Si el detalle es de la industria y no del código, la etiqueta lo dice." />
      <label className="block text-sm font-semibold" htmlFor="glosario-q">
        Buscar un término
        <input id="glosario-q" value={query} onChange={(event) => setQuery(event.target.value)} className="mt-1 w-full max-w-md rounded-xl border border-line bg-elev px-3 py-2 font-normal" />
      </label>
      <p className="mt-2 text-sm text-muted">{terms.length} términos</p>
      <ul className="mt-4 space-y-3">
        {terms.map((term) => (
          <li key={term.id} id={term.id} className="rounded-2xl border border-line bg-elev p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-2xl">{term.term}</h2>
              <Certainty value={term.certainty} />
            </div>
            <p className="mt-2 text-sm">{term.definition}</p>
            <div className="mt-2">
              <FactList ids={term.factIds} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
