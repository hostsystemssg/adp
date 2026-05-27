import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ConsentCheckbox({ checked, onChange }: ConsentCheckboxProps) {
  return (
    <div className="p-4 bg-[#161617]/50 rounded-lg border border-[#3A3A3A] space-y-3">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="pdpa-consent-checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 w-4.5 h-4.5 rounded border-[#3A3A3A] bg-[#2E2E2E] text-[#2DB39E] focus:ring-[#2DB39E] focus:ring-opacity-25 transition-all cursor-pointer"
        />
        <label
          htmlFor="pdpa-consent-checkbox"
          className="text-xs sm:text-xs text-[#9CA3AF] leading-relaxed cursor-pointer select-none"
        >
          I have read, understood, and agree to the{" "}
          <Link to="/privacy-policy" className="text-[#2DB39E] underline hover:text-[#2DB39E]/85">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link to="/terms-of-use" className="text-[#2DB39E] underline hover:text-[#2DB39E]/85">
            Terms of Use
          </Link>
          . I explicitly consent to Point One Technology Pte. Ltd. collecting, processing, and storing my corporate entity details, personal identification numbers, contact numbers, and showroom locations for B2B procurement, catalog distribution, volume tier rebates, interest scoring, and logistic operations described under Singapore's PDPA 2012.
        </label>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-[#2DB39E]/5 border border-[#2DB39E]/10 rounded text-[11px] text-[#2DB39E] font-mono leading-none">
        <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Strictly opt-in. This checkbox must be checked manually. No pre-ticked values.</span>
      </div>
    </div>
  );
}
