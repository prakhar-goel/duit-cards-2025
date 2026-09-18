// Idempotent authored fixtures only; no legacy archive or user-created records are edited.
import fs from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import {query,transaction,pool} from '../apps/api/src/db.js';
import {fullCard} from '../apps/api/src/cards.js';
import {richProfiles} from './rich-profile-data.mjs';
import {newProfiles,originalBrands} from './network-expansion-data.mjs';
const origin=process.env.FIXTURE_ORIGIN||'http://localhost:48152';
const image=p=>`${origin}/demo/${p}`;
const apply=process.argv.includes('--apply');
const target = new URL(process.env.DATABASE_URL || '');
if (apply && (target.hostname !== '127.0.0.1' || target.pathname !== '/duit_2026_pilot')) throw new Error('Fixture enrichment is restricted to the isolated local modern database.');
const marker='.local/rich-network-v2.json';
try{
 const applied=await fs.access(marker).then(()=>true,()=>false);
 console.log(JSON.stringify({mode:apply?'apply':'preview',alreadyApplied:applied,profiles:richProfiles.map(p=>({name:p.name,company:p.company})),archive:'untouched'}));
 if(apply&&!applied){
  if(!process.env.PILOT_SEED_PASSWORD)throw new Error('PILOT_SEED_PASSWORD required');
  const hash=await bcrypt.hash(process.env.PILOT_SEED_PASSWORD,12);
  await transaction(async db=>{
   for(const [i,p] of richProfiles.entries()){
    const email=`${p.key}@${p.company.toLowerCase().replace(/[^a-z]/g,'')}.example`;
    const user=(await db.query("INSERT INTO users(email,password_hash,display_name,verified_at,onboarding_completed,profile,data_origin,created_at) VALUES($1,$2,$3,now(),true,$4,'fictional_demo',$5) RETURNING *",[email,hash,p.name,{fullName:p.name,role:p.role,company:p.company,city:p.city,countryCode:p.country,photoUrl:image(`stock/${p.key}-portrait.jpg`),bio:p.offer},`2026-0${4+i%3}-12T09:00:00Z`])).rows[0];
    const gallery=[{type:'image',url:image(`stock/${p.key}-cover.jpg`),title:p.headline,caption:p.details[0],ctaLabel:p.cta,ctaPrompt:p.details[0],ctaColor:p.color},{type:'image',url:image(`covers/${p.key}-feature.png`),title:p.steps[1],caption:p.details[1],ctaLabel:'Explore the options',ctaPrompt:p.details[1],ctaColor:p.color},{type:'image',url:image(`covers/${p.key}-process.png`),title:'Made for your business',caption:p.details[2],ctaLabel:'Tell us what you need',ctaPrompt:p.steps[2],ctaColor:p.color}];
    if(p.key==='ben'||p.key==='claire')gallery.push({type:'video',url:image('stock/coffee.mp4'),title:'A moment worth making time for',caption:p.key==='ben'?'Build a café people return to.':'The perfect partner to a warm pastry.',ctaLabel:p.key==='ben'?'Plan your café':'Plan a breakfast',ctaPrompt:'Let’s make your next morning better.',ctaColor:p.color});
    const c=(await db.query("INSERT INTO cards(owner_id,slug,title,subtitle,image_url,business_card_url,business_card_back_url,business_media,cover_url,company,role,bio,contact,theme,cta_label,data_origin) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'fictional_demo') RETURNING *",[user.id,`${p.key}-${p.company.toLowerCase().replace(/[^a-z]/g,'')}`,p.name,p.headline,image(`stock/${p.key}-portrait.jpg`),image(`cards/${p.key}-card.png`),image(`cards/${p.key}-back.png`),JSON.stringify(gallery),image(`stock/${p.key}-cover.jpg`),p.company,p.role,p.offer,{email},{color:p.color},p.cta])).rows[0];
    for(const [j,type] of ['hook','relevance','offer','outcome','proof','cta'].entries())await db.query("INSERT INTO pitch_panels(card_id,panel_type,body,position,approved) VALUES($1,$2,$3,$4,true)",[c.id,type,[p.headline,p.details[0],p.offer,p.details[1],p.details[2],p.cta][j],j]);
    await publish(c,db);
   }
   // Per-slide actions on the existing twelve galleries; keep their generated artwork.
   for(const p of [...originalBrands,...newProfiles]){
    const c=(await db.query("SELECT * FROM cards WHERE slug LIKE $1 AND data_origin='fictional_demo'",[p.key+'-%'])).rows[0];if(!c)continue;
    const media=c.business_media.map((m,i)=>({...m,ctaLabel:i===0?c.cta_label:i===1?'Plan the next step':'Let’s talk',ctaPrompt:p.details[i]||m.caption,ctaColor:p.color}));
    if(p.key==='mateo')media[2]={...media[2],url:image('stock/coffee.mp4'),title:'From the first pour',caption:'Find the right beans for your café.',ctaLabel:'Arrange a tasting'};
    await db.query('UPDATE cards SET business_media=$2,theme=$3 WHERE id=$1',[c.id,JSON.stringify(media),{...c.theme,color:p.color}]);
    await publish((await db.query('SELECT * FROM cards WHERE id=$1',[c.id])).rows[0],db);
   }
   const owners=(await db.query("SELECT * FROM users WHERE email IN ('maya@northstar.example','noah@fieldwork.example') AND data_origin='fictional_demo'")).rows;
   const cards=(await db.query("SELECT * FROM cards WHERE is_published=true AND data_origin='fictional_demo' ORDER BY title")).rows;
   for(const owner of owners){
    for(const c of cards){
     if(c.owner_id===owner.id)continue;
     let person=(await db.query("SELECT * FROM people WHERE owner_id=$1 AND source_card_id=$2",[owner.id,c.id])).rows[0];
     const p=richProfiles.find(p=>c.slug.startsWith(p.key+'-'));
     const u=(await db.query('SELECT profile FROM users WHERE id=$1',[c.owner_id])).rows[0].profile;
     if(!person)person=(await db.query("INSERT INTO people(owner_id,name,company,role,email,photo_url,business_card_url,business_card_back_url,source_card_id,city,country_code,bio,tags,stage,data_origin) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'promising','fictional_demo') RETURNING *",[owner.id,c.title,c.company,c.role,c.contact.email,c.image_url,c.business_card_url,c.business_card_back_url,c.id,u.city||'',u.countryCode||'',c.bio,[c.role.split(' · ').pop()]])).rows[0];
     if(p){
      const index=richProfiles.indexOf(p);const first=new Date(Date.UTC(2026,5,17+index*7,10,20));
      const ev=(await db.query('INSERT INTO events(owner_id,name,venue,city,country_code,latitude,longitude,starts_at,ends_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',[owner.id,p.event,p.venue,p.city,p.country,p.lat,p.lon,first,new Date(+first+4*3600000)])).rows[0];
      for(let j=0;j<3;j++)await db.query('INSERT INTO encounters(owner_id,person_id,occurred_at,location,city,country_code,latitude,longitude,event_id,event_name,meeting_type,original_note,proposed_follow_up) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',[owner.id,person.id,new Date(+first+j*7*86400000),j===0?p.venue:'Online follow-up',p.city,p.country,j===0?p.lat:null,j===0?p.lon:null,j===0?ev.id:null,j===0?p.event:'',j===0?'Conference':'Video call',[p.note,`We reviewed the first ideas for ${p.company}. ${p.details[1]}. ${p.name.split(' ')[0]} will send a short brief so we can agree what to try first.`,`A quick catch-up with ${p.name.split(' ')[0]}. We narrowed the first step to: ${p.next.toLowerCase()}. Agreed to keep the scope small and review it together.`][j],p.next]);
      await db.query('UPDATE people SET created_at=$2 WHERE id=$1',[person.id,first]);
     }
    }
   }
  });
  await fs.writeFile(marker,JSON.stringify({appliedAt:new Date().toISOString(),profiles:richProfiles.length}),{mode:0o600});
  console.log('Added nine complete profiles; both main wallets now contain twenty complete connections and a three-month history.');
 }
}finally{await pool.end()}
async function publish(c,db){const s=await fullCard(c,db);s.isPublished=true;s.publishedAt=new Date().toISOString();const v=(await db.query('INSERT INTO card_versions(card_id,snapshot) VALUES($1,$2) RETURNING id',[c.id,s])).rows[0];await db.query('UPDATE cards SET is_published=true,published_version_id=$2,published_at=now() WHERE id=$1',[c.id,v.id]);}
