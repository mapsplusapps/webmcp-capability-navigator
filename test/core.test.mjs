import test from 'node:test';
import assert from 'node:assert/strict';
import { listCapabilities, findExamples, prepareDecisionPacket } from '../src/core.mjs';
import { createTools } from '../src/webmcp.mjs';

test('discovers relevant capability from natural language', () => {
  const result = listCapabilities({ problem: 'public data operational dashboard' });
  assert.equal(result.status, 'OK');
  assert.ok(result.records.some((record) => record.id === 'geospatial-public-data'));
});

test('returns linked public evidence', () => {
  const result = findExamples({ capability_ids: ['geospatial-public-data'] });
  assert.equal(result.status, 'OK');
  assert.ok(result.records.length >= 1);
  assert.ok(result.records.every((record) => typeof record.public_url === 'string'));
});

test('prepares a human-review packet and blocks external authority', () => {
  const result = prepareDecisionPacket({ objective: 'Create a public-data operational dashboard', capability_ids: ['geospatial-public-data','rapid-response-data-automation'], constraints: ['Public data only','Mobile-first'] });
  assert.equal(result.status, 'READY_FOR_HUMAN_REVIEW');
  assert.equal(result.packet.authority, 'HUMAN_REVIEW_REQUIRED');
  assert.ok(result.packet.blocked_actions.includes('submit'));
  assert.ok(result.packet.blocked_actions.includes('pay'));
});

test('registers exactly six typed tool descriptors', () => {
  const tools = createTools();
  assert.equal(tools.length, 6);
  assert.deepEqual(tools.map((tool) => tool.name), ['list_capabilities','get_capability','find_examples','draft_scope','prepare_decision_packet','stage_human_review']);
  assert.ok(tools.every((tool) => tool.inputSchema?.type === 'object'));
});
