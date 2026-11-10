import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapDiagram } from '../components/MapDiagram';
import { Correction, Deepen, FactList, PageIntro } from '../components/ui';
import { nodes, nodesById } from '../content/nodes';
import { swapsById } from '../content/swaps';

export function MapPage() {
  const [params] = useSearchParams();
  const requested = params.get('nodo');
  const swapId = params.get('pieza');
  const swap = swapId ? swapsById[swapId] : undefined;
  const [showSecondary, setShowSecondary] = useState(Boolean(swap));
  const [selected, setSelected] = useState(requested && nodesById[requested] ? requested : 'baileys');
  const node = nodesById[selected] ?? nodes[0];

  useEffect(() => {
    document.title = 'El mapa completo · Wappi View';
  }, []);

  useEffect(() => {
    if (requested && nodesById[requested]) setSelected(requested);
  }, [requested]);

  return (
    <div>
      <PageIntro
        kicker="De punta a punta"
        title="El mapa completo"
        lede="Ida arriba, vuelta abajo. Cada nodo abre el qué, el para qué, el archivo y el fallo. Los flujos de Enviar y Admin se encienden aparte."
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-full border border-line px-3 py-1 text-sm"
          aria-pressed={showSecondary}
          onClick={() => setShowSecondary((value) => !value)}
        >
          {showSecondary ? 'Ocultar flujos secundarios' : 'Mostrar flujos secundarios'}
        </button>
        {swap ? <p className="text-sm">Resaltando el reemplazo de {swap.piece}.</p> : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <MapDiagram
          selectedId={selected}
          onSelect={setSelected}
          showSecondary={showSecondary}
          effects={swap?.effects}
        />
        <aside className="h-fit rounded-2xl border border-line bg-elev p-4 shadow-card" aria-live="polite">
          <p className="text-xs uppercase text-muted">{node.lane === 'ida' ? 'Ida' : node.lane === 'vuelta' ? 'Vuelta' : 'Lateral'}</p>
          <h2 className="font-serif text-3xl">{node.title}</h2>
          <p className="mt-2">{node.summary}</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-semibold">Qué es</dt>
              <dd>{node.what}</dd>
            </div>
            <div>
              <dt className="font-semibold">Qué hace en Wappi</dt>
              <dd>{node.does}</dd>
            </div>
            <div>
              <dt className="font-semibold">Dónde vive</dt>
              <dd className="font-mono text-xs">{node.where}</dd>
            </div>
            <div>
              <dt className="font-semibold">Qué guarda</dt>
              <dd>{node.stores}</dd>
            </div>
            <div>
              <dt className="font-semibold">Qué puede fallar</dt>
              <dd>{node.fails}</dd>
            </div>
          </dl>
          <div className="mt-3">
            <FactList ids={node.factIds} />
          </div>
          <div className="mt-3">
            <Deepen codePath={node.where} codeNote={node.does}>
              <p>{node.fails}</p>
            </Deepen>
          </div>
        </aside>
      </div>
      <div className="mt-8 grid gap-3 lg:grid-cols-2">
        <Correction n={3} />
        <Correction n={4} />
      </div>
      <details className="mt-6">
        <summary>Lista de nodos, en orden de lectura</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          {nodes.map((item) => (
            <li key={item.id}>
              <button type="button" className="underline" onClick={() => setSelected(item.id)}>
                {item.title}
              </button>
              {' — '}
              {item.summary}
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
