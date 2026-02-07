"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Flame } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { GasMeterReadingForm } from "@/components/gas/meter-reading-form";
import { Button } from "@/components/ui/button";

interface Connection {
    id: string;
    connectionNo: string;
    lastReading: number;
    cylinders?: number;
}

export default function GasMeterReadingPage() {
    const router = useRouter();
    const { tokens, isAuthenticated } = useAuthStore();
    const [connection, setConnection] = useState<Connection | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            const returnUrl = encodeURIComponent('/services/gas/reading');
            router.push(`/auth/login?returnUrl=${returnUrl}`);
            return;
        }
        fetchConnection();
    }, [isAuthenticated, router]);

    const fetchConnection = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(
                `${apiUrl}/api/connections?serviceType=GAS`,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.accessToken}`,
                    },
                }
            );

            const data = await response.json();
            if (data.success && data.data.length > 0) {
                // Find a metered connection (cylinders is null or 0)
                // Or just pick the first one and warn if it's cylinder?
                // For logic: prefer metered if available.
                const meteredConn = data.data.find((c: any) => !c.cylinders) || data.data[0];
                setConnection(meteredConn);
            }
        } catch (error) {
            console.error("Failed to fetch connection:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) return null;

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!connection) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <header className="bg-gas-light py-6 px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-4">
                            <Link href="/services/gas" className="hover:opacity-80">
                                <ArrowLeft className="w-6 h-6 text-gas" />
                            </Link>
                            <h1 className="font-heading text-2xl font-bold text-gas">
                                Gas Meter Reading
                            </h1>
                        </div>
                    </div>
                </header>
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>No Gas Connection Found</CardTitle>
                            <CardDescription>
                                Please apply for a new gas connection first.
                            </CardDescription>
                            <Link href="/connections/new">
                                <Button className="mt-4">Apply Now</Button>
                            </Link>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        );
    }

    // Check if it's actually a metered connection
    if (connection.cylinders) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <header className="bg-gas-light py-6 px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-4">
                            <Link href="/services/gas" className="hover:opacity-80">
                                <ArrowLeft className="w-6 h-6 text-gas" />
                            </Link>
                            <h1 className="font-heading text-2xl font-bold text-gas">
                                Gas Meter Reading
                            </h1>
                        </div>
                    </div>
                </header>
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-orange-600">LPG Cylinder Connection</CardTitle>
                            <CardDescription>
                                This connection (ID: {connection.connectionNo}) is for LPG Cylinders.
                                Meter readings are only applicable for Piped Natural Gas (PNG).
                            </CardDescription>
                            <Link href="/services/gas">
                                <Button className="mt-4" variant="outline">Go Back</Button>
                            </Link>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <header className="bg-gas-light py-6 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Link href="/services/gas" className="hover:opacity-80">
                            <ArrowLeft className="w-6 h-6 text-gas" />
                        </Link>
                        <div className="w-14 h-14 bg-white/50 rounded-xl flex items-center justify-center">
                            <Flame className="w-8 h-8 text-gas" />
                        </div>
                        <div>
                            <h1 className="font-heading text-2xl font-bold text-gas">
                                Gas Meter Reading
                            </h1>
                            <p className="text-slate-600 text-sm">Submit your piped gas meter reading</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-md mx-auto px-6 py-6">
                <GasMeterReadingForm
                    connectionId={connection.id}
                    lastReading={connection.lastReading || 0}
                    onSuccess={() => router.push('/services/gas')}
                />
            </div>
        </div>
    );
}
