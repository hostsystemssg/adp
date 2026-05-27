import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, LogOut, ShieldCheck, User, Compass, HelpCircle, Lock } from "lucide-react";

// Legal Pages & Layout
import LegalLayout from "./pages/legal/LegalLayout";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfUse from "./pages/legal/TermsOfUse";
import CookiePolicy from "./pages/legal/CookiePolicy";

// Standard Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Distributor / Portal Pages
import PortalDashboard from "./pages/PortalDashboard";
import Catalog from "./pages/Catalog";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import AdminDashboard from "./pages/AdminDashboard";
import FAQ from "./pages/FAQ";

// Reusable Cookie Consent Banner
import { CookieBanner } from "./components/CookieBanner";

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("pointone_token"));
  const [user, setUser] = useState<any>(() => {
    const raw = localStorage.getItem("pointone_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [retailer, setRetailer] = useState<any>(() => {
    const raw = localStorage.getItem("pointone_retailer");
    return raw ? JSON.parse(raw) : null;
  });

  // Cart operations state dictionary
  const [cartItems, setCartItems] = useState<{ [pId: string]: number }>(() => {
    const raw = localStorage.getItem("pointone_cart");
    return raw ? JSON.parse(raw) : {};
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("pointone_token", token);
    } else {
      localStorage.removeItem("pointone_token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("pointone_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("pointone_user");
    }
  }, [user]);

  useEffect(() => {
    if (retailer) {
      localStorage.setItem("pointone_retailer", JSON.stringify(retailer));
    } else {
      localStorage.removeItem("pointone_retailer");
    }
  }, [retailer]);

  useEffect(() => {
    localStorage.setItem("pointone_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Sync profile & status on-the-fly to react to admin approvals immediately
  useEffect(() => {
    if (token) {
      fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          const { user: refreshedUser, retailer: refreshedRetailer } = resData.data;
          setUser(refreshedUser);
          if (refreshedRetailer) {
            setRetailer(refreshedRetailer);
          }
        }
      })
      .catch(() => {});
    }
  }, [token]);

  const handleLoginSuccess = (newToken: string, loginUser: any) => {
    setToken(newToken);
    setUser(loginUser);
    if (loginUser.retailer) {
      setRetailer(loginUser.retailer);
    } else {
      // standard placeholder for admins!
      setRetailer({
        id: "admin-root-dummy",
        companyName: "Point One Internal Administration",
        uen: "ADMIN-SYS",
        status: "Approved",
        tier: "Platinum"
      });
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setRetailer(null);
    setCartItems({});
    localStorage.removeItem("pointone_token");
    localStorage.removeItem("pointone_user");
    localStorage.removeItem("pointone_retailer");
    localStorage.removeItem("pointone_cart");
  };

  // Cart logic triggers
  const handleAddToCart = (productId: string, qty: number) => {
    setCartItems(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + qty
    }));
  };

  const handleUpdateCartQty = (productId: string, val: number) => {
    setCartItems(prev => ({
      ...prev,
      [productId]: val
    }));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(prev => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const handleClearCart = () => {
    setCartItems({});
  };

  const cartCount: number = Object.values(cartItems).reduce((sum, q) => (sum as number) + (q as number), 0) as number;

  return (
    <BrowserRouter>
      <div className="bg-[#000000] text-[#F3F4F6] min-h-screen flex flex-col font-sans selection:bg-[#2DB39E] selection:text-black">
        
        {/* Render persistent Global Cookie Banner */}
        <CookieBanner />

        <Routes>
          
          {/* Static Legal Pages (Accessible without logins) */}
          <Route element={<LegalLayout />}>
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfUse />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
          </Route>

          {/* Core Unlocked Pages Layout */}
          <Route
            path="/"
            element={<Home />}
          />
          <Route
            path="/login"
            element={
              token ? (
                user?.role === "admin" ? (
                  <Navigate to="/admin/dashboard" />
                ) : (
                  <Navigate to="/portal/dashboard" />
                )
              ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
              )
            }
          />
          <Route
            path="/register"
            element={
              token ? (
                <Navigate to="/portal/dashboard" />
              ) : (
                <Register onRegisterSuccess={handleLoginSuccess} />
              )
            }
          />

          {/* GATED DISTRIBUTOR PORTAL SYSTEM */}
          <Route
            path="/*"
            element={
              !token ? (
                <Navigate to="/login" replace />
              ) : (
                <PortalSystemLayout
                  user={user}
                  retailer={retailer}
                  cartCount={cartCount}
                  onLogout={handleLogout}
                >
                  <Routes>
                    <Route
                      path="portal/dashboard"
                      element={
                        <PortalDashboard
                          token={token}
                          user={user}
                          retailer={retailer}
                          onLogout={handleLogout}
                        />
                      }
                    />
                    <Route
                      path="portal/catalog"
                      element={
                        retailer?.status === "Approved" ? (
                          <Catalog
                            token={token}
                            retailer={retailer}
                            onAddToCart={handleAddToCart}
                            cartItems={cartItems}
                          />
                        ) : (
                          <Navigate to="/portal/dashboard" replace />
                        )
                      }
                    />
                    <Route
                      path="portal/cart"
                      element={
                        retailer?.status === "Approved" ? (
                          <Cart
                            token={token}
                            retailer={retailer}
                            cartItems={cartItems}
                            onUpdateQty={handleUpdateCartQty}
                            onRemoveItem={handleRemoveFromCart}
                            onClearCart={handleClearCart}
                          />
                        ) : (
                          <Navigate to="/portal/dashboard" replace />
                        )
                      }
                    />
                    <Route
                      path="portal/orders"
                      element={
                        retailer?.status === "Approved" ? (
                          <Orders
                            token={token}
                            user={user}
                            retailer={retailer}
                          />
                        ) : (
                          <Navigate to="/portal/dashboard" replace />
                        )
                      }
                    />
                    <Route
                      path="portal/faq"
                      element={
                        <FAQ />
                      }
                    />
                    
                    {/* ADMIN ACCREDITATION LOCK */}
                    <Route
                      path="admin/dashboard"
                      element={
                        user?.role === "admin" ? (
                          <AdminDashboard token={token} />
                        ) : (
                          <Navigate to="/portal/dashboard" replace />
                        )
                      }
                    />

                    {/* Catchall routing redirects to primary dashboard */}
                    <Route path="*" element={<Navigate to="/portal/dashboard" replace />} />
                  </Routes>
                </PortalSystemLayout>
              )
            }
          />

        </Routes>

      </div>
    </BrowserRouter>
  );
}

interface PortalSystemLayoutProps {
  user: any;
  retailer: any;
  cartCount: number;
  onLogout: () => void;
  children: React.ReactNode;
}

// Subcomponent Layout wrapping portal headers and contextual user states
function PortalSystemLayout({ user, retailer, cartCount, onLogout, children }: PortalSystemLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveBorder = (path: string) => {
    return location.pathname.includes(path) 
      ? "border-[#2DB39E] text-[#2DB39E] bg-gradient-to-t from-[rgba(45,179,158,0.06)] to-transparent" 
      : "border-transparent text-[#9CA3AF] hover:text-white";
  };

  // Strictly gate unapproved retailers from accessing ANY platform layout, sidebar, or sub-page
  if (user && user.role !== "admin" && retailer?.status !== "Approved") {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-between p-6 select-none animate-fadeIn selection:bg-red-500/25 text-[#F3F4F6]">
        {/* Top brand header but extremely minimal, no active links */}
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center pb-6 border-b border-[#2A2A2B]/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-sm flex items-center justify-center font-bold text-black text-xs">
              P1
            </div>
            <div>
              <span className="text-xs font-mono text-[#9CA3AF] uppercase tracking-widest block font-bold">Point One Technology</span>
              <span className="text-[10px] font-mono text-red-500 uppercase tracking-widest block font-bold">DEALER GATED SECURITY</span>
            </div>
          </div>
          <button
            onClick={() => {
              onLogout();
              navigate("/");
            }}
            className="px-3.5 py-1.5 text-xs font-mono border border-red-500/30 text-[#9CA3AF] hover:text-[#E63946] hover:bg-red-600/10 rounded transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        {/* Center lockdown block */}
        <div className="max-w-md mx-auto w-full my-auto space-y-6 text-center py-12 animate-fadeIn">
          <div className="relative inline-flex items-center justify-center">
            {/* Pulsing ring outer */}
            <span className="absolute inline-flex h-20 w-20 rounded-full bg-red-600/10 animate-ping"></span>
            <div className="relative w-16 h-16 rounded-full bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/5">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-medium text-white text-xl sm:text-2xl tracking-tight">
              {retailer?.status === "Declined" ? "Access Privilege Revoked" : "Application Under Verification"}
            </h2>
            <p className="text-xs sm:text-xs text-[#9CA3AF] leading-relaxed">
              {retailer?.status === "Declined" ? (
                "Your B2B retail distributor profile was processed and declined by Point One internal administration. If you believe this represents a reporting parameter error, request a correction direct with our compliance office."
              ) : (
                "Your distribution proposal is currently in queue awaiting formal evaluation by the Point One Technology administrative board. Standard Singapore retail credentials and UEN certificates are verified within 2 to 3 business days."
              )}
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#2A2A2B]/40">
            <div className="bg-[#121213] border border-[#202021] rounded p-4 text-left space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Applicant Name:</span>
                <span className="text-white font-sans">{user?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Corporate Profile:</span>
                <span className="text-white font-sans">{retailer?.companyName || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Singapore UEN:</span>
                <span className="text-white">{retailer?.uen || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Verification Status:</span>
                <span className={`font-bold uppercase ${retailer?.status === "Declined" ? "text-red-500" : "text-amber-500 animate-pulse"}`}>
                  {retailer?.status || "Pending"}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-[#9CA3AF]/70 max-w-xs mx-auto leading-normal font-mono">
              For security compliance, no database tables, CAD layouts, or procurement lines are synchronized on this node until authority approval confirms.
            </p>
          </div>
        </div>

        {/* Minimal Legal Footer */}
        <div className="max-w-7xl mx-auto w-full text-center border-t border-[#2A2A2B]/40 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#9CA3AF] gap-4 animate-fadeIn">
          <span>&copy; 2026 Point One Technology Enterprise. All Rights Reserved.</span>
          <div className="flex gap-4">
            <a href="/privacy-policy" className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            <a href="/terms" className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">Terms of Use</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col justify-between">
      
      {/* Secured Navigator */}
      <header className="bg-[#0B0B0C] border-b border-[#3A3A3A] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Left Brand Area */}
            <div className="flex items-center gap-6">
              <Link to="/portal/dashboard" className="flex items-center gap-3 group">
                <div className="w-8 h-8 bg-[#2DB39E] rounded-sm flex items-center justify-center font-bold text-black text-xs transition-transform group-hover:scale-105">
                  P1
                </div>
                <div className="leading-none">
                  <span className="text-sm font-semibold tracking-tight uppercase block text-white group-hover:text-[#2DB39E] transition-colors" style={{ fontFamily: "Arial, sans-serif" }}>Point One Technology</span>
                  <span className="text-[10px] text-[#9CA3AF] uppercase tracking-widest font-mono block mt-1">B2B Wholesale Portal</span>
                </div>
              </Link>

              {/* Navigation Tabs */}
              <nav className="hidden md:flex gap-4 h-16 items-center pt-1 font-display">
                {user?.role === "admin" ? (
                  <Link
                    to="/admin/dashboard"
                    className={`h-full flex items-center px-2 text-xs font-semibold border-b-2 transition-all ${getActiveBorder("/admin/dashboard")}`}
                  >
                    System Control Room
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/portal/dashboard"
                      className={`h-full flex items-center px-2 text-xs font-semibold border-b-2 transition-all ${getActiveBorder("/portal/dashboard")}`}
                    >
                      Reseller Board
                    </Link>
                    {retailer?.status === "Approved" && (
                      <>
                        <Link
                          to="/portal/catalog"
                          className={`h-full flex items-center px-2 text-xs font-semibold border-b-2 transition-all ${getActiveBorder("/portal/catalog")}`}
                        >
                          B2B Catalog
                        </Link>
                        <Link
                          to="/portal/orders"
                          className={`h-full flex items-center px-2 text-xs font-semibold border-b-2 transition-all ${getActiveBorder("/portal/orders")}`}
                        >
                          Order Timelines
                        </Link>
                      </>
                    )}
                    <Link
                      to="/portal/faq"
                      className={`h-full flex items-center px-2 text-xs font-semibold border-b-2 transition-all ${getActiveBorder("/portal/faq")}`}
                    >
                      FAQ
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* Right User Controls area */}
            <div className="flex items-center gap-4">
              
              {/* Cart Counter shortcut info */}
              {user?.role !== "admin" && retailer?.status === "Approved" && (
                <Link
                  to="/portal/cart"
                  className="relative p-2 text-[#9CA3AF] hover:text-[#2DB39E] transition-all"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#2DB39E] text-black text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Profiles details */}
              <div className="hidden sm:flex flex-col items-end leading-none font-mono text-[10px]">
                <span className="text-white font-medium flex items-center gap-1">
                  <User className="w-3 h-3 text-[#2DB39E]" /> {user?.fullName}
                </span>
                <span className="text-[#9CA3AF] uppercase text-[8px] mt-0.5 tracking-wider">
                  Role: {user?.role} Access
                </span>
              </div>

              {/* Log out direct anchor button */}
              <button
                onClick={() => {
                  onLogout();
                  navigate("/");
                }}
                className="p-2 text-[#9CA3AF] hover:text-[#E63946] hover:bg-red-600/10 rounded-full transition-all bg-transparent cursor-pointer"
                title="Secure Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>

            </div>

          </div>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="flex-grow bg-black pb-16">
        {children}
      </main>

    </div>
  );
}
