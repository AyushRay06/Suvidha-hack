"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle,
  Loader2,
  Receipt,
  Download,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/lib/store/auth";

interface Bill {
  id: string;
  serviceType: string;
  connectionNumber: string;
  billNumber: string;
  amount: number;
  dueDate: string;
  billPeriod: string;
}

interface PaymentResult {
  transactionId: string;
  amount: number;
  status: string;
  timestamp: string;
  receiptNumber: string;
}

type PaymentMethod = "UPI" | "CARD" | "NETBANKING";

export default function PayBillPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, tokens } = useAuthStore();

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [upiId, setUpiId] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchBill();
  }, [isAuthenticated, params.id]);

  const fetchBill = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/billing/bills/${params.id}`,
        { headers: { Authorization: `Bearer ${tokens?.accessToken}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setBill(data.data);
      } else {
        toast({ title: "Bill not found", variant: "destructive" });
        router.push("/bills");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentMethod || !bill) return;

    setProcessing(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/billing/pay`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
          body: JSON.stringify({
            billId: bill.id,
            paymentMethod,
            upiId: paymentMethod === "UPI" ? upiId : undefined,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setPaymentResult(data.data);
        toast({
          title: "Payment Successful!",
          description: `Transaction ID: ${data.data.transactionId}`,
          variant: "success",
        });
      } else {
        throw new Error(data.error || "Payment failed");
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const paymentMethods = [
    { id: "UPI" as const, name: "UPI / BHIM", icon: Smartphone, desc: "Pay using any UPI app" },
    { id: "CARD" as const, name: "Credit/Debit Card", icon: CreditCard, desc: "Visa, Mastercard, RuPay" },
    { id: "NETBANKING" as const, name: "Net Banking", icon: Building2, desc: "All major banks" },
  ];

  if (!isAuthenticated) return null;

  // Success State
  if (paymentResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
        <header className="bg-success text-white py-4 px-6">
          <div className="max-w-md mx-auto text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-2" />
            <h1 className="font-heading text-xl font-bold">Payment Successful!</h1>
          </div>
        </header>

        <div className="flex-1 p-6 max-w-md mx-auto w-full">
          <div className="bg-white rounded-xl shadow-kiosk p-6 mb-6">
            <div className="text-center mb-6">
              <p className="text-muted-foreground text-sm">Amount Paid</p>
              <p className="font-heading text-4xl text-primary font-bold">
                ₹{paymentResult.amount.toLocaleString()}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono">{paymentResult.transactionId}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Receipt No.</span>
                <span className="font-mono">{paymentResult.receiptNumber}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Date & Time</span>
                <span>{new Date(paymentResult.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Status</span>
                <span className="text-success font-medium">{paymentResult.status}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button variant="outline" className="h-14" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" className="h-14">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>

          <Link href="/dashboard">
            <Button variant="cta" size="xl" className="w-full">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading || !bill) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cta" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-primary text-white py-4 px-6">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <Link href="/bills" className="hover:opacity-80">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="font-heading text-xl font-bold">Pay Bill</h1>
            <p className="text-white/80 text-sm">Bill #{bill.billNumber}</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-6">
        {/* Bill Summary */}
        <div className="bg-white rounded-xl shadow-kiosk p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-muted-foreground text-sm">{bill.serviceType}</p>
              <p className="text-sm text-muted-foreground">
                Connection: {bill.connectionNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-sm">Period</p>
              <p className="font-medium">{bill.billPeriod}</p>
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-muted-foreground text-sm">Amount to Pay</p>
            <p className="font-heading text-3xl text-primary font-bold">
              ₹{bill.amount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Payment Methods */}
        <h2 className="font-heading text-lg text-primary mb-4">Select Payment Method</h2>
        <div className="space-y-3 mb-6">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setPaymentMethod(method.id)}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all cursor-pointer ${
                paymentMethod === method.id
                  ? "border-cta bg-cta/5"
                  : "border-slate-200 hover:border-cta/50"
              }`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                paymentMethod === method.id ? "bg-cta text-white" : "bg-slate-100 text-slate-600"
              }`}>
                <method.icon className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-medium text-primary">{method.name}</p>
                <p className="text-sm text-muted-foreground">{method.desc}</p>
              </div>
              {paymentMethod === method.id && (
                <CheckCircle className="w-5 h-5 text-cta ml-auto" />
              )}
            </button>
          ))}
        </div>

        {/* UPI ID Input (if UPI selected) */}
        {paymentMethod === "UPI" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-primary mb-2">
              Enter UPI ID
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              className="w-full h-14 px-4 rounded-lg border-2 border-slate-200 focus:border-cta focus:ring-2 focus:ring-cta/20 outline-none transition-colors text-lg"
            />
          </div>
        )}

        {/* Pay Button */}
        <Button
          variant="cta"
          size="xl"
          className="w-full"
          disabled={!paymentMethod || processing || (paymentMethod === "UPI" && !upiId)}
          onClick={handlePayment}
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Pay ₹{bill.amount.toLocaleString()}
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          🔒 Secured by 256-bit encryption
        </p>
      </div>
    </div>
  );
}
