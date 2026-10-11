const test = require('node:test');
const assert = require('node:assert');
const { parseAddress, normalizePhone, isFedexReady } = require('./parse-address');

test('standard single-line address', () => {
  const r = parseAddress('123 Main St, Springfield, IL 62704');
  assert.deepStrictEqual(
    [r.street, r.city, r.state, r.postal_code, r.errors.length],
    ['123 Main St', 'Springfield', 'IL', '62704', 0]
  );
});

test('apartment variant with ZIP+4', () => {
  const r = parseAddress('45 Oak Ave Apt 3B, Portland, OR 97205-1234');
  assert.strictEqual(r.street, '45 Oak Ave Apt 3B');
  assert.strictEqual(r.postal_code, '97205-1234');
});

test('multi-line address', () => {
  const r = parseAddress('200 Elm Street\nSuite 5\nAustin TX 78701');
  assert.strictEqual(r.city, 'Austin');
  assert.strictEqual(r.state, 'TX');
  assert.strictEqual(r.street, '200 Elm Street, Suite 5');
});

test('hyphenated house number', () => {
  const r = parseAddress('31-12 Broadway, Queens, NY 11106');
  assert.strictEqual(r.street, '31-12 Broadway');
  assert.strictEqual(r.errors.length, 0);
});

test('flags PO boxes', () => {
  const r = parseAddress('PO Box 123, Madison, WI 53701');
  assert.ok(r.is_po_box);
  assert.ok(r.errors.includes('PO_BOX_NOT_SUPPORTED'));
});

test('unparseable and empty input', () => {
  assert.ok(parseAddress('somewhere nice').errors.includes('UNPARSEABLE_ADDRESS'));
  assert.ok(parseAddress('').errors.includes('MISSING_ADDRESS'));
});

test('phone normalization', () => {
  assert.strictEqual(normalizePhone('+1 (512) 555-0123'), '5125550123');
  assert.strictEqual(normalizePhone('555-0123'), null);
});

test('isFedexReady needs a clean address and a valid phone', () => {
  const ok = parseAddress('123 Main St, Springfield, IL 62704');
  assert.ok(isFedexReady(ok, '512-555-0123'));
  assert.ok(!isFedexReady(ok, ''));
});
