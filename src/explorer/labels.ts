/** Screen-space label layout. Sizes stay in CSS pixels when the diagram zooms. */

export const LABEL_FONT_DESKTOP = 13;
export const LABEL_FONT_MOBILE = 12;
export const LABEL_INK = '#0f172a';
export const LABEL_PAPER = '#ffffff';
/** Legend and zone key. Same hex as `--ink` / `--bg` in index.css. */
export const LEGEND_LIGHT = { fg: '#13314a', bg: '#f6f8f6' };
export const LEGEND_DARK = { fg: '#dcecef', bg: '#0c1519' };
/**
 * Diagram stage at 1280×800 with the sidebar and panel open.
 * The overlap test uses this canvas, which is the default desktop camera.
 */
export const DESKTOP_CANVAS = { width: 760, height: 500 };

/** Extra shift, in CSS pixels, from the default spot above the node. */
export const LABEL_OFFSET: Record<string, { dx: number; dy: number }> = {
  phone: { dx: 0, dy: 6 },
  'wa-servers': { dx: 36, dy: 0 },
  'linked-device': { dx: 28, dy: 10 },
  routine: { dx: -8, dy: 0 },
  agent: { dx: 24, dy: 8 },
  baileys: { dx: -20, dy: 0 },
  sqlite: { dx: -28, dy: 4 },
  dispatcher: { dx: -16, dy: 0 },
  receipts: { dx: 8, dy: 12 },
  'box-tools': { dx: 20, dy: 8 },
  'mcp-admin': { dx: 0, dy: 14 },
};

export interface Point {
  x: number;
  y: number;
}

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LabelBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  ax: number;
  ay: number;
  font: number;
}

export function parseViewBox(value: string): ViewBox {
  const [x, y, w, h] = value.split(/[\s,]+/).map(Number);
  return { x, y, w, h };
}

export function formatViewBox(view: ViewBox): string {
  return `${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}`;
}

export function project(point: Point, view: ViewBox, canvas: { width: number; height: number }): Point {
  const scale = Math.min(canvas.width / view.w, canvas.height / view.h);
  const ox = (canvas.width - view.w * scale) / 2;
  const oy = (canvas.height - view.h * scale) / 2;
  return { x: ox + (point.x - view.x) * scale, y: oy + (point.y - view.y) * scale };
}

/** Width and height of a pill, including padding and the 1px border. */
export function labelMetrics(text: string, fontPx: number): { width: number; height: number } {
  const width = Math.ceil(text.length * fontPx * 0.58 + 18);
  const height = fontPx + 11;
  return { width, height };
}

export function boxesOverlap(a: LabelBox, b: LabelBox, gap = 4): boolean {
  return a.x < b.x + b.w + gap && a.x + a.w + gap > b.x && a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;
}

function preferred(item: { id: string; label: string; at: Point }, view: ViewBox, canvas: { width: number; height: number }, font: number): LabelBox {
  const point = project(item.at, view, canvas);
  const { width, height } = labelMetrics(item.label, font);
  const offset = LABEL_OFFSET[item.id] ?? { dx: 0, dy: 0 };
  return {
    id: item.id,
    x: point.x - width / 2 + offset.dx,
    y: point.y - height - 8 + offset.dy,
    w: width,
    h: height,
    ax: point.x,
    ay: point.y,
    font,
  };
}

/** Place every label above its node, then push pills apart until they clear. */
export function placeLabels(
  items: { id: string; label: string; at: Point }[],
  viewBox: string,
  canvas: { width: number; height: number },
  font: number,
): LabelBox[] {
  const view = parseViewBox(viewBox);
  const boxes = items.map((item) => preferred(item, view, canvas, font));
  const margin = 2;
  const gap = 4;
  for (let pass = 0; pass < 80; pass += 1) {
    let hit = false;
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        if (!boxesOverlap(a, b, gap)) continue;
        hit = true;
        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        const push = (Math.min(overlapX, overlapY) + gap) / 2;
        if (overlapX < overlapY) {
          const dir = b.x + b.w / 2 >= a.x + a.w / 2 ? 1 : -1;
          a.x -= dir * push;
          b.x += dir * push;
        } else {
          const dir = b.y + b.h / 2 >= a.y + a.h / 2 ? 1 : -1;
          a.y -= dir * push;
          b.y += dir * push;
        }
      }
    }
    for (const box of boxes) {
      box.x = Math.min(Math.max(box.x, margin), canvas.width - box.w - margin);
      box.y = Math.min(Math.max(box.y, margin), canvas.height - box.h - margin);
    }
    if (!hit) break;
  }
  return boxes;
}

/** Frame the active node (last point) at about 2.5×, keeping the plan's aspect. */
export function frameView(points: Point[], full: ViewBox): ViewBox {
  if (!points.length) return full;
  const focus = points[points.length - 1];
  const aspect = full.w / full.h;
  const w = full.w * 0.4;
  const h = w / aspect;
  const x = Math.min(Math.max(focus.x - w * 0.5, full.x), full.x + full.w - w);
  const y = Math.min(Math.max(focus.y - h * 0.42, full.y), full.y + full.h - h);
  return { x, y, w, h };
}

export function activeLabelIds(nodeId: string | undefined, from?: string, to?: string): string[] {
  return [...new Set([nodeId, from, to].filter((id): id is string => Boolean(id)))];
}

function channel(hex: string, index: number): number {
  const value = parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  return 0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 1) + 0.0722 * channel(hex, 2);
}

export function contrast(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

/** Darken a fill until white type on it reaches WCAG AA. */
export function inkOn(fill: string): string {
  let color = fill;
  for (let step = 0; step < 10 && contrast('#ffffff', color) < 4.5; step += 1) {
    const mixed = [0, 1, 2].map((index) => Math.round(parseInt(color.slice(1 + index * 2, 3 + index * 2), 16) * 0.82));
    color = `#${mixed.map((part) => part.toString(16).padStart(2, '0')).join('')}`;
  }
  return color;
}
