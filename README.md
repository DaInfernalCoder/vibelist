# 🎯 VibeList

**The Ultimate Waitlist Management Platform**

Create beautiful, customizable waitlists for your products and services. Capture leads, build anticipation, and convert signups into customers with powerful analytics and seamless integrations.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://www.vibe-list.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-purple)](https://stripe.com/)

## ✨ Features

### 🎨 **Beautiful Waitlist Creation**

- **Drag & Drop Builder**: Create stunning waitlists without coding
- **Custom Themes**: Choose from professional templates or create your own
- **Brand Customization**: Upload logos, set colors, and match your brand
- **Mobile Responsive**: Perfect on all devices

### 📊 **Powerful Analytics**

- **Real-time Dashboard**: Track signups, conversions, and engagement
- **Referral Tracking**: Monitor viral growth and referral sources
- **Daily/Weekly Reports**: Understand your audience trends
- **Export Data**: Download your leads anytime

### 🚀 **Advanced Features**

- **Custom Fields**: Collect exactly the data you need
- **Email Integration**: Automated welcome and update emails
- **Social Sharing**: Built-in viral mechanics
- **API Access**: Integrate with your existing tools
- **White-label Options**: Remove VibeList branding (Pro plan)

### 🔒 **Enterprise Ready**

- **GDPR Compliant**: Privacy-first data handling
- **SSO Integration**: Enterprise authentication
- **Team Management**: Collaborate with your team
- **Priority Support**: Get help when you need it

## 🏗️ Tech Stack

**Frontend**

- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **DaisyUI** - Beautiful component library
- **Framer Motion** - Smooth animations

**Backend**

- **Supabase** - PostgreSQL database with real-time features
- **Row Level Security** - Secure data access
- **Edge Functions** - Serverless API endpoints
- **Real-time Subscriptions** - Live data updates

**Payments & Auth**

- **Stripe** - Secure payment processing
- **Supabase Auth** - User authentication
- **Webhook Processing** - Automated subscription management

**Deployment**

- **Vercel** - Edge deployment platform
- **CDN** - Global content delivery
- **SSL** - Secure connections

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (for payments)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/vibelist.git
   cd vibelist
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret

   # App
   NEXT_PUBLIC_URL=http://localhost:3000
   ```

4. **Run database migrations**

   ```bash
   npm run db:migrate
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Usage

### Creating Your First Waitlist

1. **Sign up** for a VibeList account
2. **Click "Create Waitlist"** from your dashboard
3. **Customize your design** using our visual editor
4. **Add your content** and configure settings
5. **Publish & share** your waitlist URL

### Managing Signups

- **View Analytics**: Monitor signups in real-time
- **Export Data**: Download CSV of all signups
- **Send Updates**: Email your waitlist subscribers
- **Track Referrals**: See which sources drive the most signups

## 🎯 Pricing

| Plan           | Price     | Features                                                              |
| -------------- | --------- | --------------------------------------------------------------------- |
| **Starter**    | Free      | 1 waitlist, 100 signups, Basic analytics                              |
| **Pro**        | $29/month | Unlimited waitlists, 10K signups, Advanced analytics, Custom branding |
| **Enterprise** | Custom    | White-label, SSO, Priority support, Custom integrations               |

[View detailed pricing →](https://www.vibe-list.com/pricing)

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL migrations in `/supabase/migrations/`
3. Set up Row Level Security policies
4. Configure authentication providers

### Stripe Integration

1. Create Stripe products and prices
2. Set up webhook endpoints
3. Configure subscription plans in `config.js`
4. Test payment flows

### Email Configuration

1. Set up Resend account
2. Configure email templates
3. Set up automated sequences

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📊 Roadmap

- [ ] **Advanced Analytics** - Cohort analysis, funnel tracking
- [ ] **Integration Hub** - Zapier, Webhooks, API marketplace
- [ ] **A/B Testing** - Test different waitlist variations
- [ ] **Mobile App** - Native iOS/Android apps
- [ ] **AI Features** - Smart content suggestions
- [ ] **Multi-language** - International support

## 🐛 Bug Reports

Found a bug? Please open an issue with:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** team for the amazing framework
- **Supabase** for the backend infrastructure
- **Stripe** for secure payment processing
- **Vercel** for seamless deployment
- **Open source community** for inspiration and tools

## 📞 Support

- **Documentation**: [docs.vibe-list.com](https://docs.vibe-list.com)
- **Email**: support@vibe-list.com
- **Twitter**: [@vibelist](https://twitter.com/vibelist)
- **Discord**: [Join our community](https://discord.gg/vibelist)

---

**Built with ❤️ by the VibeList team**

[Website](https://www.vibe-list.com) • [Twitter](https://twitter.com/vibelist) • [Blog](https://www.vibe-list.com/blog) • [Changelog](https://www.vibe-list.com/changelog)
