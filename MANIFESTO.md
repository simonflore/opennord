# The OpenNord Manifesto

Six years ago I sent an email to Clavia.

I had just moved from an Electro 6 to a Stage 3, and I'd been reading everything I
could find. I kept running into the same thing: the interesting work wasn't coming
from the company. It was coming from players. Someone had built NordUserSounds.
Someone else had built a program viewer that could read files Nord itself never
documented. People were selling their sounds on Gumroad, because there was nowhere
else to sell them.

So I wrote to Nord and said: there's something here, and someone should build it.

I said their software choices had been solid — Sound Manager and the Sample Editor
gave players real freedom — but that the competition was circling something bigger
and executing it badly. I called Roland Cloud Manager and Yamaha Soundmondo
*"mediocre executions of something that could be groundbreaking."* I said the future
was one where **"software, hardware and Nord musicians are more easily connected,
able to share, try & sell ideas, programs and samples."** I said **"the days of files
and downloads are over,"** and that people picking up a keyboard today don't have the
patience of those of us who grew up with Windows 95 and floppy disks.

And I said the one thing I still believe most: that **the power of a Nord is that it
is completely independent of any other device** — and that nothing built around it
should ever change that.

I offered to help. I never got the conversation.

Almost everything in that email is still true today. That's the part that matters.
Six years is long enough to know an idea wasn't wrong, just unowned. So I stopped
waiting and built it.

That's OpenNord.

---

## What I believe

**The instrument stays sovereign.** Your Nord must work perfectly with nothing
plugged into it — no app, no account, no internet, no us. This isn't a nice-to-have,
it's the whole reason people trust these keyboards on stage. OpenNord is a companion,
never a dependency. Nothing we build will ever sit between you and your instrument.

**The days of files and downloads are over.** Not the files themselves — the ritual.
Plugging in, launching a manager, hunting a folder, dragging, syncing, praying. You
should be able to open your library on your phone in a dressing room, find the sound
you built two years ago, and understand what's in it. That's a product problem, and
product problems are solvable.

**Your work is yours.** A program is a description of settings — it's a recipe, not a
sample library. When you write one, you made it. You should be able to share it, sell
it, carry it to your next keyboard, and get credit for it. The line we hold is
authorship, not file type: OpenNord shares what *you* created, and never redistributes
Nord's factory content. That line is absolute and it's written into the code, not just
the terms.

**The knowledge belongs to the commons.** OpenNord exists because people gave their
work away first — the Stage 2/3 format documentation, the Stage 4 decoder, years of
forum threads. Everything we learned goes back the same way. The client is free and
open source under the AGPL, the file format and the USB protocol are documented in
public, and every contributor is credited by name. If I disappear tomorrow, the
knowledge survives me. That was the point.

**Nothing you made should die with a model year.** A sound you built on a Stage 2
should be able to live on a Stage 4. Not perfectly — some things genuinely don't
translate — but honestly, with a clear report of what carried over and what you need
to re-pick. Migration is a promise to the person who spent a decade building a
library.

**Interoperability, not imitation.** OpenNord is not affiliated with, endorsed by, or
connected to Clavia DMI AB. We reverse-engineered the format and the transfer protocol
for one reason: so you can read and move **your own data** on **your own instrument**.
We don't clone their software, host their content, or compete for their customers.
We're building the thing that makes their keyboards worth more.

---

## The plan

**Phase 1 — Read and understand. Done.**
Drop a Stage 2, 3, or 4 program into OpenNord and see what's actually inside it —
engines, effects, morphs, key zones, the samples it calls for. No keyboard needed, no
Sound Manager, nothing to install. Around fourteen Nord models read today through one
shared container, with the Stage 4 decode validated to zero mismatches against the
community's reference decoder. Point it at a folder and you get a searchable,
mobile-first library. Open a sample and you can play it — on screen or from a MIDI
controller — with no Nord in the room.

**Phase 2 — Talk to the instrument. Done.**
This was supposed to be the wall. Nord's transfer protocol isn't MIDI SysEx; it's an
undocumented vendor USB protocol. It's now fully reverse-engineered and validated on
real hardware in both directions: enumerate a connected Stage 4, pull programs off it,
and write a playable program back to it. Plus backup, and a reorganizer that can move
things around inside a multi-gigabyte backup — something the hardware itself has no
command for.

**Phase 3 — Connect the players. Building now.**
The community library: publish your own programs, browse everyone else's, follow
authors you trust, hear a demo before you download. This is the part of the 2020 email
that never got built by anyone — the place where software, hardware and players
actually meet. Programs only, user-created only, ownership stays with you.

**Phase 4 — Ideas, not files.**
Ask for "punchy clav" and get it. Open a patch and have it explained — what it does,
and what to turn to move it where you want. Describe a sound in words and get a real
program you can load. This is where "the days of files and downloads are over" stops
being a slogan. It's the last phase because it's only honest once everything under it
is exact, and now it is.

---

## To Clavia, still

The offer in that email hasn't expired. I'd rather build this *with* Nord than beside
it. There's a version of this where the manufacturer of the best keyboards in the
world also owns the place their players gather — where sharing, trying and selling
sounds happens under your name, and every instrument gets more valuable the longer
someone owns it. I still think that's worth more to you than to me.

Until then, someone has to build it. Your players already started.

## To everyone else

Bring us a file we get wrong. Bring us a model we don't read yet. Bring us a patch
worth sharing, a bug, a capture from a keyboard we've never seen. The formats, the
protocol, the reasoning — it's all public, on purpose, so the next person can pick it
up faster than I did.

I waited six years for someone else to do this. Don't wait for me.

---

*OpenNord is not affiliated with, endorsed by, or connected to Clavia DMI AB or Nord
Keyboards. "Nord" and "Nord Stage" are trademarks of their owner, used here only to
describe compatibility. OpenNord shares user-created work and never Nord's factory
sample or library content.*
