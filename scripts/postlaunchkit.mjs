/**
 * PostLaunchKit: anonymous, free, editorially reviewed product listing API.
 * Docs: https://postlaunchkit.com/for-agents
 * Never claim a backlink from a 202 response; only a verified public HTML page counts.
 */
import {safeListingUrl, targetHost} from './backlink-helpers.mjs';

const HOST='postlaunchkit.com';
const BASE='https://postlaunchkit.com';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const REVIEW_STATUS=new Set(['pending_review','changes_requested','approved','rejected','withdrawn']);
const json=body=>{try{return JSON.parse(body)}catch{return null}};

export async function findPostLaunchKitListing({request,site}){
  const r=await request(BASE+'/api/v1/projects?q=toppsarena');
  if(r.httpStatus!==200)throw Error('PostLaunchKit public lookup HTTP '+r.httpStatus);
  const result=json(r.body);
  if(!result||!Array.isArray(result.results))throw Error('PostLaunchKit public lookup returned unexpected JSON');
  const match=result.results.find(x=>targetHost(x?.url)===targetHost(site));
  if(!match)return null;
  return safeListingUrl(match.page_url,HOST);
}

export async function submitPostLaunchKit({request,site,title,description}){
  // Only submit after a successful read-only existing-listing check.
  const already=await findPostLaunchKitListing({request,site});
  if(already)return {status:'already_listed',httpStatus:200,listingUrl:already,publicInfo:{status:'already_published'}};
  const payload={
    name:title,
    url:site,
    one_liner:'Discover, compare and vote for private gaming servers across multiple games.',
    why_try:description,
    category:'games',
    tags:['gaming','private-servers','server-directory'],
    agent_name:'TopPSArena DirectoryBot',
    wants_followed_link:false,
    featured_interest:false
  };
  const r=await request(BASE+'/api/v1/submit',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  });
  const response=json(r.body);
  if(r.httpStatus===202&&response?.status==='pending_review'&&UUID.test(response?.id||'')){
    return {status:'queued_not_published',httpStatus:202,reviewId:response.id,listingUrl:null,publicInfo:{status:'pending_review'}};
  }
  if(r.httpStatus===409)return {status:'already_queued_or_listed',httpStatus:409,listingUrl:null,publicInfo:{status:'duplicate_domain',note:'Existing queued or public record; no retry'}};
  if(r.httpStatus===429)return {status:'rate_limited',httpStatus:429,listingUrl:null,publicInfo:{status:'rate_limited'}};
  if(r.httpStatus===202)return {status:'needs_review',httpStatus:202,listingUrl:null,publicInfo:{status:'accepted_without_valid_review_id',note:'Do not resubmit automatically'}};
  return {status:'api_rejected',httpStatus:r.httpStatus,listingUrl:null,publicInfo:{status:'rejected_or_invalid',detail:String(response?.error||response?.message||'').slice(0,130)}};
}

export async function checkPostLaunchKit({request,site,reviewId}){
  let reviewStatus=null;
  if(reviewId){
    if(!UUID.test(reviewId))throw Error('PostLaunchKit review reference is not a valid UUID');
    const r=await request(BASE+'/api/v1/submissions/'+encodeURIComponent(reviewId));
    if(r.httpStatus===200){
      const d=json(r.body);
      if(!d||!REVIEW_STATUS.has(d.status))throw Error('PostLaunchKit review status has unexpected shape');
      reviewStatus=d.status;
      const page=safeListingUrl(d.page_url,HOST);
      if(d.status==='approved'&&page)return {status:'approved',listingUrl:page};
    } else if(r.httpStatus===404){
      reviewStatus='review_not_found';
    } else {
      throw Error('PostLaunchKit review check HTTP '+r.httpStatus);
    }
  }
  const publicPage=await findPostLaunchKitListing({request,site});
  if(publicPage)return {status:'published_lookup',listingUrl:publicPage};
  return {status:reviewStatus||'not_published',listingUrl:null};
}
