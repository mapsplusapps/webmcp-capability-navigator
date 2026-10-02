import {AS_OF,ASSIGNEES,getRecord,listOverdue,approveDraft,parseStoredOrders,createInspectionTools,registerInspectionTools} from './inspection-core.mjs';
const KEY='capability-navigator:inspection-orders:v1';
const $=id=>document.getElementById(id);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let selected='PS-014',draft=null,orders=[],trace=[],running=false;
function announce(message){$('announcement').textContent=message;}
try{orders=parseStoredOrders(localStorage.getItem(KEY));}catch{announce('Saved demo data could not be read. Reset the demo to clear it; new approvals will replace invalid data.');}
function date(value){return new Date(value+'T00:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});}
function progress(stage){document.querySelectorAll('[data-step]').forEach(el=>{const step=Number(el.dataset.step);el.className=step<stage?'done':step===stage?'current':'';if(step===stage)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});}
function addTrace(entry,origin='Browser agent'){
  trace.push({...entry,origin});
  $('trace').innerHTML=trace.slice(-30).map(t=>'<li><strong>'+escape(t.origin)+'</strong> · <code>'+escape(t.name)+'</code><br>'+escape(t.status==='error'?'Error: '+t.error:'Completed')+'<details><summary>Input and result</summary><pre style="white-space:pre-wrap">'+escape(JSON.stringify({input:t.input,result:t.result},null,2))+'</pre></details></li>').join('');
}
function stage(value){draft=value;selected=value.asset_id;render();announce('Draft staged for review. Nothing has been saved.');}
const bridge={stage,trace:addTrace};
const guidedTools=createInspectionTools({stage,trace:entry=>addTrace(entry,'Guided walkthrough')});
function renderAssets(){$('assets').innerHTML=listOverdue().map(r=>'<button class="asset" data-asset="'+r.asset_id+'" aria-pressed="'+(r.asset_id===selected)+'"><strong>'+escape(r.name)+'</strong><small>'+r.asset_id+' · Due '+date(r.due)+'</small><span class="late">'+r.days_overdue+' days overdue'+(orders.some(o=>o.asset_id===r.asset_id)?' · Work order saved':'')+'</span></button>').join('');}
function renderEvidence(){
  const r=getRecord(selected);
  $('evidence').innerHTML='<p class="object-title">'+escape(r.name)+' <small>'+r.asset_id+'</small></p><article class="document"><header>Inspection record · '+r.inspection_id+'</header><div class="document-content"><dl><dt>Due date</dt><dd>'+date(r.due)+'</dd><dt>Finding</dt><dd>'+escape(r.finding)+'</dd><dt>Recorded by</dt><dd>'+escape(r.recorded_by)+'</dd><dt>Source</dt><dd>Synthetic inspection register · v1</dd></dl><blockquote>'+escape(r.task)+'</blockquote><div class="timeline"><div><strong>'+date(r.due)+'</strong><small>Due</small></div><div><strong>'+date(AS_OF)+'</strong><small>Demo review date</small></div></div><div class="notice">'+r.days_overdue+' days overdue. The recorded finding supports a maintenance review.</div></div></article>';
}
function renderReview(){
  const saved=orders.find(o=>o.asset_id===selected),r=getRecord(selected);
  if(saved){$('review-heading').textContent='Saved result';$('review').innerHTML='<div class="saved"><h3>Work order saved</h3><strong>'+saved.id+' · '+escape(saved.title)+'</strong><p>'+escape(r.name)+' · '+saved.asset_id+'</p><p>'+escape(saved.task)+'</p><dl><dt>Priority</dt><dd>'+escape(saved.priority)+'</dd><dt>Assigned to</dt><dd>'+escape(saved.assignee)+'</dd><dt>Evidence</dt><dd>'+saved.inspection_id+'</dd></dl><p>Approved by you · '+escape(new Date(saved.approved_at).toLocaleString())+'</p><small>Saved in this browser only. Refresh the page to check it persists. No external work order was dispatched.</small></div><button class="text-button" id="source">Review source evidence</button>';progress(4);return;}
  $('review-heading').textContent='Ready for your review';
  if(!draft||draft.asset_id!==selected){$('review').innerHTML='<div class="empty"><strong>No draft prepared yet.</strong><p>Read the selected inspection, then prepare a work order for review.</p><button id="prepare" class="primary">Prepare draft for this asset</button></div>';progress(trace.length?2:1);return;}
  progress(3);
  $('review').innerHTML='<span class="draft-status">Draft — nothing saved yet</span><form id="approval-form"><div class="form-card"><h3>Work order draft</h3><div class="form-row"><label for="title">Title</label><input id="title" required maxlength="120" value="'+escape(draft.title)+'"></div><div class="form-row"><span>Asset</span><strong>'+escape(r.name)+' · '+r.asset_id+'</strong></div><div class="form-row"><label for="priority">Priority</label><select id="priority">'+['High','Normal','Low'].map(p=>'<option '+(draft.priority===p?'selected':'')+'>'+p+'</option>').join('')+'</select></div><div class="form-row"><label for="assignee">Assigned to</label><select id="assignee">'+ASSIGNEES.map(a=>'<option '+(draft.assignee===a?'selected':'')+'>'+a+'</option>').join('')+'</select></div><div class="form-row"><label for="task">Task</label><textarea id="task" required maxlength="600">'+escape(draft.task)+'</textarea></div><div class="source-link">Based on '+draft.inspection_id+' · <button type="button" id="source" class="text-button">View source</button></div></div><div class="change"><h3>What will change if you approve?</h3><div class="before-after"><div>Current<strong>No work order</strong></div><span aria-hidden="true">→</span><div>After approval<strong>One demo work order</strong></div></div><p class="approval">Approval saves this work order in this browser’s demo workspace.</p><div id="save-error" role="alert"></div><div class="actions"><button class="primary" type="submit" id="approve">Approve & save demo work order</button><button class="secondary" type="button" id="edit">Edit draft</button><button class="text-button" type="button" id="discard">Discard</button></div></div></form>';
}
function render(){renderAssets();renderEvidence();renderReview();}
async function invoke(name,input){const result=JSON.parse(await guidedTools.find(t=>t.name===name).execute(input));if(result.status!=='OK')throw new Error(result.error);return result.data;}
async function prepare(){await invoke('get_inspection_evidence',{asset_id:selected});await invoke('prepare_work_order',{asset_id:selected});await invoke('stage_work_order_review',{asset_id:selected});}
$('run').addEventListener('click',async()=>{if(running)return;running=true;$('run').disabled=true;try{const results=await invoke('list_overdue_inspections',{});$('response').textContent='The guided tools found '+results.length+' overdue inspections. Review the selected asset’s evidence and proposed work order.';await prepare();}catch(error){announce(error.message);}finally{running=false;$('run').disabled=false;}});
$('assets').addEventListener('click',event=>{const button=event.target.closest('[data-asset]');if(!button)return;selected=button.dataset.asset;draft=null;render();announce('Selected '+getRecord(selected).name+'. Prepare a fresh draft for this asset.');});
$('review').addEventListener('input',event=>{if(draft&&['title','task','priority','assignee'].includes(event.target.id))draft[event.target.id]=event.target.value;});
$('review').addEventListener('change',event=>{if(draft&&['priority','assignee'].includes(event.target.id))draft[event.target.id]=event.target.value;});
$('review').addEventListener('click',async event=>{
  const id=event.target.closest('button')?.id;
  if(id==='prepare')try{await prepare();}catch(error){announce(error.message);}
  if(id==='discard'){draft=null;render();announce('Draft discarded. Nothing saved.');}
  if(id==='edit')$('title').focus();
  if(id==='source'){$('evidence-panel').scrollIntoView({behavior:'instant',block:'start'});$('evidence-panel').setAttribute('tabindex','-1');$('evidence-panel').focus();}
});
$('review').addEventListener('submit',event=>{
  event.preventDefault();
  if(!event.isTrusted){announce('Use the human approval button to save. Agent-triggered submission is not permitted.');return;}
  try{
    const edited={...draft,title:$('title').value,task:$('task').value,priority:$('priority').value,assignee:$('assignee').value};
    let latest;try{latest=parseStoredOrders(localStorage.getItem(KEY));}catch{latest=orders;}
    const result=approveDraft(edited,latest,{humanConfirmed:true});
    localStorage.setItem(KEY,JSON.stringify(result.orders));
    orders=result.orders;draft=null;
    addTrace({name:'human_approval',input:{asset_id:selected},result:{id:result.order.id,persistence:'this-browser-only'},status:'ok'},'Human action');
    render();announce(result.created?'Work order '+result.order.id+' saved in this browser.':'An approved work order already exists for this inspection.');
  }catch(error){$('save-error').className='error';$('save-error').textContent='Not saved: '+error.message;}
});
$('reset').addEventListener('click',()=>{if(orders.length&&!confirm('Clear this browser’s saved demo work orders and start again?'))return;try{localStorage.removeItem(KEY);}catch{announce('Browser storage is unavailable. Nothing was cleared.');return;}orders=[];draft=null;trace=[];selected='PS-014';$('trace').replaceChildren();$('response').textContent='Start the guided demo, or ask a WebMCP browser agent to find overdue inspections.';render();announce('Demo reset.');});
$('how-toggle').addEventListener('click',()=>{const open=$('how').hidden;$('how').hidden=!open;$('how-toggle').setAttribute('aria-expanded',String(open));});
window.addEventListener('storage',event=>{if(event.key===KEY)try{orders=parseStoredOrders(event.newValue);render();announce('Saved demo data updated in another tab.');}catch{announce('Another tab supplied invalid demo data. Reset before saving.');}});
render();
try{const result=await registerInspectionTools(document,bridge);$('webmcp-status').textContent=result.status==='registered'?'WebMCP ready · 4 inspection tools registered':'Native WebMCP unavailable in this browser. The guided demo and human workflow still work.';}catch(error){$('webmcp-status').textContent='WebMCP registration failed. Guided demo remains available.';addTrace({name:'register_tools',status:'error',error:error.message},'Browser');}
