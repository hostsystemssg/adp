import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, HelpCircle, FileText, ShoppingCart, Info, Check, Filter, AlertCircle } from "lucide-react";
import { Product } from "../db/dbStore";

interface CatalogProps {
  token: string | null;
  retailer: any;
  onAddToCart: (productId: string, qty: number) => void;
  cartItems: { [id: string]: number };
}

export default function Catalog({ token, retailer, onAddToCart, cartItems }: CatalogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [quantities, setQuantities] = useState<{ [pId: string]: number }>({});
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [moqWarning, setMoqWarning] = useState<string | null>(null);

  // Pre-order campaign simulate slider parameters
  const [simulatorQty, setSimulatorQty] = useState(10);
  const [selectedSimProduct, setSelectedSimProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/catalog");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        if (data.data.length > 0) {
          // Initialize count arrays
          const initQuants: { [pId: string]: number } = {};
          data.data.forEach((p: Product) => {
            initQuants[p.id] = p.moq; // defaults quantity selector to custom MOQ!
          });
          setQuantities(initQuants);
          setSelectedSimProduct(data.data[0]);
        }
      }
    } catch (e) {
      setError("Failed to fetch product catalog.");
    }
  };

  const handleQtyChange = (productId: string, val: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, val)
    }));
  };

  const handleAppendToCart = (p: Product) => {
    setError(null);
    setSuccessMsg(null);
    setMoqWarning(null);

    const qty = quantities[p.id] || 1;

    // Strict safety check: validate Minimum Order Quantity
    if (qty < p.moq) {
      setMoqWarning(`Moq Constraint Violation: ${p.name} requires a minimum wholesale order of ${p.moq} items.`);
      return;
    }

    onAddToCart(p.id, qty);
    setSuccessMsg(`Added ${qty} unit(s) of "${p.name}" to your wholesale cart.`);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 3500);
  };

  const filtered = products.filter(p => categoryFilter === "All" || p.category === categoryFilter);

  // Simulate bulk discount structures
  const calculateSimulatedSavings = () => {
    if (!selectedSimProduct) return { grossTotal: 0, discountedTotal: 0, netSavings: 0 };
    
    // Tier Calculations
    // Standard: 0%, Silver: 5%, Gold: 10%, Platinum: 15%
    let discountPct = 0;
    if (retailer?.tier === "Silver") discountPct = 5;
    if (retailer?.tier === "Gold") discountPct = 10;
    if (retailer?.tier === "Platinum") discountPct = 15;

    // Pre-orders override with 15% from campaign directly
    if (selectedSimProduct.isPreOrder) {
      discountPct = selectedSimProduct.preOrderDiscount;
    }

    const wholesaleBase = selectedSimProduct.wholesalePrice;
    const grossTotal = wholesaleBase * simulatorQty;
    const discountedTotal = grossTotal * (1 - discountPct / 100);
    const netSavings = grossTotal - discountedTotal;

    return {
      grossTotal: Number(grossTotal.toFixed(2)),
      discountedTotal: Number(discountedTotal.toFixed(2)),
      netSavings: Number(netSavings.toFixed(2)),
      pct: discountPct
    };
  };

  const simResult = calculateSimulatedSavings();

  const getRenewalDate = () => {
    const d = new Date();
    return `1 ${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}`;
  };

  if (retailer?.status !== "Approved") {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center space-y-6 text-[#F3F4F6] animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-[#161617] border border-red-500/25 text-[#E63946] flex items-center justify-center mx-auto">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="font-display font-medium text-xl text-white">B2B Wholesale Catalog is Reserved</h2>
        <p className="text-xs sm:text-sm text-[#9CA3AF] max-w-sm mx-auto leading-relaxed">
          Your reseller application is currently pending administrative clearance or review. You will be cleared for catalog browsing parameters and wholesale pricing matrices as soon as our distribution agents authorize your accounting credentials.
        </p>
        <Link
          to="/portal/dashboard"
          className="inline-flex px-6 py-2.5 bg-[#2DB39E] text-black font-semibold text-xs sm:text-sm rounded hover:bg-[#2DB39E]/90 transition-all font-display mt-2 cursor-pointer"
        >
          Check Distributorship Status
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn text-[#F3F4F6]">
      
      {/* Title */}
      <div className="border-b border-[#3A3A3A] pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-medium text-2xl sm:text-3xl text-white">Wholesale Catalog Portfolios</h1>
          <p className="text-xs sm:text-sm text-[#9CA3AF]">
            Direct pricing lists for proprietary BLDC ceiling fans and OSRAM anti-glare recessed downlights.
          </p>
        </div>

        {/* Categories Toggles */}
        <div className="flex bg-[#0B0B0C] border border-[#3A3A3A] rounded p-1">
          {["All", "Ceiling Fan", "LED Downlight"].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded font-display transition-all cursor-pointer ${categoryFilter === cat ? 'bg-[#2DB39E] text-black' : 'text-[#9CA3AF] hover:text-white bg-transparent'}`}
            >
              {cat}s
            </button>
          ))}
        </div>
      </div>

      {/* BEST SELLING CHARTS SECTION */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Chart 1: Top 5 Best Selling Fans */}
        <div className="bg-[#0B0B0C] border border-[#3A3A3A] rounded-lg p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-semibold text-[#2DB39E] uppercase tracking-wider block font-mono">Performance Matrix</span>
              <h3 className="font-display font-medium text-sm text-white">Top 5 Best Selling Fans</h3>
            </div>
            <span className="text-[9px] font-mono text-[#9CA3AF] text-right">
              Renewed: {getRenewalDate()}<br />
              (Monthly Refresh)
            </span>
          </div>
          
          <div className="space-y-3 pt-2">
            {[
              { index: 1, name: "P1 Aero V2 Premium BLDC", volume: 74, max: 74, sku: "PO-AERO-52" },
              { index: 2, name: "Horizon Wind-Core Smart Fan", volume: 58, max: 74, sku: "PO-HORIZ-48" },
              { index: 3, name: "Zephyr Lite Pro Airflow", volume: 42, max: 74, sku: "PO-ZEPH-42" },
              { index: 4, name: "Vortex High-Torque Pro", volume: 31, max: 74, sku: "PO-VORT-56" },
              { index: 5, name: "Mistral Breeze Minimalist", volume: 19, max: 74, sku: "PO-MIST-36" }
            ].map(item => (
              <div key={item.sku} className="space-y-1">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-white font-sans font-medium flex items-center gap-1.5 truncate">
                    <span className="text-xs text-[#2DB39E] font-bold">#{item.index}</span>
                    {item.name} <span className="text-[10px] text-[#9CA3AF]">({item.sku})</span>
                  </span>
                  <span className="text-white font-bold">{item.volume} Units</span>
                </div>
                <div className="h-1.5 w-full bg-[#161617] overflow-hidden border border-[#3A3A3A] rounded-sm">
                  <div className="h-full bg-gradient-to-r from-[#2DB39E]/70 to-[#2DB39E] rounded-sm transition-all duration-500" style={{ width: `${(item.volume / item.max) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Top 5 Best Selling LED Light Models */}
        <div className="bg-[#0B0B0C] border border-[#3A3A3A] rounded-lg p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-semibold text-[#2DB39E] uppercase tracking-wider block font-mono">Performance Matrix</span>
              <h3 className="font-display font-medium text-sm text-white">Top 5 Best Selling LED Light Models</h3>
            </div>
            <span className="text-[9px] font-mono text-[#9CA3AF] text-right">
              Renewed: {getRenewalDate()}<br />
              (Monthly Refresh)
            </span>
          </div>
          
          <div className="space-y-3 pt-2">
            {[
              { index: 1, name: "OSRAM Calibrated Focus Recessed Downlight 9W", volume: 120, max: 120, sku: "PO-OSRAM-9W" },
              { index: 2, name: "LumenX Slim Fit Recessed Downlight 12W", volume: 98, max: 120, sku: "PO-LUMEN-12W" },
              { index: 3, name: "Raycore Recessed Anti-Glare Downlight 7W", volume: 85, max: 120, sku: "PO-RAY-7W" },
              { index: 4, name: "Prism Glow Tuneable Smart CCT 10W", volume: 64, max: 120, sku: "PO-PRISM-10W" },
              { index: 5, name: "Solis Prime Ultra-CRI95 Recessed Spotlight", volume: 41, max: 120, sku: "PO-SOLIS-8W" }
            ].map(item => (
              <div key={item.sku} className="space-y-1">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-white font-sans font-medium flex items-center gap-1.5 truncate">
                    <span className="text-xs text-[#2DB39E] font-bold">#{item.index}</span>
                    {item.name} <span className="text-[10px] text-[#9CA3AF]">({item.sku})</span>
                  </span>
                  <span className="text-white font-bold">{item.volume} Units</span>
                </div>
                <div className="h-1.5 w-full bg-[#161617] overflow-hidden border border-[#3A3A3A] rounded-sm">
                  <div className="h-full bg-gradient-to-r from-[#2DB39E]/70 to-[#2DB39E] rounded-sm transition-all duration-500" style={{ width: `${(item.volume / item.max) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {successMsg && (
        <div className="p-4 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] rounded text-xs gap-2 flex items-center font-mono font-semibold">
          <Check className="w-5 h-5 text-[#22C55E]" />
          <span>{successMsg}</span>
        </div>
      )}

      {moqWarning && (
        <div className="p-4 bg-[#E63946]/10 border border-[#E63946]/20 text-[#E63946] rounded text-xs gap-2 flex items-center font-mono">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{moqWarning}</span>
        </div>
      )}

      {/* DYNAMIC SAVINGS SIMULATOR AND CAMPAIGN CONTROLLER OVERVIEW */}
      <section className="bg-[#0B0B0C] border border-[#3A3A3A] rounded-lg p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 cols: slider simulator */}
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#2DB39E] font-mono uppercase tracking-wider">Dynamic B2B Calculator</span>
            <h3 className="font-display font-medium text-base text-white">Wholesale Volumetric Rebate Simulator</h3>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Drag the wholesale sliders to simulate potential bulk savings calculated across custom purchase arrays. Markdowns are based on your certified dealer tier ({retailer?.tier || "Standard"}) and active factory preorder rules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            
            {/* select SKU */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-[#9CA3AF] uppercase font-mono tracking-wider block">Target SKU Focus</label>
              <select
                value={selectedSimProduct?.id || ""}
                onChange={(e) => {
                  const match = products.find(p => p.id === e.target.value);
                  if (match) {
                    setSelectedSimProduct(match);
                    setSimulatorQty(match.moq);
                  }
                }}
                className="w-full h-11 bg-[#161617] border border-[#3A3A3A] rounded px-4 text-xs text-white focus:outline-none focus:border-[#2DB39E]"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.sku} &bull; {p.name}</option>
                ))}
              </select>
            </div>

            {/* Slider count */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono tracking-wider uppercase font-semibold text-[#9CA3AF]">
                <span>Purchase Volume Density</span>
                <span className="text-[#2DB39E]">{simulatorQty} Units</span>
              </div>
              <input
                type="range"
                min={selectedSimProduct?.moq || 5}
                max={150}
                value={simulatorQty}
                onChange={(e) => setSimulatorQty(Number(e.target.value))}
                className="w-full h-2 rounded-full bg-[#161617] appearance-none cursor-pointer accent-[#2DB39E] border border-[#3A3A3A]"
              />
            </div>

          </div>
        </div>

        {/* Right col: readout parameters */}
        <div className="bg-[#161617] border border-[#3A3A3A] rounded-lg p-5 space-y-4 font-mono flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[11px] text-[#2DB39E] font-semibold uppercase tracking-wider block">Rebate Summary Sheet</span>
            
            <div className="flex justify-between text-xs text-[#9CA3AF]">
              <span>Base List Wholesale:</span>
              <span className="text-white">S$ {selectedSimProduct?.wholesalePrice.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-xs text-[#9CA3AF]">
              <span>Volume Discount Rate:</span>
              <span className="text-[#2DB39E] font-semibold">-{simResult.pct}% ({retailer?.tier || "Standard"} Category)</span>
            </div>

            <div className="h-px bg-[#3A3A3A] my-2"></div>

            <div className="flex justify-between text-xs text-[#9CA3AF]">
              <span>Gross Catalog Total:</span>
              <span className="text-white font-semibold">S$ {simResult.grossTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-white font-bold">Net Payable Price:</span>
              <span className="text-[#2DB39E] font-bold text-base">S$ {simResult.discountedTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#3A3A3A]/60 flex justify-between items-center text-[10px]">
            <span className="text-[#22C55E] flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Simulated Savings:
            </span>
            <span className="text-[#22C55E] font-bold">S$ {simResult.netSavings.toFixed(2)} SGD</span>
          </div>
        </div>

      </section>

      {/* CATALOG Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map(p => {
          const addedCount = cartItems[p.id] || 0;
          return (
            <div
              key={p.id}
              className="bg-[#0B0B0C] border border-[#3A3A3A] rounded-lg overflow-hidden flex flex-col justify-between hover:border-[#2DB39E] transition-all group"
            >
              
              {/* Product Visual Photo */}
              <div className="h-44 relative bg-black overflow-hidden border-b border-[#3A3A3A]">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                />
                
                {/* Preorder visual tag */}
                {p.isPreOrder ? (
                  <span className="absolute top-3 left-3 text-[9px] font-mono tracking-widest uppercase font-bold bg-[#2DB39E] text-black px-2.5 py-1 rounded">
                    PRE-ORDER campaign -{p.preOrderDiscount}%
                  </span>
                ) : (
                  <span className="absolute top-3 left-3 text-[9px] font-mono tracking-widest uppercase font-bold bg-[#161617]/90 text-[#9CA3AF] border border-[#3A3A3A] px-2.5 py-1 rounded">
                    IN STOCK
                  </span>
                )}

                {/* Categories */}
                <span className="absolute bottom-3 right-3 text-[9px] font-mono uppercase bg-black/80 text-white px-2 py-0.5 border border-[#3A3A3A] rounded">
                  {p.category}
                </span>
              </div>

              {/* Product Info Description */}
              <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-[#9CA3AF] group-hover:text-[#2DB39E] transition-all">{p.sku}</span>
                  <h3 className="font-display font-medium text-sm text-white line-clamp-1 group-hover:text-white">{p.name}</h3>
                  <p className="text-[11px] text-[#9CA3AF] line-clamp-2 text-justify select-text leading-relaxed">{p.description}</p>
                </div>

                {/* Sub specs list */}
                <div className="bg-[#161617] border border-[#3A3A3A] rounded p-2.5 text-[10px] font-mono text-[#9CA3AF] space-y-1">
                  <div className="flex justify-between">
                    <span>Power Wattage:</span>
                    <span className="text-white">{p.technicalSpecs.wattage}</span>
                  </div>
                  {p.category === "Ceiling Fan" ? (
                    <>
                      <div className="flex justify-between">
                        <span>Speed Span:</span>
                        <span className="text-white">{p.technicalSpecs.rpmRange}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Blade Spec:</span>
                        <span className="text-white">{p.technicalSpecs.blades}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Luminous Core:</span>
                        <span className="text-white">{p.technicalSpecs.lumens}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Apex Beam:</span>
                        <span className="text-white">{p.technicalSpecs.beamAngle}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Pricing Block */}
                <div className="pt-2 border-t border-[#3A3A3A]/50 flex justify-between items-baseline">
                  <div>
                    <span className="text-[9px] font-mono text-[#9CA3AF] block uppercase leading-none">Distributor Base</span>
                    <span className="font-mono text-sm text-white font-bold">S$ {p.wholesalePrice.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-[#9CA3AF] block uppercase leading-none">SRP Listed</span>
                    <span className="font-mono text-xs text-[#9CA3AF] line-through">S$ {p.basePrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Form quantity append selectors */}
                <div className="pt-3 flex items-center gap-2 border-t border-[#3A3A3A]/40">
                  
                  {/* Selector */}
                  <div className="w-1/3 space-y-1">
                    <span className="text-[9px] font-mono text-[#9CA3AF] block leading-none">Vol Qty</span>
                    <input
                      type="number"
                      min={1}
                      value={quantities[p.id] || p.moq}
                      onChange={(e) => handleQtyChange(p.id, Number(e.target.value))}
                      className="w-full h-9 bg-[#161617] border border-[#3A3A3A] focus:border-[#2DB39E] text-center text-xs text-white rounded font-mono"
                    />
                  </div>

                  {/* Submit item */}
                  <div className="flex-1 pt-3.5">
                    <button
                      type="button"
                      onClick={() => handleAppendToCart(p)}
                      className="w-full h-9 bg-[#2DB39E]/10 border border-[#2DB39E]/2 w-fit text-[#2DB39E] hover:bg-[#2DB39E] hover:text-black rounded text-xs font-semibold flex items-center justify-center gap-1 transition-all font-display shadow cursor-pointer uppercase tracking-wider"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Append ({addedCount})
                    </button>
                  </div>
                </div>

                {/* moq disclaimer badge */}
                <div className="text-[9px] font-mono text-[#9CA3AF] text-center pt-1 leading-none">
                  * Minimum MOQ required for check: <span className="text-white font-semibold">{p.moq} units</span>
                </div>

              </div>

              {/* Spec sheet PDF Link Button */}
              <a
                href={p.specSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-2.5 bg-[#161617] border-t border-[#3A3A3A] text-[10px] font-mono text-[#2DB39E] hover:bg-[#2DB39E]/10 transition-all flex items-center justify-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" /> Download Technical PDF Spec Sheet
              </a>

            </div>
          );
        })}
      </div>

    </div>
  );
}
