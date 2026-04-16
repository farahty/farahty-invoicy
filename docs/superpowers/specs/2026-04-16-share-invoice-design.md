# Share Invoice — Design

**Date:** 2026-04-16
**Status:** Approved (pre-implementation)

## Goal

Allow users to generate a public shareable link for any invoice, toggle its visibility on/off, and share it via WhatsApp or copy-to-clipboard. The public page shows a full read-only invoice with a "Download PDF" button. No login required for viewers.

## Non-goals

- Password-protected links.
- View tracking or analytics (who opened the link).
- Payment button on the public page.
- Changes to the existing email-send feature.
- Expiry dates — links are revocable but do not auto-expire.

## Decisions

| Question | Decision |
|---|---|
| Link lifetime | No expiry, but revocable via on/off toggle |
| Public page content | Full invoice (org header, client, items, totals, discount, notes/terms) + "Download PDF" button |
| Sharing channels | Copy Link + WhatsApp button |

## Data model

Two new columns on the existing `invoices` table (no new tables):

| Column | Type | Default | Notes |
|---|---|---|---|
| `shareToken` | `text` | `null` | Unique, nullable. A random URL-safe string generated via `nanoid(21)`. Created once on first share enable; reused on subsequent enables. |
| `isPublic` | `boolean` | `false` | Controls whether the public link is active. When `false`, the token exists but the public route returns 404. |

Index: unique index on `shareToken` (where not null) for fast lookup.

Migration: adds both columns with defaults. Existing invoices get `shareToken = null, isPublic = false` — no visible change.

## Routes

### Public invoice page

**Route:** `app/(public)/invoice/[token]/page.tsx`

Lives outside `(dashboard)` — no sidebar, no auth check. Uses a minimal layout (`app/(public)/layout.tsx`) with just the org branding and theme support.

**Logic:**
1. Look up invoice by `shareToken` where `isPublic === true`.
2. If not found or not public → `notFound()`.
3. Load the invoice with items, client, and organization relations.
4. Render a clean, read-only invoice view: org header, client "Bill To" block, items table, totals (with discount when non-zero), notes/terms.
5. "Download PDF" button links to the public PDF route.
6. Footer: "Powered by Invoicy" or the org name.

**Design:** Matches the existing invoice detail page's content section but in a standalone, centered layout (max-width ~800px, white card on subtle background). Bilingual: renders in the locale stored in the invoice's organization, or defaults to Arabic.

### Public PDF route

**Route:** `app/api/public/invoice/[token]/pdf/route.tsx`

Same Puppeteer HTML→PDF render as the existing authenticated route, but authenticated by token instead of session.

**Logic:**
1. Look up invoice by `shareToken` where `isPublic === true`.
2. If not found → 404.
3. Load invoice + client + org.
4. Call `renderInvoiceHtml(...)` + `renderHtmlToPdf(...)` (same functions as the authenticated route).
5. Return PDF with `Content-Disposition: inline`.

No rate limiting in this phase — the Puppeteer instance is already reused across requests.

## Server actions

File: `actions/invoices.ts` (extend existing, no new file).

### `enableSharing(invoiceId)`

```
requireOrgAuth() → verify invoice ownership →
  if shareToken is null: generate nanoid(21), set shareToken + isPublic = true
  else: set isPublic = true (reuse existing token)
→ return { success: true, shareUrl: buildPublicUrl(shareToken) }
```

Logs activity: `action: "updated"`, `details: { sharingEnabled: true }`.

### `disableSharing(invoiceId)`

```
requireOrgAuth() → verify invoice ownership →
  set isPublic = false (keep shareToken)
→ return { success: true }
```

Logs activity: `action: "updated"`, `details: { sharingDisabled: true }`.

### `buildPublicUrl(token)`

Helper (not a server action): `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${token}`.

## UI — Invoice detail page

### Share section

A new card or section in the invoice detail sidebar (alongside the existing Client Info and Payments cards), or inline buttons in the header area.

**When `isPublic === false` (or `shareToken` is null):**
- A single "Share" button that calls `enableSharing()`.
- Or a toggle switch labelled "Public Link" in off state.

**When `isPublic === true`:**
- Toggle switch in on state.
- The public URL displayed in a readonly input (truncated with full URL on hover/focus).
- "Copy Link" button — copies URL to clipboard, shows toast "Link copied".
- "WhatsApp" button — opens `https://wa.me/?text={encodedMessage}` in a new tab. Message template: `Invoice {invoiceNumber} from {orgName}: {shareUrl}`. URL-encoded.
- "Disable" / toggling off calls `disableSharing()`.

**Components:**
- `components/invoices/share-invoice.tsx` — client component. Props: `invoice` (needs `id`, `invoiceNumber`, `shareToken`, `isPublic`), `organizationName`.

## Translations

New keys in `messages/{en,ar}.json` under `invoices`:

| Key | English | Arabic |
|---|---|---|
| `share` | Share | مشاركة |
| `publicLink` | Public Link | رابط عام |
| `enableSharing` | Enable sharing to get a public link | فعّل المشاركة للحصول على رابط عام |
| `linkCopied` | Link copied to clipboard | تم نسخ الرابط |
| `copyLink` | Copy Link | نسخ الرابط |
| `shareWhatsApp` | WhatsApp | واتساب |
| `shareMessage` | Invoice {number} from {org} | فاتورة {number} من {org} |
| `disableSharing` | Disable sharing | إيقاف المشاركة |
| `publicInvoice` | Invoice | فاتورة |
| `downloadPdf` | Download PDF | تحميل PDF |
| `poweredBy` | Powered by | مدعوم من |

## Activity logging

Reuse existing `action: "updated"` on the invoice entity. The `details` object carries `sharingEnabled: true` or `sharingDisabled: true` so the activity feed can render "enabled public link" / "disabled public link".

No new `ActivityAction` enum value needed.

## Touched files

### New files

| File | Purpose |
|---|---|
| `app/(public)/layout.tsx` | Minimal public layout (no sidebar, no auth) |
| `app/(public)/invoice/[token]/page.tsx` | Public invoice view |
| `app/api/public/invoice/[token]/pdf/route.tsx` | Public PDF download |
| `components/invoices/share-invoice.tsx` | Share toggle + copy link + WhatsApp buttons |

### Modified files

| File | Change |
|---|---|
| `db/schema.ts` | Add `shareToken` + `isPublic` columns, unique index |
| `db/migrations/0004_*.sql` | Generated migration |
| `actions/invoices.ts` | Add `enableSharing`, `disableSharing` |
| `app/(dashboard)/invoices/[id]/page.tsx` | Render `ShareInvoice` component |
| `messages/en.json` | Add share-related keys |
| `messages/ar.json` | Same keys in Arabic |
| `package.json` | Add `nanoid` dependency |

## Dependencies

- `nanoid` — lightweight, URL-safe ID generator. ~130 bytes gzipped. Used only for token generation.

## Success criteria

1. Enabling sharing generates a public URL. Opening the URL (in incognito, no login) shows the full invoice.
2. The "Download PDF" button on the public page returns a valid PDF matching the authenticated version.
3. "Copy Link" copies the URL to clipboard with a toast.
4. "WhatsApp" opens wa.me with a pre-filled message containing the link.
5. Toggling sharing off makes the public URL return 404. Toggling back on restores the same URL.
6. The `shareToken` is unique across all invoices and is never regenerated (stable URL).
7. All labels render in Arabic and English.
8. Existing invoice features (detail page, edit, PDF, email) are unchanged.
9. The public page works without JavaScript (server-rendered HTML — the PDF button is a plain `<a>` tag).
