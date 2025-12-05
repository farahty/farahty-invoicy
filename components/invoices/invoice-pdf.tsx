import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Invoice, Client, InvoiceItem, User } from "@/db/schema";

// Register Arabic font for RTL support
Font.register({
  family: "Noto Sans Arabic",
  src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-arabic@5.0.0/files/noto-sans-arabic-arabic-400-normal.woff",
});

// Register Noto Sans Hebrew for shekel symbol support
Font.register({
  family: "Noto Sans Hebrew",
  src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-hebrew@5.0.0/files/noto-sans-hebrew-hebrew-400-normal.woff",
});

// PDF Translations type
export interface PDFTranslations {
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
  notes: string;
  terms: string;
  taxId: string;
  thankYou: string;
  paid: string;
  overdue: string;
}

// Default English translations
export const defaultPDFTranslations: PDFTranslations = {
  invoice: "INVOICE",
  invoiceNumber: "Invoice Number",
  billTo: "Bill To",
  invoiceDate: "Invoice Date",
  dueDate: "Due Date",
  description: "Description",
  quantity: "Qty",
  rate: "Rate",
  amount: "Amount",
  subtotal: "Subtotal",
  tax: "Tax",
  totalDue: "Total Due",
  notes: "Notes",
  terms: "Terms & Conditions",
  taxId: "Tax ID",
  thankYou: "Thank you for your business!",
  paid: "PAID",
  overdue: "OVERDUE",
};

// Arabic translations
export const arabicPDFTranslations: PDFTranslations = {
  invoice: "فاتورة",
  invoiceNumber: "رقم الفاتورة",
  billTo: "فاتورة إلى",
  invoiceDate: "تاريخ الفاتورة",
  dueDate: "تاريخ الاستحقاق",
  description: "الوصف",
  quantity: "الكمية",
  rate: "السعر",
  amount: "المبلغ",
  subtotal: "المجموع الفرعي",
  tax: "الضريبة",
  totalDue: "المجموع المستحق",
  notes: "ملاحظات",
  terms: "الشروط والأحكام",
  taxId: "الرقم الضريبي",
  thankYou: "شكراً لتعاملكم معنا!",
  paid: "مدفوعة",
  overdue: "متأخرة",
};

const createStyles = (isRTL: boolean) =>
  StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 10,
      fontFamily: isRTL ? "Noto Sans Arabic" : "Helvetica",
      color: "#1a1a1a",
      direction: isRTL ? "rtl" : "ltr",
    },
    header: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      marginBottom: 40,
    },
    logo: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#0f172a",
      textAlign: isRTL ? "right" : "left",
    },
    invoiceTitle: {
      fontSize: 28,
      fontWeight: "bold",
      textAlign: isRTL ? "left" : "right",
      color: "#0f172a",
    },
    invoiceNumber: {
      fontSize: 12,
      color: "#64748b",
      textAlign: isRTL ? "left" : "right",
      marginTop: 4,
    },
    section: {
      marginBottom: 20,
    },
    row: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
    },
    column: {
      width: "48%",
    },
    label: {
      fontSize: 9,
      color: "#64748b",
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      textAlign: isRTL ? "right" : "left",
    },
    value: {
      fontSize: 11,
      marginBottom: 2,
      textAlign: isRTL ? "right" : "left",
    },
    companyName: {
      fontSize: 14,
      fontWeight: "bold",
      marginBottom: 4,
      textAlign: isRTL ? "right" : "left",
    },
    table: {
      marginTop: 20,
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: isRTL ? "row-reverse" : "row",
      backgroundColor: "#f8fafc",
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#e2e8f0",
    },
    tableHeaderCell: {
      fontSize: 9,
      fontWeight: "bold",
      color: "#64748b",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    tableRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#f1f5f9",
    },
    tableCell: {
      fontSize: 10,
    },
    currencySymbol: {
      fontFamily: "Noto Sans Hebrew",
    },
    descriptionCell: {
      width: "45%",
      textAlign: isRTL ? "right" : "left",
    },
    qtyCell: {
      width: "15%",
      textAlign: isRTL ? "left" : "right",
    },
    rateCell: {
      width: "20%",
      textAlign: isRTL ? "left" : "right",
    },
    amountCell: {
      width: "20%",
      textAlign: isRTL ? "left" : "right",
    },
    totals: {
      marginTop: 20,
      alignItems: isRTL ? "flex-start" : "flex-end",
    },
    totalRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: isRTL ? "flex-start" : "flex-end",
      marginBottom: 6,
    },
    totalLabel: {
      width: 100,
      textAlign: isRTL ? "left" : "right",
      paddingRight: isRTL ? 0 : 20,
      paddingLeft: isRTL ? 20 : 0,
      color: "#64748b",
    },
    totalValue: {
      width: 100,
      textAlign: isRTL ? "right" : "right",
    },
    grandTotal: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: isRTL ? "flex-start" : "flex-end",
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 2,
      borderTopColor: "#e2e8f0",
    },
    grandTotalLabel: {
      width: 100,
      textAlign: isRTL ? "left" : "right",
      paddingRight: isRTL ? 0 : 20,
      paddingLeft: isRTL ? 20 : 0,
      fontSize: 14,
      fontWeight: "bold",
      color: "#0f172a",
    },
    grandTotalValue: {
      width: 100,
      textAlign: isRTL ? "right" : "right",
      fontSize: 14,
      fontWeight: "bold",
      color: "#0f172a",
    },
    notes: {
      marginTop: 30,
      padding: 15,
      backgroundColor: "#f8fafc",
      borderRadius: 4,
    },
    notesTitle: {
      fontSize: 10,
      fontWeight: "bold",
      marginBottom: 6,
      color: "#64748b",
      textAlign: isRTL ? "right" : "left",
    },
    notesText: {
      fontSize: 10,
      color: "#475569",
      lineHeight: 1.5,
      textAlign: isRTL ? "right" : "left",
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 40,
      right: 40,
      textAlign: "center",
      color: "#94a3b8",
      fontSize: 9,
      borderTopWidth: 1,
      borderTopColor: "#e2e8f0",
      paddingTop: 15,
    },
    status: {
      position: "absolute",
      top: 60,
      right: isRTL ? undefined : 40,
      left: isRTL ? 40 : undefined,
      padding: "6 12",
      borderRadius: 4,
      fontSize: 10,
      fontWeight: "bold",
      textTransform: "uppercase",
    },
    statusPaid: {
      backgroundColor: "#dcfce7",
      color: "#166534",
    },
    statusOverdue: {
      backgroundColor: "#fef2f2",
      color: "#991b1b",
    },
  });

