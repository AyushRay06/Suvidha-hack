"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Zap } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { MeterReadingForm } from "@/components/electricity/meter-reading-form";
import { BillCalculator } from "@/components/electricity/bill-calculator";

interface Connection {
    id: string;
    connectionNo: string;
    lastReading: number;
}

export default function MeterReadingPage() {
    const router = useRouter();
    const { tokens, isAuthenticated } = useAuthStore();
    const [connection, setConnection] = useState<Connection | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            const returnUrl = encodeURIComponent('/services/electricity/meter-reading');
            router.push(`/auth/login?returnUrl=${returnUrl}`);
            return;
        }
        fetchConnection();
    }, [isAuthenticated, router]);

    const fetchConnection = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(
                `${apiUrl}/api/connections?serviceType=ELECTRICITY`,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.accessToken}`,
                    },
                }
            );

            const data = await response.json();
            if (data.success && data.data.length > 0) {
                setConnection(data.data[0]);
            }
        } catch (error) {
            console.error("Failed to fetch connection:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) return null;

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    if (!connection) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <header className="bg-electricity-light py-6 px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-4">
                            <Link href="/services/electricity" className="hover:opacity-80">
                                <ArrowLeft className="w-6 h-6 text-electricity" />
                            </Link>
                            <h1 className="font-heading text-2xl font-bold text-electricity">
                                Meter Reading
                            </h1>
                        </div>
                    </div>
                </header>
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>No Electricity Connection Found</CardTitle>
                            <CardDescription>
                                Please apply for a new electricity connection first.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <header className="bg-electricity-light py-6 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Link href="/services/electricity" className="hover:opacity-80">
                            <ArrowLeft className="w-6 h-6 text-electricity" />
                        </Link>
                        <div className="w-14 h-14 bg-white/50 rounded-xl flex items-center justify-center">
                            <Zap className="w-8 h-8 text-electricity" />
                        </div>
                        <div>
                            <h1 className="font-heading text-2xl font-bold text-electricity">
                                Meter Reading
                            </h1>
                            <p className="text-slate-600 text-sm">Submit your electricity meter reading</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-6">
                <div className="flex flex-col gap-6"> {/* Removed md:grid-cols-2 */}
                    {/* Meter Reading Form */}
                    <div className="max-w-md mx-auto w-full"> {/* Added centering container */}
                        <MeterReadingForm
                            connectionId={connection.id}
                            lastReading={connection.lastReading || 0}
                            onSuccess={() => router.push('/services/electricity')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
