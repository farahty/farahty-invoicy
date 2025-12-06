"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <WifiOff className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">You&apos;re Offline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            It looks like you&apos;ve lost your internet connection. Please
            check your connection and try again.
          </p>
          <p className="text-muted-foreground text-sm" dir="rtl">
            يبدو أنك فقدت اتصالك بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة
            أخرى.
          </p>
          <Button onClick={handleRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry / إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
