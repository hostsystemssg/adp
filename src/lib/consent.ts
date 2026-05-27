import { COMPANY } from "./constants";

export interface CookieConsentPreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  savedAt: string;
}

export const CONSENT_PURPOSES = {
  registration: {
    id: "registration",
    title: "Account Registration & Wholesale Verification",
    description: `Collection of company UEN, registered office address, applicant full name, corporate email address, and direct telephone lines for the purpose of validating legitimate retail vendor status in Singapore, assessing volume tier structures, creating distributor dashboards, and organizing architectural logistics under Obligations 3 (Consent) and 4 (Purpose Limitation) of the PDPA 2012.`
  },
  marketing: {
    id: "marketing",
    title: "Wholesale Campaign Updates & New SKU Forecasts",
    description: `Periodic outbound bulletins, special pre-order campaigns, technical catalog launches, and volumetric tiered rebates. Option to opt-out or withdraw consent instantly via account panel.`
  },
  analytics: {
    id: "analytics",
    title: "B2B Vendor Usage Insights & Analytics",
    description: `Anonymized tracking of bulk-pricing simulator runs, spec sheet download metrics, and browser viewport efficiency to optimize wholesale service throughput and server allocations.`
  }
} as const;

export function getPDPAPurposeNotice(purpose: keyof typeof CONSENT_PURPOSES) {
  return CONSENT_PURPOSES[purpose].description;
}

export function validateSingaporeUEN(uen: string): boolean {
  // Simple validation for Singapore Business UEN format
  const clean = uen.trim().toUpperCase();
  if (clean.length !== 9 && clean.length !== 10) return false;
  
  // Format check (either 9 digits or 10 digits with letters)
  // E.g. Business (9 chars): 12345678A
  // Local Co (10 chars): 201826157C, 201812345G
  // Others (10 chars): T18LL1234A etc.
  const regex = /^[0-9]{8}[A-Z]$|^[21][0-9]{9}[A-Z]$|^[STF][0-9]{2}[A-Z]{2}[0-9]{4}[A-Z]$/;
  return regex.test(clean);
}
