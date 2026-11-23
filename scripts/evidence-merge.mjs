/** Pure merge/report helpers for GitHub-backed verification evidence. */
const time=s=>{const n=Date.parse(s||'');return Number.isFinite(n)?n:0};
const choose=(a,b,dateKey)=>{
 if(!a)return b;
 if(!b)return a;
 const ta=time(a[dateKey]),tb=time(b[dateKey]);
 return tb>ta?b:a;
};
export function mergeEvidence(remote={},local={}){
 const combined={...remote,...local,
   publishers:{...(remote.publishers||{})},
   knownListings:{...(remote.knownListings||{})}};
 for(const key of ['publishers','knownListings']){
   for(const [name,l] of Object.entries(local[key]||{})){
     const r=remote[key]?.[name]||{};
     const submission=choose(r.submission,l.submission,'submittedAt');
     const verification=choose(r.verification,l.verification,'checkedAt');
     const latest=time(l.verification?.checkedAt)>=time(r.verification?.checkedAt)?l:r;
     combined[key][name]={
       ...r,...l,
       ...(r.listingUrl||l.listingUrl?{listingUrl:latest.listingUrl||r.listingUrl||l.listingUrl}:{}),
       ...(submission?{submission}:{}),
       ...(verification?{verification}:{})
     };
   }
 }
 combined.updatedAt=new Date(Math.max(Date.now(),time(remote.updatedAt),time(local.updatedAt))).toISOString();
 return combined;
}
export function renderEvidenceReport(state={}){
 const all=[...Object.entries(state.publishers||{}),...Object.entries(state.knownListings||{})];
 const published=all.filter(([,v])=>v.verification?.status==='verified_published');
 const apiOnly=all.filter(([,v])=>v.verification?.status==='verified_public_api_record');
 const line=(s)=>String(s??'—').replace(/[\r\n|]/g,' ');
 return [
  '# TopPSArena — verified backlink evidence',
  '',
  'Updated: '+(state.updatedAt||'Unknown'),
  '',
  '## Public HTML-verified backlinks ('+published.length+')',
  '',
  'Counted only after an independently fetched public listing has an HTML anchor to https://toppsarena.com. A green workflow or accepted API response is not a backlink.',
  '',
  '| Directory | Published listing page | Relationship |',
  '|---|---|---|',
  ...published.map(([name,v])=>'| '+line(name)+' | '+line(v.verification.listedAt)+' | '+line(v.verification.rel)+' |'),
  '',
  '## Public provider API records — HTML link not proven ('+apiOnly.length+')',
  '',
  '| Directory | Public candidate listing | Evidence |',
  '|---|---|---|',
  ...apiOnly.map(([name,v])=>'| '+line(name)+' | '+line(v.verification.listedAt)+' | Public API record only |'),
  '',
  '## Submissions',
  '',
  '| Directory | HTTP | API status | Editorial review | Link verification |',
  '|---|---|---|---|---|',
  ...Object.entries(state.publishers||{}).map(([name,v])=>'| '+line(name)+' | '+line(v.submission?.httpStatus)+' | '+line(v.submission?.status||'not attempted')+' | '+line(v.review?.status||'—')+' | '+line(v.verification?.status||'pending')+' |'),
  '',
  'Failed retrieval and JS-only API records are not counted. No paid listings, CAPTCHA bypasses, or reciprocal links are used.',
  ''
 ].join('\n');
}
