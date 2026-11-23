/**
 * Keep organic directory submissions paced.
 * The campaign is deliberately distinct from proof of a published backlink.
 */
export const DAILY_SUBMISSION_CAP=4;
const ATTEMPT_STATES=new Set([
  'api_accepted_not_yet_verified',
  'queued_not_published',
  'needs_review',
  'post_outcome_unknown',
  'network_error'
]);
function validUTC(iso){
  if(typeof iso!=='string'||!/^\d{4}-\d\d-\d\dT/.test(iso))return null;
  const t=Date.parse(iso);
  return Number.isFinite(t)?new Date(t).toISOString().slice(0,10):null;
}
export function attemptsOnUtcDate(publishers,date){
  if(typeof date!=='string'||!/^\d{4}-\d\d-\d\d$/.test(date))throw Error('Expected YYYY-MM-DD');
  return Object.entries(publishers||{}).filter(([,r])=>{
    const attempt=r?.submission;
    if(!attempt||!ATTEMPT_STATES.has(attempt.status))return false;
    return validUTC(attempt.submittedAt)===date;
  }).length;
}
export function maySubmit(publishers,date,cap=DAILY_SUBMISSION_CAP){
  return attemptsOnUtcDate(publishers,date)<cap;
}
