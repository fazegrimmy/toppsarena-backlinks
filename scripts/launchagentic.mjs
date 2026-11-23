/**
 * LaunchAgentic adapter, per https://launchagentic.space/for-agents
 * Free organic product submission; explore five real product pages first.
 * No likes, comments, votes, payments, user accounts, invented testimonials, or engagements.
 * Secret exploration/status tokens NEVER leave this function or enter public state/logs.
 */
const base = 'https://launchagentic.space';
const cleanUrl = value => {
  if (typeof value !== 'string') return null;
  try {
    const u=new URL(value);
    if(u.protocol!=='https:'||u.hostname!=='launchagentic.space'||!/^\/p\/[a-z0-9-]+\/?$/.test(u.pathname)||u.search||u.hash)return null;
    return u.href;
  }catch{return null;}
};
async function jsonRequest(request,url,options={}){
  const r=await request(url,options);
  let json={};
  try{json=JSON.parse(r.body)}catch{return {httpStatus:r.httpStatus,data:null};}
  return {httpStatus:r.httpStatus,data:json};
}
const extractSlugs=v=>Array.isArray(v)?v.map(item=>typeof item==='string'?item:item?.slug).filter(s=>typeof s==='string'&&/^[a-z0-9-]{2,100}$/.test(s)):[];
export async function submitLaunchAgentic({request,site,title,description}){
  const result={status:'preflight_unavailable',httpStatus:null,candidateListingUrl:null,publicInfo:{}};
  // If already published, never POST a duplicate. The public page must itself pass backlink verification upstream.
  const existing=await request(base+'/p/toppsarena');
  if(existing.httpStatus===200 && /toppsarena\.com/i.test(existing.body)){
    return {status:'already_listed',httpStatus:200,candidateListingUrl:base+'/p/toppsarena',publicInfo:{existing:true}};
  }
  // The site itself documents a no-key, no-account session for legitimate exploration.
  const created=await jsonRequest(request,base+'/api/v1/explore/session',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  const token=created.data?.token;
  if(created.httpStatus>=400||typeof token!=='string'||token.length<6)return {...result,httpStatus:created.httpStatus,publicInfo:{reason:'Exploration session unavailable'}};
  const u=base+'/api/v1/explore/status?token='+encodeURIComponent(token);
  let status=await jsonRequest(request,u);
  let visited=new Set();
  while(status.httpStatus===200 && status.data?.complete!==true && visited.size<7){
    const next=extractSlugs(status.data?.next).find(s=>!visited.has(s));
    if(!next)break;
    visited.add(next);
    const visit=await request(base+'/p/'+encodeURIComponent(next)+'?explore='+encodeURIComponent(token));
    if(visit.httpStatus!==200)break;
    status=await jsonRequest(request,u);
  }
  if(status.data?.complete!==true||Number(status.data?.explored)<5) return {...result,publicInfo:{reason:'Required real product-page exploration not completed',explored:status.data?.explored??null}};
  const payload={name:title,description,type:'product',website:site,category:'gaming',tags:['gaming','private-servers','game-directory'],explorationToken:token};
  const submitted=await jsonRequest(request,base+'/api/v1/launch',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)
  });
  const d=submitted.data||{};
  // NEVER include statusToken or statusUrl, even if the API response is an error.
  const publicUrl=cleanUrl(d.url) || (typeof d.slug==='string'&&/^[a-z0-9-]{2,100}$/.test(d.slug)?base+'/p/'+d.slug:null);
  const info={status:d.status||null,published:d.published===true,scheduledFor:d.scheduledFor||null,duplicate:d.duplicate===true};
  const outcome=submitted.httpStatus>=200&&submitted.httpStatus<300 ?
    (d.published===true?'api_accepted_not_yet_verified':d.duplicate===true?'already_listed':'queued_not_published'):
    'api_rejected';
  return {status:outcome,httpStatus:submitted.httpStatus,candidateListingUrl:publicUrl,publicInfo:info};
}
