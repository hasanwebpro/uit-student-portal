import test from 'node:test';
import assert from 'node:assert/strict';
import { TtlCache } from '../server/lib/cache.js';

const clock = () => { let t = 1_000; return { now: () => t, tick: (ms) => { t += ms; } }; };

test('cache: hit, expiry, miss accounting', () => {
  const c = clock(); const cache = new TtlCache({ now: c.now });
  cache.set('a', { n: 1 }, 100);
  assert.deepEqual(cache.get('a'), { n: 1 });
  c.tick(101);
  assert.equal(cache.get('a'), undefined);
  assert.equal(cache.hits, 1); assert.equal(cache.misses, 1);
});

test('cache: LRU eviction keeps the recently used entry', () => {
  const cache = new TtlCache({ max: 2 });
  cache.set('a', 1, 1000); cache.set('b', 2, 1000);
  cache.get('a');                       // a is now most recent
  cache.set('c', 3, 1000);              // evicts b
  assert.equal(cache.get('b'), undefined);
  assert.equal(cache.get('a'), 1); assert.equal(cache.get('c'), 3);
});

test('cache: concurrent wrap() calls share ONE load (stampede protection)', async () => {
  const cache = new TtlCache(); let loads = 0;
  const load = async () => { loads += 1; await new Promise((r) => setTimeout(r, 10)); return { ok: true }; };
  const results = await Promise.all(Array.from({ length: 25 }, () => cache.wrap('k', 1000, load)));
  assert.equal(loads, 1); assert.ok(results.every((r) => r === results[0]));
  await cache.wrap('k', 1000, load);
  assert.equal(loads, 1, 'served from cache afterwards');
});

test('cache: failed loads are not cached and do not poison later calls', async () => {
  const cache = new TtlCache(); await assert.rejects(cache.wrap('k', 1000, async () => { throw new Error('db down'); }), /db down/);
  await assert.rejects(cache.wrap('k', 1000, () => { throw new Error('sync boom'); }), /sync boom/);
  assert.equal(await cache.wrap('k', 1000, async () => 'fine'), 'fine');
});

test('cache: invalidating while a load is in flight stops the stale read from being stored', async () => {
  const cache = new TtlCache(); let release; const gate = new Promise((r) => { release = r; });
  const pending = cache.wrap('s:1:dash', 1000, async () => { await gate; return 'old'; });
  cache.deletePrefix('s:1:');           // a write happened after the read started
  release();
  assert.equal(await pending, 'old');   // the caller that started it still gets its answer …
  assert.equal(cache.get('s:1:dash'), undefined, '… but it is not kept');
});

test('cache: deletePrefix drops one student and leaves the others', () => {
  const cache = new TtlCache();
  cache.set('s:1:a', 1, 1000); cache.set('s:1:b', 2, 1000); cache.set('s:12:a', 3, 1000); cache.set('g:x', 4, 1000);
  cache.deletePrefix('s:1:');
  assert.equal(cache.get('s:1:a'), undefined); assert.equal(cache.get('s:1:b'), undefined);
  assert.equal(cache.get('s:12:a'), 3, 'student 12 is not student 1');
  assert.equal(cache.get('g:x'), 4);
});

test('cache: stored values are deep-frozen so callers cannot corrupt each other', () => {
  const cache = new TtlCache();
  cache.set('k', { list: [{ n: 1 }] }, 1000);
  const v = cache.get('k');
  assert.throws(() => { v.list.push({ n: 2 }); }, TypeError);
  assert.throws(() => { v.list[0].n = 9; }, TypeError);
});
