import { AUTHORITY, CAPABILITIES, DEFAULT_EXCLUSIONS, EXAMPLES } from './data.mjs';

const normalize = (value) => String(value ?? '').trim().toLowerCase();
const sortedUnique = (values) => [...new Set(values)].sort((a, b) => a.localeCompare(b));
const clone = (value) => JSON.parse(JSON.stringify(value));
const MAX_OBJECTIVE_LENGTH = 240;
const MAX_CONSTRAINTS = 8;
const MAX_CONSTRAINT_LENGTH = 160;
const MAX_PROBLEM_LENGTH = 120;
const MAX_DELIVERY_PATTERN_LENGTH = 80;
const VALID_CAPABILITY_IDS = new Set(CAPABILITIES.map((record) => record.id));
const SEARCH_STOP_WORDS = new Set(['a','an','and','as','at','be','by','for','from','help','in','into','is','it','make','me','my','of','on','or','the','to','use','using','with']);

function searchTokens(value) {
  return sortedUnique(normalize(value).replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter((term) => term.length >= 2 && !SEARCH_STOP_WORDS.has(term)));
}

function searchScore(query, fields) {
  const terms = searchTokens(query);
  if (!terms.length) return { matches: false, score: 0 };
  const haystack = new Set(searchTokens(fields.join(' ')));
  const score = terms.filter((term) => haystack.has(term)).length;
  const minimum = terms.length >= 3 ? 2 : 1;
  return { matches: score >= minimum, score };
}

function parseOptionalString(value, name, maxLength) {
  if (value == null || value === '') return { value: '' };
  if (typeof value !== 'string') return { error: `${name} must be a string` };
  const trimmed = value.trim();
  if (trimmed.length > maxLength) return { error: `${name} must be ${maxLength} characters or fewer` };
  return { value: trimmed };
}

function parseCapabilityIds(value, { required = false } = {}) {
  if (value != null && !Array.isArray(value)) return { error: 'capability_ids must be an array' };
  if ((value ?? []).some((item) => typeof item !== 'string')) return { error: 'each capability_id must be a string' };
  const ids = sortedUnique((value ?? []).map((item) => item.trim()).filter(Boolean));
  if (required && !ids.length) return { error: 'select at least one evidence-backed capability' };
  const unknown = ids.filter((id) => !VALID_CAPABILITY_IDS.has(id));
  if (unknown.length) return { error: `unsupported capability IDs: ${unknown.join(', ')}` };
  return { ids };
}

export function listCapabilities(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { status: 'INVALID_INPUT', error: 'input must be an object', authority: AUTHORITY };
  const parsedProblem = parseOptionalString(input.problem, 'problem', MAX_PROBLEM_LENGTH);
  if (parsedProblem.error) return { status: 'INVALID_INPUT', error: parsedProblem.error, authority: AUTHORITY };
  const parsedDeliveryPattern = parseOptionalString(input.delivery_pattern, 'delivery_pattern', MAX_DELIVERY_PATTERN_LENGTH);
  if (parsedDeliveryPattern.error) return { status: 'INVALID_INPUT', error: parsedDeliveryPattern.error, authority: AUTHORITY };
  const problem = parsedProblem.value;
  const deliveryPattern = parsedDeliveryPattern.value;
  const records = CAPABILITIES.map((record) => {
    const problemMatch = !problem ? { matches: true, score: 0 } : searchScore(problem, [record.name, record.short, record.summary, ...record.problem_types, ...record.delivery_patterns]);
    const deliveryMatch = !deliveryPattern ? { matches: true, score: 0 } : searchScore(deliveryPattern, record.delivery_patterns);
    return { record, problemMatch, deliveryMatch, score: problemMatch.score * 2 + deliveryMatch.score };
  }).filter(({ problemMatch, deliveryMatch }) => problemMatch.matches && deliveryMatch.matches)
    .sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id))
    .map(({ record }) => ({ id: record.id, name: record.name, short: record.short, summary: record.summary, problem_types: [...record.problem_types], evidence_count: record.evidence_ids.length, constraints: [...record.constraints] }));
  return { status: 'OK', records, authority: AUTHORITY };
}

export function getCapability(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { status: 'INVALID_INPUT', error: 'input must be an object', authority: AUTHORITY };
  if (typeof input.capability_id !== 'string') return { status: 'INVALID_INPUT', error: 'capability_id must be a string', authority: AUTHORITY };
  const id = input.capability_id.trim();
  const record = CAPABILITIES.find((capability) => capability.id === id);
  if (!record) return { status: 'NOT_FOUND', capability_id: id, authority: AUTHORITY };
  return { status: 'OK', record: clone(record), proof_boundary: 'Public evidence only; no contract-reference or outcome guarantee is implied.', authority: AUTHORITY };
}

