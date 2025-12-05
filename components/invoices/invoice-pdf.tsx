import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Invoice, Client, InvoiceItem, Organization } from "@/db/schema";

// Register Arabic font for RTL support
Font.register({
  family: "Noto Sans Arabic",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-arabic@5.0.0/files/noto-sans-arabic-arabic-400-normal.woff",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-arabic@5.0.0/files/noto-sans-arabic-arabic-600-normal.woff",
      fontWeight: 600,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-arabic@5.0.0/files/noto-sans-arabic-arabic-700-normal.woff",
      fontWeight: 700,
    },
  ],
});

// Register Noto Sans Hebrew for shekel symbol support
Font.register({
  family: "Noto Sans Hebrew",
  src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-hebrew@5.0.0/files/noto-sans-hebrew-hebrew-400-normal.woff",
});

// Register Inter for modern English typography
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/files/inter-latin-400-normal.woff",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/files/inter-latin-500-normal.woff",
      fontWeight: 500,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/files/inter-latin-600-normal.woff",
      fontWeight: 600,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.0/files/inter-latin-700-normal.woff",
      fontWeight: 700,
    },
  ],
});

// PDF Translations type
export interface PDFTranslations {
  invoice: string;
  invoiceNumber: string;
  billTo: string;
  from: string;
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
  pageOf: string;
}

// Default English translations
export const defaultPDFTranslations: PDFTranslations = {
  invoice: "INVOICE",
  invoiceNumber: "#",
  billTo: "Bill To",
  from: "From",
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
  pageOf: "Page 1 of 1",
};

// Arabic translations
export const arabicPDFTranslations: PDFTranslations = {
  invoice: "فاتورة",
  invoiceNumber: "#",
  billTo: "إلى",
  from: "من",
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
  pageOf: "صفحة 1 من 1",
};

// Minimal color palette - grayscale focused
const colors = {
  black: "#111827",
  dark: "#374151",
  gray: "#6b7280",
  grayLight: "#9ca3af",
  border: "#e5e7eb",
  bgLight: "#f9fafb",
  white: "#ffffff",
};

