"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, Upload, Loader2, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";

interface MeterReadingFormProps {
    connectionId: string;
    lastReading: number;
    onSuccess: () => void;
}

interface Estimate {
    unitsConsumed: number;
    fixedCharge: number;
    energyCharge: number;
    fpppaCharge?: number;
    totalAmount: number;
}

export function MeterReadingForm({ connectionId, lastReading, onSuccess }: MeterReadingFormProps) {
    const { tokens } = useAuthStore();
    const [reading, setReading] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [estimate, setEstimate] = useState<Estimate | null>(null);

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
                    `${apiUrl}/api/electricity/calculate-bill`,
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

        const timer = setTimeout(calculateEstimate, 800); // Debounce estimate
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
                `${apiUrl}/api/electricity/readings`,
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

            setSuccess(true);
            setReading("");
            setImageUrl("");
            setEstimate(null);

            // Wait a moment before refreshing data
            setTimeout(() => {
                onSuccess();
            }, 2000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6 text-center text-green-800">
                    <div className="flex justify-center mb-4">
                        <div className="bg-green-100 p-3 rounded-full">
                            <Zap className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Reading Submitted!</h3>
                    <p>Your bill is being generated based on your reading.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Submit Meter Reading
                </CardTitle>
                <CardDescription>
                    Last reading: {lastReading} units
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="reading">Current Reading (Units)</Label>
                        <Input
                            id="reading"
                            type="number"
                            step="0.1"
                            placeholder="Enter meter reading"
                            value={reading}
                            onChange={(e) => setReading(e.target.value)}
                            disabled={loading}
                            className="text-lg"
                        />
                        {estimate && (
                            <div className="bg-slate-50 border rounded-lg p-3 mt-2 text-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-muted-foreground">Consumption:</span>
                                    <span className="font-medium">{(parseFloat(reading) - lastReading).toFixed(2)} units</span>
                                </div>
                                <div className="space-y-1 pt-2 border-t text-muted-foreground text-xs">
                                    <div className="flex justify-between">
                                        <span>Energy Charge</span>
                                        <span>₹{estimate.energyCharge.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Fixed Charge</span>
                                        <span>₹{estimate.fixedCharge.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>FPPPA Charge</span>
                                        <span>₹{(estimate.fpppaCharge || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 mt-2 border-t font-bold text-primary">
                                    <span>Estimated Bill:</span>
                                    <span>₹{estimate.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">Meter Photo URL (Optional)</Label>
                        <div className="flex gap-2">
                            <Input
                                id="image"
                                type="url"
                                placeholder="https://example.com/meter-photo.jpg"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                disabled={loading}
                            />
                            <Button type="button" variant="outline" size="icon" disabled={loading}>
                                <Upload className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Upload a photo of your meter for verification
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                Submit Reading
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
