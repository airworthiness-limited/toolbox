# Phase 1 — Public Profile Page

**Status:** Draft spec
**Scope:** A public profile page for AML holders. Type rating trophy case as the centrepiece. No feed, no follows, no posts, no photos.
**Risk profile:** Low. The user's own data, displayed only with explicit opt-in consent.

---

## What ships in Phase 1

1. A new "Social" section in `/settings` with a single opt-in toggle: "Make my profile public"
2. A public profile page at `/u/[handle]` displaying the user's professional credentials
3. The ability for the user to set a unique handle (like a username)
4. The ability for any visitor (logged in or not) to view a public profile
5. The ability for the user to switch back to private at any time, with immediate effect

## What does NOT ship in Phase 1

- No follow / unfollow
- No feed
- No posts
- No photos beyond the existing licence photo (which stays private)
- No comments, kudos, reactions, or any social interaction
- No discoverability (no search, no directory) — profiles are accessed by URL only
- No employer-tier accounts
- No "available for work" indicator
- No notifications
- No backfill of existing data

This is deliberate. Phase 1 validates the smallest possible surface area before adding anything social.

---

## User stories

### As an engineer signing up for the first time
- I do not see anything social by default
- The core app works as it always has
- If I want to opt in, I find it in settings under "Social"
- I am shown a clear explanation of what enabling this means before I tick the box

### As an existing engineer
- My profile is private by default after the Phase 1 launch
- I am notified by an in-app banner that the social feature exists and is opt-in
- I can ignore it and use the app as before
- If I opt in, I am shown the same explanation as a new user

### As an engineer with a public profile
- I can choose a unique handle (e.g. `alex-king`) to use in my profile URL
- I can share the URL on a CV, on LinkedIn, in an email signature
- The URL is stable — changing my handle is not destructive
- I can revert to private at any time, and the page immediately returns 404 to non-owners

### As a visitor (logged in or not)
- I can view a public profile via its URL
- I see the engineer's credentials, type ratings, and basic professional information
- I cannot see anything not on the public profile (logbook, exam progress, employment history)
- If the profile is private or does not exist, I see a generic 404

---

## What the public profile shows

All fields are sourced from data the user has already entered into Airworthiness. Nothing is requested anew for the profile.

### Header section

