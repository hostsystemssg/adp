import React from "react";
import { Link } from "react-router-dom";
import { Cookie, Settings, Eye, HelpCircle, ExternalLink } from "lucide-react";
import { COMPANY } from "../../lib/constants";

export default function CookiePolicy() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 text-[#F3F4F6] space-y-8 animate-fadeIn select-text text-justify">
      
      {/* Document Header */}
      <div className="border-b border-[#2A2A2B] pb-6 space-y-2">
        <div className="flex items-center gap-2 text-[#2DB39E]">
          <Cookie className="w-6 h-6 animate-spin-slow" />
          <span className="text-xs font-mono uppercase tracking-wider">Policy Document</span>
        </div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
          Cookie Policy (PDPA Compliant)
        </h1>
        <p className="text-xs sm:text-sm text-[#9CA3AF] font-mono">
          Point One Technology Pte. Ltd. &middot; Registration No: {COMPANY.uen} &middot; Last Updated: 27 May 2026
        </p>
      </div>

      <p className="text-[#9CA3AF] text-sm leading-relaxed">
        This Cookie Policy clarifies how <strong>{COMPANY.name}</strong> incorporates HTTP cookies, trackers, and storage tokens on this gated wholesale portal. We employ these parameters strictly to provide secure sessions, preserve custom cart formulations, and calculate tiered analytics.
      </p>

      {/* Singapore Statutes Context */}
      <section className="p-4 bg-[#0B0B0C] border border-[#2A2A2B] rounded space-y-2">
        <h4 className="font-display font-medium text-white text-base">Singapore Legal Context</h4>
        <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
          Unlike the European Union territory, Singapore does not recognize an active <em>ePrivacy Directive / GDPR Cookie Banner</em> equivalent. Data collection coordinates captured via cookies are governed entirely by the **Singapore Personal Data Protection Act 2012 (PDPA)**. Because tracking IDs constitute personal properties if combined with corporate email metrics, we require your absolute opt-in before injecting optional analytics cookies.
        </p>
      </section>

      {/* Three Cookie Categories documented in tables */}
      <div className="space-y-6">
        
        {/* Necessary Cookies Table */}
        <div className="space-y-2">
          <h3 className="font-display font-semibold text-lg text-white flex items-center gap-2">
            <span className="text-[#2DB39E] font-mono">[1]</span>
            Strictly Necessary Cookie Matrix (Always Active)
          </h3>
          <p className="text-xs text-[#9CA3AF]">
            These cookies are vital for running authentication cycles, securing database routes, and preventing CSRF cross-site breaches. Disabling these disables core portal mechanics.
          </p>
          <div className="overflow-x-auto border border-[#2A2A2B] rounded bg-[#0B0B0C]">
            <table className="w-full text-[#F3F4F6] text-xs font-sans divide-y divide-[#2A2A2B]">
              <thead className="bg-[#161617]">
                <tr>
                  <th className="px-4 py-2.5 text-left text-white font-mono uppercase tracking-wider text-[11px]">Cookie Name</th>
                  <th className="px-4 py-2.5 text-left text-white font-mono uppercase tracking-wider text-[11px]">Duration</th>
                  <th className="px-4 py-2.5 text-left text-white font-mono uppercase tracking-wider text-[11px]">Corporate Use Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2B] font-mono text-[11px]">
                <tr>
                  <td className="px-4 py-2.5 text-[#2DB39E] font-semibold">token</td>
                  <td className="px-4 py-2.5">24 Hours</td>
                  <td className="px-4 py-2.5 text-[#9CA3AF]">Contains signed JWT session credentials protecting database requests.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-[#2DB39E] font-semibold">__csrf</td>
                  <td className="px-4 py-2.5">Session</td>
                  <td className="px-4 py-2.5 text-[#9CA3AF]">Implements anti-forgery tokens preventing malicious browser requests.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-[#2DB39E] font-semibold">cart_id</td>
                  <td className="px-4 py-2.5 font-sans">30 Days</td>
                  <td className="px-4 py-2.5 text-[#9CA3AF]">Preserves selected ceiling fans and downlights in your active B2B cart.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Functional Cookies Table */}
        <div className="space-y-2">
          <h3 className="font-display font-semibold text-lg text-white flex items-center gap-2">
            <span className="text-[#2DB39E] font-mono">[2]</span>
            Functional Cookies (Opt-In Category)
          </h3>
          <p className="text-xs text-[#9CA3AF]">
            These cookies preserve visual customization grids and active consent decisions across visits.
          </p>
          <div className="overflow-x-auto border border-[#2A2A2B] rounded bg-[#0B0B0C]">
            <table className="w-full text-[#F3F4F6] text-xs font-sans divide-y divide-[#2A2A2B]">
              <thead className="bg-[#161617]">
                <tr>
                  <th className="px-4 py-2.5 text-left text-white font-mono uppercase tracking-wider text-[11px]">Cookie Name</th>
                  <th className="px-4 py-2.5 text-left text-white font-mono uppercase tracking-wider text-[11px]">Duration</th>
                  <th className="px-4 py-2.5 text-left text-white font-mono uppercase tracking-wider text-[11px]">Corporate Use Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2B] font-mono text-[11px]">
                <tr>
                  <td className="px-4 py-2.5 text-[#2DB39E] font-semibold">user_prefs</td>
                  <td className="px-4 py-2.5">1 Year</td>
                  <td className="px-4 py-2.5 text-[#9CA3AF]">Remembers default filter selection (Ceiling Fans vs Downlights) and panel density.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-[#2DB39E] font-semibold">cookie_consent</td>
                  <td className="px-4 py-2.5">1 Year</td>
                  <td className="px-4 py-2.5 text-[#9CA3AF]">Saves your selected cookie preference configuration under PDPA regulations.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics Cookies Table */}
        <div className="space-y-2">
          <h3 className="font-display font-semibold text-lg text-white flex items-center gap-2">
            <span className="text-[#2DB39E] font-mono">[3]</span>
            Volumetric Analytics Cookies (Opt-In Category)
          </h3>
          <p className="text-xs text-[#9CA3AF]">
            These cookies collect anonymous performance benchmarks such as simulator calculation latency.
          </p>
          <div className="overflow-x-auto border border-[#2A2A2B] rounded bg-[#0B0B0C]">
            <table className="w-full text-[#F3F4F6] text-xs font-sans divide-y divide-[#2A2A2B]">
              <thead className="bg-[#161617]">
                <tr>
                  <th className="px-4 py-2.5 text-left text-white font-mono uppercase tracking-wider text-[11px]">Cookie Name</th>
                  <th className="px-4 py-2.5 text-left text-white font-mono uppercase tracking-wider text-[11px]">Duration</th>
                  <th className="px-4 py-2.5 text-left text-white font-mono uppercase tracking-wider text-[11px]">Corporate Use Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2B] font-mono text-[11px]">
                <tr>
                  <td className="px-4 py-2.5 text-[#2DB39E] font-semibold">_ga</td>
                  <td className="px-4 py-2.5">2 Years</td>
                  <td className="px-4 py-2.5 text-[#9CA3AF]">Saves a randomized string to separate human vectors and calculate bounce counts.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-[#2DB39E] font-semibold">_ga_G-POINTONE99</td>
                  <td className="px-4 py-2.5">2 Years</td>
                  <td className="px-4 py-2.5 text-[#9CA3AF]">Maintains session state variables for targeted Google Analytics traffic pipelines.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Third Party Disclosures Section */}
      <section className="space-y-3">
        <h3 className="font-display font-semibold text-xl text-white">Third-Party Cookie Disclosures</h3>
        <p className="text-sm text-[#9CA3AF] leading-relaxed">
          We operate server arrays through Vercel. Standard security features automatically mount cookies during transit to identify DDOS waves, secure isolated server endpoints and block bots.
        </p>
        <div className="p-4 bg-[#161617] border border-[#2A2A2B] rounded text-xs space-y-2">
          <div className="flex justify-between items-center text-[#2DB39E]">
            <span className="font-semibold">Vercel Inc. (Infrastructure Provider)</span>
            <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
              Vercel Privacy Policy <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex justify-between items-center text-[#2DB39E]">
            <span className="font-semibold">Google LLC (Analytics Engine)</span>
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
              Google Privacy Policy <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </section>

      {/* How to manage cookies on various browsers */}
      <section className="space-y-3">
        <h3 className="font-display font-semibold text-xl text-white">Browser-Level Management & Withdrawal</h3>
        <p className="text-sm text-[#9CA3AF] leading-relaxed">
          You can completely disable cookie storage or clear saved tokens in your browser's security panel at any time. For guidance, choose your active deployment below:
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-justify font-mono text-[#9CA3AF]">
          <div className="p-3 bg-[#161617] rounded border border-[#2A2A2B]">
            <span className="text-white font-bold block mb-1">Google Chrome</span>
            Settings &rarr; Privacy and security &rarr; Cookies and other site data
          </div>
          <div className="p-3 bg-[#161617] rounded border border-[#2A2A2B]">
            <span className="text-white font-bold block mb-1">Mozilla Firefox</span>
            Options &rarr; Privacy &amp; Security &rarr; Cookies and Site Data
          </div>
          <div className="p-3 bg-[#161617] rounded border border-[#2A2A2B]">
            <span className="text-white font-bold block mb-1">Apple Safari</span>
            Preferences &rarr; Privacy &rarr; Prevent cross-site tracking / Block cookies
          </div>
          <div className="p-3 bg-[#161617] rounded border border-[#2A2A2B]">
            <span className="text-white font-bold block mb-1">Safari iOS</span>
            Settings &rarr; Safari &rarr; Block All Cookies
          </div>
          <div className="p-3 bg-[#161617] rounded border border-[#2A2A2B]">
            <span className="text-white font-bold block mb-1">Chrome Android</span>
            Settings &rarr; Site Settings &rarr; Cookies &rarr; Blocked
          </div>
          <div className="p-3 bg-[#161617] rounded border border-[#2A2A2B]">
            <span className="text-white font-bold block mb-1">Microsoft Edge</span>
            Settings &rarr; Cookies and site permissions &rarr; Manage and delete
          </div>
        </div>

        {/* Google Analytics Opt-Out Link */}
        <div className="mt-4 p-4 bg-[#2DB39E]/5 border border-[#2DB39E]/20 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-xs text-[#2DB39E] font-bold block font-mono">Google Analytics Opt-Out Add-on</span>
            <p className="text-xs text-[#9CA3AF]">Prevent your viewport data from being tracked across all sites via Google's official browser extension.</p>
          </div>
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#2DB39E]/20 text-[#2DB39E] hover:bg-[#2DB39E] hover:text-black hover:scale-105 font-bold transition-all text-xs rounded uppercase tracking-wide font-display"
          >
            Download Extension
          </a>
        </div>
      </section>

    </div>
  );
}
