"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Droplets } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { WaterMeterReadingForm } from "@/components/water/meter-reading-form";
import { Button } from "@/components/ui/button";

interface Connection {
    id: string;
    connectionNo: string;
    lastReading: number;
}

export default function WaterMeterReadingPage() {
    const router = useRouter();
    const { tokens, isAuthenticated } = useAuthStore();
    const [connection, setConnection] = useState<Connection | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            const returnUrl = encodeURIComponent('/services/water/reading');
            router.push(`/auth/login?returnUrl=${returnUrl}`);
            return;
        }
        fetchConnection();
    }, [isAuthenticated, router]);

    const fetchConnection = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(
                `${apiUrl}/api/connections?serviceType=WATER`,
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
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!connection) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
                <header className="bg-water-light py-6 px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-4">
                            <Link href="/services/water" className="hover:opacity-80">
                                <ArrowLeft className="w-6 h-6 text-water" />
                            </Link>
                            <h1 className="font-heading text-2xl font-bold text-water">
                                Water Meter Reading
                            </h1>
                        </div>
                    </div>
                </header>
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>No Water Connection Found</CardTitle>
                            <CardDescription>
                                Please apply for a new water connection first.
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <header className="bg-water-light py-6 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Link href="/services/water" className="hover:opacity-80">
                            <ArrowLeft className="w-6 h-6 text-water" />
                        </Link>
                        <div className="w-14 h-14 bg-white/50 rounded-xl flex items-center justify-center">
                            <Droplets className="w-8 h-8 text-water" />
                        </div>
                        <div>
                            <h1 className="font-heading text-2xl font-bold text-water">
                                Water Meter Reading
                            </h1>
                            <p className="text-slate-600 text-sm">Submit your water meter reading</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-md mx-auto px-6 py-6">
                <WaterMeterReadingForm
                    connectionId={connection.id}
                    lastReading={connection.lastReading || 0}
                    onSuccess={() => router.push('/services/water')}
                />
            </div>
        </div>
    );
}
