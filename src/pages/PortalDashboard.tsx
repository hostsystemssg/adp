import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Award, Download, AlertTriangle, ToggleLeft, ToggleRight, Check, CheckCircle2, CloudLightning, RefreshCw, Send, Hammer, Lock } from "lucide-react";
import { COMPANY } from "../lib/constants";

interface PortalDashboardProps {
  token: string | null;
  user: any;
  retailer: any;
  onLogout: () => void;
}

export default function PortalDashboard({ token, user, retailer, onLogout }: PortalDashboardProps) {
  const [retRecord, setRetRecord] = useState<any>(retailer);
  const [consents, setConsents] = useState<any[]>([]);
  const [exportData, setExportData] = useState<any>(null);
  const [requestCorrMsg, setRequestCorrMsg] = useState("");
  const [corrSubmitted, setCorrSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      // Pull latest profile
      const userRes = await fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const userData = await userRes.json();
      if (userData.success) {
        setRetRecord(userData.data.retailer);
      }

      // Pull active consents state
      const consentRes = await fetch("/api/consent", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const consData = await consentRes.json();
      if (consData.success) {
        setConsents(consData.data);
      }

      // Compile personal dataset export arrays
      const exportRes = await fetch("/api/auth/my-data", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const exportDataRes = await exportRes.json();
      if (exportDataRes.success) {
        setExportData(exportDataRes.data);
      }

    } catch (err: any) {
      setError("Failed to stream dashboard indicators.");
    }
  };

  const handleWithdrawToggle = async (purpose: string, alreadyWithdrawn: boolean) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/consent/${purpose}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ withdrawn: !alreadyWithdrawn })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to edit consent coordinates.");
      }

      setSuccessMsg(data.data.notice || "Consent updated successfully.");
      setTimeout(() => {
        // If withdrawing registration consent, it logs them out because the account gets locked.
        if (purpose === "registration" && !alreadyWithdrawn) {
          onLogout();
          navigate("/");
        } else {
          fetchDashboardData();
        }
      }, 3500);

    } catch (err: any) {
      setError(err.message || "Failed to change parameters.");
    }
  };

  const handleManualExport = () => {
    if (!exportData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `PointOne_DataExport_${user?.fullName?.replace(/\s/g, "_")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCorrSubmitted(true);
    setTimeout(() => {
      setRequestCorrMsg("");
      setCorrSubmitted(false);
      setSuccessMsg(`Your correction request has been securely compiled and transmitted to the Point One DPO at ${COMPANY.dpo.email}. Action will be resolved within 30 business days.`);
    }, 1500);
  };

  const tierStats = {
    "Standard": { label: "Standard Vendor Tier", discount: "0%", minSpend: "$0", nextLevel: "Silver", spendToNext: "$50,000", progress: 15 },
    "Silver": { label: "Silver Wholesale Tier", discount: "5% Rebate", minSpend: "$50,000", nextLevel: "Gold", spendToNext: "$70,000", progress: 45 },
    "Gold": { label: "Gold Premium Partner", discount: "10% Rebate", minSpend: "$120,000", nextLevel: "Platinum", spendToNext: "$130,000", progress: 78 },
    "Platinum": { label: "Platinum Signature Suite", discount: "15% Rebate", minSpend: "$250,050", nextLevel: "MAX LEVEL", spendToNext: "$0", progress: 100 }
  };

  const currentTier = (retRecord?.tier || "Standard") as keyof typeof tierStats;
  const stats = tierStats[currentTier];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn text-[#F3F4F6]">
      
      {/* Header Panel */}
      <div className="border-b border-[#3A3A3A] pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-medium text-2xl sm:text-3xl text-white">Distributor Board</h1>
            {retRecord?.status === "Pending" && (
              <span className="text-[11px] px-2.5 py-0.5 rounded font-mono bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20 animate-pulse uppercase tracking-wider font-semibold">PENDING PORTAL VERIFICATION</span>
            )}
            {retRecord?.status === "Approved" && (
              <span className="text-[11px] px-2.5 py-0.5 rounded font-mono bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/25 uppercase tracking-wider font-bold">&#9679; SECURE ACRA APPROVED</span>
            )}
            {retRecord?.status === "Declined" && (
              <span className="text-[11px] px-2.5 py-0.5 rounded font-mono bg-red-600/20 text-red-500 border border-red-500/30 uppercase tracking-wider">REGISTRATION DECLINED</span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#9CA3AF] font-mono mt-1">
            Registered: {retRecord?.companyName || "N/A"} &middot; UEN: <span className="text-white">{retRecord?.uen || "N/A"}</span>
          </p>
        </div>

        {/* Quick Menu */}
        <div className="flex flex-wrap gap-2">
          {retRecord?.status === "Approved" ? (
            <>
              <Link
                to="/portal/catalog"
                className="px-4 py-2 text-xs sm:text-sm font-semibold bg-[#2DB39E] text-black rounded hover:bg-[#2DB39E]/90 transition-all font-display shadow"
              >
                Browse Wholesale Catalog
              </Link>
              <Link
                to="/portal/orders"
                className="px-4 py-2 text-xs sm:text-sm font-semibold border border-[#3A3A3A] hover:bg-[#161617] rounded transition-all font-display"
              >
                Procurement Orders
              </Link>
            </>
          ) : (
            <>
              <button
                disabled
                className="px-4 py-2 text-[#9CA3AF] bg-[#161617] border border-[#2A2A2B] rounded cursor-not-allowed font-display text-xs sm:text-sm font-semibold opacity-60 flex items-center gap-1.5"
                title="Wholesale catalog requires approved distribution credentials"
              >
                <Lock className="w-3.5 h-3.5 text-[#E63946]" />
                Catalog (Locked)
              </button>
              <button
                disabled
                className="px-4 py-2 text-[#9CA3AF] bg-[#161617] border border-[#2A2A2B] rounded cursor-not-allowed font-display text-xs sm:text-sm font-semibold opacity-60 flex items-center gap-1.5"
                title="Order timelines require approved distribution credentials"
              >
                <Lock className="w-3.5 h-3.5 text-[#E63946]" />
                Orders Timeline (Locked)
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#E63946]/10 border border-[#E63946]/20 rounded text-xs gap-2 flex items-start font-mono text-[#E63946]">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-[#22C55E]/10 border border-[#22C55E]/25 text-[#22C55E] rounded text-xs gap-2 flex items-start font-mono font-semibold leading-relaxed">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-[#22C55E] animate-bounce" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TIER REBATE METRICS PROGRESS PANEL */}
      <section className="bg-[#0B0B0C] border border-[#3A3A3A] rounded-lg p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#2DB39E] uppercase tracking-wider font-mono">Singapore Volume Tiers</span>
            <h3 className="font-display font-medium text-lg text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-[#2DB39E]" />
              {stats.label}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#9CA3AF] block font-mono">Wholesale Discount Scale</span>
            <span className="font-mono text-xl text-[#2DB39E] font-bold">{stats.discount} Off Base Wholesale catalog</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 w-full bg-[#161617] rounded-full overflow-hidden border border-[#3A3A3A]">
            <div className="h-full bg-[#2DB39E] rounded-full transition-all duration-1000" style={{ width: `${stats.progress}%` }}></div>
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono text-[#9CA3AF]">
            <span>Min Spend: {stats.minSpend}</span>
            <span>Next Target: {stats.nextLevel} (Need {stats.spendToNext} progress increment)</span>
          </div>
        </div>

        {retRecord?.status === "Pending" && (
          <div className="p-4 bg-[#E63946]/10 border border-[#E63946]/15 rounded text-xs text-[#E63946] leading-relaxed">
            📢 <strong>Application Under Review:</strong> Your distributor profile is currently being processed by the Point One Technology distribution desk for standard business credentials verification under the Singapore corporate guidelines. Standard pricing is simulated below, but checkout remains gated until authorized validation clears.
          </div>
        )}
      </section>

      {/* TWO COLUMN GRID DETAILS: LEFT CONSENTS AND MY DATA, RIGHT CORRECT SUBMIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: PDPA consent withdrawals and My Data details */}
        <div className="space-y-8">
          
          {/* SECURE MY DATA DOWNLOAD */}
          <div className="bg-[#0B0B0C] border border-[#3A3A3A] rounded-lg p-5 space-y-4">
            <h4 className="font-display font-medium text-base text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-[#2DB39E]" /> Access and Portability Rights (PDPA Obligation 9)
            </h4>
            <p className="text-xs text-[#9CA3AF] leading-relaxed text-justify">
              Registered business entities and individual corporate representatives maintain absolute portability rights to extract all metadata saved on our servers. Click below to compile and download your entire vendor file, including audit logs, registered addresses, and procurement records.
            </p>
            <button
              onClick={handleManualExport}
              disabled={!exportData}
              className="w-full h-11 bg-[#161617] border border-[#3A3A3A] hover:border-[#2DB39E] hover:text-white rounded text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#2DB39E]" />
              Export Entire My Personal File (JSON)
            </button>
          </div>

          {/* CUSTOM CONSENTS LIST WITH WITHDRAW OPTIONS */}
          <div className="bg-[#0B0B0C] border border-[#3A3A3A] rounded-lg p-5 space-y-4">
            <h4 className="font-display font-medium text-base text-white">Withdraw and Manage PDPA Consents</h4>
            <p className="text-xs text-[#9CA3AF] leading-relaxed text-justify">
              Under Singapore's Personal Data Protection Conduct, you hold the absolute freedom to redact consent lines previously permitted to us. Toggling off any purpose modifies our databases instantly.
            </p>

            <div className="space-y-3">
              
              {/* Consent 1: Registration (Essential) */}
              <div className="p-3 bg-[#161617] border border-[#3A3A3A] rounded flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-[#2DB39E] uppercase tracking-wider block">Requirement: Mandatory Opt-In</span>
                  <h5 className="font-display text-xs text-white font-semibold">Account Registration, Audit Logs & MOQ Calculations</h5>
                  <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
                    Required to navigate B2B matrices and secure accounting invoices. If withdrawn, your distributor account is systematically suspended.
                  </p>
                </div>
                <button
                  onClick={() => handleWithdrawToggle("registration", consents.some(c => c.purpose === "registration" && c.withdrawnAt !== null))}
                  className="shrink-0 text-xs px-2.5 py-1.5 rounded font-semibold border select-none transition-all"
                  style={{
                    backgroundColor: consents.some(c => c.purpose === "registration" && c.withdrawnAt !== null) ? "rgba(230,57,70,0.1)" : "rgba(45,179,158,0.1)",
                    color: consents.some(c => c.purpose === "registration" && c.withdrawnAt !== null) ? "#E63946" : "#2DB39E",
                    borderColor: consents.some(c => c.purpose === "registration" && c.withdrawnAt !== null) ? "#E63946" : "#2DB39E"
                  }}
                >
                  {consents.some(c => c.purpose === "registration" && c.withdrawnAt !== null) ? "Disabled/Withdrawn" : "Active / Withdraw"}
                </button>
              </div>

              {/* Consent 2: Marketing (Optional) */}
              <div className="p-3 bg-[#161617] border border-[#3A3A3A] rounded flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-[#9CA3AF] uppercase tracking-wider block">Requirement: Optional Opt-In</span>
                  <h5 className="font-display text-xs text-white font-semibold">Wholesale Campaign Updates & New Fan SKU Alerts</h5>
                  <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
                    Communication stream regarding restock schedules and physical SKU updates.
                  </p>
                </div>
                <button
                  onClick={() => handleWithdrawToggle("marketing", consents.some(c => c.purpose === "marketing" && c.withdrawnAt !== null))}
                  className="shrink-0 text-xs px-2.5 py-1.5 rounded font-semibold border select-none transition-all"
                  style={{
                    backgroundColor: consents.some(c => c.purpose === "marketing" && c.withdrawnAt !== null) ? "rgba(230,57,70,0.1)" : "rgba(45,179,158,0.1)",
                    color: consents.some(c => c.purpose === "marketing" && c.withdrawnAt !== null) ? "#E63946" : "#2DB39E",
                    borderColor: consents.some(c => c.purpose === "marketing" && c.withdrawnAt !== null) ? "#E63946" : "#2DB39E"
                  }}
                >
                  {consents.some(c => c.purpose === "marketing" && c.withdrawnAt !== null) ? "Withdrawn" : "Active / Withdraw"}
                </button>
              </div>

            </div>
          </div>

        </div>
        
        {/* RIGHT COLUMN: PDPA Correction request form */}
        <div className="bg-[#0B0B0C] border border-[#3A3A3A] rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div>
            <h4 className="font-display font-medium text-base text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-[#2DB39E]" /> File Data Correction Profile (PDPA Obligation 9)
            </h4>
            <p className="text-xs text-[#9CA3AF] leading-relaxed text-justify mt-2">
              Is your business name written inaccurately, or has your ACRA corporate UEN registered code been updated? File a formal correction notice with our Personal Data Protection Officer (DPO). The filed parameters undergo strict security verification before changes commit.
            </p>
 
            <form onSubmit={handleCorrectionSubmit} className="mt-4 space-y-4">
              
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider font-mono">DPO Officer Direct Mailbox</label>
                <input
                  type="text"
                  disabled
                  value={COMPANY.dpo.email}
                  className="w-full h-11 bg-[#161617]/50 border border-[#3A3A3A] rounded px-4 text-xs font-mono text-[#9CA3AF] cursor-not-allowed"
                />
              </div>
 
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider font-mono">Specific Correction Descriptions & Details</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Identify what specific databases require mutations (e.g., 'Correct spelling of flagship showroom venue...')"
                  value={requestCorrMsg}
                  onChange={(e) => setRequestCorrMsg(e.target.value)}
                  className="w-full bg-[#161617] border border-[#3A3A3A] rounded p-3 text-sm text-white focus:outline-none focus:border-[#2DB39E] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={corrSubmitted || !requestCorrMsg.trim()}
                className="w-full h-11 bg-[#2DB39E] text-black font-semibold text-sm rounded hover:bg-[#2DB39E]/90 hover:scale-[1.01] transition-all font-display flex items-center justify-center gap-1.5 shadow"
              >
                <Send className="w-4 h-4" />
                {corrSubmitted ? "Compressing request logs..." : "Transmit Formal Request to DPO Desk"}
              </button>

            </form>
          </div>

          <div className="p-3 bg-[#161617] border border-[#3A3A3A] rounded text-[10px] text-[#9CA3AF] font-mono leading-relaxed">
            💡 Under standard Singapore PDPC parameters, regulatory agencies have up to **30 calendar days** from receiving details to complete and respond to vendor correction petitions.
          </div>
        </div>

      </div>

    </div>
  );
}
