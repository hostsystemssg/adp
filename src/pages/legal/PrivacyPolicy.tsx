import React from "react";
import { Link } from "react-router-dom";
import { Shield, Clock, FileText, Database, Share2, Mail, HelpCircle } from "lucide-react";
import { COMPANY } from "../../lib/constants";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 text-[#F3F4F6] space-y-8 animate-fadeIn select-text text-justify">
      
      {/* Document Header */}
      <div className="border-b border-[#2A2A2B] pb-6 space-y-2">
        <div className="flex items-center gap-2 text-[#2DB39E]">
          <Shield className="w-6 h-6" />
          <span className="text-xs font-mono uppercase tracking-wider">Legal Document</span>
        </div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
          Privacy Policy (Singapore PDPA Compliant)
        </h1>
        <p className="text-xs sm:text-sm text-[#9CA3AF] font-mono">
          Point One Technology Pte. Ltd. &middot; Registration No: {COMPANY.uen} &middot; Last Updated: 27 May 2026
        </p>
      </div>

      <p className="text-[#9CA3AF] text-sm leading-relaxed">
        This Privacy Policy defines the personal data handling protocols of <strong>{COMPANY.name}</strong> ("we," "us," or "our") during B2B wholesale engagements through this Procurement Portal. This policy represents our commitment to protecting corporate vendor identity parameters and representatives' private accounts according to the <strong>Singapore Personal Data Protection Act 2012 (No. 26 of 2012) ("PDPA")</strong> and the <strong>Personal Data Protection Regulations 2021</strong>.
      </p>

      {/* The 10 Named PDPA Obligations Sections */}
      <div className="space-y-6">
        
        {/* Obligation 1 */}
        <section className="space-y-3 p-5 bg-[#0B0B0C] border border-[#2A2A2B] rounded">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-[#2DB39E]/10 border border-[#2DB39E]/20 text-[#2DB39E] px-2.5 py-0.5 rounded-full font-mono">Obligation 1</span>
            <h3 className="font-display font-semibold text-lg text-white">Accountability Obligation</h3>
          </div>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            We have designated a dedicated Personal Data Protection Officer (DPO) responsible for ensuring our systems and team comply with PDPA parameters. We implement security-first audits, robust encryption blocks, continuous employee training, and system validation before deploying wholesale updates.
          </p>
          <div className="text-xs bg-[#161617] border border-[#2A2A2B] p-3 rounded font-mono space-y-1">
            <p className="text-white">DPO Officer: {COMPANY.dpo.name}</p>
            <p>Office Direct: {COMPANY.dpo.phone}</p>
            <p>Inquiries: <a href={`mailto:${COMPANY.dpo.email}`} className="text-[#2DB39E] underline">{COMPANY.dpo.email}</a></p>
          </div>
        </section>

        {/* Obligation 2 */}
        <section className="space-y-3">
          <h3 className="font-display font-semibold text-xl text-white flex items-center gap-2">
            <span className="text-xs bg-[#3A3A3A] text-white px-2 py-0.5 rounded-full font-mono">2</span>
            Notification Obligation
          </h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            We notify current and prospective retailer representatives before or on the collection of personal details. Our multi-step distributor registration forms disclose detailed purpose scopes in plain, simplified language before submitting registration lines to our approval desk.
          </p>
        </section>

        {/* Obligation 3 */}
        <section className="space-y-3">
          <h3 className="font-display font-semibold text-xl text-white flex items-center gap-2">
            <span className="text-xs bg-[#3A3A3A] text-white px-2 py-0.5 rounded-full font-mono">3</span>
            Consent Obligation
          </h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            We operate strictly under an explicit, opt-in consent framework. Form submission is blocked until you manually toggle our consent checkbox. We never pre-check or pre-populate data-sharing agreements. You maintain an absolute right to withdraw consent for third-party scripts or marketing newsletters anytime via your retail settings dashboard.
          </p>
        </section>

        {/* Obligation 4 */}
        <section className="space-y-3">
          <h3 className="font-display font-semibold text-xl text-white flex items-center gap-2">
            <span className="text-xs bg-[#3A3A3A] text-white px-2 py-0.5 rounded-full font-mono">4</span>
            Purpose Limitation Obligation
          </h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            Personal data is strictly collected for reasonable corporate distributor validation and logistical fulfillment: compiling UEN parameters to prevent fraudulent dealer claims, assessing wholesale transaction volume tiers, facilitating wire-transfer payment confirmations, and scheduling fan specification briefings inside Singapore showrooms. We never lease or sell our B2B lists to consumer marketing agencies.
          </p>
        </section>

        {/* Obligation 5 */}
        <section className="space-y-3">
          <h3 className="font-display font-semibold text-xl text-white flex items-center gap-2">
            <span className="text-xs bg-[#3A3A3A] text-white px-2 py-0.5 rounded-full font-mono">5</span>
            Accuracy Obligation
          </h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            We strive to preserve accurate business representative details. Approved distributors can verify and modify operational records, contact coordinates, and showroom physical directions at any stage directly in real-time through the "My Data" portal interface.
          </p>
        </section>

        {/* Obligation 6 */}
        <section className="space-y-3">
          <h3 className="font-display font-semibold text-xl text-white flex items-center gap-2">
            <span className="text-xs bg-[#3A3A3A] text-white px-2 py-0.5 rounded-full font-mono">6</span>
            Protection Obligation
          </h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            All portal traffic is protected using Industry standard TLS 1.3 socket layering and isolated REST servers. User credentials are systematically hashed via cryptographic <strong>bcryptjs</strong> libraries utilizing cost factor 12. Sessions are secured with signed JSON Web Tokens using cryptographic Web Crypto standards with expiration boundaries set to 24 hours.
          </p>
        </section>

        {/* Obligation 7 - Retention & Table */}
        <section className="space-y-3">
          <h3 className="font-display font-semibold text-xl text-white flex items-center gap-2">
            <span className="text-xs bg-[#3A3A3A] text-white px-2 py-0.5 rounded-full font-mono">7</span>
            Retention Limitation Obligation
          </h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            We store data only for as long as it has functional utility or legal obligations. We continuously run system audits to prune records the moment corporate relationships collapse or fail to register activity for two years.
          </p>
          
          {/* Data Retention Schedule Table */}
          <div className="overflow-x-auto bg-[#0B0B0C] border border-[#2A2A2B] rounded">
            <table className="w-full text-[#F3F4F6] text-xs sm:text-sm font-sans divide-y divide-[#2A2A2B]">
              <thead className="bg-[#161617]">
                <tr>
                  <th className="px-4 py-3 text-left font-display font-semibold tracking-wider text-white">Data Category</th>
                  <th className="px-4 py-3 text-left font-display font-semibold tracking-wider text-white">Retention Duration</th>
                  <th className="px-4 py-3 text-left font-display font-semibold tracking-wider text-white">Legal / Audit Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2B] font-mono text-[11px] sm:text-xs">
                <tr>
                  <td className="px-4 py-3 font-semibold text-white">Active Retailer Account Data</td>
                  <td className="px-4 py-3 text-[#2DB39E]">Active Status + 2 Years</td>
                  <td className="px-4 py-3 text-[#9CA3AF]">Account activation and wholesale relationship management.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-white">Order & Financial Records</td>
                  <td className="px-4 py-3 text-[#2DB39E]">7 Calendar Years</td>
                  <td className="px-4 py-3 text-[#9CA3AF]">Mandated by the Inland Revenue Authority of Singapore (IRAS) for fiscal auditing.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-white">Dormant Account Records</td>
                  <td className="px-4 py-3 text-[#2DB39E]">Immediate Anonymisation within 30 days</td>
                  <td className="px-4 py-3 text-[#9CA3AF]">Automated DB scrub sequence replaces PII parameters with redacted parameters.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-white">Email & Correspondence Logs</td>
                  <td className="px-4 py-3 text-[#2DB39E]">3 Calendar Years</td>
                  <td className="px-4 py-3 text-[#9CA3AF]">Administrative query dispute and logistical confirmation limits.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-white">PDPA Consent Records</td>
                  <td className="px-4 py-3 text-[#2DB39E]">Indefinite Retention</td>
                  <td className="px-4 py-3 text-[#9CA3AF]">Proves historic and active permission indicators relative to PDPC audit mandates.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Obligation 8 */}
        <section className="space-y-3">
          <h3 className="font-display font-semibold text-xl text-white flex items-center gap-2">
            <span className="text-xs bg-[#3A3A3A] text-white px-2 py-0.5 rounded-full font-mono">8</span>
            Transfer Limitation Obligation
          </h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            Under PDPA Clause 9, we never transfer personal data to overseas servers unless that territory guarantees data security protocols equivalent to the PDPA 2012 framework. Our cloud server clusters reside under SOC-2 audited environments.
          </p>
          <div className="p-4 bg-[#161617] rounded border border-[#2A2A2B] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="font-mono text-white block mb-1">Vercel Platform (Hosting)</span>
              <p className="text-[#9CA3AF]">Global Anycast distribution with SOC-2 Type II standards, ISO 27001 compliance and rigorous Data Protection Agreements (DPA).</p>
            </div>
            <div>
              <span className="font-mono text-white block mb-1">Neon (Serverless DB)</span>
              <p className="text-[#9CA3AF]">GDPR and PDPA compliant encrypted block storage. ISO/IEC 27001:2013 audited network layers and strict secure tenant isolation.</p>
            </div>
            <div>
              <span className="font-mono text-white block mb-1">Email Delivery Systems</span>
              <p className="text-[#9CA3AF]">Dedicated transactional mailing systems, enforcing strict DKIM, SPF and TLS transfer protocols under secure corporate DPAs.</p>
            </div>
          </div>
        </section>

        {/* Obligation 9 */}
        <section className="space-y-3">
          <h3 className="font-display font-semibold text-xl text-white flex items-center gap-2">
            <span className="text-xs bg-[#3A3A3A] text-white px-2 py-0.5 rounded-full font-mono">9</span>
            Access & Correction Obligation
          </h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            Registered distributors hold absolute rights to query why their personal profiles exist in our system and ask for swift correction. Use our interactive portal "My Data" module to compile entire JSON exports of your database attributes instantly, and file validation errors directly with our DPO at {COMPANY.dpo.email}.
          </p>
        </section>

        {/* Obligation 10 */}
        <section className="space-y-3">
          <h3 className="font-display font-semibold text-xl text-white flex items-center gap-2">
            <span className="text-xs bg-[#3A3A3A] text-white px-2 py-0.5 rounded-full font-mono">10</span>
            Data Breach Notification Obligation
          </h3>
          <p className="text-sm text-[#9CA3AF] leading-relaxed">
            In compliance with Part 6A of the PDPA 2012, we implement automated intrusion alarms on our Vercel architecture. If a security compromise occurs, we will immediately launch investigation scripts. If the breach poses significant harm to registered distributors (or exceeds 500 affected persons), our DPO will notify the <strong>Personal Data Protection Commission (PDPC)</strong> within <strong>3 calendar days</strong>, and alert downstream distributors immediately.
          </p>
        </section>

      </div>

      {/* Inquiry Block */}
      <div className="p-6 bg-[#0B0B0C] rounded border border-[#2A2A2B] text-center space-y-3">
        <HelpCircle className="w-8 h-8 text-[#2DB39E] mx-auto" />
        <h3 className="font-display font-medium text-lg text-white">Questions or Escalations?</h3>
        <p className="text-xs text-[#9CA3AF] max-w-lg mx-auto">
          For any clarifications regarding data access rights, GDPR matching parameters, or to invoke audit files, address our DPO directly at:
        </p>
        <p className="font-mono text-[#2DB39E] text-xs">
          {COMPANY.name} &middot; Attn: Data Protection Officer &middot; {COMPANY.address} &middot; {COMPANY.dpo.email}
        </p>
      </div>

    </div>
  );
}
