import fs from 'node:fs/promises';
import sharp from 'sharp';
import {indianConnections,businessPeople} from './india-network-data.mjs';
import {brandReferences} from './brand-reference-data.mjs';
const dir='apps/web/public/demo/india';await fs.mkdir(dir,{recursive:true});
const sources=[];
const pexels=id=>`https://images.pexels.com/photos/${id}/pexels-photo-${id}.${id===36485304?'png':'jpeg'}?auto=compress&cs=tinysrgb&w=1100`;
async function download(file,url){const r=await fetch(url);if(!r.ok)throw Error(`${r.status}: ${url}`);await sharp(Buffer.from(await r.arrayBuffer())).resize({width:1100,height:1100,fit:'inside',withoutEnlargement:true}).jpeg({quality:86}).toFile(`${dir}/${file}.jpg`);sources.push({file:`india/${file}.jpg`,url});}
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
const wrap=(s,n=48)=>s.split(' ').reduce((a,w)=>{if(!a.length||a.at(-1).length+w.length>=n)a.push(w);else a[a.length-1]+=' '+w;return a},[]);
const text=(s,x,y,size,color,max)=>wrap(s,max).map((l,i)=>`<text x="${x}" y="${y+i*size*1.3}" fill="${color}" font-size="${size}">${esc(l)}</text>`).join('');
for(const p of [...indianConnections,...businessPeople.map(p=>({...brandReferences.find(b=>b.key===p.key),...p,key:'business-'+p.key}))]){
 await download(p.key+'-portrait',typeof p.portrait==='number'?pexels(p.portrait):p.portrait);
 if(p.images)for(const [i,img] of p.images.entries())if(typeof img==='number')await download(p.key+'-'+i,pexels(img));
 const c=p.company;const email=p.email||p.key.split('-')[0]+'@'+c.toLowerCase().replace(/[^a-z]/g,'')+'.example';const web=p.website||'https://'+email.split('@')[1];const phone=p.phone||'+44 20 7946 '+String(80+indianConnections.indexOf(p)).padStart(4,'0');const address=p.address||p.venue+', '+p.city+', India';
 let logo=`<circle cx="110" cy="95" r="45" fill="#F5EDDE"/><text x="110" y="110" fill="${p.color}" font-size="34" text-anchor="middle">${esc(c.split(' ').map(x=>x[0]).slice(0,2).join(''))}</text>`;
 if(p.key.startsWith('business-'))logo=`<rect x="60" y="35" width="250" height="135" rx="10" fill="#fff"/><image x="75" y="45" width="220" height="115" href="data:image/png;base64,${(await fs.readFile(`apps/web/public/demo/brands/${p.key.replace('business-','')}-logo.png`)).toString('base64')}"/>`;
 if(p.images)await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="220" height="190">${logo}</svg>`)).png().toFile(`${dir}/${p.key}-logo.png`);
 for(const side of ['front','back']){
 const body=side==='front'?`<rect width="1200" height="750" fill="${p.color}"/>${logo}${text(c,65,235,53,'#FFF5E7',34)}${text(p.name,65,385,38,'#FFF5E7')}${text(p.role,65,440,23,'#FFF5E7')}<path d="M65 475H1135" stroke="#ffffff55"/>${text(email,65,540,24,'#FFF5E7')}${text(phone,65,590,24,'#FFF5E7')}${text(web.replace('https://',''),65,640,24,'#FFF5E7')}${text(address,735,540,23,'#FFF5E7',27)}`:`<rect width="1200" height="750" fill="#F5EDDE"/>${text(c,65,95,24,p.color)}${text(p.headline,65,220,54,p.color,35)}${text(p.bio,65,435,25,p.color,77)}${text(web.replace('https://',''),65,698,23,p.color)}`;
 await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750"><g font-family="Arial">${body}</g></svg>`)).jpeg({quality:88}).toFile(`${dir}/${p.key}-${side}.jpg`);
 }
}
await fs.writeFile('docs/INDIA_MEDIA_SOURCES.json',JSON.stringify({retrievedAt:new Date().toISOString(),sources,businessPeople:businessPeople.map(({portrait,...p})=>p),note:'Stock models illustrate authored profiles; their real identities are not asserted. Official business representatives use their own published photographs and roles. No meetings or endorsements are invented for public-reference people. New authored profiles use reserved contact details; lead forms stay inside DUIT.'},null,2));console.log({profiles:indianConnections.length,representatives:businessPeople.length,downloaded:sources.length});
