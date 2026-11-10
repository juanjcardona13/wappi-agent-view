import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { MapDiagram } from '../components/MapDiagram';
import { Phone } from '../components/Phone';
import { Certainty, FactList, JsonBlock, PageIntro, stepPayload } from '../components/ui';
import {
  adminOptions,
  chatHeader,
  chatOptions,
  faultOptions,
  inputOptions,
  proactiveFaultOptions,
  replyOptions,
} from '../content/labels';
import type { AdminSituation, Fault, ProactiveFault, Scenario } from '../content/types';
import { buildAdminJourney, buildJourney, buildProactiveJourney } from '../lib/journey';

type Mode = 'viaje' | 'proactivo' | 'admin';
type Speed = 0.5 | 1 | 2;

function asEnum<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function SimulatorPage() {
  const reduced = useReducedMotion();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>(asEnum(params.get('modo'), ['viaje', 'proactivo', 'admin'] as const, 'viaje'));
  const [scenario, setScenario] = useState<Scenario>({
    input: asEnum(params.get('entrada'), inputOptions.map((item) => item.id), 'text'),
    chat: asEnum(params.get('chat'), chatOptions.map((item) => item.id), 'owner'),
    reply: asEnum(params.get('respuesta'), replyOptions.map((item) => item.id), 'text'),
    fault: asEnum(params.get('fallo'), faultOptions.map((item) => item.id), 'none'),
    voiceRequested: params.get('pidio-voz') === '1',
  });
  const [hour, setHour] = useState<'day' | 'quiet'>(params.get('hora') === 'quiet' ? 'quiet' : 'day');
  const [reactiveBusy, setReactiveBusy] = useState(params.get('en-vuelo') === '1');
  const [proFault, setProFault] = useState<ProactiveFault>(asEnum(params.get('guarda'), proactiveFaultOptions.map((item) => item.id), 'none'));
  const [admin, setAdmin] = useState<AdminSituation>(asEnum(params.get('admin'), adminOptions.map((item) => item.id), 'allow'));
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);

  const steps = useMemo(() => {
    if (mode === 'proactivo') return buildProactiveJourney({ hour, reactiveBusy, fault: proFault });
    if (mode === 'admin') return buildAdminJourney({ situation: admin });
    return buildJourney(scenario);
  }, [mode, scenario, hour, reactiveBusy, proFault, admin]);

  const signature = JSON.stringify({ mode, scenario, hour, reactiveBusy, proFault, admin });
  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [signature]);

  useEffect(() => {
    document.title = 'Simulador · Wappi View';
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => {
        if (current >= steps.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1600 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, index, speed, steps.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select')) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setPlaying(false);
        setIndex((current) => Math.min(steps.length - 1, current + 1));
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setPlaying(false);
        setIndex((current) => Math.max(0, current - 1));
      } else if (event.key === ' ' && !target?.closest('button, a, summary')) {
        event.preventDefault();
        setPlaying((value) => !value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [steps.length]);

  const step = steps[Math.min(index, steps.length - 1)];
  const phoneTitle = mode === 'viaje' ? chatHeader[scenario.chat] : mode === 'proactivo' ? 'Proactivo · alias owner' : 'Admin no escribe en el chat';

  return (
    <div>
      <PageIntro
        kicker="Todo ocurre en el navegador"
        title="Simulador"
        lede="Elige la entrada, el chat, el formato de vuelta y, si quieres, un fallo. El paquete recorre el mapa. La velocidad es de la animación: no hay latencias medidas."
      />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Modo">
        {(
          [
            ['viaje', 'Viaje de un mensaje'],
            ['proactivo', 'Proactivo'],
            ['admin', 'Admin'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" aria-pressed={mode === id} className={`rounded-full px-3 py-1 text-sm ${mode === id ? 'bg-ink text-bg' : 'border border-line'}`} onClick={() => setMode(id)}>
            {label}
          </button>
        ))}
      </div>
      {mode === 'viaje' ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Chooser legend="Tipo de entrada" name="entrada" value={scenario.input} options={inputOptions} onChange={(input) => setScenario({ ...scenario, input })} />
          <Chooser legend="Tipo de chat" name="chat" value={scenario.chat} options={chatOptions} onChange={(chat) => setScenario({ ...scenario, chat })} />
          <Chooser legend="Formato de respuesta" name="respuesta" value={scenario.reply} options={replyOptions} onChange={(reply) => setScenario({ ...scenario, reply })} />
          <label className="block text-sm">
            <span className="font-semibold">Inyectar fallo</span>
            <select
              className="mt-1 w-full rounded-xl border border-line bg-elev px-3 py-2"
              value={scenario.fault}
              onChange={(event) => setScenario({ ...scenario, fault: event.target.value as Fault })}
            >
              {faultOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {scenario.reply === 'voice' ? (
            <label className="flex items-start gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={Boolean(scenario.voiceRequested)}
                onChange={(event) => setScenario({ ...scenario, voiceRequested: event.target.checked })}
              />
              <span>La persona pidió la nota de voz de forma explícita. Si no, verás el aviso: un audio entrante no cuenta como pedir voz.</span>
            </label>
          ) : null}
        </div>
      ) : null}
      {mode === 'proactivo' ? (
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            Hora en Bogotá
            <select className="mt-1 w-full rounded-xl border border-line bg-elev px-3 py-2" value={hour} onChange={(event) => setHour(event.target.value as 'day' | 'quiet')}>
              <option value="day">Día, fuera de 22–07</option>
              <option value="quiet">23:00, hora de silencio</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={reactiveBusy} onChange={(event) => setReactiveBusy(event.target.checked)} />
            Hay una respuesta entrante en vuelo
          </label>
          <label className="text-sm">
            Guarda extra
            <select className="mt-1 w-full rounded-xl border border-line bg-elev px-3 py-2" value={proFault} onChange={(event) => setProFault(event.target.value as ProactiveFault)}>
              {proactiveFaultOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      {mode === 'admin' ? (
        <Chooser legend="Qué pide Juanjo" name="admin" value={admin} options={adminOptions} onChange={setAdmin} />
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Reproducción">
        <button type="button" className="rounded-full border border-line px-3 py-1" onClick={() => { setPlaying(false); setIndex((current) => Math.max(0, current - 1)); }}>
          Paso anterior
        </button>
        <button type="button" className="rounded-full bg-accent px-3 py-1 text-[var(--on-accent)]" onClick={() => setPlaying((value) => !value)}>
          {playing ? 'Pausa' : 'Play'}
        </button>
        <button type="button" className="rounded-full border border-line px-3 py-1" onClick={() => { setPlaying(false); setIndex((current) => Math.min(steps.length - 1, current + 1)); }}>
          Paso siguiente
        </button>
        <button type="button" className="rounded-full border border-line px-3 py-1" onClick={() => { setPlaying(false); setIndex(0); }}>
          Reiniciar
        </button>
        {([0.5, 1, 2] as const).map((value) => (
          <button key={value} type="button" aria-pressed={speed === value} className="rounded-full border border-line px-3 py-1 text-sm" onClick={() => setSpeed(value)}>
            {value}×
          </button>
        ))}
        <span className="text-sm text-muted">
          Paso {index + 1} de {steps.length}. Teclas ← → y espacio, si el foco no está en un control.
        </span>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <MapDiagram
          activeId={step.nodeId}
          showSecondary={mode !== 'viaje'}
          onSelect={(nodeId) => {
            const found = steps.findIndex((item) => item.nodeId === nodeId);
            if (found >= 0) {
              setPlaying(false);
              setIndex(found);
            }
          }}
        />
        <div className="space-y-4">
          <motion.article
            key={step.id + signature}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-line bg-elev p-4 shadow-card"
            aria-live="polite"
          >
            <p className="text-xs uppercase text-muted">
              {step.lane === 'ida' ? 'Ida' : step.lane === 'vuelta' ? 'Vuelta' : 'Lateral'} · paso {step.id}
            </p>
            <h2 className="font-serif text-3xl">{step.title}</h2>
            <p className="mt-1 text-sm">
              <strong>Actor:</strong> {step.actor}
            </p>
            <p className="font-mono text-xs text-muted">{step.codePath}</p>
            <p className="mt-3">{step.body}</p>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted">Etapa</dt>
                <dd className="font-mono">{step.stage ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Petición</dt>
                <dd className="font-mono">{step.requestState ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Salida</dt>
                <dd className="font-mono">{step.outboxState ?? '—'}</dd>
              </div>
            </dl>
            <div className="mt-3">
              <Certainty value={step.certainty} />
            </div>
            <div className="mt-3">
              <JsonBlock value={stepPayload(step)} />
            </div>
            <div className="mt-3">
              <FactList ids={step.factIds} />
            </div>
          </motion.article>
          {index === steps.length - 1 && step.terminal ? (
            <aside className="rounded-2xl border border-accent bg-accent/10 p-4">
              <h2 className="font-serif text-2xl">{step.terminal.outcome}</h2>
              <p className="mt-1 text-sm font-semibold">Qué aprendiste</p>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {step.terminal.lesson.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </aside>
          ) : null}
          <Phone steps={steps} index={index} title={phoneTitle} />
          <section aria-label="Bitácora">
            <h2 className="font-semibold">Bitácora</h2>
            <ol className="mt-2 max-h-56 space-y-1 overflow-auto font-mono text-xs">
              {steps.slice(0, index + 1).map((item) => (
                <li key={item.id}>
                  {item.id} actor={item.actor} etapa={item.stage ?? '-'} estado={item.requestState ?? '-'} outbox={item.outboxState ?? '-'}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
      <details className="mt-6">
        <summary>Tabla de todos los pasos de este camino</summary>
        <ol className="mt-2 space-y-2 text-sm">
          {steps.map((item, itemIndex) => (
            <li key={item.id}>
              <button type="button" className="text-left" onClick={() => { setPlaying(false); setIndex(itemIndex); }}>
                <strong>{item.id}. {item.title}</strong> — {item.actor}. {item.codePath}
              </button>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

function Chooser<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string;
  name: string;
  value: T;
  options: { id: T; label: string; hint?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{legend}</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.id} className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${value === option.id ? 'border-accent bg-accent text-[var(--on-accent)]' : 'border-line'}`}>
            <input className="sr-only" type="radio" name={name} value={option.id} checked={value === option.id} onChange={() => onChange(option.id)} />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
