"use client";

import { useEffect, useState } from "react";

// Check PWA mode synchronously (for initial render)
function isPWAMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error - iOS specific property
    window.navigator.standalone === true
  );
}

export function PWASplashScreen() {
  // Start with splash visible in PWA mode (checked synchronously)
  const [showSplash, setShowSplash] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const isPWA = isPWAMode();

    if (!isPWA) {
      // Not PWA mode - don't show anything
      setShowSplash(false);
      setShouldRender(false);
      return;
    }

    // PWA mode - show splash and schedule hide
    setShouldRender(true);

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // Don't render if not in PWA mode
  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-9999 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        showSplash ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onTransitionEnd={() => {
        if (!showSplash) setShouldRender(false);
      }}
    >
      {/* Logo */}
      <div className="relative mb-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-card shadow-2xl ring-1 ring-border">
          <span className="text-5xl font-bold text-primary">F</span>
        </div>
        {/* Animated ring */}
        <div className="absolute -inset-2 animate-spin-slow rounded-3xl border-2 border-transparent border-t-primary/50" />
      </div>

      {/* App name */}
      <h1 className="mb-2 text-3xl font-bold text-foreground">Farahty</h1>
      <p className="mb-8 text-sm text-muted-foreground">Invoice Management</p>

      {/* Loading indicator */}
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
      </div>
    </div>
  );
}
