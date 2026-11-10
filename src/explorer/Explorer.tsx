import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { swapsById } from '../content/swaps';
import { renderPlan } from '../vendor/isoplan/core';
import { graph } from './diagram';
import {
  DESKTOP_CANVAS,
  LABEL_FONT_DESKTOP,
  LABEL_FONT_MOBILE,
  activeLabelIds,
  formatViewBox,
  frameView,
  inkOn,
  parseViewBox,
  placeLabels,
  project,
  type Point,
  type ViewBox,
} from './labels';
import { scenarioById, scenarios, stepsFor, variantOf } from './scenarios';
import { useExplorer, type Speed } from './store';
import type { ExplorerStep, SceneEvent, ScenarioId } from './types';

const groups = [
  ['mensajes', 'Mensajes', '✉'],
  ['defensas', 'Defensas', '⛨'],
  ['control', 'Control', '⚙'],
  ['arquitectura', 'Piezas', '⧉'],
] as const;

const tabLabel: Record<string, string> = {
  detalle: 'Detalle',
  inspector: 'Inspector',
  codigo: 'Código',
  bitacora: 'Bitácora',
};

const packetFace: Record<string, string> = {
  text: '💬 texto',
  voice: '🎤 audio',
  image: '🖼 imagen',
  document: '📄 doc',
  encrypted: '🔒 cifrado',
  ticket: '🎫 ficha',
  https: '🔒 webhook',
  mcp: '🔌 mcp',
  'http-local': '↩ local',
  receipt: '✓ recibo',
  control: '⚙ control',
};

const speeds: Speed[] = [0.5, 1, 1.5, 2];

function packetsOf(step: ExplorerStep | undefined): Extract<SceneEvent, { type: 'packet' }>[] {
  return (step?.events.filter((event) => event.type === 'packet') ?? []) as Extract<SceneEvent, { type: 'packet' }>[];
}

