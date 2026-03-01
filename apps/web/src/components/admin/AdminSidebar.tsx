"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
    LayoutDashboard,
    Users,
    CreditCard,
    MessageSquare,
    Bell,
    BarChart3,
    Monitor,
    LogOut,
    Building2,
    Zap,
    DollarSign,
    Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

interface AdminSidebarProps {
    activeId: string;
}

const navItems = [
    { id: "dashboard", name: "Dashboard", nameHi: "डैशबोर्ड", icon: LayoutDashboard, href: "/admin" },
    { id: "users", name: "Users", nameHi: "उपयोगकर्ता", icon: Users, href: "/admin/users" },
    { id: "connections", name: "Connections", nameHi: "कनेक्शन", icon: Zap, href: "/admin/connections" },
    { id: "payments", name: "Payments", nameHi: "भुगतान", icon: CreditCard, href: "/admin/payments" },
    { id: "grievances", name: "Grievances", nameHi: "शिकायतें", icon: MessageSquare, href: "/admin/grievances" },
    { id: "tariffs", name: "Tariffs", nameHi: "टैरिफ", icon: DollarSign, href: "/admin/tariffs" },
    { id: "meter-readings", name: "Meter Readings", nameHi: "मीटर रीडिंग", icon: Gauge, href: "/admin/meter-readings" },
    { id: "reports", name: "Reports", nameHi: "रिपोर्ट", icon: BarChart3, href: "/admin/reports" },
    { id: "kiosks", name: "Kiosks", nameHi: "कियोस्क", icon: Monitor, href: "/admin/kiosks" },
    { id: "alerts", name: "Alerts", nameHi: "अलर्ट", icon: Bell, href: "/admin/alerts" },
];

export function AdminSidebar({ activeId }: AdminSidebarProps) {
    const { i18n } = useTranslation();
    const router = useRouter();
    const isHindi = i18n.language === "hi";
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    return (
        <aside className="w-64 bg-primary text-white flex flex-col fixed h-full z-20">
            <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg">SUVIDHA</h1>
                        <p className="text-xs text-white/60">Admin Dashboard</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === activeId;
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? "bg-white/20 text-white"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{isHindi ? item.nameHi : item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-cta rounded-full flex items-center justify-center text-white font-bold">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user?.name}</p>
                        <p className="text-xs text-white/60">{user?.role}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full text-white/70 hover:text-white hover:bg-white/10"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    {isHindi ? "लॉग आउट" : "Logout"}
                </Button>
            </div>
        </aside>
    );
}
