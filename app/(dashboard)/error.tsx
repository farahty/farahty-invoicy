"use client";

import { useEffect } from "react";
import { WifiOff, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error
    console.error("Dashboard error:", error);
  }, [error]);

  // Check if this is a connection/database error
  const isConnectionError =
    error.message?.includes("Failed query") ||
    error.message?.includes("Failed to get session") ||
    error.message?.includes("ECONNREFUSED") ||
    error.message?.includes("ETIMEDOUT") ||
    error.message?.includes("ENOTFOUND") ||
    error.message?.includes("Connection") ||
    error.message?.includes("network") ||
    error.message?.includes("fetch failed");

  if (isConnectionError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center text-center max-w-md">
          {/* Icon */}
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
              <WifiOff className="w-12 h-12 text-muted-foreground" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-muted-foreground/20 animate-ping" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Connection Problem
          </h1>
          <p className="text-lg text-muted-foreground mb-1" dir="rtl">
            مشكلة في الاتصال
          </p>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Unable to connect to the server. Please check your internet
            connection and try again.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button onClick={() => reset()} size="lg" className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again / إعادة المحاولة
            </Button>

            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
              size="lg"
              className="w-full gap-2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>

          {/* Help text */}
          <p className="mt-8 text-xs text-muted-foreground">
            The app will automatically reconnect when internet is available
          </p>
        </div>
      </div>
    );
  }

  // Generic error UI for non-connection errors
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <span className="text-3xl">⚠️</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          An unexpected error occurred. Please try again.
        </p>

        <div className="flex gap-3">
          <Button onClick={() => reset()} size="lg" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            onClick={() => (window.location.href = "/dashboard")}
            variant="outline"
            size="lg"
          >
            Go to Dashboard
          </Button>
        </div>

        {process.env.NODE_ENV === "development" && (
          <pre className="mt-6 p-4 bg-muted rounded-lg text-xs text-left overflow-auto max-w-full">
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}
