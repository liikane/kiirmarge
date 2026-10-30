#!/usr/bin/env node
// Actual, completed Operon timer time -> GitHub Projects V2 "Actual hours".
// Dry-run default; no task descriptions or private note contents are uploaded.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const vault=process.env.OPERON_VAULT;
const apply=process.argv.includes('--apply');
const number=Number(process.env.KIIRMARGE_PROJECT_NUMBER);
const owner=process.env.KIIRMARGE_PROJECT_OWNER || 'liikane';
const fieldName=process.env.KIIRMARGE_ACTUAL_FIELD || 'Actual hours';
if(!vault) throw new Error('OPERON_VAULT must point to the Obsidian vault');
if(apply && (!Number.isInteger(number) || number<1)) throw new Error('Set KIIRMARGE_PROJECT_NUMBER');
const repository=process.env.OPERON_GITHUB_REPOSITORY || 'liikane/kiirmarge';
const issuePattern=/https:\/\/github\.com\/([^/\s]+\/[^/\s]+)\/issues\/(\d+)(?!\d)/gi;
function ids(m) {
  const out=new Set();
  const explicit=String(m.githubIssue||m.github_issue||'').trim();
  if(repository==='liikane/kiirmarge' && /^#?\d+$/.test(explicit)) out.add(Number(explicit.replace('#','')));
  const projectItem=String(m.githubProjectItem||'').trim();
  if(/^PVTI_[A-Za-z0-9_-]+$/.test(projectItem))out.add(projectItem);
  for(const str of [explicit,String(m.links||'')])
    for(const match of str.matchAll(issuePattern)) if(match[1]===repository)out.add(Number(match[2]));
  return [...out].filter(x=>typeof x==='string'||(Number.isSafeInteger(x)&&x>0));
}
function records(src) {
  const out=[];
  const front=src.replace(/^\uFEFF/,'').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if(front) {
    const m={};let key='';
    for(const line of front[1].split(/\r?\n/)) {
      const root=line.match(/^([A-Za-z][\w-]*):(?:\s*(.*))?$/);
      if(root){key=root[1];if(['operonId','duration','githubIssue','github_issue','githubProjectItem','links'].includes(key))m[key]=(root[2]||'').trim().replace(/^['"]|['"]$/g,'');}
      else if(key==='links'&&/^\s+-\s+/.test(line))m.links=(m.links||'')+' '+line.replace(/^\s+-\s+/,'').trim().replace(/^['"]|['"]$/g,'');
    }
    out.push(m);
  }
  for(const line of src.split(/\r?\n/)) {
    if(!/^\s*[-*]\s+\[[ xX]\]/.test(line))continue;
    const m={};
    for(const match of line.matchAll(/\{\{([\w-]+)::\s*([^}]*?)\}\}/g))
      if(['operonId','duration','githubIssue','github_issue','githubProjectItem','links'].includes(match[1]))m[match[1]]=match[2].trim();
    out.push(m);
  }
  return out;
}
function* files(folder) {
  if(!fs.existsSync(folder))return;
  for(const ent of fs.readdirSync(folder,{withFileTypes:true})) {
    if(ent.isSymbolicLink())continue;
    const p=path.join(folder,ent.name);
    if(ent.isDirectory()&&!['.git','.obsidian','node_modules','Docs','backups'].includes(ent.name))yield* files(p);
    else if(ent.isFile()&&p.toLowerCase().endsWith('.md')&&fs.statSync(p).size<1048576)yield p;
  }
}
const tasks=new Map(),byIssue=new Map();
const folderSpec=process.env.OPERON_TIME_DIRS||'Operon/Tasks';
let totalFiles=0,ambiguous=0;
for(const rel of folderSpec.split(';').map(x=>x.trim()).filter(Boolean)) {
  const root=path.resolve(vault),target=path.resolve(root,rel);
  if(target!==root&&!target.startsWith(root+path.sep))throw new Error('Directory must be inside vault');
  for(const f of files(target)){
    totalFiles++;
    for(const m of records(fs.readFileSync(f,'utf8'))){
      if(!m.operonId||!/^\d+(?:\.\d+)?$/.test(String(m.duration||'')))continue;
      const matches=ids(m);
      if(matches.length!==1){if(matches.length>1)ambiguous++;continue;}
      const seconds=Number(m.duration);
      if(!Number.isFinite(seconds)||seconds<0||seconds>315360000)continue;
      const old=tasks.get(m.operonId);
      if(old && (old.issue!==matches[0]||old.seconds!==seconds))
        throw new Error('Conflicting duplicate operonId; fix Obsidian sync conflict');
      tasks.set(m.operonId,{issue:matches[0],seconds});
    }
  }
}
for(const {issue,seconds} of tasks.values())byIssue.set(issue,(byIssue.get(issue)||0)+seconds);
console.log('Files:',totalFiles,'linked Operon tasks:',tasks.size,'Issues:',byIssue.size,'ambiguous:',ambiguous);
for(const [n,sec] of [...byIssue].sort((a,b)=>String(a[0]).localeCompare(String(b[0]))))console.log('Issue #'+n+': '+(sec/3600).toFixed(2)+' h');
if(!apply){console.log('Dry-run; no changes.');process.exit(0);}
// Validate project access and field even when there are no linked tasks.
let token=process.env.KIIRMARGE_PROJECT_TOKEN||process.env.GH_TOKEN;
if(!token) {
  const gh=spawnSync('gh',['auth','token'],{encoding:'utf8',windowsHide:true,timeout:10000});
  if(gh.status===0)token=gh.stdout.trim();
}
if(!token)throw new Error('GitHub token missing; use gh auth login -s project or set KIIRMARGE_PROJECT_TOKEN');
const headers={Authorization:'Bearer '+token,Accept:'application/vnd.github+json','Content-Type':'application/json'};
async function gql(query,variables){
  const res=await fetch('https://api.github.com/graphql',{method:'POST',headers,body:JSON.stringify({query,variables}),signal:AbortSignal.timeout(20000)});
  const payload=await res.json();
  if(!res.ok||payload.errors?.length)throw new Error('GitHub GraphQL: '+JSON.stringify(payload.errors||res.status).slice(0,1000));
  return payload.data;
}
const readQuery=[
'query($login:String!,$number:Int!,$after:String){user(login:$login){projectV2(number:$number){',
'id fields(first:100){nodes{... on ProjectV2Field{id name dataType}}}',
'items(first:100,after:$after){pageInfo{hasNextPage endCursor}nodes{',
'id content{... on Issue{number repository{nameWithOwner}}}',
'fieldValues(first:100){nodes{... on ProjectV2ItemFieldNumberValue{number field{... on ProjectV2Field{name}}}}}',
'}}}}}'
].join(' ');
const writeMutation=[
'mutation($project:ID!,$item:ID!,$field:ID!,$value:Float!){',
'updateProjectV2ItemFieldValue(input:{projectId:$project,itemId:$item,fieldId:$field,value:{number:$value}}){projectV2Item{id}}}'
].join(' ');
let cursor=null,updated=0,matched=0;
do{
  const response=await gql(readQuery,{login:owner,number,after:cursor});
  const project=response.user?.projectV2;
  if(!project)throw new Error('Private project not found or permission missing');
  const field=project.fields.nodes.find(f=>f?.name===fieldName&&f.dataType==='NUMBER');
  if(!field)throw new Error('Missing NUMBER project field: '+fieldName);
  for(const item of project.items.nodes){
    const key=byIssue.has(item.id)?item.id:(item.content?.repository?.nameWithOwner===repository?item.content.number:null);
    if(!byIssue.has(key))continue;
    matched++;
    const hours=Math.round(byIssue.get(key)/36)/100;
    const old=item.fieldValues.nodes.find(v=>v?.field?.name===fieldName)?.number;
    if(!(typeof old==='number'&&Math.abs(old-hours)<0.005)){
      await gql(writeMutation,{project:project.id,item:item.id,field:field.id,value:hours});
      updated++;
    }
    if(process.env.OPERON_COMPARE_ESTIMATE==='1'){
      const varianceField=project.fields.nodes.find(f=>f?.name==='Variance (h)'&&f.dataType==='NUMBER');
      if(!varianceField)throw new Error('Missing NUMBER field: Variance (h)');
      const estimate=item.fieldValues.nodes.find(v=>v?.field?.name==='Estimate (h)')?.number;
      if(typeof estimate==='number'){
        const variance=Math.round((hours-estimate)*100)/100;
        const previous=item.fieldValues.nodes.find(v=>v?.field?.name==='Variance (h)')?.number;
        if(typeof previous!=='number'||Math.abs(previous-variance)>=0.005)await gql(writeMutation,{project:project.id,item:item.id,field:varianceField.id,value:variance});
      }
    }
  }
  cursor=project.items.pageInfo.hasNextPage?project.items.pageInfo.endCursor:null;
}while(cursor);
console.log('Project items matched:',matched,'updated:',updated);
