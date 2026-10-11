/**
 * validate-agent-json.js
 *
 * Illustrative n8n "Code" node logic: safely parse an LLM agent's raw text
 * response into a JSON object and fail loudly if required keys are missing.
 *
 * Handles the usual ways models wrap JSON:
 *   - markdown code fences anywhere in the text
 *   - preamble ("Here is the JSON:") or trailing commentary
 *
 * Sample data only. No real systems are referenced.
 */

const REQUIRED_KEYS = [
  'project_name',
  'project_key',
  'date',
  'summary',
  'ttfr',
  'ttr',
  'assignees',
  'breached_tickets',
  'at_risk_tickets',
];

function extractJson(rawText) {
  if (typeof rawText !== 'string' || !rawText.trim()) {
    throw new Error('Empty agent response');
  }
  // Remove ``` or ```json fences wherever they appear.
  const unfenced = rawText.replace(/```(?:json)?/gi, '');
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('No JSON object found in agent response');
  }
  return JSON.parse(unfenced.slice(start, end + 1));
}

function validate(obj, required = REQUIRED_KEYS) {
  const missing = required.filter((k) => !(k in obj));
  if (missing.length) {
    throw new Error(`Agent response missing required keys: ${missing.join(', ')}`);
  }
  return obj;
}

/** Fallback-aware field reader: accepts alternate names, renders "—" if absent. */
function pick(obj, aliases, fallback = '—') {
  for (const key of aliases) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key];
    }
  }
  return fallback;
}

/** Recompute a compliance percentage instead of trusting the agent's own math. */
function pctMet(met, breached, atRisk = 0) {
  const total = met + breached + atRisk;
  return total === 0 ? '—' : `${Math.round((met / total) * 100)}%`;
}

module.exports = { extractJson, validate, pick, pctMet, REQUIRED_KEYS };
