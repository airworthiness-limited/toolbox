# Data Protection Impact Assessment — Social Feature

**Version:** 0.1 (draft)
**Status:** Pre-implementation
**Owner:** Alex King, Airworthiness Limited
**Date:** 2026-04-07
**Review cadence:** Before each phase launch, then annually

---

## 1. Why this DPIA exists

GDPR Article 35 requires a DPIA for processing that is "likely to result in a high risk to the rights and freedoms of natural persons." This applies here because:

- We are introducing a **new purpose** (social sharing) for personal data already collected for a different purpose (regulatory tracking)
- The data being shared includes **professional and identity information** of regulated individuals
- The platform users are members of a **small, identifiable industry community** where reputational damage from a leak is hard to recover from
- The feature involves **uploading photos** that may contain unintended personal data of third parties
- We process data of UK Aircraft Maintenance Licence holders, including potentially data revealing professional history

This DPIA must be reviewed and signed off before each phase of the rollout. It is a living document, not a one-off exercise.

---

## 2. The processing being assessed

### 2.1 Scope

This DPIA covers the Airworthiness "social feature" — a phased introduction of public profiles, follower relationships, and a feed of professional milestones and shared work activity, intended for UK Aircraft Maintenance Licence (AML) holders.

### 2.2 Phases covered

- **Phase 1** — Public profile pages (type ratings, name, employment status label)
- **Phase 2** — Follow graph (asymmetric Twitter-style)
- **Phase 3** — Auto-generated milestone feed posts
- **Phase 4** — User-initiated task share posts with optional photos and 140-char notes

Each phase has its own risk profile and is assessed separately in section 6.

### 2.3 Data categories processed

| Category | Examples | Source |
|---|---|---|
| Identity | First name, last name, profile photo (optional) | User input |
| Professional | Licence categories, type ratings, training records, exam results | User input + verified records |
| Activity | Logbook entries marked as shareable | User input |
| Network | Follower/following relationships | User action |
| Behavioural | Posts viewed, kudos given (Phase 3+) | System telemetry |
| Photographic | Optional photos attached to task share posts (Phase 4) | User upload |

### 2.4 Lawful basis

**Consent (Article 6(1)(a))** is the lawful basis for the social feature. It is opt-in, granular, and revocable.

We do not rely on legitimate interest because:
- The processing is not necessary for the core purpose of the platform (which is regulatory tracking)
- The reasonable expectation of an existing user is that their data is private to them
- Adding a social purpose substantively changes the nature of the processing

Consent must be:
- **Freely given** — the core app must work fully without enabling social features
- **Specific** — separate consent for each phase (profile, follow, feed, photos)
- **Informed** — privacy policy and consent screens explain exactly what data is shared and with whom
- **Unambiguous** — opt-in checkbox or toggle, never pre-ticked
- **Withdrawable** — users can revoke at any time, and revocation must take effect immediately

### 2.5 Data subjects

- Primary: UK AML holders who voluntarily opt in to social features
- Secondary: Other engineers who appear incidentally in user-uploaded photos (a third-party data risk addressed in section 6)

### 2.6 Data flows

1. User opts in to a social feature tier via the settings page
2. User-controlled data is exposed via Row Level Security policies in Postgres
3. Other users in the requester's network can read that data via RLS-gated API endpoints
4. Photos are stored in Supabase Storage with EXIF stripped on upload and served via short-lived signed URLs
5. No data leaves the EU (Supabase project region: eu-west-2)
6. No third-party processors beyond Supabase and Vercel (already covered in core privacy policy)

---

## 3. Necessity and proportionality

### 3.1 Is the processing necessary?

The social feature is **not necessary** for the core regulatory tracking purpose. It is an additional feature that users may choose to enable.

This is why:
- Consent is the lawful basis
- The core app must work fully without it
- Users can disable it at any time without losing core functionality
- Existing users will not be auto-enrolled

### 3.2 Is the processing proportionate?

We have minimised processing in the following ways:

- **Data minimisation by architecture.** Posts are auto-generated from existing structured data. We do not capture new personal data for the feed itself.
- **No operator data.** The platform deliberately does not capture operator names, customer names, or registrations in form fields. This protects both the user and their employer.
- **No prose.** Users cannot write paragraphs of personal opinion in posts, reducing the risk of incidental personal data of third parties being shared.
- **Phased rollout.** Each phase only processes the minimum data needed for that phase. Phase 1 has no posts, no photos, no follow graph.
- **Right to erasure built in.** Every social table cascades on user deletion. Tested in CI.
- **Opt-in granularity.** Users can enable a profile without enabling the feed. They can enable the feed without enabling photos. Each step is a separate consent.

### 3.3 What did we consider and reject?

