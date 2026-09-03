import { CAPABILITIES } from './data.mjs';
import { prepareDecisionPacket } from './core.mjs';
import { registerCapabilityTools } from './webmcp.mjs';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const form = $('#scope-form');
const receipt = $('#receipt');
const status = $('#webmcp-status');
const toolCount = $('#tool-count');
const trace = $('#agent-trace');
const path = $('#handoff-path');
const modeLabel = $('#mode-label');
let traceSequence = 0;

function preferredScrollBehavior() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function currentInput() {
  const data = new FormData(form);
  return {
    objective: String(data.get('objective') ?? '').trim(),
    capability_ids: data.getAll('capability').map(String),
    constraints: String(data.get('constraints') ?? '').split('\n').map((value) => value.trim()).filter(Boolean)
  };
}

function setWorkspaceInput(input) {
  if (input.objective) form.elements.objective.value = input.objective;
  const selected = new Set(input.capability_ids ?? []);
  $$('input[name="capability"]').forEach((checkbox) => { checkbox.checked = selected.has(checkbox.value); });
  if (Array.isArray(input.constraints)) form.elements.constraints.value = input.constraints.join('\n');
}

function setPath(stage) {
  path.dataset.stage = stage;
  $$('.path-step').forEach((node) => node.classList.toggle('active', Number(node.dataset.step) <= stage));
}

function renderPacket(result, source = 'human') {
  if (result.status !== 'READY_FOR_HUMAN_REVIEW') {
    receipt.dataset.source = source;
    receipt.innerHTML = `<div class="receipt-kicker"><span>${source === 'agent' ? 'AGENT ATTEMPT' : 'INPUT CHECK'}</span><strong>NEEDS CORRECTION</strong></div><p class="empty"><strong>${esc(result.status)}</strong><br>${esc(result.error ?? 'The packet could not be prepared from this input.')}</p>`;
    return;
  }
  const packet = result.packet;
  receipt.innerHTML = `
    <div class="receipt-kicker"><span>${source === 'agent' ? 'AGENT-STAGED' : 'HUMAN-BUILT'}</span><strong>READY FOR HUMAN REVIEW</strong></div>
    <h3>${esc(packet.objective)}</h3>
    <div class="receipt-section"><p class="eyebrow">Workstreams</p>${packet.workstreams.map((item) => `<div class="workstream"><strong>${esc(item.name)}</strong><span>${esc(item.outcome)}</span></div>`).join('')}</div>
    <div class="receipt-section evidence"><p class="eyebrow">Evidence receipt</p>${packet.evidence_receipts.map((item) => `<a href="${esc(item.public_url)}" target="_blank" rel="noreferrer"><strong>${esc(item.title)}</strong><span>${esc(item.proof_boundary)}</span></a>`).join('')}</div>
    <div class="receipt-section"><p class="eyebrow">Open before anything real happens</p><ol>${packet.open_questions.map((item) => `<li>${esc(item)}</li>`).join('')}</ol></div>
    <div class="decision-line"><span>HUMAN DECISION REQUIRED</span><p>${esc(packet.decision_required)}</p></div>
  `;
  receipt.dataset.source = source;
  setPath(4);
}

function traceInputSummary(input = {}) {
  const parts = [];
  if (input.problem) parts.push(`problem: ${String(input.problem).slice(0, 72)}`);
  if (input.capability_id) parts.push(`capability: ${input.capability_id}`);
  if (Array.isArray(input.capability_ids)) parts.push(`${input.capability_ids.length} capabilit${input.capability_ids.length === 1 ? 'y' : 'ies'}`);
  if (input.objective) parts.push(`objective: ${String(input.objective).slice(0, 72)}`);
  if (Array.isArray(input.constraints)) parts.push(`${input.constraints.length} constraint${input.constraints.length === 1 ? '' : 's'}`);
  return parts.join(' · ') || 'no input';
}

function appendTrace({ name, input, result }) {
  traceSequence += 1;
  const row = document.createElement('li');
  row.innerHTML = `<span>${String(traceSequence).padStart(2, '0')}</span><div><strong>${esc(name)}</strong><small>${esc(traceInputSummary(input))}</small></div><em>${esc(result.status ?? 'OK')}</em>`;
  row.title = JSON.stringify({ input, status: result.status }, null, 2);
  trace.prepend(row);
  while (trace.children.length > 5) trace.lastElementChild.remove();
  modeLabel.textContent = 'Agent used a typed browser tool';
  setPath(Math.max(Number(path.dataset.stage || 1), name.includes('decision') || name.includes('review') ? 4 : name.includes('example') ? 3 : name.includes('scope') ? 2 : 1));
}

function stageReview(input, result) {
  if (result.status !== 'READY_FOR_HUMAN_REVIEW') {
    renderPacket(result, 'agent');
    modeLabel.textContent = 'Agent tool call needs a corrected input';
    setPath(2);
    $('#lab').scrollIntoView({ behavior: preferredScrollBehavior(), block: 'start' });
    return;
  }
  setWorkspaceInput(input);
  renderPacket(result, 'agent');
  document.body.classList.add('agent-staged');
  window.setTimeout(() => document.body.classList.remove('agent-staged'), 900);
  $('#lab').scrollIntoView({ behavior: preferredScrollBehavior(), block: 'start' });
}

form.addEventListener('input', () => {
  modeLabel.textContent = 'Human is shaping the same workspace';
  setPath(1);
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const result = prepareDecisionPacket(currentInput());
  renderPacket(result, 'human');
});

$('#demo-agent').addEventListener('click', () => {
  const input = currentInput();
  const result = prepareDecisionPacket(input);
  setWorkspaceInput(input);
  renderPacket(result, 'human');
  modeLabel.textContent = 'Local preview only · no WebMCP tool call occurred';
  setPath(4);
});

$('#reset-workspace').addEventListener('click', () => {
  form.reset();
  CAPABILITIES.slice(0, 2).forEach((capability) => {
    const checkbox = form.querySelector(`input[value="${capability.id}"]`);
    if (checkbox) checkbox.checked = true;
  });
  form.elements.constraints.value = 'Public data only\nMobile-first';
  receipt.innerHTML = '<p class="empty"><strong>Nothing staged yet.</strong><br>Build the packet yourself, or let a WebMCP-aware agent stage it into this same surface.</p>';
  trace.innerHTML = '';
  traceSequence = 0;
  modeLabel.textContent = 'Human and agent share one evidence model';
  setPath(1);
});

registerCapabilityTools(document, { onToolResult: appendTrace, stageReview })
  .then((registration) => {
    if (registration.status === 'REGISTERED') toolCount.textContent = String(registration.tool_count);
    if (registration.status === 'REGISTERED') {
      status.innerHTML = `<i></i><strong>WebMCP ready</strong><span>${registration.tool_count} tools · origin isolated · same visible workspace</span>`;
      document.documentElement.dataset.webmcp = 'ready';
    } else if (globalThis.crossOriginIsolated !== true) {
      status.innerHTML = '<i></i><strong>Human fallback ready</strong><span>WebMCP prerequisite missing: this response is not origin isolated</span>';
      document.documentElement.dataset.webmcp = 'prereq';
    } else {
      status.innerHTML = '<i></i><strong>Human fallback ready</strong><span>Origin isolation is ready; this browser does not expose WebMCP</span>';
      document.documentElement.dataset.webmcp = 'fallback';
    }
  })
  .catch((error) => {
    status.innerHTML = `<i></i><strong>WebMCP registration failed visibly</strong><span>${esc(error.message)}</span>`;
    document.documentElement.dataset.webmcp = 'error';
  });
