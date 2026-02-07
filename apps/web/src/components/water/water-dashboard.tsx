"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Droplets,
    FileText,
    TrendingUp,
    Calendar,
    ArrowLeft,
    Gauge,
    AlertCircle,
    Plus,
    History,
    IndianRupee,
    Wrench,
    Phone
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { WaterConsumptionChart } from "./consumption-chart";

interface Connection {
    id: string;
    connectionNo: string;
    meterNo?: string;
    loadType: string;
    status: string;
    address: string;
    lastReading?: number;
    lastReadingDate?: string;
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

export function WaterDashboard() {
    const router = useRouter();
    const { tokens, isAuthenticated } = useAuthStore();
    const [connection, setConnection] = useState<Connection | null>(null);
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        if (!isAuthenticated) {
            const returnUrl = encodeURIComponent('/services/water');
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

            // Fetch user's water connections
            const response = await fetch(
                `${apiUrl}/api/connections?serviceType=WATER`,
                { headers }
            );

            if (response.status === 401) {
                const returnUrl = encodeURIComponent('/services/water');
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
                    `${apiUrl}/api/billing/bills?serviceType=WATER`,
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
            <header className="bg-water-light py-6 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/dashboard" className="hover:opacity-80">
                            <ArrowLeft className="w-6 h-6 text-water" />
                        </Link>
                        <div className="w-14 h-14 bg-white/50 rounded-xl flex items-center justify-center">
                            <Droplets className="w-8 h-8 text-water" />
                        </div>
                        <div>
                            <h1 className="font-heading text-2xl font-bold text-water">
                                Water
                            </h1>
                            <p className="text-slate-600 text-sm">Manage your water services</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-6">

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

                {/* Quick Actions Grid */}
                <section className="mb-8">
                    <h2 className="font-heading text-lg text-primary mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {/* 1. Pay Bill */}
                        <Link
                            href="/bills"
                            className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent bg-white group"
                        >
                            <div className="w-10 h-10 bg-water-light rounded-lg flex items-center justify-center mb-2 group-hover:bg-water group-hover:text-white transition-colors">
                                <IndianRupee className="w-5 h-5 text-water group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-tight">Pay Bill</span>
                        </Link>

                        {/* 2. Submit Reading */}
                        <Link
                            href="/services/water/reading"
                            className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent bg-white group"
                        >
                            <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                                <Gauge className="w-5 h-5 text-cyan-600 group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-tight">Submit Reading</span>
                        </Link>

                        {/* 3. Report Leakage */}
                        <Link
                            href="/grievances/new?category=WATER_LEAKAGE"
                            className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent bg-white group"
                        >
                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                <Wrench className="w-5 h-5 text-red-600 group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-tight">Report Leak</span>
                        </Link>

                        {/* 4. Quality Complaint */}
                        <Link
                            href="/grievances/new?category=WATER_QUALITY"
                            className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent bg-white group"
                        >
                            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                <AlertCircle className="w-5 h-5 text-amber-600 group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-tight">Quality Issue</span>
                        </Link>

                        {/* 5. History */}
                        <Link
                            href="/bills"
                            className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent bg-white group"
                        >
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-slate-500 group-hover:text-white transition-colors">
                                <History className="w-5 h-5 text-slate-600 group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-tight">History</span>
                        </Link>

                        {/* 6. Support */}
                        <Link
                            href="/support"
                            className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent bg-white group"
                        >
                            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-green-500 group-hover:text-white transition-colors">
                                <Phone className="w-5 h-5 text-green-600 group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-tight">Support</span>
                        </Link>
                    </div>
                </section>

                {/* My Connections */}
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-heading text-lg text-primary">My Connections</h2>
                        <Link href="/connections/new">
                            <Button variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                New Connection
                            </Button>
                        </Link>
                    </div>

                    {connection ? (
                        <Card className="border-2 hover:border-water-light transition-colors">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-water-light rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Droplets className="w-6 h-6 text-water" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-medium text-primary">
                                                Connection: {connection.connectionNo}
                                            </p>
                                            <Badge variant={connection.status === "ACTIVE" ? "default" : "secondary"}>
                                                {connection.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{connection.address}</p>
                                        {connection.meterNo && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Meter: {connection.meterNo}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 mt-3 text-sm">
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Gauge className="w-4 h-4" />
                                                Last: {connection.lastReading || 0} kL
                                            </div>
                                            {connection.lastReadingDate && (
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(connection.lastReadingDate).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="text-center py-8">
                            <Droplets className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                            <p className="text-muted-foreground mb-4">No water connections yet</p>
                            <Link href="/connections/new">
                                <Button variant="cta">Apply for New Connection</Button>
                            </Link>
                        </div>
                    )}
                </section>

                {/* Consumption Chart */}
                {connection && (
                    <section className="mb-8">
                        <h2 className="font-heading text-lg text-primary mb-4">Consumption History</h2>
                        <Card>
                            <CardContent className="p-4">
                                <WaterConsumptionChart connectionId={connection.id} />
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* Recent Bills */}
                {bills.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-heading text-lg text-primary">Recent Bills</h2>
                            <Link href="/bills" className="text-cta text-sm hover:underline">
                                View All
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {bills.map((bill) => (
                                <Card key={bill.billNo} className="hover:border-water-light transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-water-light rounded-lg flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-water" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{bill.billNo}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(bill.billDate).toLocaleDateString()} • {bill.unitsConsumed} kL
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary">₹{bill.amount.toLocaleString()}</p>
                                                <Badge variant={bill.status === "PAID" ? "default" : "secondary"} className="text-xs">
                                                    {bill.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
