"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
    Flame,
    History,
    AlertCircle,
    Plus,
    ArrowLeft,
    IndianRupee,
    MapPin,
    Truck,
    Calendar,
    ChevronRight,
    FileText,
    TrendingUp,
    Gauge
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { GasBookingDialog } from "@/components/gas/booking-dialog";
import { GasConsumptionChart } from "./gas-consumption-chart";
import { DownloadGasBillBtn } from "./download-gas-bill-btn";

interface GasConnection {
    id: string;
    connectionNo: string;
    provider: string;
    agency: string;
    cylinders?: number;
    address: string;
    status: string;
    lastReading?: number;
    lastReadingDate?: string;
    city: string;
}

interface GasBooking {
    id: string;
    bookingId: string;
    bookingDate: string;
    status: 'BOOKED' | 'DISPATCHED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
    amount: number;
    subsidyAmount?: number;
    deliveryDate?: string;
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

export function GasDashboard() {
    const router = useRouter();
    const { tokens, isAuthenticated } = useAuthStore();
    const { toast } = useToast();

    // State
    const [connection, setConnection] = useState<GasConnection | null>(null);
    const [bookings, setBookings] = useState<GasBooking[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBookingDialog, setShowBookingDialog] = useState(false);

    const fetchGasData = useCallback(async () => {
        if (!tokens?.accessToken) return;

        try {
            setLoading(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const headers = {
                Authorization: `Bearer ${tokens.accessToken}`,
            };

            // 1. Fetch Connection
            const connResponse = await fetch(`${apiUrl}/api/gas/connections`, { headers });

            if (connResponse.status === 401) {
                router.push('/auth/login');
                return;
            }

            const connData = await connResponse.json();

            if (connData.success && connData.data.length > 0) {
                const activeConnection = connData.data[0];
                setConnection(activeConnection);

                // 2. Fetch History based on type
                if (activeConnection.cylinders) {
                    // Cylinder: Fetch Bookings
                    const bookingResponse = await fetch(
                        `${apiUrl}/api/gas/bookings?connectionId=${activeConnection.id}`,
                        { headers }
                    );
                    const bookingData = await bookingResponse.json();
                    if (bookingData.success) {
                        setBookings(bookingData.data);
                    }
                } else {
                    // Metered: Fetch Consumption/Bills
                    const consumptionResponse = await fetch(
                        `${apiUrl}/api/gas/consumption/${activeConnection.id}`,
                        { headers }
                    );
                    if (consumptionResponse.ok) {
                        const consumptionData = await consumptionResponse.json();
                        if (consumptionData.success) {
                            setBills(consumptionData.data.bills.slice(0, 5));
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch gas data:", error);
            toast({
                title: "Error",
                description: "Failed to load gas services. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [tokens, router, toast]);

    useEffect(() => {
        if (!isAuthenticated) {
            const returnUrl = encodeURIComponent('/services/gas');
            router.push(`/auth/login?returnUrl=${returnUrl}`);
            return;
        }
        fetchGasData();
    }, [isAuthenticated, router, fetchGasData]);

    const handleBookingSuccess = (booking: any) => {
        setBookings(prev => [booking, ...prev]);
        setShowBookingDialog(false);
        toast({
            title: "Booking Confirmed",
            description: `Refill booked successfully! ID: ${booking.bookingId}`,
        });
    };

    if (!isAuthenticated) return null;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-gas border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground animate-pulse font-medium">Loading Gas Services...</p>
                </div>
            </div>
        );
    }

    const pendingBills = bills.filter(b => b.status !== "PAID");

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header - Aligned with Electricity */}
            <header className="bg-gas-light py-6 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/dashboard" className="hover:opacity-80">
                            <ArrowLeft className="w-6 h-6 text-gas" />
                        </Link>
                        <div className="w-14 h-14 bg-white/50 rounded-xl flex items-center justify-center shadow-sm">
                            <Flame className="w-8 h-8 text-gas" />
                        </div>
                        <div>
                            <h1 className="font-heading text-2xl font-bold text-gas">
                                Gas Services
                            </h1>
                            <p className="text-slate-600 text-sm">Manage your LPG and Piped Gas services</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-6">
                {/* Pending Bills Alert */}
                {connection && !connection.cylinders && pendingBills.length > 0 && (
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

                {/* Quick Actions Grid - Standardized with 6 Primary Actions */}
                <section className="mb-8">
                    <h2 className="font-heading text-lg text-primary mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {/* 1. Pay Bill - Always Visible */}
                        <Link
                            href="/bills"
                            className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent bg-white group"
                        >
                            <div className="w-10 h-10 bg-gas-light rounded-lg flex items-center justify-center mb-2 group-hover:bg-gas group-hover:text-white transition-colors">
                                <IndianRupee className="w-5 h-5 text-gas group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-tight">Pay Bill</span>
                        </Link>

                        {/* 2. Submit Reading - Always Visible */}
                        <Link
                            href="/services/gas/reading"
                            className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent bg-white group"
                        >
                            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                <FileText className="w-5 h-5 text-amber-600 group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-tight">Submit Reading</span>
                        </Link>

                        {/* 3. Book Cylinder / Refill */}
                        <div
                            onClick={() => setShowBookingDialog(true)}
                            className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent cursor-pointer bg-white group"
                        >
                            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                <Flame className="w-5 h-5 text-orange-600 group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-tight">
                                {connection?.cylinders ? "Book Refill" : "New Booking"}
                            </span>
                        </div>

                        {/* 4. Track Order */}
                        <div className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent cursor-pointer bg-white group">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <Truck className="w-5 h-5 text-blue-600 group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-tight">Track Order</span>
                        </div>

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
                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                <AlertCircle className="w-5 h-5 text-red-600 group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-tight">Support</span>
                        </Link>
                    </div>
                </section>

                {/* My Connections Section */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-heading text-lg text-primary">My Connections</h2>
                        <Link href="/connections/new?serviceType=GAS">
                            <Button variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                New Connection
                            </Button>
                        </Link>
                    </div>

                    {!connection ? (
                        <div className="text-center py-8">
                            <Flame className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                            <p className="text-muted-foreground mb-4">No gas connections yet</p>
                            <Link href="/connections/new?serviceType=GAS">
                                <Button variant="cta">Apply for New Connection</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Connection Profile Card - Simpler Layout */}
                            <div className="kiosk-card flex flex-col md:flex-row md:items-center gap-4 bg-white p-6 shadow-sm border border-slate-100 rounded-2xl">
                                <div className="w-14 h-14 bg-gas-light rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Flame className="w-7 h-7 text-gas" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-primary text-xl">
                                            {connection.provider || "Indane Gas"}
                                        </h3>
                                        <Badge variant="secondary" className="font-medium text-[10px] uppercase tracking-wider">
                                            {connection.cylinders ? "Cylinder" : "Piped Gas"}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {connection.address}, {connection.city}
                                    </p>
                                    <div className="flex gap-4 mt-3 text-xs font-medium text-slate-600">
                                        <span className="bg-slate-50 px-2 py-1 rounded">No: {connection.connectionNo}</span>
                                        <span className="bg-slate-50 px-2 py-1 rounded font-bold underline decoration-gas/30 decoration-2 underline-offset-4 decoration-skip-ink">Agency: {connection.agency}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        {connection.cylinders ? (
                                            <>
                                                <p className="text-xs text-muted-foreground">Subscription</p>
                                                <p className="font-bold text-gas uppercase tracking-tight">{connection.cylinders === 2 ? "DBC" : "SBC"}</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-xs text-muted-foreground">Last Reading</p>
                                                <p className="font-bold text-gas">{connection.lastReading || 0} SCM</p>
                                            </>
                                        )}
                                    </div>
                                    <Badge variant={connection.status === "ACTIVE" ? "default" : "secondary"} className="h-6">
                                        {connection.status}
                                    </Badge>
                                </div>
                            </div>

                            {/* Consumption Analysis - Prominent like Electricity */}
                            {!connection.cylinders && bills.length > 0 && (
                                <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <GasConsumptionChart bills={bills} />
                                </div>
                            )}

                            {/* Recent Activity Card */}
                            <Card className="mt-8 overflow-hidden shadow-sm border-slate-200">
                                <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                            {connection.cylinders ? <Truck className="h-4 w-4 text-orange-600" /> : <FileText className="h-4 w-4 text-blue-600" />}
                                        </div>
                                        <CardTitle className="text-base font-bold">
                                            {connection.cylinders ? "Recent Bookings" : "Recent Bills"}
                                        </CardTitle>
                                    </div>
                                    <Link href="/bills">
                                        <Button variant="outline" size="sm" className="text-xs">View All</Button>
                                    </Link>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-100">
                                        {connection.cylinders ? (
                                            bookings.length === 0 ? (
                                                <div className="p-8 text-center text-muted-foreground text-sm">No recent bookings</div>
                                            ) : (
                                                bookings.slice(0, 5).map((booking) => (
                                                    <div key={booking.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                                                <Truck className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-primary text-sm">{booking.bookingId}</span>
                                                                    <Badge variant={booking.status === 'DELIVERED' ? 'default' : 'secondary'} className="text-[10px] font-bold">
                                                                        {booking.status}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {new Date(booking.bookingDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-black text-lg">₹{booking.amount}</p>
                                                            {booking.subsidyAmount && <p className="text-[10px] text-green-600 font-bold tracking-tight">₹{booking.subsidyAmount} Subsidy</p>}
                                                        </div>
                                                    </div>
                                                ))
                                            )
                                        ) : (
                                            bills.length === 0 ? (
                                                <div className="p-8 text-center text-muted-foreground text-sm">No recent bills</div>
                                            ) : (
                                                bills.map((bill) => (
                                                    <div key={bill.billNo} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                                                <IndianRupee className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-black text-primary text-sm tracking-tight">INV-{bill.billNo.split('-').pop()}</span>
                                                                    <Badge variant={bill.status === "PAID" ? "default" : "destructive"} className="text-[10px] font-bold">
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
                                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none mb-1">{bill.unitsConsumed} SCM</p>
                                                                <p className="font-black text-lg text-primary leading-none">₹{bill.amount}</p>
                                                            </div>
                                                            <DownloadGasBillBtn bill={bill} connection={connection} />
                                                        </div>
                                                    </div>
                                                ))
                                            )
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Safety Alert - Footer style */}
                            <div className="mt-8 bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden group shadow-xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gas/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-gas/30 transition-colors" />
                                <div className="flex flex-col md:flex-row gap-6 items-center md:justify-between relative z-10">
                                    <div className="flex items-center gap-4 text-center md:text-left">
                                        <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center text-slate-900 shrink-0">
                                            <AlertCircle className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-lg tracking-tight">Safety Emergency?</h4>
                                            <p className="text-xs text-slate-400 font-medium">Smell leakage? Open windows and turn off regulator immediately.</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/10 px-6 py-2 rounded-xl border border-white/10 flex flex-col items-center">
                                        <p className="text-[10px] text-gas font-black uppercase tracking-widest mb-1">Emergency Helpline</p>
                                        <p className="text-3xl font-black text-white leading-tight mt-[-4px]">1906</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* Booking Dialog */}
            {connection && (
                <GasBookingDialog
                    open={showBookingDialog}
                    onOpenChange={setShowBookingDialog}
                    connectionId={connection.id}
                    onSuccess={handleBookingSuccess}
                />
            )}
        </div>
    );
}
