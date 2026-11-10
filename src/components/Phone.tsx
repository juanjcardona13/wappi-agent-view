import type { PhoneBubble, PhoneEffect, Step } from '../content/types';

interface Shown {
  bubble: PhoneBubble;
  ticks?: 'accepted' | 'delivered' | 'read';
}

const tickText = {
  accepted: '✓ aceptado',
  delivered: '✓✓ entregado',
  read: '✓✓ leído',
};

function effects(step: Step): PhoneEffect[] {
  if (!step.phoneEffect) return [];
  return Array.isArray(step.phoneEffect) ? step.phoneEffect : [step.phoneEffect];
}

export function projectPhone(steps: Step[], index: number): Shown[] {
  const shown: Shown[] = [];
  for (let cursor = 0; cursor <= index && cursor < steps.length; cursor += 1) {
    for (const effect of effects(steps[cursor])) {
      if (effect.type === 'bubble') shown.push({ bubble: effect.bubble });
      if (effect.type === 'ticks') {
        for (const item of shown) {
          if (item.bubble.kind !== 'note' && item.bubble.from === 'wappi') item.ticks = effect.level;
        }
      }
    }
  }
  return shown;
}

function BubbleView({ item }: { item: Shown }) {
  if (item.bubble.kind === 'note') {
    return <p className="rounded-xl bg-bg px-3 py-2 text-center text-xs text-muted">{item.bubble.text}</p>;
  }
  const mine = item.bubble.from === 'user';
  const label =
    item.bubble.kind === 'text'
      ? item.bubble.text
      : item.bubble.kind === 'voice'
        ? item.bubble.label
        : item.bubble.kind === 'image'
          ? item.bubble.label
          : item.bubble.label;
  return (
    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${mine ? 'ml-auto bg-accent text-[var(--on-accent)]' : 'bg-bg'}`}>
      <p className="text-[10px] uppercase tracking-wide opacity-70">{mine ? 'Tú' : 'Wappi'}</p>
      {item.bubble.kind === 'voice' ? <p>Nota de voz · {label}</p> : null}
      {item.bubble.kind === 'image' ? <p>Imagen · {label}</p> : null}
      {item.bubble.kind === 'document' ? <p>Documento · {label}</p> : null}
      {item.bubble.kind === 'text' ? <p>{label}</p> : null}
      {!mine && item.ticks ? (
        <p className={`mt-1 text-xs ${item.ticks === 'read' ? 'text-box' : 'text-muted'}`}>{tickText[item.ticks]}</p>
      ) : null}
    </div>
  );
}

export function Phone({ steps, index, title }: { steps: Step[]; index: number; title: string }) {
  const items = projectPhone(steps, index);
  return (
    <section className="rounded-[2rem] border border-line bg-elev p-3 shadow-card" aria-label="Teléfono simulado">
      <div className="rounded-[1.5rem] border border-line bg-elev">
        <header className="border-b border-line px-4 py-3">
          <p className="text-xs text-muted">Teléfono simulado</p>
          <p className="font-semibold">{title}</p>
        </header>
        <div className="flex min-h-64 flex-col gap-2 px-3 py-3">
          {items.length ? items.map((item, itemIndex) => <BubbleView key={itemIndex} item={item} />) : <p className="text-sm text-muted">Aún no hay burbujas.</p>}
        </div>
      </div>
    </section>
  );
}
