"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { 
  Zap, 
  Flame, 
  Droplets, 
  Building2,
  FileText,
  MessageSquare,
  Bell,
  HelpCircle,
  ArrowRight,
  Smartphone
} from "lucide-react";
import { LanguageToggle } from "@/components/kiosk/language-toggle";
import { ServiceCard } from "@/components/kiosk/service-card";
import { AlertBanner } from "@/components/kiosk/alert-banner";
import { useKiosk } from "@/lib/hooks/useKiosk";

export default function HomePage() {
  const { t } = useTranslation();
  const kiosk = useKiosk();

  const services = [
    {
      id: "electricity",
      name: t("services.electricity"),
      nameHi: "बिजली",
      icon: Zap,
      color: "bg-electricity-light",
      iconColor: "text-electricity",
      href: "/services/electricity",
      description: t("services.electricityDesc"),
    },
    {
      id: "gas",
      name: t("services.gas"),
      nameHi: "गैस",
      icon: Flame,
      color: "bg-gas-light",
      iconColor: "text-gas",
      href: "/services/gas",
      description: t("services.gasDesc"),
    },
    {
      id: "water",
      name: t("services.water"),
      nameHi: "पानी",
      icon: Droplets,
      color: "bg-water-light",
      iconColor: "text-water",
      href: "/services/water",
      description: t("services.waterDesc"),
    },
    {
      id: "municipal",
      name: t("services.municipal"),
      nameHi: "नगरपालिका",
      icon: Building2,
      color: "bg-municipal-light",
      iconColor: "text-municipal",
      href: "/services/municipal",
      description: t("services.municipalDesc"),
    },
  ];

  const quickActions = [
    {
      id: "pay-bills",
      name: t("actions.payBills"),
      icon: FileText,
      href: "/bills",
    },
    {
      id: "grievances",
      name: t("actions.grievances"),
      icon: MessageSquare,
      href: "/grievances",
    },
    {
      id: "notifications",
      name: t("actions.notifications"),
      icon: Bell,
      href: "/notifications",
    },
    {
      id: "help",
      name: t("actions.help"),
      icon: HelpCircle,
      href: "/help",
    },
  ];

  const isKiosK = kiosk.isKiosk || kiosk.isTouchDevice;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-white py-6 lg:py-10 px-6 lg:px-8 shadow-lg sticky top-0 z-40">
        <div className={`${isKiosK ? 'max-w-full' : 'max-w-6xl'} mx-auto flex items-center justify-between gap-4`}>
          <div className="flex items-center gap-4 lg:gap-6 flex-1">
            <div className={`${isKiosK ? 'w-16 lg:w-20 h-16 lg:h-20' : 'w-14 h-14'} bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0`}>
              <Building2 className={`${isKiosK ? 'w-8 lg:w-10 h-8 lg:h-10' : 'w-8 h-8'}`} />
            </div>
            <div className="min-w-0">
              <h1 className={`${isKiosK ? 'text-2xl lg:text-4xl' : 'text-2xl'} font-heading font-bold truncate`}>
                {t("app.title")}
              </h1>
              <p className={`text-white/80 ${isKiosK ? 'text-base lg:text-lg' : 'text-sm'} line-clamp-1`}>
                {t("app.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Alert Banner */}
      <AlertBanner />

      {/* Main Content */}
      <div className={`${isKiosK ? 'max-w-full' : 'max-w-6xl'} mx-auto px-6 lg:px-8 py-8 lg:py-12`}>
        {/* Welcome Section */}
        <section className={`text-center mb-12 lg:mb-16 ${isKiosK ? 'py-6 lg:py-10' : 'py-4'}`}>
          <h2 className={`font-heading font-bold text-primary mb-4 ${isKiosK ? 'text-3xl lg:text-5xl' : 'text-3xl'}`}>
            {t("home.welcome")}
          </h2>
          <p className={`text-muted-foreground ${isKiosK ? 'text-lg lg:text-2xl' : 'text-lg'} max-w-3xl mx-auto leading-relaxed`}>
            {t("home.description")}
          </p>
        </section>

        {/* Services Grid */}
        <section className="mb-12 lg:mb-16">
          <div className="section-header mb-8">
            {t("home.selectService")}
          </div>
          <div className={`grid gap-6 lg:gap-8 ${isKiosK ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} isKiosk={isKiosK} />
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-12 lg:mb-16">
          <div className="section-header mb-8">
            {t("home.quickActions")}
          </div>
          <div className={`grid gap-6 lg:gap-8 ${isKiosK ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
            {quickActions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className="kiosk-card group flex flex-col items-center text-center gap-4 p-6 lg:p-8 hover:shadow-lg hover:-translate-y-2"
              >
                <div className={`${isKiosK ? 'w-20 h-20 lg:w-24 lg:h-24' : 'w-14 h-14'} bg-cta-light rounded-2xl flex items-center justify-center group-hover:bg-cta transition-colors duration-200`}>
                  <action.icon className={`${isKiosK ? 'w-10 h-10 lg:w-12 lg:h-12' : 'w-8 h-8'} text-cta group-hover:text-white transition-colors duration-200`} />
                </div>
                <span className={`font-semibold text-primary ${isKiosK ? 'text-lg lg:text-xl' : 'text-base'}`}>
                  {action.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-primary via-primary to-secondary rounded-3xl p-8 lg:p-12 text-white text-center mb-12">
          <div className="flex items-center justify-center mb-4 gap-2">
            <Smartphone className="w-6 h-6 lg:w-8 lg:h-8" />
            <span className={`font-semibold ${isKiosK ? 'text-lg lg:text-xl' : 'text-base'}`}>
              {isKiosK ? 'Kiosk Mode' : 'Web Access'}
            </span>
          </div>
          <h3 className={`font-heading font-bold text-white mb-4 ${isKiosK ? 'text-3xl lg:text-4xl' : 'text-2xl'}`}>
            {t("home.loginCta.title")}
          </h3>
          <p className={`text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed ${isKiosK ? 'text-lg lg:text-xl' : 'text-base'}`}>
            {t("home.loginCta.description")}
          </p>
          <div className={`flex flex-col gap-4 lg:flex-row justify-center ${isKiosK ? 'gap-6 lg:gap-8' : 'gap-4'}`}>
            <Link
              href="/auth/login"
              className="kiosk-button flex items-center justify-center gap-2 bg-cta text-white hover:bg-cta/90 active:scale-95"
            >
              {t("auth.login")}
              <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6" />
            </Link>
            <Link
              href="/auth/register"
              className="kiosk-button flex items-center justify-center gap-2 bg-white text-primary hover:bg-gray-100 active:scale-95"
            >
              {t("auth.register")}
              <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6" />
            </Link>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-primary/5 border-t border-border py-8 lg:py-10 px-6 lg:px-8 mt-12">
        <div className={`${isKiosK ? 'max-w-full' : 'max-w-6xl'} mx-auto text-center`}>
          <p className={`text-muted-foreground font-medium ${isKiosK ? 'text-lg lg:text-xl' : 'text-sm'}`}>
            © 2026 SUVIDHA Kiosk • C-DAC Smart City Initiative
          </p>
          <p className={`text-muted-foreground mt-2 ${isKiosK ? 'text-base lg:text-lg' : 'text-xs'}`}>
            {t("footer.helpline")}: 1800-XXX-XXXX
          </p>
        </div>
      </footer>
    </div>
  );
}
