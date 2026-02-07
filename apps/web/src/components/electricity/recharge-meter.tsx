"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";

interface RechargeMeterProps {
    connectionId: string;
    meterNo: string;
    currentBalance: number;
    onRechargeComplete: (amount: number) => void;
}

export function RechargeMeter({ connectionId, meterNo, currentBalance, onRechargeComplete }: RechargeMeterProps) {
    const { tokens } = useAuthStore();
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleRecharge = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        const rechargeAmount = parseFloat(amount);
        if (isNaN(rechargeAmount) || rechargeAmount <= 0) {
            setError("Please enter a valid amount");
            return;
        }

        if (rechargeAmount < 100) {
            setError("Minimum recharge amount is ₹100");
            return;
        }

        setLoading(true);

        // Simulate API call for now (since we don't have a real payment gateway yet)
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
            onRechargeComplete(rechargeAmount);
            setAmount("");
        }, 1500);
    };

    if (success) {
        return (
            <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6 text-center text-green-800">
                    <div className="flex justify-center mb-4">
                        <div className="bg-green-100 p-3 rounded-full">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Recharge Successful!</h3>
                    <p>Your meter balance has been updated.</p>
                    <Button
                        variant="ghost"
                        className="mt-4 text-green-700 hover:text-green-800 hover:bg-green-100"
                        onClick={() => setSuccess(false)}
                    >
                        Make another recharge
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Prepaid Recharge
                </CardTitle>
                <CardDescription>
                    Meter No: {meterNo} | Balance: <span className="font-bold text-green-600">₹{currentBalance.toFixed(2)}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleRecharge} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (₹)</Label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</div>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="Enter amount (Min ₹100)"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-8 text-lg"
                                min="100"
                                disabled={loading}
                            />
                        </div>
                        <div className="flex gap-2">
                            {[100, 200, 500, 1000].map((val) => (
                                <Button
                                    key={val}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setAmount(val.toString())}
                                    disabled={loading}
                                >
                                    ₹{val}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Proceed to Pay
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
