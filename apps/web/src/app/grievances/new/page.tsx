"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  Zap,
  Flame,
  Droplets,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";
import { GrievanceForm } from "@/components/shared/grievance-form";

const serviceTypes = [
  {
    id: "ELECTRICITY",
    name: "Electricity",
    nameHi: "बिजली",
    icon: Zap,
    color: "text-electricity",
    bg: "bg-electricity-light",
    description: "Report electricity service issues",
    descriptionHi: "बिजली सेवा समस्याओं की रिपोर्ट करें",
  },
  {
    id: "GAS",
    name: "Gas",
    nameHi: "गैस",
    icon: Flame,
    color: "text-gas",
    bg: "bg-gas-light",
    description: "Report gas service issues",
    descriptionHi: "गैस सेवा समस्याओं की रिपोर्ट करें",
  },
  {
    id: "WATER",
    name: "Water",
    nameHi: "जल",
    icon: Droplets,
    color: "text-water",
    bg: "bg-water-light",
    description: "Report water service issues",
    descriptionHi: "जल सेवा समस्याओं की रिपोर्ट करें",
  },
  {
    id: "MUNICIPAL",
    name: "Municipal",
    nameHi: "नगरपालिका",
    icon: Building2,
    color: "text-municipal",
    bg: "bg-municipal-light",
    description: "Report civic issues",
    descriptionHi: "नागरिक समस्याओं की रिपोर्ट करें",
  },
];

export default function NewGrievancePage() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const isHindi = i18n.language === "hi";

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string>("");

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setStep(2);
  };

  if (!isAuthenticated) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-primary text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (step > 1 ? setStep(1) : router.back())}
            className="text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="font-heading text-xl font-bold">
              {isHindi ? "नई शिकायत दर्ज करें" : "Register New Grievance"}
            </h1>
            <p className="text-white/70 text-sm">
              {isHindi ? `चरण ${step} का 2` : `Step ${step} of 2`}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all ${s <= step ? "bg-cta" : "bg-slate-200"
                }`}
            />
          ))}
        </div>

        {/* Step 1: Select Service */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-medium text-primary mb-4">
              {isHindi ? "सेवा प्रकार चुनें" : "Select Service Type"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceTypes.map((service) => {
                const Icon = service.icon;
                return (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service.id)}
                    className="kiosk-card flex items-start gap-4 text-left hover:border-cta border-2 border-transparent transition-all"
                  >
                    <div className={`w-14 h-14 ${service.bg} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-7 h-7 ${service.color}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-primary text-lg">
                        {isHindi ? service.nameHi : service.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isHindi ? service.descriptionHi : service.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Grievance Form */}
        {step === 2 && selectedService && (
          <GrievanceForm
            serviceType={selectedService as any}
            onSuccess={() => router.push("/dashboard")}
          />
        )}
      </div>
    </div>
  );
}
