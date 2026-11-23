/**
 * LaunchSignal free anonymous API integration.
 * First-party docs: https://launchsignal.ai/docs/api
 * The read-only dry-run POST rejects duplicates (including pending)
 * without creating a listing. Never claim a link from HTTP 201 alone.
 */
import {safeListingUrl,targetHost} from './backlink-helpers.mjs';

const BASE='https://launchsignal.ai';
const HOST='launchsignal.ai';
const SLUG=/^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const parse=s=>{try{return JSON.parse(s)}catch{return null}};
const payload=({site,title,description,email})=>({
  name:title,url:site,description,category:'Other',email
});
function verifiedPublicPage(slug){
  if(typeof slug!=='string'||!SLUG.test(slug))return null;
  return safeListingUrl(BASE+'/l/'+encodeURIComponent(slug),HOST);
}
export async function submitLaunchSignal({request,site,title,description,email}){
  const data=payload({site,title,description,email});
  // First request must create NOTHING. This detects pending records as well as approved ones.
  const dry=await request(BASE+'/api/v1/products?dry_run=1',{
    method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify(data)
  });
  const preflight=parse(dry.body);
  if(dry.httpStatus===409&&['duplicate_domain','domain_previously_rejected'].includes(preflight?.error)){
    return {status:'already_queued_or_listed',httpStatus:409,publicInfo:{status:preflight.error}};
  }
  if(dry.httpStatus===429)return {status:'rate_limited_preflight',httpStatus:429,publicInfo:{status:'rate_limited'}};
  if(dry.httpStatus===400)return {status:'api_rejected',httpStatus:400,publicInfo:{status:preflight?.error||'validation_or_policy_rejected'}};
  if(dry.httpStatus!==200||preflight?.ok!==true||preflight?.dry_run!==true||preflight?.would_accept!==true){
    return {status:'preflight_unavailable',httpStatus:dry.httpStatus,publicInfo:{status:'preflight_not_confirmed'}};
  }
  if(preflight?.would_flag===true) {
    return {status:'preflight_flagged_for_review',httpStatus:200,publicInfo:{status:'manual_review_needed',flags:preflight.flags?.slice?.(0,4)||[]}};
  }
  // Real submission, exactly once after successful dry run.
  let res;
  try{res=await request(BASE+'/api/v1/products',{
    method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify(data)
  })}catch(e){
    // Outcome unknown; do NOT automatically retry a potentially accepted POST.
    return {status:'post_outcome_unknown',publicInfo:{status:'network_error_after_POST',note:'Never replay blindly; dry-run checks duplicates on review'}};
  }
  const dataOut=parse(res.body);
  if(res.httpStatus===201&&dataOut?.ok===true&&dataOut?.status==='pending'&&verifiedPublicPage(dataOut?.slug)){
    return {status:'queued_not_published',httpStatus:201,slug:dataOut.slug,publicInfo:{status:'pending_review'}};
  }
  if(res.httpStatus===409)return {status:'already_queued_or_listed',httpStatus:409,publicInfo:{status:dataOut?.error||'duplicate_domain'}};
  if(res.httpStatus===429)return {status:'rate_limited',httpStatus:429,publicInfo:{status:'rate_limited'}};
  if(res.httpStatus===201)return {status:'needs_review',httpStatus:201,publicInfo:{status:'accepted_no_valid_tracking_slug'}};
  return {status:'api_rejected',httpStatus:res.httpStatus,publicInfo:{status:dataOut?.error||'failed'}};
}
export async function checkLaunchSignal({request,slug,site}){
  if(!slug||!verifiedPublicPage(slug))return {status:'no_tracked_slug',listingUrl:null};
  const r=await request(BASE+'/api/v1/products/'+encodeURIComponent(slug));
  if(r.httpStatus===404)return {status:'pending_or_unavailable',listingUrl:null};
  if(r.httpStatus!==200)throw Error('LaunchSignal read-only publication check HTTP '+r.httpStatus);
  const row=parse(r.body);
  if(!row?.ok||row?.product?.status!=='approved'||row?.product?.slug!==slug||targetHost(row.product.url)!==targetHost(site)){
    return {status:'not_matched_or_not_approved',listingUrl:null};
  }
  return {status:'approved',listingUrl:verifiedPublicPage(slug)};
}
