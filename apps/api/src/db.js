import pg from 'pg';
const {
  Pool
} = pg;
export const databaseUrl = process.env.DATABASE_URL || 'postgresql://duit@localhost:5432/duit_2026_pilot';
const databaseName = new URL(databaseUrl).pathname.slice(1);
if (!['duit_2026_pilot', 'duit_2026_pilot_test'].includes(databaseName) && process.env.DUIT_ALLOW_CUSTOM_DATABASE !== 'true') throw new Error('Refusing to modify a non-pilot database. Use duit_2026_pilot or explicitly authorize a separate database with DUIT_ALLOW_CUSTOM_DATABASE=true.');
export const pool = new Pool({
  connectionString: databaseUrl,
  max: 12
});
export const query = (text, params) => pool.query(text, params);
export async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
export async function migrate() {
  await transaction(async db => {
    await db.query('SELECT pg_advisory_xact_lock(26091801)');
    await db.query('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
    if (!(await db.query("SELECT 1 FROM schema_migrations WHERE version='2026-private-pilot-v1'")).rowCount) await db.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL, display_name TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended')),
        verified_at TIMESTAMPTZ, onboarding_completed BOOLEAN NOT NULL DEFAULT false,
        profile JSONB NOT NULL DEFAULT '{}', data_origin TEXT NOT NULL DEFAULT 'user_created',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE auth_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        refresh_hash TEXT UNIQUE NOT NULL, expires_at TIMESTAMPTZ NOT NULL, revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(), last_used_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE cards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, subtitle TEXT NOT NULL DEFAULT '',
        image_url TEXT, cover_url TEXT, company TEXT NOT NULL DEFAULT '', role TEXT NOT NULL DEFAULT '', bio TEXT NOT NULL DEFAULT '',
        theme JSONB NOT NULL DEFAULT '{}', contact JSONB NOT NULL DEFAULT '{}', links JSONB NOT NULL DEFAULT '[]',
        cta_type TEXT NOT NULL DEFAULT 'enquire', cta_label TEXT NOT NULL DEFAULT 'Get in touch', cta_url TEXT,
        is_published BOOLEAN NOT NULL DEFAULT false, published_at TIMESTAMPTZ, published_version_id UUID,
        data_origin TEXT NOT NULL DEFAULT 'user_created', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE pitch_panels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
        panel_type TEXT NOT NULL CHECK(panel_type IN ('hook','relevance','offer','outcome','proof','cta')),
        body TEXT NOT NULL, position SMALLINT NOT NULL CHECK(position BETWEEN 0 AND 5),
        provenance TEXT NOT NULL DEFAULT 'owner' CHECK(provenance IN ('owner','ai_suggested','approved_ai')),
        approved BOOLEAN NOT NULL DEFAULT false, UNIQUE(card_id,panel_type), UNIQUE(card_id,position)
      );
      CREATE TABLE card_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
        snapshot JSONB NOT NULL, published_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE card_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL CHECK(event_type IN ('viewed','cta_opened','contact_saved','lead_submitted')),
        source TEXT, visitor_hash TEXT, event_key TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(card_id,event_key)
      );
      CREATE TABLE leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
        name TEXT NOT NULL, email TEXT, phone TEXT, intent TEXT, consent BOOLEAN NOT NULL, source TEXT, cta_context TEXT,
        status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','responded','qualified','closed')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE people (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL, role TEXT NOT NULL DEFAULT '', company TEXT NOT NULL DEFAULT '', email TEXT, phone TEXT, photo_url TEXT,
        tags TEXT[] NOT NULL DEFAULT '{}', category TEXT NOT NULL DEFAULT 'connection', stage TEXT NOT NULL DEFAULT 'new',
        city TEXT NOT NULL DEFAULT '', country_code TEXT NOT NULL DEFAULT '', bio TEXT NOT NULL DEFAULT '', website TEXT,
        source_card_id UUID REFERENCES cards(id) ON DELETE SET NULL, client_id TEXT, data_origin TEXT NOT NULL DEFAULT 'user_created',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(owner_id,source_card_id), UNIQUE(owner_id,client_id)
      );
      CREATE TABLE events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL, venue TEXT NOT NULL DEFAULT '', city TEXT NOT NULL DEFAULT '', country_code TEXT NOT NULL DEFAULT '',
        latitude DOUBLE PRECISION CHECK(latitude BETWEEN -90 AND 90), longitude DOUBLE PRECISION CHECK(longitude BETWEEN -180 AND 180),
        starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, description TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE encounters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        location TEXT, city TEXT NOT NULL DEFAULT '', country_code TEXT NOT NULL DEFAULT '', latitude DOUBLE PRECISION CHECK(latitude BETWEEN -90 AND 90), longitude DOUBLE PRECISION CHECK(longitude BETWEEN -180 AND 180),
        event_id UUID REFERENCES events(id) ON DELETE SET NULL, event_name TEXT,
        meeting_type TEXT NOT NULL DEFAULT 'Conference', exchange_type TEXT NOT NULL DEFAULT 'Both exchanged cards',
        original_note TEXT NOT NULL DEFAULT '', recap TEXT, relevance TEXT, proposed_follow_up TEXT,
        client_id TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(owner_id,client_id)
      );
      CREATE TABLE commitments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
        person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE, owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL, due_at TIMESTAMPTZ, status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','done','dismissed')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(), completed_at TIMESTAMPTZ
      );
      CREATE TABLE need_offers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        kind TEXT NOT NULL CHECK(kind IN ('need','offer')), text TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE share_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE, token_hash TEXT UNIQUE NOT NULL, channel TEXT NOT NULL,
        recipient_draft JSONB, recipient_email TEXT, expires_at TIMESTAMPTZ NOT NULL, revoked_at TIMESTAMPTZ,
        claimed_by UUID REFERENCES users(id), claimed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE verification_challenges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), share_id UUID REFERENCES share_links(id) ON DELETE CASCADE,
        email TEXT NOT NULL, token_hash TEXT UNIQUE NOT NULL, expires_at TIMESTAMPTZ NOT NULL, consumed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE claim_proofs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), share_id UUID NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,
        email TEXT NOT NULL, token_hash TEXT UNIQUE NOT NULL, expires_at TIMESTAMPTZ NOT NULL, consumed_at TIMESTAMPTZ
      );
      CREATE TABLE local_outbox (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), recipient TEXT NOT NULL, subject TEXT NOT NULL, payload JSONB NOT NULL,
        delivery TEXT NOT NULL DEFAULT 'local_outbox', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE media_assets (
        id UUID PRIMARY KEY, owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, filename TEXT NOT NULL,
        mime_type TEXT NOT NULL, size_bytes INTEGER NOT NULL, storage_path TEXT NOT NULL, sha256 TEXT NOT NULL, purpose TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE ai_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'queued', input JSONB NOT NULL, media_ids UUID[] NOT NULL DEFAULT '{}',
        result JSONB, error TEXT, provider TEXT, model TEXT, reserved_usd NUMERIC(12,6) NOT NULL DEFAULT 0,
        cost_usd NUMERIC(12,6) NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), completed_at TIMESTAMPTZ
      );
      CREATE TABLE ai_budgets (id TEXT PRIMARY KEY, limit_usd NUMERIC(12,6) NOT NULL DEFAULT 0, spent_usd NUMERIC(12,6) NOT NULL DEFAULT 0, reserved_usd NUMERIC(12,6) NOT NULL DEFAULT 0);
      INSERT INTO ai_budgets(id) VALUES('pilot');
      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL, target_type TEXT, target_id TEXT, details JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE archive_profiles (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, country_code TEXT, company TEXT, role TEXT, profile JSONB NOT NULL,
        imported_at TIMESTAMPTZ NOT NULL DEFAULT now(), source TEXT NOT NULL DEFAULT 'legacy_private'
      );
      CREATE INDEX people_owner_idx ON people(owner_id,updated_at DESC);
      CREATE INDEX encounters_owner_idx ON encounters(owner_id,occurred_at DESC);
      CREATE INDEX encounters_person_idx ON encounters(person_id,occurred_at DESC);
      CREATE INDEX commitments_owner_idx ON commitments(owner_id,status,due_at);
      CREATE INDEX cards_owner_idx ON cards(owner_id);
      CREATE INDEX card_events_date_idx ON card_events(card_id,created_at DESC);
      CREATE INDEX auth_sessions_user_idx ON auth_sessions(user_id);
      INSERT INTO schema_migrations(version) VALUES('2026-private-pilot-v1');
    `);
    if (!(await db.query("SELECT 1 FROM schema_migrations WHERE version='2026-private-pilot-v2'")).rowCount) {
      await db.query('ALTER TABLE people ADD COLUMN IF NOT EXISTS business_card_url TEXT, ADD COLUMN IF NOT EXISTS business_card_back_url TEXT');
      await db.query("INSERT INTO schema_migrations(version) VALUES('2026-private-pilot-v2')");
    }
    if (!(await db.query("SELECT 1 FROM schema_migrations WHERE version='2026-card-first-v3'")).rowCount) {
      await db.query('ALTER TABLE cards ADD COLUMN IF NOT EXISTS business_card_url TEXT');
      await db.query("INSERT INTO schema_migrations(version) VALUES('2026-card-first-v3')");
    }
  });
}