| Considered | Rejected because |
|---|---|
| Auto-importing existing logbook entries to the feed on launch | GDPR breach — data was collected for a different purpose; cannot be repurposed without fresh consent |
| Profiling users by activity for ranking/recommendations | Out of scope; no algorithmic feed; chronological only |
| Comments on posts | Increases moderation burden, increases risk of personal data of third parties being shared, dilutes the technical tone |
| Storing photo metadata (EXIF) | Privacy risk; metadata stripped on upload |
| Long-lived signed URLs for photos | Risk of URL leaks; URLs expire in ≤15 minutes |
| Default-public profile for existing users | GDPR breach — would auto-enrol without consent |
| A "verified engineer" badge | Implies a level of vetting we are not performing |
| Crew tagging on logbook entries | Third-party data without explicit consent of the tagged engineer |

---

## 4. Consultation

The following stakeholders should be consulted before launch:

- **Trial users** — 10-20 trusted engineers in a closed soft launch before public release
- **Legal review** — privacy policy update reviewed by a solicitor (where budget allows)
- **Industry feedback** — informal review with at least one Part 145 organisation contact, to understand operator concerns

User input gathered during the soft launch must be documented and any material concerns addressed before the next phase ships.

---

## 5. Data subject rights — implementation requirements

GDPR rights and how they are implemented in the social feature:

| Right | Implementation |
|---|---|
| **Right to be informed** (Art 13/14) | Privacy policy updated and existing users prompted to read before any social feature is enabled |
| **Right of access** (Art 15) | Existing data export endpoint must include social data (posts, follows, profile state) |
| **Right to rectification** (Art 16) | Users can edit their profile fields directly. Posts are immutable but can be deleted. |
| **Right to erasure** (Art 17) | Account deletion cascades to all social tables via FK ON DELETE CASCADE. Tested in CI. |
| **Right to restrict processing** (Art 18) | Users can switch to private profile or disable the social feature entirely from settings. Effect is immediate. |
| **Right to data portability** (Art 20) | Existing data export endpoint extended to include social data in structured JSON. |
| **Right to object** (Art 21) | N/A — consent is the lawful basis; users withdraw consent rather than objecting. |
| **Rights related to automated decision-making** (Art 22) | N/A — no automated decisions are made. Feed is chronological. |

### Erasure — specific implementation

When a user deletes their account:
1. Their `auth.users` row is deleted
2. Cascade deletes all rows in: `profiles`, `posts`, `follows` (both directions), `post_photos`, any social tables added later
3. Photos in Supabase Storage are deleted via a database trigger or a queued cleanup job
4. The deletion is logged to a retention table for audit purposes (with no PII)
5. A test in CI verifies that creating an account, posting, then deleting leaves zero rows

---

## 6. Risk assessment

Each risk is rated for likelihood (L) and severity (S) on a 1-5 scale, with the residual risk after mitigations.

### Risk 1 — Photo reveals customer/operator data

**Description:** A user uploads a photo of their work. The photo includes a registration, livery, customer paperwork, or part numbers identifying the operator. The user's employer sees the photo and disciplines the user.

| | L | S | Score |
|---|---|---|---|
| Inherent | 4 | 4 | 16 |
| Residual | 3 | 4 | 12 |

**Mitigations:**
- EXIF stripped on upload
- Photos only available in Phase 4 (the most-tested phase)
- Default-public profile but feed is opt-in separately
- Soft launch with trusted users to surface tone issues before public release
- Privacy policy explicitly states photos are user-controlled and the user is responsible
- Users can delete their own posts at any time

**Accepted residual risk:** Yes. The user is treated as a professional adult capable of judging what to share. We do not police content.

### Risk 2 — Privacy setting bypass via SQL/API misuse

**Description:** A bug in Row Level Security policies, an API endpoint, or a client-side filter exposes private profile data, private posts, or follower lists to users who should not see them.

| | L | S | Score |
|---|---|---|---|
| Inherent | 3 | 5 | 15 |
| Residual | 1 | 5 | 5 |

