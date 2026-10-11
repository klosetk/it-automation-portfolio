const test = require('node:test');
const assert = require('node:assert');
const { extractJson, validate, pick, pctMet, REQUIRED_KEYS } = require('./validate-agent-json');

const good = Object.fromEntries(REQUIRED_KEYS.map((k) => [k, k === 'assignees' ? [] : 'x']));

test('parses fenced JSON with preamble and trailer', () => {
  const raw = 'Here is the JSON:\n```json\n' + JSON.stringify(good) + '\n```\nHope that helps!';
  assert.deepStrictEqual(extractJson(raw), good);
});

test('parses bare JSON', () => {
  assert.deepStrictEqual(extractJson(JSON.stringify(good)), good);
});

test('throws on empty or non-JSON text', () => {
  assert.throws(() => extractJson(''), /Empty/);
  assert.throws(() => extractJson('no braces here'), /No JSON/);
});

test('validate throws and names missing keys', () => {
  assert.throws(() => validate({ project_name: 'x' }), /missing required keys: project_key/);
  assert.strictEqual(validate(good), good);
});

test('pick falls back across aliases then to a dash', () => {
  assert.strictEqual(pick({ ticket_key: 'DESK-1' }, ['key', 'ticket_key']), 'DESK-1');
  assert.strictEqual(pick({}, ['key']), '—');
});

test('pctMet recomputes from counts', () => {
  assert.strictEqual(pctMet(13, 3), '81%');
  assert.strictEqual(pctMet(0, 0), '—');
});
