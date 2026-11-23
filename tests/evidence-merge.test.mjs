import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeEvidence,renderEvidenceReport} from '../scripts/evidence-merge.mjs';

test('merges newer state without losing other publisher submissions',()=>{
 const remote={updatedAt:'2026-11-23T21:00:00Z',publishers:{
   DevElif:{listingUrl:'https://develif.com/s/toppsarena',verification:{status:'verified_published',checkedAt:'2026-11-23T21:00:00Z',listedAt:'https://develif.com/s/toppsarena',rel:'noopener noreferrer'}},
   PromoteIndex:{submission:{status:'queued_not_published',submittedAt:'2026-11-23T21:00:00Z'}}
 }};
 const local={updatedAt:'2026-11-23T21:05:00Z',publishers:{
   DevElif:{verification:{status:'not_verifiable',checkedAt:'2026-11-23T20:00:00Z'}},
   LaunchAgentic:{submission:{status:'api_accepted_not_yet_verified',submittedAt:'2026-11-23T21:05:00Z'}}
 }};
 const merged=mergeEvidence(remote,local);
 assert.equal(merged.publishers.DevElif.verification.status,'verified_published');
 assert.equal(merged.publishers.DevElif.listingUrl,'https://develif.com/s/toppsarena');
 assert.equal(merged.publishers.PromoteIndex.submission.status,'queued_not_published');
 assert.equal(merged.publishers.LaunchAgentic.submission.status,'api_accepted_not_yet_verified');
});
test('latest submission record wins after concurrent writer',()=>{
 const old={publishers:{PromoteIndex:{submission:{status:'rate_limited',submittedAt:'2026-11-23T21:01:00Z'}}}};
 const newer={publishers:{PromoteIndex:{submission:{status:'already_listed',submittedAt:'2026-11-23T21:08:00Z'}}}};
 assert.equal(mergeEvidence(old,newer).publishers.PromoteIndex.submission.status,'already_listed');
 assert.equal(mergeEvidence(newer,old).publishers.PromoteIndex.submission.status,'already_listed');
});
test('reports count only actual public HTML anchored links, not provider API-only records',()=>{
 const state={updatedAt:'2026-11-23T21:00:00Z',publishers:{
   Real:{verification:{status:'verified_published',listedAt:'https://site.example/l/1',rel:'nofollow',checkedAt:'2026-11-23T21:00:00Z'}},
   ApiOnly:{verification:{status:'verified_public_api_record',listedAt:'https://api.example/item',checkedAt:'2026-11-23T21:00:00Z'}},
   Submitted:{submission:{status:'api_accepted_not_yet_verified',httpStatus:201,submittedAt:'2026-11-23T20:00:00Z'}}
 }};
 const report=renderEvidenceReport(state);
 assert.match(report,/HTML-verified backlinks \(1\)/);
 assert.match(report,/Public provider API records — HTML link not proven \(1\)/);
 assert.match(report,/Submitted \| 201 \| api_accepted_not_yet_verified/);
});
