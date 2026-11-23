import test from 'node:test';
import assert from 'node:assert/strict';
import {findOutbound,findListingUrl,redact,safeListingUrl,classifyApiResponse} from '../scripts/backlink-helpers.mjs';

test('published anchored link is counted with its rel attribute',()=>{
  const x=findOutbound('<a href="https://toppsarena.com/?ref=dir" rel="nofollow noopener">Visit</a>','https://dir.example/l/1');
  assert.deepEqual(x,{destination:'https://toppsarena.com/?ref=dir',rel:'nofollow noopener',followed:false});
});
test('clean anchored link is marked followed',()=>{
  const x=findOutbound('<a class="visit" href="https://www.toppsarena.com/">Open</a>','https://dir.example/l/1');
  assert.equal(x.followed,true);
});
test('ignore plaintext, JSON and script mentions, and comments',()=>{
  const html='<script>document.write(\'<a href="https://toppsarena.com">fake</a>\')</script><!-- <a href="https://toppsarena.com">fake</a> --> {"href":"https://toppsarena.com"}';
  assert.equal(findOutbound(html,'https://dir.example/l/1'),null);
});
test('ignore other domains, javascript links, encoded lookalike domains',()=>{
  assert.equal(findOutbound('<a href="https://toppsarena.com.bad.example">Fake</a> <a href="javascript:void(0)">JS</a>','https://dir.example/l/1'),null);
});
test('find provider-host public URL, never user destination or provider homepage',()=>{
  const response={listing:{url:'https://toppsarena.com/',share_url:'https://techtools.cz/tools/launchpad/?tool=11593'}};
  assert.equal(findListingUrl(response,'techtools.cz'),'https://techtools.cz/tools/launchpad/?tool=11593');
  assert.equal(findListingUrl({url:'https://toppsarena.com'},'techtools.cz'),null);
  assert.equal(safeListingUrl('https://techtools.cz/','techtools.cz'),null);
});
test('do not accept API edit/management links from another host',()=>{
  assert.equal(findListingUrl({share_url:'https://wrongsite.example/l/1'},'techtools.cz'),null);
});
test('redact private manage keys and owner emails before public report',()=>{
  const x=redact({data:{id:1,manage_key:'lpk_12345678901234567890',ownerEmail:'email@example.com'},editKey:'secret',url:'https://example.com'});
  assert.equal(x.data.manage_key,'[REDACTED]');
  assert.equal(x.data.ownerEmail,'[REDACTED]');
  assert.equal(x.editKey,'[REDACTED]');
  assert.equal(x.url,'https://example.com');
});
test('API acceptance is never called a published backlink',()=>{
  assert.equal(classifyApiResponse(201,{ok:true}),'api_accepted_not_yet_verified');
  assert.equal(classifyApiResponse(409,{error:'This site is already listed.'}),'already_listed');
  assert.equal(classifyApiResponse(202,{code:'submission_queue'}),'queued_not_published');
  assert.equal(classifyApiResponse(429,{error:'Rate limited'}),'rate_limited');
  assert.equal(classifyApiResponse(429,{error:{code:'submission_queue',details:{retryAfter:599,queue:{ticketId:'private'}}}}),'queued_not_published');
});

test('reject private management URLs and keep signed tickets out of evidence',()=>{
  assert.equal(safeListingUrl('https://techtools.cz/tools/launchpad/?tool=9#manage=lpk_test','techtools.cz'),null);
  assert.equal(safeListingUrl('https://techtools.cz/tools/launchpad/?key=supersecret','techtools.cz'),null);
  const row=redact({error:{details:{queue:{ticketId:'SIGNED_PRIVATE_QUEUE',ticketNumber:'92'}}},editUrl:'https://example.com/edit?key=secret'});
  assert.equal(row.error.details.queue.ticketId,'[REDACTED]');
  assert.equal(row.editUrl,'[REDACTED]');
});
