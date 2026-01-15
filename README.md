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
- **Drag & Drop:** dnd-kit

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
AUTH0_SECRET=           # Min 32 chars, used to encrypt session cookie
AUTH0_BASE_URL=         # Your app URL (e.g., http://localhost:3000)
AUTH0_ISSUER_BASE_URL=  # Auth0 tenant URL (e.g., https://your-tenant.auth0.com)
AUTH0_CLIENT_ID=        # Auth0 application Client ID
AUTH0_CLIENT_SECRET=    # Auth0 application Client Secret
API_URL=                # Backend API URL
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
│   ├── (protected)/           # Authenticated routes with sidebar
│   │   └── organizations/
│   │       └── [organizationId]/
│   │           ├── ai-search/ # AI-powered search
│   │           ├── lists/     # Custom lists management
│   │           ├── records/   # People & companies records
│   │           └── searches/  # Saved searches
│   ├── api/                   # API routes
│   │   ├── authentication/    # Auth endpoints
│   │   ├── organizations/     # Organization APIs
│   │   ├── people/            # People search APIs
│   │   └── companies/         # Companies search APIs
│   ├── auth/                  # Auth0 routes
│   └── organizations/         # Public org pages
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── companies/             # Company-specific components
│   ├── people/                # People-specific components
│   └── lists/                 # List management components
├── contexts/                  # React Context providers
├── hooks/                     # Custom React hooks
└── lib/                       # Utilities and configurations
```

## Features

- **AI Search:** Natural language search for people and companies
- **Lists:** Create and manage custom lists of contacts
- **Records:** View and manage saved people and company records
- **Organization Management:** Multi-tenant support with domain-based routing

## Authentication

The application uses Auth0 with Universal Login. Sign-up is disabled and managed via backoffice. Users are associated with organizations based on their email domain.

## License

MIT License - see [LICENSE](LICENSE) for details.
