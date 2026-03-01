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
    Volume2,
    VolumeX,
    Heart,
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
        toggleTTS,
        enableSeniorMode,
        resetSettings,
    } = useAccessibility();

    const fontSizeLabels: Record<string, string> = {
        normal: isHindi ? 'सामान्य' : 'Normal',
        large: isHindi ? 'बड़ा' : 'Large',
        'extra-large': isHindi ? 'बहुत बड़ा' : 'Extra Large',
        senior: isHindi ? 'बुजुर्ग' : 'Senior',
    };

    return (
        <>
            {/* Accessibility Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 left-6 z-50 w-16 h-16 lg:w-20 lg:h-20 bg-cta text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-cta/90 active:scale-95 transition-all focus:ring-4 focus:ring-cta focus:ring-offset-2"
                aria-label={isHindi ? 'पहुंच सेटिंग्स खोलें' : 'Open Accessibility Settings'}
                title={isHindi ? 'पहुंच सेटिंग्स' : 'Accessibility Settings'}
            >
                <Accessibility className="w-8 h-8 lg:w-10 lg:h-10" />
            </button>

            {/* Accessibility Panel */}
            {isOpen && (
                <div
                    className="fixed bottom-28 left-6 z-50 w-96 lg:w-[500px] bg-white rounded-2xl shadow-2xl border-2 border-border overflow-hidden"
                    role="dialog"
                    aria-label={isHindi ? 'पहुंच सेटिंग्स' : 'Accessibility Settings'}
                >
                    {/* Header */}
                    <div className="bg-cta text-white px-6 lg:px-8 py-4 lg:py-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Settings2 className="w-6 h-6 lg:w-7 lg:h-7" />
                            <h3 className="font-bold text-base lg:text-lg">
                                {isHindi ? 'पहुंच सेटिंग्स' : 'Accessibility'}
                            </h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                            aria-label={isHindi ? 'बंद करें' : 'Close settings'}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Settings */}
                    <div className="p-6 lg:p-8 space-y-5 lg:space-y-6">
                        {/* 🌟 Senior Mode — One-Tap Preset */}
                        <div className="space-y-3">
                            <Button
                                variant={settings.fontSize === 'senior' && settings.contrastMode === 'high' && settings.ttsEnabled ? 'default' : 'outline'}
                                size="sm"
                                onClick={enableSeniorMode}
                                className="w-full kiosk-button text-sm lg:text-base py-3 lg:py-4 bg-gradient-to-r from-rose-500 to-orange-500 text-white border-0 hover:from-rose-600 hover:to-orange-600"
                                aria-label={isHindi ? 'बुजुर्ग मोड सक्षम करें' : 'Enable Senior Citizen Mode'}
                            >
                                <Heart className="w-5 h-5 lg:w-6 lg:h-6 mr-2" />
                                {isHindi ? '👴 बुजुर्ग मोड' : '👴 Senior Mode'}
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                {isHindi
                                    ? 'बड़ा टेक्स्ट + उच्च कंट्रास्ट + बोलकर पढ़ें'
                                    : 'Large text + High contrast + Read aloud'}
                            </p>
                        </div>

                        <div className="border-t border-border" />

                        {/* Font Size */}
                        <div className="space-y-3">
                            <label className="font-semibold text-slate-700 flex items-center gap-2 text-base lg:text-lg">
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
                                    aria-label={isHindi ? 'फ़ॉन्ट छोटा करें' : 'Decrease font size'}
                                >
                                    <ZoomOut className="w-5 h-5 lg:w-6 lg:h-6 lg:mr-2" />
                                    <span className="hidden lg:inline">{isHindi ? 'छोटा' : 'Smaller'}</span>
                                </Button>
                                <span className="px-4 py-3 lg:py-4 bg-muted rounded-lg font-semibold min-w-[100px] lg:min-w-[120px] text-center text-sm lg:text-base" aria-live="polite">
                                    {fontSizeLabels[settings.fontSize]}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={increaseFontSize}
                                    disabled={settings.fontSize === 'senior'}
                                    className="flex-1 kiosk-button text-sm lg:text-base py-3 lg:py-4"
                                    aria-label={isHindi ? 'फ़ॉन्ट बड़ा करें' : 'Increase font size'}
                                >
                                    <ZoomIn className="w-5 h-5 lg:w-6 lg:h-6 lg:mr-2" />
                                    <span className="hidden lg:inline">{isHindi ? 'बड़ा' : 'Larger'}</span>
                                </Button>
                            </div>
                        </div>

                        {/* High Contrast */}
                        <div className="space-y-3">
                            <label className="font-semibold text-slate-700 flex items-center gap-2 text-base lg:text-lg">
                                <Contrast className="w-5 h-5 lg:w-6 lg:h-6" />
                                {isHindi ? 'उच्च कंट्रास्ट' : 'High Contrast'}
                            </label>
                            <Button
                                variant={settings.contrastMode === 'high' ? 'default' : 'outline'}
                                size="sm"
                                onClick={toggleHighContrast}
                                className="w-full kiosk-button text-sm lg:text-base py-3 lg:py-4"
                                aria-label={isHindi ? 'उच्च कंट्रास्ट टॉगल करें' : 'Toggle high contrast'}
                            >
                                {settings.contrastMode === 'high' ? (
                                    isHindi ? '✓ सक्षम' : '✓ Enabled'
                                ) : (
                                    isHindi ? 'सक्षम करें' : 'Enable'
                                )}
                            </Button>
                        </div>

                        {/* Text-to-Speech */}
                        <div className="space-y-3">
                            <label className="font-semibold text-slate-700 flex items-center gap-2 text-base lg:text-lg">
                                {settings.ttsEnabled ? (
                                    <Volume2 className="w-5 h-5 lg:w-6 lg:h-6" />
                                ) : (
                                    <VolumeX className="w-5 h-5 lg:w-6 lg:h-6" />
                                )}
                                {isHindi ? 'बोलकर पढ़ें' : 'Read Aloud (TTS)'}
                            </label>
                            <Button
                                variant={settings.ttsEnabled ? 'default' : 'outline'}
                                size="sm"
                                onClick={toggleTTS}
                                className="w-full kiosk-button text-sm lg:text-base py-3 lg:py-4"
                                aria-label={isHindi ? 'बोलकर पढ़ें टॉगल करें' : 'Toggle text-to-speech'}
                            >
                                {settings.ttsEnabled ? (
                                    isHindi ? '✓ सक्षम' : '✓ Enabled'
                                ) : (
                                    isHindi ? 'सक्षम करें' : 'Enable'
                                )}
                            </Button>
                        </div>

                        {/* Reduced Motion */}
                        <div className="space-y-3">
                            <label className="font-semibold text-slate-700 text-base lg:text-lg">
                                {isHindi ? 'कम एनिमेशन' : 'Reduce Motion'}
                            </label>
                            <Button
                                variant={settings.reducedMotion ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setReducedMotion(!settings.reducedMotion)}
                                className="w-full kiosk-button text-sm lg:text-base py-3 lg:py-4"
                                aria-label={isHindi ? 'एनिमेशन कम करें टॉगल' : 'Toggle reduced motion'}
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
                            className="w-full text-cta font-semibold hover:bg-cta/10 py-3 lg:py-4 text-sm lg:text-base"
                            aria-label={isHindi ? 'सेटिंग्स रीसेट करें' : 'Reset settings to default'}
                        >
                            <RotateCcw className="w-5 h-5 lg:w-6 lg:h-6 mr-2" />
                            {isHindi ? 'रीसेट करें' : 'Reset to Default'}
                        </Button>
                    </div>

                    {/* Footer */}
                    <div className="bg-muted px-6 lg:px-8 py-3 lg:py-4 text-center border-t-2 border-border text-xs lg:text-sm font-medium text-muted-foreground">
                        {isHindi
                            ? 'सभी उपयोगकर्ताओं के लिए सुलभता'
                            : 'Accessibility for all users'}
                    </div>
                </div>
            )}
        </>
    );
}