interface InvoicePDFProps {
  invoice: Invoice & { items: InvoiceItem[] };
  client: Client;
  user: User;
  translations?: PDFTranslations;
  locale?: string;
}

const formatNumber = (amount: string | number) => {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  // Format number with commas and 2 decimal places using English numerals
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Currency component to render number with symbol using correct fonts
const Currency = ({
  amount,
  styles,
}: {
  amount: string | number;
  styles: ReturnType<typeof createStyles>;
}) => (
  <Text>
    {formatNumber(amount)} <Text style={styles.currencySymbol}>₪</Text>
  </Text>
);

const formatDate = (date: Date | string, locale: string = "en") => {
  // Use English locale for numerals but localized month names
  const d = new Date(date);
  const day = d.getDate();
  const year = d.getFullYear();

  // Get month name in the appropriate language
  const monthName = d.toLocaleDateString(locale === "ar" ? "ar-PS" : "en-US", {
    month: "long",
  });

  // Always use English numerals
  return locale === "ar"
    ? `${day} ${monthName} ${year}`
    : `${monthName} ${day}, ${year}`;
};

export function InvoicePDF({
  invoice,
  client,
  user,
  translations = defaultPDFTranslations,
  locale = "en",
}: InvoicePDFProps) {
  const isRTL = locale === "ar";
  const styles = createStyles(isRTL);
  const t = translations;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Status Badge */}
        {(invoice.status === "paid" || invoice.status === "overdue") && (
          <View
            style={[
              styles.status,
              invoice.status === "paid"
                ? styles.statusPaid
                : styles.statusOverdue,
            ]}
          >
            <Text>{invoice.status === "paid" ? t.paid : t.overdue}</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>{user.companyName || user.name}</Text>
            {user.companyAddress && (
              <Text style={styles.value}>{user.companyAddress}</Text>
            )}
            {user.companyPhone && (
              <Text style={styles.value}>{user.companyPhone}</Text>
            )}
            {user.companyEmail && (
              <Text style={styles.value}>{user.companyEmail}</Text>
            )}
            {user.taxId && (
              <Text style={styles.value}>
                {t.taxId}: {user.taxId}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>{t.invoice}</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* Bill To & Invoice Info */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>{t.billTo}</Text>
            <Text style={styles.companyName}>{client.name}</Text>
            {client.address && (
              <Text style={styles.value}>{client.address}</Text>
            )}
            {(client.city || client.country) && (
              <Text style={styles.value}>
                {[client.city, client.country].filter(Boolean).join(", ")}
              </Text>
            )}
            {client.email && <Text style={styles.value}>{client.email}</Text>}
            {client.taxId && (
              <Text style={styles.value}>
                {t.taxId}: {client.taxId}
              </Text>
            )}
          </View>
          <View style={styles.column}>
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.label}>{t.invoiceDate}</Text>
              <Text style={styles.value}>
                {formatDate(invoice.date, locale)}
              </Text>
            </View>
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.label}>{t.dueDate}</Text>
              <Text style={styles.value}>
                {formatDate(invoice.dueDate, locale)}
              </Text>
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
              <Text style={[styles.tableCell, styles.descriptionCell]}>
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
        <View style={styles.totals}>
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
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>{t.totalDue}</Text>
            <View style={styles.grandTotalValue}>
              <Currency amount={invoice.total} styles={styles} />
            </View>
          </View>
        </View>

        {/* Notes */}
        {(invoice.notes || invoice.terms) && (
          <View style={styles.notes}>
            {invoice.notes && (
              <View style={{ marginBottom: invoice.terms ? 12 : 0 }}>
                <Text style={styles.notesTitle}>{t.notes}</Text>
                <Text style={styles.notesText}>{invoice.notes}</Text>
              </View>
            )}
            {invoice.terms && (
              <View>
                <Text style={styles.notesTitle}>{t.terms}</Text>
                <Text style={styles.notesText}>{invoice.terms}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {t.thankYou} | {user.companyEmail || user.email}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
