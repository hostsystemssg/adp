import React from "react";
import { Link } from "react-router-dom";
import { Wind, Lightbulb, ShieldCheck, Award, ArrowRight, Lock } from "lucide-react";
import { COMPANY } from "../lib/constants";

export default function Home() {
  return (
    <div className="bg-[#000000] text-[#F3F4F6] min-h-screen Selection:bg-[#2DB39E] selection:text-black">
      
      {/* Gated Portal Top Anchor Notice */}
      <div className="bg-[#161617] border-b border-[#3A3A3A] text-center py-2 px-4">
        <p className="text-[11px] sm:text-xs font-mono text-[#9CA3AF]">
          🔒 Secure Gated Portal: Restricted to Registered Singapore Architectural & LED Retail Vendors.
        </p>
      </div>

      {/* Main Structural Hero */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-b from-[#0B0B0C] to-black border-b border-[#3A3A3A]/40">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2DB39E]/10 border border-[#2DB39E]/20 text-[#2DB39E] text-xs font-mono uppercase tracking-widest mx-auto animate-pulse">
              <Award className="w-3.5 h-3.5" /> Singapore Designed, Engineered, and Commissioned.
            </div>
            <p className="text-xs text-[#9CA3AF] tracking-widest uppercase font-semibold font-mono">
              Point One Technology Pte Ltd
            </p>
          </div>

          <h1 className="font-display font-medium text-4xl sm:text-6xl text-white tracking-tight leading-none max-w-4xl mx-auto">
            B2B <span className="text-[#2DB39E]">Retailer Portal</span>
          </h1>

          <p className="text-sm sm:text-base text-[#9CA3AF] max-w-2xl mx-auto leading-relaxed">
            Pristine architectural ceiling fans, energy-efficient DC motor technology, and designer LED Downlights. Unlock wholesale dealer catalog listings and stock allocations
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3 bg-[#2DB39E] text-black font-semibold text-sm rounded font-display hover:bg-[#2DB39E]/90 hover:scale-105 transition-all text-center flex items-center justify-center gap-2"
            >
              Apply for Retailer Account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3 border border-[#3A3A3A] hover:border-[#2DB39E] text-white hover:bg-[#161617] text-sm font-semibold rounded font-display transition-all text-center flex items-center justify-center gap-1.5"
            >
              <Lock className="w-4 h-4 text-[#9CA3AF]" />
              Authorized Distributor Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Compliance Notice Block (PDPA Singapore) */}
      <section className="bg-[#0B0B0C] border-y border-[#3A3A3A] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
          <div className="w-12 h-12 shrink-0 rounded-full bg-[#2DB39E]/10 border border-[#2DB39E]/30 flex items-center justify-center text-[#2DB39E]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-2 flex-grow">
            <h4 className="font-display font-semibold text-lg text-white">Full PDPA 2012 & AML Compliance Guarantee</h4>
            <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
              Point One Technology Pte. Ltd. strictly guards business representative details and personal contact channels. Distributor applications and payment logs are structured under the Singapore Personal Data Protection Act (PDPA) 2012. Financial audit records are maintained securely for 7 calendar years in direct compliance with primary IRAS corporate tax regulations.
            </p>
          </div>
          <div className="flex gap-2 flex-col w-full md:w-auto text-nowrap">
            <Link
              to="/privacy-policy"
              className="px-4 py-2 text-center text-xs font-semibold rounded bg-[#161617] border border-[#3A3A3A] hover:border-[#2DB39E] transition-all"
            >
              Review Privacy Standards
            </Link>
          </div>
        </div>
      </section>

      {/* Home Footing Legal notice */}
      <div className="border-t border-[#3A3A3A] py-6 text-center text-xs text-[#9CA3AF]">
        <p>{COMPANY.name} &middot; ACRA Registration UEN: {COMPANY.uen}</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link to="/privacy-policy" className="hover:text-[#2DB39E] underline">Privacy Policy</Link>
          <span>&middot;</span>
          <Link to="/terms" className="hover:text-[#2DB39E] underline">Terms of Use</Link>
          <span>&middot;</span>
          <Link to="/cookie-policy" className="hover:text-[#2DB39E] underline">Cookie Policy</Link>
          <span>&middot;</span>
          <Link to="/login" className="hover:text-[#2DB39E] underline">Administrator Portal</Link>
        </div>
      </div>

    </div>
  );
}
