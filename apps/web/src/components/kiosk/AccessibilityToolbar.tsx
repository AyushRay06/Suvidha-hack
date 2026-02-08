"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Settings2,
    ZoomIn,
    ZoomOut,
    Contrast,
    Eye,
    RotateCcw,
    X,
    Accessibility,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccessibility } from '@/lib/context/accessibility';

export function AccessibilityToolbar() {
    const { i18n } = useTranslation();
    const isHindi = i18n.language === 'hi';
    const [isOpen, setIsOpen] = useState(false);

    const {
        settings,
        increaseFontSize,
        decreaseFontSize,
        toggleHighContrast,
        setReducedMotion,
        resetSettings,
    } = useAccessibility();

    const fontSizeLabels = {
        normal: isHindi ? 'सामान्य' : 'Normal',
        large: isHindi ? 'बड़ा' : 'Large',
        'extra-large': isHindi ? 'बहुत बड़ा' : 'Extra Large',
    };

    return (
        <>
            {/* Accessibility Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 left-6 z-50 w-16 h-16 lg:w-20 lg:h-20 bg-cta text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-cta/90 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-cta focus:ring-offset-2"
                aria-label={isHindi ? 'पहुंच सेटिंग्स' : 'Accessibility Settings'}
                title={isHindi ? 'पहुंच सेटिंग्स' : 'Accessibility Settings'}
            >
                <Accessibility className="w-8 h-8 lg:w-10 lg:h-10" />
            </button>

            {/* Accessibility Panel */}
            {isOpen && (
                <div className="fixed bottom-28 left-6 z-50 w-96 lg:w-[500px] bg-white rounded-2xl shadow-2xl border-2 border-border overflow-hidden">
                    {/* Header */}
                    <div className="bg-cta text-white px-6 lg:px-8 py-4 lg:py-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Settings2 className="w-6 h-6 lg:w-7 lg:h-7" />
                            <h3 className={`font-bold ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-lg' : 'text-base'}`}>
                                {isHindi ? 'पहुंच सेटिंग्स' : 'Accessibility'}
                            </h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Settings */}
                    <div className="p-6 lg:p-8 space-y-6 lg:space-y-7">
                        {/* Font Size */}
                        <div className="space-y-3 lg:space-y-4">
                            <label className={`font-semibold text-slate-700 flex items-center gap-2 ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-lg' : 'text-base'}`}>
                                <Eye className="w-5 h-5 lg:w-6 lg:h-6" />
                                {isHindi ? 'फ़ॉन्ट आकार' : 'Font Size'}
                            </label>
                            <div className="flex items-center gap-3 lg:gap-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={decreaseFontSize}
                                    disabled={settings.fontSize === 'normal'}
                                    className="flex-1 kiosk-button text-sm lg:text-base py-3 lg:py-4"
                                >
                                    <ZoomOut className="w-5 h-5 lg:w-6 lg:h-6 lg:mr-2" />
                                    <span className="hidden lg:inline">{isHindi ? 'छोटा' : 'Smaller'}</span>
                                </Button>
                                <span className={`px-4 py-3 lg:py-4 bg-muted rounded-lg font-semibold min-w-[100px] lg:min-w-[120px] text-center ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-base' : 'text-sm'}`}>
                                    {fontSizeLabels[settings.fontSize]}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={increaseFontSize}
                                    disabled={settings.fontSize === 'extra-large'}
                                    className="flex-1 kiosk-button text-sm lg:text-base py-3 lg:py-4"
                                >
                                    <ZoomIn className="w-5 h-5 lg:w-6 lg:h-6 lg:mr-2" />
                                    <span className="hidden lg:inline">{isHindi ? 'बड़ा' : 'Larger'}</span>
                                </Button>
                            </div>
                        </div>

                        {/* High Contrast */}
                        <div className="space-y-3 lg:space-y-4">
                            <label className={`font-semibold text-slate-700 flex items-center gap-2 ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-lg' : 'text-base'}`}>
                                <Contrast className="w-5 h-5 lg:w-6 lg:h-6" />
                                {isHindi ? 'उच्च कंट्रास्ट' : 'High Contrast'}
                            </label>
                            <Button
                                variant={settings.contrastMode === 'high' ? 'default' : 'outline'}
                                size="sm"
                                onClick={toggleHighContrast}
                                className="w-full kiosk-button text-sm lg:text-base py-3 lg:py-4"
                            >
                                {settings.contrastMode === 'high' ? (
                                    isHindi ? '✓ सक्षम' : '✓ Enabled'
                                ) : (
                                    isHindi ? 'सक्षम करें' : 'Enable'
                                )}
                            </Button>
                        </div>

                        {/* Reduced Motion */}
                        <div className="space-y-3 lg:space-y-4">
                            <label className={`font-semibold text-slate-700 ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-lg' : 'text-base'}`}>
                                {isHindi ? 'कम एनिमेशन' : 'Reduce Motion'}
                            </label>
                            <Button
                                variant={settings.reducedMotion ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setReducedMotion(!settings.reducedMotion)}
                                className="w-full kiosk-button text-sm lg:text-base py-3 lg:py-4"
                            >
                                {settings.reducedMotion ? (
                                    isHindi ? '✓ सक्षम' : '✓ Enabled'
                                ) : (
                                    isHindi ? 'सक्षम करें' : 'Enable'
                                )}
                            </Button>
                        </div>

                        {/* Reset */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetSettings}
                            className={`w-full text-cta font-semibold hover:bg-cta/10 py-3 lg:py-4 ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-base' : 'text-sm'}`}
                        >
                            <RotateCcw className="w-5 h-5 lg:w-6 lg:h-6 lg:mr-2" />
                            <span className="hidden lg:inline">{isHindi ? 'रीसेट करें' : 'Reset to Default'}</span>
                        </Button>
                    </div>

                    {/* Footer */}
                    <div className={`bg-muted px-6 lg:px-8 py-3 lg:py-4 text-center border-t-2 border-border ${typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'text-sm' : 'text-xs'} font-medium text-muted-foreground`}>
                        {isHindi
                            ? 'सभी उपयोगकर्ताओं के लिए सुलभता'
                            : 'Accessibility for all users'}
                    </div>
                </div>
            )}
        </>
    );
}
