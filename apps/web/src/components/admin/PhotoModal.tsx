"use client";

import { X, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PhotoModalProps {
    photoUrl: string;
    onClose: () => void;
    title?: string;
}

export function PhotoModal({ photoUrl, onClose, title }: PhotoModalProps) {
    const [zoom, setZoom] = useState(1);

    const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            onClose();
        }
    };

    // Add keyboard listener
    if (typeof window !== "undefined") {
        window.addEventListener("keydown", handleKeyDown);
    }

    return (
        <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div className="relative max-w-6xl max-h-[90vh] w-full">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 z-10 flex items-center justify-between">
                    {title && <h3 className="text-white font-bold text-lg">{title}</h3>}
                    <div className="flex items-center gap-2 ml-auto">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleZoomOut}
                            className="text-white hover:bg-white/20"
                        >
                            <ZoomOut className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleZoomIn}
                            className="text-white hover:bg-white/20"
                        >
                            <ZoomIn className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-white hover:bg-white/20"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Image */}
                <div className="overflow-auto max-h-[90vh] flex items-center justify-center">
                    <img
                        src={photoUrl}
                        alt="Meter reading"
                        className="transition-transform duration-200"
                        style={{ transform: `scale(${zoom})` }}
                    />
                </div>
            </div>
        </div>
    );
}
