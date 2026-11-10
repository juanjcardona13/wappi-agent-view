import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapDiagram } from '../components/MapDiagram';
import { Certainty, Correction, FactList, PageIntro } from '../components/ui';
import { swaps } from '../content/swaps';

export function SwapsPage() {
  useEffect(() => {
    document.title = 'Piezas intercambiables · Wappi View';
  }, []);
  return (
    <div>
      <PageIntro
        kicker="Ejercicio, no un plan"
        title="Piezas intercambiables"
        lede="Qué contrato habría que conservar si se cambiara una pieza. El cerebro, hoy, es Grok Bot a propósito. Los tradeoffs de otros proveedores son conocimiento general: no se probaron con Wappi."
      />
      <div className="space-y-8">
        {swaps.map((swap) => (
          <article key={swap.id} id={swap.id} className="rounded-2xl border border-line bg-elev p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-3xl">{swap.piece}</h2>
              <Certainty value={swap.certainty} />
            </div>
            <p className="mt-1 text-sm text-muted">{swap.certaintyNote}</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="font-semibold">Qué la reemplazaría</dt>
                <dd>{swap.replaces}</dd>
              </div>
              <div>
                <dt className="font-semibold">Contrato que hay que conservar</dt>
                <dd>{swap.contract}</dd>
              </div>
              <div>
                <dt className="font-semibold">Qué se toca</dt>
                <dd>{swap.touch}</dd>
              </div>
              <div>
                <dt className="font-semibold">Qué no cambia</dt>
                <dd>{swap.unchanged}</dd>
              </div>
              <div>
                <dt className="font-semibold">Riesgos</dt>
                <dd>{swap.risks}</dd>
              </div>
            </dl>
            <div className="mt-3">
              <FactList ids={swap.factIds} />
            </div>
            <Link to={`/mapa?pieza=${swap.id}`} className="mt-3 inline-block rounded-full bg-ink px-3 py-1 text-sm text-bg">
              Simular el reemplazo
            </Link>
            <div className="mt-4">
              <MapDiagram effects={swap.effects} showSecondary={false} />
            </div>
          </article>
        ))}
      </div>
      <div className="mt-6">
        <Correction n={2} />
      </div>
    </div>
  );
}
