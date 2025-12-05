import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { renderToBuffer } from "@react-pdf/renderer";
import { getInvoice } from "@/actions/invoices";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireOrgAuth } from "@/lib/session";
import {
  InvoicePDF,
  arabicPDFTranslations,
  defaultPDFTranslations,
} from "@/components/invoices/invoice-pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { activeOrganization } = await requireOrgAuth();
    const { id } = await params;

    if (!activeOrganization) {
      return new NextResponse("No active organization", { status: 403 });
    }

    // Get locale from cookies
    const cookieStore = await cookies();
    const locale = cookieStore.get("locale")?.value || "ar";

    // Get appropriate translations
    const translations =
      locale === "ar" ? arabicPDFTranslations : defaultPDFTranslations;

    const invoice = await getInvoice(id);

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    // Get organization details
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, activeOrganization.id),
    });

    if (!organization) {
      return new NextResponse("Organization not found", { status: 404 });
    }

    const pdfBuffer = await renderToBuffer(
      InvoicePDF({
        invoice,
        client: invoice.client,
        organization,
        translations,
        locale,
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
