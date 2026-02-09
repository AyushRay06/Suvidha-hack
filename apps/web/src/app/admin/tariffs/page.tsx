"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
    DollarSign,
    Edit2,
    Save,
    X,
    Zap,
    Droplet,
    Flame,
    TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface TariffSlab {
    id: string;
    serviceType: string;
    loadType: string;
    slabStart: number;
    slabEnd: number | null;
    ratePerUnit: number;
    fixedCharge: number;
    isActive: boolean;
}

const serviceIcons: Record<string, any> = {
    ELECTRICITY: Zap,
    WATER: Droplet,
    GAS: Flame,
};

const serviceColors: Record<string, { bg: string; text: string; border: string }> = {
    ELECTRICITY: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    WATER: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    GAS: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
};

export default function AdminTariffsPage() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const isHindi = i18n.language === "hi";

    const { user, isAuthenticated } = useAuthStore();

    const [tariffs, setTariffs] = useState<TariffSlab[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<TariffSlab>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || (user?.role !== "ADMIN" && user?.role !== "STAFF")) {
            router.push("/auth/login");
            return;
        }
        fetchTariffs();
    }, [isAuthenticated, user, router]);

    const fetchTariffs = async () => {
        try {
            const token = useAuthStore.getState().tokens?.accessToken;
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/admin/tariffs`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.ok) {
                const data = await res.json();
                setTariffs(data.data || []);
            } else {
                // Mock data for development
                setTariffs([
                    { id: "1", serviceType: "ELECTRICITY", loadType: "RESIDENTIAL", slabStart: 0, slabEnd: 100, ratePerUnit: 5.5, fixedCharge: 50, isActive: true },
                    { id: "2", serviceType: "ELECTRICITY", loadType: "RESIDENTIAL", slabStart: 101, slabEnd: 300, ratePerUnit: 6.5, fixedCharge: 50, isActive: true },
                    { id: "3", serviceType: "ELECTRICITY", loadType: "RESIDENTIAL", slabStart: 301, slabEnd: null, ratePerUnit: 7.5, fixedCharge: 50, isActive: true },
                    { id: "4", serviceType: "ELECTRICITY", loadType: "COMMERCIAL", slabStart: 0, slabEnd: null, ratePerUnit: 8.5, fixedCharge: 150, isActive: true },
                    { id: "5", serviceType: "WATER", loadType: "RESIDENTIAL", slabStart: 0, slabEnd: 10000, ratePerUnit: 0.5, fixedCharge: 30, isActive: true },
                    { id: "6", serviceType: "WATER", loadType: "RESIDENTIAL", slabStart: 10001, slabEnd: null, ratePerUnit: 1.0, fixedCharge: 30, isActive: true },
                    { id: "7", serviceType: "GAS", loadType: "RESIDENTIAL", slabStart: 0, slabEnd: null, ratePerUnit: 1050, fixedCharge: 0, isActive: true },
                ]);
            }
        } catch (err) {
            console.error("Failed to fetch tariffs:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (tariff: TariffSlab) => {
        setEditingId(tariff.id);
        setEditValues({
            ratePerUnit: tariff.ratePerUnit,
            fixedCharge: tariff.fixedCharge,
        });
    };

    const handleSave = async (id: string) => {
        setSaving(true);
        try {
            const token = useAuthStore.getState().tokens?.accessToken;
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/admin/tariffs/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(editValues),
                }
            );

            if (res.ok) {
                await fetchTariffs();
                setEditingId(null);
                setEditValues({});
            }
        } catch (err) {
            console.error("Failed to update tariff:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditValues({});
    };

    const groupedTariffs = tariffs.reduce((acc, tariff) => {
        if (!acc[tariff.serviceType]) {
            acc[tariff.serviceType] = {};
        }
        if (!acc[tariff.serviceType][tariff.loadType]) {
            acc[tariff.serviceType][tariff.loadType] = [];
        }
        acc[tariff.serviceType][tariff.loadType].push(tariff);
        return acc;
    }, {} as Record<string, Record<string, TariffSlab[]>>);

    if (!isAuthenticated || (user?.role !== "ADMIN" && user?.role !== "STAFF")) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Sidebar */}
            <AdminSidebar activeId="tariffs" />

            {/* Main Content */}
            <main className="flex-1 ml-64 overflow-auto">
                <header className="bg-white border-b px-6 py-4 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-primary">
                                {isHindi ? "टैरिफ प्रबंधन" : "Tariff Management"}
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {isHindi ? "उपयोगिता दरें देखें और अपडेट करें" : "View and update utility rates"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-lg">
                                <TrendingUp className="w-4 h-4 text-success" />
                                <span className="text-sm font-medium text-success">
                                    {tariffs.filter(t => t.isActive).length} Active Tariffs
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin w-8 h-8 border-4 border-cta border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedTariffs).map(([serviceType, loadTypes]) => {
                                const Icon = serviceIcons[serviceType] || DollarSign;
                                const colors = serviceColors[serviceType] || serviceColors.ELECTRICITY;

                                return (
                                    <div key={serviceType} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                        {/* Service Header */}
                                        <div className={`px-6 py-4 ${colors.bg} border-b ${colors.border}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center border ${colors.border}`}>
                                                    <Icon className={`w-5 h-5 ${colors.text}`} />
                                                </div>
                                                <div>
                                                    <h3 className={`font-bold ${colors.text}`}>
                                                        {serviceType.charAt(0) + serviceType.slice(1).toLowerCase()}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        {Object.keys(loadTypes).length} load type(s)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Load Types */}
                                        <div className="p-6 space-y-6">
                                            {Object.entries(loadTypes).map(([loadType, slabs]) => (
                                                <div key={loadType}>
                                                    <h4 className="font-semibold text-primary mb-3">
                                                        {loadType.charAt(0) + loadType.slice(1).toLowerCase()}
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {slabs.map((tariff) => (
                                                            <div
                                                                key={tariff.id}
                                                                className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border"
                                                            >
                                                                {/* Slab Range */}
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium text-primary">
                                                                        {tariff.slabStart} - {tariff.slabEnd || "∞"} units
                                                                    </p>
                                                                </div>

                                                                {/* Rate */}
                                                                <div className="w-40">
                                                                    {editingId === tariff.id ? (
                                                                        <div>
                                                                            <Label className="text-xs">Rate/Unit</Label>
                                                                            <Input
                                                                                type="number"
                                                                                step="0.1"
                                                                                value={editValues.ratePerUnit || ""}
                                                                                onChange={(e) =>
                                                                                    setEditValues({
                                                                                        ...editValues,
                                                                                        ratePerUnit: parseFloat(e.target.value),
                                                                                    })
                                                                                }
                                                                                className="mt-1"
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div>
                                                                            <p className="text-xs text-muted-foreground">Rate/Unit</p>
                                                                            <p className="text-lg font-bold text-primary">
                                                                                ₹{tariff.ratePerUnit.toFixed(2)}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Fixed Charge */}
                                                                <div className="w-40">
                                                                    {editingId === tariff.id ? (
                                                                        <div>
                                                                            <Label className="text-xs">Fixed Charge</Label>
                                                                            <Input
                                                                                type="number"
                                                                                step="1"
                                                                                value={editValues.fixedCharge || ""}
                                                                                onChange={(e) =>
                                                                                    setEditValues({
                                                                                        ...editValues,
                                                                                        fixedCharge: parseFloat(e.target.value),
                                                                                    })
                                                                                }
                                                                                className="mt-1"
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div>
                                                                            <p className="text-xs text-muted-foreground">Fixed Charge</p>
                                                                            <p className="text-lg font-bold text-primary">
                                                                                ₹{tariff.fixedCharge.toFixed(2)}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Actions */}
                                                                <div className="flex gap-2">
                                                                    {editingId === tariff.id ? (
                                                                        <>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="cta"
                                                                                onClick={() => handleSave(tariff.id)}
                                                                                disabled={saving}
                                                                            >
                                                                                <Save className="w-4 h-4" />
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={handleCancel}
                                                                                disabled={saving}
                                                                            >
                                                                                <X className="w-4 h-4" />
                                                                            </Button>
                                                                        </>
                                                                    ) : (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => handleEdit(tariff)}
                                                                        >
                                                                            <Edit2 className="w-4 h-4" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
