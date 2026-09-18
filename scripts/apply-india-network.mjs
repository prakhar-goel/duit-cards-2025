import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import {pool,transaction} from '../apps/api/src/db.js';
import {fullCard} from '../apps/api/src/cards.js';
import {indianConnections,businessPeople} from './india-network-data.mjs';
const target=new URL(process.env.DATABASE_URL||'');
const staging=target.hostname==='ep-autumn-voice-az2i6e27.c-3.ap-southeast-1.aws.neon.tech'&&target.pathname==='/neondb';
if(!staging&&!(target.hostname==='127.0.0.1'&&target.pathname==='/duit_2026_pilot'))throw Error('Only isolated DUIT local/staging is allowed.');
const url=p=>'http://localhost:48152/demo/'+p;
const marker='.local/deployment/india-network-'+(staging?'staging':'local')+'.json';
async function publish(c,db){const snapshot=await fullCard(c,db);snapshot.isPublished=true;snapshot.publishedAt=new Date().toISOString();const v=(await db.query('INSERT INTO card_versions(card_id,snapshot) VALUES($1,$2) RETURNING id',[c.id,snapshot])).rows[0];await db.query('UPDATE cards SET is_published=true,published_at=now(),published_version_id=$2 WHERE id=$1',[c.id,v.id]);}
try{
 if(await fs.access(marker).then(()=>true,()=>false))throw Error('Already applied. Inspect private change record before rerunning.');
 await fs.mkdir('.local/deployment',{recursive:true});
 const backup=await pool.query("SELECT * FROM cards WHERE slug LIKE 'business-%' AND data_origin='public_reference'");
 await fs.writeFile(marker+'.backup',JSON.stringify(backup.rows),{mode:0o600});
 await transaction(async db=>{
  await db.query('SELECT pg_advisory_xact_lock(26091845)');
  for(const p of businessPeople){
   const slug='business-'+p.key;const image=url('india/'+slug+'-portrait.jpg');
   const c=(await db.query("UPDATE cards SET title=$2,role=$3,image_url=$4,theme=theme||$5::jsonb,business_card_url=$6,business_card_back_url=$7,updated_at=now() WHERE slug=$1 AND data_origin='public_reference' RETURNING *",[slug,p.name,p.role,image,JSON.stringify({logoUrl:url('brands/'+p.key+'-logo.png')}),url('india/'+slug+'-front.jpg'),url('india/'+slug+'-back.jpg')])).rows[0];
   if(!c)throw Error('Missing known brand '+slug);
   await publish(c,db);
   await db.query("UPDATE people SET name=$2,role=$3,photo_url=$4,business_card_url=$5,business_card_back_url=$6 WHERE source_card_id=$1 AND data_origin='public_reference'",[c.id,p.name,p.role,image,c.business_card_url,c.business_card_back_url]);
   await db.query("UPDATE users SET display_name=$2,profile=profile||$3::jsonb WHERE id=$1 AND data_origin='public_reference'",[c.owner_id,p.name,JSON.stringify({fullName:p.name,role:p.role,photoUrl:image})]);
  }
  const owners=(await db.query("SELECT id FROM users WHERE email IN ('maya@northstar.example','noah@fieldwork.example') AND data_origin='fictional_demo'")).rows;
  if(owners.length!==2)throw Error('Expected two authored test workspaces.');
  for(const [n,p] of indianConnections.entries()){
   const slug=p.key+'-'+p.company.toLowerCase().replace(/[^a-z0-9]+/g,'-');
   if((await db.query('SELECT 1 FROM cards WHERE slug=$1',[slug])).rowCount)throw Error('Already exists '+slug);
   const email=p.key.split('-')[0]+'@'+p.company.toLowerCase().replace(/[^a-z]/g,'')+'.example';
   const image=url('india/'+p.key+'-portrait.jpg');
   const contact={email,phone:'+44 20 7946 '+String(80+n).padStart(4,'0'),website:'https://'+email.split('@')[1],address:p.city+', India'};
   const password=await bcrypt.hash(crypto.randomBytes(32).toString('hex'),12);
   const owner=(await db.query("INSERT INTO users(email,password_hash,display_name,verified_at,onboarding_completed,profile,data_origin) VALUES($1,$2,$3,now(),true,$4,'fictional_demo') RETURNING id",[email,password,p.name,{fullName:p.name,company:p.company,role:p.role,city:p.city,countryCode:'IN',photoUrl:image}])).rows[0];
   const media=p.images.map((img,i)=>({type:String(img).endsWith('.mp4')?'video':'image',url:url(typeof img==='number'?`india/${p.key}-${i}.jpg`:img),title:p.topics[i],caption:p.captions[i],ctaLabel:p.cta,ctaPrompt:p.topics[i],ctaColor:p.color}));
   const c=(await db.query("INSERT INTO cards(owner_id,slug,title,company,role,subtitle,bio,contact,theme,image_url,cover_url,business_card_url,business_card_back_url,business_media,cta_label,data_origin) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'fictional_demo') RETURNING *",[owner.id,slug,p.name,p.company,p.role,p.headline,p.bio,contact,{color:p.color,logoUrl:url('india/'+p.key+'-logo.png')},image,media[0].url,url('india/'+p.key+'-front.jpg'),url('india/'+p.key+'-back.jpg'),JSON.stringify(media),p.cta])).rows[0];
   for(const [i,type] of ['hook','relevance','offer','outcome','proof','cta'].entries())await db.query('INSERT INTO pitch_panels(card_id,panel_type,position,body,approved) VALUES($1,$2,$3,$4,true)',[c.id,type,i,[p.headline,p.role,p.bio,p.captions[1],p.captions[2],p.cta][i]]);
   await publish(c,db);
   for(const o of owners){
    const person=(await db.query("INSERT INTO people(owner_id,source_card_id,name,company,role,email,phone,website,city,country_code,bio,photo_url,business_card_url,business_card_back_url,tags,data_origin) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'IN',$10,$11,$12,$13,$14,'fictional_demo') RETURNING id",[o.id,c.id,p.name,p.company,p.role,email,contact.phone,contact.website,p.city,p.bio,image,c.business_card_url,c.business_card_back_url,[p.role.split(' · ')[1],'India']])).rows[0];
    await db.query("INSERT INTO encounters(owner_id,person_id,occurred_at,location,city,country_code,latitude,longitude,event_name,original_note,client_id) VALUES($1,$2,$3,$4,$5,'IN',$6,$7,$8,$9,$10)",[o.id,person.id,`2026-09-${String(17-n).padStart(2,'0')}T05:30:00Z`,p.venue,p.city,p.lat,p.lon,p.event,p.note,'india-network-'+p.key]);
   }
  }
 });
 await fs.writeFile(marker,JSON.stringify({at:new Date().toISOString(),added:6,representatives:3}),{mode:0o600});console.log({target:staging?'staging':'local',added:6,representatives:3});
}finally{await pool.end()}
