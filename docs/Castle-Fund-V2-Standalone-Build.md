# Castle Fund V2 — Standalone Grok Build (2026-07-28)

**Status:** Spec + build record only. The live Hank app (`castle.js`, `worker.js`, `dagvald.html`, `davikja.html`) was **not** modified by this work.

**Built by:** Grok Build (App Builder sandbox) as a **standalone** family chore/finance app, then documented here so Hank can absorb the upgrades without guessing.

**Audience:** Dagvald and Davikja (financial literacy + daily hard work).

**Parent product principle (unchanged):**
kid taps chore → Pending → parent approves with 4-digit PIN → balance credits.

---

## 1. Why this exists

Darren asked for a **standalone** app that keeps Castle Fund **process and principles**, but is much stronger for kids learning money and showing up to work every day — **without replacing or changing the existing Hank repository** at build time.

This file is the handoff: what shipped in the standalone app, locked product decisions, feature list, data model shape, and a concrete integration checklist for folding it into Hank’s Cloudflare Worker + static Castle pages.

---

## 2. Locked product decisions (Q&A)

| # | Decision | Answer |
|---|----------|--------|
| 1 | Preload Dagvald and Davikja with Castle chore defaults | **Yes** |
| 2 | Parent PIN required before money credits balance | **Yes** |
| 3 | Save / Spend / Give buckets on earnings | **Yes** |
| 4 | Kids search for products when building wishlist | **Yes (web + curated catalog)** |
| 5 | Bank of Mom and Dad monthly interest | **Yes** |
| 6 | Daily hard-work loop (check-in, streaks, badges) + chore counts over periods | **Yes** |
| 7 | Friendly sibling competition board | **Yes, parent can hide** |
| 8 | Parent deductions / penalties | **Yes** |
| 9 | Purchased wishlist items deduct from Spend; parent can update cost | **Yes** |
| 10 | Sync across devices (not device-only) | **Yes (shared server state)** |
| 11 | Dedicated Parent Dashboard | **Yes** |
| 12 | XP + levels separate from dollars | **Yes** |
| 13 | Short money lessons unlock with level | **Yes** |
| 14 | Proceed to build | **Yes** |

---

## 3. What the standalone app shipped

### Surfaces

| Route / screen | Purpose |
|----------------|---------|
| **Home** | Family hub: both kids balances, streaks, goal progress; pending banner; work arena (if visible); how-it-works |
| **Kid page** (`/kid/Dagvald`, `/kid/Davikja`) | Check-in, log chores, pending list, buckets, wishlist search, work totals (today/week/month/all), XP, lessons peek, history |
| **Parent dashboard** | Set PIN once; approve/decline both kids; competition show/hide; edit chores; goal/interest/split; deductions; mark purchased with cost override |
| **Lessons** | Curriculum of money lessons; locked until level threshold |

### Core loop (parity with Hank Castle)

1. Kid **starts work day** (check-in → XP).
2. Kid **logs a chore** → `pending` (daily qty / once-only enforced).
3. Parent enters **4-digit PIN** → **approve** or **decline**.
4. On approve: amount splits into **Save / Spend / Give** per kid `alloc`; XP awarded; history updates; streaks update.

### Defaults (mirrors Hank Castle Fund)

**Dagvald**
- Chores: Clean Room $5; Clean Stalls $10 x3; Mow Lawn $25
- Seed $85; Goal $250; Reward "LEGO Hogwarts Castle"; theme castle
- Default alloc: Save 20 / Spend 70 / Give 10

**Davikja**
- Chores: Vacuum Sunroom $5; Vacuum Main Floor $10; Pickup Basement $10; Sweep and Cycle Litters $10
- Seed $20; Goal $100; Reward "$100 reward (TBD)"; theme jar
- Default alloc: Save 20 / Spend 70 / Give 10

### Kickass additions beyond current Hank Castle

1. **Daily work day check-in** (+10 XP) separate from logging a chore.
2. **XP + levels** (soft curve: L1 at 0, then 100 + 50*(L-1) XP per level).
3. **Work totals** for today / week / month / all-time (chore count + dollars earned).
4. **Streaks** from approved earn days + check-ins.
5. **Wishlist product search**
   - Curated kid-friendly catalog (LEGO, bikes, Diadem bag, horse grooming, etc.)
   - Plus remote product search merged in results
   - Add / set as goal from results; star toggles active goal
6. **Parent purchase flow** with **editable actual cost** → Spend deduction + history line
7. **Competition Work arena** on home (weekly chore leader) — parent can **hide/show**
8. **Money lessons** (8 lessons) unlock by level
9. **Dedicated parent dashboard** (not only a sheet on the kid page)
10. **Shared server-side family state** so parent phone + kid tablets stay in sync

### Financial literacy features (carry forward)

