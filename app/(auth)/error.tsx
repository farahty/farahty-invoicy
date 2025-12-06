"use client";

import { useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth error:", error);
  }, [error]);

  const isConnectionError =
    error.message?.includes("Failed query") ||
    error.message?.includes("Failed to get session") ||
    error.message?.includes("ECONNREFUSED") ||
    error.message?.includes("Connection") ||
    error.message?.includes("network") ||
    error.message?.includes("fetch failed");

  if (isConnectionError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <WifiOff className="w-10 h-10 text-muted-foreground" />
          </div>

          <h1 className="text-xl font-bold text-foreground mb-2">
            No Connection
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Please check your internet connection to sign in.
          </p>

          <Button onClick={() => reset()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <span className="text-2xl">⚠️</span>
        </div>

        <h1 className="text-xl font-bold text-foreground mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          An error occurred. Please try again.
        </p>

        <Button onClick={() => reset()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
