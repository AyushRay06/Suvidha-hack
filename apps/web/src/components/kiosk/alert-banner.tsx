"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Info, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Alert {
  id: string;
  title: string;
  titleHi?: string;
  message: string;
  messageHi?: string;
  severity: "info" | "warning" | "critical";
  serviceType: string;
}

export function AlertBanner() {
  const { i18n } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Fetch system alerts
    const fetchAlerts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/api/notifications/alerts`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.data || []);
        }
      } catch (error) {
        // Silently fail - alerts are not critical to functionality
        console.error("[v0] Failed to fetch alerts:", error);
        // Set empty alerts array to prevent infinite error loops
        setAlerts([]);
      }
    };

    fetchAlerts();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id));

  if (visibleAlerts.length === 0) return null;

  const dismissAlert = (id: string) => {
    setDismissedAlerts((prev) => new Set([...prev, id]));
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-amber-50 border-amber-200 text-amber-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  const getIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "warning":
        return AlertTriangle;
      default:
        return Info;
    }
  };

  return (
    <div className="space-y-3 lg:space-y-4 px-6 lg:px-8 py-4 lg:py-6 bg-gradient-to-r from-primary/5 to-transparent">
      {visibleAlerts.slice(0, 3).map((alert) => {
        const Icon = getIcon(alert.severity);
        const title = i18n.language === "hi" && alert.titleHi ? alert.titleHi : alert.title;
        const message = i18n.language === "hi" && alert.messageHi ? alert.messageHi : alert.message;

        return (
          <div
            key={alert.id}
            className={`max-w-full mx-auto p-5 lg:p-6 rounded-2xl border-l-4 flex items-start gap-4 lg:gap-5 ${getSeverityStyles(alert.severity)}`}
            role="alert"
          >
            <Icon className="w-6 h-6 lg:w-7 lg:h-7 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={`font-bold ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-lg' : 'text-base'}`}>
                {title}
              </p>
              <p className={`opacity-80 mt-1 ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-base' : 'text-sm'}`}>
                {message}
              </p>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="p-2 lg:p-3 hover:bg-black/10 rounded-lg cursor-pointer flex-shrink-0 transition-colors"
              aria-label="Dismiss alert"
            >
              <X className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
