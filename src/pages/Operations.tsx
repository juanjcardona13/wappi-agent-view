import { useEffect } from 'react';
import { Certainty, FactList, JsonBlock, PageIntro } from '../components/ui';
import { payloads } from '../content/payloads';
import { deploySteps, pending, releases } from '../content/operations';

export function OperationsPage() {
  useEffect(() => {
    document.title = 'Operación · Wappi View';
  }, []);
  return (
    <div>
      <PageIntro
        kicker="Sin PIDs ni valores"
        title="Operación"
        lede="Cómo se mueve current, qué miran /healthz y /readyz, y qué sigue pendiente. No hay números de proceso, ni teléfonos, ni el contenido de los env."
      />
      <section>
        <h2 className="font-serif text-2xl">Desplegar</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {deploySteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-3 text-sm">La reversa es volver el enlace current al sha anterior. Después de moverlo, los MCP stdio siguen con el código viejo hasta reiniciarse. Matarlos a mitad deja la petición colgada 10 minutos.</p>
        <FactList ids={['F-150', 'F-151', 'F-035']} />
      </section>
      <section className="mt-8">
        <h2 className="font-serif text-2xl">Salud</h2>
        <p className="mt-2 text-sm">/healthz describe el proceso. /readyz puede decir whatsapp open si alguna vez se conoció la identidad propia, incluso después de un corte. No lo leas como «el socket está vivo ahora».</p>
        <div className="mt-3">
          <JsonBlock value={payloads.healthz_shape} label="Forma de /healthz" />
        </div>
        <FactList ids={['F-021', 'F-036']} />
      </section>
      <section className="mt-8">
        <h2 className="font-serif text-2xl">Dónde está cada cosa</h2>
        <p className="mt-2 text-sm">En la box: releases, current, config, data y logs (directorios restringidos), tools de TTS y STT, y la documentación de operación. La supervisión preparada es deploy/wappi.service o deploy/Dockerfile. No deben convivir.</p>
        <FactList ids={['F-005', 'F-152']} />
      </section>
      <section className="mt-8">
        <h2 className="font-serif text-2xl">Línea de releases</h2>
        <ol className="mt-3 space-y-3">
          {releases.map((release) => (
            <li key={release.id} className="rounded-2xl border border-line bg-elev p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-mono">{release.id}</h3>
                <Certainty value={release.certainty} />
              </div>
              <p className="font-semibold">{release.title}</p>
              <p className="text-sm text-muted">{release.when}</p>
              <p className="mt-1 text-sm">{release.body}</p>
              {release.factIds.length ? <FactList ids={release.factIds} /> : null}
            </li>
          ))}
        </ol>
      </section>
      <section className="mt-8">
        <h2 className="font-serif text-2xl">Pendientes conocidos</h2>
        <ul className="mt-3 space-y-3">
          {pending.map((item) => (
            <li key={item.title} className="rounded-2xl border border-line p-4">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm">{item.body}</p>
              <FactList ids={item.factIds} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
