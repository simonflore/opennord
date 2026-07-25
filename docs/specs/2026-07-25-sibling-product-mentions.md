# Spec: mentioning Gigmeister

**Date:** 2026-07-25
**Status:** Implemented
**Owner of the copy:** `components/sibling/Gigmeister.tsx` — one file, all mentions

---

## Context

Gigmeister (`gigmeister.app`) is OpenNord's author's other project: an app for
gigging bands — setlists, a band calendar, and MIDI automation that switches a
Nord between songs. OpenNord's users are gigging Nord players, so it's worth a
mention.

Worth a *mention* — not a campaign. OpenNord's pitch is "free, open, nothing
uploaded, no tracking," and a house ad undercuts that harder here than it would
on a normal landing page. The first pass at this was a full landing-page section
with a headline, a supporting panel and three paragraphs of framing; it read as
an ad because of its size, whatever the copy said. It was cut.

## Rule

Say what it is and whose it is, in a sentence or two: *I also make Gigmeister —
&lt;what it does&gt;.* No pitch, no benefit claims, no slogan, no CTA weight. If
a mention grows past a couple of sentences, it has become an ad.

**First person**, matching the coffee button and the rest of the About copy. The
third person ("OpenNord's author also built…") reads as a press release, which
is most of the way to an ad on its own — and it's odd on a page that elsewhere
says "buy me a coffee".

The link is deliberately quieter than `covLink` (which is red): red is
OpenNord's accent and belongs to OpenNord's own actions, so the loudest thing on
any page stays "Open the app".

## Placements

| Surface | Why there |
|---|---|
| **Organize** (`OrganizeGrids`) | The one that's earned. Rearranging a bank renumbers slots, and a slot number is what a setlist sends as MIDI Program Change — advice OpenNord owes its users anyway. The mention is a trailing clause. Shown only when there are entries |
| **About** | The "who made this" surface, next to Credits. One sentence |
| **Landing footer** | Permanent, no interruption. One line |

Deliberately not placed: the rail (would imply it's part of the app), the hero,
a dedicated landing section, and the reorganize confirm dialog (a decision
point).

## Enforcement

`Gigmeister.test.tsx` runs two assertions over every mention as a table, so a
new surface can't skip them: each claims the project in the first person, and
none carries CTA/red-accent classes on its link (scoped to the link, with a
guard so it can't pass vacuously). `OrganizeGrids.test.tsx` pins that the footnote is ambient
(present with no plan pending, so it can't drift into the confirm step) and
absent when there is nothing to rearrange.

One assertion is about accuracy, not tone: a set points at a **slot**, not at a
program, so rearranging a bank leaves it recalling whatever now sits there — it
does not follow the program. An earlier draft said this backwards, so the test
checks the correct phrasing is present and the wrong one absent.

## Note for forks

`packages/core` is the AGPL client, mirrored publicly. These are author-level
links, the same posture as `BuyMeACoffeeButton`, confined to
`components/sibling/` plus three call sites — a fork removes all of it by
deleting that directory and the imports.
