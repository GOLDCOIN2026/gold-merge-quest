## Goal

Add Firebase **Auth** and a real **global leaderboard** to Gold Coin Merge Quest, and ship the game as a **Telegram Mini App** with a companion **bot** for invites and reminders.

---

## 1. Firebase setup (client SDK only)

You'll reuse the same Firebase project as your main app. Since the web config keys are publishable, they live in the codebase — no Lovable Cloud needed.

**You provide** (from Firebase Console → Project settings → Your apps → Web):
- `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`

**In Firebase Console you enable:**
- Authentication → Sign-in method → **Anonymous** (for Telegram users) and **Google** (for web players)
- Firestore Database → create in production mode

**Files added:**
```text
src/lib/firebase.ts          // initializeApp, getAuth, getFirestore
src/lib/auth.ts              // signInAnonymously, signInWithGoogle, onAuthStateChanged
src/lib/leaderboard.ts       // submitScore(), subscribeTopPlayers()
```

`bun add firebase`

---

## 2. Auth flow

- On app boot: subscribe to `onAuthStateChanged`. If no user, sign in anonymously so every player has a stable `uid` immediately.
- Inside Telegram: use Telegram's `initDataUnsafe.user` to set the player's `displayName` + `photoUrl` on the Firebase profile.
- On the web: show an optional "Sign in with Google" button in the Main Menu so progress can survive across devices.
- Auth state is mirrored into the Zustand store (`useGame`) as `authUid`, `displayName`, `photoUrl`.

---

## 3. Firestore leaderboard

Single collection, one doc per player keyed by uid.

```text
leaderboards/global/{uid}
  uid: string
  name: string
  photo: string | null
  tokens: number          // total Gold Tokens earned
  level: number
  updatedAt: serverTimestamp
  source: "web" | "telegram"
```

**Write path:** `submitScore()` is called whenever `tokens` increases (debounced ~3s) using `setDoc(..., { merge: true })`.

**Read path:** `LeaderboardButton` modal subscribes to `query(coll, orderBy("tokens","desc"), limit(50))` via `onSnapshot` for live updates. Current user's row is highlighted; if not in top 50, their rank is shown as a pinned row at the bottom (computed via a count query).

**Security rules** (added to `firestore.rules` — you paste into Firebase Console):
```text
match /leaderboards/global/{uid} {
  allow read: if true;
  allow write: if request.auth != null
               && request.auth.uid == uid
               && request.resource.data.tokens is number
               && request.resource.data.tokens >= 0;
}
```
You picked the simple "client writes directly" model — fast to ship, trivially cheatable. Easy to harden later by moving writes behind an Edge Function.

---

## 4. Telegram Mini App

A Mini App is just your existing web URL launched inside Telegram. We'll add the SDK and adapt the UI when running in Telegram.

**Setup with @BotFather** (you do this):
1. `/newbot` → get bot token (e.g. `GoldCoinMergeBot`)
2. `/newapp` → attach a Mini App to the bot, point it at your published URL: `https://gold-merge-quest.lovable.app`
3. `/setmenubutton` → "Play" → same URL

**Code changes:**
- Add `<script src="https://telegram.org/js/telegram-web-app.js">` to `index.html`
- New `src/lib/telegram.ts`:
  - `isTelegram()` — detects `window.Telegram?.WebApp`
  - `initTelegram()` — calls `WebApp.ready()`, `WebApp.expand()`, applies theme colors to CSS vars
  - Returns `{ user, initData }` for auth
  - Wraps `WebApp.HapticFeedback` for merge/sell taps
  - `WebApp.MainButton` used for the **Claim Reward** CTA when in Telegram
- `InviteButton` switches to `WebApp.openTelegramLink('https://t.me/share/url?url=...')` when inside Telegram — native referral share.
- `ClaimRewardButton`'s "Proceed" link uses `WebApp.openLink('https://goldcoinweb3.com/')` so it opens in the in-app browser.

---

## 5. Telegram bot (notifications + referrals)

The bot lives separately from the game. Since you don't want Lovable Cloud, two equally simple options:

**Option A — Reuse your main project's backend** (recommended if it's already running): expose one HTTP endpoint there that the game calls when a player wants to share or claim a streak; the backend uses `sendMessage` via Bot API.

**Option B — Lightweight Cloudflare Worker / your existing server**: a single file with two endpoints:
- `POST /share` — given `{ uid, refCode }`, returns a `t.me/GoldCoinMergeBot?start=ref_<code>` URL
- `POST /notify` — sends "Your spawns are full, come collect!" via `sendMessage`

The bot itself only needs to handle `/start ref_<code>` to credit referrals (writes a row to the same `leaderboards/global/{uid}` doc's `referredBy` field).

If you'd rather not stand up any server, the Telegram Mini App + Firebase combo still works end-to-end — you just lose outbound push notifications.

---

## 6. UI touch-ups

- `MainMenu`: add a small avatar + name pill (top-right) once auth resolves. "Sign in with Google" button under "Play" on web only.
- `LeaderboardButton`: replace the current mock list with the live Firestore subscription. Shows rank, avatar, name, token count, and a 👑 badge for the top 3.
- `InviteButton`: in Telegram, opens native share sheet; on web, copies `?ref=<uid>` link to clipboard (current behavior).

---

## Technical details

- **No secrets needed in Lovable** — Firebase web config is public; bot token lives only on whatever server runs the bot.
- **Persistence:** local `localStorage` save remains the source of truth for board state. Firestore only stores the leaderboard summary. (We can add full cloud-save later if you want.)
- **Anonymous → Google upgrade:** use `linkWithPopup(GoogleAuthProvider)` so progress carries over without losing the uid.
- **Score debounce:** `submitScore` uses a 3s trailing debounce + a `pagehide` flush so we don't hammer Firestore on every sell.
- **Telegram detection** is checked once at boot; the rest of the app reads `useGame(s => s.platform)` (`"web" | "telegram"`).

---

## What I need from you to start building

1. The 6 Firebase web config values (paste them in chat).
2. Confirmation you've enabled **Anonymous** + **Google** providers in Firebase Auth.
3. Your BotFather bot username (so I can hard-code share links). The bot token only matters if you want me to scaffold Option B server code.
