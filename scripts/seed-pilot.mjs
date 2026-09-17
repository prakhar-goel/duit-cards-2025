#!/usr/bin/env node
// Repeatable local-only demo fixtures. All business activity is fictional.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
try{process.loadEnvFile(path.join(root,'.env.local'));}catch(error){if(error.code!=='ENOENT')throw error;}
const origin=(process.env.PILOT_API_URL||'http://127.0.0.1:48152').replace(/\/$/,'');
if(!['127.0.0.1','localhost','[::1]'].includes(new URL(origin).hostname)||new URL(process.env.DATABASE_URL||'').pathname!=='/duit_2026_pilot')throw new Error('Seed only supports the local, isolated duit_2026_pilot database.');
const {query,pool}=await import('../apps/api/src/db.js');
const version='duit-2026-demo-v1';
const local=path.join(root,'.local');
await fs.mkdir(local,{recursive:true,mode:0o700});
const credentialsPath=path.join(local,'credentials.json');
let credentials;try{credentials=JSON.parse(await fs.readFile(credentialsPath,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;credentials={note:'Local fictional pilot accounts. Keep this file private.',accounts:[]};}
const seedPassword=process.env.PILOT_SEED_PASSWORD;
if(!seedPassword||seedPassword.length<10)throw new Error('Set PILOT_SEED_PASSWORD in the private .env.local file.');
const image=name=>`${origin}/demo/${name}.png`;
const at=(day,hour=10)=>`2026-09-${String(day).padStart(2,'0')}T${String(hour).padStart(2,'0')}:00:00.000Z`;
async function api(route,{token,method='GET',body}={}){
  let response;
  for(let attempt=0;attempt<4;attempt++){
   response=await fetch(`${origin}/api/v1${route}`,{method,headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});
   if(response.status!==429)break;
   let remaining=Math.max(1,Number(response.headers.get('retry-after'))||60)*1000+250;
   await response.body?.cancel();
   if(remaining>65000)throw new Error('Authentication limit reached. Retry the idempotent seed after the current 15-minute window.');
   if(attempt===3)throw new Error('The API is busy. Retry the idempotent seed later.');
   console.log('The API requested a brief pause; demo seed will resume automatically.');
   while(remaining>0){const duration=Math.min(remaining,30000);await new Promise(resolve=>setTimeout(resolve,duration));remaining-=duration;}
  }
  const result=response.status===204?{}:await response.json();
  if(!response.ok)throw new Error(`${method} ${route}: ${response.status} ${result.error?.code||'request_failed'} ${result.error?.message||''}`);
  return {...result,_status:response.status};
}
const owners=[
 {key:'maya',name:'Maya Desai',company:'Northstar Studio',role:'Founder & product designer',city:'Bengaluru',country:'IN',portrait:'maya-desai',color:'#C66649',headline:'Make your product easier to understand. And easier to buy.',offer:'A two-week product story and onboarding sprint for B2B software teams.',need:'Introductions to B2B founders improving their onboarding or product demo.',cta:'Tell me what you are building',panels:[
 'Your product is good. Does your first demo make that obvious?',
 'For B2B founders whose buyers need three calls to understand what the product actually does.',
 'In two weeks, we turn one messy customer journey into a clear story, a clickable prototype and a practical build brief.',
 'You leave with a demo your team can use and a short list of changes to test with real buyers. No magic conversion promises.',
 'Fictional demo case: we redesigned a supplier portal journey from account creation to first order. Ask to see the before-and-after sample.',
 'Tell me your product, your buyer and where people get stuck. I will suggest one useful next step.']},
 {key:'noah',name:'Noah Morgan',company:'Fieldwork',role:'Founder',city:'London',country:'GB',portrait:'noah-morgan',color:'#38685E',headline:'The event ends. The useful conversations should not.',offer:'Event check-in and structured follow-up tools for small B2B conferences.',need:'Event organisers who want to test a small, privacy-conscious lead capture pilot.',cta:'Plan an event pilot',panels:[
 'A busy badge scanner is not the same thing as a useful meeting.',
 'For organisers running 100–800-person B2B events who want to help attendees follow through after the day.',
 'Fieldwork combines simple check-in, opt-in meeting context and a clear next-action list for your team.',
 'Run a small pilot and measure useful conversations, consented contacts and follow-ups completed within seven days.',
 'This is a fictional sample business. The demo includes a sample organiser checklist and attendee follow-up flow, not claimed customer results.',
 'Tell me the event date, approximate size and the one follow-up problem you want to fix.']},
 {key:'aisha',name:'Aisha Rahman',company:'Loop & Leaf',role:'Founder',city:'Kuala Lumpur',country:'MY',portrait:'aisha-rahman',color:'#62866C',headline:'Reusable packaging that fits your next small batch.',offer:'Returnable packaging trials for independent food and personal-care brands.',need:'A supplier ordering portal and simple packaging return tracking.',cta:'Discuss your next batch',panels:[
 'Your packaging gets one delivery. What if it could make another?',
 'For independent brands testing a return scheme without ordering a warehouse full of boxes.',
 'We help choose a reusable format, map the return journey and run a small, measured packaging trial.',
 'Understand return rates and handling costs before deciding whether to expand. The trial may say no; that is useful too.',
 'Fictional demo example: a 200-unit refill trial with a written cleaning checklist and a return-log template. No environmental savings are claimed.',
 'Share the product, batch size and delivery area. Let us see whether reuse fits.']},
 {key:'raka',name:'Raka Pratama',company:'Kembali Supply',role:'Founder',city:'Jakarta',country:'ID',portrait:'raka-pratama',color:'#AB7249',headline:'Give reclaimed materials a clear next destination.',offer:'Documented reclaimed timber and material sourcing for small hospitality projects.',need:'A sample catalogue buyers can browse and request from their phones.',cta:'Find material for a project',panels:[
 'A good material deserves a second project, not a forgotten corner.',
 'For café and small-hotel teams planning interiors with reclaimed timber and usable offcuts.',
 'We prepare a material shortlist with dimensions, condition notes and source documentation where available.',
 'Check suitability with your builder before committing to delivery. Fewer mystery planks, fewer surprises on site.',
 'Fictional demo portfolio: a café counter material sheet, a condition checklist and a small-batch sample catalogue. Structural certification is not implied.',
 'Send your project city, dimensions and timeline. We will start with what is actually suitable.']},
 {key:'sofia',name:'Sofia Laurent',company:'Atelier Système',role:'Founder & AI implementation lead',city:'Paris',country:'FR',portrait:'sofia-laurent',color:'#78638E',headline:'One useful AI workflow. With the human still in charge.',offer:'Private, review-first AI document workflows for professional service teams.',need:'A product design partner for clear review screens and consent flows.',cta:'Explore one workflow',panels:[
 'The goal is less copying and pasting. Not a robot with your client list.',
 'For small service firms with repetitive document work and information that must stay controlled.',
 'We map one workflow, identify what may be processed and build a small assistant with human review and an audit trail.',
 'Test time saved, corrections needed and data handling before deciding whether the workflow should go live.',
 'Fictional demo: an assistant drafts a brief from approved source documents and shows its sources beside each answer. No autonomous client messages.',
 'Describe the repetitive task and the information it touches. We will first check whether AI is appropriate.']},
 {key:'elias',name:'Elias Weber',company:'Werkflow',role:'Founder & operations engineer',city:'Berlin',country:'DE',portrait:'elias-weber',color:'#5D7384',headline:'Make the next factory handover less of a guessing game.',offer:'Lightweight production scheduling and quality handover software for small manufacturers.',need:'Onboarding research with factory supervisors and a clearer product demo.',cta:'Map your handover',panels:[
 'If the next shift needs five phone calls, the handover needs work.',
 'For small manufacturers coordinating jobs, checks and exceptions across shifts.',
 'Werkflow puts the job queue, quality notes and the next responsible person in one shared view.',
 'Start with one line and compare missing handovers and time spent chasing updates. Keep the process that actually helps.',
 'Fictional demo workflow: a machine-shop job moves from setup to inspection with a named owner at each step. These are sample screens, not customer claims.',
 'Tell me where your handover breaks down. We can sketch the smallest useful trial.']}
];
// Facts below are intentionally authored fixture data, not AI output or real contacts.
const contacts=[
 ['noah','Noah Morgan','Fieldwork','Founder','London','GB','Event software','partner','Event check-in and consented lead capture','A clear first-run product demo','We compared attendee follow-up with badge scanning. Noah wants a design partner for a small organiser pilot.','Send a three-screen event follow-up sketch',9],
 ['aisha','Aisha Rahman','Loop & Leaf','Founder','Kuala Lumpur','MY','Packaging','promising','Returnable packaging trials','Supplier portal design and return tracking','Aisha uses a spreadsheet to coordinate refill returns. She needs an ordering flow that works on a basic phone.','Share a lightweight supplier-portal outline',16],
 ['raka','Raka Pratama','Kembali Supply','Founder','Jakarta','ID','Materials','promising','Documented reclaimed timber sourcing','Mobile catalogue design','Raka showed photos of café materials. Buyers need dimensions and condition notes before requesting samples.','Send a mobile material-catalogue example',16],
 ['sofia','Sofia Laurent','Atelier Système','AI implementation lead','Paris','FR','Private AI','partner','Review-first document AI workflows','Design for source review and permission screens','Sofia builds document assistants for small service firms. We agreed that citations and permissions must be visible in the review screen.','Send the source-review screen checklist',9],
 ['elias','Elias Weber','Werkflow','Founder','Berlin','DE','Manufacturing','promising','Factory scheduling and handover software','Factory supervisor onboarding research','Elias said new supervisors struggle to locate the next job owner. A small onboarding test could expose the confusing steps.','Draft five supervisor interview questions',10],
 ['arjun','Arjun Mehta','RelayOps','Co-founder','New Delhi','IN','Logistics','active','Dispatch tools for regional delivery teams','A simpler driver setup flow','Arjun can recruit three dispatch managers for interviews. His team is losing time explaining the first setup screen.','Send the driver setup research plan',4],
 ['kavya','Kavya Iyer','Proofline','Founder','Bengaluru','IN','B2B software','promising','Supplier compliance document tracking','Product demo and onboarding design','Kavya needs to explain document expiry alerts without opening six tabs in a sales call.','Prepare a one-page demo story for Proofline',4],
 ['dev','Dev Malhotra','Common Table','Community lead','New Delhi','IN','Events','partner','Small founder dinners and warm introductions','An opt-in attendee follow-up tool','Dev cares about small, useful groups. He offered to introduce Noah if the pilot keeps attendee data private.','Ask Dev before introducing Noah',4],
 ['nisha','Nisha Rao','Plain Ledger','Finance operations adviser','Mumbai','IN','Finance','new','Month-end process mapping for small teams','Introductions to growing agencies','Nisha helps agency founders tidy invoice approval. I may need her when Northstar hires an operations lead.','Save Nisha for the operations planning review',4],
 ['rohan','Rohan Kapoor','Signal Rooms','Founder','Gurugram','IN','Research','active','Remote B2B customer interviews','Design partners for research projects','Rohan can recruit operations buyers and run interviews. We discussed a joint research and prototype package.','Review the joint interview proposal',4],
 ['tania','Tania Bose','Parcel Lane','Product lead','Kolkata','IN','Logistics','promising','Delivery exception tracking','A clearer returns dashboard','Tania showed how support staff copy tracking details between tools. A returns dashboard is the useful first design problem.','Send two returns-dashboard wireframes',4],
 ['sari','Sari Putri','Pasarworks','Founder','Bandung','ID','Commerce','new','Wholesale ordering for small retailers','Bilingual ordering screens','Sari is testing a wholesale flow in Indonesian and English. She wants simple quantity and delivery controls.','Share the bilingual form checklist',16],
 ['bima','Bima Santoso','Peta Studio','Architect','Surabaya','ID','Hospitality','new','Small café interiors and site coordination','Reclaimed timber samples','Bima is planning a café counter and needs sample sizes before discussing delivery. Raka could help if both agree to an introduction.','Ask Bima whether an introduction to Raka is useful',16],
 ['nurul','Nurul Aziz','Tracegrain','Founder','Penang','MY','Food supply','promising','Ingredient batch traceability','A simple buyer-facing proof page','Nurul needs to explain a batch record to buyers who do not use her operations system.','Sketch the buyer proof-page structure',16],
 ['daniel','Daniel Tan','Cedar Commons','Community director','Singapore','SG','Events','partner','B2B builder meetups','Consented follow-up and event feedback','Daniel wants to know whether attendees made useful connections, without monitoring private conversations.','Send an event pilot with opt-in feedback questions',16],
 ['mei','Mei Lin Wong','Harbour Labs','Product lead','Singapore','SG','Workflow software','promising','Procurement request software','A tighter product story for small teams','Mei has a working product but explains it as a list of features. We mapped the story around one approved purchase.','Share the procurement story outline',16],
 ['jordan','Jordan Ellis','Threadline','Founder','Austin','US','B2B software','promising','Customer handoff notes for service teams','A prototype for the first client handoff','Jordan wants a trial with small consultancies. He needs to show the handoff in two minutes instead of a full workspace tour.','Send the first-handoff prototype scope',9],
 ['camila','Camila Brooks','Open Shelf','Product lead','New York','US','Knowledge tools','new','Searchable internal policy notes','Usability testing for source citations','Camila is testing whether people notice stale sources. We traded ideas about showing document dates beside answers.','Share the dated-source usability checklist',10],
 ['owen','Owen Park','Rivet Research','Founder','San Francisco','US','Research','partner','Recruiting operations users for interviews','European research partners','Owen can recruit US operations teams. He asked about local interview partners for a later European study.','Compare research recruiting availability with Owen',10],
 ['lena','Lena Fischer','Quiet Hours','Founder','Munich','DE','Workplace software','new','Team focus-time coordination','A clearer team onboarding flow','Lena wants managers to explain focus time without sounding like another monitoring tool.','Send permission-language examples',10],
 ['max','Max Schneider','Routekind','Operations lead','Hamburg','DE','Logistics','active','Small-fleet route planning','Delivery exception interface research','Max offered to walk us through real dispatch decisions using a fictional route, with customer details removed.','Book the dispatch workflow walkthrough',11],
 ['ines','Inès Bernard','Clair Brief','Founder','Lyon','FR','Professional services','promising','Client brief collection for small agencies','Document AI with reviewed outputs','Inès wants a draft brief from uploaded forms, but wants a person to check each answer before it goes to the client.','Ask Inès before introducing Sofia',9],
 ['lucas','Lucas Moreau','Table Ouverte','Event producer','Paris','FR','Events','new','Small industry roundtables','A simple attendee follow-up trial','Lucas runs small roundtables and wants introductions to be requested, not broadcast to an entire mailing list.','Share the opt-in roundtable follow-up plan',9],
 ['amelia','Amelia Clarke','Lantern Works','Founder','Manchester','GB','Product design','partner','Accessible design reviews','Research partners for manufacturing software','Amelia reviews keyboard and screen-reader journeys. She can review the factory onboarding prototype after the first research round.','Send the prototype accessibility review brief',10],
 ['ben','Ben Turner','Market Map','Founder','Bristol','GB','Sales tools','promising','Buyer account planning for small sales teams','A concise product demo','Ben has a useful account map but his demo starts with settings. We agreed to lead with a buyer decision instead.','Send the buyer-first demo storyboard',11],
 ['priya','Priya Nair','Stackwell','Founder','Chennai','IN','B2B software','new','Inventory planning for independent retailers','Mobile onboarding research','Priya wants shop owners to enter their first stock item without a training call. She can arrange two interviews next week.','Confirm the retailer interview times',10],
 ['farah','Farah Ismail','Tandem Foods','Operations lead','Johor Bahru','MY','Food brands','promising','Small-batch food subscriptions','A returnable packaging trial','Farah is evaluating a refill subscription and wants to understand cleaning and return costs before scaling. Aisha could run a small trial.','Ask Farah before introducing Aisha',16],
 ['aditya','Aditya Wirawan','Ruang Data','Founder','Yogyakarta','ID','Data tools','new','Small-business reporting dashboards','Better first-run guidance','Aditya showed three dashboards with different definitions of revenue. We talked about explaining the data before decorating it.','Send the dashboard definition worksheet',11],
 ['chloe','Chloé Martin','Small Hours','Founder','Marseille','FR','Hospitality','new','Guest messaging for independent hotels','A simpler onboarding checklist','Chloé wants to avoid asking hotel owners for every setting before they can try one message.','Share a progressive setup checklist',11],
 ['samir','Samir Shah','Bridge Notes','Founder','London','GB','Sales enablement','promising','Meeting notes with a clear next owner','A useful event networking pilot','Samir is curious whether explicit buyer needs make follow-up more useful. We agreed to test five opt-in meetings first.','Send Samir the five-meeting pilot outline',11]
].map(([key,name,company,role,city,country,tag,stage,offer,need,note,next,day])=>({key,name,company,role,city,country,tag,stage,offer,need,note,next,day}));
const eventDefinitions=[
 {key:'paris',name:'Paris AI Week (Demo)',venue:'Maison des idées — fictional venue',city:'Paris',countryCode:'FR',latitude:48.8566,longitude:2.3522,startsAt:at(9,8),endsAt:at(11,18),description:'Fictional demo conference. Explore useful business introductions, practical AI workflows and private meeting notes. Map pin is an approximate city location, not a record of real attendance.'},
 {key:'delhi',name:'Delhi Founders Table (Demo)',venue:'The Common Table — fictional venue',city:'New Delhi',countryCode:'IN',latitude:28.6139,longitude:77.209,startsAt:at(4,12),endsAt:at(4,16),description:'Fictional small founder dinner. Sample conversations cover product onboarding, research and logistics.'},
 {key:'singapore',name:'Singapore Builders Night (Demo)',venue:'Cedar Commons — fictional venue',city:'Singapore',countryCode:'SG',latitude:1.3521,longitude:103.8198,startsAt:at(16,10),endsAt:at(16,14),description:'Fictional community evening about practical software, packaging and small-business operations.'},
 {key:'next',name:'Delhi Founders Table — Next edition (Demo)',venue:'The Common Table — fictional venue',city:'New Delhi',countryCode:'IN',latitude:28.6139,longitude:77.209,startsAt:at(24,12),endsAt:at(24,16),description:'Upcoming fictional demo event. Plan who to meet and which open questions to bring.'}
];
const sessions=new Map(),cards=new Map();
async function login(owner){
 const email=owner.email||`${owner.key}@demo.duit.test`;
 let credential=credentials.accounts.find(account=>account.email===email);
 if(!credential){credential={email,password:seedPassword,label:owner.name};credentials.accounts.push(credential);await fs.writeFile(credentialsPath,JSON.stringify(credentials,null,2)+'\n',{mode:0o600});await fs.chmod(credentialsPath,0o600);}
 const existing=(await query('SELECT id,profile FROM users WHERE email=$1',[email])).rows[0];
 const result=await api(`/auth/${existing?'login':'signup'}`,{method:'POST',body:{email,password:credential.password,...(!existing?{displayName:owner.name,inviteCode:process.env.PILOT_INVITE_CODE}: {})}});
 sessions.set(owner.key,{...result,email,seeded:existing?.profile?.seedVersion===version});return sessions.get(owner.key);
}
async function seedOwner(owner){
 const session=await login(owner),token=session.accessToken;
 if(!session.seeded)await api('/me/profile',{token,method:'PATCH',body:{fullName:owner.name,headline:owner.headline,company:owner.company,role:owner.role,city:owner.city,countryCode:owner.country,photoUrl:image(owner.portrait),bio:`Fictional demo profile. ${owner.offer}`,offers:[owner.offer],needs:[owner.need]}});
 await query("UPDATE users SET data_origin='fictional_demo',profile=profile || $2::jsonb WHERE id=$1",[session.user.id,JSON.stringify({isDemo:true})]);
 const slug=`${owner.portrait}-demo`;
 let card=(await api('/cards?limit=200',{token})).cards.find(card=>card.slug===slug);
 if(!card)card=(await api('/cards',{token,method:'POST',body:{slug,title:owner.name,subtitle:owner.headline,company:owner.company,role:owner.role,imageUrl:image(owner.portrait),businessCardUrl:`${origin}/demo/cards/${owner.key}-card.png`,coverUrl:`${origin}/demo/covers/${owner.key}-cover.png`,bio:`Fictional demo business. ${owner.offer}`,theme:{color:owner.color,style:'editorial'},contact:{email:session.email},ctaType:'enquire',ctaLabel:owner.cta}})).card;
 await query("UPDATE cards SET data_origin='fictional_demo' WHERE id=$1",[card.id]);
 if(!card.isPublished){await api(`/cards/${card.id}/panels`,{token,method:'POST',body:{panels:['hook','relevance','offer','outcome','proof','cta'].map((panelType,position)=>({panelType,position,body:owner.panels[position],provenance:'owner',approved:true}))}});card=(await api(`/cards/${card.id}/publish`,{token,method:'POST',body:{}})).card;}
 // A separate original card visual and portfolio image; update only fictional fixtures lacking this iteration.
 if(!card.businessCardUrl){
  card=(await api(`/cards/${card.id}`,{token,method:'PATCH',body:{businessCardUrl:`${origin}/demo/cards/${owner.key}-card.png`,coverUrl:`${origin}/demo/covers/${owner.key}-cover.png`}})).card;
  if(card.isPublished)card=(await api(`/cards/${card.id}/publish`,{token,method:'POST',body:{}})).card;
 }
 cards.set(owner.key,card);
 const existing=(await api('/need-offers',{token})).needOffers;
 for(const [kind,text] of [['offer',owner.offer],['need',owner.need]])if(!existing.some(item=>item.kind===kind&&item.text===text))await api('/need-offers',{token,method:'POST',body:{kind,text}});
}
async function seedNetwork(ownerKey,people,full=false){
 const session=sessions.get(ownerKey),token=session.accessToken;
 const events=new Map(),existingEvents=(await api('/events?limit=200',{token})).events;
 for(const definition of eventDefinitions){const {key,...body}=definition;const event=existingEvents.find(e=>e.name===body.name)||(await api('/events',{token,method:'POST',body})).event;events.set(key,event);}
 const peopleMap=new Map();
 for(const contact of people){
  const owner=owners.find(owner=>owner.key===contact.key);
  const person=(await api('/people',{token,method:'POST',body:{name:contact.name,company:contact.company,role:contact.role,email:`${contact.key}@demo.duit.test`,city:contact.city,countryCode:contact.country,photoUrl:owner?image(owner.portrait):null,tags:['Fictional demo',contact.tag],category:['partner','active'].includes(contact.stage)?'partner':'connection',stage:contact.stage,bio:`Fictional demo contact. Offers: ${contact.offer}. Looking for: ${contact.need}.`,clientId:`${version}:${ownerKey}:person:${contact.key}`}})).person;
  if(owner){
   const sourceCard=cards.get(owner.key);
   await query("UPDATE people SET business_card_url=COALESCE(business_card_url,$2),source_card_id=COALESCE(source_card_id,$3) WHERE id=$1",[person.id,`${origin}/demo/cards/${owner.key}-card.png`,sourceCard.id]);
  }
  peopleMap.set(contact.key,person);
  await query("UPDATE people SET data_origin='fictional_demo' WHERE id=$1",[person.id]);
 }
 async function encounter(contact,index,round){
  const eventKey=contact.day===4?'delhi':contact.day===16?'singapore':'paris';
  const event=events.get(eventKey),person=peopleMap.get(contact.key);
  const texts=round===0?{note:contact.note,next:contact.next}:round===1?{note:`Follow-up with ${contact.name.split(' ')[0]} after ${event.name}. We reviewed the first outline about ${contact.need.toLowerCase()}. They want a small test with a named owner before agreeing to a larger project. No purchase has been agreed.`,next:`Confirm the small-test scope and owner with ${contact.name.split(' ')[0]}`}: {note:`Third conversation with ${contact.name.split(' ')[0]}. We clarified who will review the sample, what information can be shared, and which question the test should answer. The next decision depends on that review; there is no confirmed sale.`,next:`Collect ${contact.name.split(' ')[0]}'s comments on the sample`};
  const commitments=round===0&&index%3!==2?[{text:texts.next,dueAt:at(index%5===0?17:index%5===1?18:21,12)}]:round===1?[{text:texts.next,dueAt:at(22,10)}]:[];
  const result=await api(`/people/${person.id}/encounters`,{token,method:'POST',body:{clientId:`${version}:${ownerKey}:meeting:${contact.key}:${round}`,occurredAt:at(round===0?contact.day:round===1?17:18,9+index%7),location:round?`Follow-up call after ${event.city}`:event.venue,city:event.city,countryCode:event.countryCode,...(!round?{latitude:event.latitude,longitude:event.longitude}:{}),eventId:event.id,eventName:event.name,meetingType:round?'Call':contact.day===4?'Dinner':'Conference',exchangeType:round?'No cards exchanged':index%4===0?'Shared my card':'Both exchanged cards',originalNote:`Fictional demo note, written by the workspace owner. ${texts.note}`,recap:round?`Reviewed the next step for ${contact.need.toLowerCase()}.`:`${contact.name.split(' ')[0]} offers ${contact.offer.toLowerCase()} and is looking for ${contact.need.toLowerCase()}.`,relevance:`${contact.stage==='partner'?'Potential collaboration':'Worth a practical follow-up'}: ${contact.need}. Grounded in our saved conversation; not a buying commitment.`,proposedFollowUp:texts.next,commitments}});
  if(result._status===201&&round===0&&index%4===0)for(const commitment of result.commitments)await api(`/commitments/${commitment.id}`,{token,method:'PATCH',body:{status:'done'}});
 }
 for(let index=0;index<people.length;index++)await encounter(people[index],index,0);
 if(full){for(let index=0;index<12;index++)await encounter(people[index],index,1);for(let index=0;index<3;index++)await encounter(people[index],index,2);}
 const wants=ownerKey==='maya'?[
  ['need','A privacy-first document AI partner who shows sources and keeps human review.'],
  ['need','Event organisers in Singapore who want to test consented attendee follow-up.'],
  ['offer','Product story, onboarding research and clickable prototypes for B2B software.'],
  ['offer','A simple mobile supplier portal or sample catalogue for growing small businesses.']
 ]:[['need','A product designer for an event follow-up pilot with clear consent screens.'],['offer','A small event check-in and attendee follow-up pilot with explicit next actions.']];
 const saved=(await api('/need-offers',{token})).needOffers;
 for(const [kind,text]of wants)if(!saved.some(item=>item.kind===kind&&item.text===text))await api('/need-offers',{token,method:'POST',body:{kind,text}});
}
async function seedPublicActivity(){
 for(const owner of owners){const card=cards.get(owner.key);
  // Real endpoint writes for labelled demo actions; these are not visitor claims.
  for(const [index,type]of ['viewed','viewed','viewed','cta_opened','contact_saved'].entries()){
   const eventKey=`${version}:${owner.key}:${index}`;
   if(!(await query('SELECT 1 FROM card_events WHERE card_id=$1 AND event_key=$2',[card.id,eventKey])).rowCount)await api(`/public/cards/${card.slug}/events`,{method:'POST',body:{type,source:'fictional_demo',visitorId:`demo-visitor-${index}`,eventKey}});
  }
 }
 for(const [ownerKey,keys]of [['maya',['aisha','elias','jordan','mei','ben','kavya']],['noah',['daniel','dev','lucas']]]){
  const card=cards.get(ownerKey),session=sessions.get(ownerKey);
  for(const [index,key]of keys.entries()){
   const person=contacts.find(contact=>contact.key===key),source=`${version}:lead:${ownerKey}:${key}`;
   if((await query('SELECT 1 FROM leads WHERE card_id=$1 AND source=$2',[card.id,source])).rowCount)continue;
   const lead=(await api(`/public/cards/${card.slug}/leads`,{method:'POST',body:{name:person.name,email:`${key}@demo.duit.test`,intent:`Fictional demo enquiry: We discussed ${person.need.toLowerCase()}. I would like to compare a small pilot scope and the first useful deliverable.`,consent:true,source,ctaContext:ownerKey==='maya'?'Product design enquiry':'Event pilot enquiry'}})).lead;
   if(index===1)await api(`/leads/${lead.id}`,{token:session.accessToken,method:'PATCH',body:{status:'responded'}});
   if(index===2)await api(`/leads/${lead.id}`,{token:session.accessToken,method:'PATCH',body:{status:'qualified'}});
  }
 }
}
try{
 for(const owner of owners)await seedOwner(owner);
 const operator=await login({key:'operator',email:'admin@pilot.duit.test',name:'DUIT Pilot Operator'});
 await query("UPDATE users SET role='admin',data_origin='pilot_operator',profile=profile||'{\"isOperator\":true}'::jsonb WHERE id=$1",[operator.user.id]);
 await seedNetwork('maya',contacts,true);
 const mayaContact={key:'maya',name:'Maya Desai',company:'Northstar Studio',role:'Founder & product designer',city:'Bengaluru',country:'IN',tag:'Product design',stage:'partner',offer:owners[0].offer,need:owners[0].need,note:'Maya can design the attendee follow-up screens. We agreed to begin with one organiser and explicit consent.',next:'Send Maya the event pilot checklist',day:9};
 await seedNetwork('noah',[mayaContact,...['daniel','dev','lucas','sofia','amelia','samir','aisha'].map(key=>contacts.find(person=>person.key===key))]);
 await seedPublicActivity();
 for(const owner of owners){const session=sessions.get(owner.key);await query('UPDATE users SET profile=profile||$2::jsonb WHERE id=$1',[session.user.id,JSON.stringify({seedVersion:version,isDemo:true})]);const card=(await api(`/public/cards/${cards.get(owner.key).slug}`)).card;if(card.panels?.length!==6||card.dataOrigin!=='fictional_demo')throw new Error('Public card verification failed.');}
 const summary={version,anchorDate:'2026-09-18',fictional:true,accounts:owners.length,publicCards:cards.size,workspaces:{}};
 for(const key of ['maya','noah']){const home=await api('/me/home',{token:sessions.get(key).accessToken});summary.workspaces[key]=home.stats;}
 await fs.writeFile(path.join(local,'demo-seed-summary.json'),JSON.stringify(summary,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify(summary,null,2));
 console.log('Demo seed complete. Private credentials remain in .local/credentials.json. No AI calls were made.');
}finally{await pool.end();}
