# Phase 2 — Follow Graph

**Status:** Draft spec
**Scope:** Asymmetric follow relationships between users (Twitter/Strava model).
**Risk profile:** Medium. Introduces relationships between users for the first time.

---

## What ships in Phase 2

1. The ability to follow another engineer from their public profile page
2. Follow requests for private profiles (must be approved by the recipient)
3. Follower / following counts on profile pages
4. A "Follow requests" view in settings for accepting / declining pending requests
5. Unfollow functionality
6. The whole system gated behind the `social_follow` feature flag

## What does NOT ship in Phase 2

- No followers / following list pages (link to "12 followers" doesn't open a list — just shows the count). Defer to a later slice if there's demand.
- No block functionality. Follow can be blocked indirectly by setting profile to private and declining requests.
- No notifications of any kind.
- No feed (that's Phase 3).
- No suggested follows / discoverability.

---

## User stories

### As an engineer viewing someone else's public profile
- I see their follower and following counts
- I see a "Follow" button
- Clicking Follow:
  - For a public profile: I become a follower instantly
  - For a private profile: my request goes pending until they approve
- After following, the button changes to "Following" (with a hover state of "Unfollow")

### As an engineer with a private profile
- I see "Follow requests" in settings when I have pending requests
- I can accept or decline each request
- Approved requests turn into active follows
- Declined requests are deleted (the requester is not notified)

### As an engineer viewing my own profile
- I see my own follower and following counts
- The follow button is replaced with "Edit profile" or nothing

---

## Data model

### `follows` table

| Column | Type | Notes |
|---|---|---|
| `follower_id` | uuid | FK to `auth.users` ON DELETE CASCADE |
| `followed_id` | uuid | FK to `auth.users` ON DELETE CASCADE |
| `status` | text | `pending` or `active` |
| `created_at` | timestamptz | When the row was created (request sent) |
| `accepted_at` | timestamptz nullable | When status moved to `active` |
| PRIMARY KEY | (follower_id, followed_id) | One row per directed pair |
| CHECK | follower_id != followed_id | Cannot follow yourself |

### Status semantics

- `pending` — follow request awaiting approval (only for private profiles)
- `active` — the follow is in effect

For public profiles, follows are created with `status='active'` immediately. For private profiles, follows are created with `status='pending'`. When the followed user approves, status moves to `active` and `accepted_at` is set.

### Counts

Follower / following counts are computed via SQL functions (security definer) so they can read across RLS without leaking individual rows:

- `get_follower_count(handle)` — count of `follows` rows where `followed_id = (handle's user_id)` and `status = 'active'`
- `get_following_count(handle)` — count of `follows` rows where `follower_id = (handle's user_id)` and `status = 'active'`
- `get_follow_state(target_user_id)` — for the current user: returns `'none'`, `'pending'`, or `'active'` indicating their relationship to the target user

### RLS policies on `follows`

- **SELECT**: a user can read rows where they are the follower OR the followed (so they can see their own followers and following)
- **INSERT**: a user can insert rows where `follower_id = auth.uid()`
- **UPDATE**: only the followed user can update their incoming pending requests (to set status='active' or to delete)
- **DELETE**: a user can delete rows where they are the follower (unfollow) OR the followed (decline / remove follower)

### Audit logging

All follow events go to `privacy_audit_log` with `event_category = 'social'`:
- `follow_requested` — pending row created
- `follow_accepted` — request approved
- `follow_declined` — request declined
- `unfollowed` — row deleted by the follower
- `follower_removed` — row deleted by the followed user

---

## API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/follow` | POST | Body: `{ targetHandle }`. Creates a follow row, status determined by target's privacy. |
| `/api/follow` | DELETE | Body: `{ targetHandle }`. Deletes the row where the current user is the follower. |
| `/api/follow/request/accept` | POST | Body: `{ followerHandle }`. Sets a pending row to active. |
| `/api/follow/request/decline` | POST | Body: `{ followerHandle }`. Deletes a pending row. |
| `/api/follow/remove-follower` | POST | Body: `{ followerHandle }`. Deletes an active row where the current user is the followed. |

All routes:
- Require authentication
- Gated on `social_follow` feature flag (per-user, soft launch capable)
- Log to privacy audit log

---

## Pages

### Profile page (`/u/[handle]`) — additions

- Follower count (e.g. "12 followers")
- Following count (e.g. "Following 4")
- Follow button (or "Following" / "Requested" depending on state)
- For your own profile: button is hidden / replaced with "Edit profile" link

### Settings — additions

- Follow requests section (only when `social_follow` is enabled and there are pending requests)
- List of pending requests with Accept / Decline buttons
- Each request shows: requester display name, handle, link to their profile

---

## Tests required

- Cannot follow yourself (CHECK constraint)
- Cannot create duplicate follow rows (PK constraint)
- Cascade delete: deleting a user removes all their follows (both directions)
- Following a public profile creates `status='active'`
- Following a private profile creates `status='pending'`
- Accepting a pending request sets `status='active'` and `accepted_at`
- Declining a pending request deletes the row
- Unfollowing deletes the row
- Removing a follower deletes the row
- Counts return the correct numbers
- Counts only include `active` rows (not pending)

---

## Definition of done

- [ ] Migration applied with all RLS policies and helper functions
- [ ] All tests passing
- [ ] API routes built and tested
- [ ] Profile page shows counts and follow button
- [ ] Follow requests page works for accepting/declining
- [ ] DPIA reviewed for Phase 2 risks
- [ ] Privacy policy updated with Phase 2 changes (already drafted in `privacy-policy-updates.md`)
- [ ] Feature flag in place (already exists: `social_follow`)
- [ ] Soft launch group can use the feature
