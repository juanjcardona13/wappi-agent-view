import raw from '../../docs/sample-payloads.json';

export const payloads = raw as Record<string, unknown>;

export function deepMerge(base: unknown, patch: unknown): unknown {
  if (patch === undefined) return base;
  if (Array.isArray(patch)) return patch;
  if (patch === null) return null;
  if (typeof patch !== 'object') return patch;
  const baseObj =
    base && typeof base === 'object' && !Array.isArray(base)
      ? (base as Record<string, unknown>)
      : {};
  const out: Record<string, unknown> = { ...baseObj };
  for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
    out[key] = deepMerge(baseObj[key], value);
  }
  return out;
}

export function resolvePayload(key: string | undefined, patch: unknown): unknown | undefined {
  if (!key) return undefined;
  const base = payloads[key];
  if (base === undefined) return patch ?? { _nota: `No existe la clave ${key} en sample-payloads.json` };
  if (patch === undefined) return base;
  return deepMerge(structuredClone(base), patch);
}
