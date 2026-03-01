"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Droplets, CheckCircle, Gauge, TrendingUp, AlertCircle, FileText, Calendar, Camera, Upload, X } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { DownloadWaterBillBtn } from "./download-water-bill-btn";

interface MeterReadingFormProps {
    connectionId: string;
    lastReading: number;
    onSuccess?: () => void;
}

interface BillEstimate {
    unitsConsumed: number;
    loadType: string;
    slabBreakdown: { slab: string; units: number; rate: number; amount: number }[];
    energyCharge: number;
    fixedCharge: number;
    sewerageCharge: number;
    totalAmount: number;
}

export function WaterMeterReadingForm({ connectionId, lastReading, onSuccess }: MeterReadingFormProps) {
    const { t } = useTranslation();
    const { tokens } = useAuthStore();
    const [reading, setReading] = useState<string>("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState(false);
    const [billEstimate, setBillEstimate] = useState<BillEstimate | null>(null);
    const [generatedBillNo, setGeneratedBillNo] = useState<string>("");

    const currentReading = parseFloat(reading) || 0;
    const consumption = currentReading > lastReading ? currentReading - lastReading : 0;

    const fetchEstimate = async (units: number) => {
        if (units <= 0) {
            setBillEstimate(null);
            return;
        }

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/water/calculate-bill`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokens?.accessToken}`,
                },
                body: JSON.stringify({ unitsConsumed: units }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setBillEstimate(data.data);
                }
            }
        } catch (err) {
            console.error("Failed to fetch estimate:", err);
        }
    };

    const handleReadingChange = (value: string) => {
        setReading(value);
        const newReading = parseFloat(value) || 0;
        const units = newReading > lastReading ? newReading - lastReading : 0;
        fetchEstimate(units);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const readingValue = parseFloat(reading);
        if (isNaN(readingValue) || readingValue < lastReading) {
            setError(`Reading must be at least ${lastReading} kL (your last reading)`);
            return;
        }

        setLoading(true);
        setUploading(true);

        try {
            let photoUrl = null;
            if (photo) {
                photoUrl = await uploadToCloudinary(photo);
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/water/readings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokens?.accessToken}`,
                },
                body: JSON.stringify({
                    connectionId,
                    reading: readingValue,
                    imageUrl: photoUrl,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setGeneratedBillNo(data.data.bill?.billNo || '');
                if (data.data.calculation) {
                    setBillEstimate(data.data.calculation);
                }
            } else {
                throw new Error(data.error || 'Failed to submit reading');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    if (success) {
        return (
            <Card className="border-2 border-success/30 bg-success/5">
                <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="font-heading text-xl text-success mb-2">{t("meterReading.readingSubmitted")}</h3>
                    <p className="text-muted-foreground mb-4">
                        {t("meterReading.waterReadingRecorded")}
                    </p>

                    {billEstimate && (
                        <div className="bg-white rounded-lg p-4 mb-4 text-left">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-muted-foreground">{t("bills.billAmount")}</span>
                                <span className="text-2xl font-bold text-primary">₹{billEstimate.totalAmount}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {consumption} kL consumed
                            </div>
                        </div>
                    )}

                    {generatedBillNo && billEstimate && (
                        <DownloadWaterBillBtn
                            billNo={generatedBillNo}
                            amount={billEstimate.totalAmount}
                            unitsConsumed={consumption}
                            connectionId={connectionId}
                        />
                    )}

                    <Button
                        variant="outline"
                        className="mt-4 w-full"
                        onClick={onSuccess}
                    >
                        {t("common.backToDashboard")}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-water" />
                    {t("meterReading.submitTitle")}
                </CardTitle>
                <CardDescription>
                    {t("meterReading.waterEnterReading")}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Last Reading */}
                    <div className="bg-water-light/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Calendar className="w-4 h-4" />
                            {t("meterReading.previousReading")}
                        </div>
                        <div className="text-2xl font-bold text-water">{lastReading} kL</div>
                    </div>

                    {/* Current Reading Input */}
                    <div className="space-y-2">
                        <Label htmlFor="reading" className="text-base">{t("meterReading.waterCurrentReading")}</Label>
                        <Input
                            id="reading"
                            type="number"
                            step="0.1"
                            min={lastReading}
                            placeholder={`Enter reading (min: ${lastReading})`}
                            value={reading}
                            onChange={(e) => handleReadingChange(e.target.value)}
                            className="text-xl h-14 text-center"
                        />
                    </div>

                    {/* Consumption Display */}
                    {consumption > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-cyan-50 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-cyan-600" />
                            <div>
                                <p className="text-sm text-muted-foreground">{t("meterReading.consumption")}</p>
                                <p className="font-bold text-cyan-700">{consumption.toFixed(1)} kL</p>
                            </div>
                        </div>
                    )}

                    {/* Bill Estimate */}
                    {billEstimate && (
                        <div className="border rounded-lg p-4 space-y-3">
                            <h4 className="font-medium text-sm text-muted-foreground">{t("meterReading.estimatedBill")}</h4>

                            {/* Slab Breakdown */}
                            <div className="space-y-1">
                                {billEstimate.slabBreakdown.map((slab, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{slab.slab} ({slab.units} kL × ₹{slab.rate})</span>
                                        <span>₹{slab.amount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <hr />

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t("bills.waterCharges")}</span>
                                <span>₹{billEstimate.energyCharge.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t("bills.fixedCharges")}</span>
                                <span>₹{billEstimate.fixedCharge.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Sewerage (15%)</span>
                                <span>₹{billEstimate.sewerageCharge.toFixed(2)}</span>
                            </div>

                            <hr />

                            <div className="flex justify-between font-bold text-lg">
                                <span>{t("common.total")}</span>
                                <span className="text-water">₹{billEstimate.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    {/* Photo Upload */}
                    <div className="space-y-2">
                        <Label>{t("meterReading.meterPhoto")}</Label>
                        <div className="mt-2">
                            {photoPreview ? (
                                <div className="relative">
                                    <img src={photoPreview} alt="Meter" className="w-full h-48 object-cover rounded-lg" />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                            setPhoto(null);
                                            setPhotoPreview(null);
                                        }}
                                        className="absolute top-2 right-2"
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        {t("common.remove")}
                                    </Button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                    <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        {t("meterReading.clickToUpload")}
                                    </p>
                                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                </label>
                            )}
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        variant="cta"
                        size="xl"
                        className="w-full"
                        disabled={loading || consumption <= 0}
                    >
                        {uploading ? (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                {photo ? "Uploading..." : "Submitting..."}
                            </div>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                {t("meterReading.submitReading")}
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