- Running ledger history with status (pending / approved / declined)
- Buckets UI (Save / Spend / Give)
- Interest (Bank of Mom and Dad): monthly period key YYYY-MM, idempotent per kid+period
- Deductions with reason
- Goal progress from seed + approved ledger vs starred wishlist or config goal

### Explicitly not changed in Hank during the standalone build

- `castle.js`, `castle.html`, `dagvald.html`, `davikja.html`, `worker.js` KV schema
- Hank Command Center tabs / vault / loop files

---

## 4. Standalone technical shape (for integrators)

Built on **TanStack Start + React + Tailwind v4** (Grok App Builder template), **not** on Hank’s static HTML + CF Worker stack. Treat the standalone as a **behavior/spec prototype**, not a drop-in replace of `castle.js`.

### Data model (logical)

```
CastleState
  version: number
  settings: { pinHash, pinSet, competitionVisible, familyName }
  catalogs: { Dagvald: ChoreDef[], Davikja: ChoreDef[] }
  configs:  { Dagvald: KidConfig, Davikja: KidConfig }
  wishlists:{ Dagvald: WishItem[], Davikja: WishItem[] }
  entries:  LedgerEntry[]
  progress: { Dagvald: KidProgress, Davikja: KidProgress }
  updatedAt: ISO string
```

**ChoreDef:** id, name, price, qty, emoji/icon key, steps, once?, per?

**KidConfig:** dob, reward, goal, seed, interestPct, interestOn, theme, color, alloc{save,spend,give}, savingsMode?

**WishItem:** id, name, price, url?, image?, goal?, purchased?, source?

**LedgerEntry:** key, kid, chore, amount, status(pending|approved|declined), kind(chore|interest|deduction|purchase|seed), day, ts, buckets?, period?, reason?, xp?

**KidProgress:** xp, level, lessonsUnlocked[], workDays[{day, checkedIn, choresDone}], lastCheckIn?

### Persistence (standalone)

- SQL table `castle_state` (id, payload JSON text, version)
- PGLite in preview; Neon when DATABASE_URL is set
- Single family id `default`

### Server operations (behaviors to port)

| Action | Auth | Behavior |
|--------|------|----------|
| getState | public | Returns state; never returns raw pin hash |
| setPin | once | 4-digit; rejects if already set |
| logChore | kid | pending entry; daily-limit / once-done |
| decideEntry approve/decline | PIN | approve splits buckets + XP |
| checkIn | kid | once per chore-day; +XP |
| saveCatalog | PIN | replace kid chore list |
| saveConfig | PIN | goal, interest, alloc must sum 100 |
| deduct | PIN | negative Spend |
| accrueInterest | PIN | both kids if interestOn and period free |
| setCompetitionVisible | PIN | boolean |
| searchWishlist | public | curated + remote hits |
| addWish / starWish | kid | wishlist mutate |
| saveWishlist | PIN | parent edit list |
| purchaseWish | PIN | optional price override; needs enough Spend |

### XP rules

- Check-in: **+10 XP**
- Approved chore: **+15 + min(40, round(price))** XP
- Level from XP: while remaining >= need, spend need, level++, need = 100 + (level-1)*50
- On level-up: unlock all lessons with unlockLevel <= level

### Lessons (ids)

1. lesson-work L1 — Work comes first
2. lesson-buckets L2 — Save / Spend / Give
3. lesson-wait L3 — Waiting is a superpower
4. lesson-interest L4 — Bank of Mom and Dad
5. lesson-streak L5 — Show up daily
6. lesson-tradeoffs L6 — Every choice costs something
7. lesson-goal L7 — Goals need numbers
8. lesson-give L8 — Generosity is strength

### UX notes

- Mobile-first (~390px), large tap targets
- Prefer lucide-style icons over emoji chrome
- Warm ranch/paper palette (green primary)
- Toast feedback required on log/approve
- Chore day rolls over ~4am local (same idea as Hank Castle)

---

## 5. Mapping onto existing Hank Castle

### Keep / reuse

| Hank today | Keep |
|------------|------|
| dagvald.html / davikja.html thin shells + CASTLE_KID | Yes |
| Shared castle.js client | Yes — extend, do not throw away |
| Worker castle:bundle KV snapshot | Yes — extend payload |
| PIN set/approve/decline/catalog/config/deduct/accrue/wishlist/purchase APIs | Yes — add new endpoints beside them |
| Existing balances and pending entries in production KV | Migrate carefully; do not wipe |

### Add to Worker + client

1. **progress** object per kid (xp, level, lessons, workDays, lastCheckIn)
2. **settings.competitionVisible** (default true)
3. **check-in** endpoint + UI button
4. **stats** helpers: today/week/month/all chore counts and dollars
5. **search** endpoint (can start curated-only; remote optional)
6. **parent dashboard page** (parent.html or section on castle.html) with approvals for both kids
7. **lessons** UI (static lesson content in JS module)
8. **work arena** on home/kids hub + hide toggle
9. Purchase: ensure parent can edit price before deduct

### Suggested Worker key layout (non-breaking)

