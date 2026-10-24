/**
 * In-process TTL + LRU cache with request coalescing.
 *
 *  - `wrap(key, ttlMs, load)` returns the cached value or runs `load` once, however many callers ask at the same time
 *    (a stampede of identical dashboard requests costs one database round-trip).
 *  - Keys are namespaced strings; `deletePrefix('s:42:')` drops everything cached for student 42 in one call.
 *  - Cached objects are deep-frozen so a caller can never corrupt what another caller will read.
 *
 * It is deliberately per-process. With several server instances, entries are at most one TTL out of date, which is why
 * every TTL here is seconds, not minutes, for anything student-specific.
 */
export class TtlCache {
  #entries = new Map();            // key → { value, expires }   (Map keeps insertion order → cheap LRU)
  #inflight = new Map();           // key → Promise
  #max;
  #now;
  hits = 0;
  misses = 0;

  constructor({ max = 2000, now = Date.now } = {}) {
    this.#max = max;
    this.#now = now;
  }

  get size() { return this.#entries.size; }

  get(key) {
    const entry = this.#entries.get(key);
    if (!entry) { this.misses += 1; return undefined; }
    if (entry.expires <= this.#now()) { this.#entries.delete(key); this.misses += 1; return undefined; }
    this.#entries.delete(key);                      // refresh recency
    this.#entries.set(key, entry);
    this.hits += 1;
    return entry.value;
  }

  set(key, value, ttlMs) {
    if (value === undefined) return value;
    this.#entries.delete(key);
    this.#entries.set(key, { value: deepFreeze(value), expires: this.#now() + ttlMs });
    while (this.#entries.size > this.#max) this.#entries.delete(this.#entries.keys().next().value);
    return value;
  }

  async wrap(key, ttlMs, load) {
    const hit = this.get(key);
    if (hit !== undefined) return hit;
    if (this.#inflight.has(key)) return this.#inflight.get(key);
    const pending = (async () => {
      try {
        const value = await Promise.resolve().then(load);   // also turns a synchronous throw into a rejection
        // a write that landed while we were loading must not be overwritten by our (older) read
        if (this.#inflight.get(key) === pending) this.set(key, value, ttlMs);
        return value;
      } finally {
        if (this.#inflight.get(key) === pending) this.#inflight.delete(key);
      }
    })();
    this.#inflight.set(key, pending);
    return pending;
  }

  delete(key) { this.#inflight.delete(key); return this.#entries.delete(key); }

  deletePrefix(prefix) {
    for (const key of [...this.#entries.keys()]) if (key.startsWith(prefix)) this.#entries.delete(key);
    for (const key of [...this.#inflight.keys()]) if (key.startsWith(prefix)) this.#inflight.delete(key);   // discard in-flight reads that started before the write
  }

  clear() { this.#entries.clear(); this.#inflight.clear(); }
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value) && !Buffer.isBuffer(value) && !(value instanceof Date)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}

/** The one cache the app shares. Key scheme: `g:*` global reference data, `s:<studentId>:*` per-student read models. */
export const appCache = new TtlCache({ max: 5000 });
export const studentKey = (studentId, name) => `s:${studentId}:${name}`;
export const forgetStudent = (studentId) => appCache.deletePrefix(`s:${studentId}:`);
