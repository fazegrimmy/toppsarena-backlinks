/**
 * TopPSArena evidence-first backlink workflow.
 *
 * Submits only to explicitly documented, zero-cost, bot-permitted directory APIs.
 * A successful API response is NOT counted as a backlink: a public listing page
 * must be retrieved and contain a direct <a href> to toppsarena.com.
 */
import fs from 'node:fs';
import path from 'node:path';
import {findListingUrl,findOutbound,redact,classifyApiResponse,targetHost} from './backlink-helpers.mjs';
import {submitLaunchAgentic} from './launchagentic.mjs';

const ROOT = process.cwd();
const SOURCES = path.join(ROOT, 'campaign', 'verified-opportunities.json');
const STATE = path.join(ROOT, 'state', 'reliable-campaign.json');
const REPORT = path.join(ROOT, 'reports', 'verified-backlinks.md');
const SITE = 'https://toppsarena.com';
const EMAIL = process.env.TOPPSARENA_CONTACT_EMAIL || 'notifications@toppsarena.com';
const MODE = process.env.CAMPAIGN_MODE || 'verify'; // submit, verify
const UA = 'TopPSArena-DirectoryBot/1.0 (public site listing and backlink verification; toppsarena.com)';
const TITLE = 'TopPSArena';
const DESCRIPTION = 'TopPSArena is a free online directory for private gaming servers. Players can discover private server communities across game categories, explore detailed listings, compare servers and cast votes. Server owners can add their server and track listing activity.';
const data = JSON.parse(fs.readFileSync(SOURCES, 'utf8'));
if (!['submit','verify'].includes(MODE)) throw new Error('CAMPAIGN_MODE must be submit or verify');
const now = () => new Date().toISOString();

let state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {};
state.publishers ||= {};
state.knownListings ||= {};
state.updatedAt = now();
fs.mkdirSync(path.dirname(STATE), { recursive: true });
fs.mkdirSync(path.dirname(REPORT), { recursive: true });

