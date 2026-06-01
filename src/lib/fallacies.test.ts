import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lookupFallacy } from './fallacies';

test('lookupFallacy: exact canonical name', () => {
  const f = lookupFallacy('Ad Hominem');
  assert.equal(f.name, 'Ad Hominem');
  assert.ok(f.definition.length > 0);
  assert.ok(f.counter.length > 0);
});

test('lookupFallacy: resolves aliases', () => {
  assert.equal(lookupFallacy('strawman').name, 'Straw Man');
  assert.equal(lookupFallacy('false dilemma').name, 'False Dichotomy');
  assert.equal(lookupFallacy('post hoc').name, 'False Cause');
  assert.equal(lookupFallacy('ad populum').name, 'Bandwagon');
});

test('lookupFallacy: ignores case and punctuation', () => {
  assert.equal(lookupFallacy('  AD-HOMINEM! ').name, 'Ad Hominem');
  assert.equal(lookupFallacy('Slippery-Slope').name, 'Slippery Slope');
});

test('lookupFallacy: fuzzy match when the model adds extra words', () => {
  assert.equal(lookupFallacy('Ad Hominem attack on character').name, 'Ad Hominem');
});

test('lookupFallacy: unknown names fall back to the raw name + generic copy', () => {
  const f = lookupFallacy('Quantum Reasoning Fallacy');
  assert.equal(f.name, 'Quantum Reasoning Fallacy');
  assert.ok(f.definition.length > 0);
  assert.ok(f.counter.length > 0);
});
