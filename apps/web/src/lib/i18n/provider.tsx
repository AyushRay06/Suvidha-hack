"use client";

import i18n from "i18next";
import { initReactI18next, I18nextProvider } from "react-i18next";
import { ReactNode, useEffect, useState } from "react";

// English translations
const en = {
  app: {
    title: "SUVIDHA Kiosk",
    subtitle: "Unified Civic Services",
  },
  home: {
    welcome: "Welcome to SUVIDHA",
    description: "Access all civic utility services from one place - Electricity, Gas, Water, and Municipal services.",
    selectService: "Select a Service",
    quickActions: "Quick Actions",
    loginCta: {
      title: "Already Registered?",
      description: "Login to access your bills, track grievances, and manage your connections.",
    },
  },
  services: {
    electricity: "Electricity",
    electricityDesc: "Pay bills, new connections, meter reading",
    gas: "Gas",
    gasDesc: "Bill payments, cylinder booking",
    water: "Water",
    waterDesc: "Pay bills, report leakage",
    municipal: "Municipal",
    municipalDesc: "Waste, roads, streetlights",
  },
  actions: {
    payBills: "Pay Bills",
    grievances: "Grievances",
    notifications: "Alerts",
    help: "Help",
  },
  auth: {
    login: "Login",
    register: "Register",
    logout: "Logout",
    phone: "Phone Number",
    name: "Full Name",
    email: "Email",
    otp: "OTP",
    sendOtp: "Send OTP",
    verifyOtp: "Verify OTP",
    enterPhone: "Enter your 10-digit phone number",
    enterOtp: "Enter the 6-digit OTP sent to your phone",
    newUser: "New user?",
    existingUser: "Already have an account?",
  },
  bills: {
    title: "My Bills",
    noBills: "No bills found",
    payNow: "Pay Now",
    viewDetails: "View Details",
    dueDate: "Due Date",
    amount: "Amount",
    status: "Status",
    unpaid: "Unpaid",
    paid: "Paid",
    overdue: "Overdue",
  },
  grievance: {
    title: "My Grievances",
    newGrievance: "File New Grievance",
    category: "Category",
    subject: "Subject",
    description: "Description",
    priority: "Priority",
    submit: "Submit Grievance",
    trackStatus: "Track Status",
    noGrievances: "No grievances filed",
  },
  common: {
    loading: "Loading...",
    error: "Something went wrong",
    retry: "Retry",
    back: "Back",
    next: "Next",
    submit: "Submit",
    cancel: "Cancel",
    success: "Success",
    print: "Print",
    download: "Download",
  },
  footer: {
    helpline: "Helpline",
  },
};

// Hindi translations
const hi = {
  app: {
    title: "सुविधा कियोस्क",
    subtitle: "एकीकृत नागरिक सेवाएं",
  },
  home: {
    welcome: "सुविधा में आपका स्वागत है",
    description: "एक ही स्थान से सभी नागरिक उपयोगिता सेवाओं का उपयोग करें - बिजली, गैस, पानी और नगरपालिका सेवाएं।",
    selectService: "सेवा चुनें",
    quickActions: "त्वरित कार्य",
    loginCta: {
      title: "पहले से पंजीकृत हैं?",
      description: "अपने बिलों तक पहुंचने, शिकायतों को ट्रैक करने और अपने कनेक्शन प्रबंधित करने के लिए लॉगिन करें।",
    },
  },
  services: {
    electricity: "बिजली",
    electricityDesc: "बिल भुगतान, नया कनेक्शन, मीटर रीडिंग",
    gas: "गैस",
    gasDesc: "बिल भुगतान, सिलेंडर बुकिंग",
    water: "पानी",
    waterDesc: "बिल भुगतान, रिसाव रिपोर्ट करें",
    municipal: "नगरपालिका",
    municipalDesc: "कचरा, सड़कें, स्ट्रीटलाइट",
  },
  actions: {
    payBills: "बिल भुगतान",
    grievances: "शिकायतें",
    notifications: "सूचनाएं",
    help: "सहायता",
  },
  auth: {
    login: "लॉगिन",
    register: "पंजीकरण",
    logout: "लॉगआउट",
    phone: "फोन नंबर",
    name: "पूरा नाम",
    email: "ईमेल",
    otp: "ओटीपी",
    sendOtp: "ओटीपी भेजें",
    verifyOtp: "ओटीपी सत्यापित करें",
    enterPhone: "अपना 10-अंकों का फोन नंबर दर्ज करें",
    enterOtp: "अपने फोन पर भेजा गया 6-अंकों का ओटीपी दर्ज करें",
    newUser: "नए उपयोगकर्ता?",
    existingUser: "पहले से खाता है?",
  },
  bills: {
    title: "मेरे बिल",
    noBills: "कोई बिल नहीं मिला",
    payNow: "अभी भुगतान करें",
    viewDetails: "विवरण देखें",
    dueDate: "देय तिथि",
    amount: "राशि",
    status: "स्थिति",
    unpaid: "अवैतनिक",
    paid: "भुगतान किया",
    overdue: "विलंबित",
  },
  grievance: {
    title: "मेरी शिकायतें",
    newGrievance: "नई शिकायत दर्ज करें",
    category: "श्रेणी",
    subject: "विषय",
    description: "विवरण",
    priority: "प्राथमिकता",
    submit: "शिकायत सबमिट करें",
    trackStatus: "स्थिति ट्रैक करें",
    noGrievances: "कोई शिकायत दर्ज नहीं",
  },
  common: {
    loading: "लोड हो रहा है...",
    error: "कुछ गलत हो गया",
    retry: "पुनः प्रयास करें",
    back: "वापस",
    next: "आगे",
    submit: "जमा करें",
    cancel: "रद्द करें",
    success: "सफल",
    print: "प्रिंट करें",
    download: "डाउनलोड करें",
  },
  footer: {
    helpline: "हेल्पलाइन",
  },
};

// Initialize i18n
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved language preference
    const savedLang = localStorage.getItem("suvidha-lang");
    if (savedLang && (savedLang === "en" || savedLang === "hi")) {
      i18n.changeLanguage(savedLang);
    }
  }, []);

  if (!mounted) {
    return null;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export { i18n };
