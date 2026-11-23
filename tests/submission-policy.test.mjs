import test from 'node:test';
import assert from 'node:assert/strict';
import {attemptsOnUtcDate,maySubmit,DAILY_SUBMISSION_CAP} from '../scripts/submission-policy.mjs';

const date='2026-11-23';
const entry=(status,submittedAt='2026-11-23T22:49:27.540Z')=>({submission:{status,submittedAt}});
test('counts accepted listings, queued reviews and unknown POST outcomes, not old cached listings',()=>{
  const publishers={
    CurlShip:entry('api_accepted_not_yet_verified'),
    PromoteIndex:entry('api_accepted_not_yet_verified'),
    PostLaunchKit:entry('queued_not_published'),
    LaunchSignal:entry('queued_not_published'),
    DevElif:entry('already_listed'),
    TechTools:entry('already_listed'),
    Gate:entry('preflight_unavailable'),
    TooOld:entry('queued_not_published','2026-11-22T23:50:00Z')
  };
  assert.equal(attemptsOnUtcDate(publishers,date),4);
  assert.equal(maySubmit(publishers,date),false);
  assert.equal(maySubmit(publishers,'2026-11-24'),true);
  assert.equal(DAILY_SUBMISSION_CAP,4);
});
test('unknown result after POST is conservatively counted',()=>{
  assert.equal(attemptsOnUtcDate({v:entry('post_outcome_unknown')},date),1);
  assert.equal(attemptsOnUtcDate({v:entry('network_error')},date),1);
});
test('date parsing does not count invalid or missing evidence',()=>{
  assert.equal(attemptsOnUtcDate({v:entry('queued_not_published','not-a-date'),w:{submission:{status:'queued_not_published'}}},date),0);
  assert.throws(()=>attemptsOnUtcDate({},'this morning'),/YYYY-MM-DD/);
});
test('daily limit accepts up to four and blocks the fifth',()=>{
  const entries=Object.fromEntries(Array.from({length:3},(_,i)=>[i,entry('queued_not_published')]));
  assert.equal(maySubmit(entries,date),true);
  entries.fourth=entry('queued_not_published');
  assert.equal(maySubmit(entries,date),false);
});
