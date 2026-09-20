# Dagvald Play board (Hank)

Live path after deploy: `https://hank.darren-l-jorgenson.workers.dev/play.html`

Same rule as Castle Fund: **he uses the page. You are the only person who talks to Grok.**

## What he gets
- Minecraft Java cards: first base, storage wall, night survival, enchant nook, fair village, “ask Dad for a build card”
- Hogwarts Legacy cards: Room of Requirement layout, Field Guide habit, combat timing, beast care, broom circuit, story-vs-explore nights (no quest spoilers, no copied walkthroughs)
- **I like** chips + “new subject” box so the ecosystem can grow
- **Ideas** list
- **Sent** inbox
- One-tap card feedback: helped / confusing / more like this
- **Send to Dad** box → `POST /api/answer` `{ source: "play", kid: "Dagvald", ... }` which the existing Grok loop already reads

Castle balances are untouched.

## Deploy
1. Commit `play.html`, `play.js`, `play-data.js` (this folder).
2. In `castle.js` header tabs, add:
   `'<a class="tab" href="play.html">Play</a>'`
3. Same link on `castle.html` tabs.
4. `npx wrangler deploy` as usual.

## Your loop when he sends a note
1. Open Hank captures / next Grok loop answers with `source: play`.
2. If it is a build or stuck puzzle, bring it here. I return a new card (name, footprint/habit, 5 steps).
3. You paste the card into `play-data.js` or tell me to add it.
4. He marks done on the board.

Never give him your Grok login. Never drop a copyrighted wiki dump onto the board.
