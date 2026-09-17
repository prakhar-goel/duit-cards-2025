#!/usr/bin/env node
// Capture the actual Expo web build. Sign in outside the recording; never print credentials.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const out=path.join(root,'artifacts/videos/visual-iteration/captures');
await fs.mkdir(out,{recursive:true});
const origin=process.env.DUIT_MOBILE_PREVIEW||'http://127.0.0.1:48156';
const api=process.env.DUIT_API_ORIGIN||'http://localhost:48152';
if(!['localhost','127.0.0.1'].includes(new URL(api).hostname))throw new Error('Private local recording only.');
const credential=JSON.parse(await fs.readFile(path.join(root,'.local/credentials.json'),'utf8')).accounts.find(a=>a.email==='maya@northstar.example');
const response=await fetch(api+'/api/v1/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:credential.email,password:credential.password})});
if(!response.ok)throw new Error('Could not authenticate fictional demo account.');
const session=await response.json();
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||'/Volumes/UserData/prakhargoel/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell'});
const viewport={width:432,height:936}, errors=[],entries={};
async function context(record=false){const c=await browser.newContext({viewport,deviceScaleFactor:1,...(record?{recordVideo:{dir:path.join(out,'.raw-mobile'),size:viewport}}:{})});await c.addInitScript(({api,session})=>{localStorage.setItem('duit:pilot:server:v1',api);localStorage.setItem('duit.pilot.session.v1',JSON.stringify(session));},{api,session});return c;}
async function open(c){const page=await c.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin,{waitUntil:'networkidle'});await page.getByRole('tab',{name:'My Card',exact:true}).waitFor();await page.waitForTimeout(700);return page;}
async function still(page,name){await page.waitForTimeout(600);await page.screenshot({path:path.join(out,name+'.png')});}
async function record(key,setup,action){const c=await context(true);const epoch=Date.now();const page=await open(c);await setup(page);await page.waitForTimeout(600);const start=(Date.now()-epoch)/1000;await action(page);await page.waitForTimeout(600);await c.close();const file=path.join(out,key+'.webm');await page.video().saveAs(file);await page.video().delete();entries[key]={capture:path.relative(root,file),start,captureLabel:'Actual app web build · fictional demo'};}
async function myCard(p){await p.getByRole('tab',{name:'My Card',exact:true}).click();await p.getByRole('tab',{name:'Card page',exact:true}).waitFor();}
async function aisha(p){await p.getByRole('tab',{name:'People',exact:true}).click();await p.getByRole('button',{name:'Meet Aisha Rahman',exact:true}).click();await p.getByRole('tab',{name:'Person page',exact:true}).waitFor();}
try{
 if(process.argv.includes('--inspect')){
  const c=await context();const page=await open(c);await still(page,'app-home');await myCard(page);await still(page,'app-maya-card');await page.getByRole('tab',{name:'Person page',exact:true}).click();await still(page,'app-maya-person');await page.getByRole('tab',{name:'Business page',exact:true}).click();await still(page,'app-maya-business');await page.getByRole('tab',{name:'People',exact:true}).click();await still(page,'app-wallet');await aisha(page);await still(page,'app-aisha-person');console.log(JSON.stringify({pageErrors:errors,visibleControls:await page.getByRole('button').allTextContents()}));await c.close();
 }else{
  await record('wallet',async p=>{},async p=>{await still(p,'app-home');await p.waitForTimeout(1800);await p.getByRole('tab',{name:'People',exact:true}).click();await still(p,'app-wallet');await p.waitForTimeout(1500);await p.mouse.move(260,480);await p.mouse.wheel(0,440);await p.waitForTimeout(2200);await p.mouse.wheel(0,350);await p.waitForTimeout(1800);});
  await record('maya-person',async p=>{await myCard(p);await p.getByRole('tab',{name:'Person page',exact:true}).click();},async p=>{await still(p,'app-maya-person');await p.waitForTimeout(8500);});
  await record('maya-card',myCard,async p=>{await still(p,'app-maya-card');await p.waitForTimeout(2200);await p.getByRole('button',{name:'View original visiting card',exact:true}).click();await p.waitForTimeout(2200);await still(p,'app-card-original');await p.getByRole('button',{name:'Close original card',exact:true}).click();await p.waitForTimeout(2000);});
  await record('maya-pitch',async p=>{await myCard(p);await p.getByRole('tab',{name:'Business page',exact:true}).click();},async p=>{await still(p,'app-maya-business');await p.waitForTimeout(8500);});
  await record('second-profile',aisha,async p=>{await still(p,'app-aisha-person');await p.waitForTimeout(1300);await p.getByRole('tab',{name:'Card page',exact:true}).click();await still(p,'app-aisha-card');await p.waitForTimeout(1800);await p.getByRole('tab',{name:'Business page',exact:true}).click();await still(p,'app-aisha-business');await p.waitForTimeout(2500);});
  await record('meeting-memory',async p=>{await aisha(p);await p.getByRole('button',{name:/Meeting memory/}).click();},async p=>{await still(p,'app-meeting-memory');await p.waitForTimeout(2400);await p.mouse.move(250,520);await p.mouse.wheel(0,370);await p.waitForTimeout(2200);await still(p,'app-meeting-notes');await p.mouse.wheel(0,260);await p.waitForTimeout(2500);});
  if(errors.length)throw new Error('App errors: '+errors.join('; '));
  await fs.writeFile(path.join(out,'mobile-manifest.json'),JSON.stringify(entries,null,2)+'\n');
  await fs.writeFile(path.join(out,'mobile-provenance.json'),JSON.stringify({recordedAt:new Date().toISOString(),viewport,origin,source:'Actual Expo web build, not native Android',profile:'Maya Desai · fictional demo',pageErrors:errors,scenes:Object.keys(entries),noMessageSent:true},null,2)+'\n');console.log('Captured '+Object.keys(entries).join(', '));
 }
}finally{await browser.close();}
