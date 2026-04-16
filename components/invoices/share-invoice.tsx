"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Copy, MessageCircle } from "lucide-react";
import { enableSharing, disableSharing } from "@/actions/invoices";

interface ShareInvoiceProps {
  invoiceId: string;
  invoiceNumber: string;
  organizationName: string;
  shareToken: string | null;
  isPublic: boolean;
}

export function ShareInvoice({
  invoiceId,
  invoiceNumber,
  organizationName,
  shareToken,
  isPublic: initialIsPublic,
}: ShareInvoiceProps) {
  const t = useTranslations("invoices");
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [currentToken, setCurrentToken] = useState(shareToken);
  const [isLoading, setIsLoading] = useState(false);

  const shareUrl = currentToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/invoice/${currentToken}`
    : "";

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      if (checked) {
        const result = await enableSharing(invoiceId);
        if (result.success && result.token) {
          setIsPublic(true);
          setCurrentToken(result.token);
        } else {
          toast.error(result.error || "Failed to enable sharing");
        }
      } else {
        const result = await disableSharing(invoiceId);
        if (result.success) {
          setIsPublic(false);
        } else {
          toast.error(result.error || "Failed to disable sharing");
        }
      }
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t("linkCopied"));
    } catch {
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      toast.success(t("linkCopied"));
    }
  };

  const handleWhatsApp = () => {
    const message = `${t("shareMessage", {
      number: invoiceNumber,
      org: organizationName,
    })}: ${shareUrl}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">{t("share")}</CardTitle>
        <Switch
          checked={isPublic}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
      </CardHeader>
      <CardContent>
        {isPublic && shareUrl ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="text-sm truncate"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                title={t("copyLink")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4" />
                {t("copyLink")}
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleWhatsApp}
              >
                <MessageCircle className="h-4 w-4" />
                {t("shareWhatsApp")}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("enableSharing")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
