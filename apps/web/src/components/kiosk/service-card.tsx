"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ServiceProps {
  service: {
    id: string;
    name: string;
    nameHi: string;
    icon: LucideIcon;
    color: string;
    iconColor: string;
    href: string;
    description: string;
  };
  isKiosk?: boolean;
}

export function ServiceCard({ service, isKiosk = false }: ServiceProps) {
  const { i18n } = useTranslation();
  const Icon = service.icon;
  
  const displayName = i18n.language === "hi" ? service.nameHi : service.name;

  return (
    <Link
      href={service.href}
      className={`kiosk-card group flex flex-col items-center text-center p-6 lg:p-8 gap-4 hover:shadow-lg hover:-translate-y-2 transition-all duration-200`}
    >
      <div className={`${service.color} rounded-2xl lg:rounded-3xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${isKiosk ? 'w-24 h-24 lg:w-28 lg:h-28' : 'w-20 h-20'}`}>
        <Icon className={`${isKiosk ? 'w-12 h-12 lg:w-16 lg:h-16' : 'w-10 h-10'} ${service.iconColor}`} />
      </div>
      <div className="flex-1">
        <h4 className={`font-heading font-bold text-primary mb-2 group-hover:text-cta transition-colors ${isKiosk ? 'text-xl lg:text-2xl' : 'text-lg'}`}>
          {displayName}
        </h4>
        <p className={`text-muted-foreground line-clamp-2 ${isKiosk ? 'text-base lg:text-lg' : 'text-sm'}`}>
          {service.description}
        </p>
      </div>
    </Link>
  );
}
