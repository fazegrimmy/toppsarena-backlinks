/**
 * Concurrency-safe GitHub evidence saver.
 * Runs after verified-campaign.mjs. Merges latest remote state through the
 * Contents API with optimistic SHA concurrency, instead of git pull --rebase.
 */
import fs from 'node:fs';
import {mergeEvidence,renderEvidenceReport} from './evidence-merge.mjs';
const repo=process.env.GITHUB_REPOSITORY;
const token=process.env.GITHUB_TOKEN;
if(!repo||!token)throw Error('GitHub repository and workflow token are required');
const api='https://api.github.com/repos/'+repo+'/contents/';
const local=JSON.parse(fs.readFileSync('state/reliable-campaign.json','utf8'));
const sleep=t=>new Promise(resolve=>setTimeout(resolve,t));
async function call(path,{method='GET',body}={}){
 const url=api+path;
 const response=await fetch(url,{
  method,
  headers:{
   Authorization:'Bearer '+token,
   Accept:'application/vnd.github+json',
   'X-GitHub-Api-Version':'2022-11-28',
   ...(body?{'Content-Type':'application/json'}:{})
  },
  ...(body?{body:JSON.stringify(body)}:{})
 });
 const json=await response.json().catch(()=>({}));
 return {status:response.status,json};
}
async function get(path){
 const out=await call(path);
 if(out.status===404)return {sha:null,content:null};
 if(out.status!==200)throw Error('Unable to read '+path+': HTTP '+out.status);
 return {sha:out.json.sha,content:Buffer.from(out.json.content.replace(/\n/g,''),'base64').toString('utf8')};
}
async function put(path,content,sha){
 return call(path,{method:'PUT',body:{
  message:'Update verified TopPSArena backlink evidence',
  content:Buffer.from(content).toString('base64'),
  ...(sha?{sha}:{}),
  branch:'main'
 }});
}
async function storeState(){
 const path='state/reliable-campaign.json';
 for(let attempt=0;attempt<8;attempt++){
  const remote=await get(path);
  const parsed=remote.content?JSON.parse(remote.content):{};
  const merged=mergeEvidence(parsed,local);
  const result=await put(path,JSON.stringify(merged,null,2)+'\n',remote.sha);
  if(result.status>=200&&result.status<300){
   console.log('Saved canonical evidence with '+Object.keys(merged.publishers||{}).length+' publishers');
   return merged;
  }
  if(![409,422].includes(result.status))throw Error('Evidence state write rejected: HTTP '+result.status);
  await sleep(500*(attempt+1));
 }
 throw Error('Evidence state write conflicted too many times');
}
async function storeReport(){
 const path='reports/verified-backlinks.md';
 for(let attempt=0;attempt<8;attempt++){
  // Read the canonical shared state after the write so reports reflect other jobs, too.
  const canonical=await get('state/reliable-campaign.json');
  const latest=JSON.parse(canonical.content);
  const content=renderEvidenceReport(latest);
  const remote=await get(path);
  if(remote.content===content){
   console.log('Report already up to date'); return latest;
  }
  const result=await put(path,content,remote.sha);
  if(result.status>=200&&result.status<300){
   console.log('Published independent backlink report');
   return latest;
  }
  if(![409,422].includes(result.status))throw Error('Evidence report write rejected: HTTP '+result.status);
  await sleep(500*(attempt+1));
 }
 throw Error('Evidence report write conflicted too many times');
}
await storeState();
const canonical=await storeReport();
const total=[...Object.values(canonical.publishers||{}),...Object.values(canonical.knownListings||{})].filter(x=>x.verification?.status==='verified_published').length;
console.log('HTML-VERIFIED PUBLISHED BACKLINKS: '+total);
