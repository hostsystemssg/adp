import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, Settings, Check, X, Info } from "lucide-react";

export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  savedAt: string;
}

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  
  // Opt-in checkboxes, NOT pre-checked except necessary
  const [functionalConsent, setFunctionalConsent] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(false);

  useEffect(() => {
    // Read cookie_consent cookie or localStorage on mount
    const savedConsent = getCookie("cookie_consent");
    if (!savedConsent) {
      setShowBanner(true);
    } else {
      try {
        const parsed: CookiePreferences = JSON.parse(savedConsent);
        injectGoogleAnalytics(parsed.analytics);
      } catch (e) {
        setShowBanner(true);
      }
    }
  }, []);

  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(";").shift() || "");
    return null;
  };

  const setCookie = (name: string, value: string, days: number) => {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax; Secure`;
  };

  const savePreferences = (prefs: CookiePreferences) => {
    setCookie("cookie_consent", JSON.stringify(prefs), 365);
    localStorage.setItem("cookie_consent_store", JSON.stringify(prefs));
    setShowBanner(false);
    injectGoogleAnalytics(prefs.analytics);
  };

  const handleAcceptAll = () => {
    const prefs: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      savedAt: new Date().toISOString(),
    };
    savePreferences(prefs);
  };

  const handleSaveCustom = () => {
    const prefs: CookiePreferences = {
      necessary: true,
      functional: functionalConsent,
      analytics: analyticsConsent,
      savedAt: new Date().toISOString(),
    };
    savePreferences(prefs);
  };

  const handleDeclineOptional = () => {
    const prefs: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      savedAt: new Date().toISOString(),
    };
    savePreferences(prefs);
  };

  const injectGoogleAnalytics = (allowed: boolean) => {
    const SCRIPT_ID = "google-analytics-script";
    const existing = document.getElementById(SCRIPT_ID);

    if (allowed) {
      if (!existing) {
        console.log("PDPA Compliance: Analytics cookies approved. Injecting Google Analytics tracking scripts dynamically...");
        
        // Trigger simulation or actual injection
        const script1 = document.createElement("script");
        script1.id = SCRIPT_ID;
        script1.async = true;
        script1.src = "https://www.googletagmanager.com/gtag/js?id=G-POINTONE99";
        
        const script2 = document.createElement("script");
        script2.text = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-POINTONE99', { 'anonymize_ip': true });
        `;

        document.head.appendChild(script1);
        document.head.appendChild(script2);
      }
    } else {
      if (existing) {
        console.log("PDPA Compliance: Retracting analytics consent. Removing injected scripts...");
        existing.remove();
      }
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-[#0B0B0C] border-t border-[#3A3A3A] shadow-[0_-10px_25px_rgba(0,0,0,0.8)] transition-all duration-300">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        {/* Banner Copy */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 text-[#2DB39E] animate-pulse" />
            <h4 className="font-display font-medium text-base tracking-wide">Singapore PDPA Privacy Consent Gate</h4>
          </div>
          <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
            We use cookies as described in our{" "}
            <Link to="/cookie-policy" className="text-[#2DB39E] underline hover:text-[#2DB39E]/80">
              Cookie Policy
            </Link>{" "}
            to optimize wholesale checkout and store credentials securely. Strictly necessary cookies are active by default for security, session verification, and catalog persistence. Optional functional and analytics metrics require your explicit opt-in consent under Section 13 & 14 of the Singapore Personal Data Protection Act (PDPA) 2012.
          </p>
        </div>

        {/* Banner CTA Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white border border-[#3A3A3A] rounded hover:bg-[#161617] transition-all bg-transparent h-[44px]"
          >
            <Settings className="w-4 h-4 text-[#9CA3AF]" />
            Manage Preferences
          </button>
          
          <button
            onClick={handleDeclineOptional}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-[#E63946] border border-[#E63946]/30 hover:border-[#E63946]/70 rounded hover:bg-[#E63946]/5 transition-all h-[44px]"
          >
            Decline Optional
          </button>

          <button
            onClick={handleAcceptAll}
            className="px-5 py-2 text-xs sm:text-sm font-semibold bg-[#2DB39E] text-black rounded hover:bg-[#2DB39E]/90 transition-all font-display shadow-lg shadow-[#2DB39E]/10 h-[44px]"
          >
            Accept All Cookies
          </button>
        </div>
      </div>

      {/* Advanced Consent Checkboxes Expansion */}
      {showPreferences && (
        <div className="max-w-6xl mx-auto mt-6 pt-6 border-t border-[#3A3A3A] grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Strictly Necessary Description */}
          <div className="p-4 bg-[#161617] rounded border border-[#3A3A3A]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#2DB39E] tracking-wider uppercase font-mono">Tier 1: Necessary</span>
              <span className="text-[10px] px-2 py-0.5 bg-[#2DB39E]/10 text-[#2DB39E] border border-[#2DB39E]/20 rounded-full font-bold">Locked Checked</span>
            </div>
            <h5 className="font-display font-medium text-sm text-white mb-1">Session & Security Parameters</h5>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Required for basic gatekeeping. Manages secure logins (<span className="font-mono">__session</span>), multi-factor anti-forgery (<span className="font-mono">__csrf</span>), and live vendor shopping cart caches.
            </p>
          </div>

          {/* Functional Consent Toggle */}
          <div className="p-4 bg-[#161617] rounded border border-[#3A3A3A] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#9CA3AF] tracking-wider uppercase font-mono">Tier 2: Functional</span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={functionalConsent}
                    onChange={(e) => setFunctionalConsent(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#2A2A2B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2DB39E]"></div>
                </label>
              </div>
              <h5 className="font-display font-medium text-sm text-white mb-1">Distributor Personalization</h5>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                Retains preferred volume pricing tiers, catalog grid densities, and stores compliance confirmation logs for 1 year.
              </p>
            </div>
            <div className="text-[10px] text-[#9CA3AF] mt-2 font-mono flex items-center gap-1">
              <Info className="w-3 h-3 text-[#2DB39E]" /> Expires: 1 Year
            </div>
          </div>

          {/* Analytics Consent Toggle */}
          <div className="p-4 bg-[#161617] rounded border border-[#3A3A3A] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#9CA3AF] tracking-wider uppercase font-mono">Tier 3: Analytics</span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={analyticsConsent}
                    onChange={(e) => setAnalyticsConsent(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#2A2A2B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2DB39E]"></div>
                </label>
              </div>
              <h5 className="font-display font-medium text-sm text-white mb-1">Volumetric Analytics Tracking</h5>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                Permits loading google-analytics (<span className="font-mono">_ga</span>) signals to study distributor procurement funnels. Strictly tracking-anonymized.
              </p>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-[10px] text-[#9CA3AF] font-mono flex items-center gap-1">
                <Info className="w-3 h-3 text-[#2DB39E]" /> Expires: 2 Years
              </div>
              <button
                onClick={handleSaveCustom}
                className="px-3 py-1 bg-[#2DB39E]/20 text-[#2DB39E] hover:bg-[#2DB39E] hover:text-black font-semibold text-[11px] rounded transition-all font-display uppercase tracking-wider"
              >
                Save Preferences
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
