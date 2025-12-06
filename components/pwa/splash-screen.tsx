"use client";

import { useEffect, useState } from "react";

export function PWASplashScreen() {
  const [showSplash, setShowSplash] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if running as PWA (standalone mode) - only on client
    const isPWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error - iOS specific property
      window.navigator.standalone === true;

    // Hide the inline CSS splash screen
    const inlineSplash = document.getElementById("pwa-splash");
    if (inlineSplash) {
      inlineSplash.classList.add("hide");
      // Remove from DOM after animation
      setTimeout(() => inlineSplash.remove(), 500);
    }

    setShowSplash(isPWA);

    if (isPWA) {
      // Hide splash after app has loaded
      const timer = setTimeout(() => {
        setIsLoading(false);
        // Fade out animation
        setTimeout(() => setShowSplash(false), 500);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  // Don't render anything until we've checked PWA status (prevents hydration mismatch)
  if (showSplash === null || showSplash === false) return null;

  return (
    <div
      className={`fixed inset-0 z-9999 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
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
