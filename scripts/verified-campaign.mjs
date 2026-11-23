/**
 * TopPSArena evidence-first backlink workflow.
 *
 * Submits only to explicitly documented, zero-cost, bot-permitted directory APIs.
 * A successful API response is NOT counted as a backlink: a public listing page
 * must be retrieved and contain a direct <a href> to toppsarena.com.
 */
import fs from 'node:fs';
import path from 'node:path';

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
function safeUrl(value, allowedHost) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || ![allowedHost, 'www.' + allowedHost].includes(url.hostname)) return null;
    if (url.pathname === '/' && !url.search) return null;
    return url.href;
  } catch { return null; }
}
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
function findListingUrl(value, allowedHost, depth = 0) {
  if (depth > 5 || !value) return null;
  if (Array.isArray(value)) {
    for (const v of value) { const found = findListingUrl(v, allowedHost, depth + 1); if (found) return found; }
  } else if (typeof value === 'object') {
    const preferred = ['listing_url','listingUrl','public_url','publicUrl','permalink','detail_url','detailUrl','profile_url','profileUrl','link','url','href'];
    for (const k of preferred) {
      const u = safeUrl(value[k], allowedHost);
      if (u) return u;
    }
    for (const [k,v] of Object.entries(value)) {
      if (/(?:listing|profile|result|data|site|url)/i.test(k)) {
        const found = findListingUrl(v, allowedHost, depth+1);
        if (found) return found;
      }
    }
  } else if (typeof value === 'string') {
    return safeUrl(value, allowedHost);
  }
  return null;
}
function findOutbound(body, pageUrl) {
  const re = /<a\b([^>]*?)>/gi;
  let match;
  while ((match = re.exec(body)) !== null) {
    const attrs = match[1] || '';
    const href = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (!href) continue;
    const raw = (href[1] || href[2] || href[3] || '').replace(/&amp;/gi, '&').trim();
    try {
      const u = new URL(raw, pageUrl);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') continue;
      const domain = u.hostname.replace(/^www\./i, '').toLowerCase();
      if (domain !== 'toppsarena.com') continue;
      const rel = (attrs.match(/\brel\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i) || []).slice(1).find(Boolean) || '';
      return { destination:u.href, rel:rel.toLowerCase(), followed: !/\b(?:nofollow|ugc|sponsored)\b/i.test(rel) };
    } catch {}
  }
  return null;
}
async function verifyListing(listingUrl) {
  try {
    const r = await request(listingUrl);
    if (r.httpStatus !== 200) return { status:'not_verifiable', reason:'HTTP ' + r.httpStatus, checkedAt:now() };
    const a = findOutbound(r.body, r.finalUrl);
    if (!a) return { status:'not_verifiable', reason:'No direct public link to toppsarena.com in fetched page HTML', checkedAt:now() };
    return { status:'verified_published', listedAt:r.finalUrl, destination:a.destination, rel:a.rel || '(none)', followed:a.followed, checkedAt:now() };
  } catch(e) { return { status:'not_verifiable', reason:short(e.message), checkedAt:now() }; }
}
function save() {
  state.updatedAt = now();
  fs.writeFileSync(STATE,JSON.stringify(state,null,2)+'\n');
  const published = [];
  for (const [name,v] of Object.entries(state.publishers)) if (v.verification?.status==='verified_published') published.push({ name, ...v.verification });
  for (const [name,v] of Object.entries(state.knownListings)) if (v.verification?.status==='verified_published') published.push({name, ...v.verification});
  const lines = [
    '# TopPSArena — verified published backlinks',
    '',
    'Generated: ' + state.updatedAt,
    '',
    '**Only a fetched public page with a direct HTML link to https://toppsarena.com counts as verified.** API submissions alone are not successes.',
    '',
    '| Directory | Public listing page | Link rel |',
    '|---|---|---|',
    ...published.map(x => '| '+x.name+' | '+x.listedAt+' | '+x.rel+' |'),
    '',
    '## API submission records (publication not implied)',
    '',
    '| Directory | HTTP result | Submission record | Listing verification |',
    '|---|---|---|---|',
    ...Object.entries(state.publishers).map(([name,x]) => '| '+name+' | '+(x.submission?.httpStatus??'—')+' | '+(x.submission?.status??'not attempted')+' | '+(x.verification?.status??'pending')+' |'),
    '',
    'Known listing pages are verification-only. No payment, account creation, CAPTCHA or bulk form submission is performed.',
    ''
  ];
  fs.writeFileSync(REPORT,lines.join('\n'));
}
async function submitPublisher(v) {
  if (!v.automationAllowed || v.cost !== 'free' || v.requiresAccount) {
    console.log('BLOCKED (not preapproved): '+v.name);
    return;
  }
  const row=state.publishers[v.name]||{};
  if (row.submission && row.submission.status !== 'network_error') return; // idempotent, never post again after any definite HTTP response
  let payload;
  if (v.id === 'develif') {
    payload = { url:SITE, email:EMAIL, name:TITLE, description:DESCRIPTION, category:'Gaming', locale:'en' };
  } else if (v.id === 'curlship') {
    payload = { url:SITE, email:EMAIL }; // explicitly omit tier to guarantee free tier
  } else {throw new Error('Unknown publisher — code review required for adding API: '+v.id);}
  try {
    console.log('Sending one documented free API submission to '+v.name);
    const r=await request(v.api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    let response;
    try {response=JSON.parse(r.body);}catch {response={message:r.body.slice(0,400)};}
    const found=findListingUrl(response,v.domain);
    row.submission={
      status: r.httpStatus >= 200 && r.httpStatus < 300 ? 'api_accepted_not_yet_verified' : 'api_rejected',
      httpStatus:r.httpStatus, submittedAt:now(), responseSummary:short(JSON.stringify(response)),
      candidateListingUrl:found
    };
    if (found) row.listingUrl=found;
    console.log(v.name+': HTTP '+r.httpStatus+'; candidate page '+(found||'not supplied'));
  } catch(e) {
    row.submission={status:'network_error',submittedAt:now(),responseSummary:short(e.message)};
    console.log(v.name+': network error '+short(e.message));
  }
  state.publishers[v.name]=row; save();
}
async function main(){
  console.log('TopPSArena evidence-first campaign: '+MODE+', '+data.publishers.length+' eligible public APIs');
  for (const v of data.publishers) {
    if (MODE==='submit') await submitPublisher(v);
    const row=state.publishers[v.name]||{};
    if(row.listingUrl) row.verification=await verifyListing(row.listingUrl);
    state.publishers[v.name]=row;
    console.log(v.name+': '+(row.verification?.status||row.submission?.status||'not attempted'));
    save();
  }
  for (const e of data.knownListings){
    const row=state.knownListings[e.name]||{};
    row.listingUrl=e.url;
    row.verification=await verifyListing(e.url);
    state.knownListings[e.name]=row;
    console.log('Known '+e.name+': '+row.verification.status);
    save();
  }
  const published=Object.values(state.publishers).filter(x=>x.verification?.status==='verified_published').length;
  console.log('NEW-PUBLISHER VERIFICATION: '+published+' published backlinks from '+data.publishers.length+' preapproved publishers (not a claim of SEO impact)');
}
await main();
