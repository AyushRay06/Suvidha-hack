"use client";

import { useEffect, useState, useCallback } from "react";
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
  Download,
  Printer,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/lib/store/auth";
import { useSIGM } from "@/lib/hooks/useSIGM";
import { GuaranteeCheckModal } from "@/components/kiosk/GuaranteeCheckModal";

interface Bill {
  id: string;
  serviceType: string;
  connectionNumber: string;
  billNumber: string;
  amount: number;
  totalAmount: number;
  dueDate: string;
  billPeriod: string;
  connection?: {
    connectionNo: string;
    serviceType: string;
  };
}

interface PaymentResult {
  paymentId: string;
  transactionId: string;
  amount: number;
  status: string;
  receiptNo: string;
}

export default function PayBillPage() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, tokens } = useAuthStore();

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(
    null,
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchBill();
    // Check if returning from Dodo checkout with payment result
    checkPaymentReturn();
  }, [isAuthenticated, params.id]);

  const fetchBill = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/billing/bills/${params.id}`,
        { headers: { Authorization: `Bearer ${tokens?.accessToken}` } },
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

  /**
   * Check if returning from Dodo Payments checkout.
   * Dodo redirects back with query params: ?payment_id=xxx&status=succeeded
   */
  const checkPaymentReturn = async () => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get("payment_id");
    const status = urlParams.get("status");
    const sessionId = urlParams.get("session_id");

    if (paymentId && status === "succeeded") {
      setProcessing(true);
      try {
        // Confirm the payment on the backend
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/payments/confirm`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokens?.accessToken}`,
            },
            body: JSON.stringify({
              billId: params.id,
              paymentId,
              sessionId: sessionId || undefined,
              amount: bill?.amount || 0,
              method: "UPI",
            }),
          },
        );

        const data = await res.json();

        if (data.success) {
          setPaymentResult({
            transactionId: data.data.transactionId,
            amount: data.data.amount,
            status: data.data.status,
            timestamp: new Date().toISOString(),
            receiptNumber: data.data.receiptNo,
          });
          toast({
            title: "Payment Successful!",
            description: `Transaction ID: ${data.data.transactionId}`,
            variant: "success",
          });
        } else {
          toast({
            title: "Payment confirmation failed",
            description: data.error || "Please contact support",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Payment confirmation error:", error);
        toast({
          title: "Error",
          description: "Failed to confirm payment. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setProcessing(false);
        // Clean up URL params
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  };

  /**
   * Initiate payment: create a Dodo checkout session and redirect
   */
  const handlePayment = async () => {
    if (!bill) return;
    setProcessing(true);

    try {
      const returnUrl = `${window.location.origin}/bills/${bill.id}/pay`;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/payments/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
          body: JSON.stringify({
            billId: bill.id,
            amount: bill.amount,
            returnUrl,
          }),
        },
      );

      const data = await res.json();

      if (data.success && data.data.checkoutUrl) {
        // Redirect user to Dodo Payments hosted checkout
        window.location.href = data.data.checkoutUrl;
      } else {
        throw new Error(data.error || "Failed to create payment session");
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  if (!isAuthenticated) return null;

  // Success State
  if (paymentResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
        <header className="bg-success text-white py-4 px-6">
          <div className="max-w-md mx-auto text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-2" />
            <h1 className="font-heading text-xl font-bold">
              Payment Successful!
            </h1>
          </div>
        </header>

        <div className="flex-1 p-6 max-w-md mx-auto w-full">
          {/* Guarantee Badge */}
          {checkResult?.guaranteeStatus === "GUARANTEED" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <Shield className="w-6 h-6 text-emerald-500" />
              <div>
                <p className="font-medium text-emerald-800 text-sm">
                  {i18n.language === "hi"
                    ? "गारंटीड: आपका भुगतान पूर्ण हो गया"
                    : "Guaranteed: Your payment is complete"}
                </p>
                <p className="text-emerald-600 text-xs">
                  {i18n.language === "hi"
                    ? "किसी दोबारा विजिट की जरूरत नहीं"
                    : "No repeat visit needed"}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-kiosk p-6 mb-6">
            <div className="text-center mb-6">
              <p className="text-muted-foreground text-sm">Amount Paid</p>
              <p className="font-heading text-4xl text-primary font-bold">
                ₹{paymentResult.amount?.toLocaleString() || (bill?.totalAmount || bill?.amount)?.toLocaleString()}
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
                <span>
                  {new Date(paymentResult.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Gateway</span>
                <span className="font-medium text-primary">Dodo Payments</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Status</span>
                <span className="text-success font-medium">
                  {paymentResult.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button
              variant="outline"
              className="h-14"
              onClick={() => window.print()}
            >
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

  // Loading / Processing State
  if (loading || !bill || processing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-cta" />
        {processing && (
          <p className="text-muted-foreground text-sm">
            Processing your payment...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* SIGM Guarantee Check Modal */}
      <GuaranteeCheckModal
        isOpen={isModalOpen}
        checkResult={checkResult}
        isLoading={isChecking}
        onAcknowledge={handleAcknowledge}
        onCancel={handleCancel}
        onProceed={handleProceed}
        language={i18n.language as "en" | "hi"}
      />

      {/* Header */}
      <header className="bg-primary text-white py-4 px-6">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <Link href="/bills" className="hover:opacity-80">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="font-heading text-xl font-bold">Pay Bill</h1>
            <p className="text-white/80 text-sm">Bill #{bill.billNumber || bill.connection?.connectionNo}</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-6">
        {/* Bill Summary */}
        <div className="bg-white rounded-xl shadow-kiosk p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-muted-foreground text-sm">
                {bill.serviceType}
              </p>
              <p className="text-sm text-muted-foreground">
                Connection: {bill.connectionNumber || bill.connection?.connectionNo}
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-sm">Period</p>
              <p className="font-medium">{bill.billPeriod || "Current"}</p>
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-muted-foreground text-sm">Amount to Pay</p>
            <p className="font-heading text-3xl text-primary font-bold">
              ₹{(bill.totalAmount || bill.amount)?.toLocaleString()}
            </p>
          </div>
        </div>

        {/* SIGM Status Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-500" />
          <div className="text-sm">
            <p className="text-blue-800 font-medium">
              {i18n.language === "hi"
                ? "सिंगल-इंटरेक्शन गारंटी मोड सक्षम"
                : "Single-Interaction Guarantee Mode Enabled"}
            </p>
            <p className="text-blue-600 text-xs">
              {i18n.language === "hi"
                ? "भुगतान से पहले हम आपके अनुरोध की जांच करेंगे"
                : "We'll verify your request before payment"}
            </p>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 text-sm">
                Secure Payment via Dodo Payments
              </p>
              <p className="text-blue-700 text-xs mt-1">
                You will be redirected to Dodo Payments secure checkout page.
                Supports UPI, Cards, Net Banking, and Wallets.
              </p>
            </div>
          </div>
        </div>

        {/* Supported Payment Methods Display */}
        <div className="mb-6">
          <h2 className="font-heading text-lg text-primary mb-3">
            Supported Methods
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Smartphone, name: "UPI", desc: "UPI / BHIM" },
              { icon: CreditCard, name: "Cards", desc: "Visa / MC / RuPay" },
              { icon: Building2, name: "Net Banking", desc: "All banks" },
            ].map((method) => (
              <div
                key={method.name}
                className="p-3 rounded-xl border border-slate-200 bg-white text-center"
              >
                <div className="w-10 h-10 mx-auto rounded-lg bg-slate-100 flex items-center justify-center mb-2">
                  <method.icon className="w-5 h-5 text-slate-600" />
                </div>
                <p className="font-medium text-xs text-primary">
                  {method.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {method.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pay Button with SIGM Check */}
        <Button
          variant="cta"
          size="xl"
          className="w-full"
          disabled={processing}
          onClick={handlePayment}
        >
          {isChecking ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Verifying...
            </>
          ) : processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Redirecting to checkout...
            </>
          ) : (
            <>
              <ExternalLink className="w-5 h-5 mr-2" />
              Pay ₹{bill.amount.toLocaleString()}
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          🔒 Payments secured by Dodo Payments · 256-bit encryption
        </p>
      </div>
    </div>
  );
}
