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
            <header className="bg-electricity-light py-6 px-6">
                <div className="max-w-4xl mx-auto">
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

                {/* Quick Actions */}
                <section className="mb-8">
                    <h2 className="font-heading text-lg text-primary mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Link
                            href="/bills"
                            className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent"
                        >
                            <div className="w-10 h-10 bg-electricity-light rounded-lg flex items-center justify-center mb-2">
                                <FileText className="w-5 h-5 text-electricity" />
                            </div>
                            <span className="text-sm font-medium text-primary">Pay Bills</span>
                        </Link>

                        <Link
                            href={`/services/electricity/meter-reading`}
                            className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent"
                        >
                            <div className="w-10 h-10 bg-electricity-light rounded-lg flex items-center justify-center mb-2">
                                <Gauge className="w-5 h-5 text-electricity" />
                            </div>
                            <span className="text-sm font-medium text-primary">Submit Reading</span>
                        </Link>

                        <Link
                            href="/grievances/new"
                            className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent"
                        >
                            <div className="w-10 h-10 bg-electricity-light rounded-lg flex items-center justify-center mb-2">
                                <AlertCircle className="w-5 h-5 text-electricity" />
                            </div>
                            <span className="text-sm font-medium text-primary">Report Outage</span>
                        </Link>

                        <Link
                            href="/connections/new"
                            className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent"
                        >
                            <div className="w-10 h-10 bg-electricity-light rounded-lg flex items-center justify-center mb-2">
                                <Plus className="w-5 h-5 text-electricity" />
                            </div>
                            <span className="text-sm font-medium text-primary">New Connection</span>
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
                        <div className="space-y-3">
                            <div className="kiosk-card flex flex-col md:flex-row md:items-center gap-4">
                                <div className="w-12 h-12 bg-electricity-light rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Zap className="w-6 h-6 text-electricity" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-primary">
                                        Connection: {connection.connectionNo}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{connection.address}</p>
                                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                        <span>Load: {connection.loadType}</span>
                                        <span>Phase: {connection.phase}</span>
                                        <span>Sanctioned: {connection.sanctionedLoad} kW</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {connection.lastReading && (
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Last Reading</p>
                                            <p className="font-medium">{connection.lastReading} units</p>
                                        </div>
                                    )}
                                    <Badge variant={connection.status === "ACTIVE" ? "default" : "secondary"}>
                                        {connection.status}
                                    </Badge>
                                </div>
                            </div>

                            {/* Recent Bills */}
                            {bills.length > 0 && (
                                <Card className="mt-6">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-blue-500" />
                                                Recent Bills
                                            </CardTitle>
                                            <Link href="/bills">
                                                <Button variant="outline" size="sm">View All</Button>
                                            </Link>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {bills.map((bill) => (
                                                <div
                                                    key={bill.billNo}
                                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-sm">{bill.billNo}</p>
                                                            <Badge
                                                                variant={
                                                                    bill.status === "PAID"
                                                                        ? "default"
                                                                        : bill.status === "PENDING"
                                                                            ? "destructive"
                                                                            : "secondary"
                                                                }
                                                                className="text-xs"
                                                            >
                                                                {bill.status}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {new Date(bill.periodFrom).toLocaleDateString()} - {new Date(bill.periodTo).toLocaleDateString()} • {bill.unitsConsumed} units
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-lg">₹{bill.amount}</p>
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
            </div>
        </div>
    );
}
