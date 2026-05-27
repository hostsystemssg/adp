import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ListTodo, Check, FileCheck, Landmark, UploadCloud, Info, CheckCircle, AlertTriangle, Hammer, RefreshCw } from "lucide-react";
import { Order } from "../db/dbStore";

interface OrdersProps {
  token: string | null;
  user: any;
  retailer: any;
}

export default function Orders({ token, user, retailer }: OrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        if (data.data.length > 0 && !selectedOrder) {
          setSelectedOrder(data.data[0]);
        }
      }
    } catch (e) {
      setError("Failed to extract order registry ledger.");
    }
  };

  const handleSelectOrder = async (orderId: string) => {
    setError(null);
    setUploadMsg(null);
    setReceiptBase64(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedOrder(data.data);
      }
    } catch (e) {
      setError("Failed to read order details.");
    }
  };

  // Simulate file choice via base64 for fast review without real servers setup
  const handleSimulateReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setUploadMsg(null);
    
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedOrder) {
      setError("No active order selected.");
      return;
    }

    setLoading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setReceiptBase64(base64String);

        // Send base64 to server endpoint to write to order record
        const res = await fetch(`/api/orders/${selectedOrder.id}/payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ receiptUrl: base64String })
        });
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to catalog deposit slip.");
        }

        setUploadMsg("Compliance verified: Bank receipt proof uploaded successfully. Point One finance team alerted.");
        fetchOrders();
        setSelectedOrder(data.data);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || "Failed to commit upload sequence.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn text-[#F3F4F6]">
      
      {/* Title */}
      <div className="border-b border-[#3A3A3A] pb-6">
        <h1 className="font-display font-medium text-2xl sm:text-3xl text-white">Distributor Orders ledger</h1>
        <p className="text-xs sm:text-sm text-[#9CA3AF]">
          Review secure volume orders, browse tax invoices, and upload FAST/GIRO wire receipts to clear accounts.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-[#E63946]/10 border border-[#E63946]/20 rounded text-xs gap-2 flex items-start font-mono text-[#E63946]">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-[#0B0B0C] border border-[#3A3A3A] rounded-lg p-6 space-y-4">
          <ListTodo className="w-12 h-12 text-[#9CA3AF] mx-auto animate-pulse" />
          <h3 className="font-display font-semibold text-white">No custom B2B orders found</h3>
          <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto leading-relaxed">
            You haven't logged any volume procurement lines on your business representatives accounts yet.
          </p>
          <Link
            to="/portal/catalog"
            className="inline-flex px-5 py-2.5 bg-[#2DB39E] text-black font-semibold text-xs sm:text-sm rounded hover:bg-[#2DB39E]/90 transition-all font-display mt-2"
          >
            Create First wholesale order
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 1 COL: orders list */}
          <div className="space-y-3 lg:col-span-1">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2">Submitted Orders ledger ({orders.length})</h4>
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {orders.map(o => {
                const isSel = selectedOrder?.id === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => handleSelectOrder(o.id)}
                    className="w-full text-left p-4 bg-[#0B0B0C] border rounded-lg transition-all space-y-2 group block cursor-pointer"
                    style={{ borderColor: isSel ? "#2DB39E" : "#3A3A3A" }}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono text-white font-bold group-hover:text-[#2DB39E] transition-colors">{o.id}</span>
                      <span className="text-[10px] font-mono text-[#9CA3AF]">{o.createdAt.split("T")[0]}</span>
                    </div>

                    <div className="flex justify-between items-baseline font-mono">
                      <span className="text-[11px] text-[#9CA3AF]">Value (Tax Exc):</span>
                      <span className="text-xs text-[#2DB39E] font-bold">S$ {o.totalAmount.toFixed(2)}</span>
                    </div>

                    <div className="pt-2 border-t border-[#3A3A3A]/40 flex justify-between items-center text-[10px]">
                      <span className="font-mono text-[#9CA3AF]">Ref: {o.procurementRef}</span>
                      <span
                        className="px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wide border font-semibold"
                        style={{
                          backgroundColor: o.status === "Dispatched" || o.status === "Payment Verified" ? "rgba(34,197,94,0.1)" : "rgba(251,191,36,0.1)",
                          color: o.status === "Dispatched" || o.status === "Payment Verified" ? "#22C55E" : "#FBBF24",
                          borderColor: o.status === "Dispatched" || o.status === "Payment Verified" ? "#22C55E" : "#FBBF24"
                        }}
                      >
                        {o.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT 2 COLS: selected order details + payment tools */}
          <div className="lg:col-span-2 space-y-6">
            {selectedOrder && (
              <div className="bg-[#0B0B0C] border border-[#3A3A3A] rounded-lg p-5 sm:p-6 space-y-6">
                
                {/* Details top */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#3A3A3A] pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-[#9CA3AF] block leading-none">ORDER ID KEY</span>
                    <h3 className="font-display font-medium text-lg text-white font-mono mt-1">{selectedOrder.id}</h3>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">Purchased on {new Date(selectedOrder.createdAt).toLocaleString()} &middot; Ref: <span className="font-mono text-white uppercase">{selectedOrder.procurementRef}</span></p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-[#9CA3AF] block uppercase leading-none">Transaction Stage</span>
                    <span
                      className="inline-block mt-1 px-3 py-0.5 rounded-full font-mono text-[10px] uppercase font-bold border"
                      style={{
                        backgroundColor: selectedOrder.status === "Dispatched" || selectedOrder.status === "Payment Verified" ? "rgba(34,197,94,0.1)" : "rgba(251,191,36,0.1)",
                        color: selectedOrder.status === "Dispatched" || selectedOrder.status === "Payment Verified" ? "#22C55E" : "#FBBF24",
                        borderColor: selectedOrder.status === "Dispatched" || selectedOrder.status === "Payment Verified" ? "#22C55E" : "#FBBF24"
                      }}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>

                {uploadMsg && (
                  <div className="p-4 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] rounded text-xs gap-2 flex items-center font-mono font-semibold">
                    <Check className="w-5 h-5 text-[#22C55E]" />
                    <span>{uploadMsg}</span>
                  </div>
                )}

                {/* Sub details lists items */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#9CA3AF]">Ordered SKU Summary</h4>
                  
                  <div className="divide-y divide-[#3A3A3A]/50 bg-[#161617]/50 rounded-lg p-3 sm:p-4 border border-[#3A3A3A]/40 space-y-3">
                    {selectedOrder.items.map(item => (
                      <div key={item.id} className="pt-3 first:pt-0 flex justify-between items-baseline text-xs">
                        <div>
                          <span className="text-white font-semibold font-display block">Product SKU Code: &bull;&bull;&bull;</span>
                          <span className="text-[10px] font-mono text-[#9CA3AF] block mt-0.5">Quantity: <span className="text-white">{item.qty} units</span> &middot; Code Applied: {item.discountApplied}% off</span>
                        </div>
                        <div className="text-right font-mono font-semibold text-white">
                          S$ {item.totalPrice.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment values blocks */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#161617]/40 p-4 rounded border border-[#3A3A3A]/40">
                  <div className="font-mono text-xs">
                    <span className="text-[10px] text-[#9CA3AF] block leading-none">Gross Subtotal:</span>
                    <span className="text-white block mt-1 font-semibold">S$ {selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="font-mono text-xs">
                    <span className="text-[10px] text-[#9CA3AF] block leading-none">Campaign Rebates:</span>
                    <span className="text-[#2DB39E] block mt-1 font-semibold">S$ {selectedOrder.discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="font-mono text-xs">
                    <span className="text-[10px] text-[#2DB39E] block leading-none uppercase font-bold">Net Total Payable:</span>
                    <span className="text-[#2DB39E] block mt-1 font-bold text-base">S$ {selectedOrder.totalAmount.toFixed(2)} SGD</span>
                  </div>
                </div>

                {/* Secure wire upload block */}
                <div className="border-t border-[#3A3A3A]/60 pt-5 space-y-4">
                  <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-[#2DB39E]" /> Offline Wire Audit Trail (PDPA Verified Upload)
                  </h4>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed text-justify">
                    Submit a clear photographic record of your inter-bank FAST wire transfer slip or corporate PayNow confirmation. Point One's corporate credit lines undergo real-time ledger audits based on receipt timestamps.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    
                    {/* Receipts previews */}
                    <div className="w-full sm:w-1/3 aspect-[4/3] bg-black border border-[#3A3A3A] rounded-lg flex items-center justify-center p-3 overflow-hidden text-center text-[10px] text-[#9CA3AF] font-mono uppercase">
                      {selectedOrder.receiptUrl ? (
                        <img src={selectedOrder.receiptUrl} alt="Receipt Preview" className="w-full h-full object-contain" />
                      ) : (
                        <span>[No deposit receipt compiled yet]</span>
                      )}
                    </div>

                    {/* Inputs uploads */}
                    <div className="flex-1 w-full space-y-3">
                      <label className="block w-full h-[60px] bg-[#161617] border border-dashed border-[#3A3A3A] hover:border-[#2DB39E] transition-all rounded-lg flex items-center justify-center cursor-pointer text-xs font-semibold font-display gap-2">
                        <UploadCloud className="w-5 h-5 text-[#2DB39E]" />
                        {loading ? "Compressing base64 string..." : "Select & Upload Wire proof Receipt"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSimulateReceiptUpload}
                          disabled={loading}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[9px] font-mono text-[#9CA3AF] leading-none block text-center">Supports high-res PNG, JPEG receipt logs under 10MB limits.</span>
                    </div>

                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
