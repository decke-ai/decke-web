# Decke Web

A modern web application for AI-powered people and company search, built with Next.js 16 and React 19.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui + Radix UI
- **Authentication:** Auth0
- **Analytics:** PostHog
- **Integrations:** Paragon (LinkedIn, WhatsApp)
- **Billing:** Stripe

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Auth0
AUTH0_SECRET=           # Min 32 chars, used to encrypt session cookie
AUTH0_BASE_URL=         # Your app URL (e.g., http://localhost:3000)
AUTH0_ISSUER_BASE_URL=  # Auth0 tenant URL (e.g., https://your-tenant.auth0.com)
AUTH0_CLIENT_ID=        # Auth0 application Client ID
AUTH0_CLIENT_SECRET=    # Auth0 application Client Secret
AUTH0_AUDIENCE=         # Auth0 API audience

# Backend
API_URL=                # Backend API URL (e.g., http://localhost:8000)

# Integrations
NEXT_PUBLIC_PARAGON_PROJECT_ID=  # Paragon project ID for third-party integrations

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=         # PostHog API key
NEXT_PUBLIC_POSTHOG_HOST=        # PostHog host URL
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

## Project Structure

```
decke-web/
├── app/
│   ├── (protected)/              # Authenticated routes with sidebar
│   │   └── organizations/
│   │       └── [organizationId]/
│   │           ├── integrations/ # Third-party integrations (LinkedIn, etc.)
│   │           ├── lists/        # Custom lists management
│   │           ├── records/      # People & companies records
│   │           └── searches/     # People & company search
│   ├── api/                      # API routes
│   │   ├── authentication/       # Auth endpoints (me, sign-up, onboarding)
│   │   └── organizations/
│   │       └── [organizationId]/
│   │           ├── companies/    # Company search & autocomplete
│   │           ├── people/       # People search & autocomplete
│   │           ├── lists/        # Lists CRUD
│   │           ├── records/      # Records CRUD
│   │           ├── meta/         # Meta Conversions API (CAPI)
│   │           └── paragon/      # Paragon integration tokens
│   ├── auth/                     # Auth0 routes (login, logout, callback)
│   └── organizations/            # Sign-up & onboarding pages
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── companies/                # Company-specific components
│   ├── people/                   # People-specific components
│   └── lists/                    # List management components
├── contexts/
│   └── auth-context.tsx          # Authentication context & hooks
├── hooks/
│   ├── use-meta-capi.ts          # Meta Conversions API hook
│   └── use-paragon.ts            # Paragon integrations hook
└── lib/
    ├── api.ts                    # API client utilities
    ├── auth0.ts                  # Auth0 configuration
    ├── explorium/                # Explorium types & field mappings
    └── meta/                     # Meta CAPI types & utilities
```

## Features

- **Search:** Search 200M+ contacts and companies with advanced filters
- **Lists:** Create and manage custom lists of leads
- **Records:** View and manage saved people and company records
- **Integrations:** Connect with LinkedIn, WhatsApp, and more via Paragon
- **Meta CAPI:** Server-side conversion tracking for marketing attribution
- **Subscriptions:** Stripe-based billing with trial support

## Authentication & Authorization

The application uses Auth0 with Universal Login. Users are associated with organizations based on their email domain.

### Auth Flow

1. User logs in via Auth0
2. Backend checks if organization exists for user's email domain
3. If no organization, user creates one during sign-up
4. Subscription status is verified (active or trialing)
5. User completes onboarding if not done

### Subscription States

- `active` - Paid subscription
- `trialing` - Trial period
- `canceled` - Subscription canceled
- `past_due` - Payment failed
- `grace_period` - Grace period after payment failure

Users without an active or trialing subscription are redirected to Stripe billing.

## API Integration

All external API calls are proxied through Next.js API routes with JWT authentication:

```
Frontend → /api/... → Backend API (api.decke.ai)
```

The backend handles integrations with:
- Explorium (people & company data)
- Stripe (billing)
- Meta (Conversions API)

## License

MIT License - see [LICENSE](LICENSE) for details.
