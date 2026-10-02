export const FIXTURE_VERSION = 'synthetic-inspections-v1';
export const AS_OF = '2026-10-01';
export const RECORDS = Object.freeze([
  { asset_id:'PS-014', name:'Riverside Pump Station', inspection_id:'INS-1042', due:'2026-09-25', finding:'Backup pump vibration above baseline', recorded_by:'Morgan Lee', title:'Inspect backup pump', task:'Check vibration, mounting bolts and bearing condition.', priority:'High' },
  { asset_id:'BR-008', name:'North Trail Footbridge', inspection_id:'INS-1043', due:'2026-09-28', finding:'Loose handrail connection recorded', recorded_by:'Alex Chen', title:'Inspect handrail connection', task:'Check handrail connection and record any required repair.', priority:'Normal' },
  { asset_id:'WT-003', name:'Hilltop Water Tank', inspection_id:'INS-1044', due:'2026-09-30', finding:'Access ladder inspection outstanding', recorded_by:'Sam Rivera', title:'Inspect access ladder', task:'Inspect ladder fixings and record condition before maintenance review.', priority:'Normal' }
].map(Object.freeze));
export const ASSIGNEES = Object.freeze(['Unassigned','Morgan Lee','Alex Chen','Sam Rivera']);
export function getRecord(id) {
  const record = RECORDS.find(r=>r.asset_id===id);
  if (!record) throw new Error('Unknown demo asset.');
  return {...record, source:FIXTURE_VERSION, days_overdue:Math.floor((Date.parse(AS_OF)-Date.parse(record.due))/86400000)};
}
export function listOverdue() { return RECORDS.map(r=>getRecord(r.asset_id)); }
export function createDraft(id) {
  const r=getRecord(id);
  return {asset_id:r.asset_id,inspection_id:r.inspection_id,source:FIXTURE_VERSION,title:r.title,task:r.task,priority:r.priority,assignee:'Unassigned',status:'draft'};
}
export function validateDraft(draft) {
  if (!draft || typeof draft!=='object' || Array.isArray(draft)) throw new Error('A draft is required.');
  const r=getRecord(draft.asset_id);
  if(draft.inspection_id!==r.inspection_id || draft.source!==FIXTURE_VERSION) throw new Error('Evidence does not match this asset. Prepare a fresh draft.');
  if(draft.status!=='draft') throw new Error('Only a draft can be approved.');
  for(const [key,max] of [['title',120],['task',600]]) if(typeof draft[key]!=='string'||!draft[key].trim()||draft[key].length>max) throw new Error('Enter a valid '+key+'.');
  if(!['High','Normal','Low'].includes(draft.priority)||!ASSIGNEES.includes(draft.assignee)) throw new Error('Choose a valid priority and assignee.');
  return {...draft,title:draft.title.trim(),task:draft.task.trim()};
}
export function approveDraft(draft, orders, {humanConfirmed=false, now=new Date().toISOString()}={}) {
  if(!humanConfirmed) throw new Error('Explicit human approval is required.');
  const valid=validateDraft(draft);
  const existing=orders.find(o=>o.inspection_id===valid.inspection_id);
  if(existing) return {order:existing,orders,created:false};
  const order={...valid,status:'approved',id:'WO-'+valid.inspection_id.slice(4),approved_at:now,approved_by:'Demo visitor'};
  return {order,orders:[...orders,order],created:true};
}
export function parseStoredOrders(raw) {
  if(!raw) return [];
  const parsed=JSON.parse(raw);
  if(!Array.isArray(parsed)||parsed.length>RECORDS.length) throw new Error('Saved demo data is invalid.');
  const seen=new Set();
  return parsed.map(order=>{
    validateDraft({...order,status:'draft'});
    if(order.status!=='approved'||order.id!=='WO-'+order.inspection_id.slice(4)||!Number.isFinite(Date.parse(order.approved_at))||seen.has(order.inspection_id)) throw new Error('Saved demo data is invalid.');
    seen.add(order.inspection_id);return order;
  });
}
export function createInspectionTools(bridge={}) {
  const idSchema={type:'object',properties:{asset_id:{type:'string',enum:RECORDS.map(r=>r.asset_id)}},required:['asset_id'],additionalProperties:false};
  const check=(input,needsId)=>{
    if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='asset_id')||(!needsId&&Object.keys(input).length)) throw new Error('Invalid tool arguments.');
    if(needsId) getRecord(input.asset_id);
  };
  const definitions=[
    ['list_overdue_inspections','Find overdue demo inspections','Read synthetic overdue inspection records. Dates are fixed to October 1, 2026.',{type:'object',properties:{},additionalProperties:false},false,()=>listOverdue()],
    ['get_inspection_evidence','Read inspection evidence','Read the selected synthetic inspection, source version and finding.',idSchema,false,input=>getRecord(input.asset_id)],
    ['prepare_work_order','Prepare a work order','Return a proposed draft for one synthetic asset. Does not save, approve or stage it.',idSchema,false,input=>createDraft(input.asset_id)],
    ['stage_work_order_review','Show draft for human review','Place a proposed work order in the visible current-tab review form. Does not approve or save. A person must use the approval control.',idSchema,true,input=>{const draft=createDraft(input.asset_id);bridge.stage?.(draft);return draft;}]
  ];
  return definitions.map(([name,title,description,inputSchema,write,fn],i)=>({
    name,title,description,inputSchema,annotations:{readOnlyHint:!write,untrustedContentHint:false},
    execute:async input=>{
      try { check(input,i>0);const result=fn(input);bridge.trace?.({name,input,result,status:'ok'});return JSON.stringify({status:'OK',data:result,synthetic:true,external_action:false,human_approval_required:true}); }
      catch(error){bridge.trace?.({name,input,status:'error',error:error.message});return JSON.stringify({status:'ERROR',error:error.message,external_action:false});}
    }
  }));
}
export async function registerInspectionTools(doc,bridge) {
  if(!doc?.modelContext?.registerTool) return {status:'unavailable',count:0};
  const controller=new AbortController();const tools=createInspectionTools(bridge);
  try {for(const tool of tools) await doc.modelContext.registerTool(tool,{signal:controller.signal});}
  catch(error){controller.abort();throw error;}
  return {status:'registered',count:tools.length,abort:()=>controller.abort()};
}
