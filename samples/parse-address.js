/**
 * parse-address.js
 *
 * Simplified, illustrative version of the address/phone normalization used
 * before calling a carrier's address-validation and returns APIs.
 * Carriers need strict fields, but people type addresses every which way.
 *
 * This sample covers the common shapes (single-line, multi-line, unit/apt
 * variants, hyphenated house numbers, PO Box detection). Sample data only.
 */

const STATE = '[A-Z]{2}';
const ZIP = '\\d{5}(?:-\\d{4})?';

function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  return ten.length === 10 ? ten : null;
}

function parseAddress(raw) {
  const result = { street: '', city: '', state: '', postal_code: '', is_po_box: false, errors: [] };
  if (!raw || !String(raw).trim()) {
    result.errors.push('MISSING_ADDRESS');
    return result;
  }

  // Collapse newlines and extra whitespace into comma-separated parts.
  const text = String(raw).replace(/\r?\n+/g, ', ').replace(/\s+/g, ' ').trim();

  if (/\b(P\.?\s?O\.?\s?Box|Post Office Box)\b/i.test(text)) {
    result.is_po_box = true;
    result.errors.push('PO_BOX_NOT_SUPPORTED');
  }

  // "..., City, ST 12345"  or  "... City ST 12345" (no comma before the state)
  const m = text.match(new RegExp(`^(.*?)[,\\s]+([A-Za-z.' -]+?),?\\s+(${STATE})\\s+(${ZIP})(?:,?\\s*(?:USA|US))?$`, 'i'));
  if (!m) {
    result.errors.push('UNPARSEABLE_ADDRESS');
    return result;
  }

  let [, street, city, state, zip] = m;
  street = street.replace(/,\s*$/, '').trim();
  result.street = street;
  result.city = city.trim();
  result.state = state.toUpperCase();
  result.postal_code = zip;

  if (!result.street) result.errors.push('MISSING_STREET');
  if (!result.city) result.errors.push('MISSING_CITY');
  return result;
}

function isFedexReady(parsed, phone) {
  return (
    parsed.errors.length === 0 &&
    parsed.street && parsed.city && parsed.state && parsed.postal_code &&
    Boolean(normalizePhone(phone))
  );
}

module.exports = { parseAddress, normalizePhone, isFedexReady };