- **Display name** — first name and last name (or just first name, user's choice)
- **Handle** — `@alex-king`, used in the URL
- **Profile photo** — optional, separate from the licence photo, uploaded specifically for the public profile (defaults to initials)
- **Employment status label** — "Permanent" or "Contractor" (optional, user can hide)

### Trophy case — type ratings

- All endorsed type ratings, grouped by licence category
- Each rating shown as a chip/pill, with the rating code (e.g. `A320 (CFM)`)
- Date of first endorsement (optional, user can hide)

### Licence categories

- The licence categories the engineer holds, e.g. `B1.1`, `B2`
- No licence number shown

### Optional sections (each can be toggled on/off by the user)

- **Years in industry** — derived from earliest employment period
- **Apprenticeship completion** — derived from training records
- **Continuation training currency** — a single line: "All current" or "Some expired" (no dates, no specifics)

### What is NEVER shown on the public profile

- Licence number
- Date of birth
- Employer name
- Customer / operator names
- Logbook entries
- Module exam scores (Phase 3 may add milestone posts for passes, but the score is never shown)
- Email address
- Phone number
- Address
- Licence photo (front or back)
- Any data the user has not explicitly enabled

---

## The opt-in flow

1. User goes to `/settings` and sees a new section: **Social**
2. The section contains a single toggle: **Make my profile public**
3. Toggling it on opens a modal with the following content:
   > ## Make your profile public
   >
   > Your public profile will show your name, type ratings, licence categories, and any optional fields you choose to enable. It will be viewable by anyone with the link.
   >
   > **What is shared:** name, type ratings, licence categories, and any optional sections you turn on.
   >
   > **What is never shared:** licence number, date of birth, employer, logbook entries, exam results, contact details.
   >
   > You can switch your profile back to private at any time. Doing so will immediately make the page return a 404.
   >
   > [ ] I understand and consent to my profile being publicly visible.
   >
   > [Cancel] [Make profile public]
4. The checkbox must be explicitly ticked before the "Make profile public" button is enabled
5. On confirm, the user is taken to a handle-selection screen
6. After choosing a handle, they land on their own profile page
7. The opt-in event is logged to an audit table with timestamp and user id

## The opt-out flow

1. User goes to `/settings` → Social → toggle off
2. A confirmation dialog: "Make profile private? Your public profile page will no longer be accessible. You can re-enable this at any time."
3. On confirm:
   - The `is_public` flag is set to `false`
   - The page immediately returns 404 to non-owners
   - The handle is reserved for the user (they can re-enable later with the same handle)
4. The opt-out event is logged

---

## Data model

### New table: `public_profiles`

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid PK | FK to `auth.users` ON DELETE CASCADE |
| `handle` | text UNIQUE | URL-safe, lowercase, 3-30 chars, regex `^[a-z0-9-]+$` |
| `is_public` | boolean | Default false |
| `display_name` | text | Defaults to full name from profiles |
| `display_name_first_only` | boolean | If true, only show first name |
| `avatar_path` | text nullable | Path to avatar in Supabase Storage |
| `show_employment_status` | boolean | Default false |
| `show_years_in_industry` | boolean | Default false |
| `show_apprenticeship` | boolean | Default false |
| `show_continuation_training_status` | boolean | Default false |
| `show_first_endorsement_dates` | boolean | Default false |
| `created_at` | timestamptz | When the user first opted in |
| `updated_at` | timestamptz | Last edit |

### New table: `profile_audit_log`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | FK to `auth.users` ON DELETE CASCADE |
| `event` | text | `opt_in`, `opt_out`, `handle_change`, `visibility_change` |
| `metadata` | jsonb | Event-specific details (no PII) |
| `created_at` | timestamptz | |

### Row Level Security policies

`public_profiles`:
- **SELECT** — anyone (even unauthenticated) can read rows where `is_public = true`. The user can read their own row regardless.
- **INSERT** — only the authenticated user can insert their own row
- **UPDATE** — only the authenticated user can update their own row
- **DELETE** — handled by cascade from `auth.users`

`profile_audit_log`:
- **SELECT** — only the user can read their own audit entries; no public access
- **INSERT** — server-side only via service role; users cannot insert directly
- **UPDATE / DELETE** — never allowed; immutable log

### Storage

- Avatars stored in Supabase Storage bucket `public-profile-avatars`
- Bucket is public-read but write-restricted to authenticated users uploading to a path under their own user id
- EXIF stripped on upload (server-side, in the upload route, using `sharp`)
- Max file size 2 MB; only `image/jpeg`, `image/png`, `image/webp`

---

## Routes

### Pages

| Route | Purpose | Auth |
|---|---|---|
| `/settings` (existing) | Add a Social section with the opt-in toggle | Logged in |
| `/u/[handle]` | Public profile page | Anyone (RLS enforces visibility) |
| `/settings/handle` | First-time handle selection after opt-in | Logged in |

### API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/profile/public/opt-in` | POST | Set `is_public = true`, take consent confirmation, log to audit |
| `/api/profile/public/opt-out` | POST | Set `is_public = false`, log to audit |
| `/api/profile/public/handle` | POST | Validate and set a new handle (uniqueness, regex) |
| `/api/profile/public/avatar` | POST | Upload avatar; strip EXIF; validate type/size |
| `/api/profile/public/visibility` | POST | Toggle individual optional sections |

All API routes verify the requesting user matches the row being modified.

---

## Tests required before Phase 1 ships

### Negative-path RLS tests

Each test creates two users (A and B) and verifies the policy holds.

- [ ] Anonymous user cannot read a private profile
- [ ] Anonymous user can read a public profile
- [ ] Logged-in user A cannot read user B's private profile
- [ ] Logged-in user A can read user B's public profile
- [ ] User A cannot update user B's `public_profiles` row
- [ ] User A cannot insert a `public_profiles` row for user B
- [ ] User A cannot read user B's audit log
- [ ] User A cannot insert into the audit log directly (must go via service role)

### Lifecycle tests

- [ ] Opting in creates a row with `is_public = false` initially, then `true` after consent
- [ ] Opting out sets `is_public = false`
- [ ] Opting out twice does not error
- [ ] Deleting a user cascades all `public_profiles` and `profile_audit_log` rows
- [ ] Deleting a user removes their avatar from storage
- [ ] Handle uniqueness is enforced
- [ ] Handle regex is enforced (no spaces, no uppercase, no special chars beyond `-`)
- [ ] Handle changes are logged
- [ ] After opt-out, the public URL returns 404 to non-owners and the owner

### Data leak prevention tests

- [ ] Public profile API does not return any field not in the public spec
- [ ] No licence number, no date of birth, no employer, no email in the API response
- [ ] No edge caching headers on the profile page (`cache-control: private, no-store` for owner view; `public, s-maxage=60` is acceptable for fully-public profile pages)

### EXIF stripping test

- [ ] Upload a photo with GPS metadata; verify the stored file has no GPS metadata

---

## What "high polish" looks like for Phase 1

- A single page, designed once, designed well
- Loads instantly (server-rendered, minimal JS)
- The trophy case is visually striking — type ratings are the hero
- The opt-in flow is calm and explicit, never pressured
- The default is private; opting in is a deliberate two-step process
- The settings page has a clear explanation of what is shared and what is not
- The 404 page for private/missing profiles is a generic 404 — no information leakage about whether the user exists
- The page works on mobile, tablet, and desktop
- The page is shareable: meta tags for OpenGraph and Twitter cards (with the user's permission, since this is what makes a profile useful as a CV link)

---

## Definition of done for Phase 1

- [ ] DPIA reviewed and signed off
- [ ] Privacy policy updated with the new processing
- [ ] In-app notification drafted to inform existing users
- [ ] Migration written and tested for the new tables
- [ ] RLS policies written and tested
- [ ] All negative-path tests passing
- [ ] Lifecycle tests passing
- [ ] Account deletion test passing (full cascade)
- [ ] EXIF stripping test passing
- [ ] Feature flag in place
- [ ] Kill switch tested
- [ ] Soft launch group briefed
- [ ] Incident response plan reviewed
- [ ] Privacy policy live and acknowledged by the user before they can opt in

Only when every box is ticked does Phase 1 ship.

---

## Estimated build, in vertical slices

1. **Database** — migration, RLS policies, tests (1 slice, ships and merges first)
2. **Settings UI** — opt-in toggle, modal, audit logging (1 slice)
3. **Handle selection** — page, validation, uniqueness (1 slice)
4. **Profile page** — server-rendered, type rating trophy case, optional sections (1 slice)
5. **Avatar upload** — storage, EXIF stripping, replacement (1 slice)
6. **404 handling and meta tags** — polish (1 slice)
7. **Privacy policy update and in-app notification** — content, banner (1 slice)
8. **Soft launch** — feature flag scoped to a list of users (1 slice)

Each slice is its own PR, reviewed for privacy, tested in isolation, merged before the next begins.
