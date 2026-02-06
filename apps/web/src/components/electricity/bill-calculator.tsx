"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, Info } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";

interface BillCalculatorProps {
    connectionId: string;
}

interface SlabBreakdown {
    slab: string;
    units: number;
    rate: number;
    amount: number;
}

interface Calculation {
    unitsConsumed: number;
    fixedCharge: number;
    energyCharge: number;
    fpppaCharge?: number;
    totalAmount: number;
    slabBreakdown: SlabBreakdown[];
}

export function BillCalculator({ connectionId }: BillCalculatorProps) {
    const { tokens } = useAuthStore();
    const [units, setUnits] = useState("");
    const [loading, setLoading] = useState(false);
    const [calculation, setCalculation] = useState<Calculation | null>(null);
    const [error, setError] = useState("");

    const handleCalculate = async () => {
        setError("");
        setCalculation(null);

        const unitsValue = parseFloat(units);

        if (isNaN(unitsValue) || unitsValue <= 0) {
            setError("Please enter valid units consumed");
            return;
        }

        setLoading(true);

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
                        unitsConsumed: unitsValue,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to calculate bill");
            }

            setCalculation(data.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-blue-500" />
                    Bill Calculator
                </CardTitle>
                <CardDescription>Estimate your electricity bill</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="units">Units Consumed</Label>
                        <Input
                            id="units"
                            type="number"
                            step="0.01"
                            placeholder="Enter units"
                            value={units}
                            onChange={(e) => setUnits(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="flex items-end">
                        <Button onClick={handleCalculate} disabled={loading}>
                            {loading ? "Calculating..." : "Calculate"}
                        </Button>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {calculation && (
                    <div className="space-y-4 rounded-lg border p-4">
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Info className="h-4 w-4 mt-0.5" />
                            <p>This is an estimate based on current tariff rates</p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold">Slab Breakdown</h4>
                            {calculation.slabBreakdown.map((slab, index) => (
                                <div
                                    key={index}
                                    className="flex justify-between text-sm border-b pb-2"
                                >
                                    <span>
                                        {slab.slab} units @ ₹{slab.rate}/unit
                                    </span>
                                    <span>
                                        {slab.units} × ₹{slab.rate} = ₹{slab.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 border-t pt-2">
                            <div className="flex justify-between text-sm">
                                <span>Energy Charge</span>
                                <span>₹{calculation.energyCharge.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Fixed Charge</span>
                                <span>₹{calculation.fixedCharge.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>FPPPA Charge (₹0.69/unit)</span>
                                <span>₹{(calculation.fpppaCharge || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t pt-2">
                                <span>Total Amount</span>
                                <span className="text-green-600">
                                    ₹{calculation.totalAmount.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
