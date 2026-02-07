"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";

interface OutageReportFormProps {
    connectionId: string;
    onSuccess: () => void;
}

export function OutageReportForm({ connectionId, onSuccess }: OutageReportFormProps) {
    const { tokens } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [description, setDescription] = useState("");
    const [useCurrentLocation, setUseCurrentLocation] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        if (!description || description.length < 10) {
            setError("Please describe the issue in at least 10 characters");
            return;
        }

        setLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/grievances`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokens?.accessToken}`,
                },
                body: JSON.stringify({
                    category: "Power Outage",
                    subject: "Power Outage Reported via Quick Action",
                    description: `[OUTAGE REPORT] ${description} ${useCurrentLocation ? "(Location Pinned)" : ""}`,
                    serviceType: "ELECTRICITY",
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to submit outage report");
            }

            setSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 2000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-6 text-center text-amber-800">
                    <div className="flex justify-center mb-4">
                        <div className="bg-amber-100 p-3 rounded-full">
                            <CheckCircle2 className="h-8 w-8 text-amber-600" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Report Submitted</h3>
                    <p>Our technical team has been alerted.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-red-100 shadow-sm">
            <CardHeader className="bg-red-50/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    Report Power Outage
                </CardTitle>
                <CardDescription>
                    Quickly report a power cut in your area
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="description">Describe the Issue</Label>
                        <Textarea
                            id="description"
                            placeholder="e.g., No power in entire street since 10 AM"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            type="button"
                            variant={useCurrentLocation ? "default" : "outline"}
                            size="sm"
                            className={useCurrentLocation ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                            onClick={() => setUseCurrentLocation(!useCurrentLocation)}
                            disabled={loading}
                        >
                            <MapPin className="mr-2 h-4 w-4" />
                            {useCurrentLocation ? "Location Pinned" : "Pin My Location"}
                        </Button>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            "Report Outage"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
