"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Flame,
  Droplets,
  Building2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

interface Notification {
  id: string;
  title: string;
  titleHi?: string;
  message: string;
  messageHi?: string;
  type: "INFO" | "WARNING" | "PAYMENT" | "OUTAGE" | "RESOLVED";
  serviceType?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, tokens } = useAuthStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchNotifications();
  }, [isAuthenticated, router]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/notifications`,
        { headers: { Authorization: `Bearer ${tokens?.accessToken}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/notifications/${id}/read`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${tokens?.accessToken}` },
        }
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/notifications/read-all`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${tokens?.accessToken}` },
        }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error(error);
    }
  };

  const typeStyles: Record<string, { icon: any; bg: string; text: string; border: string }> = {
    INFO: { icon: Info, bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
    WARNING: { icon: AlertTriangle, bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
    PAYMENT: { icon: CheckCircle, bg: "bg-success/10", text: "text-success", border: "border-success/30" },
    OUTAGE: { icon: AlertTriangle, bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
    RESOLVED: { icon: CheckCircle, bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  };

  const serviceIcons: Record<string, any> = {
    ELECTRICITY: Zap,
    GAS: Flame,
    WATER: Droplets,
    MUNICIPAL: Building2,
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-primary text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:opacity-80">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="font-heading text-xl font-bold">{t("actions.notifications")}</h1>
              <p className="text-white/80 text-sm">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-white hover:bg-white/10"
            >
              Mark all read
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const style = typeStyles[notification.type] || typeStyles.INFO;
              const Icon = style.icon;
              const ServiceIcon = notification.serviceType
                ? serviceIcons[notification.serviceType]
                : null;

              const title =
                i18n.language === "hi" && notification.titleHi
                  ? notification.titleHi
                  : notification.title;
              const message =
                i18n.language === "hi" && notification.messageHi
                  ? notification.messageHi
                  : notification.message;

              return (
                <div
                  key={notification.id}
                  className={`rounded-xl border p-4 transition-all ${style.bg} ${style.border} ${
                    !notification.isRead ? "ring-2 ring-cta/20" : "opacity-80"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${style.text} bg-white/50`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {ServiceIcon && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 text-slate-600 flex items-center gap-1">
                                <ServiceIcon className="w-3 h-3" />
                                {notification.serviceType}
                              </span>
                            )}
                            <span className="text-xs text-slate-500">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className={`font-medium ${style.text}`}>{title}</p>
                          <p className="text-sm text-slate-600 mt-1">{message}</p>
                        </div>
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 hover:bg-white/50 rounded cursor-pointer"
                            title="Mark as read"
                          >
                            <X className="w-4 h-4 text-slate-400" />
                          </button>
                        )}
                      </div>
							</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
