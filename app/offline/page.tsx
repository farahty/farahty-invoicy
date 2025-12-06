"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw, Home, ArrowLeft } from "lucide-react";

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-redirect when back online
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await fetch("/api/health", { method: "HEAD", cache: "no-store" });
      window.location.reload();
    } catch {
      setIsRetrying(false);
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/dashboard";
    }
  };

  if (isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Connection Restored!
          </h1>
          <p className="text-muted-foreground">Redirecting you back...</p>
        </div>
      </div>
    );
  }

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
          You&apos;re Offline
        </h1>
        <p className="text-lg text-muted-foreground mb-1" dir="rtl">
          أنت غير متصل بالإنترنت
        </p>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          The page you&apos;re trying to access requires an internet connection.
          Please check your connection and try again.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            size="lg"
            className="w-full gap-2"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Try Again / إعادة المحاولة
              </>
            )}
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={handleGoBack}
              variant="outline"
              size="lg"
              className="flex-1 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              variant="outline"
              size="lg"
              className="flex-1 gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
          </div>
        </div>

        {/* Help text */}
        <p className="mt-8 text-xs text-muted-foreground">
          The app will automatically reconnect when internet is available
        </p>

        {/* App branding */}
        <div className="mt-8 flex items-center gap-2 text-muted-foreground">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span className="text-sm font-medium">Farahty</span>
        </div>
      </div>
    </div>
  );
}
