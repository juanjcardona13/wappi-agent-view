import { useEffect, useMemo, useState } from 'react';
import { Certainty, PageIntro } from '../components/ui';
import { corrections } from '../content/corrections';
import { facts } from '../content/facts';
import type { Certainty as CertaintyId } from '../content/types';
import { unknowns } from '../content/unknowns';
import { plain } from '../lib/text';

export function VerifiedPage() {
  const [query, setQuery] = useState('');
  const [section, setSection] = useState('todas');
  const [certainty, setCertainty] = useState<'todas' | CertaintyId>('todas');
  useEffect(() => {
    document.title = 'Qué está verificado · Wappi View';
  }, []);
  const sections = ['todas', ...Array.from(new Set(facts.map((fact) => fact.section)))];
  const rows = useMemo(
    () =>
      facts.filter((fact) => {
        if (section !== 'todas' && fact.section !== section) return false;
        if (certainty !== 'todas' && fact.certainty !== certainty) return false;
        const haystack = plain(`${fact.id} ${fact.text} ${fact.source}`).toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
      }),
    [query, section, certainty],
  );
  return (
    <div>
      <PageIntro
        kicker="Corte 7e8b50a"
        title="Qué está verificado"
        lede="Verificado: leído en el código o en los docs de la release 7e8b50a el 10 nov 2026. Conocimiento general: industria, no este código. No verificado: está abierto en la hoja."
      />
      <div className="grid gap-2 md:grid-cols-3">
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="rounded-xl border border-line bg-elev px-3 py-2" placeholder="F-065, bearer, cola…" aria-label="Filtrar hechos" />
        <select value={section} onChange={(event) => setSection(event.target.value)} className="rounded-xl border border-line bg-elev px-3 py-2" aria-label="Sección">
          {sections.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={certainty} onChange={(event) => setCertainty(event.target.value as 'todas' | CertaintyId)} className="rounded-xl border border-line bg-elev px-3 py-2" aria-label="Etiqueta">
          <option value="todas">Todas las etiquetas</option>
          <option value="verificado">Verificado</option>
          <option value="general">Conocimiento general</option>
          <option value="no-verificado">No verificado</option>
        </select>
      </div>
      <p className="mt-2 text-sm text-muted">{rows.length} hechos</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="py-2 pr-3">Id</th>
              <th className="py-2 pr-3">Hecho</th>
              <th className="py-2 pr-3">Fuente</th>
              <th className="py-2">Sección</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((fact) => (
              <tr key={fact.id} id={fact.id} className="border-b border-line align-top">
                <td className="py-2 pr-3 font-mono">
                  {fact.id}
                  <div className="mt-1">
                    <Certainty value={fact.certainty} />
                  </div>
                </td>
                <td className="py-2 pr-3">{plain(fact.text)}</td>
                <td className="py-2 pr-3 font-mono text-xs">{plain(fact.source)}</td>
                <td className="py-2 text-xs">{fact.section}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="mt-8" id="correcciones">
        <h2 className="font-serif text-2xl">Correcciones a supuestos comunes</h2>
        <ol className="mt-3 space-y-3">
          {corrections.map((item) => (
            <li key={item.n} className="rounded-2xl border border-clay/40 p-4">
              <h3 className="font-semibold">
                {item.n}. {item.title}
              </h3>
              <p className="text-sm">{item.text}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="mt-8">
        <h2 className="font-serif text-2xl">Desconocidos</h2>
        <ul className="mt-3 space-y-3">
          {unknowns.map((item) => (
            <li key={item.id} id={item.id} className="rounded-2xl border border-line p-4">
              <div className="mb-1 flex flex-wrap gap-2">
                <strong>{item.id}</strong>
                <Certainty value="no-verificado" />
                {item.id === 'U-05' || item.id === 'U-09' ? <Certainty value="general" /> : null}
              </div>
              <p className="text-sm">{item.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