export function findExamples(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { status: 'INVALID_INPUT', error: 'input must be an object', authority: AUTHORITY };
  const parsed = parseCapabilityIds(input.capability_ids);
  if (parsed.error) return { status: 'INVALID_INPUT', error: parsed.error, authority: AUTHORITY };
  const parsedProblem = parseOptionalString(input.problem, 'problem', MAX_PROBLEM_LENGTH);
  if (parsedProblem.error) return { status: 'INVALID_INPUT', error: parsedProblem.error, authority: AUTHORITY };
  const requested = parsed.ids;
  const problem = parsedProblem.value;
  const records = EXAMPLES.map((record) => {
    const requestedMatch = requested.length === 0 || requested.some((id) => record.capability_ids.includes(id));
    const linkedCapabilities = CAPABILITIES.filter((capability) => record.capability_ids.includes(capability.id));
    const problemMatch = !problem ? { matches: true, score: 0 } : searchScore(problem, [record.title, record.public_summary, ...linkedCapabilities.flatMap((capability) => [capability.name, capability.short, capability.summary, ...capability.problem_types, ...capability.delivery_patterns])]);
    return { record, requestedMatch, problemMatch };
  }).filter(({ requestedMatch, problemMatch }) => requestedMatch && problemMatch.matches)
    .sort((a, b) => b.problemMatch.score - a.problemMatch.score || a.record.id.localeCompare(b.record.id))
    .map(({ record }) => clone(record));
  return { status: 'OK', records, authority: AUTHORITY };
}

export function draftScope(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { status: 'INVALID_INPUT', error: 'input must be an object', authority: AUTHORITY };
  if (typeof input.objective !== 'string') return { status: 'INVALID_INPUT', error: 'objective must be a string', authority: AUTHORITY };
  const objective = input.objective.trim();
  if (!objective) return { status: 'INVALID_INPUT', error: 'objective is required', authority: AUTHORITY };
  if (objective.length > MAX_OBJECTIVE_LENGTH) return { status: 'INVALID_INPUT', error: `objective must be ${MAX_OBJECTIVE_LENGTH} characters or fewer`, authority: AUTHORITY };
  const parsedCapabilities = parseCapabilityIds(input.capability_ids, { required: true });
  if (parsedCapabilities.error) return { status: 'INVALID_INPUT', error: parsedCapabilities.error, authority: AUTHORITY };
  if (input.constraints != null && !Array.isArray(input.constraints)) return { status: 'INVALID_INPUT', error: 'constraints must be an array', authority: AUTHORITY };
  const requested = parsedCapabilities.ids;
  if ((input.constraints ?? []).some((value) => typeof value !== 'string')) return { status: 'INVALID_INPUT', error: 'each constraint must be a string', authority: AUTHORITY };
  const rawConstraints = (input.constraints ?? []).map((value) => value.trim()).filter(Boolean);
  if (rawConstraints.length > MAX_CONSTRAINTS) return { status: 'INVALID_INPUT', error: `constraints must contain ${MAX_CONSTRAINTS} items or fewer`, authority: AUTHORITY };
  if (rawConstraints.some((value) => value.length > MAX_CONSTRAINT_LENGTH)) return { status: 'INVALID_INPUT', error: `each constraint must be ${MAX_CONSTRAINT_LENGTH} characters or fewer`, authority: AUTHORITY };
  const known = CAPABILITIES.filter((record) => requested.includes(record.id)).sort((a, b) => a.id.localeCompare(b.id));
  const evidenceIds = sortedUnique(known.flatMap((record) => record.evidence_ids));
  const constraints = sortedUnique(rawConstraints);
  const workstreams = known.map((record) => ({ id: record.id, name: record.name, outcome: `A bounded, nonbinding workstream applying ${record.name.toLowerCase()} to the stated objective.`, assumptions: constraints.length ? [...constraints] : ['Delivery details require confirmation before any binding scope is prepared.'] }));
  const openQuestions = ['What audience, operating context, and acceptance evidence define success?', 'Which data sources and usage rights are actually available for the requested work?'];
  return { status: 'OK', draft: { title: `Draft scope — ${objective.slice(0, 80)}`, objective, selected_capability_ids: known.map((record) => record.id), proposed_workstreams: workstreams, evidence_ids: evidenceIds, open_questions: openQuestions, exclusions: [...DEFAULT_EXCLUSIONS], unknown_capability_ids: [], authority: 'NONBINDING_DRAFT' }, authority: AUTHORITY };
}

export function prepareDecisionPacket(input = {}) {
  const scope = draftScope(input);
  if (scope.status !== 'OK') return scope;
  const evidence = findExamples({ capability_ids: scope.draft.selected_capability_ids });
  return { status: 'READY_FOR_HUMAN_REVIEW', packet: { objective: scope.draft.objective, workstreams: scope.draft.proposed_workstreams, evidence_receipts: evidence.records.map((record) => ({ id: record.id, title: record.title, public_url: record.public_url, proof_boundary: record.proof_boundary, rights: record.provenance.rights })), open_questions: scope.draft.open_questions, decision_required: 'Human confirms scope assumptions, evidence relevance, and whether to proceed to a separate discovery/quote process.', blocked_actions: [...DEFAULT_EXCLUSIONS], authority: 'HUMAN_REVIEW_REQUIRED' }, authority: AUTHORITY };
}
