# Farahty Invoicy - Invoice Management Application

A modern, professional, bilingual (Arabic/English) invoice management web application with multi-tenant organization support.

## Tech Stack

- **Framework**: Next.js 16+ (App Router with Turbopack)
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **UI**: shadcn/ui components with Tailwind CSS v4
- **Authentication**: Better Auth with email/password and organization plugin
- **Email Service**: Resend for transactional emails
- **Form Handling**: react-hook-form with Zod validation
- **Internationalization**: next-intl (Arabic RTL + English LTR)
- **PDF Generation**: @react-pdf/renderer
- **Deployment**: Docker with standalone output mode

## Features

### 1. Authentication & Authorization

- [x] Email/password registration and login
- [x] Password reset flow via email
- [x] Protected routes with middleware
- [x] Session management with Better Auth
- [x] Organization-based multi-tenancy
- [x] Member invitations with email notifications
- [x] Role-based access (owner, admin, member)

### 2. Organization Management

- [x] Create and manage organizations
- [x] Organization settings (name, logo, address, phone, email, tax ID)
- [x] Invoice prefix and numbering per organization
- [x] Invite team members via email
- [x] Accept/decline invitation flow (works for logged-in and new users)
- [x] Organization switcher in sidebar
- [x] Member management (view, remove members)
- [x] Automatic organization activation on invitation acceptance

### 3. Client Management

- [x] Create, edit, view, and delete clients
- [x] Client fields: name, email, phone, address, city, country, tax ID, notes
- [x] Client balance tracking
- [x] List view with search functionality
- [x] Client profile page showing all related invoices
- [x] Responsive card layout on mobile

### 4. Invoice Management

- [x] Create, edit, view, and delete invoices
- [x] Invoice fields:
  - Client selection (searchable dropdown)
  - Auto-generated invoice number with customizable prefix
  - Invoice date and due date
  - Multiple line items (description, quantity, rate, amount)
  - Subtotal, tax percentage, tax amount, total
  - Notes and terms sections
  - Status tracking (draft, sent, partial, paid, overdue, cancelled)
- [x] **Smart item suggestions**: Autocomplete for descriptions based on previously used items
- [x] PDF generation with bilingual support (Arabic/English)
- [x] Email invoice to client via Resend
- [x] Copy invoice functionality
- [x] Invoice status management with actions

### 5. Payment Management

- [x] Record payments against invoices
- [x] Partial payment support
- [x] Payment methods: cash, card, bank transfer, check, other
- [x] Payment history per invoice
- [x] Delete payment functionality
- [x] Automatic invoice status updates (partial → paid)
- [x] Client balance updates on payment

### 6. Dashboard

- [x] Overview metrics:
  - Total revenue
  - Pending amount
  - Overdue invoices count
  - Partial payments count
  - Total invoices
  - Total clients
- [x] Recent invoices list
- [x] Quick actions (create invoice, add client)
- [x] Responsive grid layout

### 7. Activity Log / Audit Trail

- [x] Track all entity changes:
  - Created, updated, deleted actions
  - Status changes
  - Payment recordings
- [x] Entity types: client, invoice, payment, organization, member
- [x] Store previous and new values for changes
- [x] IP address and user agent tracking
- [x] Activity page with filtering by entity type and date range
- [x] Entity-specific activity (view activity on invoice/client detail pages)
- [x] User attribution for all actions

### 8. Internationalization (i18n)

- [x] Full Arabic (RTL) and English (LTR) support
- [x] Language switcher in sidebar
- [x] Translated UI components
- [x] RTL-aware layouts and components
- [x] Bilingual PDF invoices
- [x] Date formatting per locale

### 9. Theme Support

- [x] Light and dark mode
- [x] System preference detection
- [x] Theme toggle in sidebar
- [x] Consistent theming across all components

## Database Schema

### Core Tables

- **users**: id, name, email, emailVerified, image, createdAt, updatedAt, legacy company fields
- **sessions**: id, expiresAt, token, userId, activeOrganizationId, ipAddress, userAgent
- **accounts**: id, accountId, providerId, userId, tokens, createdAt, updatedAt
- **verifications**: id, identifier, value, expiresAt

