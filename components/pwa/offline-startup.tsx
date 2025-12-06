"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OfflineStartup() {
  const [isOffline, setIsOffline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showUI, setShowUI] = useState(false);

  useEffect(() => {
    // Only show if we're offline on initial load
    if (!navigator.onLine) {
      setIsOffline(true);
      // Small delay to allow cached content to load first
      const timer = setTimeout(() => setShowUI(true), 500);
      return () => clearTimeout(timer);
    }

    const handleOnline = () => {
      setIsOffline(false);
      setShowUI(false);
      // Reload to get fresh content
      window.location.reload();
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowUI(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);

    // Try to fetch to check connectivity
    try {
      await fetch("/api/health", {
        method: "HEAD",
        cache: "no-store",
      });
      // If successful, we're back online
      window.location.reload();
    } catch {
      // Still offline
      setIsRetrying(false);
    }
  };

  if (!isOffline || !showUI) return null;

  return (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-background p-6">
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full">
          {[...Array(6)].map((_, i) => (
            <CloudOff
              key={i}
              className="absolute text-foreground animate-pulse"
              style={{
                top: `${20 + i * 15}%`,
                left: `${10 + i * 20}%`,
                width: `${40 + i * 10}px`,
                height: `${40 + i * 10}px`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
        {/* Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
            <WifiOff className="w-12 h-12 text-muted-foreground" />
          </div>
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full border-2 border-muted-foreground/20 animate-ping" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          No Internet Connection
        </h1>
        <p className="text-base text-muted-foreground mb-2">
          لا يوجد اتصال بالإنترنت
        </p>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Please check your connection and try again. Some cached content may
          still be available.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            size="lg"
            className="w-full gap-2"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Checking connection...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Try Again
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            The app will automatically reconnect when internet is available
          </p>
        </div>

        {/* App branding */}
        <div className="mt-12 flex items-center gap-2 text-muted-foreground">
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
