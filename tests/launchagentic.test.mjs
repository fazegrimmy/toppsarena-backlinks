import test from 'node:test';
import assert from 'node:assert/strict';
import {submitLaunchAgentic} from '../scripts/launchagentic.mjs';

test('LaunchAgentic visits five distinct real product pages and never votes',async()=>{
 let n=0, posts=0, pageSlugs=new Set();
 const mock=async(url,opts={})=>{
  if(url.endsWith('/p/toppsarena'))return {httpStatus:404,body:'not found'};
  if(url.endsWith('/api/v1/explore/session'))return {httpStatus:200,body:JSON.stringify({token:'exp_private_session_123'})};
  if(url.includes('/api/v1/explore/status?'))return {httpStatus:200,body:JSON.stringify({explored:n,complete:n===5,next:[1,2,3,4,5].map(x=>({slug:'existing-project-'+x}))})};
  if(url.includes('/p/existing-project-')){
    assert.equal(opts.method,undefined);
    let slug=url.match(/existing-project-\d+/)[0];
    pageSlugs.add(slug);n=pageSlugs.size;
    return {httpStatus:200,body:'<html> real page </html>'};
  }
  if(url.endsWith('/api/v1/launch')){
    posts++;const p=JSON.parse(opts.body);
    assert.equal(p.type,'product');assert.equal(p.category,'gaming');
    assert.equal(p.explorationToken,'exp_private_session_123');
    return {httpStatus:201,body:JSON.stringify({success:true,url:'https://launchagentic.space/p/toppsarena',status:'scheduled',published:false,scheduledFor:'2026-11-25T12:00:00Z',statusToken:'lst_PRIVATE_SECRET',statusUrl:'https://launchagentic.space/api/v1/launch/status?token=lst_PRIVATE_SECRET'})};
  }
  throw Error('Unexpected mock request '+url);
 };
 const d=await submitLaunchAgentic({request:mock,site:'https://toppsarena.com',title:'TopPSArena',description:'Private server listing directory'});
 assert.equal(n,5);assert.equal(posts,1);
 assert.equal(d.status,'queued_not_published');
 assert.equal(d.candidateListingUrl,'https://launchagentic.space/p/toppsarena');
 assert.equal(JSON.stringify(d).includes('PRIVATE_SECRET'),false);
});
test('LaunchAgentic never posts if exploration is incomplete',async()=>{
 const mock=async(url,options={})=>{
  if(url.endsWith('/p/toppsarena'))return {httpStatus:404,body:''};
  if(url.endsWith('/api/v1/explore/session'))return {httpStatus:200,body:JSON.stringify({token:'exp_private_123'})};
  if(url.includes('/explore/status'))return {httpStatus:200,body:JSON.stringify({complete:false,explored:0,next:[]})};
  if(url.endsWith('/api/v1/launch'))throw Error('Must not post');
  throw Error('Unexpected URL '+url);
 };
 const x=await submitLaunchAgentic({request:mock,site:'https://toppsarena.com',title:'TopPSArena',description:'Free gaming server directory'});
 assert.equal(x.status,'preflight_unavailable');
});
test('LaunchAgentic does not repost an existing public same-domain listing',async()=>{
 let count=0;
 const mock=async(url,options={})=>{
  count++;
  if(url.endsWith('/p/toppsarena'))return {httpStatus:200,body:'<a href="https://toppsarena.com">TopPSArena</a>'};
  throw Error('Must not make further requests');
 };
 const x=await submitLaunchAgentic({request:mock,site:'https://toppsarena.com',title:'TopPSArena',description:'Gaming directory'});
 assert.equal(x.status,'already_listed');assert.equal(count,1);
});
