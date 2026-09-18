import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
const root=path.resolve('apps/web/public/demo'), output=path.join(root,'mobile');
await fs.mkdir(output,{recursive:true});
const manifest={}; let before=0,after=0;
async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(p===output)continue;if(e.isDirectory())await walk(p);else if(/\.(png|jpe?g|webp)$/i.test(e.name)){
 const bytes=await fs.readFile(p);before+=bytes.length;const hash=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,14); const asset={};
 for(const [kind,size,quality] of [['image',1000,82],['thumb',160,75]]){const file=`${hash}-${kind}.jpg`;const buf=await sharp(bytes).rotate().resize({width:size,height:size,fit:'inside',withoutEnlargement:true}).flatten({background:'#f7f8f2'}).jpeg({quality,mozjpeg:true}).toBuffer();await fs.writeFile(path.join(output,file),buf);asset[kind]='/demo/mobile/'+file;if(kind==='image')after+=buf.length;}
 manifest['/demo/'+path.relative(root,p).split(path.sep).join('/')]=asset;
}}}
await walk(root);
await fs.writeFile('apps/mobile/src/pilot/media-manifest.json',JSON.stringify(manifest));
console.log(JSON.stringify({images:Object.keys(manifest).length,originalMB:before/1e6,mobileMB:after/1e6,reduction:1-after/before}));
