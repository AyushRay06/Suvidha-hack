"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Flame, Upload, Loader2, ArrowRight, Download, CheckCircle2, Gauge, Calendar, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { DownloadGasBillBtn } from "./download-gas-bill-btn";
import { Badge } from "@/components/ui/badge";

interface GasMeterReadingFormProps {
    connectionId: string;
    lastReading: number;
    onSuccess: () => void;
}

interface Estimate {
    unitsConsumed: number;
    fixedCharge: number;
    energyCharge: number;
    totalAmount: number;
    ratePerUnit: number;
}

export function GasMeterReadingForm({ connectionId, lastReading, onSuccess }: GasMeterReadingFormProps) {
    const { tokens } = useAuthStore();
    const [reading, setReading] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [estimate, setEstimate] = useState<Estimate | null>(null);
    const [generatedBill, setGeneratedBill] = useState<any>(null);

    // Auto-calculate estimate when reading changes
    useEffect(() => {
        const calculateEstimate = async () => {
            const currentReading = parseFloat(reading);
            if (!currentReading || isNaN(currentReading) || currentReading <= lastReading) {
                setEstimate(null);
                return;
            }

            const unitsConsumed = currentReading - lastReading;

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                const response = await fetch(
                    `${apiUrl}/api/gas/calculate-bill`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${tokens?.accessToken}`,
                        },
                        body: JSON.stringify({
                            connectionId,
                            unitsConsumed,
                        }),
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setEstimate(data.data);
                    }
                }
            } catch (err) {
                console.error("Failed to calculate estimate", err);
            }
        };

        const timer = setTimeout(calculateEstimate, 800);
        return () => clearTimeout(timer);
    }, [reading, lastReading, connectionId, tokens]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        const currentReading = parseFloat(reading);

        if (isNaN(currentReading)) {
            setError("Please enter a valid meter reading");
            return;
        }

        if (currentReading <= lastReading) {
            setError(`Reading must be greater than last reading (${lastReading})`);
            return;
        }

        setLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(
                `${apiUrl}/api/gas/readings`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${tokens?.accessToken}`,
                    },
                    body: JSON.stringify({
                        connectionId,
                        reading: currentReading,
                        imageUrl: imageUrl || undefined,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || "Failed to submit reading");
            }

            if (data.data && data.data.bill) {
                setGeneratedBill(data.data.bill);
            }

            setSuccess(true);
            setReading("");
            setImageUrl("");
            setEstimate(null);

            // Delay showing success state or navigation to let the user see the result
            setTimeout(() => {
                onSuccess();
            }, 3000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Card className="border-none shadow-2xl bg-white overflow-hidden">
                <div className="h-2 bg-green-500" />
                <CardContent className="pt-8 pb-10 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-green-100 p-4 rounded-full animate-bounce">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Reading Submitted!</h3>
                    <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Your gas bill has been generated successfully. You can download it below.</p>

                    {generatedBill && (
                        <div className="bg-slate-50 border rounded-2xl p-6 mb-8 max-w-sm mx-auto flex flex-col items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                    <FileText className="h-5 w-5 text-gas" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Invoice Generated</p>
                                    <p className="font-bold text-slate-900">INV-{generatedBill.billNo.split('-').pop()}</p>
                                </div>
                            </div>
                            <div className="w-full flex gap-3">
                                <div className="flex-1">
                                    <DownloadGasBillBtn
                                        bill={generatedBill}
                                        connection={{
                                            connectionNo: connectionId,
                                            consumerName: "Valued Customer",
                                            address: "Assam"
                                        }}
                                    />
                                    <p className="text-[10px] font-bold text-muted-foreground mt-1">Download PDF</p>
                                </div>
                                <div className="flex-1">
                                    <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
                                        Done
                                    </Button>
                                    <p className="text-[10px] font-bold text-muted-foreground mt-1">Submit Another</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full border-none shadow-lg bg-white overflow-hidden">
            <div className="h-2 bg-gas" />
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900 uppercase">
                            Submit Reading
                        </CardTitle>
                        <CardDescription className="font-medium text-slate-500">
                            Enter the current SCM reading from your meter.
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-gas-light text-gas border-gas/20 gap-1.5 py-1 px-3">
                        <Gauge className="w-3.5 h-3.5" />
                        ID: {connectionId.slice(-6).toUpperCase()}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                                <Calendar className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Last Reading</p>
                                <p className="font-black text-lg text-slate-900 leading-none">{lastReading} <span className="text-xs font-normal">SCM</span></p>
                            </div>
                        </div>
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-dashed flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Consumption</p>
                                <p className="font-black text-lg text-green-600 leading-none">
                                    {reading && !isNaN(parseFloat(reading)) && parseFloat(reading) > lastReading
                                        ? (parseFloat(reading) - lastReading).toFixed(2)
                                        : "0.00"}
                                    <span className="text-xs font-normal"> SCM</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="reading" className="text-slate-900 font-bold uppercase text-[10px] tracking-widest">Current Reading (SCM)</Label>
                        <div className="relative">
                            <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                id="reading"
                                type="number"
                                step="0.01"
                                placeholder="00000.00"
                                value={reading}
                                onChange={(e) => setReading(e.target.value)}
                                disabled={loading}
                                className="pl-12 text-2xl font-black h-14 border-slate-200 focus:border-gas focus:ring-gas/20 transition-all rounded-xl"
                            />
                        </div>

                        {estimate && (
                            <div className="bg-gas-light/30 border border-gas/10 rounded-2xl p-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-bold text-gas uppercase tracking-widest">Estimate Breakdown</p>
                                    <Badge variant="secondary" className="bg-white/50 text-[10px]">@{estimate.ratePerUnit}/SCM</Badge>
                                </div>
                                <div className="space-y-2 mb-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Energy Charges</span>
                                        <span className="font-bold text-slate-900">₹{estimate.energyCharge.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Fixed Charges</span>
                                        <span className="font-bold text-slate-900">₹{estimate.fixedCharge.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-gas/10">
                                    <span className="text-slate-900 font-bold">Estimated Payable</span>
                                    <span className="font-black text-xl text-gas">₹{estimate.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="image" className="text-slate-900 font-bold uppercase text-[10px] tracking-widest">Meter Photo (Optional)</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Upload className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    id="image"
                                    type="url"
                                    placeholder="Paste photo URL for faster verification"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    disabled={loading}
                                    className="pl-10 h-12 border-slate-200 rounded-xl text-sm"
                                />
                            </div>
                            <Button type="button" variant="outline" size="icon" className="h-12 w-12 rounded-xl" disabled={loading}>
                                <Upload className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50">
                            <AlertDescription className="text-xs font-bold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" className="w-full bg-gas hover:bg-gas/90 h-14 rounded-2xl text-lg font-black tracking-tight shadow-lg shadow-gas/20 transition-all hover:scale-[1.01] active:scale-[0.99]" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                SUBMITTING...
                            </>
                        ) : (
                            <>
                                SUBMIT READING
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
