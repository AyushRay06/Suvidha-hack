"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Zap,
  Flame,
  Droplets,
  Building2,
  FileText,
  MessageSquare,
  Bell,
  LogOut,
  User,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/kiosk/language-toggle";
import { useAuthStore } from "@/lib/store/auth";

interface Bill {
  id: string;
  serviceType: string;
  amount: number;
  dueDate: string;
  status: string;
}

interface Connection {
  id: string;
  serviceType: string;
  connectionNumber: string;
  status: string;
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [pendingBills, setPendingBills] = useState<Bill[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    fetchDashboardData();
  }, [isAuthenticated, router]);

  const fetchDashboardData = async () => {
    try {
      const token = useAuthStore.getState().tokens?.accessToken;
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch pending bills
      const billsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/billing/bills?status=UNPAID`,
        { headers }
      );
      if (billsRes.ok) {
        const data = await billsRes.json();
        setPendingBills(data.data?.slice(0, 3) || []);
      }

      // Fetch connections
      const connRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/connections`,
        { headers }
      );
      if (connRes.ok) {
        const data = await connRes.json();
        setConnections(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const serviceIcons: Record<string, any> = {
    ELECTRICITY: { icon: Zap, color: "text-electricity", bg: "bg-electricity-light" },
    GAS: { icon: Flame, color: "text-gas", bg: "bg-gas-light" },
    WATER: { icon: Droplets, color: "text-water", bg: "bg-water-light" },
    MUNICIPAL: { icon: Building2, color: "text-municipal", bg: "bg-municipal-light" },
  };

  const quickLinks = [
    { id: "bills", name: t("actions.payBills"), icon: FileText, href: "/bills", count: pendingBills.length },
    { id: "grievances", name: t("actions.grievances"), icon: MessageSquare, href: "/grievances" },
    { id: "notifications", name: t("actions.notifications"), icon: Bell, href: "/notifications" },
    { id: "profile", name: t("actions.myProfile"), icon: User, href: "/profile" },
  ];

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-white py-6 lg:py-8 px-6 lg:px-8 shadow-lg sticky top-0 z-40">
        <div className="max-w-full mx-auto flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className={`text-white/70 ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-base' : 'text-xs'}`}>
              {t("dashboard.welcomeBack")},
            </p>
            <h1 className={`font-heading font-bold text-white truncate ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-3xl' : 'text-2xl'}`}>
              {user?.name}
            </h1>
          </div>
          <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
            <LanguageToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:bg-white/10 text-xs lg:text-base px-2 lg:px-3 py-2 lg:py-2"
            >
              <LogOut className="w-4 h-4 lg:w-5 lg:h-5 lg:mr-2" />
              <span className="hidden lg:inline">{t("auth.logout")}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-6 lg:px-8 py-8 lg:py-10">
        {/* Pending Bills Alert */}
        {pendingBills.length > 0 && (
          <div className="alert-box alert-warning mb-8 lg:mb-10">
            <AlertCircle className="w-6 h-6 lg:w-8 lg:h-8 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className={`font-bold text-yellow-900 ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-lg' : 'text-base'}`}>
                {t("dashboard.pendingBillsAlert", { count: pendingBills.length })}
              </p>
              <p className={`text-yellow-800 mt-1 ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-base' : 'text-sm'}`}>
                Total: ₹{pendingBills.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
              </p>
            </div>
            <Link href="/bills" className="flex-shrink-0">
              <Button size="sm" variant="cta" className="kiosk-button text-sm lg:text-base">
                {t("bills.payNow")}
              </Button>
            </Link>
          </div>
        )}

        {/* Select a Service */}
        <section className="mb-12 lg:mb-16">
          <div className="section-header mb-8">
            {t("dashboard.selectService")}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Electricity */}
            <Link
              href="/services/electricity"
              className="kiosk-card group flex flex-col items-center text-center gap-4 p-6 lg:p-8 hover:shadow-lg hover:-translate-y-2"
            >
              <div className="w-20 lg:w-24 h-20 lg:h-24 bg-electricity-light rounded-2xl lg:rounded-3xl flex items-center justify-center group-hover:bg-electricity transition-all">
                <Zap className="w-10 lg:w-12 h-10 lg:h-12 text-electricity group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className={`font-semibold text-primary mb-1 ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-lg' : 'text-base'}`}>
                  {t("services.electricity")}
                </h3>
                <p className={`text-muted-foreground line-clamp-2 ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-sm' : 'text-xs'}`}>
                  {t("services.electricityDesc")}
                </p>
              </div>
            </Link>

            {/* Gas */}
            <Link
              href="/services/gas"
              className="kiosk-card group flex flex-col items-center text-center gap-4 p-6 lg:p-8 hover:shadow-lg hover:-translate-y-2"
            >
              <div className="w-20 lg:w-24 h-20 lg:h-24 bg-gas-light rounded-2xl lg:rounded-3xl flex items-center justify-center group-hover:bg-gas transition-all">
                <Flame className="w-10 lg:w-12 h-10 lg:h-12 text-gas group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className={`font-semibold text-primary mb-1 ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-lg' : 'text-base'}`}>
                  {t("services.gas")}
                </h3>
                <p className={`text-muted-foreground line-clamp-2 ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-sm' : 'text-xs'}`}>
                  {t("services.gasDesc")}
                </p>
              </div>
            </Link>

            {/* Water */}
            <Link
              href="/services/water"
              className="kiosk-card group flex flex-col items-center text-center gap-4 p-6 lg:p-8 hover:shadow-lg hover:-translate-y-2"
            >
              <div className="w-20 lg:w-24 h-20 lg:h-24 bg-water-light rounded-2xl lg:rounded-3xl flex items-center justify-center group-hover:bg-water transition-all">
                <Droplets className="w-10 lg:w-12 h-10 lg:h-12 text-water group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className={`font-semibold text-primary mb-1 ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-lg' : 'text-base'}`}>
                  {t("services.water")}
                </h3>
                <p className={`text-muted-foreground line-clamp-2 ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-sm' : 'text-xs'}`}>
                  {t("services.waterDesc")}
                </p>
              </div>
            </Link>

            {/* Municipal */}
            <Link
              href="/services/municipal"
              className="kiosk-card group flex flex-col items-center text-center gap-4 p-6 lg:p-8 hover:shadow-lg hover:-translate-y-2"
            >
              <div className="w-20 lg:w-24 h-20 lg:h-24 bg-municipal-light rounded-2xl lg:rounded-3xl flex items-center justify-center group-hover:bg-municipal transition-all">
                <Building2 className="w-10 lg:w-12 h-10 lg:h-12 text-municipal group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className={`font-semibold text-primary mb-1 ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-lg' : 'text-base'}`}>
                  {t("services.municipal")}
                </h3>
                <p className={`text-muted-foreground line-clamp-2 ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-sm' : 'text-xs'}`}>
                  {t("services.municipalDesc")}
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* Quick Links */}
        <section className="mb-12 lg:mb-16">
          <div className="section-header mb-8">
            {t("dashboard.quickActions")}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {quickLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="kiosk-card group flex flex-col items-center text-center gap-3 p-6 lg:p-8 hover:shadow-lg hover:-translate-y-2 relative"
              >
                <div className="w-16 lg:w-20 h-16 lg:h-20 bg-cta-light rounded-2xl lg:rounded-3xl flex items-center justify-center group-hover:bg-cta transition-colors">
                  <link.icon className={`${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'w-8 h-8' : 'w-7 h-7'} text-cta group-hover:text-white transition-colors`} />
                </div>
                <span className={`font-semibold text-primary ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-lg' : 'text-base'}`}>
                  {link.name}
                </span>
                {link.count && link.count > 0 && (
                  <span className="absolute top-4 right-4 bg-destructive text-white text-xs lg:text-sm font-bold px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-full">
                    {link.count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* My Connections */}
        <section className="mb-12 lg:mb-16">
          <div className="section-header mb-8">
            My Service Connections
          </div>

          {loading ? (
            <div className={`text-center py-12 text-muted-foreground ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-lg' : 'text-base'}`}>
              Loading...
            </div>
          ) : connections.length > 0 ? (
            <div className="space-y-4 lg:space-y-5">
              {connections.map((conn) => {
                const svc = serviceIcons[conn.serviceType] || serviceIcons.ELECTRICITY;
                const Icon = svc.icon;
                return (
                  <Link
                    key={conn.id}
                    href={`/services/${conn.serviceType.toLowerCase()}`}
                    className="kiosk-card-small flex items-center gap-4 lg:gap-6 hover:shadow-lg hover:-translate-y-1 group"
                  >
                    <div className={`w-14 lg:w-16 h-14 lg:h-16 ${svc.bg} rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-7 lg:w-8 h-7 lg:h-8 ${svc.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-primary ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-lg' : 'text-base'}`}>
                        {conn.serviceType}
                      </p>
                      <p className={`text-muted-foreground truncate ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-sm' : 'text-xs'}`}>
                        Connection: {conn.connectionNumber}
                      </p>
                    </div>
                    <span className={`status-badge ${conn.status === "ACTIVE" ? "status-active" : "status-inactive"} flex-shrink-0`}>
                      {conn.status}
                    </span>
                    <ChevronRight className="w-5 lg:w-6 h-5 lg:h-6 text-muted-foreground flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 lg:py-16">
              <p className={`text-muted-foreground mb-6 ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-lg' : 'text-base'}`}>
                No active connections yet
              </p>
              <Link href="/connections/new">
                <Button className="kiosk-button bg-cta text-white">
                  Apply for New Connection
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* Recent Bills */}
        {pendingBills.length > 0 && (
          <section>
            <div className="section-header mb-8">
              Pending Bills
            </div>
            <div className="space-y-4 lg:space-y-5">
              {pendingBills.map((bill) => {
                const svc = serviceIcons[bill.serviceType] || serviceIcons.ELECTRICITY;
                const Icon = svc.icon;
                return (
                  <div
                    key={bill.id}
                    className="kiosk-card-small flex items-center gap-4 lg:gap-6"
                  >
                    <div className={`w-14 lg:w-16 h-14 lg:h-16 ${svc.bg} rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-7 lg:w-8 h-7 lg:h-8 ${svc.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-primary ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-lg' : 'text-base'}`}>
                        {bill.serviceType}
                      </p>
                      <p className={`text-muted-foreground ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-sm' : 'text-xs'}`}>
                        Due: {new Date(bill.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`text-right flex-shrink-0 ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'mr-4' : ''}`}>
                      <p className={`font-bold text-cta ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-2xl' : 'text-lg'}`}>
                        ₹{bill.amount.toLocaleString()}
                      </p>
                    </div>
                    <Link href={`/bills/${bill.id}/pay`} className="flex-shrink-0">
                      <Button className="kiosk-button bg-cta text-white text-sm lg:text-base">
                        Pay
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
