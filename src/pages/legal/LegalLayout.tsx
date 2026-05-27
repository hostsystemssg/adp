import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Compass, ShieldCheck, Scale, Cookie, ChevronRight, Landmark } from "lucide-react";
import { COMPANY } from "../../lib/constants";

export default function LegalLayout() {
  const location = useLocation();

  const activeClass = (path: string) => {
    return location.pathname === path
      ? "text-[#2DB39E] font-medium border-b-2 border-[#2DB39E] pb-3 -mb-3.5 transition-all text-sm font-display flex items-center gap-1.5"
      : "text-[#9CA3AF] hover:text-white pb-3 -mb-3.5 transition-all text-sm font-display flex items-center gap-1.5";
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-between selection:bg-[#2DB39E] selection:text-black">
      
      {/* Dark Obsidian Header */}
      <header className="bg-[#0B0B0C] border-b border-[#3A3A3A] sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand Title */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-sm bg-[#2DB39E] flex items-center justify-center text-black font-bold text-xs font-display">
              P1
            </div>
            <div className="leading-tight">
              <span className="text-sm font-semibold tracking-tight text-white uppercase font-display select-none block group-hover:text-[#2DB39E] transition-colors" style={{ fontFamily: "Arial, sans-serif" }}>
                Point One Technology
              </span>
              <span className="text-[10px] text-[#9CA3AF] uppercase tracking-widest font-mono block mt-0.5">
                B2B Wholesale Portal
              </span>
            </div>
          </Link>

          {/* Quick Core Portal Navigation link */}
          <Link
            to="/login"
            className="px-4 py-1.5 text-xs font-semibold rounded bg-[#2DB39E]/10 border border-[#2DB39E]/20 text-[#2DB39E] hover:bg-[#2DB39E] hover:text-black transition-all"
          >
            Enter Dealer Portal
          </Link>
        </div>

        {/* Legal Page Switcher Tabs */}
        <div className="bg-[#161617]/40 border-t border-[#3A3A3A]/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center gap-6 overflow-x-auto scrollbar-none">
            <Link to="/privacy-policy" className={activeClass("/privacy-policy")}>
              <ShieldCheck className="w-4 h-4" />
              Privacy Policy
            </Link>
            <Link to="/terms" className={activeClass("/terms")}>
              <Scale className="w-4 h-4" />
              Terms of Use
            </Link>
            <Link to="/cookie-policy" className={activeClass("/cookie-policy")}>
              <Cookie className="w-4 h-4" />
              Cookie Policy
            </Link>
          </div>
        </div>
      </header>

      {/* Embedded Document */}
      <main className="flex-grow py-6 sm:py-10 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Legal Footer with registered company parameters */}
      <footer className="bg-[#0B0B0C] border-t border-[#3A3A3A] pt-10 pb-20 text-[#9CA3AF] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Company address and nature */}
          <div className="space-y-3">
            <h5 className="text-white font-display font-semibold tracking-wider uppercase text-sm">
              Point One Technology
            </h5>
            <p className="leading-relaxed text-justify text-xs text-[#9CA3AF]">
              Singapore-incorporated distributor of luxury architectural ventilation, signature brushless DC (BLDC) motor technologies, and designer LED illumination fixtures. Serving pre-vetted retail entities across Singapore.
            </p>
            <div className="font-mono text-[10px] space-y-1 bg-black p-3 border border-[#3A3A3A] rounded">
              <p>UEN: {COMPANY.uen}</p>
              <p className="truncate">Address: {COMPANY.address}</p>
            </div>
          </div>

          {/* Quick Legal Links */}
          <div className="space-y-3">
            <h5 className="text-white font-display font-semibold tracking-wider uppercase text-sm">
              PDPA Regulatory Links
            </h5>
            <div className="space-y-2.5 font-mono text-xs flex flex-col text-[#9CA3AF]">
              <a
                href={COMPANY.pdpc}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#2DB39E] flex items-center gap-1 transition-colors"
              >
                Personal Data Protection Commission <ChevronRight className="w-3 h-3 text-[#2DB39E]" />
              </a>
              <Link to="/privacy-policy" className="hover:text-[#2DB39E] flex items-center gap-1 transition-colors">
                Point One Privacy Policy <ChevronRight className="w-3 h-3 text-[#2DB39E]" />
              </Link>
              <Link to="/terms" className="hover:text-[#2DB39E] flex items-center gap-1 transition-colors">
                Point One B2B Terms of Use <ChevronRight className="w-3 h-3 text-[#2DB39E]" />
              </Link>
              <Link to="/cookie-policy" className="hover:text-[#2DB39E] flex items-center gap-1 transition-colors">
                Point One Cookie Policy <ChevronRight className="w-3 h-3 text-[#2DB39E]" />
              </Link>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h5 className="text-white font-display font-semibold tracking-wider uppercase text-sm">
              B2B Contact Pipelines
            </h5>
            <div className="space-y-2 font-mono text-xs text-[#9CA3AF]">
              <p>Support Channels: <a href={`mailto:${COMPANY.emails.support}`} className="hover:text-[#2DB39E] underline transition-colors">{COMPANY.emails.support}</a></p>
              <p>Wholesale Orders: <a href={`mailto:${COMPANY.emails.orders}`} className="hover:text-[#2DB39E] underline transition-colors">{COMPANY.emails.orders}</a></p>
              <p>PDPA Protection Escalations: <a href={`mailto:${COMPANY.dpo.email}`} className="hover:text-[#2DB39E] underline transition-colors">{COMPANY.dpo.email}</a></p>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-[#3A3A3A]/50 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px]">
          <p>&copy; {new Date().getFullYear()} {COMPANY.name}. All rights reserved under local Singapore statutes.</p>
          <div className="flex gap-4">
            <a href={COMPANY.website} target="_blank" rel="noopener noreferrer" className="hover:text-[#2DB39E]">
              Corporate Web
            </a>
            <span className="text-[#3A3A3A]">|</span>
            <span>Version B2B-2.0.1</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