const createStyles = (isRTL: boolean) =>
  StyleSheet.create({
    page: {
      padding: 32,
      fontSize: 9,
      fontFamily: isRTL ? "Noto Sans Arabic" : "Inter",
      color: colors.dark,
      direction: isRTL ? "rtl" : "ltr",
      backgroundColor: colors.white,
    },
    // Header
    header: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    brandSection: {
      flexDirection: "column",
    },
    logo: {
      fontSize: 16,
      fontWeight: 700,
      color: colors.black,
      textAlign: isRTL ? "right" : "left",
      marginBottom: 4,
    },
    brandContact: {
      fontSize: 8,
      color: colors.gray,
      textAlign: isRTL ? "right" : "left",
      lineHeight: 1.4,
    },
    invoiceTitleSection: {
      alignItems: isRTL ? "flex-start" : "flex-end",
    },
    invoiceTitle: {
      fontSize: 24,
      fontWeight: 700,
      textAlign: isRTL ? "left" : "right",
      color: colors.black,
      letterSpacing: 1,
    },
    invoiceNumber: {
      fontSize: 10,
      color: colors.gray,
      textAlign: isRTL ? "left" : "right",
      marginTop: 2,
    },
    // Status badge - minimal
    statusBadge: {
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 3,
      fontSize: 7,
      fontWeight: 600,
      letterSpacing: 0.5,
      marginTop: 6,
    },
    statusPaid: {
      backgroundColor: "#dcfce7",
      color: "#166534",
    },
    statusOverdue: {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
    },
    statusPartial: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
    },
    // Info section - compact two column
    infoSection: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    infoColumn: {
      width: "48%",
    },
    infoBlock: {
      marginBottom: 12,
    },
    infoLabel: {
      fontSize: 7,
      color: colors.grayLight,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 3,
      textAlign: isRTL ? "right" : "left",
    },
    infoTitle: {
      fontSize: 10,
      fontWeight: 600,
      color: colors.black,
      marginBottom: 2,
      textAlign: isRTL ? "right" : "left",
    },
    infoText: {
      fontSize: 8,
      color: colors.gray,
      textAlign: isRTL ? "right" : "left",
      lineHeight: 1.3,
    },
    // Date row - inline compact
    dateRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      gap: 16,
      marginBottom: 3,
    },
    dateItem: {
      flexDirection: isRTL ? "row-reverse" : "row",
      gap: 4,
    },
    dateLabel: {
      fontSize: 8,
      color: colors.grayLight,
    },
    dateValue: {
      fontSize: 8,
      color: colors.dark,
      fontWeight: 500,
    },
    // Items table - compact
    table: {
      marginBottom: 16,
    },
    tableHeader: {
      flexDirection: isRTL ? "row-reverse" : "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.black,
      paddingBottom: 6,
      marginBottom: 4,
    },
    tableHeaderCell: {
      fontSize: 7,
      fontWeight: 600,
      color: colors.gray,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    tableRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tableCell: {
      fontSize: 9,
      color: colors.dark,
    },
    tableCellDescription: {
      fontWeight: 500,
    },
    currencySymbol: {
      fontFamily: "Noto Sans Hebrew",
    },
    descriptionCell: {
      width: "50%",
      textAlign: isRTL ? "right" : "left",
    },
    qtyCell: {
      width: "12%",
      textAlign: "center",
    },
    rateCell: {
      width: "19%",
      textAlign: isRTL ? "left" : "right",
    },
    amountCell: {
      width: "19%",
      textAlign: isRTL ? "left" : "right",
    },
    // Totals - compact right aligned
    totalsSection: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: isRTL ? "flex-start" : "flex-end",
      marginBottom: 20,
    },
    totalsBox: {
      width: 180,
    },
    totalRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      paddingVertical: 4,
    },
    totalLabel: {
      fontSize: 8,
      color: colors.gray,
      textAlign: isRTL ? "right" : "left",
    },
    totalValue: {
      fontSize: 8,
      color: colors.dark,
      textAlign: isRTL ? "left" : "right",
    },
    grandTotalRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      borderTopWidth: 1,
      borderTopColor: colors.black,
      marginTop: 4,
    },
    grandTotalLabel: {
      fontSize: 10,
      fontWeight: 700,
      color: colors.black,
      textAlign: isRTL ? "right" : "left",
    },
    grandTotalValue: {
      fontSize: 10,
      fontWeight: 700,
      color: colors.black,
      textAlign: isRTL ? "left" : "right",
    },
    balanceDueRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      backgroundColor: colors.bgLight,
      marginTop: 4,
      paddingHorizontal: 8,
      marginHorizontal: -8,
    },
    balanceDueLabel: {
      fontSize: 9,
      fontWeight: 600,
      color: colors.dark,
      textAlign: isRTL ? "right" : "left",
    },
    balanceDueValue: {
      fontSize: 9,
      fontWeight: 700,
      color: colors.black,
      textAlign: isRTL ? "left" : "right",
    },
    // Notes - minimal
    notesSection: {
      marginBottom: 20,
    },
    notesBlock: {
      marginBottom: 10,
    },
    notesTitle: {
      fontSize: 7,
      fontWeight: 600,
      color: colors.grayLight,
      textTransform: "uppercase",
      letterSpacing: 0.3,
      marginBottom: 4,
      textAlign: isRTL ? "right" : "left",
    },
    notesText: {
      fontSize: 8,
      color: colors.gray,
      lineHeight: 1.4,
      textAlign: isRTL ? "right" : "left",
    },
    // Footer - simple line
    footer: {
      position: "absolute",
      bottom: 24,
      left: 32,
      right: 32,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerText: {
      fontSize: 8,
      color: colors.grayLight,
    },
  });

interface InvoicePDFProps {
  invoice: Invoice & { items: InvoiceItem[] };
  client: Client;
  organization: Organization;
  translations?: PDFTranslations;
  locale?: string;
}

