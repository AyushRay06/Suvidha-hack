import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Loader2, Flame, AlertCircle, Info } from 'lucide-react';
import { useAuthStore } from "@/lib/store/auth";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from '@/components/ui/badge';

export interface GasBookingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    connectionId: string;
    onSuccess: (booking: any) => void;
}

export function GasBookingDialog({
    open,
    onOpenChange,
    connectionId,
    onSuccess,
}: GasBookingDialogProps) {
    const [loading, setLoading] = useState(false);
    const currentPrice = 1150; // Standard price for 14.2kg cylinder
    const subsidyAmount = 200;

    const { tokens } = useAuthStore();
    const { toast } = useToast();

    const handleBooking = async () => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await fetch(`${apiUrl}/api/gas/book`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokens?.accessToken}`,
                },
                body: JSON.stringify({
                    connectionId,
                    amount: currentPrice,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Booking failed');
            }

            if (data.success) {
                onSuccess(data.data);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Booking Failed",
                description: error.message || "Please try again later",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-gas h-2 w-full" />
                <DialogHeader className="px-6 pt-6 text-left">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gas-light rounded-2xl flex items-center justify-center">
                            <Flame className="w-6 h-6 text-gas" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-slate-900">Book LPG Refill</DialogTitle>
                            <DialogDescription className="text-xs font-medium text-slate-500">
                                standard 14.2kg domestic cylinder
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 py-4 space-y-4">
                    {/* Price Breakdown */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                            <span className="text-sm text-slate-600 font-medium">Market Price</span>
                            <span className="font-bold text-slate-900">₹{currentPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-green-600">
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium">DBTL Subsidy</span>
                                <Info className="w-3 h-3 opacity-60" />
                            </div>
                            <span className="font-bold">- ₹{subsidyAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-base font-black text-slate-900">Effective Cost</span>
                            <span className="text-xl font-black text-gas">₹{(currentPrice - subsidyAmount).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="flex items-start gap-3 p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                        <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-orange-900">Contactless Delivery</p>
                            <p className="text-xs text-orange-700 leading-relaxed font-medium">
                                Delivery within <span className="font-black">2-3 working days</span>. Please keep empty cylinder ready at the gate.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-slate-50 border-t px-6 py-4 sm:justify-between gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-slate-100 font-bold text-slate-600">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleBooking}
                        disabled={loading}
                        className="bg-gas hover:bg-gas/90 text-white font-black px-8 shadow-lg shadow-gas/20 min-w-[160px]"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            "Confirm Booking"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
