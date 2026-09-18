import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {richProfiles} from './rich-profile-data.mjs';
const out=new URL('../apps/web/public/demo/',import.meta.url);
const browser=await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_EXECUTABLE_PATH || "/Volumes/UserData/prakhargoel/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell"});
const font=await fs.readFile(new URL('./video/fonts/DM-Sans.ttf',import.meta.url));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
try {
for(const [i,p] of richProfiles.entries()){
 const photo=await fs.readFile(new URL(`stock/${p.key}-cover.jpg`,out));
 for(const kind of ['card','back','feature','process']){
  const tall=kind==='feature'||kind==='process';
  const page=await browser.newPage({viewport:{width:tall?900:1200,height:tall?1200:750}});
  const serif=['claire','lucia','arjun','sara'].includes(p.key);
  let body='';
  if(kind==='card')body=`<div class="small">${p.city} / ${p.country}</div><div class="brand">${esc(p.company)}</div><div class="motif">${['✳','✿','↗','◒','◇','☕','⌘','◈','⌑'][i]}</div><footer><div><h2>${p.name}</h2><p>${p.role}</p></div><p>${p.key}@${p.company.toLowerCase().replace(/[^a-z]/g,'')}.example</p></footer>`;
  if(kind==='back')body=`<div class="small">${p.company}</div><h1>${p.headline}</h1><footer>${p.details.map(x=>`<p style="max-width:28%">${x}</p>`).join('')}</footer>`;
  if(kind==='feature')body=`<img src="data:image/jpeg;base64,${photo.toString('base64')}"><div class="shade"></div><div class="small light">${p.company} / ${p.city}</div><div class="pitch"><h1>${p.headline}</h1><p>${p.details[0]}</p></div>`;
  if(kind==='process')body=`<div class="small">${p.company}</div><h1>${p.cta}.</h1>${p.steps.map((x,j)=>`<div class="step"><span>0${j+1}</span><div><h2>${x}</h2><p>${p.details[j]}</p></div></div>`).join('')}`;
  await page.setContent(`<style>@font-face{font-family:DM;src:url(data:font/ttf;base64,${font.toString('base64')})}*{box-sizing:border-box}body{margin:0;font-family:DM;background:${kind==='card'?p.color:p.paper};color:${kind==='card'?p.paper:p.color}}main{padding:65px;height:100vh;position:relative;overflow:hidden}.small{font-size:19px;letter-spacing:3px;text-transform:uppercase}.brand{font-family:${serif?'Georgia':'DM'};font-size:100px;letter-spacing:-4px;max-width:85%;line-height:1.04;margin-top:80px}h1{font-family:${serif?'Georgia':'DM'};font-size:72px;font-weight:500;line-height:1.08;max-width:90%;letter-spacing:-2px}h2{font-size:32px;font-weight:500;margin:0}p{font-size:21px;line-height:1.55}footer{position:absolute;bottom:52px;left:65px;right:65px;display:flex;justify-content:space-between;align-items:end;gap:35px}footer p{font-size:19px}.motif{position:absolute;font-size:200px;right:45px;top:155px;opacity:.18}img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.shade{position:absolute;inset:0;background:linear-gradient(transparent 30%,rgba(0,0,0,.83))}.light,.pitch{position:relative;color:white}.pitch{position:absolute;bottom:70px;left:65px;right:65px}.pitch h1{font-size:80px}.step{border-top:1px solid;display:flex;gap:30px;padding:36px 0}.step span{font-size:50px;opacity:.55}.step p{margin-bottom:0}</style><main>${body}</main>`);
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:new URL(`${kind==='card'||kind==='back'?'cards':'covers'}/${p.key}-${kind}.png`,out).pathname});await page.close();
 }
}
}finally{await browser.close()}
console.log('Created nine distinct card identities and business galleries.');
