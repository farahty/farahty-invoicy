import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getInvoice } from "@/actions/invoices";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireOrgAuth } from "@/lib/session";
import {
  arabicTranslations,
  englishTranslations,
  renderInvoiceHtml,
} from "@/components/invoices/invoice-html";
import { renderHtmlToPdf } from "@/lib/pdf-browser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isNextInternalError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_");
}

function buildContentDisposition(invoiceNumber: string): string {
  const asciiFallback =
    invoiceNumber.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_") ||
    "invoice";
  const encoded = encodeURIComponent(invoiceNumber);
  return `inline; filename="${asciiFallback}.pdf"; filename*=UTF-8''${encoded}.pdf`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { activeOrganization } = await requireOrgAuth();

  if (!activeOrganization) {
    return new NextResponse("No active organization", { status: 403 });
  }

  try {
    const cookieStore = await cookies();
    const locale = cookieStore.get("locale")?.value === "en" ? "en" : "ar";
    const translations =
      locale === "ar" ? arabicTranslations : englishTranslations;

    const invoice = await getInvoice(id);

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    if (!invoice.client) {
      return new NextResponse(
        "Invoice is missing client information. Please edit the invoice and reassign a client.",
        { status: 422 }
      );
    }

    if (!invoice.items || invoice.items.length === 0) {
      return new NextResponse("Invoice has no items to render.", {
        status: 422,
      });
    }

    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, activeOrganization.id),
    });

    if (!organization) {
      return new NextResponse("Organization not found", { status: 404 });
    }

    const html = renderInvoiceHtml({
      invoice,
      client: invoice.client,
      organization,
      translations,
      locale,
    });

    const pdfBuffer = await renderHtmlToPdf(html);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": buildContentDisposition(invoice.invoiceNumber),
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    if (isNextInternalError(error)) {
      throw error;
    }
    const stack = error instanceof Error ? error.stack : undefined;
    console.error(
      `PDF generation error for invoice ${id}:`,
      error,
      stack ?? ""
    );
    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
}
