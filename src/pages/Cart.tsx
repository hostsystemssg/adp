import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, ArrowLeft, Trash2, CheckCircle, Info, Calculator, FileWarning } from "lucide-react";
import { Product } from "../db/dbStore";

interface CartProps {
  token: string | null;
  retailer: any;
  cartItems: { [id: string]: number };
  onUpdateQty: (pId: string, val: number) => void;
  onRemoveItem: (pId: string) => void;
  onClearCart: () => void;
}

export default function Cart({ token, retailer, cartItems, onUpdateQty, onRemoveItem, onClearCart }: CartProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [procRef, setProcRef] = useState(() => "REF-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(1000 + Math.random() * 9000));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/catalog");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (e) {
      setError("Failed to fetch product profiles.");
    }
  };

  // Compile full cart contents
  const populatedItems = Object.entries(cartItems)
    .map(([pId, qty]) => {
      const p = products.find(prod => prod.id === pId);
      return p ? { product: p, qty } : null;
    })
    .filter((v): v is { product: Product; qty: number } => v !== null);

  const calculateCartDetails = () => {
    let rawSubtotal = 0;
    let netDiscount = 0;
    let hasMOQShortfall = false;
    let shortfallSKU = "";

    // Tier Discounts Mapping Table
    const tierMults = {
      "Standard": 1.00,
      "Silver": 0.95,
      "Gold": 0.90,
      "Platinum": 0.85
    };
    const multiplier = tierMults[retailer?.tier as keyof typeof tierMults] || 1.00;

    populatedItems.forEach(item => {
      const rawPriceAmount = item.product.wholesalePrice * item.qty;
      rawSubtotal += rawPriceAmount;

      // MOQ shortfall
      if (item.qty < item.product.moq) {
        hasMOQShortfall = true;
        shortfallSKU = item.product.sku;
      }

      // Discount calculation (preorder gets pre-order discount percentage, normal gets tier percentage)
      let customDiscountPct = 0;
      if (item.product.isPreOrder) {
        customDiscountPct = item.product.preOrderDiscount;
      } else {
        customDiscountPct = Math.round((1 - multiplier) * 100);
      }

      const exactDiscountAmount = rawPriceAmount * (customDiscountPct / 100);
      netDiscount += exactDiscountAmount;
    });

    const netTotal = rawSubtotal - netDiscount;

    return {
      rawSubtotal: Number(rawSubtotal.toFixed(2)),
      netDiscount: Number(netDiscount.toFixed(2)),
      netTotal: Number(netTotal.toFixed(2)),
      hasMOQShortfall,
      shortfallSKU
    };
  };

  const totals = calculateCartDetails();

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (populatedItems.length === 0) return;

    if (!procRef.trim()) {
      setError("Distributor reference parameter missing: Please define a Procurement Reference / PO Number before submit.");
      return;
    }

    if (totals.hasMOQShortfall) {
      setError(`MOQ Shortfall Flag: Please correct your quantities before submitting. Minimum order boundaries must clear standard parameters.`);
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        procurementRef: procRef,
        items: populatedItems.map(item => ({
          productId: item.product.id,
          qty: item.qty
        }))
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to finalize B2B checkout.");
      }

      setSuccess(`Wholesale procurement order successfully generated with ID: ${data.data.id}. Processing invoicing streams...`);
      onClearCart();
      setTimeout(() => {
        navigate("/portal/orders");
      }, 3500);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during checkout.");
    } finally {
      setLoading(false);
    }
  };

  if (populatedItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center space-y-6 text-[#F3F4F6] animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-[#161617] border border-[#3A3A3A] text-[#9CA3AF] flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-display font-medium text-xl text-white">Your wholesale cart is empty</h2>
        <p className="text-xs sm:text-sm text-[#9CA3AF] max-w-sm mx-auto leading-relaxed">
          Explore our product catalogs to populate your order. Brushless DC electric fans require minimum 5 items for tier pricing.
        </p>
        <Link
          to="/portal/catalog"
          className="inline-flex px-6 py-2.5 bg-[#2DB39E] text-black font-semibold text-xs sm:text-sm rounded hover:bg-[#2DB39E]/95 transition-all font-display mt-2"
        >
          Browse Dealer Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-fadeIn text-[#F3F4F6]">
      
      {/* Title */}
      <div className="border-b border-[#3A3A3A] pb-6">
        <Link to="/portal/catalog" className="text-xs text-[#2DB39E] flex items-center gap-1.5 hover:underline font-mono mb-2 uppercase">
          <ArrowLeft className="w-4 h-4" /> Back to Product Catalogs
        </Link>
        <h1 className="font-display font-medium text-2xl sm:text-3xl text-white">Wholesale Cart Overview</h1>
      </div>

      {error && (
        <div className="p-4 bg-[#E63946]/10 border border-[#E63946]/25 rounded text-xs gap-2 flex items-start font-mono text-[#E63946] leading-relaxed">
          <FileWarning className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-[#22C55E]/10 border border-[#22C55E]/25 text-[#22C55E] rounded text-xs gap-2.5 flex items-start font-mono font-semibold">
          <CheckCircle className="w-5 h-5 shrink-0 text-[#22C55E] animate-bounce" />
          <span>{success}</span>
        </div>
      )}

      {/* Cart lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left cols: items list */}
        <div className="lg:col-span-2 space-y-4">
          {populatedItems.map(item => {
            const isShortfallList = item.qty < item.product.moq;
            return (
              <div
                key={item.product.id}
                className="bg-[#0B0B0C] border border-[#3A3A3A] rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Photo details */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded bg-black overflow-hidden border border-[#3A3A3A] flex-shrink-0">
                    <img src={item.product.imageUrl} alt={item.product.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#9CA3AF] block leading-none">{item.product.sku}</span>
                    <h4 className="font-display font-semibold text-xs sm:text-sm text-white mt-1">{item.product.name}</h4>
                    <span className="text-[10px] font-mono text-[#2DB39E] block mt-0.5">
                      Base rate: S$ {item.product.wholesalePrice.toFixed(2)} &middot; MOQ: <span className="text-white">{item.product.moq}</span>
                    </span>
                  </div>
                </div>

                {/* Adjustments */}
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                  
                  {/* Quantity selector */}
                  <div className="flex items-center bg-[#161617] border border-[#3A3A3A] rounded h-9">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.product.id, Math.max(1, item.qty - 1))}
                      className="px-2.5 text-xs text-[#9CA3AF] hover:text-white transition-all bg-transparent h-full"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => onUpdateQty(item.product.id, Math.max(1, Number(e.target.value)))}
                      className="w-12 h-full text-center text-xs text-white bg-transparent outline-none focus:none border-x border-[#3A3A3A] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.product.id, item.qty + 1)}
                      className="px-2.5 text-xs text-[#9CA3AF] hover:text-white transition-all bg-transparent h-full"
                    >
                      +
                    </button>
                  </div>

                  {/* Pricing read-out */}
                  <div className="text-right font-mono text-xs shrink-0 pl-2">
                    <span className="text-white font-bold block">S$ {(item.product.wholesalePrice * item.qty).toFixed(2)}</span>
                    {isShortfallList ? (
                      <span className="text-[#E63946] text-[9px] block font-mono font-semibold">Under MOQ ({item.product.moq} required)</span>
                    ) : (
                      <span className="text-[#2DB39E] text-[9px] block">Clearing MOQ Bounds</span>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="p-2 text-[#9CA3AF] hover:text-[#E63946] transition-all bg-transparent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>

              </div>
            );
          })}

          <div className="flex justify-end pt-2">
            <button
              onClick={onClearCart}
              className="text-[#9CA3AF] hover:text-[#E63946] text-xs font-mono flex items-center gap-1 bg-transparent cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Empty Procurement Cart
            </button>
          </div>
        </div>

        {/* Right col: checkout actions card */}
        <div className="space-y-4">
          
          <form onSubmit={handleCheckout} className="bg-[#0B0B0C] border border-[#3A3A3A] rounded-lg p-5 space-y-6 shadow-md">
            
            <h3 className="font-display font-medium text-base text-white">Distributor Accounts Invoicing</h3>
            
            {/* Reference No. */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider font-mono">Reference No.</label>
              <input
                type="text"
                required
                readOnly
                placeholder="Reference No."
                value={procRef}
                className="w-full h-11 bg-[#161617] border border-[#3A3A3A] rounded px-4 text-xs text-white focus:outline-none focus:border-[#2DB39E] font-mono uppercase cursor-not-allowed opacity-80"
              />
              <span className="text-[10px] text-[#9CA3AF] leading-none block pt-0.5">Auto-generated reference secure token for wire clearance audits.</span>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 pt-2 border-t border-[#3A3A3A]/60 font-mono text-xs">
              
              <div className="flex justify-between text-[#9CA3AF]">
                <span>Distributor Base Subtotal:</span>
                <span className="text-white">S$ {totals.rawSubtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-[#9CA3AF]">
                <span>Volume Tier/Preorder Rebates:</span>
                <span className="text-[#2DB39E] font-bold">-{retailer?.tier === "Standard" ? "0%" : "Volume Rebate"} (S$ {totals.netDiscount.toFixed(2)} SGD)</span>
              </div>

              <div className="h-px bg-[#3A3A3A] my-2"></div>

              <div className="flex justify-between font-bold text-sm">
                <span className="text-white font-display">Net Payable (Tax Exc):</span>
                <span className="text-[#2DB39E]">S$ {totals.netTotal.toFixed(2)} SGD</span>
              </div>

              {retailer?.status !== "Approved" && (
                <div className="p-3 bg-[#E63946]/5 border border-[#E63946]/15 rounded text-[10px] text-[#E63946] leading-relaxed">
                  ⚠️ Notice: Your reseller application remains pending review. Automated checkouts are locked until administrative approval is verified.
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || populatedItems.length === 0 || totals.hasMOQShortfall || retailer?.status !== "Approved"}
              className={`w-full h-11 font-semibold text-sm rounded flex items-center justify-center gap-1.5 transition-all font-display ${
                loading || totals.hasMOQShortfall || retailer?.status !== "Approved"
                  ? 'bg-[#161617] border border-[#3A3A3A] text-[#9CA3AF] cursor-not-allowed'
                  : 'bg-[#2DB39E] text-black hover:bg-[#2DB39E]/90 hover:scale-[1.01] shadow-lg shadow-[#2DB39E]/10 cursor-pointer'
              }`}
            >
              <Calculator className="w-4 h-4" />
              {loading ? "Registering order logs..." : "Submit B2B Procurement Order"}
            </button>

          </form>

          {/* Guidelines info */}
          <div className="p-4 bg-[#161617]/50 border border-[#3A3A3A] rounded text-[11px] text-[#9CA3AF] leading-relaxed space-y-1">
            <span className="text-white font-semibold flex items-center gap-1 mb-1 font-mono uppercase tracking-wider text-[10px]">
              <Info className="w-3.5 h-3.5 text-[#2DB39E]" /> Offline Invoice Covenants:
            </span>
            <p>Point One portal operates an offline transaction desk. On order submittal, inventory blocks are secured. A GST corporate tax invoice will be signaled to your corporate mailbox, with FAST payment guidelines detailed inside.</p>
          </div>

        </div>

      </div>

    </div>
  );
}
