"use client";

import { useEffect } from "react";
import { WifiOff, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
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

  return (
    <html>
      <body className="bg-stone-50 dark:bg-stone-900">
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <div className="flex flex-col items-center text-center max-w-md">
            {isConnectionError ? (
              <>
                {/* Offline Icon */}
                <div className="relative mb-8">
                  <div className="w-24 h-24 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center">
                    <WifiOff className="w-12 h-12 text-stone-500" />
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
                  Connection Problem
                </h1>
                <p
                  className="text-lg text-stone-600 dark:text-stone-400 mb-1"
                  dir="rtl"
                >
                  مشكلة في الاتصال
                </p>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-8">
                  Unable to connect to the server. Please check your internet
                  connection.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                  <span className="text-3xl">⚠️</span>
                </div>

                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
                  Something went wrong
                </h1>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-8">
                  An unexpected error occurred.
                </p>
              </>
            )}

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button
                onClick={() => reset()}
                size="lg"
                className="w-full gap-2 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
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
          </div>
        </div>
      </body>
    </html>
  );
}
