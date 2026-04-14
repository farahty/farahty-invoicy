import fs from "node:fs";
import path from "node:path";
import type { Invoice, Client, InvoiceItem, Organization } from "@/db/schema";

export interface InvoiceHtmlTranslations {
  invoice: string;
  invoiceNumber: string;
  billTo: string;
  invoiceDate: string;
  dueDate: string;
  description: string;
  quantity: string;
  rate: string;
  amount: string;
  subtotal: string;
  tax: string;
  totalDue: string;
  amountPaid: string;
  balanceDue: string;
  notes: string;
  terms: string;
  taxId: string;
  thankYou: string;
  paid: string;
  overdue: string;
  partial: string;
}

export const englishTranslations: InvoiceHtmlTranslations = {
  invoice: "INVOICE",
  invoiceNumber: "#",
  billTo: "Bill To",
  invoiceDate: "Date",
  dueDate: "Due",
  description: "Description",
  quantity: "Qty",
  rate: "Rate",
  amount: "Amount",
  subtotal: "Subtotal",
  tax: "Tax",
  totalDue: "Total",
  amountPaid: "Paid",
  balanceDue: "Balance Due",
  notes: "Notes",
  terms: "Terms",
  taxId: "Tax ID",
  thankYou: "Thank you for your business",
  paid: "PAID",
  overdue: "OVERDUE",
  partial: "PARTIAL",
};

export const arabicTranslations: InvoiceHtmlTranslations = {
  invoice: "فاتورة",
  invoiceNumber: "#",
  billTo: "إلى",
  invoiceDate: "التاريخ",
  dueDate: "الاستحقاق",
  description: "الوصف",
  quantity: "الكمية",
  rate: "السعر",
  amount: "المبلغ",
  subtotal: "المجموع الفرعي",
  tax: "الضريبة",
  totalDue: "المجموع",
  amountPaid: "المدفوع",
  balanceDue: "الرصيد المستحق",
  notes: "ملاحظات",
  terms: "الشروط",
  taxId: "الرقم الضريبي",
  thankYou: "شكراً لتعاملكم معنا",
  paid: "مدفوعة",
  overdue: "متأخرة",
  partial: "جزئية",
};

const escapeHtml = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const multiline = (value: string | null | undefined): string => {
  if (!value) return "";
  return escapeHtml(value).replace(/\r\n?|\n/g, "<br/>");
};