### Organization Tables

- **organizations**: id, name, slug, logo, metadata, address, phone, email, taxId, invoicePrefix, invoiceNextNumber
- **members**: id, userId, organizationId, role, createdAt
- **invitations**: id, email, inviterId, organizationId, role, status, expiresAt

### Application Tables

- **clients**: id, userId, organizationId, name, email, phone, address, city, country, taxId, notes, balance, createdAt, updatedAt
- **invoices**: id, userId, organizationId, clientId, invoiceNumber, date, dueDate, subtotal, taxRate, taxAmount, total, amountPaid, balanceDue, status, notes, terms, sentAt, paidAt, createdAt, updatedAt
- **invoice_items**: id, invoiceId, description, quantity, rate, amount, sortOrder
- **payments**: id, invoiceId, organizationId, amount, paymentDate, paymentMethod, reference, notes, createdBy, createdAt

### Audit Tables

- **activity_logs**: id, organizationId, userId, entityType, entityId, entityName, action, details, previousValues, newValues, ipAddress, userAgent, createdAt

## Mobile Responsiveness

### Implemented Features

- [x] Mobile-first responsive design
- [x] Collapsible sidebar with sheet overlay on mobile
- [x] Bottom-positioned action buttons on mobile
- [x] Card-based layouts instead of tables on mobile
- [x] Touch-friendly form inputs (44×44px minimum targets)
- [x] Single-column form layouts on mobile
- [x] Full-screen dialogs on mobile
- [x] Responsive typography and spacing
- [x] RTL-aware responsive layouts

### Component Adaptations

- Tables → Card lists on mobile
- Inline actions → Dropdown menus
- Side-by-side layouts → Stacked layouts
- Large modals → Full-screen sheets

## UI/UX Features

- [x] Loading states with spinners and skeletons
- [x] Toast notifications for actions (via Sonner)
- [x] Empty states with helpful CTAs
- [x] Inline form validation with Zod
- [x] Smart defaults (auto-fill dates, auto-calculate totals)
- [x] Confirmation dialogs for destructive actions
- [x] Optimistic updates where appropriate
- [x] Error handling with user-friendly messages

## Deployment

### Docker Configuration

- [x] Multi-stage Dockerfile (deps → builder → runner)
- [x] Standalone output mode for optimized builds
- [x] Docker Compose with environment variables
- [x] Support for build-time and runtime environment variables

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Authentication
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://your-domain.com

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Email
RESEND_API_KEY=...
EMAIL_FROM=noreply@your-domain.com
```

## Project Structure

```
├── app/
│   ├── (auth)/           # Login, register, password reset
│   ├── (dashboard)/      # Protected dashboard routes
│   ├── (invitation)/     # Invitation acceptance flow
│   ├── (onboarding)/     # New user onboarding
│   └── api/              # API routes (auth, PDF)
├── actions/              # Server actions
├── components/
│   ├── ui/               # shadcn/ui components (RTL-enhanced)
│   ├── activity/         # Activity log components
│   ├── clients/          # Client management
│   ├── dashboard/        # Dashboard widgets
│   ├── invoices/         # Invoice management
│   ├── layout/           # Sidebar, navigation
│   ├── organizations/    # Organization management
│   └── settings/         # Settings forms
├── db/                   # Drizzle schema and migrations
├── i18n/                 # Internationalization config
├── lib/                  # Utilities, auth config
├── messages/             # Translation files (ar.json, en.json)
└── public/               # Static assets
```

## Future Enhancements

- [ ] PWA support for mobile installation
- [ ] Offline mode with service workers
- [ ] Export functionality (CSV, Excel)
- [ ] Recurring invoices
- [ ] Client portal for invoice viewing/payment
- [ ] Dashboard analytics and charts
- [ ] Custom invoice templates
- [ ] Bulk invoice operations
- [ ] Email templates customization
- [ ] Webhook integrations
