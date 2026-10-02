import test from 'node:test';
import assert from 'node:assert/strict';
import {listOverdue,createDraft,approveDraft,parseStoredOrders,createInspectionTools,registerInspectionTools} from '../src/inspection-core.mjs';
test('synthetic records have consistent overdue dates and source bindings',()=>{
  assert.deepEqual(listOverdue().map(r=>r.days_overdue),[6,3,1]);
  const draft=createDraft('PS-014');
  assert.equal(draft.inspection_id,'INS-1042');
  assert.throws(()=>approveDraft(draft,[]),/human approval/);
  assert.throws(()=>approveDraft({...draft,inspection_id:'INS-1043'},[],{humanConfirmed:true}),/Evidence/);
});
test('approval survives serialization, includes edits and cannot create duplicate',()=>{
  const draft={...createDraft('PS-014'),title:'Review pump bearings',assignee:'Alex Chen'};
  const result=approveDraft(draft,[],{humanConfirmed:true});
  assert.equal(result.order.title,'Review pump bearings');
  assert.equal(result.order.assignee,'Alex Chen');
  const stored=parseStoredOrders(JSON.stringify(result.orders));
  assert.equal(approveDraft(draft,stored,{humanConfirmed:true}).created,false);
  assert.equal(stored.length,1);
  assert.throws(()=>parseStoredOrders('[{"status":"approved"}]'));
});
test('agent tools can stage but cannot approve or persist; malformed inputs fail',async()=>{
  let staged=null;const trace=[];const tools=createInspectionTools({stage:d=>staged=d,trace:e=>trace.push(e)});
  assert.deepEqual(tools.map(t=>t.name),['list_overdue_inspections','get_inspection_evidence','prepare_work_order','stage_work_order_review']);
  assert.equal(JSON.parse(await tools[3].execute({asset_id:'PS-014'})).status,'OK');
  assert.equal(staged.status,'draft');
  assert.equal(JSON.parse(await tools[3].execute({asset_id:'PS-014',approve:true})).status,'ERROR');
  assert.equal(JSON.parse(await tools[1].execute({asset_id:'OTHER'})).status,'ERROR');
  assert.equal(trace.length,3);
});
test('registers four tools and cleanly detects missing native support',async()=>{
  assert.equal((await registerInspectionTools({},{})).status,'unavailable');
  const registered=[];
  const result=await registerInspectionTools({modelContext:{registerTool:t=>registered.push(t)}},{});
  assert.equal(result.count,4);
  assert.equal(registered.length,4);
});
