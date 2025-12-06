"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ConnectionStatus = "online" | "offline" | "slow";

export function NetworkStatus() {
  const [status, setStatus] = useState<ConnectionStatus>("online");
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Check initial status
    if (!navigator.onLine) {
      setStatus("offline");
      setIsVisible(true);
    }

    // Online/offline handlers
    const handleOnline = () => {
      setStatus("online");
      // Show briefly then hide
      setIsVisible(true);
      setTimeout(() => {
        setIsLeaving(true);
        setTimeout(() => {
          setIsVisible(false);
          setIsLeaving(false);
        }, 300);
      }, 2000);
    };

    const handleOffline = () => {
      setStatus("offline");
      setIsVisible(true);
      setIsLeaving(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Slow connection detection using Network Information API
    const connection =
      (navigator as Navigator & { connection?: NetworkInformation })
        .connection ||
      (navigator as Navigator & { mozConnection?: NetworkInformation })
        .mozConnection ||
      (navigator as Navigator & { webkitConnection?: NetworkInformation })
        .webkitConnection;

    if (connection) {
      const checkConnectionSpeed = () => {
        // Consider slow if effectiveType is 2g or slow-2g, or if downlink < 1.5 Mbps
        const isSlowConnection =
          connection.effectiveType === "slow-2g" ||
          connection.effectiveType === "2g" ||
          (connection.downlink !== undefined && connection.downlink < 1.5);

        if (isSlowConnection && navigator.onLine) {
          setStatus("slow");
          setIsVisible(true);
          // Auto-hide after 5 seconds
          setTimeout(() => {
            if (status === "slow") {
              setIsLeaving(true);
              setTimeout(() => {
                setIsVisible(false);
                setIsLeaving(false);
              }, 300);
            }
          }, 5000);
        }
      };

      checkConnectionSpeed();
      connection.addEventListener("change", checkConnectionSpeed);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        connection.removeEventListener("change", checkConnectionSpeed);
      };
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [status]);

  if (!isVisible) return null;

  const config = {
    offline: {
      icon: WifiOff,
      message: "You're offline",
      description: "Some features may be unavailable",
      bgClass: "bg-destructive",
      textClass: "text-destructive-foreground",
    },
    slow: {
      icon: AlertTriangle,
      message: "Slow connection",
      description: "Content may take longer to load",
      bgClass: "bg-amber-500 dark:bg-amber-600",
      textClass: "text-white",
    },
    online: {
      icon: Wifi,
      message: "Back online",
      description: "Connection restored",
      bgClass: "bg-emerald-500 dark:bg-emerald-600",
      textClass: "text-white",
    },
  };

  const {
    icon: Icon,
    message,
    description,
    bgClass,
    textClass,
  } = config[status];

  return (
    <div
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-transform duration-300 ease-out",
        isLeaving ? "-translate-y-full" : "translate-y-0"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center gap-2 px-4 py-2 text-sm",
          bgClass,
          textClass
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="font-medium">{message}</span>
        <span className="opacity-80">·</span>
        <span className="opacity-80">{description}</span>
      </div>
    </div>
  );
}

// Type for Network Information API
interface NetworkInformation extends EventTarget {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener(type: "change", listener: () => void): void;
  removeEventListener(type: "change", listener: () => void): void;
}
