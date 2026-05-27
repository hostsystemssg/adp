import React, { useState, useEffect } from "react";
import { ChevronDown, HelpCircle, Award } from "lucide-react";

interface FAQItem {
  id: string;
  q: string;
  a: string;
}

export default function FAQ() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/faq")
      .then(res => res.json())
      .then(resObj => {
        if (resObj.success) {
          setFaqs(resObj.data);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn text-[#F3F4F6]">
      
      {/* Header Panel */}
      <div className="border-b border-[#3A3A3A] pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#2DB39E] uppercase tracking-wider font-mono">Resource & Knowledge Base</span>
          <h1 className="font-display font-medium text-2xl sm:text-3xl text-white mt-1">B2B Core FAQ Desk</h1>
          <p className="text-xs sm:text-sm text-[#9CA3AF] font-sans mt-1">
            Official operational guidelines and compliance parameters for Singapore distributors.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2DB39E]/10 border border-[#2DB39E]/20 text-[#2DB39E] text-[10px] font-mono uppercase tracking-wider">
          <Award className="w-3.5 h-3.5" /> Approved Operations
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#9CA3AF] text-sm font-mono animate-pulse">
          Streaming active operational directories...
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-12 text-[#9CA3AF] text-sm font-mono bg-[#0B0B0C] border border-[#3A3A3A] rounded-lg">
          No operational guidelines currently published.
        </div>
      ) : (
        /* FAQ Accordion Component */
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-[#0B0B0C] border border-[#3A3A3A] rounded-lg overflow-hidden transition-all hover:border-[#2DB39E]/60"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}
                className="w-full px-5 py-4 text-left font-display font-medium text-sm sm:text-base text-white flex items-center justify-between hover:bg-[#161617]/50 mb-0 transition-colors"
                id={`faq-btn-${faq.id}`}
              >
                <span className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-[#2DB39E]/70 shrink-0" />
                  {faq.q}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#2DB39E] transition-all shrink-0 ${activeFaq === faq.id ? 'rotate-180' : ''}`} />
              </button>
              {activeFaq === faq.id && (
                <div className="px-5 pb-5 pt-3 text-xs sm:text-sm text-[#9CA3AF] leading-relaxed border-t border-[#3A3A3A]/40 bg-[#161617]/30 select-text whitespace-pre-wrap">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Trust Notice card */}
      <div className="p-4 bg-[#161617]/40 border border-[#3A3A3A]/60 rounded-lg text-center text-xs text-[#9CA3AF] leading-relaxed max-w-2xl mx-auto">
        Can't find what you need? Reach out directly to your assigned Singapore account representative or contact our central support desk at <span className="text-white font-mono">sales@pointone.sg</span>.
      </div>

    </div>
  );
}
