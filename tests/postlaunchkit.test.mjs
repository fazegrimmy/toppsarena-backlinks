import test from 'node:test';
import assert from 'node:assert/strict';
import {submitPostLaunchKit,checkPostLaunchKit} from '../scripts/postlaunchkit.mjs';

const site='https://toppsarena.com';
const uuid='123e4567-e89b-42d3-a456-426614174000';

test('anonymous free submission uses games, never badges, and returns pending review without claiming a backlink',async()=>{
 let posts=0;
 const request=async(url,opts={})=>{
   if(url.includes('/api/v1/projects?q='))return {httpStatus:200,body:JSON.stringify({count:0,results:[]})};
   if(url.endsWith('/api/v1/submit')){
     posts++;
     assert.equal(opts.method,'POST');
     const payload=JSON.parse(opts.body);
     assert.equal(payload.url,site);
     assert.equal(payload.category,'games');
     assert.equal(payload.wants_followed_link,false);
     assert.equal(payload.featured_interest,false);
     assert.equal(payload.agent_name,'TopPSArena DirectoryBot');
     assert.equal(payload.contact,undefined);
     return {httpStatus:202,body:JSON.stringify({status:'pending_review',id:uuid})};
   }
   throw Error('unexpected '+url);
 };
 const x=await submitPostLaunchKit({request,site,title:'TopPSArena',description:'Discover gaming servers'});
 assert.equal(posts,1);
 assert.equal(x.status,'queued_not_published');
 assert.equal(x.reviewId,uuid);
 assert.equal(x.listingUrl,null);
});

test('published exact-domain listing preflight blocks duplicate POST',async()=>{
 let hits=0;
 const request=async(url,opts={})=>{
   hits++;
   assert.equal(opts.method,undefined);
   return {httpStatus:200,body:JSON.stringify({results:[
     {url:'https://toppsarena.com.fake.net',page_url:'https://postlaunchkit.com/directory/fake/'},
     {url:site+'/',page_url:'https://postlaunchkit.com/directory/toppsarena/'}
   ]})};
 };
 const x=await submitPostLaunchKit({request,site,title:'TopPSArena',description:'Gaming'});
 assert.equal(hits,1);
 assert.equal(x.status,'already_listed');
 assert.equal(x.listingUrl,'https://postlaunchkit.com/directory/toppsarena/');
});

test('pending duplicate returns definitive status, not repeated submissions',async()=>{
 let posts=0;
 const request=async(url,opts={})=>{
   if(!opts.method)return {httpStatus:200,body:'{"results":[]}'};
   posts++;
   return {httpStatus:409,body:'{"error":"Domain already submitted"}'};
 };
 const x=await submitPostLaunchKit({request,site,title:'TopPSArena',description:'Gaming'});
 assert.equal(posts,1);
 assert.equal(x.status,'already_queued_or_listed');
});

test('unexpected public lookup fails closed before POST',async()=>{
 let posts=0;
 const request=async(url,opts={})=>{if(opts.method)posts++;return {httpStatus:503,body:'unavailable'}};
 await assert.rejects(()=>submitPostLaunchKit({request,site,title:'TopPSArena',description:'Gaming'}),/lookup HTTP 503/);
 assert.equal(posts,0);
});

test('review API is tracked without counting pending review as a public listing',async()=>{
 const request=async(url)=>{
   if(url.endsWith('/api/v1/submissions/'+uuid))return {httpStatus:200,body:JSON.stringify({status:'pending_review'})};
   if(url.includes('/api/v1/projects?q='))return {httpStatus:200,body:'{"results":[]}'};
   throw Error(url);
 };
 const x=await checkPostLaunchKit({request,site,reviewId:uuid});
 assert.deepEqual(x,{status:'pending_review',listingUrl:null});
});

test('approved review returns only safe public PostLaunchKit URL',async()=>{
 const request=async url=>{
   if(url.endsWith('/api/v1/submissions/'+uuid))return {httpStatus:200,body:JSON.stringify({status:'approved',page_url:'https://postlaunchkit.com/directory/toppsarena/'})};
   throw Error(url);
 };
 const x=await checkPostLaunchKit({request,site,reviewId:uuid});
 assert.equal(x.status,'approved');
 assert.equal(x.listingUrl,'https://postlaunchkit.com/directory/toppsarena/');
});

test('reject untrusted review page URL and fallback to public search',async()=>{
 const request=async url=>{
   if(url.endsWith('/api/v1/submissions/'+uuid))return {httpStatus:200,body:JSON.stringify({status:'approved',page_url:'https://evil.example/steal'})};
   if(url.includes('/api/v1/projects?q='))return {httpStatus:200,body:'{"results":[]}'};
   throw Error(url);
 };
 const x=await checkPostLaunchKit({request,site,reviewId:uuid});
 assert.equal(x.status,'approved');assert.equal(x.listingUrl,null);
});
