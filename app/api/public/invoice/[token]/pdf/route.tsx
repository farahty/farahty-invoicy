import { NextRequest, NextResponse } from "next/server";
import { getInvoiceByToken } from "@/actions/invoices";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  arabicTranslations,
  renderInvoiceHtml,
} from "@/components/invoices/invoice-html";
import { renderHtmlToPdf } from "@/lib/pdf-browser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const invoice = await getInvoiceByToken(token);

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    if (!invoice.client) {
      return new NextResponse("Invoice client not found", { status: 422 });
    }

    if (!invoice.organizationId) {
      return new NextResponse("Organization not found", { status: 404 });
    }

    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, invoice.organizationId),
    });

    if (!organization) {
      return new NextResponse("Organization not found", { status: 404 });
    }

    const html = renderInvoiceHtml({
      invoice,
      client: invoice.client,
      organization,
      translations: arabicTranslations,
      locale: "ar",
    });

    const pdfBuffer = await renderHtmlToPdf(html);

    const asciiFallback =
      invoice.invoiceNumber.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_") ||
      "invoice";
    const encoded = encodeURIComponent(invoice.invoiceNumber);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${asciiFallback}.pdf"; filename*=UTF-8''${encoded}.pdf`,
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Public PDF error:", error);
    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
}
