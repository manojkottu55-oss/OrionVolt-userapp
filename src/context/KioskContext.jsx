import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * KioskContext — captures the ?kiosk=XXX query param on first load
 * and provides kioskId to any component in the tree.
 *
 * If the URL has no ?kiosk= param (normal web visit), kioskId stays null
 * and all kiosk-specific behaviour is silently skipped.
 *
 * kioskId is also persisted to sessionStorage so it survives React-Router
 * navigations within the same browser tab (not localStorage — clears on tab close).
 */
const KioskContext = createContext({ kioskId: null, clearKiosk: () => {} });

export function KioskProvider({ children }) {
  const [kioskId, setKioskId] = useState(() => {
    // 1. Check URL first (fresh scan)
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('kiosk');
    if (fromUrl) {
      sessionStorage.setItem('orionvolt_kiosk_id', fromUrl);
      return fromUrl;
    }
    // 2. Fall back to sessionStorage (navigated away but same tab)
    return sessionStorage.getItem('orionvolt_kiosk_id') || null;
  });

  // Keep sessionStorage in sync whenever kioskId changes
  useEffect(() => {
    if (kioskId) {
      sessionStorage.setItem('orionvolt_kiosk_id', kioskId);
    }
  }, [kioskId]);

  const clearKiosk = () => {
    sessionStorage.removeItem('orionvolt_kiosk_id');
    setKioskId(null);
  };

  return (
    <KioskContext.Provider value={{ kioskId, clearKiosk }}>
      {children}
    </KioskContext.Provider>
  );
}

export function useKiosk() {
  return useContext(KioskContext);
}
