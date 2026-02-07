"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Droplets, CheckCircle, Gauge, TrendingUp, AlertCircle, FileText, Calendar } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { DownloadWaterBillBtn } from "./download-water-bill-btn";

interface MeterReadingFormProps {
    connectionId: string;
    lastReading: number;
    onSuccess?: () => void;
}

interface BillEstimate {
    unitsConsumed: number;
    loadType: string;
    slabBreakdown: { slab: string; units: number; rate: number; amount: number }[];
    energyCharge: number;
    fixedCharge: number;
    sewerageCharge: number;
    totalAmount: number;
}

export function WaterMeterReadingForm({ connectionId, lastReading, onSuccess }: MeterReadingFormProps) {
    const { tokens } = useAuthStore();
    const [reading, setReading] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState(false);
    const [billEstimate, setBillEstimate] = useState<BillEstimate | null>(null);
    const [generatedBillNo, setGeneratedBillNo] = useState<string>("");

    const currentReading = parseFloat(reading) || 0;
    const consumption = currentReading > lastReading ? currentReading - lastReading : 0;

    const fetchEstimate = async (units: number) => {
        if (units <= 0) {
            setBillEstimate(null);
            return;
        }

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/water/calculate-bill`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokens?.accessToken}`,
                },
                body: JSON.stringify({ unitsConsumed: units }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setBillEstimate(data.data);
                }
            }
        } catch (err) {
            console.error("Failed to fetch estimate:", err);
        }
    };

    const handleReadingChange = (value: string) => {
        setReading(value);
        const newReading = parseFloat(value) || 0;
        const units = newReading > lastReading ? newReading - lastReading : 0;
        fetchEstimate(units);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const readingValue = parseFloat(reading);
        if (isNaN(readingValue) || readingValue < lastReading) {
            setError(`Reading must be at least ${lastReading} kL (your last reading)`);
            return;
        }

        setLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/water/readings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokens?.accessToken}`,
                },
                body: JSON.stringify({
                    connectionId,
                    reading: readingValue,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setGeneratedBillNo(data.data.bill?.billNo || '');
                if (data.data.calculation) {
                    setBillEstimate(data.data.calculation);
                }
            } else {
                throw new Error(data.error || 'Failed to submit reading');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Card className="border-2 border-success/30 bg-success/5">
                <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="font-heading text-xl text-success mb-2">Reading Submitted!</h3>
                    <p className="text-muted-foreground mb-4">
                        Your water meter reading has been recorded and bill generated.
                    </p>

                    {billEstimate && (
                        <div className="bg-white rounded-lg p-4 mb-4 text-left">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-muted-foreground">Bill Amount</span>
                                <span className="text-2xl font-bold text-primary">₹{billEstimate.totalAmount}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {consumption} kL consumed
                            </div>
                        </div>
                    )}

                    {generatedBillNo && billEstimate && (
                        <DownloadWaterBillBtn
                            billNo={generatedBillNo}
                            amount={billEstimate.totalAmount}
                            unitsConsumed={consumption}
                            connectionId={connectionId}
                        />
                    )}

                    <Button
                        variant="outline"
                        className="mt-4 w-full"
                        onClick={onSuccess}
                    >
                        Back to Dashboard
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-water" />
                    Submit Meter Reading
                </CardTitle>
                <CardDescription>
                    Enter your current water meter reading in Kiloliters (kL)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Last Reading */}
                    <div className="bg-water-light/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Calendar className="w-4 h-4" />
                            Previous Reading
                        </div>
                        <div className="text-2xl font-bold text-water">{lastReading} kL</div>
                    </div>

                    {/* Current Reading Input */}
                    <div className="space-y-2">
                        <Label htmlFor="reading" className="text-base">Current Reading (kL)</Label>
                        <Input
                            id="reading"
                            type="number"
                            step="0.1"
                            min={lastReading}
                            placeholder={`Enter reading (min: ${lastReading})`}
                            value={reading}
                            onChange={(e) => handleReadingChange(e.target.value)}
                            className="text-xl h-14 text-center"
                        />
                    </div>

                    {/* Consumption Display */}
                    {consumption > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-cyan-50 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-cyan-600" />
                            <div>
                                <p className="text-sm text-muted-foreground">Consumption</p>
                                <p className="font-bold text-cyan-700">{consumption.toFixed(1)} kL</p>
                            </div>
                        </div>
                    )}

                    {/* Bill Estimate */}
                    {billEstimate && (
                        <div className="border rounded-lg p-4 space-y-3">
                            <h4 className="font-medium text-sm text-muted-foreground">Estimated Bill</h4>

                            {/* Slab Breakdown */}
                            <div className="space-y-1">
                                {billEstimate.slabBreakdown.map((slab, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{slab.slab} ({slab.units} kL × ₹{slab.rate})</span>
                                        <span>₹{slab.amount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <hr />

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Water Charges</span>
                                <span>₹{billEstimate.energyCharge.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Fixed Charges</span>
                                <span>₹{billEstimate.fixedCharge.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Sewerage (15%)</span>
                                <span>₹{billEstimate.sewerageCharge.toFixed(2)}</span>
                            </div>

                            <hr />

                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span className="text-water">₹{billEstimate.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        variant="cta"
                        size="xl"
                        className="w-full"
                        disabled={loading || consumption <= 0}
                    >
                        {loading ? "Submitting..." : "Submit Reading"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
