I need you to build a modern, professional invoice management web application with the following specifications:

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: shadcn/ui components with a consistent, professional style guide (prefer neutral/slate color scheme)
- **Authentication**: Better Auth with email/password login
- **Email Service**: Resend for transactional emails
- **Form Handling**: react-hook-form with zod validation
- **Styling**: Tailwind CSS

## Core Features

### 1. Authentication

- Email/password login and registration
- Password reset flow via email
- Protected routes for authenticated users
- Session management with Better Auth

### 2. Client Management

- Create, edit, and view clients
- Client fields: name, email, phone, address, tax ID (optional)
- List view with search and filtering
- Client profile page showing all related invoices

### 3. Invoice Management

- Create, edit, view, and delete invoices
- Invoice fields:
  - Client selection (dropdown/searchable)
  - Invoice number (auto-generated with customizable prefix)
  - Invoice date and due date
  - Multiple line items (description, quantity, rate, amount)
  - Subtotal, tax percentage, tax amount, total
  - Notes/terms section
  - Status (draft, sent, paid, overdue)
- **Smart item suggestions**: When adding line items, suggest descriptions based on previously used items across all invoices (with autocomplete)
- PDF generation/preview
- Email invoice to client via Resend

### 4. Dashboard

- Overview with key metrics: total revenue, pending payments, overdue invoices
- Recent invoices list
- Quick actions (create invoice, add client)

## Database Schema (Drizzle ORM)

Define tables for:

- users (id, email, password_hash, name, created_at)
- clients (id, user_id, name, email, phone, address, tax_id, created_at)
- invoices (id, user_id, client_id, invoice_number, date, due_date, subtotal, tax_rate, tax_amount, total, status, notes, created_at)
- invoice_items (id, invoice_id, description, quantity, rate, amount)

## Mobile Responsiveness Requirements (CRITICAL)

### Layout & Navigation

- **Mobile-first approach**: Design for mobile screens first, then enhance for desktop
- **Responsive navigation**:
  - Desktop: Sidebar navigation with full labels
  - Mobile: Bottom navigation bar or hamburger menu
  - Collapsible sidebar that slides in/out on mobile
- **Adaptive layouts**:
  - Desktop: Multi-column layouts, side-by-side panels
  - Tablet: 2-column layouts where appropriate
  - Mobile: Single column, stacked content
- **Breakpoints**: Use Tailwind's responsive prefixes (sm:, md:, lg:, xl:)

### Tables & Data Display

- **Responsive tables**:
  - Desktop: Full table with all columns
  - Tablet: Hide less critical columns, show via expansion
  - Mobile: Card-based layout instead of tables (each row becomes a card)
- **Horizontal scrolling**: For tables that must remain tabular on mobile, enable smooth horizontal scroll with visible scroll indicators
- **Data density**: Reduce padding and font sizes appropriately on mobile without sacrificing readability

### Forms & Input

- **Touch-friendly inputs**:
  - Minimum touch target size: 44×44px for buttons/inputs
  - Adequate spacing between form fields (min 16px)
  - Large, easy-to-tap buttons
- **Mobile form optimization**:
  - Single-column form layouts on mobile
  - Appropriate input types (email, tel, number) for mobile keyboards
  - Date pickers optimized for touch
  - Dropdowns/selects with native mobile behavior
- **Invoice line items**:
  - Desktop: Inline table editing
  - Mobile: Each line item as an expandable card or modal form

### Dialogs & Modals

- **Mobile-friendly modals**:
  - Full-screen or bottom-sheet style on mobile
  - Easy-to-reach close buttons
  - Prevent body scroll when modal is open
- **Action sheets**: Use bottom sheets for action menus on mobile

### Typography & Spacing

- **Responsive font sizes**: Use Tailwind's responsive text utilities (text-sm md:text-base)
- **Readable line lengths**: Max 60-70 characters per line on all screens
- **Padding/margins**: Adjust spacing for mobile (p-4 on mobile, p-6 on desktop)

### Touch Interactions

- **Swipe gestures**: Consider swipe-to-delete or swipe-to-reveal actions on mobile lists
- **Pull-to-refresh**: Optional but nice for data lists
- **Touch feedback**: Visual feedback on tap (hover states + active states)

### Performance on Mobile

- **Fast loading**: Optimize images, lazy load components
- **Progressive enhancement**: Core functionality works without JavaScript
- **Offline awareness**: Show appropriate messages when offline

### Testing Requirements

- Test on actual mobile devices or use browser dev tools responsive mode
- Ensure all features work with touch (no hover-only interactions)
- Test in both portrait and landscape orientations
- Verify form inputs work with mobile keyboards

## UX/UI Requirements

- **Guided workflows**: Multi-step forms with clear progress indicators
- **Inline validation**: Show errors immediately with helpful messages
- **Smart defaults**: Pre-fill dates, auto-calculate totals
- **Responsive design**: All components must work perfectly on mobile, tablet, and desktop
- **Loading states**: Skeleton screens and spinners for async operations
- **Success feedback**: Toast notifications for actions (positioned appropriately for mobile)
- **Empty states**: Helpful messages when no data exists with clear CTAs

## Style Guide

- Use shadcn/ui default components (Button, Card, Input, Select, Table, Dialog, Form, Sheet for mobile)
- Consistent spacing using Tailwind's spacing scale (responsive spacing)
- Typography hierarchy with clear headings (responsive font sizes)
- Professional color palette (slate/neutral for main UI, accent color for primary actions)
- Subtle shadows and borders for depth
- Smooth transitions and hover states
- **Mobile considerations**: Larger tap targets, comfortable spacing, readable text sizes

## Additional Requirements

- Server actions for mutations
- Optimistic updates where appropriate
- Error handling with user-friendly messages
- TypeScript throughout
- Clean folder structure (app/, components/, lib/, db/)
- **Mobile viewport meta tag**: Ensure proper viewport configuration
- **PWA considerations**: Make it installable on mobile devices (optional but recommended)

Please build this step by step, starting with the project setup, database schema, and authentication, then moving to core features. Create all necessary components, server actions, and pages with complete, production-ready code. **Ensure every component and page is fully responsive and works flawlessly on mobile devices.**