function short(e) { return String(e ?? '').slice(0, 300); }
async function request(url, init = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 18000);
  try {
    const r = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      ...init,
      headers: { 'User-Agent': UA, Accept: 'text/html,application/json;q=0.9,*/*;q=0.5', ...(init.headers || {}) }
    });
    const body = (await r.text()).slice(0, 1500000);
    return { httpStatus:r.status, finalUrl:r.url, body };
  } finally { clearTimeout(timer); }
}
async function verifyListing(listingUrl) {
  try {
    const originalHost=targetHost(listingUrl);
    const r=await request(listingUrl);
    if (r.httpStatus!==200) return {status:'not_verifiable',reason:'HTTP '+r.httpStatus,checkedAt:now()};
    if (targetHost(r.finalUrl)!==originalHost) return {status:'not_verifiable',reason:'Listing redirects off its own directory host',checkedAt:now()};
    const a=findOutbound(r.body,r.finalUrl);
    if(!a)return {status:'not_verifiable',reason:'No direct HTML anchor to toppsarena.com',checkedAt:now()};
    return {status:'verified_published',listedAt:r.finalUrl,destination:a.destination,rel:a.rel,followed:a.followed,checkedAt:now()};
  }catch(e){return {status:'not_verifiable',reason:short(e.message),checkedAt:now()};}
}
async function checkTechtools(){
  const url='https://techtools.cz/launchpad-api/tools?url='+encodeURIComponent(SITE);
  const response=await request(url);
  if(response.httpStatus!==200)throw Error('TechTools read API: HTTP '+response.httpStatus);
  const parsed=JSON.parse(response.body);
  const listing=(Array.isArray(parsed.data)?parsed.data:[]).find(item=>targetHost(item?.url)===targetHost(SITE));
  if(!listing)return null;
  if(!Number.isInteger(Number(listing.id))||Number(listing.id)<=0)throw Error('TechTools existing record lacks a public numeric id');
  const listingUrl='https://techtools.cz/tools/launchpad/?tool='+encodeURIComponent(String(listing.id));
  return {listingUrl,listId:listing.id,raw:listing};
}
async function verifyTechtoolsApi(){
  try{
    const item=await checkTechtools();
    if(!item)return {status:'not_verifiable',reason:'No matching public TechTools API record',checkedAt:now()};
    return {status:'verified_public_api_record',listedAt:item.listingUrl,destination:SITE,rel:'unknown; page may render with JavaScript',followed:null,checkedAt:now()};
  }catch(e){return {status:'not_verifiable',reason:'TechTools lookup: '+short(e.message),checkedAt:now()};}
}
function save(){
  state.updatedAt=now();
  fs.writeFileSync(STATE,JSON.stringify(state,null,2)+'\n');
  const all=[...Object.entries(state.publishers),...Object.entries(state.knownListings)];
  const published=all.filter(([name,r])=>r.verification?.status==='verified_published');
  const jsonConfirmed=all.filter(([name,r])=>r.verification?.status==='verified_public_api_record');
  const pending=Object.entries(state.publishers).filter(([name,r])=>!['verified_published','verified_public_api_record'].includes(r.verification?.status));
  const lines=[
    '# TopPSArena — independent backlink evidence','','Generated: '+state.updatedAt,'',
    '## Public HTML-verified backlinks ('+published.length+')','',
    '**Counted only if an independently fetched, public directory HTML page contains a direct <a href> to https://toppsarena.com.** No claim of ranking benefit.','',
    '| Directory | Public page | Link relationship |',
    '|---|---|---|',
    ...published.map(([name,r])=>'| '+name+' | '+r.verification.listedAt+' | '+r.verification.rel+' |'),
    '',
    '## Public API records — not counted as HTML backlinks ('+jsonConfirmed.length+')','','A provider listing API can confirm publication while the public page itself is rendered in JavaScript. The HTML backlink has not independently been proven.','',
    '| Directory | Listing/share page | Evidence |',
    '|---|---|---|',
    ...jsonConfirmed.map(([name,r])=>'| '+name+' | '+r.verification.listedAt+' | Public directory API record |'),
    '',
    '## Submission and pending statuses','','| Directory | API result | Submission status | Link verification |','|---|---|---|---|',
    ...Object.entries(state.publishers).map(([name,r])=>'| '+name+' | '+(r.submission?.httpStatus??'—')+' | '+(r.submission?.status??'not attempted')+' | '+(r.verification?.status??'not verified')+' |'),
    '',
    'Published means a page actually links to TopPSArena. A successful workflow, API 201, review notice, or redirect alone never does. Results are rechecked, and unverified does not imply deleted.',
    ''
  ];
  fs.writeFileSync(REPORT,lines.join('\n'));
}
function providerPayload(v){
  if(v.id==='develif')return {url:SITE,email:EMAIL,name:TITLE,description:DESCRIPTION,category:'Gaming',locale:'en'};
  if(v.id==='curlship')return {url:SITE,email:EMAIL}; // never request a paid tier or badge verification
  if(v.id==='techtools')return {name:TITLE,url:SITE,tagline:'Find and vote for private game servers across multiple games',description:DESCRIPTION,category:'games',submitted_by:'TopPSArena GitHub Campaign'};
  if(v.id==='promoteindex')return {heardAbout:{source:'not-sure'},name:TITLE,url:SITE,tagline:'Discover, compare and vote for private game servers',description:DESCRIPTION,category:'community',tags:['private-servers','gaming','server-directory'],builtWith:['human','chatgpt'],pricing:'freemium',contactEmail:EMAIL,submittedBy:{kind:'agent',agent:'chatgpt'}};
  throw Error('Provider is not explicitly supported in reviewed code: '+v.id);
}
async function submitPublisher(v){
  if(!v.automationAllowed||v.cost!=='free'||v.requiresAccount||v.requiresBadge){
    console.log('SKIP not eligible for free bot submission: '+v.name);return;
  }
  if(!['develif','curlship','techtools','promoteindex','launchagentic'].includes(v.id))throw Error('Unreviewed API publisher '+v.id);
  const row=state.publishers[v.name]||{};
  // Never replay an accepted or rejected definitive POST on scheduled runs.
  if(row.submission && !['network_error','rate_limited','preflight_unavailable'].includes(row.submission.status))return;
  if(v.id==='launchagentic'){
    try{
      const result=await submitLaunchAgentic({request,site:SITE,title:TITLE,description:DESCRIPTION});
      row.submission={
        status:result.status,httpStatus:result.httpStatus,submittedAt:now(),
        responseSummary:short(JSON.stringify(result.publicInfo)),candidateListingUrl:result.candidateListingUrl
      };
      if(result.candidateListingUrl)row.listingUrl=result.candidateListingUrl;
      console.log('LaunchAgentic: '+result.status+'; candidate: '+(row.listingUrl||'none')+'; no private tokens saved');
    }catch(e){
      row.submission={status:'preflight_unavailable',submittedAt:now(),responseSummary:'Safe submission preflight did not complete: '+short(e.message)};
    }
    state.publishers[v.name]=row;save();return;
  }
  if(v.id==='techtools'){
    try{
      const existing=await checkTechtools();
      if(existing){
        row.listingUrl=existing.listingUrl;
        row.submission={status:'already_listed',httpStatus:200,submittedAt:now(),responseSummary:'Public URL lookup returned an existing exact-domain listing; no new POST sent',candidateListingUrl:existing.listingUrl};
        state.publishers[v.name]=row;save();return;
      }
    }catch(e){
      row.submission={status:'preflight_unavailable',submittedAt:now(),responseSummary:short(e.message)};
      state.publishers[v.name]=row;save();return;
    }
  }
  const payload=providerPayload(v);
  let response=null, httpStatus=null, finalStatus='network_error',listingUrl=null;
  let queueRetries=0;
  try {
    console.log('One permitted free API submission: '+v.name);
    let headers={'Content-Type':'application/json','X-Agent-Name':'TopPSArena Assistant'};
    while(true){
      const r=await request(v.api,{method:'POST',headers,body:JSON.stringify(payload)});
      httpStatus=r.httpStatus;
      try{response=JSON.parse(r.body)}catch{response={message:r.body.slice(0,400)}}
      finalStatus=classifyApiResponse(httpStatus,response);
      if(finalStatus!=='queued_not_published'||v.id!=='promoteindex'||queueRetries>=2)break;
      const details=response?.error?.details||response?.details||{};
      const after=Number(details.retryAfter??response?.retryAfter);
      const ticket=details.queue?.ticketId??response?.queue?.ticketId;
      if(!ticket||!Number.isFinite(after)||after<0||after>900)break;
      queueRetries++;
      console.log('PromoteIndex requested a queued retry in '+after+' seconds; ticket kept in memory only');
      await new Promise(resolve=>setTimeout(resolve,(after+1)*1000));
      headers={...headers,'X-Submission-Ticket':ticket};
    }
    listingUrl=findListingUrl(response,v.domain);
    if(!listingUrl&&v.id==='techtools'){
      const item=response?.data||response?.existing;
      if(item?.id&&Number.isInteger(Number(item.id)))listingUrl='https://techtools.cz/tools/launchpad/?tool='+encodeURIComponent(String(item.id));
    }
    if(!listingUrl&&v.id==='promoteindex'){
      const slug=response?.project?.slug||response?.data?.slug||response?.slug||response?.existing?.slug;
      if(typeof slug==='string'&&/^[a-z0-9-]{2,80}$/.test(slug))listingUrl='https://promoteindex.com/p/'+slug;
    }
    row.submission={
      status:finalStatus,httpStatus,submittedAt:now(),
      responseSummary:short(JSON.stringify(redact(response))),
      candidateListingUrl:listingUrl
    };
    if(listingUrl)row.listingUrl=listingUrl;
    console.log(v.name+': HTTP '+httpStatus+', '+finalStatus+'; public candidate URL: '+(listingUrl||'none'));
  }catch(e){
    row.submission={status:'network_error',submittedAt:now(),responseSummary:short(e.message)};
    console.log(v.name+': transient error; pending until reviewed');
  }
  state.publishers[v.name]=row;save();
}
async function main(){
 console.log('TopPSArena verified campaign: '+MODE+'; '+data.publishers.length+' preapproved free API publishers');
 for(const v of data.publishers){
   if(MODE==='submit')await submitPublisher(v);
   const row=state.publishers[v.name]||{};
   if(v.id==='develif' && row.submission?.httpStatus===409 && /already listed/i.test(row.submission?.responseSummary||''))row.submission.status='already_listed';
   if(row.listingUrl){
     row.verification=await verifyListing(row.listingUrl);
     if(row.verification.status!=='verified_published'&&v.id==='techtools'){
       const evidence=await verifyTechtoolsApi();
       if(evidence.status==='verified_public_api_record')row.verification=evidence;
     }
   }else if(v.id==='techtools'){
     const evidence=await verifyTechtoolsApi();
     if(evidence.status==='verified_public_api_record'){row.listingUrl=evidence.listedAt;row.verification=evidence;}
   }else if(v.id==='develif' && row.submission?.httpStatus===409){
     // 409 means already listed; try only the documented /s/slug public route.
     const candidate='https://develif.com/s/toppsarena';
     const evidence=await verifyListing(candidate);
     if(evidence.status==='verified_published'){row.listingUrl=evidence.listedAt;row.verification=evidence;}
   }
   state.publishers[v.name]=row;
   console.log(v.name+': '+(row.verification?.status||row.submission?.status||'not attempted'));
   save();
 }
 for(const e of data.knownListings){
   const row=state.knownListings[e.name]||{};
   row.listingUrl=e.url;
   row.verification=await verifyListing(e.url);
   state.knownListings[e.name]=row;save();
   console.log('Known '+e.name+': '+row.verification.status);
 }
 const all=[...Object.values(state.publishers),...Object.values(state.knownListings)];
 const published=all.filter(x=>x.verification?.status==='verified_published').length;
 const publicApi=all.filter(x=>x.verification?.status==='verified_public_api_record').length;
 console.log('RESULT: '+published+' HTML-verified published links; '+publicApi+' extra public API records (not counted as HTML backlinks).');
}
await main();
