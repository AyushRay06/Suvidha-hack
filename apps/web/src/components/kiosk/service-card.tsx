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
}

export function ServiceCard({ service }: ServiceProps) {
  const { i18n } = useTranslation();
  const Icon = service.icon;
  
  const displayName = i18n.language === "hi" ? service.nameHi : service.name;

  return (
    <Link
      href={service.href}
      className="kiosk-card group flex flex-col items-center text-center p-8 border-2 border-transparent hover:border-cta"
    >
      <div className={`service-icon ${service.color} mb-4`}>
        <Icon className={`w-8 h-8 ${service.iconColor}`} />
      </div>
      <h4 className="font-heading text-xl text-primary mb-2 group-hover:text-cta transition-colors">
        {displayName}
      </h4>
      <p className="text-sm text-muted-foreground line-clamp-2">
        {service.description}
      </p>
    </Link>
  );
}
