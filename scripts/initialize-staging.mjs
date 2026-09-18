// One-time copy of modern curated workspaces to the isolated DUIT staging branch.
// Never copies the legacy archive, media archive, tokens, sessions or delivery outbox.
import pg from 'pg';
import fs from 'node:fs/promises';
import {pool,migrate} from '../apps/api/src/db.js';
const target = new URL(process.env.DATABASE_URL || '');
const expected='ep-autumn-voice-az2i6e27.c-3.ap-southeast-1.aws.neon.tech';
if(target.hostname!==expected || target.pathname!=='/neondb')throw Error('This bootstrap is restricted to the dedicated DUIT staging branch.');
const source=new pg.Pool({connectionString:'postgresql://duit@127.0.0.1:5432/duit_2026_pilot',max:1});
try {
 await migrate();
 if(Number((await pool.query('SELECT count(*) AS n FROM users')).rows[0].n))throw Error('Staging already has users; refusing to overwrite it.');
 const users=(await source.query("SELECT * FROM users WHERE data_origin IN ('fictional_demo','pilot_operator')")).rows;
 if(users.length!==22 || users.filter(u=>u.role==='admin').length!==1)throw Error('Unexpected source workspace; review before import.');
 const userIds=users.map(u=>u.id), authored=users.filter(u=>u.data_origin==='fictional_demo').map(u=>u.id);
 const rows={users};
 rows.cards=(await source.query("SELECT * FROM cards WHERE owner_id=ANY($1) AND data_origin='fictional_demo'",[authored])).rows;
 const cards=rows.cards.map(c=>c.id);
 rows.pitch_panels=(await source.query('SELECT * FROM pitch_panels WHERE card_id=ANY($1)',[cards])).rows;
 rows.card_versions=(await source.query('SELECT v.* FROM card_versions v JOIN cards c ON c.published_version_id=v.id WHERE c.id=ANY($1)',[cards])).rows;
 rows.people=(await source.query("SELECT * FROM people WHERE owner_id=ANY($1) AND data_origin='fictional_demo'",[authored])).rows;
 const people=rows.people.map(p=>p.id);
 rows.events=(await source.query('SELECT * FROM events WHERE owner_id=ANY($1)',[authored])).rows;
 rows.encounters=(await source.query('SELECT * FROM encounters WHERE person_id=ANY($1) AND owner_id=ANY($2)',[people,authored])).rows;
 rows.commitments=(await source.query('SELECT * FROM commitments WHERE person_id=ANY($1) AND owner_id=ANY($2)',[people,authored])).rows;
 rows.need_offers=(await source.query('SELECT * FROM need_offers WHERE owner_id=ANY($1)',[authored])).rows;
 const db=await pool.connect();
 try {
  await db.query('BEGIN');
  for(const [table,items] of Object.entries(rows)) {
   const cols=(await db.query('SELECT column_name,data_type FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2',['public',table])).rows;
   for(const row of items){
    // Local assets are deliberately kept on localhost in fixture URLs: API DTOs
    // rewrite them to the current service host, supporting local and cloud alike.
    const keys=Object.keys(row);const vals=keys.map(k=>cols.find(c=>c.column_name===k)?.data_type==='jsonb'?JSON.stringify(row[k]):row[k]);
    await db.query(`INSERT INTO ${table} (${keys.map(k=>'"'+k+'"').join(',')}) VALUES (${keys.map((_,i)=>'$'+(i+1)).join(',')})`,vals);
   }
  }
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();}
 const counts=Object.fromEntries(Object.entries(rows).map(([t,r])=>[t,r.length]));
 await fs.writeFile('.local/deployment/import-summary.json',JSON.stringify({at:new Date().toISOString(),counts,excluded:['archive_profiles','media_assets','auth_sessions','share_links','leads','card_events','audit_logs','local_outbox']},null,2),{mode:0o600});
 console.log(counts);
}finally{await source.end();await pool.end();}