Continue single bundle `castle:bundle` and grow JSON:

```json
{
  "v": 2,
  "settings": { "competitionVisible": true },
  "entries": [],
  "catalogs": {},
  "configs": {},
  "wishlists": {},
  "progress": {
    "Dagvald": { "xp": 0, "level": 1, "lessonsUnlocked": ["lesson-work"], "workDays": [] },
    "Davikja": { "xp": 0, "level": 1, "lessonsUnlocked": ["lesson-work"], "workDays": [] }
  }
}
```

On read: if progress is missing, default empty progress (no data loss).

---

## 6. Integration acceptance criteria

- [ ] Existing live balances / pending / PIN / catalogs still work after deploy
- [ ] Kid can check in once per chore-day and earn XP without money
- [ ] Approved chore still requires PIN and still credits balance + buckets
- [ ] Week/month/all chore counters visible on kid page
- [ ] Wishlist search returns at least one result for "lego" from curated list
- [ ] Parent can hide competition board; kids no longer see arena
- [ ] Parent can purchase wishlist item with overridden cost; Spend decreases
- [ ] Interest accrue still idempotent per kid+month
- [ ] Mobile 390px: no horizontal overflow; primary actions large enough to tap
- [ ] Deploy + verify on production Hank Worker; update hank-context.md LIVE STATE Castle blurb

---

## 7. Out of scope for first Hank merge

- Rewriting Hank into TanStack Start / React (stay on Worker + static unless product decides otherwise)
- Multi-family SaaS / accounts (single family)
- Real Amazon/affiliate checkout
- Push notifications
- Changing seed balances without Darren’s explicit say-so

---

## 8. Ready-to-paste prompt for Grok Build → Hank

Copy everything inside the fence below into a Grok Build session that has the Hank repo open.

```
Prime Hank. Integrate Castle Fund V2 features into the EXISTING Hank app (Cloudflare Worker + static HTML/JS). Do NOT replace the Hank stack with a new React app. Do NOT wipe live KV balances.

Source of truth for what to build:
- docs/Castle-Fund-V2-Standalone-Build.md
- Existing: castle.js, worker.js castle:* routes, dagvald.html, davikja.html, castle.html

Preserve the core loop:
kid logs chore → pending → parent 4-digit PIN approve/decline → balance/buckets update.

Implement these upgrades in Hank (port behavior, adapt to current code style):

1) Extend castle:bundle payload with:
   - progress per kid: { xp, level, lessonsUnlocked[], workDays[{day,checkedIn,choresDone}], lastCheckIn? }
   - settings.competitionVisible (default true)
   On load, default missing fields so old bundles still work.

2) Daily hard-work loop
   - Work-day check-in button on kid page (once per chore-day, ~4am rollover like existing choreDay)
   - +10 XP on check-in
   - Streaks count check-in days and approved earn days
   - Show work totals: today / week / month / all-time (chore count + $ earned from approved chores)

3) XP + levels
   - Approved chore XP = 15 + min(40, round(price))
   - Level curve: need = 100 + (level-1)*50 per level (same as the doc)
   - Unlock money lessons by level

4) Money lessons UI
   - Port the 8 lessons from the doc (ids lesson-work … lesson-give)
   - Kid can open unlocked lessons; locked show required level

5) Wishlist search
   - Kid can search products (start with curated catalog + optional remote)
   - Add to wishlist / set as goal from results
   - Keep star-as-goal behavior

6) Parent dashboard (dedicated surface)
   - Approvals for BOTH kids in one place
   - PIN gate for approve/decline, catalog edit, config, deduct, interest, purchase
   - Toggle competition board visibility
   - Purchase wishlist item with ability to UPDATE the cost before deducting Spend
   - Keep existing deduct + Bank of Mom and Dad interest (idempotent per kid+month)

7) Competition Work arena
   - Friendly weekly leaderboard (approved chores this week, streak, level)
   - Hidden entirely when settings.competitionVisible is false

8) UX
   - Mobile-first, large tap targets, no horizontal overflow
   - Prefer lucide/SVG icons over emoji chrome if you add new UI; match Hank green ranch aesthetic
   - Toast/confetti feedback on log + approve is fine

9) Ship
   - Wire Worker API routes next to existing /api/castle/* handlers
   - Update dagvald/davikja/castle pages + castle.js
   - Deploy Worker + assets
   - Verify: log chore → approve with PIN → balance/buckets/XP update; check-in; search wishlist; hide competition; purchase with edited cost; interest still safe
   - Update hank-context.md LIVE STATE Castle line after verify
   - Do not redesign Equipment/Bible/Command Center

If anything conflicts with live family data, prefer non-destructive migration defaults.
```

---

## 9. Changelog

| Date | Note |
|------|------|
| 2026-07-28 | Standalone Castle Fund V2 built in Grok App Builder; this doc committed to Hank for integration. Hank production Castle code left intact. |
