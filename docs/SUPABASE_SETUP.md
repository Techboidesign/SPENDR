# Supabase setup for SPENDR

## Security

| Secret | Where it goes | Never put in |
|--------|---------------|--------------|
| **Anon / publishable key** | `.env.local`, Netlify env | — (browser-safe) |
| **Service role key** | Supabase Edge Functions only | Frontend, Git |
| **`sbp_` personal access token** | Local CLI only (`supabase login`) | Frontend, Git, Netlify |

Rotate any token that was shared in chat or committed by mistake.

## 1. Apply database schema

**Option A — Dashboard:** Supabase → SQL Editor → paste and run  
`supabase/migrations/20250519000000_initial_schema.sql`

**Option B — CLI:**

```bash
supabase login          # uses sbp_ token locally, not in repo
supabase link --project-ref njodyldzvtaberaadwjd
supabase db push
```

## 2. Auth URL configuration

Supabase → **Authentication → URL Configuration**

| Setting | Value |
|---------|--------|
| Site URL | `https://spendr-finance.netlify.app` |
| Redirect URLs | `https://spendr-finance.netlify.app/**`, `http://localhost:5173/**` |

Enable **Email** provider. For local dev you may disable “Confirm email” until you test signup.

## 3. Environment variables

**Local:** copy `.env.example` → `.env.local` and set `VITE_SUPABASE_ANON_KEY` from  
Dashboard → **Project Settings → API** (anon public key).

**Netlify:** Site settings → Environment variables — same `VITE_*` names, then redeploy.

## 4. Verify

1. Sign up on https://spendr-finance.netlify.app  
2. Complete onboarding → data in `profiles`, `expenses`, etc.  
3. Log out / log in on another browser — data should sync  

## 5. Optional: Google / Apple OAuth

Authentication → Providers → enable and add OAuth redirect URLs matching Netlify + localhost.
