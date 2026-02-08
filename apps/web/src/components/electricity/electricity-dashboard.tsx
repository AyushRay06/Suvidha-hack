"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Zap,
    FileText,
    TrendingUp,
    Calendar,
    ArrowLeft,
    Gauge,
    AlertCircle,
    Plus
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { DownloadBillBtn } from "./download-bill-btn";
import { ConsumptionChart } from "./consumption-chart";
import { RechargeMeter } from "./recharge-meter";
import { OutageReportForm } from "./outage-report-form";

interface Connection {
    id: string;
    connectionNo: string;
    loadType: string;
    phase: string;
    sanctionedLoad: number;
    lastReading: number;
    lastReadingDate: string;
    status: string;
    address: string;
}

interface Bill {
    billNo: string;
    billDate: string;
    periodFrom: string;
    periodTo: string;
    unitsConsumed: number;
    amount: number;
    status: string;
}

export function ElectricityDashboard() {
    const router = useRouter();
    const { tokens, isAuthenticated } = useAuthStore();
    const [connection, setConnection] = useState<Connection | null>(null);
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");

    const [showRecharge, setShowRecharge] = useState(false);
    const [showOutageReport, setShowOutageReport] = useState(false);
    // Mock balance state for demo
    const [prepaidBalance, setPrepaidBalance] = useState(245.50);

    useEffect(() => {
        if (!isAuthenticated) {
            // Redirect to login with return URL
            const returnUrl = encodeURIComponent('/services/electricity');
            router.push(`/auth/login?returnUrl=${returnUrl}`);
            return;
        }
        fetchConnectionData();
    }, [isAuthenticated, router]);

    const fetchConnectionData = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokens?.accessToken}`,
            };

            // Fetch user's electricity connections
            const response = await fetch(
                `${apiUrl}/api/connections?serviceType=ELECTRICITY`,
                { headers }
            );

            // Check for unauthorized - token might be invalid/expired
            if (response.status === 401) {
                const returnUrl = encodeURIComponent('/services/electricity');
                router.push(`/auth/login?returnUrl=${returnUrl}`);
                return;
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch connections: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.data.length > 0) {
                const conn = data.data[0];
                setConnection(conn);

                // Fetch bills for this connection
                const billsResponse = await fetch(
                    `${apiUrl}/api/billing/bills?serviceType=ELECTRICITY`,
                    { headers }
                );

                if (billsResponse.ok) {
                    const billsData = await billsResponse.json();
                    if (billsData.success) {
                        setBills(billsData.data.slice(0, 5));
                    }
                }
            }
        } catch (error: any) {
            console.error("Failed to fetch connection data:", error);
            setError(error.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) return null;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    const pendingBills = bills.filter(b => b.status !== "PAID");

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <header className="bg-electricity-light py-6">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/dashboard" className="hover:opacity-80">
                            <ArrowLeft className="w-6 h-6 text-electricity" />
                        </Link>
                        <div className="w-14 h-14 bg-white/50 rounded-xl flex items-center justify-center">
                            <Zap className="w-8 h-8 text-electricity" />
                        </div>
                        <div>
                            <h1 className="font-heading text-2xl font-bold text-electricity">
                                Electricity
                            </h1>
                            <p className="text-slate-600 text-sm">Manage your electricity services</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-6 pb-12">

                {/* Feature Toggles / Active View */}
                {showRecharge && connection ? (
                    <div className="mb-6">
                        <Button
                            variant="ghost"
                            className="mb-4 pl-0"
                            onClick={() => setShowRecharge(false)}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                        </Button>
                        <RechargeMeter
                            connectionId={connection.id}
                            meterNo={connection.connectionNo} // Use connectionNo as meterNo for demo
                            currentBalance={prepaidBalance}
                            onRechargeComplete={(amount) => {
                                setPrepaidBalance(prev => prev + amount);
                                setTimeout(() => setShowRecharge(false), 2000);
                            }}
                        />
                    </div>
                ) : showOutageReport && connection ? (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <Button
                                variant="ghost"
                                className="pl-0"
                                onClick={() => setShowOutageReport(false)}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                            </Button>
                        </div>
                        <OutageReportForm
                            connectionId={connection.id}
                            onSuccess={() => setTimeout(() => setShowOutageReport(false), 2000)}
                        />
                    </div>
                ) : (
                    <>
                        {/* Pending Bills Alert */}
                        {pendingBills.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium text-amber-800">
                                        {pendingBills.length} pending bill{pendingBills.length > 1 ? "s" : ""}
                                    </p>
                                    <p className="text-sm text-amber-700">
                                        Total: ₹{pendingBills.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
                                    </p>
                                </div>
                                <Link href="/bills">
                                    <Button size="sm" variant="cta">Pay Now</Button>
                                </Link>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <section className="mb-8">
                            <h2 className="font-heading text-lg text-primary mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                {/* 1. Pay Bills */}
                                <Link
                                    href="/bills"
                                    className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent bg-white group"
                                >
                                    <div className="w-10 h-10 bg-electricity-light rounded-lg flex items-center justify-center mb-2 group-hover:bg-electricity group-hover:text-white transition-colors">
                                        <FileText className="w-5 h-5 text-electricity group-hover:text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-primary uppercase tracking-tight">Pay Bills</span>
                                </Link>

                                {/* 2. Submit Reading */}
                                <Link
                                    href={`/services/electricity/meter-reading`}
                                    className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent bg-white group"
                                >
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        <Gauge className="w-5 h-5 text-blue-600 group-hover:text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-primary uppercase tracking-tight">Submit Reading</span>
                                </Link>

                                {/* 3. Recharge */}
                                <div
                                    onClick={() => setShowRecharge(true)}
                                    className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent cursor-pointer bg-white group"
                                >
                                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-green-500 group-hover:text-white transition-colors">
                                        <TrendingUp className="w-5 h-5 text-green-600 group-hover:text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-primary uppercase tracking-tight">Recharge</span>
                                </div>

                                {/* 4. Grievances */}
                                <Link
                                    href="/grievances"
                                    className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent bg-white group"
                                >
                                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                        <AlertCircle className="w-5 h-5 text-red-600 group-hover:text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-primary uppercase tracking-tight">Grievances</span>
                                </Link>

                                {/* 5. History */}
                                <Link
                                    href="/bills"
                                    className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent bg-white group"
                                >
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-slate-500 group-hover:text-white transition-colors">
                                        <FileText className="w-5 h-5 text-slate-600 group-hover:text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-primary uppercase tracking-tight">History</span>
                                </Link>

                                {/* 6. Support */}
                                <Link
                                    href="/support"
                                    className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent bg-white group"
                                >
                                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                        <AlertCircle className="w-5 h-5 text-purple-600 group-hover:text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-primary uppercase tracking-tight">Support</span>
                                </Link>
                            </div>
                        </section>

                        {/* My Connections */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-heading text-lg text-primary">My Connections</h2>
                                <Link href="/connections/new">
                                    <Button variant="outline" size="sm">
                                        <Plus className="w-4 h-4 mr-2" />
                                        New Connection
                                    </Button>
                                </Link>
                            </div>

                            {error ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Error Loading Data</CardTitle>
                                        <CardDescription>{error}</CardDescription>
                                    </CardHeader>
                                </Card>
                            ) : !connection ? (
                                <div className="text-center py-8">
                                    <Zap className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                    <p className="text-muted-foreground mb-4">No electricity connections yet</p>
                                    <Link href="/connections/new">
                                        <Button variant="cta">Apply for New Connection</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Connection Profile Card */}
                                    <div className="kiosk-card flex flex-col md:flex-row md:items-center gap-4 bg-white p-6 shadow-sm border border-slate-100 rounded-2xl">
                                        <div className="w-14 h-14 bg-electricity-light rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Zap className="w-7 h-7 text-electricity" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-primary text-xl">
                                                    {connection.loadType} Connection
                                                </h3>
                                                <Badge variant="secondary" className="font-medium text-[10px] uppercase tracking-wider">
                                                    {connection.phase || "Single Phase"}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{connection.address}</p>
                                            <div className="flex gap-4 mt-3 text-xs font-medium text-slate-600">
                                                <span className="bg-slate-50 px-2 py-1 rounded">No: {connection.connectionNo}</span>
                                                <span className="bg-green-50 px-2 py-1 rounded font-bold text-green-600">Balance: ₹{prepaidBalance.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            {connection.lastReading && (
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground">Last Reading</p>
                                                    <p className="font-bold text-electricity">{connection.lastReading} units</p>
                                                </div>
                                            )}
                                            <Badge variant={connection.status === "ACTIVE" ? "default" : "secondary"} className="h-6">
                                                {connection.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Consumption Chart */}
                                    {bills.length > 0 && (
                                        <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                            <ConsumptionChart bills={bills} />
                                        </div>
                                    )}

                                    {/* Recent Bills */}
                                    {bills.length > 0 && (
                                        <Card className="mt-8 overflow-hidden shadow-sm border-slate-200">
                                            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                                        <FileText className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <CardTitle className="text-base font-bold">Recent Bills</CardTitle>
                                                </div>
                                                <Link href="/bills">
                                                    <Button variant="outline" size="sm" className="text-xs">View All</Button>
                                                </Link>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <div className="divide-y divide-slate-100">
                                                    {bills.map((bill) => (
                                                        <div
                                                            key={bill.billNo}
                                                            className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-electricity-light rounded-xl flex items-center justify-center text-electricity">
                                                                    <Zap className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-black text-primary text-sm tracking-tight">INV-{bill.billNo.split('-').pop()}</span>
                                                                        <Badge
                                                                            variant={bill.status === "PAID" ? "default" : "destructive"}
                                                                            className="text-[10px] font-bold"
                                                                        >
                                                                            {bill.status}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                                                                        {new Date(bill.periodFrom).toLocaleDateString()} - {new Date(bill.periodTo).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <div className="text-right">
                                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none mb-1">{bill.unitsConsumed} units</p>
                                                                    <p className="font-black text-lg text-primary leading-none">₹{bill.amount}</p>
                                                                </div>
                                                                <DownloadBillBtn bill={bill} connection={connection} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
