"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Zap, Flame, Droplets, Building2,
    CheckCircle, AlertCircle, Camera, X, Loader2
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";

interface GrievanceFormProps {
    serviceType: 'ELECTRICITY' | 'GAS' | 'WATER' | 'MUNICIPAL';
    connectionId?: string;
    onSuccess?: () => void;
}

const SERVICE_CONFIG = {
    ELECTRICITY: {
        name: 'Electricity',
        icon: Zap,
        color: 'text-electricity',
        bg: 'bg-electricity-light',
    },
    GAS: {
        name: 'Gas',
        icon: Flame,
        color: 'text-gas',
        bg: 'bg-gas-light',
    },
    WATER: {
        name: 'Water',
        icon: Droplets,
        color: 'text-water',
        bg: 'bg-water-light',
    },
    MUNICIPAL: {
        name: 'Municipal',
        icon: Building2,
        color: 'text-municipal',
        bg: 'bg-municipal-light',
    },
};

const PRIORITIES = [
    { value: 'LOW', label: 'Low', color: 'text-slate-500' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-amber-500' },
    { value: 'HIGH', label: 'High', color: 'text-orange-500' },
    { value: 'URGENT', label: 'Urgent', color: 'text-red-500' },
];

export function GrievanceForm({ serviceType, connectionId, onSuccess }: GrievanceFormProps) {
    const router = useRouter();
    const { tokens } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const config = SERVICE_CONFIG[serviceType];
    const Icon = config.icon;

    const [categories, setCategories] = useState<string[]>([]);
    const [category, setCategory] = useState("");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("MEDIUM");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [ticketNo, setTicketNo] = useState("");
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Fetch categories for this service type
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                const response = await fetch(
                    `${apiUrl}/api/grievances/categories/${serviceType}`,
                    {
                        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
                    }
                );
                const data = await response.json();
                if (data.success) {
                    setCategories(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch categories:", err);
            }
        };
        fetchCategories();
    }, [serviceType, tokens]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
            setError("Please select a valid image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be less than 5MB");
            return;
        }

        setError("");
        setUploading(true);

        try {
            // Create preview
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);

            // Upload to Cloudinary
            const { uploadImageToCloudinary } = await import('@/lib/cloudinary');
            const cloudinaryUrl = await uploadImageToCloudinary(file);
            setImageUrl(cloudinaryUrl);
            setUploading(false);
        } catch (err: any) {
            setError(err.message || 'Failed to upload image');
            setImagePreview(null);
            setUploading(false);
        }
    };


    const removeImage = () => {
        setImageUrl(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!category || !subject || description.length < 20) {
            setError("Please fill in all required fields. Description must be at least 20 characters.");
            return;
        }

        setLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/grievances`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokens?.accessToken}`,
                },
                body: JSON.stringify({
                    serviceType,
                    connectionId,
                    category,
                    subject,
                    description,
                    priority,
                    photoUrl: imageUrl || undefined, // Include Cloudinary URL if image was uploaded
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Redirect to success page with ticket number
                router.push(`/grievances/success?ticket=${data.data.ticketNo}`);
            } else {
                throw new Error(data.error || 'Failed to submit grievance');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Card className="border-2 border-success/30 bg-success/5">
                <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="font-heading text-xl text-success mb-2">Grievance Submitted!</h3>
                    <p className="text-muted-foreground mb-4">
                        Your {config.name.toLowerCase()} grievance has been registered.
                    </p>
                    <div className="bg-white rounded-lg p-4 mb-4">
                        <p className="text-sm text-muted-foreground">Ticket Number</p>
                        <p className="text-lg font-bold text-primary">{ticketNo}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                        Track your grievance status using this ticket number.
                    </p>
                    <Button variant="cta" className="w-full" onClick={onSuccess}>
                        Back to Dashboard
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className={config.bg}>
                <CardTitle className={`flex items-center gap-2 ${config.color}`}>
                    <Icon className="w-5 h-5" />
                    {config.name} Grievance
                </CardTitle>
                <CardDescription>
                    Report an issue with your {config.name.toLowerCase()} service
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Category */}
                    <div className="space-y-2">
                        <Label>Category *</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select issue type" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                            id="subject"
                            placeholder="Brief description of the issue"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            maxLength={200}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description * (min 20 characters)</Label>
                        <Textarea
                            id="description"
                            placeholder="Provide detailed information about the issue..."
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={2000}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {description.length}/2000
                        </p>
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select value={priority} onValueChange={setPriority}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PRIORITIES.map((p) => (
                                    <SelectItem key={p.value} value={p.value}>
                                        <span className={p.color}>{p.label}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-2">
                        <Label>Attach Photo (Optional)</Label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {imagePreview ? (
                            <div className="relative rounded-lg overflow-hidden border-2">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-40 object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full border-2 border-dashed rounded-lg p-4 text-center text-muted-foreground hover:border-current hover:${config.bg}/20 transition-colors`}
                            >
                                <Camera className={`w-6 h-6 mx-auto mb-1 ${config.color}`} />
                                <p className="text-sm">Click to add photo</p>
                            </button>
                        )}
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
                        disabled={loading || uploading}
                    >
                        {loading ? "Submitting..." : "Submit Grievance"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
