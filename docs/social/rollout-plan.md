# Social Feature — Phased Rollout Plan

**Status:** Pre-launch
**Owner:** Alex King, Airworthiness Limited

This document describes how the social feature is rolled out across four phases, with go/no-go criteria for each. Detailed specs for each phase live in their own files.

---

## Why phased

- **Risk containment.** Each phase ships a small, well-defined surface. If something goes wrong, only that surface is affected.
- **Trust building.** Users see the platform evolve carefully. The first impression of the social feature is "calm and considered," not "we shipped a giant feature and are figuring it out."
- **GDPR-friendliness.** Each phase is its own consented purpose. Users opt in to each new capability separately.
- **Cultural shaping.** The first 100 users of each phase set the tone for that phase. Soft launches give us the chance to course-correct before public release.

---

## The four phases

### Phase 1 — Public profile page

**Ships:** A profile page at `/u/[handle]` with the type rating trophy case as the centrepiece.

**Goals:** Validate the smallest possible social surface. Establish the URL structure, the consent flow, and the privacy primitives that every later phase depends on.

**Risk:** Low. The user's own data, displayed only with explicit opt-in.

**Spec:** `phase-1-profile.md`

### Phase 2 — Follow graph

**Ships:** The ability to follow other engineers. Follower / following lists on profile pages. Follow request / approval for private profiles.

**Goals:** Validate the social graph mechanics in isolation, before any feed exists. Tests how follows/unfollows work, how blocking works, how privacy interacts with discovery.

**Risk:** Medium. Introduces relationships between users for the first time. The privacy implications of "who can see whose followers" need to be designed deliberately.

**Spec:** TBD — will be drafted after Phase 1 is in soft launch.

### Phase 3 — Auto-generated milestone feed

**Ships:** A chronological feed of milestone posts (module passes, type ratings, training completions, anniversaries, apprenticeship). Auto-share prompt when the underlying data is saved. No photos, no manual notes, no task posts.

**Goals:** Validate the feed itself with the lowest-fluff content type. Milestones are unfakeable, structured, and feed-worthy by definition.

**Risk:** Medium. First posts surface in the feed. First exposure to the "did this post embarrass me / get me in trouble" risk class.

**Spec:** TBD — will be drafted after Phase 2 is in soft launch.

### Phase 4 — User-initiated task posts

**Ships:** "Share to feed" button on logbook entries. Optional photos, optional 140-char technical note. The full vision of the social feature.

**Goals:** Complete the spec. Most risk concentrated here.

**Spec:** TBD — will be drafted after Phase 3 is in soft launch.

---

## Pre-launch checklist for every phase

This list applies to **every** phase. No phase ships unless every box is ticked.

### Legal and compliance

- [ ] DPIA reviewed and risks reassessed for the new phase
- [ ] Privacy policy updated to cover the new processing
- [ ] Existing users notified of the change before the new feature is enabled
- [ ] Consent flow is opt-in, granular, and revocable
- [ ] Lawful basis (consent) is correctly recorded for each user

### Database and security

