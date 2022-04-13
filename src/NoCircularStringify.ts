
export function noCircularStringify(value: any, replacer?: (this: any, k: string, v: any) => string, space?: string | number): string {
  let cache = new Set<any>();
  return JSON.stringify(value, (k: string, v: any) => {
    if (v != null && typeof v == 'object') {
      if (cache.has(v)) return '[circular ref]';
      else cache.add(v);
    }
    return replacer ? replacer(k, v) : v;
  }, space);
}