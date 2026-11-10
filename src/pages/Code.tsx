import { useEffect, useState } from 'react';
import { Certainty, FactList, PageIntro } from '../components/ui';
import { commands, dependencies, homes, tree, type ModuleNode } from '../content/modules';

function NodeView({ node, onPick }: { node: ModuleNode; onPick: (node: ModuleNode) => void }) {
  return (
    <li>
      <button type="button" className="text-left underline" onClick={() => onPick(node)}>
        {node.name}
      </button>
      {node.children ? (
        <ul className="ml-4 mt-1 space-y-1 border-l border-line pl-3">
          {node.children.map((child) => (
            <NodeView key={child.id} node={child} onPick={onPick} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function CodePage() {
  const [picked, setPicked] = useState<ModuleNode>(tree[0]);
  useEffect(() => {
    document.title = 'Recorrido por el código · Wappi View';
  }, []);
  return (
    <div>
      <PageIntro
        kicker="Sin pegar el fuente"
        title="Dónde vive cada cosa"
        lede="Rutas, nombres y el para qué. El repositorio privado no se copia aquí. Si un comando solo tiene nombre en la hoja, se dice así."
      />
      <ul className="grid gap-3 md:grid-cols-2">
        {homes.map((home) => (
          <li key={home.title} className="rounded-2xl border border-line bg-elev p-4">
            <h2 className="font-serif text-2xl">{home.title}</h2>
            <p className="mt-2 text-sm">{home.body}</p>
            <div className="mt-2">
              <FactList ids={home.factIds} />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-8 grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <nav aria-label="Árbol del repo">
          <ul className="space-y-2 font-mono text-sm">
            {tree.map((node) => (
              <NodeView key={node.id} node={node} onPick={setPicked} />
            ))}
          </ul>
        </nav>
        <article className="rounded-2xl border border-line bg-elev p-4" aria-live="polite">
          <h2 className="font-serif text-3xl">{picked.name}</h2>
          <p className="mt-2">{picked.purpose}</p>
          <p className="mt-2 text-sm text-muted">{picked.summary}</p>
          <h3 className="mt-4 font-semibold">Archivos</h3>
          <ul className="mt-1 font-mono text-sm">
            {picked.files.map((file) => (
              <li key={file}>{file}</li>
            ))}
          </ul>
          <h3 className="mt-4 font-semibold">Con qué habla</h3>
          <p className="text-sm">{picked.talksTo}</p>
          <h3 className="mt-4 font-semibold">Lo que cambiarías aquí si…</h3>
          <p className="text-sm">{picked.changeIf}</p>
          <div className="mt-3">
            <FactList ids={picked.factIds} />
          </div>
        </article>
      </div>
      <section className="mt-8">
        <h2 className="font-serif text-2xl">Dependencias entre módulos</h2>
        <p className="mt-1 text-sm text-muted">main llega a runtime. runtime reparte. El HTTP local entra a runtime. return-mcp no importa el runtime: llama a /v1/complete.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {dependencies.map((edge) => (
            <li key={`${edge.from}-${edge.to}`} className="rounded-xl border border-line bg-bg px-3 py-2 text-sm">
              <span className="font-mono">{edge.from}</span> → <span className="font-mono">{edge.to}</span>
              <span className="block text-muted">{edge.label}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-8 overflow-x-auto">
        <h2 className="font-serif text-2xl">Comandos del binario</h2>
        <p className="mt-1 text-sm">link y proactive-reset piden el OK de Juanjo. No los lances desde esta página: aquí no hay puente.</p>
        <table className="mt-3 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="py-2 pr-3">Comando</th>
              <th className="py-2 pr-3">Qué se sabe</th>
              <th className="py-2">Etiqueta</th>
            </tr>
          </thead>
          <tbody>
            {commands.map((command) => (
              <tr key={command.name} className="border-b border-line align-top">
                <td className="py-2 pr-3 font-mono">{command.name}</td>
                <td className="py-2 pr-3">
                  {command.caution ? <strong className="mr-1">Requiere OK.</strong> : null}
                  {command.summary}
                </td>
                <td className="py-2">
                  <Certainty value={command.certainty} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
