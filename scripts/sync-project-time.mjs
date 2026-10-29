// Ligikaudne ajakulu GitHubi tegevustest (mitte stopper ega tööaja faktimõõtmine).
// Arvutab kuni 1000 viimase commiti, 1000 PR-i ja projekti Issue-kommentaaride põhjal.
// Ainult Kiirmärke avaliku hoidla Issue-kirjetele; privaatseid Draft issue kirjeid ei avalda.
const owner = process.env.KIIRMARGE_PROJECT_OWNER || 'liikane';
const repo = 'liikane/kiirmarge';
const projectNumber = Number(process.env.KIIRMARGE_PROJECT_NUMBER);
const token = process.env.KIIRMARGE_PROJECT_TOKEN;
const fieldName = 'Estimated hours (auto)';

if (!token || !Number.isInteger(projectNumber) || projectNumber < 1) {
  console.log('Projektinumber või projekti ligipääsutoken puudub: sünkroonimist ei käivitata.');
  process.exit(0);
}

const headers = {
  Authorization: 'Bearer ' + token,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'kiirmarge-approx-time',
};

async function api(path) {
  const response = await fetch('https://api.github.com' + path, { headers });
  const data = await response.json();
  if (!response.ok) throw new Error('GitHub API ' + response.status + ': ' + (data.message || 'error'));
  return data;
}

async function graphql(query, variables) {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const data = await response.json();
  if (!response.ok || data.errors?.length) {
    throw new Error('GitHub GraphQL: ' + JSON.stringify(data.errors || data.message));
  }
  return data.data;
}

async function paginate(path, maxPages = 10) {
  const all = [];
  for (let page = 1; page <= maxPages; page++) {
    const url = path + (path.includes('?') ? '&' : '?') + 'per_page=100&page=' + page;
    const chunk = await api(url);
    if (!Array.isArray(chunk)) throw new Error('API pagination expected array');
    all.push(...chunk);
    if (chunk.length < 100) break;
  }
  return all;
}

function referencedIssues(message) {
  return [...new Set([...String(message || '').matchAll(/#(\d+)\b/g)].map(m => Number(m[1])))];
}

// Tegevussündmuste ligikaudsed kaalud minutites.
const activities = new Map();
function record(issueNumber, date, minutes) {
  if (!Number.isInteger(issueNumber) || !date || !minutes) return;
  if (!activities.has(issueNumber)) activities.set(issueNumber, []);
  activities.get(issueNumber).push({ day: date.slice(0, 10), minutes });
}

const commits = await paginate('/repos/' + repo + '/commits');
for (const commit of commits) {
  const timestamp = commit.commit?.author?.date || commit.commit?.committer?.date;
  for (const issue of referencedIssues(commit.commit?.message)) record(issue, timestamp, 30);
}
const pulls = await paginate('/repos/' + repo + '/pulls?state=all');
for (const pull of pulls) {
  for (const issue of referencedIssues((pull.title || '') + '\n' + (pull.body || ''))) {
    record(issue, pull.created_at, 30);
  }
}

const query = [
  'query ($login:String!,$number:Int!,$after:String) {',
  ' user(login:$login) { projectV2(number:$number) {',
  '   id',
  '   fields(first:100) { nodes { ... on ProjectV2Field { id name dataType } } }',
  '   items(first:50,after:$after) { pageInfo {hasNextPage endCursor} nodes {',
  '     id',
  '     fieldValues(first:40) { nodes { ... on ProjectV2ItemFieldNumberValue { number field { ... on ProjectV2Field {name} } } } }',
  '     content { ... on Issue { number createdAt repository {nameWithOwner}',
  '       comments(first:100) { nodes {createdAt author {login}} }',
  '     } }',
  '   } }',
  ' } } }',
].join('\n');
const mutation = [
  'mutation ($project:ID!,$item:ID!,$field:ID!,$value:Float!) {',
  ' updateProjectV2ItemFieldValue(input:{projectId:$project,itemId:$item,fieldId:$field,value:{number:$value}}) {',
  '   projectV2Item {id}',
  ' }',
  '}',
].join('\n');

let cursor = null;
let updated = 0;
let scanned = 0;
do {
  const data = await graphql(query, { login: owner, number: projectNumber, after: cursor });
  const project = data.user?.projectV2;
  if (!project) throw new Error('Privaatset projekti ei leitud või puuduvad Projectsi õigused');
  const field = project.fields.nodes.find(f => f?.name === fieldName && f.dataType === 'NUMBER');
  if (!field) throw new Error('Projektis puudub number-tüüpi väli: ' + fieldName);

  for (const item of project.items.nodes) {
    const issue = item.content;
    if (!issue || issue.repository?.nameWithOwner !== repo) continue;
    scanned++;
    // Issue loomine 15 min; iga inimkommentaar 15 min; viidatud commit 30 min; PR 30 min.
    const events = [{ day: issue.createdAt.slice(0, 10), minutes: 15 }];
    for (const comment of issue.comments.nodes) {
      if (comment.author?.login && !comment.author.login.endsWith('[bot]')) {
        events.push({ day: comment.createdAt.slice(0, 10), minutes: 15 });
      }
    }
    events.push(...(activities.get(issue.number) || []));
    // Piira hinnangut 4 tunniga ühe Issue ja kalendripäeva kohta.
    const dayTotals = new Map();
    for (const event of events) {
      dayTotals.set(event.day, Math.min(240, (dayTotals.get(event.day) || 0) + event.minutes));
    }
    const hours = [...dayTotals.values()].reduce((sum, m) => sum + m, 0) / 60;
    const previous = item.fieldValues.nodes.find(v => v?.field?.name === fieldName)?.number;
    if (typeof previous === 'number' && Math.abs(previous - hours) < 0.001) continue;
    await graphql(mutation, { project: project.id, item: item.id, field: field.id, value: hours });
    updated++;
  }
  cursor = project.items.pageInfo.hasNextPage ? project.items.pageInfo.endCursor : null;
} while (cursor);

console.log('Kiirmärge: ' + scanned + ' Issue kirjet kontrollitud, ' + updated + ' ajakulu välja uuendatud.');
