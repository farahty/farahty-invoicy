# Farahty - Invoice Management Application

A modern, full-featured invoice management application built with Next.js 14+, TypeScript, and Neon PostgreSQL.

![Farahty Invoice App](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?logo=tailwindcss)

## Features

### 📊 Dashboard

- Overview of key metrics (total revenue, pending invoices, paid invoices)
- Recent invoices list with quick actions
- Quick access buttons for common tasks

### 👥 Client Management

- Full CRUD operations for clients
- Client details with contact information
- View client's invoice history
- Search and filter clients

### 📝 Invoice Management

- Create, edit, and delete invoices
- Dynamic line items with auto-calculations
- Status tracking (Draft, Sent, Paid, Overdue, Cancelled)
- Mark invoices as paid
- Duplicate invoices
- Filter by status, search by number or client

### 📄 PDF Generation

- Professional invoice PDF generation
- Download invoices as PDF files
- Company branding support

### 📧 Email Integration

- Send invoices directly to clients via email
- Uses Resend for reliable email delivery
- Professional HTML email templates

### 🔐 Authentication

- Secure email/password authentication
- Password reset functionality
- Session management with auto-refresh

### ⚙️ Settings

- Company information configuration
- Invoice prefix customization
- Next invoice number management

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS v4
- **Forms**: React Hook Form + Zod
- **PDF**: @react-pdf/renderer
- **Email**: Resend

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm, npm, or yarn
- Neon PostgreSQL account

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd farahty-tailor
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Configure your `.env` file:

```env
# Database
DATABASE_URL=your-neon-database-url

# Authentication
BETTER_AUTH_SECRET=your-auth-secret
BETTER_AUTH_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
DEFAULT_FROM_EMAIL=no-reply@yourdomain.com
```

5. Push the database schema:

```bash
npm run db:push
```

6. Start the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
farahty-tailor/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   └── api/               # API routes
├── actions/               # Server actions
├── components/            # React components
│   ├── dashboard/        # Dashboard components
│   ├── clients/          # Client management components
│   ├── invoices/         # Invoice components
│   ├── layout/           # Layout components
│   ├── settings/         # Settings components
│   └── ui/               # shadcn/ui components
├── db/                    # Database schema and configuration
├── lib/                   # Utility functions and configurations
└── public/               # Static assets
```

## Database Schema

### Tables

- **users** - User accounts with company settings
- **sessions** - Authentication sessions
- **accounts** - OAuth accounts (for future expansion)
- **verifications** - Email verification tokens
- **clients** - Client information
- **invoices** - Invoice headers
- **invoice_items** - Invoice line items

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
npm run lint         # Run ESLint
```

## Environment Variables

| Variable             | Description                       | Required |
| -------------------- | --------------------------------- | -------- |
| `DATABASE_URL`       | Neon PostgreSQL connection string | Yes      |
| `BETTER_AUTH_SECRET` | Secret for session encryption     | Yes      |
| `BETTER_AUTH_URL`    | Base URL for authentication       | Yes      |
| `RESEND_API_KEY`     | Resend API key for emails         | Yes      |
| `DEFAULT_FROM_EMAIL` | Default sender email address      | Yes      |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Better Auth](https://www.better-auth.com/)
- [Neon](https://neon.tech/)
- [Resend](https://resend.com/)
