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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/notifications/alerts`);
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
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
    <div className="space-y-2 px-8 py-4">
      {visibleAlerts.slice(0, 3).map((alert) => {
        const Icon = getIcon(alert.severity);
        const title = i18n.language === "hi" && alert.titleHi ? alert.titleHi : alert.title;
        const message = i18n.language === "hi" && alert.messageHi ? alert.messageHi : alert.message;

        return (
          <div
            key={alert.id}
            className={`max-w-6xl mx-auto p-4 rounded-lg border flex items-start gap-3 ${getSeverityStyles(alert.severity)}`}
            role="alert"
          >
            <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{title}</p>
              <p className="text-sm opacity-80">{message}</p>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="p-1 hover:bg-black/5 rounded cursor-pointer"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
