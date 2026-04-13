/**
 * Graphene renvoie souvent du camelCase; le reste du code attend du snake_case (comme le REST DRF).
 */

function camelToSnakeKey(key: string): string {
  if (!/[A-Z]/.test(key)) return key;
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

export function deepSnakify<T = unknown>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T;
  if (Array.isArray(obj)) return obj.map((x) => deepSnakify(x)) as T;
  if (typeof obj !== 'object') return obj as T;
  const o = obj as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    const nk = camelToSnakeKey(k);
    out[nk] = deepSnakify(v);
  }
  return out as T;
}
