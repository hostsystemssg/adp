import React from "react";
import { Scale, FileText, AlertTriangle, ShieldCheck, Landmark } from "lucide-react";
import { COMPANY } from "../../lib/constants";

export default function TermsOfUse() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 text-[#F3F4F6] space-y-8 animate-fadeIn select-text text-justify">
      
      {/* Document Header */}
      <div className="border-b border-[#2A2A2B] pb-6 space-y-2">
        <div className="flex items-center gap-2 text-[#2DB39E]">
          <Scale className="w-6 h-6" />
          <span className="text-xs font-mono uppercase tracking-wider">Policy Document</span>
        </div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
          Terms of Use & Wholesale Rules
        </h1>
        <p className="text-xs sm:text-sm text-[#9CA3AF] font-mono">
          Point One Technology Pte. Ltd. &middot; Registration No: {COMPANY.uen} &middot; Last Updated: 27 May 2026
        </p>
      </div>

      <p className="text-[#9CA3AF] text-sm leading-relaxed">
        Please read these Terms of Use ("Terms") carefully before activating your distributor account or submitting orders on this B2B Procurement Portal. Operating this portal constitutes your binding agreement to complying with these corporate wholesale covenants of <strong>{COMPANY.name}</strong> ("Company").
      </p>

      {/* Main Clauses */}
      <div className="space-y-6">

        {/* Clause 1 */}
        <section className="space-y-2">
          <h3 className="font-display font-semibold text-lg text-white font-mono">1. About These Terms & Agreement Scope</h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            These Terms govern all distributor applications, minimum order quantity (MOQ) bounds, pre-order campaigns, specification downloads, and invoices verified on this B2B core platform. These terms apply strictly to Singapore registered corporations holding valid Business Registration Profiles issued by ACRA. We do not provide consumer portal access under these terms.
          </p>
        </section>

        {/* Clause 2 */}
        <section className="space-y-2">
          <h3 className="font-display font-semibold text-lg text-white font-mono">2. Key Definitions</h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            Throughout this platform, the following definitions are applied: <br />
            <strong>"Approved Retailer"</strong> refers to a Singapore retail distributor whose corporate details and identity have been validated and approved by the Company's distributor panel. <br />
            <strong>"MOQ"</strong> refers to Minimum Order Quantity, which is the baseline inventory units required for bulk wholesale discount eligibility. <br />
            <strong>"Spec sheet"</strong> refers to structural PDF blueprints specifying wattages, lumens, RPM vectors, and motor safety indices.
          </p>
        </section>

        {/* Clause 3 */}
        <section className="space-y-2">
          <h3 className="font-display font-semibold text-lg text-white font-mono">3. Account Registration, Gated Screening & Security</h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            Prospective distributors must register a company profile containing a valid UEN and showroom physical coordinate listings. On registration, the portal defaults access to <strong>Standard Tier</strong> with status set to <strong>Pending</strong>. Standard accounts represent screen-level caches. Full wholesale access is gated until the administration team verifies your operations.
          </p>
        </section>

        {/* Clause 4 */}
        <section className="space-y-2">
          <h3 className="font-display font-semibold text-lg text-white font-mono">4. Permitted and Prohibited Conduct</h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            Distributors are granted a revocable, non-transferrable license to navigate custom pricing matrices and export specification catalog blueprints. Prohibited actions include: launching automatic scrapers to mirror our wholesale values, using credentials in concurrent multi-user environments, simulating client-side parameters to circumvent MOQs, and redistributing technical blueprints without explicit corporate written consent.
          </p>
        </section>

        {/* Clause 5 - Billing details */}
        <section className="space-y-3 p-5 bg-[#0B0B0C] border border-[#2A2A2B] rounded">
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="w-5 h-5 text-[#2DB39E]" />
            <h3 className="font-display font-semibold text-lg text-white">5. Product Catalogue & Offline Payment Covenant</h3>
          </div>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            This B2B portal is an order collection matrix and operates with **Offline-Led Payments**. No direct credit card or online payment gateway is integrated to lower vendor overhead costs. 
          </p>
          <div className="text-xs text-[#9CA3AF] space-y-2 leading-relaxed">
            <p className="border-l-2 border-[#2DB39E] pl-3">
              <strong>Order Cycle:</strong> (1) Distributor registers order and submits reference numbers. (2) Administration validates stock, applies volume tiered rebates, and issues a formal tax invoice via electronic mail. (3) Distributor processes offline inter-bank bank wires (FAST / GIRO) or corporate PayNow transfers. (4) Distributor uploads receipts to secure order profile on portal.
            </p>
            <p className="font-semibold text-white">
              Title Transfer Rule: Product ownership, structural warranty terms, liabilities, and title pass to active retailers strictly on confirmed clearance of full payment inside Point One bank accounts.
            </p>
          </div>
        </section>

        {/* Clause 6 */}
        <section className="space-y-2">
          <h3 className="font-display font-semibold text-lg text-white font-mono">6. Pre-Orders & Seasonal Campaign Markdowns</h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            Pre-order campaigns provide retail distributors compound seasonal markdowns (e.g., -15%) on items during fabrication runs. Under pre-order covenants, order lines are bound immediately to fixed fabrication schedules and cannot be modified or canceled once construction begins. Any pre-order discount is computed automatically inside our pricing simulators.
          </p>
        </section>

        {/* Clause 7 */}
        <section className="space-y-2">
          <h3 className="font-display font-semibold text-lg text-white font-mono">7. Intellectual Property & Schematic Rights</h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            All brand design variables, fan mold contours, 3D CAD schematics, OSRAM LED lighting calibration files, manual booklets, logos, and custom code modules remain the exclusive property of {COMPANY.name}.
          </p>
        </section>

        {/* Clause 8 - Disclaimers & Limitation of Liability */}
        <section className="space-y-3">
          <h3 className="font-display font-semibold text-lg text-white flex items-center gap-2 font-mono">
            <AlertTriangle className="w-4 h-4 text-[#E63946]" /> 8. Disclaimers & Limitations of Liability
          </h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            Distributors operate this wholesale portal on an "as-is" basis without warranties or representations. Point One Technology disclaims portal down-times, transmission network glitches, or momentary catalog data misalignments.
          </p>
          <div className="p-4 bg-[#E63946]/5 border border-[#E63946]/20 rounded text-xs leading-relaxed space-y-1">
            <p className="font-semibold text-white uppercase">Cryptographic Liability Cap Covenant:</p>
            <p className="text-[#9CA3AF]">
              To the maximum extent permitted by English law and Singapore statutes, the maximum aggregate cumulative financial liability of Point One Technology Pte. Ltd. for any procurement dispute (including warranty shortfalls, shipping delays, portal outage disruptions, or negligence) is contractually capped at the absolute lower of:
            </p>
            <p className="font-mono text-white text-center font-bold py-1 bg-[#161617] border border-[#2A2A2B] rounded my-2">
              (A) The exact total wholesale order values processed by the retailer in the prior 12 months, or (B) SGD $1,000.
            </p>
          </div>
        </section>

        {/* Clause 9 */}
        <section className="space-y-2">
          <h3 className="font-display font-semibold text-lg text-white font-mono">9. Force Majeure Clauses</h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            Neither party shall be held liable for failure or transmission delay resulting from Force Majeure scenarios, including regional grid blackouts, supply line blockages, steel-mill smelting restrictions, sea freight container delays, or sovereign regulatory freezes of Singapore logistical channels.
          </p>
        </section>

        {/* Clause 10 */}
        <section className="space-y-2">
          <h3 className="font-display font-semibold text-lg text-white font-mono">10. Severability & Entire Agreement</h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            If any clause in these Terms is declared invalid or void by a Singapore judicial court, that provision is severed to scale, and the rest of the covenants remain in absolute force. These Terms represent the final full agreement between both parties.
          </p>
        </section>

        {/* Clause 11 */}
        <section className="space-y-2">
          <h3 className="font-display font-semibold text-lg text-white font-mono">11. Governing Law & Dispute Resolution</h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            These Terms, catalogs, and logistics orders are governed strictly by the <strong>Statutes of Singapore</strong> under English law. Any dispute must first be arbitrated through peaceable discussion. Failing that, disputes shall be submitted to the exclusive jurisdiction of the <strong>Courts of the Republic of Singapore</strong>.
          </p>
        </section>

        {/* Clause 12 */}
        <section className="space-y-2">
          <h3 className="font-display font-semibold text-lg text-white font-mono">12. Compliance Notices</h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            Point One Technology will issue general notices to retailer operators directly through portal push feeds or email transmissions. All legal correspondences must be filed in physical forms to our corporate headquarters or transmitted directly to <a href={`mailto:${COMPANY.emails.legal}`} className="text-[#2DB39E] underline">{COMPANY.emails.legal}</a>.
          </p>
        </section>

      </div>

      {/* Registration Disclaimer Card */}
      <div className="p-4 bg-[#161617] rounded border border-[#2A2A2B] text-xs font-mono text-[#9CA3AF]">
        <p className="text-white font-semibold mb-1">Corporate Verification Notice:</p>
        <p>
          All submitted registration arrays undergo rigorous ACRA verification. Fraudulent applications, false UEN declarations, or mimicking designer showroom locations will be reported to appropriate enforcement units under Singapore cyber-security laws.
        </p>
      </div>

    </div>
  );
}
