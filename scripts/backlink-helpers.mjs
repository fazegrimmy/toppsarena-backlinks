// Public page evidence helpers. No external dependencies.
export const SITE_HOST = 'toppsarena.com';
export function targetHost(value) {
  try { return new URL(value).hostname.toLowerCase().replace(/^www\./,''); }
  catch { return ''; }
}
export function safeListingUrl(value, host) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const u=new URL(value);
    const domain=u.hostname.toLowerCase().replace(/^www\./,'');
    if (u.protocol!=='https:' || domain!==host.replace(/^www\./,'').toLowerCase()) return null;
    if (u.username || u.password || (u.pathname==='/' && !u.search)) return null;
    if (u.hash || [...u.searchParams.keys()].some(k=>/token|secret|auth|manage|edit|key/i.test(k))) return null;
    return u.href;
  } catch { return null; }
}
export function redact(value,depth=0) {
  if (depth>8) return '[depth-limit]';
  if (typeof value==='string') return value.replace(/(?:lpk_|sk_|pk_)[A-Za-z0-9_-]{12,}/g,'[REDACTED_KEY]');
  if (!value || typeof value!=='object') return value;
  if (Array.isArray(value))return value.slice(0,30).map(x=>redact(x,depth+1));
  const out={};
  for(const [k,v] of Object.entries(value).slice(0,60)){
    if(/secret|password|token|auth|session|cookie|api.?key|manage.?key|edit.?key|edit.?url|manage.?url|ticket|bearer|contact.?email|owner.?email|private.?url/i.test(k))out[k]='[REDACTED]';
    else out[k]=redact(v,depth+1);
  }
  return out;
}
export function findListingUrl(value, allowedHost, depth=0) {
  if (depth>6 || !value) return null;
  if (typeof value==='string')return safeListingUrl(value,allowedHost);
  if (Array.isArray(value)){for(const x of value){const u=findListingUrl(x,allowedHost,depth+1);if(u)return u;}return null;}
  if (typeof value==='object'){
    for(const k of ['share_url','shareUrl','listing_url','listingUrl','public_url','publicUrl','permalink','detail_url','detailUrl','profile_url','profileUrl','href']){
      const u=safeListingUrl(value[k],allowedHost);if(u)return u;
    }
    for(const k of ['listing','existing','project','data','result','site','tool','links']){
      if(value[k]){const u=findListingUrl(value[k],allowedHost,depth+1);if(u)return u;}
    }
    // Fallback only to a provider-host URL, never the submitted target homepage.
    for(const k of ['url','link']){const u=safeListingUrl(value[k],allowedHost);if(u)return u;}
  }
  return null;
}
export function findOutbound(html,pageUrl) {
  if(typeof html!=='string')return null;
  // Only count actual HTML anchor tags. Mentions in JSON, text, or <script> do not qualify.
  const clean=html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'').replace(/<!--[\s\S]*?-->/g,'');
  const re=/<a\b([^>]*?)>/gi;let match;
  while((match=re.exec(clean))){
    const attrs=match[1]||'';
    const href=attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if(!href)continue;
    const raw=(href[1]||href[2]||href[3]||'').replace(/&amp;/gi,'&').trim();
    try{
      const u=new URL(raw,pageUrl);
      if(!['https:','http:'].includes(u.protocol) || targetHost(u.href)!==SITE_HOST)continue;
      const rel=(attrs.match(/\brel\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i)||[]).slice(1).find(Boolean)||'';
      return {destination:u.href,rel:rel.toLowerCase()||'(none)',followed:!/\b(?:nofollow|ugc|sponsored)\b/i.test(rel)};
    }catch{}
  }
  return null;
}
export function classifyApiResponse(status,body) {
  if(status===409 && /already|duplicate|listed|exists/i.test(JSON.stringify(body)))return 'already_listed';
  if(status===429)return 'rate_limited';
  if(status===202 || body?.code==='submission_queue' || body?.error==='submission_queue')return 'queued_not_published';
  if(status>=200&&status<300)return 'api_accepted_not_yet_verified';
  return 'api_rejected';
}
export function isVerified(x){return x?.verification?.status==='verified_published';}
