import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Landmark, ArrowRight, ShieldCheck, Mail, User, Phone, CheckCircle, HelpCircle, FileText, AlertCircle } from "lucide-react";
import { ConsentCheckbox } from "../components/ConsentCheckbox";
import { COMPANY } from "../lib/constants";

interface RegisterProps {
  onRegisterSuccess: (token: string, user: any) => void;
}

export default function Register({ onRegisterSuccess }: RegisterProps) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Form states matching schema validations
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [uen, setUen] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [showroomLocations, setShowroomLocations] = useState("");
  const [consentGiven, setConsentGiven] = useState(false); // Locked FALSE initially

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (!companyName.trim() || !uen.trim() || !address.trim() || !postalCode.trim()) {
        setError("Please complete all corporate business attributes to proceed.");
        return;
      }
      if (uen.trim().length !== 9 && uen.trim().length !== 10) {
        setError("Singapore UEN must be exactly 9 or 10 characters long.");
        return;
      }
      if (postalCode.trim().length !== 6) {
        setError("Singapore postal codes must be exactly 6 digits.");
        return;
      }
    } else if (step === 2) {
      if (!fullName.trim() || !phone.trim() || !email.trim() || !showroomLocations.trim()) {
        setError("Contact representations and showroom coordinates must be specified.");
        return;
      }
      if (!email.includes("@")) {
        setError("Please enter a valid business email address format.");
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Strict validation check of PDPA gate
    if (!consentGiven) {
      setError("Compliance Gate Error: You must read, understand, and manually check the PDPA consent statement to apply for a B2B distributor account.");
      return;
    }

    if (!password || password.length < 8) {
      setError("Security Safeguard: Secret password must register at least 8 alphanumeric characters.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email,
        password,
        fullName,
        phone,
        companyName,
        uen: uen.trim().toUpperCase(),
        address,
        postalCode,
        showroomLocations,
        consentGiven: true
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.error || "Distributor registration application failed.");
      }

      const { token, user } = resData.data;
      onRegisterSuccess(token, user);

      // Redirect directly to dashboard showcasing PENDING screen for pre-vetting review!
      navigate("/portal/dashboard");
    } catch (err: any) {
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 sm:py-12 bg-black Selection:bg-[#2DB39E] selection:text-black">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* Progress Tracker Steps Indicator */}
        <div className="flex items-center justify-between px-6 font-display">
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border ${step >= 1 ? 'border-[#2DB39E] bg-[#2DB39E]/10 text-[#2DB39E]' : 'border-[#3A3A3A] bg-[#0B0B0C] text-[#9CA3AF]'}`}>1</span>
            <span className={`text-[11px] sm:text-xs font-medium uppercase tracking-wide hidden sm:block ${step >= 1 ? 'text-[#2DB39E]' : 'text-[#9CA3AF]'}`}>Company Profiling</span>
          </div>
          <div className="h-px bg-[#3A3A3A] flex-1 mx-3"></div>
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border ${step >= 2 ? 'border-[#2DB39E] bg-[#2DB39E]/10 text-[#2DB39E]' : 'border-[#3A3A3A] bg-[#0B0B0C] text-[#9CA3AF]'}`}>2</span>
            <span className={`text-[11px] sm:text-xs font-medium uppercase tracking-wide hidden sm:block ${step >= 2 ? 'text-[#2DB39E]' : 'text-[#9CA3AF]'}`}>Showroom Logs</span>
          </div>
          <div className="h-px bg-[#3A3A3A] flex-1 mx-3"></div>
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border ${step >= 3 ? 'border-[#2DB39E] bg-[#2DB39E]/10 text-[#2DB39E]' : 'border-[#3A3A3A] bg-[#0B0B0C] text-[#9CA3AF]'}`}>3</span>
            <span className={`text-[11px] sm:text-xs font-medium uppercase tracking-wide hidden sm:block ${step >= 3 ? 'text-[#2DB39E]' : 'text-[#9CA3AF]'}`}>Covenants Gate</span>
          </div>
        </div>

        {/* Form Body Sheet */}
        <div className="bg-[#0B0B0C] border border-[#3A3A3A] rounded-lg p-6 sm:p-8 shadow-2xl space-y-6">
          
          <div className="border-b border-[#3A3A3A]/60 pb-4 space-y-1">
            <h2 className="font-display font-medium text-lg text-white">Distributorship Enrollment Form</h2>
            <p className="text-xs text-[#9CA3AF]">
              {step === 1 && "Submit corporate attributes and registered business profiles."}
              {step === 2 && "Enter primary contact details for formal invoicing and showroom location arrays."}
              {step === 3 && "Complete account setup and review PDPA consent parameters and liabilities."}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-[#E63946]/10 border border-[#E63946]/25 rounded text-xs gap-2.5 flex items-start font-mono text-[#E63946] leading-relaxed">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* STEP 1: Company Profile parameters */}
            {step === 1 && (
              <div className="space-y-4">
                
                 {/* Company Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider font-mono">Registered Corporate Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Interior Illumination SG Pte. Ltd."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full h-[44px] bg-[#161617] border border-[#3A3A3A] rounded px-4 text-sm text-white focus:outline-none focus:border-[#2DB39E] transition-all"
                  />
                </div>

                {/* UEN and Postal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider font-mono">ACRA Business UEN</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., 201826157C"
                      maxLength={10}
                      value={uen}
                      onChange={(e) => setUen(e.target.value)}
                      className="w-full h-[44px] bg-[#161617] border border-[#3A3A3A] rounded px-4 text-sm text-white focus:outline-none focus:border-[#2DB39E] transition-all uppercase font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider font-mono">SG Postal Code</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., 568049"
                      maxLength={6}
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full h-[44px] bg-[#161617] border border-[#3A3A3A] rounded px-4 text-sm text-white focus:outline-none focus:border-[#2DB39E] transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Corporate Address */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider font-mono">Registered Corporate Address</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="E.g., 1 Ang Mo Kio Industrial Park 2A, #03-02, AMK Tech I, Singapore"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#161617] border border-[#3A3A3A] rounded p-3 text-sm text-white focus:outline-none focus:border-[#2DB39E] transition-all"
                  />
                </div>

                {/* Next Step Action Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 h-[44px] bg-[#2DB39E] text-black font-semibold text-sm rounded hover:bg-[#2DB39E]/90 flex items-center gap-1.5 transition-all font-display cursor-pointer"
                  >
                    Proceed with Location Specifications
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* STEP 2: Showroom location and contact representations */}
            {step === 2 && (
              <div className="space-y-4">
                
                 {/* Contact Full Name & Telephone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider font-mono">Applicant Representative Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="E.g., Jeremy Koh"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-[44px] bg-[#161617] border border-[#3A3A3A] rounded px-4 text-sm text-white focus:outline-none focus:border-[#2DB39E] transition-all"
                      />
                      <User className="absolute right-3.5 top-3.5 w-4 h-4 text-[#9CA3AF]/60 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider font-mono">Corporate Phone Coordinate</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="E.g., +65 9123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-[44px] bg-[#161617] border border-[#3A3A3A] rounded px-4 text-sm text-white focus:outline-none focus:border-[#2DB39E] transition-all font-mono"
                      />
                      <Phone className="absolute right-3.5 top-3.5 w-4 h-4 text-[#9CA3AF]/60 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Email address */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider font-mono">Distributor Email Access (Login Account)</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="E.g., j.koh@illumination.com.sg"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-[44px] bg-[#161617] border border-[#3A3A3A] rounded px-4 text-sm text-white focus:outline-none focus:border-[#2DB39E] transition-all font-mono"
                    />
                    <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-[#9CA3AF]/60 pointer-events-none" />
                  </div>
                </div>

                {/* Showroom Physical Coordinates/Locations */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider font-mono">Showroom / Store Front Physical Locations</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="E.g., Flagship interior showroom at AMK Hub #02-15 or Geylang road gallery..."
                    value={showroomLocations}
                    onChange={(e) => setShowroomLocations(e.target.value)}
                    className="w-full bg-[#161617] border border-[#3A3A3A] rounded p-3 text-sm text-white focus:outline-none focus:border-[#2DB39E] transition-all"
                  />
                </div>

                {/* Steps Controller Buttons */}
                <div className="pt-2 flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-5 h-[44px] border border-[#3A3A3A] hover:bg-[#161617] text-white font-semibold text-sm rounded font-display transition-all cursor-pointer"
                  >
                    Back to Company Profiling
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 h-[44px] bg-[#2DB39E] text-black font-semibold text-sm rounded hover:bg-[#2DB39E]/90 flex items-center gap-1.5 transition-all font-display cursor-pointer"
                  >
                    Continue to Security Covenants
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* STEP 3: Security parameters & Covenants gate */}
            {step === 3 && (
              <div className="space-y-4">
                
                {/* Password Setting Setup */}
                <div className="p-4 bg-[#161617] border border-[#3A3A3A] rounded-lg space-y-3">
                  <h4 className="text-white font-semibold text-xs uppercase tracking-wider font-mono">Create Secure Distributor Password</h4>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase font-mono">Account Password (8+ Characters)</label>
                    <input
                      type="password"
                      required
                      placeholder="Create secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-[44px] bg-[#000] border border-[#3A3A3A] rounded px-4 text-sm text-white focus:outline-none focus:border-[#2DB39E] transition-all"
                    />
                  </div>
                </div>

                {/* PDPA consent gate - MANDATORY UNTICKED CHECKBOX */}
                <ConsentCheckbox
                  checked={consentGiven}
                  onChange={(checked) => setConsentGiven(checked)}
                />

                {/* Steps Controller Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row justify-between gap-3 font-display">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="w-full sm:w-auto px-5 h-[44px] border border-[#3A3A3A] hover:bg-[#161617] text-white font-semibold text-xs sm:text-sm rounded transition-all cursor-pointer"
                  >
                    Edit Contact Details
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !consentGiven}
                    className={`w-full sm:w-auto px-6 h-[44px] font-bold text-xs sm:text-sm rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      consentGiven 
                        ? 'bg-[#2DB39E] text-black hover:bg-[#2DB39E]/90 shadow-lg shadow-[#2DB39E]/10' 
                        : 'bg-[#161617] border border-[#3A3A3A] text-[#9CA3AF] cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {loading ? "Registering business files..." : "Register Distributor Application"}
                  </button>
                </div>

              </div>
            )}

          </form>

        </div>

        {/* Footnotes return to logins */}
        <div className="text-center font-mono text-[11px] text-[#9CA3AF]">
          Already have an active distributor account?{" "}
          <Link to="/login" className="text-[#2DB39E] underline font-bold">
            Sign In here &rarr;
          </Link>
        </div>

      </div>
    </div>
  );
}
