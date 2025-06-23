# 🚀 VibeList

**Build waitlists that actually convert**

Hey! I'm Sumit, and I built VibeList because I was tired of seeing amazing products fail at launch just because they couldn't build hype properly. This platform lets you create beautiful waitlists that people actually want to join (and share with their friends).

[![Check it out live](https://img.shields.io/badge/Live-Demo-brightgreen)](https://www.vibe-list.com)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Powered by Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)

## Why I built this 🤔

I was 15 when I started working on my first startup idea. Spent months building the product, but when launch day came... crickets. Turns out, building anticipation is just as important as building the actual product.

After trying every waitlist tool out there (and spending way too much money), I realized they all sucked. They were either:

- Ugly as hell 😬
- Missing basic features
- Crazy expensive for what they offered
- Built by people who never actually launched anything

So I built VibeList. It's everything I wish existed when I was launching my first product.

## What makes it different ✨

### 🎨 **Actually looks good**

Most waitlist tools look like they're from 2010. VibeList has clean, modern designs that don't make your brand look amateur. I spent weeks perfecting the templates because first impressions matter.

### 📊 **Data that matters**

I don't just show you vanity metrics. You get:

- Real conversion rates (not just signup counts)
- Referral tracking (see who's actually sharing)
- Daily trends (spot patterns before they become problems)
- Export everything (your data, your rules)

### 🔧 **Built for builders**

- Custom fields for any data you need
- Webhook integrations (connect to literally anything)
- White-label options (remove my branding if you want)
- API access (build your own integrations)

### 💸 **Pricing that doesn't suck**

I remember being broke at 16. That's why there's a generous free tier and fair pricing after that.

## Tech stuff (for the nerds) 🤓

I built this with:

**Frontend**

- Next.js 14 (App Router because I'm not a monster)
- Tailwind CSS (utility-first or die)
- DaisyUI (for components that don't look terrible)
- Some custom animations (because why not?)

**Backend**

- Supabase (PostgreSQL that doesn't make me cry)
- Row Level Security (your data is actually secure)
- Real-time everything (updates without refreshing like it's 2024)

**Payments**

- Stripe (obviously)
- Webhooks that actually work (spent way too long debugging this)
- Subscription management that doesn't break

**Hosting**

- Vercel (deploys in seconds, not hours)
- Global CDN (fast everywhere, not just Silicon Valley)

## Getting started 🏃‍♂️

Want to run this locally? Cool, here's how:

### What you need

- Node.js 18+ (use nvm if you're smart)
- A Supabase account (free tier works fine)
- Stripe account (also free to start)

### Setup

1. **Clone it**

   ```bash
   git clone https://github.com/DaInfernalCoder/vibelist.git
   cd vibelist
   ```

2. **Install stuff**

   ```bash
   npm install
   # grab some coffee, this takes a minute
   ```

3. **Environment variables**
   Copy `.env.example` to `.env.local` and fill it out:

   ```env
   # Supabase (get these from your dashboard)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key

   # Stripe (test keys are fine for dev)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   # Your app URL
   NEXT_PUBLIC_URL=http://localhost:3000
   ```

4. **Database setup**
   Run the migrations in `/supabase/migrations/` in your Supabase dashboard. Or use the CLI if you're fancy.

5. **Start it up**

   ```bash
   npm run dev
   ```

6. **Check it out**
   Go to [localhost:3000](http://localhost:3000) and see the magic happen

## How to use it 📱

### Creating your first waitlist

1. Sign up (duh)
2. Hit "Create Waitlist"
3. Pick a template or start from scratch
4. Customize everything (colors, logo, copy)
5. Add any custom fields you need
6. Publish and start sharing

### Managing signups

- Dashboard shows everything in real-time
- Export your data anytime (CSV format)
- Send updates to your list (coming soon: email sequences)
- Track where signups come from

## Pricing 💰

I tried to make this fair. I remember being broke.

| Plan           | Price      | What you get                                                          |
| -------------- | ---------- | --------------------------------------------------------------------- |
| **Free**       | $0         | 1 waitlist, 100 signups, basic analytics (perfect for testing ideas)  |
| **Pro**        | $29/month  | Unlimited waitlists, 10K signups, advanced analytics, custom branding |
| **Enterprise** | Let's talk | White-label, priority support, custom features                        |

[Full pricing details](https://www.vibe-list.com/pricing)

## Want to contribute? 🤝

This is open source because I believe good tools should be accessible. If you want to help:

1. Fork it
2. Make it better
3. Send a PR
4. I'll probably merge it (unless it breaks everything)

### Ideas I'm working on

- [ ] Email sequences (automated drip campaigns)
- [ ] A/B testing for waitlist pages
- [ ] Mobile app (React Native probably)
- [ ] More integrations (Zapier, etc.)
- [ ] AI-powered copy suggestions (because why not)
- [ ] Multi-language support

## Found a bug? 🐛

Open an issue and I'll fix it. Seriously. Include:

- What happened
- What you expected
- How to reproduce it
- Screenshots help

## The boring legal stuff 📄

MIT License. Use it, modify it, sell it, whatever. Just don't sue me.

## Shoutouts 🙏

- Next.js team for making React not terrible
- Supabase for making databases fun again
- Stripe for handling payments so I don't have to
- My parents for not freaking out when I said I was building a company instead of focusing on school
- Everyone who gave feedback on early versions

## Get in touch 📬

- Email: sumit@vibe-list.com (I actually read these)
- Twitter: [@DaInfernalCoder](https://twitter.com/DaInfernalCoder) (mostly memes and dev updates)
- Discord: [Join the community](https://discord.gg/vibelist) (when I have time to set it up)

---

Built with way too much caffeine by a teenager who probably should be doing homework.

[Website](https://www.vibe-list.com) • [Twitter](https://twitter.com/DaInfernalCoder) • [Email](mailto:sumit@vibe-list.com)
