/**
 * TopPSArena directory campaign runner.
 * Works on a pinned, explicitly labelled unverified directory candidate list.
 * Safety: no login, captcha, paywall or terms checkbox bypass; only site-listing forms.
 * A success message is NOT a verified published backlink.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const MODE = process.env.RUN_MODE || 'preview';
const SHARD = Number(process.env.SHARD || '0');
const EMAIL = (process.env.CONTACT_EMAIL || '').trim();
const COUNT = 5;
const ROOT = process.cwd();
const DIR = path.join(ROOT, 'state');
const OUT = path.join(ROOT, 'results');
const FILE = path.join(DIR, 'shard-' + SHARD + '.json');
const candidates = JSON.parse(fs.readFileSync('campaign/candidates.json', 'utf8')).candidates;
if (!Number.isInteger(SHARD) || SHARD < 0 || SHARD >= COUNT) throw Error('Invalid shard');
if (!['preview','submit'].includes(MODE)) throw Error('Invalid mode');
if (MODE === 'submit' && (!EMAIL.includes('@') || process.env.CONFIRM !== 'SUBMIT')) throw Error('Live mode requires confirmation and contact email');
fs.mkdirSync(DIR, {recursive:true});
fs.mkdirSync(OUT, {recursive:true});

const mine = candidates.filter((v,i) => i % COUNT === SHARD);
let saved = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {shard:SHARD, records:{}};
saved.records ||= {};
const results = [];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const toText = s => (s || '').replace(/\s+/g,' ').trim();
const NAME = 'TopPSArena';
const WEBSITE = 'https://toppsarena.com';
const DESCRIPTION = 'TopPSArena is a free private gaming server directory featuring multiple game categories. Players can discover communities, read server descriptions, compare listings and vote for favourites. Server owners can list a private server and monitor its performance.';
const IS_PAYMENT = /(?:payment required|paid submissions? only|free submissions? (?:are )?(?:closed|unavailable)|listing fee required|credit card required|buy credits to submit)/i;
const IS_LOGIN = /(?:log in to submit|sign in to submit|login required|must be logged in|you need to log in|register to submit)/i;
const CAPTCHA = 'iframe[src*="recaptcha"],iframe[src*="hcaptcha"],.g-recaptcha,.h-captcha,[name*="captcha" i]';

function add(candidate, status, details, finalUrl) {
  const value = {name:candidate.name,url:candidate.url,status,details:toText(details).slice(0,220),checkedAt:new Date().toISOString(),landingUrl:finalUrl || null};
  saved.records[candidate.url] = value;
  results.push(value);
  console.log('[' + SHARD + '] ' + candidate.name + ' → ' + status + (details ? ': ' + toText(details).slice(0,90) : ''));
  fs.writeFileSync(FILE, JSON.stringify(saved,null,2)+'\n');
  fs.writeFileSync(path.join(OUT,'shard-'+SHARD+'.json'),JSON.stringify(results,null,2)+'\n');
}
async function persist() {
  const token=process.env.GITHUB_TOKEN;
  const repository=process.env.GITHUB_REPOSITORY;
  if (!token || !repository || MODE !== 'submit') return;
  const u='https://api.github.com/repos/'+repository+'/contents/state/shard-'+SHARD+'.json';
  for (let attempt=0; attempt<4; attempt++) {
    try {
      const headers={Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
      const get=await fetch(u,{headers});
      let sha;
      if(get.status===200)sha=(await get.json()).sha;
      else if(get.status!==404)throw Error('state read HTTP '+get.status);
      const body={message:'Record shard '+SHARD+' TopPSArena directory screening results',content:Buffer.from(JSON.stringify(saved,null,2)+'\n').toString('base64'),branch:'main'};
      if(sha)body.sha=sha;
      const put=await fetch(u,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(body)});
      if(put.ok){console.log('['+SHARD+'] checkpoint saved to GitHub');return;}
      throw Error('state write HTTP '+put.status);
    }catch(e){
      console.log('['+SHARD+'] checkpoint retry: '+e.message);
      await pause(1500*(attempt+1));
    }
  }
  console.log('['+SHARD+'] WARNING: remote checkpoint failed, download the artifact');
}
async function findPage(page, entry) {
  await page.goto(entry.url,{waitUntil:'domcontentloaded',timeout:22000});
  await page.waitForTimeout(650);
  const start = page.url();
  const links = await page.locator('a[href]').evaluateAll(nodes => nodes.map(a => ({href:a.href,text:(a.innerText||'').slice(0,90)})).filter(x => /submit (?:your |a )?(?:website|site|startup|product|project|tool)|add (?:your |a )?(?:site|website|listing|project)|list (?:your |a )?(?:site|website|project)|get listed|free listing/i.test(x.text)|| /\/(?:submit|add-(?:site|url)|get-listed)(?:\/|$|\?)/i.test(x.href)).slice(0,15)).catch(()=>[]);
  const currentHost=new URL(start).hostname.replace(/^www\./,'').toLowerCase();
  const same=links.find(x=>{try{return new URL(x.href).hostname.replace(/^www\./,'').toLowerCase()===currentHost&&x.href!==start&&!/login|signup|register/i.test(x.href)}catch{return false}});
  if(!same) return;
  // Follow an explicit on-site submission link only when the original page has no candidate form.
  const currentCount=await page.locator('form input[type="url"], form input[name*="website" i], form input[name*="url" i]').count().catch(()=>0);
  if(!currentCount){ await page.goto(same.href,{waitUntil:'domcontentloaded',timeout:20000}).catch(()=>{}); await page.waitForTimeout(400); }
}
async function inspectAndSubmit(browser, entry) {
  const context=await browser.newContext({viewport:{width:1280,height:900},locale:'en-GB'});
  const page=await context.newPage();
  page.setDefaultTimeout(7000);
  try {
    await findPage(page,entry);
    const target=page.url();
    if(/login|sign-in|signin|checkout|pricing|payment/i.test(target))return ['skipped_login_or_payment','Redirected to an account or payment page',target];
    let body=toText((await page.locator('body').textContent().catch(()=>''))||'');
    if(/just a moment|verify you are human|checking your browser/i.test(body.slice(0,2000)))return ['skipped_challenge','Human verification challenge',target];
    if(IS_PAYMENT.test(body.slice(0,4500)))return ['skipped_payment','Page says free submissions unavailable or payment required',target];
    if(IS_LOGIN.test(body.slice(0,4500)))return ['skipped_login','Login needed before submission',target];
    if(await page.locator(CAPTCHA).count())return ['skipped_captcha','Captcha detected; not bypassed',target];
    const forms=page.locator('form');
    let form=null,websiteInput=null;
    const count=Math.min(await forms.count(),15);
    for(let i=0;i<count;i++){
      const item=forms.nth(i);
      if(await item.locator('input[type="password"]').count())continue;
      const fields=item.locator('input[type="url"],input[name*="website" i],input[name*="site_url" i],input[name*="url" i],input[placeholder*="website" i],input[placeholder*="site url" i],input[placeholder*="url" i]');
      const n=Math.min(await fields.count(),15);
      for(let k=0;k<n;k++){const f=fields.nth(k);if(await f.isVisible().catch(()=>false)){form=item;websiteInput=f;break}}
      if(form)break;
    }
    if(!form)return ['skipped_no_site_form','No visible website listing URL form',target];
    if(await form.locator(CAPTCHA).count())return ['skipped_captcha','Captcha in submission form',target];
    if(await form.locator('input[type="password"]').count())return ['skipped_login','Password field in form',target];
    if(await form.locator('input[type="checkbox"][required]').count())return ['skipped_terms','Required consent checkbox must be reviewed manually',target];
    const buttons=form.locator('button[type="submit"],input[type="submit"],button:not([type])');
    let button=null;
    for(let i=0;i<Math.min(await buttons.count(),12);i++){
      const b=buttons.nth(i);
      if(!(await b.isVisible().catch(()=>false)))continue;
      const label=toText((await b.textContent().catch(()=>''))||(await b.getAttribute('value').catch(()=>''))||'');
      if(/(?:pay|purchase|subscribe|sign in|log in|register|checkout|buy)/i.test(label))continue;
      if(/submit|add|create|list|post|send|publish|launch|save/i.test(label)){button=b;break}
    }
    if(!button)return ['skipped_no_submit_button','Cannot identify safe listing submit button',target];
    await websiteInput.fill(WEBSITE);
    let filled=1,requiredMissing=[];
    const inputs=form.locator('input,textarea,select');
    const n=Math.min(await inputs.count(),45);
    for(let i=0;i<n;i++){
      const f=inputs.nth(i);
      if(filled>8)break;
      const m=await f.evaluate(el=>({tag:el.tagName.toLowerCase(),type:(el.type||'').toLowerCase(),required:!!el.required,hint:((el.name||'')+' '+(el.id||'')+' '+(el.placeholder||'')+' '+(el.labels?.[0]?.textContent||'')).toLowerCase(),value:el.value||''})).catch(()=>null);
      if(!m||m.type==='hidden'||m.type==='password'||m.type==='submit'||m.type==='button'||m.type==='radio'||m.type==='checkbox'||m.type==='file')continue;
      if(!(await f.isVisible().catch(()=>false)))continue;
      if(m.tag==='select'){
        const opts=await f.locator('option').allTextContents().catch(()=>[]);
        const chosen=opts.find(v=>/\bgaming\b|\bgames\b/i.test(v))||opts.find(v=>/\btechnology\b|\bweb\b/i.test(v))||opts.find(v=>/\bother\b|\bgeneral\b/i.test(v));
        if(chosen)await f.selectOption({label:chosen}).catch(()=>{});
        else if(m.required)requiredMissing.push('category');
        continue;
      }
      if(m.value)continue;
      const hint=m.hint;
      let value=null;
      if(m.type==='url'||/\b(?:site.?url|website.?url|web.?address|link.?url)\b/i.test(hint))value=WEBSITE;
      else if(m.type==='email'||/\bemail\b/i.test(hint))value=EMAIL;
      else if(/\b(anchor|link.?text)\b/i.test(hint))value='TopPSArena';
      else if(/\b(tagline|short.?description)\b/i.test(hint))value='Explore and rank private gaming servers';
      else if(/\b(?:website.?name|site.?name|product.?name|project.?name|listing.?name|site.?title|product.?title|startup.?name|title)\b/i.test(hint))value=NAME;
      else if(m.tag==='textarea'&&/desc|about|details|summary|tell us/i.test(hint))value=DESCRIPTION;
      else if(m.tag==='textarea'&&!/message|comment|feedback|review/i.test(hint))value=DESCRIPTION;
      if(value){await f.fill(value).catch(()=>{});filled++}
      else if(m.required)requiredMissing.push(hint.slice(0,65)||'unidentified field');
    }
    if(requiredMissing.length)return ['skipped_required_fields','Unfilled required fields: '+requiredMissing.slice(0,3).join('; '),target];
    // Avoid submitting forms with no apparent site name/description/contact context.
    if(filled<2)return ['skipped_incomplete_form','Form only accepted a URL; manual verification required',target];
    const oldUrl=page.url();
    try{await button.click({timeout:6500});await page.waitForTimeout(1700)}catch(e){return ['failed_submit_click',e.message,oldUrl]}
    body=toText((await page.locator('body').textContent().catch(()=>''))||'');
    const next=page.url();
    if(/captcha|recaptcha|invalid|required fields|payment required|error occurred|try again|please sign in/i.test(body.slice(0,4000)))return ['attempted_unconfirmed','Validation/challenge text appeared after clicking',next];
    if(/thank you for submitting|submission received|successfully submitted|listing submitted|awaiting approval|submitted for review|your submission was received/i.test(body))return ['reported_submitted','Success or review message detected; publication NOT verified',next];
    if(next!==oldUrl&&!/login|register|checkout|payment/i.test(next))return ['attempted_unverified','Page changed after submit; listing NOT verified',next];
    return ['attempted_unconfirmed','Clicked submit but no confirmation detected; listing NOT verified',next];
  }catch(e){return ['failed_runtime',e.message,page.url()]}finally{await context.close().catch(()=>{})}
}

async function main(){
  console.log('TopPSArena campaign shard '+SHARD+' / '+COUNT+'; '+mine.length+' of '+candidates.length+' unverified candidates; mode='+MODE);
  if(MODE==='preview'){
    const items=mine.map(c=>({name:c.name,url:c.url,submissionPageLikely:c.submissionPageLikely,freeVerified:false,risk:c.risk}));
    fs.writeFileSync(path.join(OUT,'preview-shard-'+SHARD+'.json'),JSON.stringify(items,null,2)+'\n');
    for(const c of items)console.log('CANDIDATE '+c.name+' '+c.url+' '+(c.submissionPageLikely?'possible form':'homepage requires discovery'));
    return;
  }
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  let tried=0;
  try{
    for(const item of mine){
      if(saved.records[item.url]){console.log('['+SHARD+'] already reviewed: '+item.name);continue}
      // Every candidate is checked for a real free site-submission form before anything is sent.
      const [status,details,finalUrl]=await inspectAndSubmit(browser,item);
      add(item,status,details,finalUrl);
      tried++;
      if(tried%4===0)await persist();
      await pause(30000);
    }
  }finally{await browser.close().catch(()=>{});await persist()}
  const counts={};for(const r of Object.values(saved.records))counts[r.status]=(counts[r.status]||0)+1;
  console.log('SHARD '+SHARD+' FINAL STATUS COUNTS '+JSON.stringify(counts));
}
main().catch(e=>{console.error(e);process.exitCode=1});