**Mitigations:**
- RLS policies written and tested before any UI code
- Negative-path tests in CI for every social table (user A cannot access user B's private data)
- No client-side filtering of private data — the database is the security boundary
- All API routes verify the requesting user
- Edge caching disabled for all personalised pages (`cache-control: private, no-store`)
- Code review of every PR touching social code, with privacy as the primary concern
- Soft launch detects issues before public release

### Risk 3 — Deletion does not actually delete

**Description:** User exercises right to erasure. Some data remains — orphaned in cache, in another user's denormalised feed, in storage, or in backups beyond the retention period.

| | L | S | Score |
|---|---|---|---|
| Inherent | 4 | 4 | 16 |
| Residual | 2 | 4 | 8 |

**Mitigations:**
- All FKs cascade on delete
- CI test verifies clean deletion on every PR
- Photos in Supabase Storage are deleted by trigger or job
- No denormalisation of user content into other users' rows (no "feed cache" tables)
- Backup retention documented in privacy policy; users informed that deletion may take up to N days to propagate to backups
- Audit log entries for deletions are anonymised

### Risk 4 — Existing user auto-enrolled in social feature

**Description:** A code path or migration accidentally treats existing users as having opted in to the social feature, exposing their data without consent.

| | L | S | Score |
|---|---|---|---|
| Inherent | 3 | 5 | 15 |
| Residual | 1 | 5 | 5 |

**Mitigations:**
- Default `social_opt_in = false` for all existing rows in migration
- Phase 1 launch requires users to actively click an opt-in toggle
- No backfill of posts from existing logbook data
- No backfill of profile data from existing fields without explicit consent
- Feature flag controls all social functionality at launch

### Risk 5 — Photo containing third-party engineer

**Description:** A user uploads a photo of their work. Another engineer is visible in the background. That engineer has not consented to appearing on the platform.

| | L | S | Score |
|---|---|---|---|
| Inherent | 3 | 3 | 9 |
| Residual | 2 | 3 | 6 |

**Mitigations:**
- Privacy policy advises users to be considerate of others in photos
- Posts can be reported and removed (Phase 4 must include a basic report flow)
- Posts are deletable by the original poster at any time
- Photos are not searchable or indexed beyond their post

**Accepted residual risk:** Yes, with a report-and-remove process. Industry norms around incidental photography in workplaces are similar to social media generally.

### Risk 6 — Reputational damage from a leak

**Description:** A single high-profile incident (a leaked photo, a privacy bug, a data breach) damages trust in the platform among the small UK aviation maintenance community, and the platform cannot recover.

| | L | S | Score |
|---|---|---|---|
| Inherent | 3 | 5 | 15 |
| Residual | 2 | 5 | 10 |

**Mitigations:**
- Phased rollout limits blast radius of any single launch
- Soft launch surfaces issues before public release
- Kill switch can disable the social feature within 30 seconds
- Documented incident response plan (24-hour response, user notification, root cause)
- Conservative defaults — no aggressive engagement features, no algorithmic surfacing
- Building trust slowly is more valuable than rapid feature growth

### Risk 7 — Profiling or discrimination

**Description:** Employers or recruiters use the platform to profile engineers — for example, to identify those who might be looking for work, or to discriminate based on training records.

| | L | S | Score |
|---|---|---|---|
| Inherent | 3 | 4 | 12 |
| Residual | 2 | 3 | 6 |

**Mitigations:**
- Permanent / Contractor label is a single binary field, not a granular profile
- No "available from" date in the initial scope
- Profile visibility is user-controlled; private profile available
- No employer-tier accounts in the initial scope (this is a future product decision that triggers a fresh DPIA)
- Privacy policy makes clear that the platform is engineer-to-engineer, not employer-to-engineer

### Risk 8 — Children / under-18 users

**Description:** Aviation apprentices may be under 18. A social feature processing personal data of children requires parental consent in some jurisdictions and stricter safeguards.

| | L | S | Score |
|---|---|---|---|
| Inherent | 2 | 4 | 8 |
| Residual | 1 | 4 | 4 |

**Mitigations:**
- Age verification on signup (date of birth is already collected in profile)
- Users under 18 cannot enable any social feature (account-level restriction)
- Privacy policy explicitly states the social feature is 18+
- This is enforced server-side, not just in the UI

### Risk summary

| Risk | Inherent | Residual |
|---|---|---|
| Photo reveals operator data | 16 | 12 |
| Privacy setting bypass | 15 | 5 |
| Deletion does not delete | 16 | 8 |
| Auto-enrolment of existing users | 15 | 5 |
| Third-party engineer in photo | 9 | 6 |
| Reputational damage | 15 | 10 |
| Profiling / discrimination | 12 | 6 |
| Under-18 users | 8 | 4 |

The residual risks are acceptable provided all mitigations are implemented before each phase launches. Two risks remain at 10+ after mitigation (operator data in photos, reputational damage). Both are mitigated primarily by user education, soft launch, and the fact that the user is treated as a professional adult — we accept these as the cost of building a trust-based platform.

---

## 7. Sign-off and review

This DPIA must be reviewed and signed off by the data controller (Alex King, Airworthiness Limited) before each phase launches.

### Pre-launch checklist (per phase)

- [ ] DPIA reviewed and risks reassessed for the new phase
- [ ] Privacy policy updated with phase-specific changes
- [ ] Existing users notified of the change before the new feature is enabled
- [ ] All RLS policies for new tables tested in CI
- [ ] Negative-path tests passing
- [ ] Account deletion cascade test passing
- [ ] Feature flag in place and tested
- [ ] Kill switch tested
- [ ] Soft launch group identified and briefed
- [ ] Incident response plan reviewed

### Review schedule

- Phase 1 launch: full DPIA review
- Phase 2 launch: incremental review of new risks
- Phase 3 launch: incremental review of new risks
- Phase 4 launch: full DPIA review (most risk concentrated here)
- Annually thereafter

---

## 8. Open questions for resolution before Phase 1

1. **Backup retention** — what is the current backup retention period in Supabase, and how long does deletion take to propagate? This needs to be documented in the privacy policy.
2. **Soft launch group** — who are the 10-20 engineers? They need to be identified and informally briefed before Phase 1.
3. **Privacy policy review** — is there a budget for legal review, or is the founder accepting the risk of self-drafting?
4. **Incident response** — write a one-page plan for what to do in the first 24 hours of a suspected data breach.
5. **ICO registration** — is Airworthiness Limited registered with the Information Commissioner's Office as a data controller? This is required if it isn't already.