const formatNumber = (amount: string | number): string => {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (date: Date | string, locale: string): string => {
  const d = new Date(date);
  const day = d.getDate();
  const year = d.getFullYear();
  const monthName = d.toLocaleDateString(locale === "ar" ? "ar-PS" : "en-US", {
    month: "short",
  });
  return locale === "ar"
    ? `${day} ${monthName} ${year}`
    : `${monthName} ${day}, ${year}`;
};

// Cache base64-encoded fonts so we encode each file once per process.
const fontCache = new Map<string, string>();
const loadFontBase64 = (filename: string): string => {
  const cached = fontCache.get(filename);
  if (cached) return cached;
  const filePath = path.join(process.cwd(), "public", "fonts", filename);
  const encoded = fs.readFileSync(filePath).toString("base64");
  fontCache.set(filename, encoded);
  return encoded;
};

const fontFaces = (): string => {
  const woff = (file: string) =>
    `url(data:font/woff;base64,${loadFontBase64(file)}) format("woff")`;
  return `
    @font-face {
      font-family: "Inter";
      font-weight: 400;
      font-style: normal;
      src: ${woff("inter-400.woff")};
    }
    @font-face {
      font-family: "Inter";
      font-weight: 500;
      font-style: normal;
      src: ${woff("inter-500.woff")};
    }
    @font-face {
      font-family: "Inter";
      font-weight: 600;
      font-style: normal;
      src: ${woff("inter-600.woff")};
    }
    @font-face {
      font-family: "Inter";
      font-weight: 700;
      font-style: normal;
      src: ${woff("inter-700.woff")};
    }
    @font-face {
      font-family: "Noto Sans Arabic";
      font-weight: 400;
      font-style: normal;
      src: ${woff("noto-sans-arabic-400.woff")};
    }
    @font-face {
      font-family: "Noto Sans Arabic";
      font-weight: 600;
      font-style: normal;
      src: ${woff("noto-sans-arabic-600.woff")};
    }
    @font-face {
      font-family: "Noto Sans Arabic";
      font-weight: 700;
      font-style: normal;
      src: ${woff("noto-sans-arabic-700.woff")};
    }
  `;
};

interface RenderOptions {
  invoice: Invoice & { items: InvoiceItem[] };
  client: Client;
  organization: Organization;
  translations: InvoiceHtmlTranslations;
  locale: "ar" | "en";
}

export function renderInvoiceHtml({
  invoice,
  client,
  organization,
  translations: t,
  locale,
}: RenderOptions): string {
  const isRTL = locale === "ar";
  const dir = isRTL ? "rtl" : "ltr";
  const startAlign = isRTL ? "right" : "left";
  const endAlign = isRTL ? "left" : "right";

  const currency = (amount: string | number): string =>
    `${formatNumber(amount)} <span class="currency-symbol">₪</span>`;

  const amountPaid = parseFloat(invoice.amountPaid || "0");
  const balanceDue = parseFloat(invoice.balanceDue || invoice.total);
  const hasPayments = amountPaid > 0;
  const taxRate = parseFloat(invoice.taxRate);

  const statusBadge = (() => {
    if (invoice.status === "paid")
      return `<span class="status-badge status-paid">${escapeHtml(t.paid)}</span>`;
    if (invoice.status === "overdue")
      return `<span class="status-badge status-overdue">${escapeHtml(t.overdue)}</span>`;
    if (invoice.status === "partial")
      return `<span class="status-badge status-partial">${escapeHtml(t.partial)}</span>`;
    return "";
  })();

  const orgContactLines = [
    multiline(organization.address),
    escapeHtml(organization.phone),
    escapeHtml(organization.email),
  ]
    .filter(Boolean)
    .map((line) => `<div class="brand-contact">${line}</div>`)
    .join("");

  const clientLines = [
    client.address ? multiline(client.address) : "",
    [client.city, client.country].filter(Boolean).map(escapeHtml).join(", "),
    client.email ? escapeHtml(client.email) : "",
    client.taxId ? `${escapeHtml(t.taxId)}: ${escapeHtml(client.taxId)}` : "",
  ]
    .filter(Boolean)
    .map((line) => `<div class="info-text">${line}</div>`)
    .join("");

  const itemsRows = invoice.items
    .map(
      (item) => `
        <tr>
          <td class="col-description">${escapeHtml(item.description)}</td>
          <td class="col-qty">${parseInt(item.quantity)}</td>
          <td class="col-rate">${currency(item.rate)}</td>
          <td class="col-amount">${currency(item.amount)}</td>
        </tr>
      `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(invoice.invoiceNumber)}</title>
<style>
  ${fontFaces()}
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #374151;
    font-family: ${isRTL ? '"Noto Sans Arabic", "Inter"' : '"Inter", "Noto Sans Arabic"'}, system-ui, sans-serif;
    font-size: 11px;
    line-height: 1.45;
    direction: ${dir};
    -webkit-font-smoothing: antialiased;
    text-rendering: geometricPrecision;
  }
  body {
    padding: 32px 36px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    padding-bottom: 20px;
    margin-bottom: 24px;
    border-bottom: 1px solid #e5e7eb;
  }
  .brand { flex: 1; }
  .brand-logo {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 6px;
  }
  .brand-contact {
    font-size: 10px;
    color: #6b7280;
    margin-top: 2px;
    white-space: pre-wrap;
  }
  .invoice-title-section {
    text-align: ${endAlign};
  }
  .invoice-title {
    font-size: 26px;
    font-weight: 700;
    color: #111827;
    letter-spacing: 1px;
  }
  .invoice-number {
    font-size: 11px;
    color: #6b7280;
    margin-top: 4px;
  }
  .status-badge {
    display: inline-block;
    margin-top: 8px;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  .status-paid {
    background: #d1fae5;
    color: #065f46;
  }
  .status-overdue {
    background: #fee2e2;
    color: #991b1b;
  }
  .status-partial {
    background: #fef3c7;
    color: #92400e;
  }
  .info-section {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 24px;
  }
  .info-column { flex: 1; }
  .info-label {
    font-size: 10px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .info-title {
    font-size: 13px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 4px;
  }
  .info-text {
    font-size: 11px;
    color: #374151;
    margin-top: 2px;
    white-space: pre-wrap;
  }
  .dates {
    text-align: ${endAlign};
  }
  .date-row { margin-top: 4px; }
  .date-label {
    font-size: 10px;
    color: #6b7280;
  }
  .date-value {
    font-size: 11px;
    color: #111827;
    font-weight: 500;
  }
  table.items {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
  }
  table.items thead th {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6b7280;
    background: #f9fafb;
    padding: 10px 8px;
    border-bottom: 1px solid #e5e7eb;
  }
  table.items td {
    padding: 10px 8px;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: top;
  }
  table.items .col-description {
    text-align: ${startAlign};
    width: 55%;
    color: #111827;
  }
  table.items .col-qty {
    text-align: ${endAlign};
    width: 10%;
    color: #374151;
  }
  table.items .col-rate {
    text-align: ${endAlign};
    width: 17.5%;
    color: #374151;
  }
  table.items .col-amount {
    text-align: ${endAlign};
    width: 17.5%;
    color: #111827;
    font-weight: 500;
  }
  thead th.col-description { text-align: ${startAlign}; }
  thead th.col-qty,
  thead th.col-rate,
  thead th.col-amount { text-align: ${endAlign}; }
  .totals {
    display: flex;
    justify-content: ${isRTL ? "flex-start" : "flex-end"};
    margin-top: 8px;
  }
  .totals-box {
    min-width: 260px;
  }
  .totals-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 11px;
    color: #374151;
  }
  .totals-row .label { color: #6b7280; }
  .totals-grand {
    border-top: 1px solid #e5e7eb;
    margin-top: 6px;
    padding-top: 10px;
    font-size: 14px;
    font-weight: 700;
    color: #111827;
  }
  .balance-row {
    border-top: 1px solid #e5e7eb;
    margin-top: 6px;
    padding-top: 10px;
    font-size: 13px;
    font-weight: 700;
    color: #991b1b;
  }
  .notes-section {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  }
  .notes-block { margin-bottom: 12px; }
  .notes-title {
    font-size: 10px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .notes-body {
    font-size: 11px;
    color: #374151;
    white-space: pre-wrap;
  }
  .footer {
    margin-top: 36px;
    padding-top: 16px;
    border-top: 1px solid #f3f4f6;
    text-align: center;
    color: #9ca3af;
    font-size: 10px;
  }
  .currency-symbol {
    display: inline-block;
    margin: 0 2px;
    font-family: "Inter", system-ui, sans-serif;
  }
  @page {
    size: A4;
    margin: 0;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="brand-logo">${escapeHtml(organization.name)}</div>
      ${orgContactLines}
      ${
        organization.taxId
          ? `<div class="brand-contact">${escapeHtml(t.taxId)}: ${escapeHtml(organization.taxId)}</div>`
          : ""
      }
    </div>
    <div class="invoice-title-section">
      <div class="invoice-title">${escapeHtml(t.invoice)}</div>
      <div class="invoice-number">${escapeHtml(t.invoiceNumber)}${escapeHtml(invoice.invoiceNumber)}</div>
      ${statusBadge}
    </div>
  </div>

  <div class="info-section">
    <div class="info-column">
      <div class="info-label">${escapeHtml(t.billTo)}</div>
      <div class="info-title">${escapeHtml(client.name)}</div>
      ${clientLines}
    </div>
    <div class="info-column dates">
      <div class="date-row">
        <span class="date-label">${escapeHtml(t.invoiceDate)}:</span>
        <span class="date-value">${escapeHtml(formatDate(invoice.date, locale))}</span>
      </div>
      <div class="date-row">
        <span class="date-label">${escapeHtml(t.dueDate)}:</span>
        <span class="date-value">${escapeHtml(formatDate(invoice.dueDate, locale))}</span>
      </div>
    </div>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th class="col-description">${escapeHtml(t.description)}</th>
        <th class="col-qty">${escapeHtml(t.quantity)}</th>
        <th class="col-rate">${escapeHtml(t.rate)}</th>
        <th class="col-amount">${escapeHtml(t.amount)}</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row">
        <span class="label">${escapeHtml(t.subtotal)}</span>
        <span>${currency(invoice.subtotal)}</span>
      </div>
      ${
        taxRate > 0
          ? `<div class="totals-row">
              <span class="label">${escapeHtml(t.tax)} (${escapeHtml(invoice.taxRate)}%)</span>
              <span>${currency(invoice.taxAmount)}</span>
            </div>`
          : ""
      }
      <div class="totals-row totals-grand">
        <span>${escapeHtml(t.totalDue)}</span>
        <span>${currency(invoice.total)}</span>
      </div>
      ${
        hasPayments
          ? `<div class="totals-row">
              <span class="label">${escapeHtml(t.amountPaid)}</span>
              <span>${currency(amountPaid)}</span>
            </div>
            <div class="totals-row balance-row">
              <span>${escapeHtml(t.balanceDue)}</span>
              <span>${currency(balanceDue)}</span>
            </div>`
          : ""
      }
    </div>
  </div>

  ${
    invoice.notes || invoice.terms
      ? `<div class="notes-section">
          ${
            invoice.notes
              ? `<div class="notes-block">
                  <div class="notes-title">${escapeHtml(t.notes)}</div>
                  <div class="notes-body">${multiline(invoice.notes)}</div>
                </div>`
              : ""
          }
          ${
            invoice.terms
              ? `<div class="notes-block">
                  <div class="notes-title">${escapeHtml(t.terms)}</div>
                  <div class="notes-body">${multiline(invoice.terms)}</div>
                </div>`
              : ""
          }
        </div>`
      : ""
  }

  <div class="footer">${escapeHtml(t.thankYou)}</div>
</body>
</html>`;
}
