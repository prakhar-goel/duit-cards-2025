#!/usr/bin/env node
// Copies an explicitly authorized, read-only legacy gallery into operator-private media.
// It never creates pilot users, public cards, meetings or AI jobs from archived data.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
try{process.loadEnvFile(path.join(root,'.env.local'));}catch(error){if(error.code!=='ENOENT')throw error;}
const origin=(process.env.PILOT_API_URL||'http://127.0.0.1:48152').replace(/\/$/,'');
if(!['127.0.0.1','localhost','[::1]'].includes(new URL(origin).hostname)||new URL(process.env.DATABASE_URL||'').pathname!=='/duit_2026_pilot')throw new Error('Archive import only supports the local, isolated duit_2026_pilot database.');
const source=path.resolve(process.env.DUIT_ARCHIVE_SOURCE||'/Volumes/UserData/prakhargoel/Development/misc/duit-cards/artifacts/videos/source/curated-gallery-data.json');
const assetsRoot=await fs.realpath(path.resolve(path.dirname(source),'../assets/gallery'));
const gallery=JSON.parse(await fs.readFile(source,'utf8'));
if(!Array.isArray(gallery.accounts)||gallery.accounts.length!==300)throw new Error('Expected the reviewed 300-profile gallery. Select and review a new import explicitly before changing this bound.');
if(new Set(gallery.accounts.map(account=>String(account.id))).size!==gallery.accounts.length)throw new Error('Archive contains duplicate source IDs.');
const {query,pool}=await import('../apps/api/src/db.js');
const local=path.join(root,'.local'),statePath=path.join(local,'archive-import-state.json');
await fs.mkdir(local,{recursive:true,mode:0o700});
let state;try{state=JSON.parse(await fs.readFile(statePath,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;state={version:1,source,profiles:{},media:{}};}
if(state.source!==source)throw new Error('Import state belongs to a different archive. Use a separately reviewed state file for another source.');
async function saveState(){const temporary=`${statePath}.tmp`;await fs.writeFile(temporary,JSON.stringify(state,null,2)+'\n',{mode:0o600});await fs.rename(temporary,statePath);}
let token,adminId;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function limitedFetch(url,options){
 for(let attempt=0;attempt<4;attempt++){
  const response=await fetch(url,{...options,signal:AbortSignal.timeout(60000)});
  if(response.status!==429)return response;
  let remaining=Math.max(1,Number(response.headers.get('retry-after'))||60)*1000+250;
  await response.body?.cancel();
  console.log('The local API requested a pause. Import will resume automatically.');
  while(remaining>0){const duration=Math.min(remaining,30000);await pause(duration);remaining-=duration;}
 }
 throw Object.assign(new Error('API is busy; re-run the resumable import later.'),{code:'RATE_LIMITED'});
}
async function api(route,{method='GET',body,authenticate=true}={}){
 const response=await limitedFetch(`${origin}/api/v1${route}`,{method,headers:{...(authenticate?{Authorization:`Bearer ${token}`} : {}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const result=await response.json();
 if(!response.ok){const error=new Error(`Archive API request failed (${response.status}; ${result.error?.code||'request_failed'}).`);error.code=result.error?.code||'request_failed';throw error;}
 return result;
}
const countries={'1':'North America (+1; country not inferred)','34':'Spain','44':'United Kingdom','51':'Peru','52':'Mexico','56':'Chile','60':'Malaysia','62':'Indonesia','63':'Philippines','65':'Singapore','91':'India','92':'Pakistan','375':'Belarus','966':'Saudi Arabia','977':'Nepal'};
const count=value=>Number.isFinite(Number(value))?Math.max(0,Math.floor(Number(value))):0;
const cache=new Map();let uploaded=0,reused=0,imported=0,failed=0,bytesCopied=0;
async function upload(relative,label){
 if(!relative)return null;
 if(typeof relative!=='string'||!relative.startsWith('assets/gallery/'))throw Object.assign(new Error('Unexpected archive media path.'),{code:'invalid_path'});
 const file=await fs.realpath(path.resolve(path.dirname(source),'..',relative));
 if(!file.startsWith(`${assetsRoot}${path.sep}`))throw Object.assign(new Error('Archive media escaped the reviewed gallery.'),{code:'invalid_path'});
 if(cache.has(file))return cache.get(file);
 const stat=await fs.stat(file);
 if(!stat.isFile()||stat.size<12||stat.size>8*1024*1024)throw Object.assign(new Error('Image exceeds the private media size limit.'),{code:'invalid_size'});
 const bytes=await fs.readFile(file),sha=crypto.createHash('sha256').update(bytes).digest('hex');
 let media;
 const existing=(await query('SELECT id,storage_path,mime_type,size_bytes,purpose FROM media_assets WHERE owner_id=$1 AND sha256=$2 ORDER BY created_at LIMIT 1',[adminId,sha])).rows[0];
 if(existing&&await fs.stat(existing.storage_path).then(stat=>stat.isFile()).catch(()=>false)){
  media={id:existing.id,url:`${origin}/api/v1/media/${existing.id}`,mimeType:existing.mime_type,size:existing.size_bytes,purpose:existing.purpose};reused++;
 }else{
  const mimeType=bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'image/jpeg':bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'?'image/webp':null;
  if(!mimeType)throw Object.assign(new Error('Unsupported archive image signature.'),{code:'invalid_image'});
  const purpose=/profile|portrait/i.test(label||'')?'portrait':/card|visiting/i.test(label||'')?'business_card':'cover';
  media=(await api('/media',{method:'POST',body:{filename:path.basename(file),mimeType,data:bytes.toString('base64'),purpose}})).media;
  uploaded++;bytesCopied+=bytes.length;
  await pause(275); // Leave room for other local requests under the 300/minute API limit.
 }
 const value={id:media.id,url:media.url,mimeType:media.mimeType,size:media.size,sha256:sha};cache.set(file,value);state.media[relative]=value;await saveState();return value;
}
try{
 const credentials=JSON.parse(await fs.readFile(path.join(local,'credentials.json'),'utf8'));
 const credential=credentials.accounts.find(account=>account.email==='admin@pilot.duit.test');
 if(!credential)throw new Error('Run scripts/seed-pilot.mjs first to create the private operator account.');
 const session=await api('/auth/login',{method:'POST',authenticate:false,body:{email:credential.email,password:credential.password}});
 token=session.accessToken;adminId=session.user.id;
 if(session.user.role!=='admin')throw new Error('Archive import requires the dedicated operator account.');
 for(const account of gallery.accounts){
  const id=`legacy:${account.id}`;
  try{
   const media=[];
   for(const item of account.media||[]){const asset=await upload(item.file,item.label);if(asset)media.push({id:asset.id,url:asset.url,label:String(item.label||'Archived image'),mimeType:asset.mimeType});}
   const portrait=await upload(account.photo,'Profile image'),card=await upload(account.card,'Business card');
   const code=String(account.code||'');
   const profile={sourceId:String(account.id),legacyId:account.id,name:String(account.name||''),company:String(account.company||''),role:String(account.role||''),pitch:String(account.pitch||''),bio:String(account.pitch||''),website:account.website||null,code,countryCode:code,countryLabel:countries[code]||`Phone code +${code}`,created:account.created||null,createdAt:account.created||null,photo:portrait?.url||null,photoUrl:portrait?.url||null,card:card?.url||null,cardUrl:card?.url||null,media,received:count(account.received),sent:count(account.sent),events:count(account.events),dataOrigin:'legacy_archive',visibility:'operator_private',historical:true,countsDefinition:'Historical received/sent card counts and recorded meeting-event counts from the archived source. These are not current pilot activity.',sourceCollection:'curated-gallery-data',archiveImportedAt:new Date().toISOString()};
   await query(`INSERT INTO archive_profiles(id,name,country_code,company,role,profile,source) VALUES($1,$2,$3,$4,$5,$6,'legacy_private') ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,country_code=EXCLUDED.country_code,company=EXCLUDED.company,role=EXCLUDED.role,profile=EXCLUDED.profile,source=EXCLUDED.source`,[id,profile.name,code,profile.company,profile.role,JSON.stringify(profile)]);
   state.profiles[id]={status:'complete',mediaCount:media.length,completedAt:new Date().toISOString()};imported++;
  }catch(error){failed++;state.profiles[id]={status:'error',code:error.code||'import_failed',attemptedAt:new Date().toISOString()};}
  await saveState();
  if((imported+failed)%25===0)console.log(`Archive progress: ${imported+failed}/300 processed, ${imported} imported, ${failed} pending retry, ${uploaded} images uploaded.`);
 }
 const stored=Number((await query("SELECT count(*) FROM archive_profiles WHERE source='legacy_private' AND id=ANY($1::text[])",[gallery.accounts.map(account=>`legacy:${account.id}`)])).rows[0].count);
 const firstAsset=[...cache.values()][0];
 const checks={};
 if(firstAsset){for(const [name,headers,url]of [['operator',{Authorization:`Bearer ${token}`},firstAsset.url],['anonymous',{},firstAsset.url],['public',{},`${origin}/api/v1/public/media/${firstAsset.id}`]]){const response=await limitedFetch(url,{headers});checks[name]=response.status;await response.body?.cancel();}if(checks.operator!==200||checks.anonymous!==401||checks.public!==404)throw new Error('Archive privacy verification failed.');}
 const summary={sourceProfiles:gallery.accounts.length,storedProfiles:stored,importedThisRun:imported,pendingRetry:failed,uniqueSourceFiles:cache.size,uploadedThisRun:uploaded,reusedThisRun:reused,bytesCopiedThisRun:bytesCopied,privacyChecks:checks,visibility:'operator_private',publicCardsCreated:0,aiCalls:0};
 await fs.writeFile(path.join(local,'archive-import-summary.json'),JSON.stringify(summary,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify(summary,null,2));
 if(failed||stored!==300){process.exitCode=1;console.error('Some archive rows need a retry. Re-run this command; completed media are reused. Private progress is in .local/archive-import-state.json.');}
}finally{await pool.end();}
