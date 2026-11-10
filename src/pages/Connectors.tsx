import { useEffect, useState } from 'react';
import { Correction, FactList, JsonBlock, PageIntro } from '../components/ui';
import { connectors } from '../content/connectors';
import { payloads } from '../content/payloads';

export function ConnectorsPage() {
  const [tab, setTab] = useState(connectors[0].id);
  const current = connectors.find((item) => item.id === tab) ?? connectors[0];
  useEffect(() => {
    document.title = 'MCP y conectores · Wappi View';
  }, []);
  return (
    <div>
      <PageIntro
        kicker="Las manos"
        title="MCP y conectores"
        lede="Tres procesos stdio en la box. Cada uno llama al puente por 127.0.0.1 con su propio bearer. Un MCP remoto no vería ese localhost."
      />
      <div className="mb-4 rounded-2xl border border-line bg-elev p-4 text-sm">
        <p>Agente → stdio → proceso MCP → HTTP loopback + bearer propio → puente.</p>
        <p className="mt-2">Un MCP remoto no podría llegar al localhost de la box.</p>
      </div>
      <div role="tablist" aria-label="Conectores" className="flex flex-wrap gap-2">
        {connectors.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={item.id === current.id}
            aria-controls={`panel-${item.id}`}
            className={`rounded-full px-3 py-1 ${item.id === current.id ? 'bg-ink text-bg' : 'border border-line'}`}
            onClick={() => setTab(item.id)}
          >
            {item.title}
          </button>
        ))}
      </div>
      <article role="tabpanel" id={`panel-${current.id}`} aria-labelledby={`tab-${current.id}`} className="mt-4 rounded-2xl border border-line bg-elev p-4">
        <h2 className="font-serif text-3xl">{current.title}</h2>
        <p className="mt-1 font-mono text-xs">
          {current.server} · {current.binary}
        </p>
        <p className="mt-1 font-mono text-xs">{current.endpoint}</p>
        <p className="mt-3">{current.summary}</p>
        <p className="mt-2 text-sm">
          <strong>Quién puede usarlo.</strong> {current.who}
        </p>
        {current.tools.map((tool) => (
          <section key={tool.name} className="mt-4">
            <h3 className="font-semibold">{tool.name}</h3>
            <p className="text-sm">{tool.summary}</p>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {tool.fields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </section>
        ))}
        <h3 className="mt-4 font-semibold">Reglas</h3>
        <ul className="list-disc pl-5 text-sm">
          {current.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <h3 className="mt-4 font-semibold">Errores frecuentes</h3>
        <ul className="list-disc pl-5 text-sm">
          {current.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
        <div className="mt-4">
          <JsonBlock value={payloads[current.payloadKey]} label="Ejemplo JSON-RPC o forma de respuesta" />
        </div>
        <div className="mt-3">
          <FactList ids={current.factIds} />
        </div>
      </article>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Correction n={1} />
        <Correction n={7} />
      </div>
    </div>
  );
}
