"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
    Zap,
    Droplet,
    Flame,
    Camera,
    Upload,
    TrendingUp,
    Calendar,
    FileText,
    CheckCircle,
    ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store/auth";

interface Connection {
    id: string;
    connectionNo: string;
    serviceType: string;
    address: string;
    lastReading: number | null;
    lastReadingDate: string | null;
}

const serviceIcons: Record<string, any> = {
    ELECTRICITY: Zap,
    WATER: Droplet,
    GAS: Flame,
};

const serviceColors: Record<string, { bg: string; text: string; border: string }> = {
    ELECTRICITY: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    WATER: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    GAS: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
};

export default function MeterReadingsPage() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const isHindi = i18n.language === "hi";

    const { user, isAuthenticated } = useAuthStore();

    const [step, setStep] = useState(1);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
    const [reading, setReading] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/auth/login");
            return;
        }
        fetchConnections();
    }, [isAuthenticated, router]);

    const fetchConnections = async () => {
        try {
            const token = useAuthStore.getState().tokens?.accessToken;
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/connections`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.ok) {
                const data = await res.json();
                setConnections(data.data || []);
            } else {
                // Mock data
                setConnections([
                    { id: "1", connectionNo: "ELEC-2024-001", serviceType: "ELECTRICITY", address: "123 Main St", lastReading: 1250, lastReadingDate: "2024-01-15" },
                    { id: "2", connectionNo: "WATER-2024-001", serviceType: "WATER", address: "123 Main St", lastReading: 5000, lastReadingDate: "2024-01-10" },
                ]);
            }
        } catch (err) {
            console.error("Failed to fetch connections:", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadToCloudinary = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "");

        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        const data = await res.json();
        return data.secure_url;
    };

    const handleSubmit = async () => {
        if (!selectedConnection || !reading) return;

        setUploading(true);
        try {
            let photoUrl = null;
            if (photo) {
                photoUrl = await uploadToCloudinary(photo);
            }

            const token = useAuthStore.getState().tokens?.accessToken;
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/meter-readings`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        connectionId: selectedConnection.id,
                        reading: parseFloat(reading),
                        photoUrl,
                    }),
                }
            );

            if (res.ok) {
                setSubmitted(true);
            }
        } catch (err) {
            console.error("Failed to submit reading:", err);
        } finally {
            setUploading(false);
        }
    };

    const consumption = selectedConnection && reading
        ? parseFloat(reading) - (selectedConnection.lastReading || 0)
        : 0;

    if (!isAuthenticated) {
        return null;
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-cta/5 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary mb-2">
                        {isHindi ? "रीडिंग सबमिट की गई!" : "Reading Submitted!"}
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        {isHindi
                            ? "आपकी मीटर रीडिंग सफलतापूर्वक रिकॉर्ड की गई है।"
                            : "Your meter reading has been successfully recorded."}
                    </p>
                    <div className="space-y-3">
                        <Button variant="cta" className="w-full" onClick={() => router.push("/dashboard")}>
                            {isHindi ? "डैशबोर्ड पर जाएं" : "Go to Dashboard"}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                                setSubmitted(false);
                                setStep(1);
                                setSelectedConnection(null);
                                setReading("");
                                setPhoto(null);
                                setPhotoPreview(null);
                            }}
                        >
                            {isHindi ? "और रीडिंग सबमिट करें" : "Submit Another Reading"}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-cta/5 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {isHindi ? "वापस जाएं" : "Back"}
                    </Button>
                    <h1 className="text-3xl font-bold text-primary mb-2">
                        {isHindi ? "मीटर रीडिंग सबमिट करें" : "Submit Meter Reading"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isHindi ? "अपनी उपयोगिता मीटर रीडिंग रिकॉर्ड करें" : "Record your utility meter readings"}
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-primary text-white" : "bg-slate-200"}`}>
                                1
                            </div>
                            <span className="font-medium">{isHindi ? "कनेक्शन चुनें" : "Select Connection"}</span>
                        </div>
                        <div className="w-12 h-0.5 bg-slate-200" />
                        <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-primary text-white" : "bg-slate-200"}`}>
                                2
                            </div>
                            <span className="font-medium">{isHindi ? "रीडिंग दर्ज करें" : "Enter Reading"}</span>
                        </div>
                    </div>
                </div>

                {/* Step 1: Select Connection */}
                {step === 1 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-primary mb-4">
                            {isHindi ? "अपना कनेक्शन चुनें" : "Select Your Connection"}
                        </h2>
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="animate-spin w-8 h-8 border-4 border-cta border-t-transparent rounded-full" />
                            </div>
                        ) : connections.length > 0 ? (
                            <div className="grid gap-4">
                                {connections.map((conn) => {
                                    const Icon = serviceIcons[conn.serviceType] || Zap;
                                    const colors = serviceColors[conn.serviceType] || serviceColors.ELECTRICITY;

                                    return (
                                        <button
                                            key={conn.id}
                                            onClick={() => {
                                                setSelectedConnection(conn);
                                                setStep(2);
                                            }}
                                            className="flex items-center gap-4 p-4 border-2 rounded-xl hover:border-primary transition-colors text-left"
                                        >
                                            <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                                                <Icon className={`w-6 h-6 ${colors.text}`} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-primary">{conn.connectionNo}</p>
                                                <p className="text-sm text-muted-foreground">{conn.address}</p>
                                                {conn.lastReading && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Last Reading: {conn.lastReading} units
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                <p className="text-muted-foreground">
                                    {isHindi ? "कोई कनेक्शन नहीं मिला" : "No connections found"}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Enter Reading */}
                {step === 2 && selectedConnection && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <Button variant="ghost" onClick={() => setStep(1)} className="mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {isHindi ? "कनेक्शन बदलें" : "Change Connection"}
                        </Button>

                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-primary mb-2">
                                {selectedConnection.connectionNo}
                            </h2>
                            <p className="text-sm text-muted-foreground">{selectedConnection.address}</p>
                        </div>

                        {/* Previous Reading */}
                        {selectedConnection.lastReading && (
                            <div className="bg-slate-50 rounded-lg p-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{isHindi ? "पिछली रीडिंग" : "Previous Reading"}</p>
                                        <p className="text-2xl font-bold text-primary">{selectedConnection.lastReading}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">{isHindi ? "तारीख" : "Date"}</p>
                                        <p className="text-sm font-medium">
                                            {selectedConnection.lastReadingDate
                                                ? new Date(selectedConnection.lastReadingDate).toLocaleDateString()
                                                : "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Current Reading Input */}
                        <div className="mb-6">
                            <Label>{isHindi ? "वर्तमान रीडिंग" : "Current Reading"}</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={reading}
                                onChange={(e) => setReading(e.target.value)}
                                placeholder={isHindi ? "रीडिंग दर्ज करें" : "Enter reading"}
                                className="mt-2 text-lg"
                            />
                        </div>

                        {/* Consumption Display */}
                        {reading && consumption > 0 && (
                            <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-5 h-5 text-success" />
                                    <p className="font-semibold text-success">{isHindi ? "खपत" : "Consumption"}</p>
                                </div>
                                <p className="text-3xl font-bold text-success">{consumption.toFixed(2)} units</p>
                            </div>
                        )}

                        {/* Photo Upload */}
                        <div className="mb-6">
                            <Label>{isHindi ? "मीटर फोटो (वैकल्पिक)" : "Meter Photo (Optional)"}</Label>
                            <div className="mt-2">
                                {photoPreview ? (
                                    <div className="relative">
                                        <img src={photoPreview} alt="Meter" className="w-full h-48 object-cover rounded-lg" />
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => {
                                                setPhoto(null);
                                                setPhotoPreview(null);
                                            }}
                                            className="absolute top-2 right-2"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                                        <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                            {isHindi ? "फोटो अपलोड करने के लिए क्लिक करें" : "Click to upload photo"}
                                        </p>
                                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            variant="cta"
                            className="w-full"
                            onClick={handleSubmit}
                            disabled={!reading || uploading}
                        >
                            {uploading ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                    {isHindi ? "सबमिट हो रहा है..." : "Submitting..."}
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    {isHindi ? "रीडिंग सबमिट करें" : "Submit Reading"}
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