- [ ] Migrations written and tested
- [ ] Row Level Security policies written for every new table
- [ ] Negative-path RLS tests passing (user A cannot see user B's private data)
- [ ] Account deletion cascade test passing
- [ ] No edge caching of personalised pages
- [ ] No client-side filtering of private data

### Operational

- [ ] Feature flag in place and tested
- [ ] Kill switch can disable the feature within 30 seconds
- [ ] Incident response plan reviewed
- [ ] Logging and monitoring in place for unusual access patterns
- [ ] Soft launch group briefed and ready

### Quality

- [ ] Designed for mobile first
- [ ] Loads instantly (server-rendered where possible)
- [ ] Tone is technical, not flashy
- [ ] No fluff, no humblebrag templates, no motivational language
- [ ] Defaults are conservative (privacy-first)

---

## Soft launch protocol

Every phase ships first to a small group of trusted users — not the full user base.

1. **Identify 10-20 engineers** who will give honest feedback. These should be people who understand the platform and the industry, and who will tell us if something feels wrong.
2. **Brief them privately** on what's new and what we're testing. Make clear they are early users and should expect issues.
3. **Enable the feature for their accounts only** via a feature flag.
4. **Run the soft launch for 2 weeks minimum.** Longer if needed.
5. **Collect feedback** in a structured way — a simple form or a private Slack channel.
6. **Address material concerns** before opening to the public. "Material" means anything that affects safety, privacy, or tone.
7. **Public launch only after** the soft launch group says it's ready.

---

## Incident response — first 24 hours

If a privacy issue or data leak is discovered:

### Hour 0 — Detect
- Source: user report, monitoring alert, or internal review
- Confirm the issue is real (not a misunderstanding)

### Hour 0-1 — Contain
- Flip the kill switch for the affected feature
- If the leak is broader than a single feature, take the affected pages offline entirely
- Document the time of detection and time of containment

### Hour 1-4 — Assess
- What data was exposed?
- How many users were affected?
- How long was the exposure window?
- Is the data still accessible anywhere (caches, screenshots, third parties)?

### Hour 4-12 — Notify
- If the leak meets the GDPR Article 33 threshold (likely to result in a risk to rights and freedoms), notify the ICO within 72 hours
- Notify affected users directly with a clear, honest, non-defensive explanation
- Notify all users via an in-app banner if the impact is broad

### Hour 12-24 — Fix
- Root cause analysis
- Permanent fix
- Test the fix
- Re-enable the feature only when confidence is high

### Within 7 days — Post-mortem
- Write a public post-mortem (no PII) explaining what happened, what we did, and what we changed
- Update the DPIA to reflect any newly identified risks
- Update tests to prevent recurrence

---

## Stop-the-line conditions

Any of these conditions means the phase does not ship — or, if already shipped, is rolled back via the kill switch.

- A privacy bug allowing unauthorised data access
- A failure of the deletion cascade test
- A failure of negative-path RLS tests
- A bug allowing any user to be auto-enrolled without consent
- An EXIF stripping failure (Phase 4)
- A leak detected in the soft launch
- Any feedback from the soft launch group identifying a risk we have not adequately mitigated

---

## What we are explicitly not doing

These decisions are documented to prevent scope creep and to guide future "should we add X" conversations.

- **No comments on posts.** Increases moderation burden, increases personal data risk, dilutes the technical tone.
- **No reposts or quote-reposts.** Encourages low-effort sharing and dilutes provenance.
- **No algorithmic feed.** Chronological only.
- **No employer accounts in the initial scope.** Engineer-to-engineer only. Adding employer-tier accounts is a future product decision that triggers a fresh DPIA.
- **No "available from [date]" indicator.** Risk of leaking departure plans to current employer. May be revisited in a later phase with stronger access controls.
- **No data backfill.** Existing logbook entries and training records do not auto-generate posts. Users opt in deliberately.
- **No public search or directory.** Profiles are accessed by URL only in Phase 1. Discoverability is a Phase 2+ decision.
- **No verified badge.** Implies a vetting process we are not performing.
- **No crew tagging on logbook entries.** Third-party data without consent.
- **No "first task on type" auto-detection.** Out of scope.
- **No hours-based milestones.** Pilots use hours; engineers do not.

---

## Open items before Phase 1 starts

1. **ICO registration.** Verify Airworthiness Limited is registered as a data controller with the Information Commissioner's Office. If not, register now.
2. **Privacy policy review.** Decide whether to seek legal review or self-draft.
3. **Soft launch group.** Identify 10-20 engineers and reach out informally.
4. **Backup retention.** Document current Supabase backup retention period for the privacy policy.
5. **Incident response plan.** Write the one-pager.
6. **Sign off the DPIA** — the data controller must formally accept the residual risks before Phase 1 is built.

Once these are done, Phase 1 can begin.
