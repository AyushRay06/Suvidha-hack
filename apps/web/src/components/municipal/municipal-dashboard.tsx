"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Building2,
    FileText,
    Trash2,
    Lightbulb,
    Construction,
    Waves,
    ArrowLeft,
    Plus,
    IndianRupee,
    Clock,
    MapPin,
    Phone,
    AlertCircle
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { ComplaintForm } from "./complaint-form";
import { PropertyTaxCard } from "./property-tax-card";

interface Property {
    id: string;
    propertyId: string;
    propertyType: string;
    address: string;
    ward: string;
    area: number;
    taxRecords: {
        financialYear: string;
        totalAmount: number;
        amountPaid: number;
        status: string;
        dueDate: string;
    }[];
}

interface Complaint {
    id: string;
    complaintNo: string;
    category: string;
    subject: string;
    status: string;
    createdAt: string;
    location: string;
}

interface WasteScheduleDay {
    day: string;
    date: string;
    wasteType: string;
    timeSlot: string;
}

interface WasteSchedule {
    ward: string;
    zone: string;
    nextCollection: WasteScheduleDay;
    schedule: WasteScheduleDay[];
}

export function MunicipalDashboard() {
    const router = useRouter();
    const { tokens, isAuthenticated } = useAuthStore();
    const [properties, setProperties] = useState<Property[]>([]);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [wasteSchedule, setWasteSchedule] = useState<WasteSchedule | null>(null);
    const [loading, setLoading] = useState(true);
    const [showComplaintForm, setShowComplaintForm] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("");

    useEffect(() => {
        if (!isAuthenticated) {
            const returnUrl = encodeURIComponent('/services/municipal');
            router.push(`/auth/login?returnUrl=${returnUrl}`);
            return;
        }
        fetchData();
    }, [isAuthenticated, router]);

    const fetchData = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokens?.accessToken}`,
            };

            // Fetch properties
            const propertiesRes = await fetch(`${apiUrl}/api/municipal/properties`, { headers });
            if (propertiesRes.ok) {
                const data = await propertiesRes.json();
                if (data.success) setProperties(data.data);
            }

            // Fetch complaints
            const complaintsRes = await fetch(`${apiUrl}/api/municipal/complaints`, { headers });
            if (complaintsRes.ok) {
                const data = await complaintsRes.json();
                if (data.success) setComplaints(data.data.slice(0, 5));
            }

            // Fetch waste schedule
            const scheduleRes = await fetch(`${apiUrl}/api/municipal/waste-schedule`, { headers });
            if (scheduleRes.ok) {
                const data = await scheduleRes.json();
                if (data.success) setWasteSchedule(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAction = (category: string) => {
        setSelectedCategory(category);
        setShowComplaintForm(true);
    };

    if (!isAuthenticated) return null;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    const pendingTax = properties.reduce((sum, p) => {
        const latest = p.taxRecords[0];
        if (latest && latest.status !== 'PAID') {
            return sum + (latest.totalAmount - latest.amountPaid);
        }
        return sum;
    }, 0);

    const openComplaints = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED');

    if (showComplaintForm) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <header className="bg-municipal-light py-6 px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setShowComplaintForm(false)} className="hover:opacity-80">
                                <ArrowLeft className="w-6 h-6 text-municipal" />
                            </button>
                            <h1 className="font-heading text-2xl font-bold text-municipal">
                                File Complaint
                            </h1>
                        </div>
                    </div>
                </header>
                <div className="max-w-md mx-auto px-6 py-6">
                    <ComplaintForm
                        initialCategory={selectedCategory}
                        onSuccess={() => {
                            setShowComplaintForm(false);
                            fetchData();
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <header className="bg-municipal-light py-6 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/dashboard" className="hover:opacity-80">
                            <ArrowLeft className="w-6 h-6 text-municipal" />
                        </Link>
                        <div className="w-14 h-14 bg-white/50 rounded-xl flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-municipal" />
                        </div>
                        <div>
                            <h1 className="font-heading text-2xl font-bold text-municipal">
                                Municipal Services
                            </h1>
                            <p className="text-slate-600 text-sm">Manage civic services & property tax</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-6">

                {/* Alerts */}
                {pendingTax > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium text-amber-800">Property Tax Due</p>
                            <p className="text-sm text-amber-700">₹{pendingTax.toLocaleString()} pending</p>
                        </div>
                        <Button size="sm" variant="cta">Pay Now</Button>
                    </div>
                )}

                {/* Quick Actions Grid */}
                <section className="mb-8">
                    <h2 className="font-heading text-lg text-primary mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {/* 1. Property Tax */}
                        <Link
                            href="#properties"
                            className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent bg-white group"
                        >
                            <div className="w-10 h-10 bg-municipal-light rounded-lg flex items-center justify-center mb-2 group-hover:bg-municipal group-hover:text-white transition-colors">
                                <IndianRupee className="w-5 h-5 text-municipal group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-tight">Property Tax</span>
                        </Link>

                        {/* 2. Waste Collection */}
                        <button
                            onClick={() => handleQuickAction('GARBAGE')}
                            className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent bg-white group"
                        >
                            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-green-500 group-hover:text-white transition-colors">
                                <Trash2 className="w-5 h-5 text-green-600 group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-tight">Waste Issue</span>
                        </button>

                        {/* 3. Streetlight */}
                        <button
                            onClick={() => handleQuickAction('STREETLIGHT')}
                            className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent bg-white group"
                        >
                            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                                <Lightbulb className="w-5 h-5 text-yellow-600 group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-tight">Streetlight</span>
                        </button>

                        {/* 4. Road Repair */}
                        <button
                            onClick={() => handleQuickAction('ROAD_REPAIR')}
                            className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent bg-white group"
                        >
                            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                <Construction className="w-5 h-5 text-orange-600 group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-tight">Road Repair</span>
                        </button>

                        {/* 5. Drainage */}
                        <button
                            onClick={() => handleQuickAction('DRAINAGE')}
                            className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent bg-white group"
                        >
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-2 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <Waves className="w-5 h-5 text-blue-600 group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-tight">Drainage</span>
                        </button>

                        {/* 6. Support */}
                        <Link
                            href="/support"
                            className="kiosk-card flex flex-col items-center text-center p-4 hover:border-cta border-2 border-transparent bg-white group"
                        >
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-slate-500 group-hover:text-white transition-colors">
                                <Phone className="w-5 h-5 text-slate-600 group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-tight">Support</span>
                        </Link>
                    </div>
                </section>

                {/* Waste Collection Schedule */}
                {wasteSchedule && (
                    <section className="mb-8">
                        <h2 className="font-heading text-lg text-primary mb-4">Waste Collection</h2>
                        <Card className="border-2 border-green-100">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{wasteSchedule.ward} • {wasteSchedule.zone}</p>
                                        <p className="font-medium text-primary">Next: {wasteSchedule.nextCollection.day}</p>
                                    </div>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        {wasteSchedule.nextCollection.wasteType}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="w-4 h-4" />
                                    {wasteSchedule.nextCollection.timeSlot}
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* My Properties */}
                <section className="mb-8" id="properties">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-heading text-lg text-primary">My Properties</h2>
                        <Link href="/properties/new">
                            <Button variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Property
                            </Button>
                        </Link>
                    </div>

                    {properties.length > 0 ? (
                        <div className="space-y-4">
                            {properties.map((property) => (
                                <PropertyTaxCard key={property.id} property={property} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                            <p className="text-muted-foreground mb-4">No properties registered yet</p>
                            <Link href="/properties/new">
                                <Button variant="cta">Register Property</Button>
                            </Link>
                        </div>
                    )}
                </section>

                {/* Recent Complaints */}
                {complaints.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-heading text-lg text-primary">Recent Complaints</h2>
                            <button
                                onClick={() => setShowComplaintForm(true)}
                                className="text-cta text-sm hover:underline"
                            >
                                + New Complaint
                            </button>
                        </div>
                        <div className="space-y-3">
                            {complaints.map((complaint) => (
                                <Card key={complaint.id} className="hover:border-municipal-light transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-municipal-light rounded-lg flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-municipal" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{complaint.subject}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {complaint.complaintNo} • {new Date(complaint.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge
                                                variant={complaint.status === "RESOLVED" ? "default" : "secondary"}
                                                className="text-xs"
                                            >
                                                {complaint.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                            <MapPin className="w-3 h-3" />
                                            {complaint.location}
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
