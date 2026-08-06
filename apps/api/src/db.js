import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://duit@localhost:5432/2026_duit_cards",
});

export async function query(text, params) {
  return pool.query(text, params);
}

export async function migrate() {
  await query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      onboarding_profile JSONB,
      onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS cards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      image_url TEXT,
      contact JSONB NOT NULL DEFAULT '{}'::jsonb,
      links JSONB NOT NULL DEFAULT '[]'::jsonb,
      cta_type TEXT NOT NULL DEFAULT 'enquire',
      cta_label TEXT NOT NULL DEFAULT 'Get in touch',
      is_published BOOLEAN NOT NULL DEFAULT FALSE,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS pitch_panels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      panel_type TEXT NOT NULL CHECK (panel_type IN ('hook','relevance','offer','outcome','proof','cta')),
      body TEXT NOT NULL,
      position SMALLINT NOT NULL,
      provenance TEXT NOT NULL DEFAULT 'owner' CHECK (provenance IN ('owner','ai_suggested','approved_ai')),
      approved BOOLEAN NOT NULL DEFAULT FALSE,
      UNIQUE(card_id, panel_type),
      UNIQUE(card_id, position)
    );
    CREATE TABLE IF NOT EXISTS card_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL CHECK (event_type IN ('viewed','cta_opened','lead_submitted')),
      source TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      name TEXT,
      email TEXT,
      phone TEXT,
      intent TEXT,
      consent BOOLEAN NOT NULL,
      source TEXT,
      cta_context TEXT,
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','responded','qualified','closed')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS people (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      email TEXT,
      phone TEXT,
      photo_url TEXT,
      tags TEXT[] NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS people_owner_search_idx ON people(owner_id, name, company);
    CREATE TABLE IF NOT EXISTS encounters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      location TEXT,
      event_name TEXT,
      meeting_type TEXT NOT NULL DEFAULT 'Conference',
      exchange_type TEXT NOT NULL DEFAULT 'Both exchanged cards',
      original_note TEXT NOT NULL DEFAULT '',
      recap TEXT,
      relevance TEXT,
      proposed_follow_up TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS commitments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
      person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      due_at TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','done','dismissed')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS need_offers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('need','offer')),
      text TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}