const formatNumber = (amount: string | number) => {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Currency component to render number with symbol using correct fonts
const Currency = ({
  amount,
  styles,
  bold = false,
}: {
  amount: string | number;
  styles: ReturnType<typeof createStyles>;
  bold?: boolean;
}) => (
  <Text style={bold ? { fontWeight: 700 } : {}}>
    {formatNumber(amount)} <Text style={styles.currencySymbol}>₪</Text>
  </Text>
);

const formatDate = (date: Date | string, locale: string = "en") => {
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

export function InvoicePDF({
  invoice,
  client,
  organization,
  translations = defaultPDFTranslations,
  locale = "en",
}: InvoicePDFProps) {
  const isRTL = locale === "ar";
  const styles = createStyles(isRTL);
  const t = translations;

  const amountPaid = parseFloat(invoice.amountPaid || "0");
  const balanceDue = parseFloat(invoice.balanceDue || invoice.total);
  const hasPayments = amountPaid > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandSection}>
            <Text style={styles.logo}>{organization.name}</Text>
            <Text style={styles.brandContact}>
              {[organization.address, organization.phone, organization.email]
                .filter(Boolean)
                .join(" • ")}
            </Text>
            {organization.taxId && (
              <Text style={styles.brandContact}>
                {t.taxId}: {organization.taxId}
              </Text>
            )}
          </View>
          <View style={styles.invoiceTitleSection}>
            <Text style={styles.invoiceTitle}>{t.invoice}</Text>
            <Text style={styles.invoiceNumber}>
              {t.invoiceNumber}
              {invoice.invoiceNumber}
            </Text>
            {/* Status Badge */}
            {(invoice.status === "paid" ||
              invoice.status === "overdue" ||
              invoice.status === "partial") && (
              <View
                style={[
                  styles.statusBadge,
                  invoice.status === "paid"
                    ? styles.statusPaid
                    : invoice.status === "partial"
                    ? styles.statusPartial
                    : styles.statusOverdue,
                ]}
              >
                <Text>
                  {invoice.status === "paid"
                    ? t.paid
                    : invoice.status === "partial"
                    ? t.partial
                    : t.overdue}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoColumn}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>{t.billTo}</Text>
              <Text style={styles.infoTitle}>{client.name}</Text>
              {client.address && (
                <Text style={styles.infoText}>{client.address}</Text>
              )}
              {(client.city || client.country) && (
                <Text style={styles.infoText}>
                  {[client.city, client.country].filter(Boolean).join(", ")}
                </Text>
              )}
              {client.email && (
                <Text style={styles.infoText}>{client.email}</Text>
              )}
              {client.taxId && (
                <Text style={styles.infoText}>
                  {t.taxId}: {client.taxId}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.infoColumn}>
            <View style={styles.dateRow}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>{t.invoiceDate}:</Text>
                <Text style={styles.dateValue}>
                  {formatDate(invoice.date, locale)}
                </Text>
              </View>
            </View>
            <View style={styles.dateRow}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>{t.dueDate}:</Text>
                <Text style={styles.dateValue}>
                  {formatDate(invoice.dueDate, locale)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.descriptionCell]}>
              {t.description}
            </Text>
            <Text style={[styles.tableHeaderCell, styles.qtyCell]}>
              {t.quantity}
            </Text>
            <Text style={[styles.tableHeaderCell, styles.rateCell]}>
              {t.rate}
            </Text>
            <Text style={[styles.tableHeaderCell, styles.amountCell]}>
              {t.amount}
            </Text>
          </View>
          {invoice.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text
                style={[
                  styles.tableCell,
                  styles.descriptionCell,
                  styles.tableCellDescription,
                ]}
              >
                {item.description}
              </Text>
              <Text style={[styles.tableCell, styles.qtyCell]}>
                {parseInt(item.quantity)}
              </Text>
              <View style={[styles.tableCell, styles.rateCell]}>
                <Currency amount={item.rate} styles={styles} />
              </View>
              <View style={[styles.tableCell, styles.amountCell]}>
                <Currency amount={item.amount} styles={styles} />
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t.subtotal}</Text>
              <View style={styles.totalValue}>
                <Currency amount={invoice.subtotal} styles={styles} />
              </View>
            </View>
            {parseFloat(invoice.taxRate) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  {t.tax} ({invoice.taxRate}%)
                </Text>
                <View style={styles.totalValue}>
                  <Currency amount={invoice.taxAmount} styles={styles} />
                </View>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>{t.totalDue}</Text>
              <View style={styles.grandTotalValue}>
                <Currency amount={invoice.total} styles={styles} bold />
              </View>
            </View>
            {hasPayments && (
              <>
                <View style={[styles.totalRow, { marginTop: 6 }]}>
                  <Text style={styles.totalLabel}>{t.amountPaid}</Text>
                  <View style={styles.totalValue}>
                    <Currency amount={amountPaid} styles={styles} />
                  </View>
                </View>
                <View style={styles.balanceDueRow}>
                  <Text style={styles.balanceDueLabel}>{t.balanceDue}</Text>
                  <View style={styles.balanceDueValue}>
                    <Currency amount={balanceDue} styles={styles} bold />
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <View style={styles.notesSection}>
            {invoice.notes && (
              <View style={styles.notesBlock}>
                <Text style={styles.notesTitle}>{t.notes}</Text>
                <Text style={styles.notesText}>{invoice.notes}</Text>
              </View>
            )}
            {invoice.terms && (
              <View style={styles.notesBlock}>
                <Text style={styles.notesTitle}>{t.terms}</Text>
                <Text style={styles.notesText}>{invoice.terms}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t.thankYou}</Text>
          <Text style={styles.footerText}>
            {organization.email || organization.phone || ""}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
