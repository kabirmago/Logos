import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clip, escapeHtml } from './ogText';

test('clip: returns short strings unchanged with no ellipsis', () => {
  assert.equal(clip('Short one.', 48), 'Short one.');
  assert.equal(clip('', 48), '');
});

test('clip: trims long strings at a word boundary and adds an ellipsis', () => {
  const s = 'The debate segment features a sharp clash between Vice President and Senator';
  const out = clip(s, 48);
  assert.ok(out.endsWith('…'), 'should end with an ellipsis');
  assert.ok(!out.slice(0, -1).includes('Presi'), 'should not slice the next word mid-way');
  // Body (minus the ellipsis) never exceeds the budget.
  assert.ok(out.length - 1 <= 48);
  assert.equal(out, 'The debate segment features a sharp clash…');
});

test('clip: hard-cuts a single very long word with no usable boundary', () => {
  const s = 'Supercalifragilisticexpialidociousumblegobbledygookmegaword';
  const out = clip(s, 48);
  assert.ok(out.endsWith('…'));
  assert.equal(out.length, 49); // 48 chars + ellipsis
});

test('clip: strips trailing punctuation before the ellipsis', () => {
  const out = clip('Hello world, this is a fairly long sentence here', 13);
  assert.ok(!/[\s.,;:!?—-]…$/.test(out), `unexpected trailing punctuation: ${out}`);
});

test('escapeHtml: escapes the dangerous characters', () => {
  assert.equal(escapeHtml('a & b'), 'a &amp; b');
  assert.equal(escapeHtml('<script>'), '&lt;script&gt;');
  assert.equal(escapeHtml('say "hi"'), 'say &quot;hi&quot;');
});

test('escapeHtml: escapes & first so entities are not double-encoded', () => {
  // If "<" were escaped before "&", the "&lt;" would become "&amp;lt;".
  assert.equal(escapeHtml('<'), '&lt;');
  assert.equal(escapeHtml('&lt;'), '&amp;lt;');
});
