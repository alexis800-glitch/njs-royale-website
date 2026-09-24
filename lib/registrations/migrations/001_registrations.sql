-- NJS Royale — registration storage (First Look and Founding Guest).
--
-- Run once against the project's Postgres (Neon) database. Safe to re-run.
--
-- Note on content: this table holds personal data. Access is server-side only,
-- through the pooled connection string held in Vercel as a secret. The guest's IP
-- address is stored as a salted hash, never in the clear, and only so that rate
-- limiting works across serverless instances.

create extension if not exists "pgcrypto";

create table if not exists registrations (
  id                 uuid primary key default gen_random_uuid(),

  -- Which invitation the guest registered against.
  kind               text        not null check (kind in ('first-look', 'founding-guest')),

  -- Client-generated, one per form instance. Makes a double-click or a retry
  -- land on the same row instead of creating a second registration.
  submission_id      uuid        not null unique,

  invitation_code    text        not null,
  full_name          text        not null,
  -- Normalised: trimmed and lowercased.
  email              text        not null,
  -- Normalised: digits including the country code.
  phone              text        not null,
  -- As the guest typed it, for calling them back.
  phone_display      text        not null,

  companion_name     text,
  attending          boolean,
  party_size         smallint,
  arrival_window     text,
  arrival_notes      text,

  marketing_opt_in   boolean     not null default false,
  policy_ack         boolean     not null default false,
  conditions_ack     boolean     not null default false,

  -- The marketing-cookie choice in force when this registration was made. Kept as
  -- the record of why a Conversions API event was or was not sent.
  consent_marketing  boolean     not null default false,
  consent_version    smallint,
  consent_decided_at timestamptz,

  source_path        text        not null,
  ip_hash            text,
  user_agent         text,

  -- Shared by the browser Pixel event and the Conversions API event, so Meta
  -- deduplicates them. Recorded for auditing, never sent anywhere else.
  meta_event_id      uuid        not null,
  meta_status        text,

  created_at         timestamptz not null default now()
);

create index if not exists registrations_created_at_idx on registrations (created_at desc);
create index if not exists registrations_rate_limit_idx on registrations (ip_hash, created_at desc);
create index if not exists registrations_kind_email_idx on registrations (kind, email);
