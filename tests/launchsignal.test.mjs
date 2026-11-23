import test from 'node:test';
import assert from 'node:assert/strict';
import {submitLaunchSignal,checkLaunchSignal} from '../scripts/launchsignal.mjs';
const p={site:'https://toppsarena.com',title:'TopPSArena',description:'Discover and compare private gaming servers across games.',email:'notifications@toppsarena.com'};
test('uses required read-only dry-run, submits only once, tracks pending review not link',async()=>{
 let calls=[];
 const request=async(url,init={})=>{
   calls.push({url,init});
   const body=JSON.parse(init.body);
   assert.equal(body.url,p.site);assert.equal(body.category,'Other');assert.equal(body.email,p.email);
   if(url.endsWith('?dry_run=1'))return {httpStatus:200,body:JSON.stringify({ok:true,dry_run:true,would_accept:true,would_flag:false})};
   assert.equal(url,'https://launchsignal.ai/api/v1/products');
   return {httpStatus:201,body:'{"ok":true,"status":"pending","slug":"toppsarena"}'};
 };
 const r=await submitLaunchSignal({request,...p});
 assert.equal(calls.length,2);
 assert.equal(calls[0].url.endsWith('?dry_run=1'),true);
 assert.equal(r.status,'queued_not_published');
 assert.equal(r.slug,'toppsarena');
 assert.equal(r.listingUrl,undefined);
});
test('duplicate or previously rejected domain detected without real POST',async()=>{
 for(const error of ['duplicate_domain','domain_previously_rejected']){
  let calls=0;
  const request=async()=>{calls++;return {httpStatus:409,body:JSON.stringify({ok:false,error})}};
  const r=await submitLaunchSignal({request,...p});
  assert.equal(calls,1);assert.equal(r.status,'already_queued_or_listed');
 }
});
test('unknown dry-run responses fail closed without POST',async()=>{
 let count=0;
 const request=async()=>{count++;return {httpStatus:200,body:'{"ok":true}'}};
 const r=await submitLaunchSignal({request,...p});
 assert.equal(count,1);assert.equal(r.status,'preflight_unavailable');
});
test('policy review flag prevents unattended post',async()=>{
 let count=0;
 const request=async()=>{count++;return {httpStatus:200,body:'{"ok":true,"dry_run":true,"would_accept":true,"would_flag":true,"flags":["policy_review"]}'}};
 const r=await submitLaunchSignal({request,...p});
 assert.equal(count,1);assert.equal(r.status,'preflight_flagged_for_review');
});
test('ambiguous POST failure never auto retries',async()=>{
 let count=0;
 const request=async url=>{
  count++;
  if(url.includes('dry_run'))return {httpStatus:200,body:'{"ok":true,"dry_run":true,"would_accept":true,"would_flag":false}'};
  throw Error('network down');
 };
 const r=await submitLaunchSignal({request,...p});
 assert.equal(count,2);assert.equal(r.status,'post_outcome_unknown');
});
test('pending returns no link, approved exact-domain returns safe candidate URL',async()=>{
 const pending=async()=>({httpStatus:404,body:'{"ok":false,"error":"not_found"}'});
 assert.deepEqual(await checkLaunchSignal({request:pending,slug:'toppsarena',site:p.site}),{status:'pending_or_unavailable',listingUrl:null});
 const approved=async()=>({httpStatus:200,body:'{"ok":true,"product":{"slug":"toppsarena","status":"approved","url":"https://toppsarena.com/"}}'});
 const x=await checkLaunchSignal({request:approved,slug:'toppsarena',site:p.site});
 assert.equal(x.status,'approved');assert.equal(x.listingUrl,'https://launchsignal.ai/l/toppsarena');
});
test('malicious slug and other-domain listing cannot create candidate URL',async()=>{
 let called=0;
 const request=async()=>{called++;return {httpStatus:200,body:'{"ok":true,"product":{"slug":"toppsarena","status":"approved","url":"https://toppsarena.com.evil.test"}}'}};
 const a=await checkLaunchSignal({request,slug:'https://evil.test',site:p.site});
 assert.equal(a.listingUrl,null);assert.equal(called,0);
 const b=await checkLaunchSignal({request,slug:'toppsarena',site:p.site});
 assert.equal(b.listingUrl,null);
});
