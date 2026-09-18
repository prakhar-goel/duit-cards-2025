import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import {pool,transaction} from '../apps/api/src/db.js';
import {fullCard} from '../apps/api/src/cards.js';
import {brandReferences} from './brand-reference-data.mjs';
const target=new URL(process.env.DATABASE_URL||'');
const staging=target.hostname==='ep-autumn-voice-az2i6e27.c-3.ap-southeast-1.aws.neon.tech'&&target.pathname==='/neondb';
if(!staging&&!(target.hostname==='127.0.0.1'&&target.pathname==='/duit_2026_pilot'))throw Error('Only the isolated DUIT modern local or staging database is allowed.');
const records=JSON.parse(await fs.readFile('.local/visual-refresh-records.json'));
const url=p=>'http://localhost:48152/demo/'+p;
const marker='.local/deployment/visual-refresh-'+(staging?'staging':'local')+'.json';
try {
 if(await fs.access(marker).then(()=>true,()=>false))throw Error('Already applied; inspect the private change record before rerunning.');
 const backup=(await pool.query("SELECT * FROM cards WHERE data_origin='fictional_demo'")).rows;
 await fs.mkdir('.local/deployment',{recursive:true});
 await fs.writeFile(marker+'.backup',JSON.stringify(backup,null,2),{mode:0o600});
 await transaction(async db=>{
  for(const p of records.filter(p=>p.id)){
   const c=(await db.query("SELECT * FROM cards WHERE id=$1 AND data_origin='fictional_demo'",[p.id])).rows[0];if(!c)throw Error('Known card missing '+p.key);
   let media=c.business_media;
   const stock=c.slug.startsWith('amara-')?'solar':c.slug.startsWith('omar-')?'warehouse':c.slug.startsWith('noah-')?'conference':null;
   if(stock)media=[...media,{type:'image',url:url(`stock/${stock}.jpg`),title:stock==='solar'?'A roof with a purpose':stock==='warehouse'?'Room to grow':'Where new business begins',caption:c.subtitle,ctaLabel:c.cta_label,ctaColor:c.theme.color}].slice(0,4);
   const contact={...p.contact,...c.contact};
   const updated=(await db.query('UPDATE cards SET contact=$2,business_card_url=$3,business_card_back_url=$4,business_media=$5,updated_at=now() WHERE id=$1 RETURNING *',[c.id,contact,url(`cards-full/${p.key}-front.jpg`),url(`cards-full/${p.key}-back.jpg`),JSON.stringify(media)])).rows[0];await publish(updated,db);
   await db.query("UPDATE people SET business_card_url=$2,business_card_back_url=$3,phone=COALESCE(NULLIF(phone,''),$4),website=COALESCE(NULLIF(website,''),$5) WHERE source_card_id=$1 AND data_origin='fictional_demo'",[c.id,updated.business_card_url,updated.business_card_back_url,contact.phone,contact.website]);
  }
  for(const b of brandReferences){
   const slug='business-'+b.key;
   if((await db.query('SELECT 1 FROM cards WHERE slug=$1',[slug])).rowCount)throw Error('Company card already exists '+slug);
   const password=await bcrypt.hash(crypto.randomBytes(32).toString('hex'),12);
   const owner=(await db.query("INSERT INTO users(email,password_hash,display_name,verified_at,onboarding_completed,profile,data_origin) VALUES($1,$2,$3,now(),true,$4,'public_reference') RETURNING id",[b.key+'@reference.duit.test',password,b.company,{fullName:b.company,company:b.company,role:b.role,city:b.city,countryCode:b.country}])).rows[0];
   const media=['product','detail','third'].map((kind,i)=>({type:'image',url:url(`brands/${b.key}-${kind}.png`),title:b.topics[i],caption:i===0?b.headline:i===1?b.bio:b.cta,ctaLabel:i===1?'See the options':b.cta,ctaPrompt:b.topics[i],ctaColor:b.color}));
   const c=(await db.query("INSERT INTO cards(owner_id,slug,title,company,role,subtitle,bio,contact,theme,image_url,cover_url,business_card_url,business_card_back_url,business_media,cta_label,data_origin) VALUES($1,$2,$3,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'public_reference') RETURNING *",[owner.id,slug,b.company,b.role,b.headline,b.bio,{email:b.email,phone:b.phone,website:b.website,address:b.address},{color:b.color},url(`brands/${b.key}-product.png`),url(`brands/${b.key}-product.png`),url(`cards-full/${slug}-front.jpg`),url(`cards-full/${slug}-back.jpg`),JSON.stringify(media),b.cta])).rows[0];
   for(const [i,type] of ['hook','relevance','offer','outcome','proof','cta'].entries())await db.query('INSERT INTO pitch_panels(card_id,panel_type,position,body,approved) VALUES($1,$2,$3,$4,true)',[c.id,type,i,[b.headline,b.role,b.bio,b.topics[1],b.address,b.cta][i]]);
   await publish(c,db);
   const owners=(await db.query("SELECT id FROM users WHERE email IN ('maya@northstar.example','noah@fieldwork.example')")).rows;
   for(const personOwner of owners)await db.query("INSERT INTO people(owner_id,source_card_id,name,company,role,email,phone,website,city,country_code,bio,photo_url,business_card_url,business_card_back_url,tags,data_origin) VALUES($1,$2,$3,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'public_reference')",[personOwner.id,c.id,b.company,b.role,b.email,b.phone,b.website,b.city,b.country,b.bio,c.image_url,c.business_card_url,c.business_card_back_url,['Business','Gifting']]);
  }
 });
 await fs.writeFile(marker,JSON.stringify({at:new Date().toISOString(),updated:records.filter(p=>p.id).length,companies:brandReferences.map(b=>b.company)},null,2),{mode:0o600});console.log({target:staging?'staging':'local',updated:21,added:3});
}finally{await pool.end()}
async function publish(c,db){const snapshot=await fullCard(c,db);snapshot.isPublished=true;snapshot.publishedAt=new Date().toISOString();const v=(await db.query('INSERT INTO card_versions(card_id,snapshot) VALUES($1,$2) RETURNING id',[c.id,snapshot])).rows[0];await db.query('UPDATE cards SET is_published=true,published_at=now(),published_version_id=$2 WHERE id=$1',[c.id,v.id]);}
