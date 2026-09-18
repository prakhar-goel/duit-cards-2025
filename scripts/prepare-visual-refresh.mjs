import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {brandReferences} from './brand-reference-data.mjs';
import {query,pool} from '../apps/api/src/db.js';
const root=path.resolve('apps/web/public/demo');
const escape=s=>String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const lines=(s,max=46)=>String(s).split(' ').reduce((a,w)=>{if(!a.length||a.at(-1).length+w.length>max)a.push(w);else a[a.length-1]+=' '+w;return a;},[]);
const text=(s,x,y,size,color,max=46)=>lines(s,max).map((line,i)=>`<text x="${x}" y="${y+i*size*1.35}" fill="${color}" font-size="${size}">${escape(line)}</text>`).join('');
const assets=[];
await fs.mkdir(path.join(root,'brands'),{recursive:true});
for(const b of brandReferences)for(const [kind,url] of Object.entries(b.assets)){
 const r=await fetch(url);if(!r.ok)throw Error(`${url}: ${r.status}`);const buf=Buffer.from(await r.arrayBuffer());
 await sharp(buf).resize({width:1100,height:1100,fit:'inside',withoutEnlargement:true}).png().toFile(path.join(root,'brands',`${b.key}-${kind}.png`)); assets.push({file:`brands/${b.key}-${kind}.png`,source:url});
}
for(const [key,id] of Object.entries({solar:9800001,warehouse:5156696,conference:33411205})){
 const url=`https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1100`;
 const r=await fetch(url);if(!r.ok)throw Error(url);await fs.writeFile(path.join(root,'stock',`${key}.jpg`),Buffer.from(await r.arrayBuffer()));assets.push({file:`stock/${key}.jpg`,source:url});
}
try {
 const rows=(await query("SELECT c.*,u.profile FROM cards c JOIN users u ON u.id=c.owner_id WHERE c.data_origin='fictional_demo' ORDER BY c.slug")).rows;
 const records=rows.filter(c=>!c.slug.startsWith('business-')).map((c,i)=>({key:c.slug,name:c.title,company:c.company,role:c.role,headline:c.subtitle,bio:c.bio,color:c.theme.color||'#163D35',paper:'#F6F1E7',contact:{...c.contact,website:c.contact.website||`https://${c.contact.email.split('@')[1]}`,phone:c.contact.phone||`+44 20 7946 ${String(i+10).padStart(4,'0')}`,address:c.contact.address||[c.profile.city,c.profile.countryCode].filter(Boolean).join(', ')},id:c.id}));
 for(const b of brandReferences)records.push({...b,key:'business-'+b.key,name:b.company,contact:{email:b.email,phone:b.phone,website:b.website,address:b.address},logo:path.join(root,'brands',`${b.key}-logo.png`)});
 await fs.mkdir(path.join(root,'cards-full'),{recursive:true});
 for(const p of records){
 const logo=p.logo?`${p.key === "business-bluetokai" ? '<rect x="58" y="45" width="244" height="160" rx="16" fill="#fff"/>' : ""}<image x="70" y="60" width="220" height="130" href="data:image/png;base64,${(await fs.readFile(p.logo)).toString('base64')}"/>`:`<circle cx="120" cy="105" r="52" fill="${p.paper}"/><text x="120" y="123" text-anchor="middle" font-size="45" fill="${p.color}">${escape(p.company.split(' ').map(x=>x[0]).slice(0,2).join(''))}</text>`;
 const front=`<rect width="1200" height="750" fill="${p.color}"/>${logo}${text(p.company,70,280,60,p.paper,30)}${text(p.name,70,450,30,p.paper)}${text(p.role,70,495,22,p.paper)}<path d="M70 535H1130" stroke="${p.paper}" opacity=".3"/>${text(p.contact.phone,70,585,25,p.paper)}${text(p.contact.email,70,633,25,p.paper)}${text(p.contact.website.replace('https://',''),70,681,25,p.paper)}${text(p.contact.address,710,585,24,p.paper,28)}`;
 const back=`<rect width="1200" height="750" fill="${p.paper}"/>${text(p.company,70,95,24,p.color)}${text(p.headline,70,230,57,p.color,32)}${text(p.bio,70,440,26,p.color,72)}<path d="M70 640H1130" stroke="${p.color}" opacity=".3"/>${text(p.contact.website.replace('https://',''),70,700,23,p.color)}`;
 for(const [side,body] of [['front',front],['back',back]])await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750"><g font-family="Arial, sans-serif">${body}</g></svg>`)).jpeg({quality:88}).toFile(path.join(root,'cards-full',`${p.key}-${side}.jpg`));
 }
 await fs.mkdir('.local',{recursive:true});await fs.writeFile('.local/visual-refresh-records.json',JSON.stringify(records,null,2));
 await fs.writeFile('docs/BRAND_MEDIA_SOURCES.json',JSON.stringify({retrievedAt:new Date().toISOString(),businesses:brandReferences.map(({assets,...b})=>b),assets,note:'Company cards use official public contacts. No invented employee affiliation. Authored contacts retain reserved .example domains and UK drama phone numbers. No external enquiries are sent by the app.'},null,2));
 console.log({cards:records.length,assets:assets.length});
}finally{await pool.end()}
