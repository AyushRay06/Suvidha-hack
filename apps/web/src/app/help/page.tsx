"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import {
    ChevronLeft,
    Phone,
    Mail,
    MapPin,
    Clock,
    FileText,
    MessageSquare,
    HelpCircle,
    ChevronRight,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function HelpPage() {
    const { t } = useTranslation();
    const router = useRouter();

    const faqs = [
        {
            question: t("help.faq1q"),
            answer: t("help.faq1a"),
        },
        {
            question: t("help.faq2q"),
            answer: t("help.faq2a"),
        },
        {
            question: t("help.faq3q"),
            answer: t("help.faq3a"),
        },
        {
            question: t("help.faq4q"),
            answer: t("help.faq4a"),
        },
        {
            question: t("help.faq5q"),
            answer: t("help.faq5a"),
        },
    ];

    const contacts = [
        {
            icon: Phone,
            title: t("help.helpline"),
            value: "1800-XXX-XXXX",
            subtitle: t("help.available24x7"),
        },
        {
            icon: Mail,
            title: t("help.email"),
            value: "support@suvidha.gov.in",
            subtitle: t("help.emailResponse"),
        },
        {
            icon: MapPin,
            title: t("help.office"),
            value: t("help.officeAddress"),
            subtitle: t("help.officeHours"),
        },
    ];

    const quickLinks = [
        { name: t("help.billPaymentGuide"), href: "/help/bills" },
        { name: t("help.grievanceProcess"), href: "/help/grievances" },
        { name: t("help.connectionTypes"), href: "/help/connections" },
        { name: t("help.documentRequirements"), href: "/help/documents" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <header className="bg-primary text-white py-4 px-6">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="text-white hover:bg-white/10"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <div>
                        <h1 className="font-heading text-xl font-bold">
                            {t("help.title")}
                        </h1>
                        <p className="text-white/70 text-sm">
                            {t("help.subtitle")}
                        </p>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-6">
                {/* Emergency Banner */}
                <div className="bg-gradient-to-r from-destructive/10 to-destructive/5 border border-destructive/20 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                            <Phone className="w-6 h-6 text-destructive" />
                        </div>
                        <div>
                            <p className="font-bold text-destructive">
                                {t("help.emergencyHelpline")}
                            </p>
                            <p className="text-2xl font-bold text-primary">1800-XXX-XXXX</p>
                        </div>
                    </div>
                </div>

                {/* FAQs */}
                <section className="mb-8">
                    <h2 className="font-heading text-lg text-primary mb-4 flex items-center gap-2">
                        <HelpCircle className="w-5 h-5" />
                        {t("help.faqTitle")}
                    </h2>
                    <div className="space-y-3">
                        {faqs.map((faq, idx) => (
                            <details
                                key={idx}
                                className="kiosk-card group"
                            >
                                <summary className="cursor-pointer list-none flex items-center justify-between">
                                    <span className="font-medium text-primary">{faq.question}</span>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform" />
                                </summary>
                                <p className="mt-3 text-muted-foreground text-sm border-t pt-3">
                                    {faq.answer}
                                </p>
                            </details>
                        ))}
                    </div>
                </section>

                {/* Contact Information */}
                <section className="mb-8">
                    <h2 className="font-heading text-lg text-primary mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        {t("help.contactUs")}
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {contacts.map((contact, idx) => (
                            <div key={idx} className="kiosk-card text-center">
                                <div className="w-12 h-12 bg-cta/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <contact.icon className="w-6 h-6 text-cta" />
                                </div>
                                <p className="text-sm text-muted-foreground">{contact.title}</p>
                                <p className="font-bold text-primary">{contact.value}</p>
                                <p className="text-xs text-muted-foreground mt-1">{contact.subtitle}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Quick Links */}
                <section className="mb-8">
                    <h2 className="font-heading text-lg text-primary mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {t("help.quickLinks")}
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {quickLinks.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.href}
                                className="kiosk-card flex items-center justify-between hover:border-cta border-2 border-transparent"
                            >
                                <span className="font-medium text-primary">{link.name}</span>
                                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Operating Hours */}
                <section>
                    <div className="kiosk-card bg-slate-50">
                        <h3 className="font-medium text-primary mb-3 flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            {t("help.operatingHours")}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">{t("help.mondaySaturday")}</p>
                                <p className="font-medium">8:00 AM - 8:00 PM</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">{t("help.sundayHolidays")}</p>
                                <p className="font-medium">10:00 AM - 4:00 PM</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
