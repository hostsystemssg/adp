import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, ChevronRight, AlertTriangle, ShieldCheck } from "lucide-react";
import { COMPANY } from "../lib/constants";

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const resData = await res.json();

      if (!resData.success) {
        throw new Error(resData.error || "Authentication failed. Incorrect credentials.");
      }

      const { token, user, retailer } = resData.data;
      
      onLoginSuccess(token, user);

      // Routing logic based on roles and approval statuses
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        if (retailer?.status === "Approved") {
          navigate("/portal/dashboard");
        } else {
          // If Pending or Declined, let them log in but they will be greeted with a status page.
          navigate("/portal/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-black Selection:bg-[#2DB39E] selection:text-black">
      <div className="w-full max-w-md space-y-6">
        
        {/* Shield Logo Wrapper */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex w-12 h-12 rounded-sm bg-[#2DB39E] items-center justify-center text-black font-bold text-lg hover:brightness-110 transition-all font-display">
            P1
          </Link>
          <h2 className="font-display font-bold text-2xl text-white tracking-tight">Authorized Dealer Portal</h2>
          <p className="text-xs text-[#9CA3AF] max-w-xs mx-auto">Access proprietary CAD blueprints, seasonal pre-order markdowns, and tax invoices.</p>
        </div>

        {/* Login Form Sheet */}
        <div className="bg-[#0B0B0C] border border-[#3A3A3A] rounded-lg p-6 sm:p-8 shadow-xl space-y-6">
          
          {error && (
            <div className="p-4 bg-[#E63946]/10 border border-[#E63946]/25 rounded text-xs gap-2 flex items-start font-mono text-[#E63946]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Corporate Email */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider font-mono">Business Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[44px] bg-[#161617] border border-[#3A3A3A] rounded px-4 text-sm text-white focus:outline-none focus:border-[#2DB39E] transition-all"
                />
                <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-[#9CA3AF]/60 pointer-events-none" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider font-mono">Secret Password</label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[44px] bg-[#161617] border border-[#3A3A3A] rounded px-4 text-sm text-white focus:outline-none focus:border-[#2DB39E] transition-all"
                />
                <Lock className="absolute right-3.5 top-3.5 w-4 h-4 text-[#9CA3AF]/60 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[44px] bg-[#2DB39E] text-black font-semibold text-sm rounded hover:bg-[#2DB39E]/90 hover:scale-[1.01] transition-all font-display mt-2 flex items-center justify-center gap-1.5 shadow-lg shadow-[#2DB39E]/5 cursor-pointer"
            >
              {loading ? "Authenticating security credentials..." : "Validate Credentials & Sign In"}
              <ChevronRight className="w-4 h-4" />
            </button>

          </form>

        </div>

        {/* Links to apply for distributors application */}
        <div className="text-center font-mono text-[11px] text-[#9CA3AF] space-y-2">
          <p>Not a pre-approved digital retailing distributor?</p>
          <p>
            <Link to="/register" className="text-[#2DB39E] underline font-bold hover:text-[#2DB39E]/80">
              Apply for distributor account &rarr;
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
