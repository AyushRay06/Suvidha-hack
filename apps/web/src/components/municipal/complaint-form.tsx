"use client";

import { useState, useRef } from "react";
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
import { Building2, CheckCircle, AlertCircle, MapPin, Camera, X, Loader2, Image as ImageIcon } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";

interface ComplaintFormProps {
    initialCategory?: string;
    onSuccess?: () => void;
}

const CATEGORIES = [
    { value: 'STREETLIGHT', label: 'Streetlight Issue', icon: '💡' },
    { value: 'ROAD_REPAIR', label: 'Road Repair', icon: '🛣️' },
    { value: 'DRAINAGE', label: 'Drainage/Sewage', icon: '🌊' },
    { value: 'SANITATION', label: 'Sanitation', icon: '🧹' },
    { value: 'GARBAGE', label: 'Garbage Collection', icon: '🗑️' },
    { value: 'WATER_SUPPLY', label: 'Water Supply', icon: '💧' },
    { value: 'OTHER', label: 'Other', icon: '📋' },
];

const PRIORITIES = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
];

export function ComplaintForm({ initialCategory = '', onSuccess }: ComplaintFormProps) {
    const { tokens } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [category, setCategory] = useState(initialCategory);
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [priority, setPriority] = useState("MEDIUM");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [complaintNo, setComplaintNo] = useState("");
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
            setError("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be less than 5MB");
            return;
        }

        setError("");
        setUploading(true);

        try {
            // Create preview
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64 = event.target?.result as string;
                setImagePreview(base64);

                // Extract base64 data without mime prefix
                const base64Data = base64.split(',')[1];

                // Upload to server
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                const response = await fetch(`${apiUrl}/api/upload/image`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${tokens?.accessToken}`,
                    },
                    body: JSON.stringify({
                        filename: file.name,
                        contentType: file.type,
                        base64Data,
                    }),
                });

                const data = await response.json();
                if (data.success) {
                    setImageUrl(data.data.url);
                } else {
                    throw new Error(data.error || 'Upload failed');
                }
            };
            reader.readAsDataURL(file);
        } catch (err: any) {
            setError(err.message || 'Failed to upload image');
            setImagePreview(null);
        } finally {
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

        if (!category || !subject || !description || !location) {
            setError("Please fill in all required fields");
            return;
        }

        setLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/municipal/complaints`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokens?.accessToken}`,
                },
                body: JSON.stringify({
                    category,
                    subject,
                    description,
                    location,
                    priority,
                    imageUrl: imageUrl || undefined,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setComplaintNo(data.data.complaintNo);
            } else {
                throw new Error(data.error || 'Failed to submit complaint');
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
                    <h3 className="font-heading text-xl text-success mb-2">Complaint Registered!</h3>
                    <p className="text-muted-foreground mb-4">
                        Your complaint has been submitted successfully.
                    </p>
                    <div className="bg-white rounded-lg p-4 mb-4">
                        <p className="text-sm text-muted-foreground">Complaint Number</p>
                        <p className="text-lg font-bold text-primary">{complaintNo}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                        Track your complaint status using this number.
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
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-municipal" />
                    File Civic Complaint
                </CardTitle>
                <CardDescription>
                    Report issues related to municipal services
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Category */}
                    <div className="space-y-2">
                        <Label>Category *</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                        {cat.icon} {cat.label}
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
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            placeholder="Provide detailed information about the issue..."
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <Label htmlFor="location">Location *</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="location"
                                className="pl-10"
                                placeholder="Address or landmark"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>
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
                                        {p.label}
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
                            <div className="relative rounded-lg overflow-hidden border-2 border-municipal-light">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-48 object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                )}
                                {imageUrl && (
                                    <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                        ✓ Uploaded
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground hover:border-municipal hover:bg-municipal-light/20 transition-colors"
                            >
                                <Camera className="w-8 h-8 mx-auto mb-2 text-municipal" />
                                <p className="text-sm font-medium">Click to add photo</p>
                                <p className="text-xs mt-1">JPEG, PNG, GIF or WebP (max 5MB)</p>
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
                        {loading ? "Submitting..." : "Submit Complaint"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
