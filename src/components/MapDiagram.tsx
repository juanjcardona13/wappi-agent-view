import { nodes, zones } from '../content/nodes';
import type { Lane, SwapEffect } from '../content/types';

const effectLabel: Record<SwapEffect, string> = {
  change: 'cambia',
  keep: 'se queda',
  contract: 'contrato',
};

export function MapDiagram({
  activeId,
  selectedId,
  onSelect,
  showSecondary = false,
  effects,
  compact = false,
}: {
  activeId?: string;
  selectedId?: string;
  onSelect?: (id: string) => void;
  showSecondary?: boolean;
  effects?: Record<string, SwapEffect>;
  compact?: boolean;
}) {
  const visible = nodes.filter((node) => showSecondary || !node.secondary);
  const renderLane = (lane: Lane, title: string) => {
    const laneNodes = visible.filter((node) => node.lane === lane);
    if (!laneNodes.length) return null;
    return (
      <div>
        <h3 className="mb-2 font-mono text-xs uppercase tracking-wide text-muted">{title}</h3>
        <ol className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {laneNodes.map((node) => {
            const effect = effects?.[node.id];
            const active = node.id === activeId;
            const selected = node.id === selectedId;
            const zoneClass = node.zone === 'whatsapp' ? 'text-wa' : node.zone === 'box' ? 'text-box' : 'text-brain';
            const className = `w-full rounded-2xl border bg-elev p-3 text-left shadow-card ${
              selected || active ? 'border-accent' : 'border-line'
            }`;
            const body = (
              <>
                <span className={`font-mono text-[11px] uppercase ${zoneClass}`}>{zones.find((item) => item.id === node.zone)?.title}</span>
                <span className="mt-1 block font-semibold">{node.title}</span>
                {compact ? null : <span className="mt-1 block text-sm text-muted">{node.summary}</span>}
                <span className="mt-2 flex flex-wrap gap-1">
                  {active ? <em className="rounded-full bg-accent px-2 py-0.5 text-xs not-italic text-[var(--on-accent)]">paquete</em> : null}
                  {effect ? (
                    <em className="rounded-full border border-line px-2 py-0.5 text-xs not-italic">{effectLabel[effect]}</em>
                  ) : null}
                </span>
              </>
            );
            return (
              <li key={node.id}>
                {onSelect ? (
                  <button type="button" className={className} aria-current={active ? 'step' : undefined} onClick={() => onSelect(node.id)}>
                    {body}
                  </button>
                ) : (
                  <div className={className}>{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-2 sm:grid-cols-3" aria-hidden="true">
        {zones.map((zone) => (
          <p key={zone.id} className="rounded-xl border border-line bg-bg px-3 py-2 text-sm">
            <strong className="block">{zone.title}</strong>
            <span className="text-muted">{zone.blurb}</span>
          </p>
        ))}
      </div>
      {renderLane('ida', 'Ida · del teléfono al cerebro')}
      {renderLane('vuelta', 'Vuelta · del cerebro al teléfono')}
      {showSecondary ? renderLane('lateral', 'Flujos secundarios') : null}
    </div>
  );
}
