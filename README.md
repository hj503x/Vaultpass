# VaultPass

> **The premium communication layer for high-value people.**

A paid messaging platform where receivers set the price to their inbox — filtering noise and ensuring only serious, intentional messages get through.

---

## How It Works

1. **Receiver** signs up and sets their message price ($10, $50, $500...)
2. **Sender** finds their profile, pays the fee, writes their message
3. **Message delivered** to the receiver's private inbox
4. **Replies are free** — payment is for delivery only, not locking anyone in
5. **Receiver keeps no money** — they get quality conversations. The platform takes the fee.

---

## Running on GitHub Pages

### Quick Deploy

1. Fork or upload this repo to GitHub
2. Go to **Settings → Pages**
3. Set source to `main` branch, root folder `/`
4. Save — your site will be live at `https://yourusername.github.io/repo-name/`

### File Structure

```
/
├── index.html        ← Landing page
├── login.html        ← Sign in
├── signup.html       ← Create account
├── dashboard.html    ← Inbox (receiver view)
├── discover.html     ← Browse profiles
├── profile.html      ← Public profile + send message
├── settings.html     ← Account settings
├── css/
│   └── style.css     ← Design system
└── js/
    └── vault.js      ← Core logic + localStorage
```

### No Backend Required

All data is stored in **localStorage** — works 100% on GitHub Pages with no server needed.

> ⚠️ **localStorage is per-browser.** Accounts created on one device won't appear on another. When you integrate a real backend (Firebase, Supabase, etc.), replace the storage methods in `vault.js`.

---

## Demo Accounts

Pre-seeded demo accounts to test the app:

| Name | Email | Password | Price |
|------|-------|----------|-------|
| Alex Rivera | alex@demo.com | demo123 | $50 |
| Maya Chen | maya@demo.com | demo123 | $100 |
| Jordan Blake | jordan@demo.com | demo123 | $250 |

---

## Adding Real Payments (Stripe)

Replace the simulated payment flow in `profile.html` with Stripe Checkout:

```javascript
// In profile.html submitMessage(), replace the setTimeout simulation with:
const stripe = Stripe('your_publishable_key');
const session = await fetch('/create-checkout-session', {
  method: 'POST',
  body: JSON.stringify({ amount: price * 100, receiverId })
});
const { sessionId } = await session.json();
await stripe.redirectToCheckout({ sessionId });
```

You'll need a small backend (Node.js/Express or Netlify Functions) to create Stripe sessions.

---

## Roadmap to Production

- [ ] Real backend (Firebase/Supabase/Node)
- [ ] Stripe payment integration
- [ ] Email notifications on new messages
- [ ] Message preview / reply via email
- [ ] Profile verification badges
- [ ] Analytics dashboard for receivers
- [ ] Webhook for payment confirmation

---

## Tech Stack

- Pure **HTML + CSS + JavaScript** (no frameworks)
- **localStorage** for data persistence
- **Google Fonts** (Cormorant Garamond + Syne + JetBrains Mono)
- GitHub Pages compatible — zero build step

---

*Built with VaultPass — where your attention finally has a price.*
