"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
    Gauge,
    CheckCircle,
    Clock,
    XCircle,
    FileText,
    Zap,
    Droplet,
    Flame,
    Eye,
    Check,
    X,
    Image as ImageIcon,
    TrendingUp,
    Calendar,
    User,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { PhotoModal } from "@/components/admin/PhotoModal";

interface MeterReading {
    id: string;
    connectionId: string;
    userId: string;
    serviceType: string;
    reading: number;
    previousReading: number | null;
    consumption: number | null;
    readingDate: string;
    submittedBy: string;
    photoUrl: string | null;
    status: string;
    isVerified: boolean;
    verifiedBy: string | null;
    verifiedAt: string | null;
    notes: string | null;
    connection: {
        connectionNo: string;
        address: string;
    };
    user: {
        name: string;
        phone: string;
    };
}

const serviceIcons: Record<string, any> = {
    ELECTRICITY: { icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
    WATER: { icon: Droplet, color: "text-blue-600", bg: "bg-blue-50" },
    GAS: { icon: Flame, color: "text-orange-600", bg: "bg-orange-50" },
};

const statusConfig: Record<string, { label: string; labelHi: string; color: string; icon: any }> = {
    PENDING: { label: "Pending", labelHi: "लंबित", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
    VERIFIED: { label: "Verified", labelHi: "सत्यापित", color: "bg-success/10 text-success border-success/20", icon: CheckCircle },
    REJECTED: { label: "Rejected", labelHi: "अस्वीकृत", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
    BILLED: { label: "Billed", labelHi: "बिल किया गया", color: "bg-primary/10 text-primary border-primary/20", icon: FileText },
};

export default function AdminMeterReadingsPage() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const isHindi = i18n.language === "hi";

    const { user, isAuthenticated } = useAuthStore();

    const [readings, setReadings] = useState<MeterReading[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("ALL");
    const [selectedReading, setSelectedReading] = useState<MeterReading | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [photoModal, setPhotoModal] = useState<{ url: string; title: string } | null>(null);

    useEffect(() => {
        if (!isAuthenticated || (user?.role !== "ADMIN" && user?.role !== "STAFF")) {
            router.push("/auth/login");
            return;
        }
        fetchReadings();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchReadings();
        }, 30000);

        return () => clearInterval(interval);
    }, [isAuthenticated, user, router, filter]);

    const fetchReadings = async () => {
        try {
            setRefreshing(true);
            const token = useAuthStore.getState().tokens?.accessToken;
            const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/admin/meter-readings${filter !== "ALL" ? `?status=${filter}` : ""}`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setReadings(data.data || []);
            } else {
                console.error("Failed to fetch readings");
            }
        } catch (err) {
            console.error("Failed to fetch readings:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleVerify = async (id: string) => {
        try {
            const token = useAuthStore.getState().tokens?.accessToken;
            await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/admin/meter-readings/${id}/verify`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            fetchReadings();
        } catch (err) {
            console.error("Failed to verify reading:", err);
        }
    };

    const handleReject = async (id: string) => {
        try {
            const token = useAuthStore.getState().tokens?.accessToken;
            await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/admin/meter-readings/${id}/reject`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            fetchReadings();
        } catch (err) {
            console.error("Failed to reject reading:", err);
        }
    };

    const filteredReadings = filter === "ALL" ? readings : readings.filter(r => r.status === filter);

    if (!isAuthenticated || (user?.role !== "ADMIN" && user?.role !== "STAFF")) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Sidebar */}
            <AdminSidebar activeId="meter-readings" />

            {/* Main Content */}
            <main className="flex-1 ml-64 overflow-auto">
                <header className="bg-white border-b px-6 py-4 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-primary">
                                {isHindi ? "मीटर रीडिंग" : "Meter Readings"}
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {isHindi ? "नागरिकों द्वारा सबमिट की गई रीडिंग देखें और सत्यापित करें" : "View and verify readings submitted by citizens"}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" onClick={fetchReadings} disabled={refreshing}>
                                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                                {isHindi ? "रिफ्रेश" : "Refresh"}
                            </Button>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mt-4">
                        {["ALL", "PENDING", "VERIFIED", "REJECTED", "BILLED"].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                                    ? "bg-primary text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                {status === "ALL" ? (isHindi ? "सभी" : "All") : statusConfig[status]?.label || status}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin w-8 h-8 border-4 border-cta border-t-transparent rounded-full" />
                        </div>
                    ) : filteredReadings.length > 0 ? (
                        <div className="grid gap-4">
                            {filteredReadings.map((reading) => {
                                const serviceConfig = serviceIcons[reading.serviceType] || serviceIcons.ELECTRICITY;
                                const ServiceIcon = serviceConfig.icon;
                                const status = statusConfig[reading.status];
                                const StatusIcon = status?.icon || Clock;

                                return (
                                    <div key={reading.id} className="bg-white rounded-xl shadow-sm border p-6">
                                        <div className="flex items-start gap-4">
                                            {/* Service Icon */}
                                            <div className={`w-12 h-12 ${serviceConfig.bg} rounded-lg flex items-center justify-center`}>
                                                <ServiceIcon className={`w-6 h-6 ${serviceConfig.color}`} />
                                            </div>

                                            {/* Main Content */}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h3 className="font-bold text-primary text-lg">
                                                            {reading.connection.connectionNo}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">{reading.connection.address}</p>
                                                    </div>
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${status?.color}`}>
                                                        <StatusIcon className="w-3.5 h-3.5" />
                                                        {isHindi ? status?.labelHi : status?.label}
                                                    </span>
                                                </div>

                                                {/* Reading Details Grid */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1">{isHindi ? "पिछली रीडिंग" : "Previous"}</p>
                                                        <p className="text-lg font-bold text-slate-600">
                                                            {reading.previousReading || "N/A"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1">{isHindi ? "वर्तमान रीडिंग" : "Current"}</p>
                                                        <p className="text-lg font-bold text-primary">{reading.reading}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                            <TrendingUp className="w-3 h-3" />
                                                            {isHindi ? "खपत" : "Consumption"}
                                                        </p>
                                                        <p className="text-lg font-bold text-success">
                                                            {reading.consumption || 0} units
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {isHindi ? "तारीख" : "Date"}
                                                        </p>
                                                        <p className="text-sm font-medium">
                                                            {new Date(reading.readingDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* User Info */}
                                                <div className="flex items-center gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium">{reading.user.name}</span>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">{reading.user.phone}</span>
                                                    {reading.photoUrl && (
                                                        <button
                                                            onClick={() => setPhotoModal({
                                                                url: reading.photoUrl!,
                                                                title: `${reading.connection.connectionNo} - Meter Photo`
                                                            })}
                                                            className="ml-auto flex items-center gap-1 text-sm text-primary hover:underline"
                                                        >
                                                            <ImageIcon className="w-4 h-4" />
                                                            View Photo
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                {reading.status === "PENDING" && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="cta"
                                                            onClick={() => handleVerify(reading.id)}
                                                        >
                                                            <Check className="w-4 h-4 mr-2" />
                                                            {isHindi ? "सत्यापित करें" : "Verify"}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleReject(reading.id)}
                                                        >
                                                            <X className="w-4 h-4 mr-2" />
                                                            {isHindi ? "अस्वीकार करें" : "Reject"}
                                                        </Button>
                                                    </div>
                                                )}

                                                {reading.notes && (
                                                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                        <p className="text-sm text-blue-900">
                                                            <strong>{isHindi ? "टिप्पणी:" : "Notes:"}</strong> {reading.notes}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl">
                            <Gauge className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                            <p className="text-muted-foreground">
                                {isHindi ? "कोई रीडिंग नहीं मिली" : "No readings found"}
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Photo Modal */}
            {photoModal && (
                <PhotoModal
                    photoUrl={photoModal.url}
                    title={photoModal.title}
                    onClose={() => setPhotoModal(null)}
                />
            )}
        </div>
    );
}
