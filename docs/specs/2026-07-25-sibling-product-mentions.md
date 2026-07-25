# Spec: mentioning Gigmeister without it reading as an ad

**Date:** 2026-07-25
**Status:** Implemented
**Surfaces:** landing page (`components/home/Sibling.tsx`, `SiteFooter.tsx`), About
(`components/about/AboutView.tsx`), Organize (`components/device/OrganizeGrids.tsx`)
**Owner of the copy:** `components/sibling/Gigmeister.tsx` — one file, all mentions

---

## Context

Gigmeister (`gigmeister.app`) is a paid app for gigging bands, built by
OpenNord's author. Its stage half drives keyboards over MIDI; OpenNord's users
are gigging Nord players. The audiences genuinely overlap, so a pointer is worth
having — but a cross-promo is the easiest thing in a product to get wrong, and a
badly placed one costs more trust than the traffic is worth. OpenNord's whole
pitch is "free, open, nothing uploaded, no tracking" — a house ad undercuts that
claim harder than it would on a normal SaaS landing page.

## What actually makes a cross-promo read as an ad

Not the fact of the mention — the *shape* of it. Four things do the damage:

1. **Unearned attention.** It appears where the reader isn't thinking about that
   problem, sized by how much the seller wants it seen.
2. **Pitch voice.** Benefit claims and a slogan, in the second person, aimed at
   conversion rather than comprehension.
3. **Undisclosed interest.** The reader is left to work out that the author
   profits, which converts a recommendation into a suspected placement.
4. **Interruption.** A banner, modal, or dismissible strip — anything with a
   close button has already taken the attention it's asking permission for.

Each has an inverse, and those inverses are the rules below.

## Rules

1. **Earned by context, never by prominence.** Every placement sits where the
   adjacent problem actually arises. Never above the fold, never in the rail,
   never an interstitial, never dismissible.
2. **Frame it as OpenNord's boundary, not Gigmeister's pitch.** "The gig is a
   different job and OpenNord won't grow into it" is information about *this*
   tool, and is true and useful whether or not the reader ever clicks.
3. **Disclose what a reader would otherwise suspect** — same author, separate
   app, *paid*. Candour is the thing that separates a recommendation from a
   placement. This binds **per placement, not per site**: each surface is
   reachable without the others, so none may lean on a sibling placement for
   its disclosure.
4. **Never compete with OpenNord's own CTA.** No red accent, no primary button,
   no icon tile. The loudest element on any page stays "Open the app".
5. **Say it's optional, out loud.** OpenNord is free, complete, and unaffected
   if every link here is ignored.
6. **No slogan.** A tagline is the most ad-shaped element there is and adds
   nothing a plain descriptive sentence can't. Describe; don't pitch.

## Placements

| Surface | Why it's earned | Weight |
|---|---|---|
| **Organize** (`OrganizeGrids`) | The load-bearing one. Rearranging a bank renumbers slots, and a slot number *is* what a setlist sends as MIDI Program Change — a consequence the confirm dialog already warns about. The mention is genuinely useful information here. | 11px footnote under the grids, only when there are entries |
| **About** | The canonical "who made this" surface, next to Credits. Reaches mobile users, who never see the desktop-only Organize view. | Last card, same weight as Credits |
| **Landing page** (`Sibling`) | Placed after `Why` — every claim OpenNord makes about itself comes first. | Bold/small heading, deliberately *not* `text-display-2` |
| **Footer** | Permanent, zero-interruption, costs nothing. | Muted 11px |

Deliberately **not** placed: the rail (would imply it's part of the app), the
hero, the reorganize confirm dialog (a decision point — a third-party mention
there taxes it), and anywhere with a dismiss affordance.

## Enforcement

`components/sibling/Gigmeister.test.tsx` pins the rules that a well-meaning
later edit ("make the link stand out more") would otherwise undo silently. Two
of them run over *every* placement as a table, so a new surface cannot be added
without meeting them: each discloses "separate" and "paid" on its own, and none
carries CTA/red-accent classes on its link. Per-placement assertions cover the
landing section's typography (no `text-display-*`) and — in the Organize
footnote — the useful fact ordered before the product name.
`OrganizeGrids.test.tsx` pins that the footnote is ambient (present with no plan
pending) and absent when there is nothing to rearrange.

One assertion is about accuracy rather than tone: a set points at a **slot**,
not at a program, so rearranging a bank leaves it recalling whatever now sits
there — it does not follow the program. Saying that backwards would invert the
whole point, so the test asserts both the correct phrasing and the absence of
the wrong one.

**Copy lives only in `components/sibling/`.** The footer's line was briefly
written inline in `SiteFooter` and immediately drifted out of rule 3 — it
disclosed shared authorship but not that Gigmeister is separate and paid.
`SiteFooter` needs a router to render, so nothing could assert on it. Copy that
lives in the module is copy the table can check; that is the reason for the
factoring, not tidiness.

## Note for forks

`packages/core` is the AGPL client, mirrored publicly. These mentions are
author-level links inside it, the same posture as `BuyMeACoffeeButton`. They are
confined to `components/sibling/` plus the four call sites listed above, so a
fork can remove all of them by deleting that directory and the imports.
