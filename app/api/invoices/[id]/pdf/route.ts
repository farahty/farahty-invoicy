import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getInvoice } from "@/actions/invoices";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/session";
import { InvoicePDF } from "@/components/invoices/invoice-pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const invoice = await getInvoice(id);

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const pdfBuffer = await renderToBuffer(
      InvoicePDF({
        invoice,
        client: invoice.client,
        user,
      })
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
}