export function Explorer() {
  const navigate = useNavigate();
  const params = useParams();
  const [search, setSearch] = useSearchParams();
  const scenarioId = (params.scenarioId as ScenarioId) || 'texto-privado';
  const def = scenarioById[scenarioId] ?? scenarios[0];
  const variant = variantOf(def, search.get('variante'));
  const steps = useMemo(() => stepsFor(def, variant), [def, variant]);
  const stepIndex = useExplorer((state) => state.stepIndex);
  const eventIndex = useExplorer((state) => state.eventIndex);
  const playing = useExplorer((state) => state.playing);
  const speed = useExplorer((state) => state.speed);
  const view = useExplorer((state) => state.view);
  const diagramOnly = useExplorer((state) => state.diagramOnly);
  const listOpen = useExplorer((state) => state.listOpen);
  const panelOpen = useExplorer((state) => state.panelOpen);
  const panel = useExplorer((state) => state.panel);
  const onePacket = useExplorer((state) => state.onePacket);
  const helpOpen = useExplorer((state) => state.helpOpen);
  const searchOpen = useExplorer((state) => state.searchOpen);
  const longOpen = useExplorer((state) => state.longOpen);
  const selectedNode = useExplorer((state) => state.selectedNode);
  const insideBox = useExplorer((state) => state.insideBox);
  const provider = useExplorer((state) => state.provider);
  const plan = useMemo(() => renderPlan(graph, { flows: false }), []);
  const fullView = useMemo(() => parseViewBox(plan.viewBox), [plan]);
  const svgRef = useRef<SVGSVGElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const packetChipRef = useRef<HTMLSpanElement>(null);
  const packetPoint = useRef<Point | null>(null);
  const cameraRef = useRef<ViewBox>(fullView);
  const compactRef = useRef(false);
  const [camera, setCamera] = useState<ViewBox>(fullView);
  const [focus, setFocus] = useState<'follow' | 'all'>('follow');
  const [compact, setCompact] = useState(false);
  const [stageSize, setStageSize] = useState(DESKTOP_CANVAS);
  const [tip, setTip] = useState<string | null>(null);
  const [seenStep, setSeenStep] = useState(stepIndex);
  if (seenStep !== stepIndex) {
    setSeenStep(stepIndex);
    setFocus('follow');
    setTip(null);
  }
  cameraRef.current = camera;
  compactRef.current = compact;
  const step = stepIndex >= 0 ? steps[Math.min(stepIndex, steps.length - 1)] : undefined;
  const activeId = selectedNode || step?.nodeId || def.start.nodes[0];
  const live = step ? `Paso ${stepIndex + 1} de ${steps.length}: ${step.title}. ${step.desc}` : def.overview.description;

  const paso = search.get('paso');
  useEffect(() => {
    const index = Number(paso);
    useExplorer.setState({
      scenarioId: def.id,
      variantId: variant.id,
      stepIndex: Number.isFinite(index) && index >= 1 ? index - 1 : -1,
      eventIndex: 0,
      playing: false,
      provider: variant.provider ?? 'gemini',
      insideBox: variant.insideBox !== false,
    });
  }, [def.id, variant.id, variant.provider, variant.insideBox, paso]);

  useEffect(() => {
    if (!playing) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wait = reduced ? 150 : 800 / speed;
    const timer = window.setTimeout(() => {
      const state = useExplorer.getState();
      const current = steps[state.stepIndex];
      if (!current || state.stepIndex < 0) {
        useExplorer.setState({ stepIndex: 0, eventIndex: 0, playing: !state.onePacket });
        return;
      }
      if (state.eventIndex < current.events.length - 1) {
        useExplorer.setState({ eventIndex: state.eventIndex + 1, playing: state.onePacket ? false : true });
        return;
      }
      if (state.stepIndex < steps.length - 1) {
        useExplorer.setState({ stepIndex: state.stepIndex + 1, eventIndex: 0, playing: state.onePacket ? false : true });
        return;
      }
      useExplorer.setState({ playing: false });
    }, wait);
    return () => window.clearTimeout(timer);
  }, [playing, speed, stepIndex, eventIndex, steps]);

  useEffect(() => {
    const root = svgRef.current;
    if (!root) return;
    const onClick = (event: MouseEvent) => {
      const piece = (event.target as Element).closest?.('.iso-piece');
      const id = piece?.getAttribute('data-id');
      if (id) useExplorer.getState().selectNode(id);
    };
    const onPieceKey = (event: KeyboardEvent) => {
      const piece = event.target as Element;
      if (!piece.classList?.contains('iso-piece')) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      useExplorer.getState().selectNode(piece.getAttribute('data-id'));
    };
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onPieceKey);
    return () => {
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onPieceKey);
    };
  }, [plan]);

  useEffect(() => {
    const root = svgRef.current;
    if (!root) return;
    root.querySelectorAll('.iso-piece').forEach((node) => {
      node.classList.toggle('is-on', node.getAttribute('data-id') === activeId);
    });
    const hot = [...(step?.events ?? [])].find((event) => event.type === 'packet');
    root.querySelectorAll('.iso-track').forEach((path) => {
      const edge = path.getAttribute('data-edge');
      path.classList.toggle('is-hot', Boolean(hot && hot.type === 'packet' && hot.edge === edge));
    });
    root.dataset.motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'cut' : 'move';
  }, [activeId, plan, step]);

  useEffect(() => {
    if (stepIndex < 0) {
      packetPoint.current = null;
      if (packetChipRef.current) packetChipRef.current.style.opacity = '0';
      return;
    }
    const packetEvent = [...(step?.events ?? [])].reverse().find((event) => event.type === 'packet');
    const anchor = plan.anchors[activeId];
    const path = packetEvent && packetEvent.type === 'packet'
      ? svgRef.current?.querySelector(`path[data-edge="${CSS.escape(packetEvent.edge)}"]`)
      : null;
    const park = (x: number, y: number) => {
      packetPoint.current = { x, y };
      const chip = packetChipRef.current;
      const stage = stageRef.current;
      if (!chip || !stage) return;
      const rect = stage.getBoundingClientRect();
      if (rect.width < 20) return;
      const screen = project({ x, y }, cameraRef.current, { width: rect.width, height: rect.height });
      chip.style.left = `${screen.x}px`;
      chip.style.top = `${screen.y}px`;
      chip.style.opacity = '1';
    };
    const drawable = path && 'getTotalLength' in path ? (path as SVGPathElement) : null;
    if (!drawable) {
      if (anchor) park(anchor.x, anchor.y);
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const total = drawable.getTotalLength();
    const paint = (t: number) => {
      const point = drawable.getPointAtLength(total * t);
      park(point.x, point.y);
    };
    if (reduced) {
      paint(0.72);
      return;
    }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(0.72, ((now - started) / (900 / speed)) * 0.72);
      paint(t);
      if (t < 0.72) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [step, stepIndex, activeId, plan, speed]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const apply = () => setCompact(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const rect = stage.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) return;
      setStageSize({ width: rect.width, height: rect.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [view, diagramOnly]);

  useEffect(() => {
    const packet = packetsOf(step).at(-1);
    const ids = step && focus === 'follow'
      ? [...new Set([packet?.from, packet?.to, step.nodeId].filter((id): id is string => Boolean(id)))]
      : [];
    const points = ids.map((id) => plan.anchors[id]).filter((point): point is Point => Boolean(point));
    const target = points.length ? frameView(points, fullView) : fullView;
    const from = cameraRef.current;
    const same = Math.abs(from.x - target.x) < 0.5 && Math.abs(from.y - target.y) < 0.5 && Math.abs(from.w - target.w) < 0.5 && Math.abs(from.h - target.h) < 0.5;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (same) return;
    if (reduced) {
      setCamera(target);
      return;
    }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / 420);
      const eased = 1 - (1 - t) ** 3;
      setCamera({
        x: from.x + (target.x - from.x) * eased,
        y: from.y + (target.y - from.y) * eased,
        w: from.w + (target.w - from.w) * eased,
        h: from.h + (target.h - from.h) * eased,
      });
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [step, focus, fullView, plan]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointers = new Map<number, { x: number; y: number }>();
    let origin: { px: number; py: number; view: ViewBox } | null = null;
    let pinch: { dist: number; view: ViewBox } | null = null;
    const down = (event: PointerEvent) => {
      if (!compactRef.current) return;
      if ((event.target as Element).closest('button, a, input')) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      stage.setPointerCapture(event.pointerId);
      origin = { px: event.clientX, py: event.clientY, view: cameraRef.current };
      pinch = null;
    };
    const move = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const rect = stage.getBoundingClientRect();
      if (pointers.size >= 2) {
        const [first, second] = [...pointers.values()];
        const dist = Math.hypot(first.x - second.x, first.y - second.y) || 1;
        if (!pinch) pinch = { dist, view: cameraRef.current };
        const ratio = pinch.dist / dist;
        const view = pinch.view;
        const w = Math.min(fullView.w, Math.max(fullView.w / 3.2, view.w * ratio));
        const h = w * (fullView.h / fullView.w);
        setCamera({ x: view.x + view.w / 2 - w / 2, y: view.y + view.h / 2 - h / 2, w, h });
        return;
      }
      if (!origin || rect.width < 20) return;
      const scale = Math.min(rect.width / origin.view.w, rect.height / origin.view.h) || 1;
      const dx = (event.clientX - origin.px) / scale;
      const dy = (event.clientY - origin.py) / scale;
      setCamera({ ...origin.view, x: origin.view.x - dx, y: origin.view.y - dy });
    };
    const up = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinch = null;
      if (!pointers.size) origin = null;
    };
    stage.addEventListener('pointerdown', down);
    stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);
    return () => {
      stage.removeEventListener('pointerdown', down);
      stage.removeEventListener('pointermove', move);
      stage.removeEventListener('pointerup', up);
      stage.removeEventListener('pointercancel', up);
    };
  }, [fullView, view]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select')) return;
      const state = useExplorer.getState();
      if (event.key === 'Escape') {
        state.setHelp(false);
        state.setSearch(false);
        state.setLong(false);
        if (state.stepIndex >= 0 && state.panel === 'inspector') state.setPanel('detalle');
        else state.goto(-1);
        return;
      }
      if (event.key === '?') state.setHelp(true);
      if (event.key === '/' || (event.key === 'k' && (event.metaKey || event.ctrlKey))) {
        event.preventDefault();
        state.setSearch(true);
      }
      if (event.key === ' ') {
        event.preventDefault();
        state.toggle();
      }
      if (event.key === 'ArrowRight') state.next();
      if (event.key === 'ArrowLeft') state.prev();
      if (event.key === 'v' || event.key === 'V') state.toggleView();
      if (event.key === 'd' || event.key === 'D') state.toggleDiagram();
      if (event.key === 'l' || event.key === 'L') state.toggleList();
      if (event.key === 't' || event.key === 'T') state.toggleTheme();
      if (event.key === 's' || event.key === 'S') state.togglePacket();
      if (event.key === '[') state.setSpeed(speeds[Math.max(0, speeds.indexOf(state.speed) - 1)] ?? 0.5);
      if (event.key === ']') state.setSpeed(speeds[Math.min(speeds.length - 1, speeds.indexOf(state.speed) + 1)] ?? 2);
      if (event.key === 'f' || event.key === 'F') document.documentElement.requestFullscreen?.().catch(() => undefined);
      if (event.key >= '1' && event.key <= '9') state.goto(Number(event.key) - 1);
      if (event.key === 'n' || event.key === 'p' || event.key === 'N' || event.key === 'P') {
        const index = scenarios.findIndex((item) => item.id === def.id);
        const delta = event.key.toLowerCase() === 'n' ? 1 : -1;
        const next = scenarios[(index + delta + scenarios.length) % scenarios.length];
        navigate(`/e/${next.id}`);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [def.id, navigate]);

  const swap = variant.swapId ? swapsById[variant.swapId] : undefined;
  const shownPackets = steps.slice(0, Math.max(0, stepIndex + 1)).flatMap(packetsOf);
  const currentPacket = packetsOf(step).at(-1);
  const done = stepIndex >= steps.length - 1 && !playing && stepIndex >= 0;
  const font = compact ? LABEL_FONT_MOBILE : LABEL_FONT_DESKTOP;
  const activeIds = activeLabelIds(step?.nodeId, currentPacket?.from, currentPacket?.to);
  const labelItems = plan.pieces
    .filter((piece) => !compact || activeIds.includes(piece.id))
    .map((piece) => ({ id: piece.id, label: piece.label, at: plan.anchors[piece.id] }));
  if (compact) {
    for (const area of plan.areas) {
      const at = plan.areaAnchors[area.id];
      if (area.name && at) labelItems.push({ id: `zone-${area.id}`, label: area.name, at });
    }
  }
  const boxes = placeLabels(labelItems, formatViewBox(camera), stageSize, font);
  const labelById = new Map(labelItems.map((item) => [item.id, item.label]));
  const notes = (step?.events.filter((event) => event.type === 'note') ?? []) as Extract<SceneEvent, { type: 'note' }>[];

  return (
    <div className={`explorer ${listOpen ? '' : 'is-list-off'} ${diagramOnly ? 'is-diagram' : ''}`} data-budget="all">
      <header className="topbar">
        <Link to="/e/texto-privado" className="brand">Wappi</Link>
        <p className="crumb">{def.name}</p>
        <button type="button" aria-label="Buscar" onClick={() => useExplorer.getState().setSearch(true)}>⌘K</button>
        <button type="button" aria-label="Tema" onClick={() => useExplorer.getState().toggleTheme()}>Tema</button>
        <button type="button" aria-label="Atajos" onClick={() => useExplorer.getState().setHelp(true)}>?</button>
        <span className="zones"><i className="z wa" /> WhatsApp <i className="z box" /> Box <i className="z brain" /> Cerebro</span>
        <Link to="/biblioteca">Biblioteca</Link>
      </header>
      <div className="explorer-body">
        <aside className={`scenario-list ${listOpen ? 'is-open' : ''}`} aria-label="Escenarios">
          <button type="button" className="drawer-close" onClick={() => useExplorer.getState().toggleList()}>Cerrar</button>
          {groups.map(([id, label, icon]) => (
            <div key={id}>
              <h2><span aria-hidden="true">{icon}</span> {label} <span>{scenarios.filter((item) => item.group === id).length}</span></h2>
              <ul>
                {scenarios.filter((item) => item.group === id).map((item) => (
                  <li key={item.id}>
                    <Link to={`/e/${item.id}`} aria-current={item.id === def.id ? 'page' : undefined}>{item.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>
        <div data-budget="scene">
          <div className="stage-tools">
            <button type="button" className="menu-button" aria-label="Escenarios" onClick={() => useExplorer.getState().toggleList()}>☰</button>
            <button type="button" aria-pressed={view === 'red'} onClick={() => useExplorer.getState().toggleView()}>{view === 'red' ? 'Red' : 'Secuencia'}</button>
            <button type="button" aria-pressed={diagramOnly} onClick={() => useExplorer.getState().toggleDiagram()}>Solo</button>
            <button type="button" aria-pressed={focus === 'all' || stepIndex < 0} onClick={() => setFocus('all')}>Ver todo</button>
          </div>
          {view === 'red' ? (
            <div ref={stageRef} className={`isoplan diagram ${stepIndex >= 0 ? 'is-playing' : ''}`}>
              <div className="iso-scene">
                <svg ref={svgRef} className="diagram-svg" role="img" aria-label="Diagrama de Wappi" viewBox={formatViewBox(camera)}>
                  <g dangerouslySetInnerHTML={{ __html: plan.svg }} />
                </svg>
              </div>
              <div className="label-layer">
                <svg className="label-stems" aria-hidden="true">
                  {boxes.map((box) => {
                    const cx = box.x + box.w / 2;
                    const cy = box.y + box.h;
                    if (Math.hypot(cx - box.ax, cy - box.ay) < 22) return null;
                    return <line key={box.id} x1={box.ax} y1={box.ay} x2={cx} y2={box.y + box.h} />;
                  })}
                </svg>
                {boxes.map((box) => (
                  <span key={box.id} className="node-chip" data-id={box.id} style={{ left: box.x, top: box.y, width: box.w, height: box.h, fontSize: box.font }}>
                    {labelById.get(box.id)}
                  </span>
                ))}
                {compact ? plan.pieces.filter((piece) => !activeIds.includes(piece.id)).map((piece) => {
                  const point = project(plan.anchors[piece.id], camera, stageSize);
                  return (
                    <button key={piece.id} type="button" className="node-dot" style={{ left: point.x, top: point.y }} aria-label={piece.label} onClick={() => setTip(piece.id)} />
                  );
                }) : null}
                {tip && plan.anchors[tip] ? (
                  <span className="node-chip is-tip" style={{ left: project(plan.anchors[tip], camera, stageSize).x, top: project(plan.anchors[tip], camera, stageSize).y - 28, fontSize: font }}>
                    {plan.pieces.find((piece) => piece.id === tip)?.label}
                  </span>
                ) : null}
                {notes.map((note) => {
                  const anchor = plan.anchors[note.at];
                  if (!anchor) return null;
                  const point = project(anchor, camera, stageSize);
                  return <span key={note.text} className={`node-chip note-chip note-${note.tone}`} style={{ left: point.x, top: point.y + 14, fontSize: font }}>{note.text}</span>;
                })}
                <span
                  ref={packetChipRef}
                  className="packet-face"
                  style={{ opacity: stepIndex >= 0 && currentPacket ? 1 : 0, background: inkOn(currentPacket?.color ?? '#1f9d6a'), fontSize: font }}
                >
                  {currentPacket ? packetFace[currentPacket.kind] : ''}
                </span>
              </div>
            </div>
          ) : (
            <div className="sequence" role="table" aria-label="Secuencia">
              <div role="row"><span role="columnheader">De</span><span role="columnheader">A</span><span role="columnheader">Tipo</span><span role="columnheader">Etapa</span></div>
              {steps.slice(0, stepIndex + 1).map((item) => (
                <div role="row" key={item.id}>
                  <span role="cell">{item.nodeId}</span>
                  <span role="cell">{item.title}</span>
                  <span role="cell">{item.stage ?? '—'}</span>
                  <span role="cell">{item.requestState ?? '—'}</span>
                </div>
              ))}
            </div>
          )}
          <ul className="legend" aria-label="Leyenda">
            {def.legend.map(([color, label]) => (
              <li key={label}><i style={{ background: color }} />{label}</li>
            ))}
          </ul>
          <div className="now">
            <p className="now-title"><span>{stepIndex < 0 ? 0 : stepIndex + 1} de {steps.length}</span> {step?.title ?? def.title}</p>
            <p className="now-desc">{step ? step.desc : def.overview.full}</p>
            <div className="dots" aria-hidden="true">
              {steps.map((item, index) => <i key={item.id} className={index === stepIndex ? 'is-on' : index < stepIndex ? 'is-done' : ''} />)}
            </div>
          </div>
          <div className="controls" role="group" aria-label="Reproducción">
            <button type="button" aria-label="Paso anterior" onClick={() => useExplorer.getState().prev()}>⏮</button>
            <button type="button" aria-label={playing ? 'Pausa' : 'Reproducir'} onClick={() => useExplorer.getState().toggle()}>{playing ? '❚❚' : '▶'}</button>
            <button type="button" aria-label="Paso siguiente" onClick={() => useExplorer.getState().next()}>⏭</button>
            <button type="button" aria-label="Repetir" onClick={() => useExplorer.getState().goto(-1)}>↺</button>
            <span role="menu" aria-label="Velocidad">
              {speeds.map((value) => (
                <button key={value} type="button" role="menuitemradio" aria-checked={speed === value} onClick={() => useExplorer.getState().setSpeed(value)}>{value}×</button>
              ))}
            </span>
            <button type="button" aria-pressed={onePacket} onClick={() => useExplorer.getState().togglePacket()}>1</button>
            <input aria-label="Scrubber" type="range" min={0} max={Math.max(0, steps.length - 1)} value={Math.max(0, stepIndex)} onChange={(event) => useExplorer.getState().goto(Number(event.target.value))} />
          </div>
        </div>
        {!diagramOnly && panelOpen ? (
          <aside className="panel" data-budget="panel">
            <div className="tabs" role="tablist">
              {(['detalle', 'inspector', 'codigo', 'bitacora'] as const).map((id) => (
                <button key={id} type="button" role="tab" aria-selected={panel === id} onClick={() => useExplorer.getState().setPanel(id)}>{tabLabel[id]}</button>
              ))}
            </div>
            {stepIndex < 0 ? <Overview def={def} onPlay={() => useExplorer.getState().goto(0)} /> : null}
            {step && panel === 'detalle' ? (
              <div className="detail">
                <h2>{step.title}</h2>
                <p className="lede">{step.desc}</p>
                <p>{step.detail}</p>
                <dl className="kv">
                  {step.facts.map(([label, value]) => (
                    <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                  ))}
                </dl>
                <p className={`badge badge-${step.certainty}`}>{step.certainty === 'general' ? 'Conocimiento general' : step.certainty === 'no-verificado' ? 'No verificado' : 'Verificado'}</p>
                <button type="button" onClick={() => useExplorer.getState().setLong(true)}>Leer más</button>
              </div>
            ) : null}
            {step && panel === 'inspector' ? <Inspector packets={shownPackets.length ? shownPackets : packetsOf(step)} /> : null}
            {step && panel === 'codigo' ? (
              <div>
                <p className="file">{step.code?.file}</p>
                <p>{step.code?.summary}</p>
                <pre>{(step.code?.pseudo ?? []).join('\n')}</pre>
              </div>
            ) : null}
            {panel === 'bitacora' ? (
              <ol className="log">
                {steps.slice(0, Math.max(0, stepIndex + 1)).map((item, index) => (
                  <li key={`${item.id}-${index}`}>{index + 1} {item.nodeId} {item.stage ?? '-'}</li>
                ))}
              </ol>
            ) : null}
            {done ? (
              <div className="outro">
                <h2>{def.outro.title}</h2>
                <p>{def.outro.desc}</p>
                <button type="button" onClick={() => useExplorer.getState().goto(0)}>Repetir</button>
              </div>
            ) : null}
            {def.id === 'cambiar-cerebro' ? (
              <SwapTray provider={provider} insideBox={insideBox && variant.insideBox !== false} swapId={variant.swapId} />
            ) : null}
            <div className="chips">
              {def.variants.map((item) => (
                <button key={item.id} type="button" aria-pressed={item.id === variant.id} onClick={() => setSearch({ variante: item.id, paso: '1' })}>{item.label}</button>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
      <p className="sr-only" aria-live="polite">{live}</p>
      {helpOpen ? <dialog open className="sheet" aria-label="Atajos"><p>Espacio, flechas, V, D, L, T, S, 1 a 9, interrogación.</p><button type="button" onClick={() => useExplorer.getState().setHelp(false)}>Cerrar</button></dialog> : null}
      {searchOpen ? <SearchBox onClose={() => useExplorer.getState().setSearch(false)} /> : null}
      {longOpen && step?.longBody ? <dialog open className="sheet" data-long="true"><p>{step.longBody}</p><button type="button" onClick={() => useExplorer.getState().setLong(false)}>Cerrar</button></dialog> : null}
      {swap ? <p className="sr-only">Pieza {swap.piece}. {insideBox ? 'Dentro' : 'Fuera'}.</p> : null}
    </div>
  );
}

function Overview({ def, onPlay }: { def: (typeof scenarios)[number]; onPlay: () => void }) {
  return (
    <div>
      <h2>{def.title}</h2>
      <p>{def.overview.description}</p>
      <button type="button" onClick={onPlay}>Ver pasos</button>
    </div>
  );
}

function Inspector({ packets }: { packets: Extract<SceneEvent, { type: 'packet' }>[] }) {
  const packet = packets.at(-1);
  if (!packet) return <p>Sin paquete en este paso.</p>;
  return (
    <div className="inspector">
      <p className="lede">{packetFace[packet.kind] ?? packet.label}</p>
      {(packet.layers ?? []).map((layer) => (
        <section key={layer.name} className="layer">
          <h3>{layer.name}</h3>
          {layer.fields.map((field) => (
            <div key={field.name} className="field">
              <div className="field-head"><strong>{field.name}</strong>{field.tag ? <em>{field.tag}</em> : null}</div>
              <code>{field.value}</code>
              {field.note ? <p>{field.note}</p> : null}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function SwapTray({ provider, insideBox, swapId }: { provider: string; insideBox: boolean; swapId?: string }) {
  const swap = swapId ? swapsById[swapId] : undefined;
  return (
    <div className="swap-tray">
      <p>Conocimiento general. Ejercicio.</p>
      {(['gemini', 'openai', 'otro'] as const).map((id) => (
        <button key={id} type="button" aria-pressed={provider === id} onClick={() => useExplorer.getState().setProvider(id)}>{id === 'otro' ? 'Otro' : id === 'gemini' ? 'Gemini' : 'OpenAI'}</button>
      ))}
      <button type="button" aria-pressed={insideBox} onClick={() => useExplorer.getState().setInside(!insideBox)}>{insideBox ? 'Dentro' : 'Fuera'}</button>
      {!insideBox ? <p>SOLO 127.0.0.1</p> : null}
      {swap ? <p>{Object.values(swap.effects).filter((item) => item === 'change').length} cambian</p> : null}
    </div>
  );
}

function SearchBox({ onClose }: { onClose: () => void }) {
  return (
    <dialog open className="sheet" aria-label="Buscar">
      <input aria-label="Buscar escenario" autoFocus onChange={(event) => {
        const query = event.target.value.toLowerCase();
        const hit = scenarios.find((item) => item.name.toLowerCase().includes(query) || item.id.includes(query));
        if (hit && query.length > 2) window.location.assign(`/e/${hit.id}`);
      }} />
      <button type="button" onClick={onClose}>Cerrar</button>
    </dialog>
  );
}
