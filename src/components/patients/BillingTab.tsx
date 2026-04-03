"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Receipt, FileText, CreditCard } from "lucide-react";
import { billingAPI, paymentAPI, visitAPI } from "@/lib/api";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { printHtml } from "@/lib/print";

// Utility: print a bill object as an A5 receipt
function printBill(bill: any, title = "WAFAA MEDICAL", subtitle = "Invoice / Receipt") {
  if (!bill) return;
  const itemsHtml = (bill.items || []).map((item: any) => {
    const qtyMatch = item.name.match(/(\(Qty: (\d+)\))/);
    const nameOnly = item.name.replace(/\s*\(Qty: \d+\)/, "").replace(/^Med: /, "").replace(/^Lab: /, "");
    const qty = qtyMatch ? qtyMatch[2] : (item.quantity || 1);
    return `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px;">
        <span style="flex:1;text-transform:uppercase;font-weight:600;font-size:11px;color:#0f172a;">${nameOnly}</span>
        <div style="display:flex;gap:16px;width:80px;justify-content:space-between;flex-shrink:0;">
          <span style="width:24px;text-align:center;color:#64748b;font-size:11px;">${qty}</span>
          <span style="flex:1;text-align:right;font-weight:700;font-size:11px;">${parseFloat(item.amount).toLocaleString()}</span>
        </div>
      </div>`;
  }).join("");

  const total = parseFloat(bill.grand_total) - parseFloat(bill.discount_amount || 0);
  const date = new Date(bill.created_at).toLocaleDateString();
  const time = new Date(bill.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const html = `
    <div style="max-width:148mm;margin:0 auto;padding:12mm 10mm;font-family:monospace;font-size:12px;color:#1e293b;background:white;">
      <div style="text-align:center;margin-bottom:16px;">
        <img src="/wafaa_logo.jpeg" alt="Logo" style="height:56px;width:auto;object-fit:contain;display:block;margin:0 auto 6px;" />
        <h2 style="font-size:16px;font-weight:900;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 2px;">${title}</h2>
        <p style="font-size:9px;font-weight:700;text-transform:uppercase;color:#64748b;margin:0 0 2px;">${subtitle}</p>
        <p style="font-size:10px;margin:0;">Nairobi, Kenya</p>
        <p style="font-size:10px;margin:2px 0 0;">Tel: +254 700 000 000</p>
      </div>

      <div style="border-top:1px dashed #cbd5e1;margin:12px 0;"></div>

      <div style="font-size:10px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>DATE:</span><span>${date} ${time}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>REF NO:</span><span style="font-weight:700;">#${bill.id || bill.visit_id || "N/A"}</span></div>
        <div style="display:flex;justify-content:space-between;"><span>PATIENT:</span><span style="font-weight:700;">${bill.patient_name || bill.patient?.name || "WALK-IN"}</span></div>
      </div>

      <div style="border-top:1px dashed #cbd5e1;margin:12px 0;"></div>

      <div style="display:flex;justify-content:space-between;font-weight:900;font-size:9px;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:8px;color:#64748b;">
        <span style="flex:1;">ITEM</span>
        <div style="display:flex;gap:16px;width:80px;justify-content:space-between;">
          <span style="width:24px;text-align:center;">QTY</span>
          <span style="flex:1;text-align:right;">PRICE</span>
        </div>
      </div>

      ${itemsHtml}

      <div style="border-top:1px dashed #cbd5e1;margin:12px 0;"></div>

      <div>
        <div style="display:flex;justify-content:space-between;font-weight:700;font-size:13px;margin-bottom:4px;"><span>SUB TOTAL</span><span>KSh ${parseFloat(bill.grand_total).toLocaleString()}</span></div>
        ${parseFloat(bill.discount_amount || 0) > 0 ? `<div style="display:flex;justify-content:space-between;font-size:10px;color:#64748b;font-style:italic;margin-bottom:4px;"><span>DISCOUNT</span><span>- ${parseFloat(bill.discount_amount).toLocaleString()}</span></div>` : ""}
        <div style="display:flex;justify-content:space-between;font-weight:900;font-size:16px;border-top:2px solid #0f172a;padding-top:8px;margin-top:4px;"><span>TOTAL</span><span>KSh ${total.toLocaleString()}</span></div>
      </div>

      <div style="border-top:1px dashed #cbd5e1;margin:12px 0;"></div>

      <div style="font-size:10px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>TENDERED:</span><span>${parseFloat(bill.paid_amount || 0).toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between;font-weight:700;color:#dc2626;border-top:1px solid #f1f5f9;padding-top:4px;margin-top:4px;"><span>BALANCE DUE:</span><span>${parseFloat(bill.balance_amount || 0).toLocaleString()}</span></div>
      </div>

      <div style="border-top:1px dashed #cbd5e1;margin:16px 0;"></div>

      <div style="text-align:center;">
        <p style="font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0;">THANK YOU!</p>
        <p style="font-size:9px;margin:4px 0 0;">WISH YOU A QUICK RECOVERY</p>
      </div>
    </div>
  `;

  printHtml(html, "A5", `@page { size: A5 portrait; margin: 0; }`);
}

export const ThermalReceipt = ({ bill, title = "WAFAA MEDICAL", subtitle = "Quality Healthcare Services" }: { bill: any, title?: string, subtitle?: string }) => {
  if (!bill) return null;
  return (
    <div className="bg-white p-6 md:p-8 font-mono text-sm border-2 border-slate-100 shadow-inner max-w-[340px] mx-auto my-4 text-slate-800 leading-tight">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold uppercase tracking-tight mb-1">{title}</h2>
        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">{subtitle}</p>
        <p className="text-xs">Nairobi, Kenya</p>
        <p className="text-xs">Tel: +254 700 000 000</p>
      </div>

      <div className="border-t border-dashed border-slate-300 my-4" />

      <div className="space-y-1 text-[11px] mb-4">
        <div className="flex justify-between">
          <span>DATE:</span>
          <span>{new Date(bill.created_at).toLocaleDateString()} {new Date(bill.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex justify-between">
          <span>REF NO:</span>
          <span className="font-bold">#{bill.id || bill.visit_id || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span>PATIENT:</span>
          <span className="truncate max-w-[120px] font-bold">{bill.patient_name || bill.patient?.name || 'WALK-IN'}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-slate-300 my-4" />

      <div className="flex justify-between font-bold text-[10px] uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
        <span className="flex-1 text-slate-500">ITEM</span>
        <div className="flex gap-4 w-24 justify-between text-slate-500">
          <span className="w-8 text-center">QTY</span>
          <span className="flex-1 text-right">PRICE</span>
        </div>
      </div>

      <div className="space-y-3 text-[11px]">
        {bill.items?.map((item: any, i: number) => {
          const qtyMatch = item.name.match(/\(Qty: (\d+)\)/);
          const nameOnly = item.name.replace(/\s*\(Qty: \d+\)/, "").replace(/^Med: /, "").replace(/^Lab: /, "");
          const qty = qtyMatch ? qtyMatch[1] : (item.quantity || 1);

          return (
            <div key={i} className="flex justify-between items-start gap-2">
              <span className="flex-1 uppercase break-words leading-tight text-slate-900 font-medium">
                {nameOnly}
              </span>
              <div className="flex gap-4 w-24 justify-between items-baseline flex-shrink-0">
                <span className="w-8 text-center text-slate-600">{qty}</span>
                <span className="flex-1 text-right font-bold text-slate-900">
                  {parseFloat(item.amount).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-dashed border-slate-300 my-4" />

      <div className="space-y-1.5">
        <div className="flex justify-between font-bold text-sm">
          <span>SUB TOTAL</span>
          <span>KSh {parseFloat(bill.grand_total).toLocaleString()}</span>
        </div>
        {parseFloat(bill.discount_amount) > 0 && (
          <div className="flex justify-between text-[11px] font-medium text-slate-500 italic">
            <span>DISCOUNT</span>
            <span>- {parseFloat(bill.discount_amount).toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-lg pt-2 border-t border-slate-900 mt-2">
          <span>TOTAL</span>
          <span>KSh {(parseFloat(bill.grand_total) - parseFloat(bill.discount_amount)).toLocaleString()}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-slate-300 my-4" />

      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>TENDERED:</span>
          <span>{parseFloat(bill.paid_amount || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold border-t border-slate-100 pt-1 mt-1 text-red-600">
          <span>BALANCE DUE:</span>
          <span>{parseFloat(bill.balance_amount || 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-slate-300 my-6" />

      <div className="text-center space-y-2">
        <p className="font-bold text-xs uppercase tracking-widest">THANK YOU!</p>
        <p className="text-[10px]">WISH YOU A QUICK RECOVERY</p>
        <div className="mt-4 flex justify-center opacity-70">
          <div className="h-8 w-48 bg-[repeating-linear-gradient(90deg,black,black_2px,transparent_2px,transparent_4px)]"></div>
        </div>
      </div>
    </div>
  );
};

export default function BillingTab({ patientId }: { patientId: number }) {
  const [bills, setBills] = useState<any[]>([]);
  const [historyBills, setHistoryBills] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isInvoicePrintOpen, setIsInvoicePrintOpen] = useState(false);
  const [selectedVisitForReceipt, setSelectedVisitForReceipt] = useState<any>(null);

  const [paymentData, setPaymentData] = useState({
    amount: "",
    payment_method: "cash",
    transaction_reference: "",
    discount_amount: "0",
    discount_type: "fixed" as "fixed" | "percentage"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const pendingResponse = await billingAPI.list({ status: 'pending,partial', patient_id: patientId });
      setBills(pendingResponse.data || []);

      const historyResponse = await billingAPI.list({ status: 'paid', patient_id: patientId });
      setHistoryBills(historyResponse.data || []);

      const visitsResponse = await visitAPI.list({ 'filter[patient_id]': patientId, include: 'bills.items' });
      setVisits(visitsResponse.data || []);
    } catch (err) {
      console.error("Failed to fetch billing data", err);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenPayment = (bill: any) => {
    setSelectedBill(bill);
    setPaymentData({
      amount: bill.balance_amount,
      payment_method: "cash",
      transaction_reference: "",
      discount_amount: "0",
      discount_type: "fixed"
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    setIsSubmitting(true);
    try {
      await paymentAPI.store(selectedBill.id, paymentData);
      toast.success("Payment processed successfully!");
      setIsPaymentModalOpen(false);
      fetchData();
    } catch (err) {
      // Interceptor handles error
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateCumulativeReceipt = (visit: any) => {
    // Generate a pseudo-bill combining all child bills
    const allBills = visit.bills || [];
    const paidBills = allBills.filter((b: any) => b.status === "paid" || parseFloat(b.paid_amount) > 0);

    let combinedItems: any[] = [];
    let grandTotal = 0;
    let paidAmount = 0;
    let balanceAmount = 0;
    let discountAmount = 0;

    paidBills.forEach((b: any) => {
      grandTotal += parseFloat(b.grand_total);
      paidAmount += parseFloat(b.paid_amount);
      balanceAmount += parseFloat(b.balance_amount);
      discountAmount += parseFloat(b.discount_amount);
      if (b.items) combinedItems = [...combinedItems, ...b.items];
    });

    return {
      id: visit.id,
      created_at: visit.created_at,
      patient_name: visit.patient?.name || "Patient",
      grand_total: grandTotal,
      paid_amount: paidAmount,
      balance_amount: balanceAmount,
      discount_amount: discountAmount,
      items: combinedItems
    };
  };

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center items-center">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pending Invoices */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-orange-500" /> Pending Invoices
        </h3>
        {bills.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-4">No pending invoices for this patient.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bills.map(bill => (
              <div key={bill.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-slate-400">INV #{bill.id}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-50 text-orange-700 border border-orange-100">Pending</span>
                </div>
                <div className="mb-4">
                  <p className="text-xs text-slate-500">Amount Due</p>
                  <p className="text-xl font-black text-slate-900">KSh {parseFloat(bill.balance_amount).toLocaleString()}</p>
                </div>
                <div className="space-y-1 mb-4 border-t border-slate-100 pt-3">
                  {bill.items?.slice(0, 2).map((item: any, i: number) => (
                    <div key={i} className="text-xs text-slate-600 truncate uppercase flex justify-between">
                      <span>{item.name}</span>
                    </div>
                  ))}
                  {bill.items?.length > 2 && <p className="text-xs text-slate-400 italic">+{bill.items.length - 2} more items</p>}
                </div>
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleOpenPayment(bill)}
                    className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Pay Now
                  </button>
                  <button
                    onClick={() => { setSelectedBill(bill); setIsInvoicePrintOpen(true); }}
                    title="Print Invoice"
                    className="px-3 py-2 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History & Cumulative Receipts */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-green-600" /> Cumulative Receipts
        </h3>
        {visits.filter(v => (v.bills || []).some((b: any) => parseFloat(b.paid_amount) > 0)).length === 0 ? (
          <p className="text-sm text-slate-500 italic py-4">No paid visits available for cumulative receipts.</p>
        ) : (
          <div className="overflow-x-auto bg-white border border-slate-200 justify-between rounded-xl">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Visit Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Amount Paid</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {visits
                  .filter(v => (v.bills || []).some((b: any) => parseFloat(b.paid_amount) > 0))
                  .map(visit => {
                    const cumulative = generateCumulativeReceipt(visit);
                    return (
                      <tr key={visit.id} className="hover:bg-slate-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">{new Date(visit.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">{visit.status}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-700">KSh {cumulative.paid_amount.toLocaleString()}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => { setSelectedVisitForReceipt(cumulative); setIsReceiptModalOpen(true); }}
                            className="inline-flex items-center text-xs font-medium bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-50"
                          >
                            <FileText className="h-3.5 w-3.5 mr-1.5" />
                            Cumulative Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`Process Payment - INV #${selectedBill?.id}`}>
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentData.payment_method}
              onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
              className="w-full border-slate-300 p-2 rounded-md shadow-sm sm:text-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="card">Bank / Card</option>
              <option value="insurance">Insurance</option>
            </select>
          </div>

          {paymentData.payment_method !== 'cash' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {paymentData.payment_method === 'mpesa' ? 'M-Pesa Transaction Code' :
                  paymentData.payment_method === 'card' ? 'Bank/Card Reference No.' :
                    'Reference / Authorization No.'}
              </label>
              <input
                type="text"
                required
                value={paymentData.transaction_reference}
                onChange={(e) => setPaymentData({ ...paymentData, transaction_reference: e.target.value })}
                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-mono tracking-wider"
                placeholder={paymentData.payment_method === 'mpesa' ? 'e.g. QJB5RF4KZT' : 'Enter reference number'}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount to Pay (KSh)</label>
            <input
              type="number"
              step="0.01"
              required
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              className="w-full border-slate-300 rounded-md p-2 shadow-sm sm:text-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="flex-1 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md font-medium text-sm hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-slate-900 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-slate-800 disabled:opacity-50 flex justify-center items-center"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} title="Final Cumulative Receipt" maxWidth="sm">
        <div className="bg-slate-50 p-4 rounded-xl">
          <ThermalReceipt bill={selectedVisitForReceipt} title="FINAL RECEIPT" subtitle="CUMULATIVE CHARGES" />
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={() => printBill(selectedVisitForReceipt, "FINAL RECEIPT", "CUMULATIVE CHARGES")} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">Print Receipt</button>
          <button onClick={() => setIsReceiptModalOpen(false)} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Close</button>
        </div>
      </Modal>

      {/* Print individual invoice modal */}
      <Modal isOpen={isInvoicePrintOpen} onClose={() => setIsInvoicePrintOpen(false)} title={`Invoice #${selectedBill?.id}`} maxWidth="100px">
        <div className="bg-slate-50 p-2 rounded-xl">
          <ThermalReceipt bill={selectedBill} title="WAFAA MEDICAL" subtitle="Invoice / Receipt" />
        </div>
        <div className="mt-4 flex justify-end gap-3">
          {selectedBill?.status !== 'paid' && (
            <button
              onClick={() => { setIsInvoicePrintOpen(false); handleOpenPayment(selectedBill); }}
              className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
            >
              Pay Now
            </button>
          )}
          <button onClick={() => printBill(selectedBill, "WAFAA MEDICAL", "Invoice / Receipt")} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">Print Invoice</button>
          <button onClick={() => setIsInvoicePrintOpen(false)} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Close</button>
        </div>
      </Modal>

    </div>
  );
}
