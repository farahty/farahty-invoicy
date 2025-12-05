import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Invoice, Client, InvoiceItem, User } from "@/db/schema";

// Register fonts (optional - uses default Helvetica if not registered)
// Font.register({
//   family: 'Inter',
//   src: '/fonts/Inter-Regular.ttf',
// });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "right",
    color: "#0f172a",
  },
  invoiceNumber: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "right",
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
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
  },
  value: {
    fontSize: 11,
    marginBottom: 2,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
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
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableCell: {
    fontSize: 10,
  },
  descriptionCell: {
    width: "45%",
  },
  qtyCell: {
    width: "15%",
    textAlign: "right",
  },
  rateCell: {
    width: "20%",
    textAlign: "right",
  },
  amountCell: {
    width: "20%",
    textAlign: "right",
  },
  totals: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 6,
  },
  totalLabel: {
    width: 100,
    textAlign: "right",
    paddingRight: 20,
    color: "#64748b",
  },
  totalValue: {
    width: 100,
    textAlign: "right",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#e2e8f0",
  },
  grandTotalLabel: {
    width: 100,
    textAlign: "right",
    paddingRight: 20,
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
  },
  grandTotalValue: {
    width: 100,
    textAlign: "right",
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
  },
  notesText: {
    fontSize: 10,
    color: "#475569",
    lineHeight: 1.5,
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
    right: 40,
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
}

const formatCurrency = (amount: string | number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(typeof amount === "string" ? parseFloat(amount) : amount);
};

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export function InvoicePDF({ invoice, client, user }: InvoicePDFProps) {
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
            <Text>{invoice.status.toUpperCase()}</Text>
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
              <Text style={styles.value}>Tax ID: {user.taxId}</Text>
            )}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* Bill To & Invoice Info */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Bill To</Text>
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
              <Text style={styles.value}>Tax ID: {client.taxId}</Text>
            )}
          </View>
          <View style={styles.column}>
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.label}>Invoice Date</Text>
              <Text style={styles.value}>{formatDate(invoice.date)}</Text>
            </View>
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.label}>Due Date</Text>
              <Text style={styles.value}>{formatDate(invoice.dueDate)}</Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.descriptionCell]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, styles.qtyCell]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.rateCell]}>Rate</Text>
            <Text style={[styles.tableHeaderCell, styles.amountCell]}>
              Amount
            </Text>
          </View>
          {invoice.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.descriptionCell]}>
                {item.description}
              </Text>
              <Text style={[styles.tableCell, styles.qtyCell]}>
                {parseFloat(item.quantity).toFixed(2)}
              </Text>
              <Text style={[styles.tableCell, styles.rateCell]}>
                {formatCurrency(item.rate)}
              </Text>
              <Text style={[styles.tableCell, styles.amountCell]}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.subtotal)}
            </Text>
          </View>
          {parseFloat(invoice.taxRate) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({invoice.taxRate}%)</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.taxAmount)}
              </Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total Due</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(invoice.total)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {(invoice.notes || invoice.terms) && (
          <View style={styles.notes}>
            {invoice.notes && (
              <View style={{ marginBottom: invoice.terms ? 12 : 0 }}>
                <Text style={styles.notesTitle}>Notes</Text>
                <Text style={styles.notesText}>{invoice.notes}</Text>
              </View>
            )}
            {invoice.terms && (
              <View>
                <Text style={styles.notesTitle}>Terms & Conditions</Text>
                <Text style={styles.notesText}>{invoice.terms}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Thank you for your business! | {user.companyEmail || user.email}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
