"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GrievanceSuccessPage() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isHindi = i18n.language === "hi";

    const ticketNo = searchParams.get("ticket") || "N/A";

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <header className="bg-primary text-white py-4 px-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="font-heading text-xl font-bold">
                        {isHindi ? "शिकायत पंजीकरण" : "Grievance Registration"}
                    </h1>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Progress Bar - All Complete */}
                <div className="flex items-center gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className="h-2 flex-1 rounded-full bg-cta"
                        />
                    ))}
                </div>

                {/* Success Message */}
                <div className="text-center py-8">
                    <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10 text-success" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary mb-2">
                        {isHindi ? "शिकायत सफलतापूर्वक दर्ज!" : "Grievance Submitted!"}
                    </h2>
                    <p className="text-muted-foreground mb-4">
                        {isHindi
                            ? "आपका शिकायत टिकट नंबर है:"
                            : "Your grievance ticket number is:"}
                    </p>
                    <div className="bg-slate-100 rounded-xl py-4 px-6 inline-block mb-6">
                        <p className="text-2xl font-mono font-bold text-primary">{ticketNo}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-8">
                        {isHindi
                            ? "आपको जल्द ही SMS/ईमेल के माध्यम से अपडेट प्राप्त होगा।"
                            : "You will receive updates via SMS/Email shortly."}
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button variant="outline" onClick={() => router.push("/dashboard")}>
                            {isHindi ? "डैशबोर्ड पर जाएं" : "Go to Dashboard"}
                        </Button>
                        <Button variant="cta" onClick={() => router.push("/grievances/new")}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            {isHindi ? "नई शिकायत" : "New Grievance"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
