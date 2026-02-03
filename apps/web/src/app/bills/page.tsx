"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Zap,
  Flame,
  Droplets,
  Building2,
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

interface Bill {
  id: string;
  serviceType: string;
  connectionNumber: string;
  billNumber: string;
  amount: number;
  dueDate: string;
  status: "UNPAID" | "PAID" | "OVERDUE";
  billPeriod: string;
}

export default function BillsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, tokens } = useAuthStore();
  
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "UNPAID" | "PAID">("ALL");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchBills();
  }, [isAuthenticated, router]);

  const fetchBills = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/billing/bills`,
        { headers: { Authorization: `Bearer ${tokens?.accessToken}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setBills(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const serviceIcons: Record<string, any> = {
    ELECTRICITY: { icon: Zap, color: "text-electricity", bg: "bg-electricity-light" },
    GAS: { icon: Flame, color: "text-gas", bg: "bg-gas-light" },
    WATER: { icon: Droplets, color: "text-water", bg: "bg-water-light" },
    MUNICIPAL: { icon: Building2, color: "text-municipal", bg: "bg-municipal-light" },
  };

  const statusStyles: Record<string, { icon: any; bg: string; text: string }> = {
    PAID: { icon: CheckCircle, bg: "bg-success/10", text: "text-success" },
    UNPAID: { icon: Clock, bg: "bg-amber-100", text: "text-amber-700" },
    OVERDUE: { icon: AlertTriangle, bg: "bg-red-100", text: "text-red-700" },
  };

  const filteredBills = bills.filter((b) => filter === "ALL" || b.status === filter);
  
  const totalUnpaid = bills
    .filter((b) => b.status === "UNPAID" || b.status === "OVERDUE")
    .reduce((sum, b) => sum + b.amount, 0);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-primary text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="hover:opacity-80">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="font-heading text-xl font-bold">{t("bills.title")}</h1>
            <p className="text-white/80 text-sm">View and pay your bills</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Total Outstanding */}
        {totalUnpaid > 0 && (
          <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 text-white mb-6">
            <p className="text-white/80 text-sm">Total Outstanding</p>
            <p className="font-heading text-3xl font-bold">₹{totalUnpaid.toLocaleString()}</p>
            <Button variant="cta" className="mt-4">
              <CreditCard className="w-4 h-4 mr-2" />
              Pay All Bills
            </Button>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(["ALL", "UNPAID", "PAID"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filter === f
                  ? "bg-cta text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-cta"
              }`}
            >
              {f === "ALL" ? "All Bills" : f}
              {f === "UNPAID" && bills.filter((b) => b.status === "UNPAID").length > 0 && (
                <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                  {bills.filter((b) => b.status === "UNPAID" || b.status === "OVERDUE").length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bills List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : filteredBills.length > 0 ? (
          <div className="space-y-4">
            {filteredBills.map((bill) => {
              const svc = serviceIcons[bill.serviceType] || serviceIcons.ELECTRICITY;
              const Icon = svc.icon;
              const status = statusStyles[bill.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={bill.id}
                  className="kiosk-card flex flex-col md:flex-row md:items-center gap-4"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 ${svc.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${svc.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-primary">{bill.serviceType}</p>
                      <p className="text-sm text-muted-foreground">
                        Bill #{bill.billNumber} • {bill.billPeriod}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Connection: {bill.connectionNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4">
                    <div className="text-right">
                      <p className="font-bold text-xl text-primary">₹{bill.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        Due: {new Date(bill.dueDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.bg} ${status.text}`}>
                        <StatusIcon className="w-3 h-3" />
                        {bill.status}
                      </span>

                      {bill.status !== "PAID" && (
                        <Link href={`/bills/${bill.id}/pay`}>
                          <Button size="sm" variant="cta">
                            {t("bills.payNow")}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-muted-foreground">{t("bills.noBills")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FileText(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}
