import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || new URL(testUrl).pathname !== '/duit_2026_pilot_test') throw new Error('Integration tests require explicit TEST_DATABASE_URL naming duit_2026_pilot_test. No other database will be used.');
const fixtureDir = await fs.mkdtemp(path.join(os.tmpdir(), '.duit-api-test-'));
process.env.WEB_DIST_DIR = path.join(fixtureDir, 'dist');
process.env.MEDIA_DIR = path.join(fixtureDir, 'media');
process.env.PILOT_APK_PATH = path.join(fixtureDir, 'test.apk');
await fs.mkdir(path.join(process.env.WEB_DIST_DIR, 'assets'), {
  recursive: true
});
await fs.mkdir(path.join(process.env.WEB_DIST_DIR, 'demo'), {
  recursive: true
});
await fs.writeFile(path.join(process.env.WEB_DIST_DIR, 'index.html'), '<!doctype html><html><head><title>DUIT</title></head><body><div id="root"></div><script type="module" src="/assets/app.js"></script></body></html>');
await fs.writeFile(path.join(process.env.WEB_DIST_DIR, 'assets', 'app.js'), '/* test frontend fixture */');
await fs.writeFile(path.join(process.env.WEB_DIST_DIR, '.private'), 'must-never-be-served');
await fs.writeFile(process.env.PILOT_APK_PATH, 'APK test fixture');
process.env.DATABASE_URL = testUrl;
process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
process.env.LOCAL_OUTBOX = 'true';
// Invitation behaviour is tested explicitly below, independent of the operator's local settings.
delete process.env.PILOT_INVITE_CODE;
process.env.DUIT_AI_ENABLED = 'false';
process.env.DUIT_AI_BUDGET_APPROVED_USD = '0';
const {
  migrate,
  pool,
  query
} = await import('../src/db.js');
const {
  createApp
} = await import('../src/app.js');
let server, base;
const ids = [];
const suffix = crypto.randomUUID().slice(0, 8);
async function request(route, {
  token,
  method = 'GET',
  body
} = {}) {
  const response = await fetch(`${base}${route}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? {
        Authorization: `Bearer ${token}`
      } : {})
    },
    ...(body !== undefined ? {
      body: JSON.stringify(body)
    } : {})
  });
  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = raw;
  }
  return {
    status: response.status,
    body: data,
    headers: response.headers
  };
}
async function signup(name) {
  const r = await request('/auth/signup', {
    method: 'POST',
    body: {
      email: `${name}-${suffix}@example.test`,
      password: 'correct-horse-battery-staple',
      displayName: name
    }
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  ids.push(r.body.user.id);
  return r.body;
}
const panels = () => ['hook', 'relevance', 'offer', 'outcome', 'proof', 'cta'].map((panelType, position) => ({
  panelType,
  position,
  body: `Reviewed ${panelType} story`,
  provenance: 'owner',
  approved: true
}));
test.before(async () => {
  await migrate();
  server = createApp().listen(0, '127.0.0.1');
  await new Promise(r => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
});
test.after(async () => {
  try {
    if (ids.length) {
      await query('DELETE FROM share_links WHERE owner_id=ANY($1::uuid[])', [ids]);
      await query('DELETE FROM local_outbox WHERE recipient LIKE $1', [`%-${suffix}@example.test`]);
      await query('DELETE FROM users WHERE id=ANY($1::uuid[])', [ids]);
    }
  } catch (error) {
    console.error('Isolated test cleanup failed:', error.message, error.code);
    throw error;
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
    await pool.end();
    await fs.rm(fixtureDir, { recursive: true, force: true, maxRetries: 3 });
  }
});
test('private pilot end-to-end: two accounts, public card, verified claim and relationship memory', async t => {
  const owner = await signup('owner'),
    other = await signup('other'),
    recipient = await signup('recipient'),
    operator = await signup('operator');
  await query("UPDATE users SET role='admin' WHERE id=$1", [operator.user.id]);
  let card, person, event, encounter;
  await t.test('passwords reject bcrypt truncation in both ASCII and UTF-8', async () => {
    for (const [label, password] of [['ascii', 'a'.repeat(72)], ['utf8', 'é'.repeat(36)]]) {
      const email = `boundary-${label}-${suffix}@example.test`;
      const valid = await request('/auth/signup', {
        method: 'POST',
        body: { email, password }
      });
      assert.equal(valid.status, 201, 'Exactly 72 UTF-8 bytes must be accepted');
      ids.push(valid.body.user.id);
      assert.equal((await request('/auth/login', {
        method: 'POST',
        body: { email, password }
      })).status, 200);
      const truncated = password + 'x';
      assert.equal((await request('/auth/signup', {
        method: 'POST',
        body: { email: `too-long-${label}-${suffix}@example.test`, password: truncated }
      })).status, 400);
      const attempt = await request('/auth/login', {
        method: 'POST',
        body: { email, password: truncated }
      });
      assert.equal(attempt.status, 400, 'A password with the same 72-byte prefix must not authenticate');
      assert.match(JSON.stringify(attempt.body), /72 UTF-8 bytes/);
    }
  });
  await t.test('card drafts are owner-only and publication requires all unique approvals', async () => {
    const r = await request('/cards', {
      token: owner.accessToken,
      method: 'POST',
      body: {
        slug: `duittest-${suffix}`,
        title: 'Alex Taylor',
        company: 'Northstar Studio',
        bio: 'We build practical research tools.',
        contact: {
          email: owner.user.email
        },
        ctaType: 'book',
        ctaLabel: 'Book a conversation'
      }
    });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    card = r.body.card;
    assert.equal((await request(`/cards/${card.id}`, {
      token: other.accessToken
    })).status, 404);
    assert.equal((await request(`/public/cards/${card.slug}`)).status, 404);
    assert.equal((await request(`/cards/${card.id}/publish`, {
      method: 'POST',
      token: owner.accessToken
    })).status, 422);
    assert.equal((await request(`/cards/${card.id}/panels`, {
      method: 'POST',
      token: owner.accessToken,
      body: {
        panels: panels()
      }
    })).status, 200);
    const duplicate = panels();
    duplicate[5].panelType = 'hook';
    assert.equal((await request(`/cards/${card.id}/panels`, {
      method: 'POST',
      token: owner.accessToken,
      body: {
        panels: duplicate
      }
    })).status, 400);
    assert.equal((await request(`/cards/${card.id}`, {
      token: owner.accessToken
    })).body.card.panels.length, 6);
    assert.equal((await request(`/cards/${card.id}/publish`, {
      method: 'POST',
      token: owner.accessToken
    })).status, 200);
    const publicCard = (await request(`/public/cards/${card.slug}`)).body.card;
    assert.equal(publicCard.company, 'Northstar Studio');
    assert.equal(publicCard.dataOrigin, 'user_created');
    assert.ok(!('ownerId' in publicCard));
  });
  await t.test('published snapshot stays reviewed while new draft changes remain private', async () => {
    const patched = await request(`/cards/${card.id}`, {
      method: 'PATCH',
      token: owner.accessToken,
      body: {
        title: 'Edited private title'
      }
    });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.card.company, 'Northstar Studio', 'PATCH must preserve omitted fields');
    const draft = panels().map(p => ({
      ...p,
      approved: false,
      body: 'Private unapproved content'
    }));
    await request(`/cards/${card.id}/panels`, {
      method: 'POST',
      token: owner.accessToken,
      body: {
        panels: draft
      }
    });
    const pub = (await request(`/public/cards/${card.slug}`)).body.card;
    assert.equal(pub.title, 'Alex Taylor');
    assert.equal(pub.panels[0].body, 'Reviewed hook story');
    assert.equal((await request(`/cards/${card.id}/publish`, {
      method: 'POST',
      token: owner.accessToken
    })).status, 422);
  });
  await t.test('public engagement is explicit, deduplicated and leads are private', async () => {
    await request(`/public/cards/${card.slug}`);
    await request(`/public/cards/${card.slug}`);
    let a = await request(`/cards/${card.id}/analytics`, {
      token: owner.accessToken
    });
    assert.equal(a.body.totals.views, 0);
    for (let i = 0; i < 2; i++) assert.equal((await request(`/public/cards/${card.slug}/events`, {
      method: 'POST',
      body: {
        type: 'viewed',
        eventKey: 'same-browser-open',
        visitorId: 'test-browser'
      }
    })).status, 202);
    a = await request(`/cards/${card.id}/analytics`, {
      token: owner.accessToken
    });
    assert.equal(a.body.totals.views, 1);
    assert.equal((await request(`/public/cards/${card.slug}/leads`, {
      method: 'POST',
      body: {
        name: 'Dana',
        consent: false,
        email: 'dana@example.test'
      }
    })).status, 400);
    assert.equal((await request(`/public/cards/${card.slug}/leads`, {
      method: 'POST',
      body: {
        name: 'Dana',
        consent: true,
        email: 'dana@example.test',
        intent: 'A private lead'
      }
    })).status, 201);
    assert.equal((await request('/leads', {
      token: owner.accessToken
    })).body.leads.length, 1);
    assert.equal((await request('/leads', {
      token: other.accessToken
    })).body.leads.length, 0);
  });
  await t.test('people, encounters, events and commitments persist and isolate owners', async () => {
    const p = await request('/people', {
      method: 'POST',
      token: owner.accessToken,
      body: {
        name: 'Jamie Researcher',
        company: 'Paris Robotics',
        countryCode: 'FR',
        tags: ['AI', 'robotics'],
        clientId: `person-${suffix}`
      }
    });
    assert.equal(p.status, 201);
    person = p.body.person;
    assert.equal((await request('/people', {
      method: 'POST',
      token: owner.accessToken,
      body: {
        name: 'Jamie Researcher',
        clientId: `person-${suffix}`
      }
    })).body.person.id, person.id);
    const e = await request('/events', {
      method: 'POST',
      token: owner.accessToken,
      body: {
        name: 'Paris AI Week',
        city: 'Paris',
        countryCode: 'FR',
        latitude: 48.85,
        longitude: 2.35,
        startsAt: '2026-09-10T09:00:00Z'
      }
    });
    assert.equal(e.status, 201);
    event = e.body.event;
    const enc = await request(`/people/${person.id}/encounters`, {
      method: 'POST',
      token: owner.accessToken,
      body: {
        eventId: event.id,
        originalNote: 'Jamie needs warehouse automation and offered a robotics trial.',
        clientId: `encounter-${suffix}`,
        commitments: [{
          text: 'Send robotics proposal',
          dueAt: '2026-09-15T10:00:00Z'
        }]
      }
    });
    assert.equal(enc.status, 201, JSON.stringify(enc.body));
    encounter = enc.body.encounter;
    assert.equal(encounter.recap, null, 'No fabricated AI summary');
    const retry = await request(`/people/${person.id}/encounters`, {
      method: 'POST',
      token: owner.accessToken,
      body: {
        eventId: event.id,
        clientId: `encounter-${suffix}`
      }
    });
    assert.equal(retry.body.encounter.id, encounter.id);
    assert.equal((await request(`/people/${person.id}`, {
      token: other.accessToken
    })).status, 404);
    assert.equal((await request(`/people/${person.id}/encounters`, {
      method: 'POST',
      token: other.accessToken,
      body: {
        originalNote: 'not mine'
      }
    })).status, 404);
    assert.equal((await request(`/encounters/${encounter.id}`, {
      method: 'PATCH',
      token: other.accessToken,
      body: {
        recap: 'overwrite'
      }
    })).status, 404);
    const ownDetail = (await request(`/people/${person.id}`, {
      token: owner.accessToken
    })).body;
    assert.equal(ownDetail.encounters.length, 1);
    assert.equal(ownDetail.commitments.length, 1);
    const update = await request(`/commitments/${ownDetail.commitments[0].id}`, {
      method: 'PATCH',
      token: owner.accessToken,
      body: {
        status: 'done'
      }
    });
    assert.equal(update.body.commitment.status, 'done');
    assert.ok(update.body.commitment.completedAt);
    assert.equal((await request(`/people?countryCode=FR&eventId=${event.id}`, {
      token: owner.accessToken
    })).body.people.length, 1);
    assert.equal((await request(`/events/${event.id}`, {
      token: owner.accessToken
    })).body.event.peopleCount, 1);
  });
  await t.test('search and feed cite owned evidence without leaking a different account', async () => {
    await request('/need-offers', {
      method: 'POST',
      token: owner.accessToken,
      body: {
        kind: 'need',
        text: 'warehouse automation'
      }
    });
    const search = await request('/search', {
      method: 'POST',
      token: owner.accessToken,
      body: {
        query: 'warehouse automation Paris'
      }
    });
    assert.ok(search.body.results.some(r => r.id === person.id));
    assert.ok(search.body.results[0].evidence.some(e => e.sourceId === encounter.id));
    assert.equal((await request('/search', {
      method: 'POST',
      token: other.accessToken,
      body: {
        query: 'warehouse automation'
      }
    })).body.results.length, 0);
    assert.ok((await request('/feed', {
      token: owner.accessToken
    })).body.items.some(i => i.type === 'relevant_person'));
    const home = await request('/me/home', {
      token: owner.accessToken
    });
    assert.equal(home.body.stats.people, 1);
    assert.equal(home.body.stats.encounters, 1);
  });
  await t.test('recipient draft requires actual token proof and matching account', async () => {
    const share = await request(`/cards/${card.id}/shares`, {
      method: 'POST',
      token: owner.accessToken,
      body: {
        channel: 'whatsapp',
        recipientDraft: {
          name: 'Recipient Draft',
          email: recipient.user.email,
          company: 'Seed Company'
        }
      }
    });
    assert.equal(share.status, 201);
    const token = share.body.token;
    const publicShare = await request(`/public/shares/${token}`);
    assert.equal(publicShare.status, 200);
    assert.ok(!JSON.stringify(publicShare.body).includes(recipient.user.email));
    assert.equal(publicShare.body.claimAvailable, true);
    const start = await request(`/public/shares/${token}/claim/start`, {
      method: 'POST',
      body: {
        email: recipient.user.email
      }
    });
    assert.equal(start.body.delivery, 'local_outbox');
    assert.ok(!start.body.verificationToken);
    assert.equal((await request('/admin/outbox', {
      token: other.accessToken
    })).status, 403);
    const outbox = await request('/admin/outbox', {
      token: operator.accessToken
    });
    const message = outbox.body.messages.find(m => m.recipient === recipient.user.email);
    assert.ok(message.payload.verificationToken);
    const verify = await request(`/public/shares/${token}/claim/verify`, {
      method: 'POST',
      body: {
        verificationToken: message.payload.verificationToken
      }
    });
    assert.equal(verify.status, 200);
    assert.equal(verify.body.draft.company, 'Seed Company');
    assert.equal((await request(`/public/shares/${token}/claim/verify`, {
      method: 'POST',
      body: {
        verificationToken: message.payload.verificationToken
      }
    })).status, 400);
    const body = {
      claimToken: verify.body.claimToken,
      profile: {
        fullName: 'Reviewed Recipient',
        company: 'My Correct Company'
      }
    };
    assert.equal((await request('/claims/accept', {
      method: 'POST',
      token: other.accessToken,
      body
    })).status, 403);
    const accepted = await request('/claims/accept', {
      method: 'POST',
      token: recipient.accessToken,
      body
    });
    assert.equal(accepted.status, 200, JSON.stringify(accepted.body));
    assert.equal(accepted.body.profile.company, 'My Correct Company');
    assert.ok(accepted.body.person.id);
    assert.equal((await request('/claims/accept', {
      method: 'POST',
      token: recipient.accessToken,
      body
    })).status, 400);
    assert.ok((await request('/me', {
      token: recipient.accessToken
    })).body.user.verifiedAt);
  });
  await t.test('private media ownership and publication exposure are enforced', async () => {
    const data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j9KkAAAAASUVORK5CYII=';
    const upload = await request('/media', {
      method: 'POST',
      token: owner.accessToken,
      body: {
        filename: 'portrait.png',
        mimeType: 'image/png',
        data,
        purpose: 'portrait'
      }
    });
    assert.equal(upload.status, 201, JSON.stringify(upload.body));
    const media = upload.body.media;
    assert.equal((await request(`/media/${media.id}`, {
      token: other.accessToken
    })).status, 404);
    assert.equal((await request(`/admin/media/${media.id}`, {
      token: operator.accessToken
    })).status, 404, 'Admin must not see private unpublished images');
    const audio = await request('/media', {
      method: 'POST',
      token: owner.accessToken,
      body: {
        filename: 'note.mp3',
        mimeType: 'audio/mpeg',
        data: Buffer.from('ID3' + 'private voice note fixture').toString('base64'),
        purpose: 'voice_note'
      }
    });
    assert.equal(audio.status, 201);
    assert.equal((await request(`/admin/media/${audio.body.media.id}`, {
      token: operator.accessToken
    })).status, 404, 'Admin must not see private voice notes');
    const savedScan = await request(`/people/${person.id}`, {
      method: 'PATCH',
      token: owner.accessToken,
      body: {
        businessCardUrl: media.url
      }
    });
    assert.equal(savedScan.body.person.businessCardUrl, media.url);
    assert.equal((await request(`/public/media/${media.id}`)).status, 404);
    await request(`/cards/${card.id}`, {
      method: 'PATCH',
      token: owner.accessToken,
      body: {
        imageUrl: media.url
      }
    });
    await request(`/cards/${card.id}/panels`, {
      method: 'POST',
      token: owner.accessToken,
      body: {
        panels: panels()
      }
    });
    assert.equal((await request(`/cards/${card.id}/publish`, {
      method: 'POST',
      token: owner.accessToken
    })).status, 200);
    assert.equal((await request(`/public/media/${media.id}`)).status, 200);
    for (const field of ['imageUrl', 'coverUrl', 'businessCardUrl', 'businessCardBackUrl']) {
      await request(`/cards/${card.id}`, {
        method: 'PATCH',
        token: owner.accessToken,
        body: { [field]: audio.body.media.url }
      });
      const rejected = await request(`/cards/${card.id}/publish`, {
        method: 'POST',
        token: owner.accessToken
      });
      assert.equal(rejected.status, 422);
      assert.equal(rejected.body.error.code, 'IMAGE_REQUIRED');
      assert.equal((await request(`/public/media/${audio.body.media.id}`)).status, 404, 'A voice note must not become public through card artwork');
      const publicCard = await request(`/public/cards/${card.slug}`);
      assert.ok(publicCard.body.card.imageUrl.endsWith(`/public/media/${media.id}`), 'Failed publishing must preserve the last approved snapshot');
      await request(`/cards/${card.id}`, {
        method: 'PATCH',
        token: owner.accessToken,
        body: { [field]: field === 'imageUrl' ? media.url : null }
      });
    }
    // The original visiting card is a separate approved visual asset, not a portrait.
    await request(`/cards/${card.id}`, { method: 'PATCH', token: owner.accessToken, body: { imageUrl: null, businessCardUrl: media.url } });
    assert.equal((await request(`/cards/${card.id}/publish`, { method: 'POST', token: owner.accessToken })).status, 200);
    const visualCard = (await request(`/public/cards/${card.slug}`)).body.card;
    assert.equal(visualCard.imageUrl, null);
    assert.ok(visualCard.businessCardUrl.endsWith(`/public/media/${media.id}`));
    assert.equal((await request(`/public/media/${media.id}`)).status, 200, 'The approved visiting card alone grants public image access');
    const savedVisual = await request(`/cards/${card.id}/save`, { method: 'POST', token: operator.accessToken });
    assert.equal(savedVisual.status, 201);
    assert.equal(new URL(savedVisual.body.person.businessCardUrl).pathname, new URL(visualCard.businessCardUrl).pathname, 'Saving a card retains the original artwork across configured and request-local origins');
    assert.equal((await request(`/admin/media/${media.id}`, {
      token: operator.accessToken
    })).status, 200, 'Admin may see an approved public image');
    const videoBytes=await fs.readFile(new URL('../../web/public/demo/clips/noah.mp4',import.meta.url));
    const videoUpload=await request('/media',{method:'POST',token:owner.accessToken,body:{filename:'portfolio.mp4',mimeType:'video/mp4',data:videoBytes.toString('base64'),purpose:'cover'}});
    assert.equal(videoUpload.status,201);
    const video=videoUpload.body.media;
    assert.equal((await request(`/public/media/${video.id}`)).status,404,'Unpublished video stays private');
    await request(`/cards/${card.id}`,{method:'PATCH',token:owner.accessToken,body:{businessMedia:[{url:video.url,type:'video',title:'Our work',caption:'A short introduction'}]}});
    assert.equal((await request(`/cards/${card.id}/publish`,{method:'POST',token:owner.accessToken})).status,200);
    assert.equal((await request(`/public/media/${video.id}`)).status,200,'Approved video is playable publicly');
    const range = await fetch(`${base}/public/media/${video.id}`, {headers:{Range:'bytes=0-31'}});
    assert.equal(range.status,206);
    assert.equal(range.headers.get('content-range'),`bytes 0-31/${videoBytes.length}`);
    assert.deepEqual(Buffer.from(await range.arrayBuffer()),videoBytes.subarray(0,32));
    const invalidRange=await fetch(`${base}/public/media/${video.id}`,{headers:{Range:'bytes=999999999-'}});
    assert.equal(invalidRange.status,416);
    if(process.env.MEDIA_STORAGE==='database') {
      const stored=(await query('SELECT storage_path FROM media_assets WHERE id=$1',[video.id])).rows[0];
      assert.ok(stored.storage_path.startsWith('database:'));
      assert.deepEqual((await query('SELECT bytes FROM media_blobs WHERE media_id=$1',[video.id])).rows[0].bytes,videoBytes);
    }

    const slide = {url:media.url,type:'image',title:'Our work',caption:'A recent project'};
    assert.equal((await request(`/cards/${card.id}`, {method:'PATCH',token:owner.accessToken,body:{businessMedia:Array(5).fill(slide)}})).status,400);
    await request(`/cards/${card.id}`, {method:'PATCH',token:owner.accessToken,body:{businessMedia:[{...slide,url:audio.body.media.url}]}});
    assert.equal((await request(`/cards/${card.id}/publish`, {method:'POST',token:owner.accessToken})).status,422);
    assert.equal((await request(`/public/media/${audio.body.media.id}`)).status,404);
    const foreign = (await request('/media', {method:'POST',token:other.accessToken,body:{filename:'other.png',mimeType:'image/png',data,purpose:'cover'}})).body.media;
    await request(`/cards/${card.id}`, {method:'PATCH',token:owner.accessToken,body:{businessMedia:[{...slide,url:foreign.url}]}});
    assert.equal((await request(`/cards/${card.id}/publish`, {method:'POST',token:owner.accessToken})).status,404,'A gallery must not expose another owner’s upload');
    await request(`/cards/${card.id}`, {method:'PATCH',token:owner.accessToken,body:{imageUrl:null,businessCardUrl:null,businessCardBackUrl:null,businessMedia:[slide]}});
    assert.equal((await request(`/cards/${card.id}/publish`, {method:'POST',token:owner.accessToken})).status,200);
    const gallery = (await request(`/public/cards/${card.slug}`)).body.card.businessMedia;
    assert.equal(gallery.length,1);
    assert.equal((await request(`/public/media/${video.id}`)).status,404,'Removing a video from the published version makes it private again');
    assert.ok(gallery[0].url.endsWith(`/public/media/${media.id}`));
    assert.equal((await request(`/public/media/${media.id}`)).status,200,'Reviewed gallery media is public');
    await request(`/cards/${card.id}/unpublish`, {
      method: 'POST',
      token: owner.accessToken
    });
    assert.equal((await request(`/public/media/${media.id}`)).status, 404);
  });
  await t.test('AI is honestly unavailable before approval and admin access is role checked', async () => {
    const ai = await request('/ai/capabilities', {
      token: owner.accessToken
    });
    assert.equal(ai.body.enabled, false);
    assert.equal((await request('/ai/jobs', {
      method: 'POST',
      token: owner.accessToken,
      body: {
        task: 'profile_draft',
        input: {
          brief: 'A business'
        }
      }
    })).status, 503);
    assert.equal((await request('/admin/overview', {
      token: owner.accessToken
    })).status, 403);
    assert.equal((await request('/admin/overview', {
      token: operator.accessToken
    })).status, 200);
    const status = await request(`/admin/users/${other.user.id}`, {
      method: 'PATCH',
      token: operator.accessToken,
      body: {
        status: 'suspended'
      }
    });
    assert.equal(status.status, 200);
    assert.equal((await request('/me', {
      token: other.accessToken
    })).status, 401);
    assert.ok((await request('/admin/audit', {
      token: operator.accessToken
    })).body.audit.some(a => a.targetId === other.user.id));
  });
  await t.test('concurrent AI jobs reserve budget before a mocked provider call and retain uncertain charges', async () => {
    const nativeFetch = globalThis.fetch;
    const previous = {
      enabled: process.env.DUIT_AI_ENABLED,
      budget: process.env.DUIT_AI_BUDGET_APPROVED_USD,
      key: process.env.OPENAI_API_KEY
    };
    const {
      estimateCost
    } = await import('../src/providers/index.js');
    const input = {
      brief: 'We build warehouse software'
    };
    const task = 'profile_draft';
    const estimate = estimateCost({
      task,
      input,
      media: []
    });
    let calls = 0;
    let uncertain = false;
    const settlementFault = `test_settlement_${suffix.replaceAll('-', '_')}`;
    const result = {
      headline: 'Warehouse software',
      summary: 'We build warehouse software.',
      offers: ['Warehouse software'],
      needs: [],
      cta: {
        label: 'Start a conversation',
        type: 'contact',
        value: null
      },
      panels: panels().map(p => ({
        panelType: p.panelType,
        body: p.body,
        evidenceIds: ['input:brief']
      })),
      evidenceIds: ['input:brief'],
      warnings: []
    };
    globalThis.fetch = async (url, options) => {
      if (String(url).startsWith('https://api.openai.com/')) {
        calls++;
        await new Promise(r => setTimeout(r, 150));
        if (uncertain) throw new Error('Mock interrupted response');
        return new Response(JSON.stringify({
          status: 'completed',
          output: [{
            content: [{
              type: 'output_text',
              text: JSON.stringify(result)
            }]
          }],
          usage: {
            input_tokens: 100,
            output_tokens: 100
          }
        }), {
          status: 200,
          headers: {
            'content-type': 'application/json'
          }
        });
      }
      if (!String(url).startsWith(base)) throw new Error('Tests block non-local network');
      return nativeFetch(url, options);
    };
    try {
      process.env.DUIT_AI_ENABLED = 'true';
      process.env.OPENAI_API_KEY = 'unit-test-not-a-real-key';
      process.env.DUIT_AI_BUDGET_APPROVED_USD = String(estimate.reserveUsd * 1.1);
      await query("UPDATE ai_budgets SET reserved_usd=0,spent_usd=0 WHERE id='pilot'");
      const responses = await Promise.all([request('/ai/jobs', {
        method: 'POST',
        token: owner.accessToken,
        body: {
          task,
          input
        }
      }), request('/ai/jobs', {
        method: 'POST',
        token: owner.accessToken,
        body: {
          task,
          input
        }
      })]);
      assert.deepEqual(responses.map(r => r.status).sort(), [202, 402]);
      const job = responses.find(r => r.status === 202).body.job;
      let finished;
      for (let i = 0; i < 60; i++) {
        finished = (await request(`/ai/jobs/${job.id}`, {
          token: owner.accessToken
        })).body.job;
        if (finished.status === 'succeeded') break;
        await new Promise(r => setTimeout(r, 20));
      }
      assert.equal(finished.status, 'succeeded');
      assert.equal(calls, 1);
      assert.equal((await request(`/ai/jobs/${job.id}`, {
        token: recipient.accessToken
      })).status, 404);
      const ledger = (await query("SELECT * FROM ai_budgets WHERE id='pilot'")).rows[0];
      assert.equal(Number(ledger.reserved_usd), 0);
      assert.ok(Number(ledger.spent_usd) > 0);
      uncertain = true;
      process.env.DUIT_AI_BUDGET_APPROVED_USD = '1';
      const unknown = (await request('/ai/jobs', {
        method: 'POST',
        token: owner.accessToken,
        body: {
          task,
          input
        }
      })).body.job;
      for (let i = 0; i < 60; i++) {
        finished = (await request(`/ai/jobs/${unknown.id}`, {
          token: owner.accessToken
        })).body.job;
        if (finished.status === 'needs_review') break;
        await new Promise(r => setTimeout(r, 20));
      }
      assert.equal(finished.status, 'needs_review');
      assert.ok(finished.reservedUsd > 0);
      assert.ok(Number((await query("SELECT reserved_usd FROM ai_budgets WHERE id='pilot'")).rows[0].reserved_usd) > 0);
      // Fail a real settlement transaction after a successful mocked provider response.
      // The old boundary caught this DB error as an uncharged provider failure.
      const beforeFault = (await query("SELECT * FROM ai_budgets WHERE id='pilot'")).rows[0];
      await query(`CREATE FUNCTION ${settlementFault}() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          RAISE EXCEPTION 'Injected settlement failure';
        END;
      $$`);
      await query(`CREATE TRIGGER ${settlementFault} BEFORE UPDATE ON ai_jobs
        FOR EACH ROW WHEN (NEW.owner_id='${owner.user.id}'::uuid AND NEW.status='succeeded')
        EXECUTE FUNCTION ${settlementFault}()`);
      uncertain = false;
      const heldResponse = await request('/ai/jobs', {
        method: 'POST', token: owner.accessToken, body: { task, input }
      });
      assert.equal(heldResponse.status, 202);
      const held = heldResponse.body.job;
      for (let i = 0; i < 60; i++) {
        finished = (await request(`/ai/jobs/${held.id}`, { token: owner.accessToken })).body.job;
        if (finished.status === 'needs_review') break;
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      assert.equal(finished.status, 'needs_review');
      assert.ok(finished.costUsd > 0, 'Known provider usage survives settlement failure');
      assert.equal(finished.reservedUsd, held.reservedUsd, 'Failed settlement must retain the full reservation');
      const afterFault = (await query("SELECT * FROM ai_budgets WHERE id='pilot'")).rows[0];
      assert.equal(Number(afterFault.spent_usd), Number(beforeFault.spent_usd));
      assert.ok(Math.abs(Number(afterFault.reserved_usd) - Number(beforeFault.reserved_usd) - held.reservedUsd) < 0.000002);
      assert.equal(calls, 3, 'Persistence failure must not retry the paid provider');
    } finally {
      await query(`DROP TRIGGER IF EXISTS ${settlementFault} ON ai_jobs`);
      await query(`DROP FUNCTION IF EXISTS ${settlementFault}()`);
      globalThis.fetch = nativeFetch;
      process.env.DUIT_AI_ENABLED = previous.enabled;
      process.env.DUIT_AI_BUDGET_APPROVED_USD = previous.budget;
      if (previous.key === undefined) delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY = previous.key;
      await query("UPDATE ai_budgets SET reserved_usd=0,spent_usd=0,limit_usd=0 WHERE id='pilot'");
    }
  });
  await t.test('packaged web serves escaped approved cards and APK without exposing private files', async () => {
    const x = await request('/cards', {
      method: 'POST',
      token: owner.accessToken,
      body: {
        slug: `escaped-${suffix}`,
        title: '<script>alert(1)</script>',
        subtitle: 'Private demo preview & business'
      }
    });
    assert.equal(x.status, 201);
    const id = x.body.card.id;
    await request(`/cards/${id}/panels`, {
      method: 'POST',
      token: owner.accessToken,
      body: {
        panels: panels()
      }
    });
    await request(`/cards/${id}/publish`, {
      method: 'POST',
      token: owner.accessToken
    });
    const origin = base.replace('/api/v1', '');
    const page = await fetch(`${origin}/c/escaped-${suffix}`);
    const html = await page.text();
    assert.equal(page.status, 200);
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    assert.ok(!html.includes('<script>alert(1)</script>'));
    assert.ok(html.includes('og:title'));
    assert.ok(html.includes('Reviewed hook story'));
    assert.ok(page.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
    const apk = await fetch(`${origin}/downloads/DUIT-2026-Pilot.apk`, {
      method: 'HEAD'
    });
    assert.equal(apk.status, 200);
    assert.match(apk.headers.get('content-type'), /android/);
    assert.equal(await apk.text(), '');
    const previousApkUrl = process.env.PILOT_APK_URL;
    const releaseUrl = 'https://github.com/prakhar-goel/duit-cards-2025/releases/download/v4.3.0-staging/DUIT-2026-Pilot.apk';
    try {
      process.env.PILOT_APK_URL = releaseUrl;
      const probe = await fetch(`${origin}/downloads/DUIT-2026-Pilot.apk`, { method: 'HEAD', redirect: 'manual' });
      assert.equal(probe.status, 200);
      assert.match(probe.headers.get('content-type'), /android/);
      assert.equal(probe.headers.get('location'), null);
      assert.equal(probe.headers.get('cache-control'), 'private, no-store');
      assert.equal(await probe.text(), '');
      const download = await fetch(`${origin}/downloads/DUIT-2026-Pilot.apk`, { redirect: 'manual' });
      assert.equal(download.status, 302);
      assert.equal(download.headers.get('location'), releaseUrl);
    } finally {
      if (previousApkUrl === undefined) delete process.env.PILOT_APK_URL;
      else process.env.PILOT_APK_URL = previousApkUrl;
    }

    assert.equal((await fetch(`${origin}/assets/app.js`)).status, 200);
    assert.equal((await fetch(`${origin}/admin`)).status, 200);
    for (const route of ['/.env.local', '/.local/media/example.png', '/.private', '/assets/%2e%2e%2f.private', '/demo/%2e%2e%2f.private']) {
      const r = await fetch(origin + route);
      assert.notEqual(r.status, 200, route);
      assert.ok(!(await r.text()).includes('must-never-be-served'));
    }
    const missing = await request('/not-a-real-endpoint', {
      token: owner.accessToken
    });
    assert.equal(missing.status, 404);
    assert.match(missing.headers.get('content-type'), /application\/json/);
    const oldOrigin = process.env.PUBLIC_WEB_ORIGIN;
    process.env.PUBLIC_WEB_ORIGIN = 'https://private.example.test/secret-path';
    try {
      const prefixed = await (await fetch(`${origin}/c/escaped-${suffix}`)).text();
      assert.ok(prefixed.includes('src="/secret-path/assets/app.js"'));
      assert.ok(prefixed.includes('name="duit-base-path" content="/secret-path"'));
    } finally {
      if (oldOrigin === undefined) delete process.env.PUBLIC_WEB_ORIGIN;else process.env.PUBLIC_WEB_ORIGIN = oldOrigin;
    }
  });
  await t.test('invite-only signup accepts only an operator code or email-matched verified claim', async () => {
    const previous = process.env.PILOT_INVITE_CODE;
    process.env.PILOT_INVITE_CODE = 'private-test-invitation';
    try {
      assert.equal((await request('/auth/capabilities')).body.inviteRequired, true);
      const body = {
        email: `invite-${suffix}@example.test`,
        displayName: 'Invited user',
        password: 'correct-horse-battery-staple'
      };
      assert.equal((await request('/auth/signup', {
        method: 'POST',
        body
      })).status, 403);
      assert.equal((await request('/auth/signup', {
        method: 'POST',
        body: {
          ...body,
          inviteCode: 'wrong'
        }
      })).status, 403);
      const invited = await request('/auth/signup', {
        method: 'POST',
        body: {
          ...body,
          inviteCode: 'private-test-invitation'
        }
      });
      assert.equal(invited.status, 201);
      ids.push(invited.body.user.id);
      await request(`/cards/${card.id}/publish`, {
        method: 'POST',
        token: owner.accessToken
      });
      const claimEmail = `claim-new-${suffix}@example.test`;
      const share = (await request(`/cards/${card.id}/shares`, {
        method: 'POST',
        token: owner.accessToken,
        body: {
          channel: 'link',
          recipientDraft: {
            name: 'Verified invite',
            email: claimEmail
          }
        }
      })).body;
      await request(`/public/shares/${share.token}/claim/start`, {
        method: 'POST',
        body: {
          email: claimEmail
        }
      });
      const outbox = (await request('/admin/outbox', {
        token: operator.accessToken
      })).body.messages.find(m => m.recipient === claimEmail);
      const proof = (await request(`/public/shares/${share.token}/claim/verify`, {
        method: 'POST',
        body: {
          verificationToken: outbox.payload.verificationToken
        }
      })).body;
      assert.equal((await request('/auth/signup', {
        method: 'POST',
        body: {
          ...body,
          email: `wrong-claim-${suffix}@example.test`,
          claimToken: proof.claimToken
        }
      })).status, 403);
      const claimed = await request('/auth/signup', {
        method: 'POST',
        body: {
          ...body,
          email: claimEmail,
          claimToken: proof.claimToken
        }
      });
      assert.equal(claimed.status, 201);
      ids.push(claimed.body.user.id);
      assert.equal(claimed.body.user.verifiedAt, null, 'Signup alone must not silently accept the claim');
    } finally {
      if (previous === undefined) delete process.env.PILOT_INVITE_CODE;else process.env.PILOT_INVITE_CODE = previous;
    }
  });
  await t.test('admin inventory searches and aggregates distinguish fictional data', async () => {
    const before = (await request('/admin/overview?dataOrigin=fictional_demo', {
      token: operator.accessToken
    })).body.stats.encounters;
    await query("UPDATE users SET data_origin='fictional_demo' WHERE id=$1", [owner.user.id]);
    const inventory = await request('/admin/cards?search=Northstar', {
      token: operator.accessToken
    });
    assert.ok(inventory.body.cards.some(c => c.id === card.id));
    assert.ok('imageUrl' in inventory.body.cards[0]);
    const overview = await request('/admin/overview?dataOrigin=fictional_demo', {
      token: operator.accessToken
    });
    assert.equal(overview.body.sourceFilter, 'fictional_demo');
    assert.ok(overview.body.dataOrigins.some(o => o.dataOrigin === 'fictional_demo' && o.encounters >= 1));
    assert.equal(overview.body.stats.encounters, before + 1);
  });
  await t.test('refresh rotates and logout revokes server-side sessions', async () => {
    const refreshed = await request('/auth/refresh', {
      method: 'POST',
      body: {
        refreshToken: owner.refreshToken
      }
    });
    assert.equal(refreshed.status, 200);
    assert.notEqual(refreshed.body.refreshToken, owner.refreshToken);
    assert.equal((await request('/me', {
      token: owner.accessToken
    })).status, 401);
    assert.equal((await request('/auth/refresh', {
      method: 'POST',
      body: {
        refreshToken: owner.refreshToken
      }
    })).status, 401);
    assert.equal((await request('/auth/logout', {
      method: 'POST',
      token: refreshed.body.accessToken
    })).status, 204);
    assert.equal((await request('/me', {
      token: refreshed.body.accessToken
    })).status, 401);
  });
});
