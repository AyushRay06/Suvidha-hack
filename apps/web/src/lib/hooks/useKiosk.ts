import { useEffect, useState } from 'react';

export interface KioskSettings {
  isKiosk: boolean;
  screenWidth: number;
  screenHeight: number;
  isTouchDevice: boolean;
  isLargeScreen: boolean; // 1920px+ width
}

export function useKiosk(): KioskSettings {
  const [settings, setSettings] = useState<KioskSettings>({
    isKiosk: false,
    screenWidth: 0,
    screenHeight: 0,
    isTouchDevice: false,
    isLargeScreen: false,
  });

  useEffect(() => {
    // Detect if running on kiosk or desktop
    const detectedIsKiosk = () => {
      // Check if screen resolution suggests a kiosk (1920x1080 or similar)
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Common kiosk resolutions: 1920x1080, 1024x768
      const kioskResolutions = [
        { w: 1920, h: 1080 },
        { w: 1024, h: 768 },
        { w: 1366, h: 768 },
      ];
      
      const isCommonKioskRes = kioskResolutions.some(
        (res) => width === res.w && height === res.h
      );

      // Check for touch device or explicit kiosk mode
      const hasTouch = () => {
        return (
          window.matchMedia('(pointer:coarse)').matches ||
          navigator.maxTouchPoints > 0 ||
          ('ontouchstart' in window)
        );
      };

      // Check URL parameter for kiosk mode
      const urlParams = new URLSearchParams(window.location.search);
      const explicitKioskMode = urlParams.get('kiosk') === 'true';

      return isCommonKioskRes || hasTouch() || explicitKioskMode;
    };

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setSettings({
        isKiosk: detectedIsKiosk(),
        screenWidth: width,
        screenHeight: height,
        isTouchDevice: window.matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0,
        isLargeScreen: width >= 1920,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return settings;
}
