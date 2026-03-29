"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CreditCard,
  Search,
  Loader2,
  Calendar,
  User,
  CheckCircle2,
  Activity,
  AlertCircle,
  Receipt,
  DollarSign,
  CreditCard as CardIcon,
  Banknote,
  Smartphone,
  PlusCircle,
  Clock,
  ChevronRight,
  FileText,
  History
} from "lucide-react";
import { billingAPI, paymentAPI, visitAPI } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";

const ThermalReceipt = ({ bill }: { bill: any }) => {
  if (!bill) return null;
  return (
    <div className="bg-white p-6 md:p-8 font-mono text-sm border-2 border-slate-100 shadow-inner max-w-[340px] mx-auto my-4 text-slate-800 leading-tight">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold uppercase tracking-tight mb-1">WAFAA MEDICAL</h2>
        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Quality Healthcare Services</p>
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
          <span>{bill.visit_id ? 'VISIT NO' : 'INV NO'}:</span>
          <span className="font-bold">#{bill.id || bill.visit_id}</span>
        </div>
        <div className="flex justify-between">
          <span>CASHIER:</span>
          <span>ADMIN-1</span>
        </div>
        <div className="flex justify-between">
          <span>PATIENT:</span>
          <span className="truncate max-w-[120px] font-bold">{bill.patient_name || 'WALK-IN'}</span>
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
          <span>TENDERED (CASH):</span>
          <span>{parseFloat(bill.paid_amount).toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold border-t border-slate-100 pt-1 mt-1 text-red-600">
          <span>BALANCE DUE:</span>
          <span>{parseFloat(bill.balance_amount).toLocaleString()}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-slate-300 my-6" />

      <div className="text-center space-y-2">
        <p className="font-bold text-xs uppercase tracking-widest">THANK YOU!</p>
        <p className="text-[10px]">WISH YOU A QUICK RECOVERY</p>
        <div className="mt-4 flex justify-center opacity-70">
          <div className="h-8 w-48 bg-[repeating-linear-gradient(90deg,black,black_2px,transparent_2px,transparent_4px)]"></div>
        </div>
        <p className="text-[9px] text-slate-400 mt-3 font-mono uppercase tracking-tighter">** CUSTOMER COPY **</p>
      </div>
    </div>
  );
};

export default function CashierPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('history');
  const [bills, setBills] = useState<any[]>([]);
  const [historyBills, setHistoryBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBillDetailOpen, setIsBillDetailOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [paymentData, setPaymentData] = useState({
    amount: "",
    payment_method: "cash",
    transaction_reference: "",
    discount_amount: "0",
    discount_type: "fixed" as "fixed" | "percentage"
  });

  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await billingAPI.list({ status: 'pending,partial' });
      setBills(response.data || []);
    } catch (err) {
      console.error("Failed to fetch bills", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await billingAPI.list({ status: 'paid' });
      setHistoryBills(response.data || []);
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'pending') fetchBills();
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, fetchBills, fetchHistory]);

  const groupedBills = useMemo(() => {
    const groups: { [visitId: string]: any } = {};
    bills.forEach(bill => {
      const vid = bill.visit_id;
      if (!groups[vid]) {
        groups[vid] = {
          id: vid,
          visit_id: vid,
          patient_name: bill.patient_name || bill.patient?.name,
          updated_at: bill.updated_at,
          created_at: bill.created_at,
          grand_total: 0,
          discount_amount: 0,
          paid_amount: 0,
          balance_amount: 0,
          items: [],
          status: 'pending'
        };
      }
      groups[vid].grand_total += parseFloat(bill.grand_total);
      groups[vid].discount_amount += parseFloat(bill.discount_amount);
      groups[vid].paid_amount += parseFloat(bill.paid_amount);
      groups[vid].balance_amount += parseFloat(bill.balance_amount);
      if (bill.items) groups[vid].items = [...groups[vid].items, ...bill.items];
      
      if (groups[vid].paid_amount > 0 && groups[vid].balance_amount > 0) {
        groups[vid].status = 'partial';
      }
    });
    return Object.values(groups).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [bills]);

  const filteredBills = groupedBills.filter((bill: any) =>
    bill.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.id.toString().includes(searchTerm)
  );

  const groupedHistory = useMemo(() => {
    const groups: { [visitId: string]: any } = {};
    historyBills.forEach(bill => {
      const vid = bill.visit_id;
      if (!groups[vid]) {
        groups[vid] = {
          id: vid,
          visit_id: vid,
          patient_name: bill.patient_name || bill.patient?.name,
          updated_at: bill.updated_at,
          created_at: bill.created_at,
          grand_total: 0,
          discount_amount: 0,
          paid_amount: 0,
          balance_amount: 0,
          items: [],
          status: 'paid'
        };
      }
      groups[vid].grand_total += parseFloat(bill.grand_total);
      groups[vid].discount_amount += parseFloat(bill.discount_amount);
      groups[vid].paid_amount += parseFloat(bill.paid_amount);
      groups[vid].balance_amount += parseFloat(bill.balance_amount);
      if (bill.items) groups[vid].items = [...groups[vid].items, ...bill.items];
    });
    return Object.values(groups).sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [historyBills]);

  const filteredHistory = groupedHistory.filter((bill: any) =>
    bill.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.id.toString().includes(searchTerm)
  );

  const handleOpenPayment = (bill: any) => {
    setSelectedBill(bill);
    setPaymentData({
      amount: bill.balance_amount,
      payment_method: "cash",
      transaction_reference: "",
      discount_amount: "0",
      discount_type: "fixed"
    });
    setIsModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    const amountPaid = parseFloat(paymentData.amount);
    const isFullPayment = amountPaid >= parseFloat(selectedBill.balance_amount);

    // Optimistic UI: Close modal and show success immediately
    setIsModalOpen(false);
    toast.success("Payment processed successfully!");

    // Optimistic state update
    if (isFullPayment) {
      setBills((prev: any[]) => prev.filter((b: any) => b.id !== selectedBill.id));
    } else {
      setBills((prev: any[]) => prev.map((b: any) =>
        b.id === selectedBill.id
          ? {
            ...b,
            paid_amount: parseFloat(b.paid_amount) + amountPaid,
            balance_amount: parseFloat(b.balance_amount) - amountPaid,
            status: 'partial'
          }
          : b
      ));
    }

    setIsSubmitting(true);
    try {
      if (activeTab === 'pending') {
         await paymentAPI.payVisit(selectedBill.visit_id, paymentData);
      } else {
         await paymentAPI.store(selectedBill.id, paymentData);
      }
      fetchBills(); // Refresh in background for consistency
      fetchHistory();
    } catch (err: any) {
      // API interceptor handles visual error, we refresh to restore correct state
      fetchBills();
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewBillDetails = (bill: any) => {
    setSelectedBill(bill);
    setIsBillDetailOpen(true);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-slate-700" />
            Cashier Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Invoice generation and payment processing.</p>
        </div>
        <div className="relative max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search patient or bill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-all ${activeTab === 'history' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Payment History
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-all ${activeTab === 'pending' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Unpaid Invoices
          {bills.length > 0 && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-xs border border-slate-200">{bills.length}</span>}
        </button>
      </div>

      {isLoading ? (
        <div className="p-24 flex justify-center bg-white border border-slate-200 rounded-lg">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-slate-400 animate-spin mx-auto mb-4" />
            <p className="text-xs text-slate-500">Retrieving records...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          {activeTab === 'pending' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient / Bill</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Services</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredBills.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm italic">No pending bills found.</td></tr>
                  ) : filteredBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{bill.patient_name || 'Walking Patient'}</div>
                        <div className="text-xs text-slate-500 font-mono">#{bill.id} &bull; {new Date(bill.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {bill.items?.slice(0, 3).map((item: any, idx: number) => (
                             <span key={idx} className="px-1.5 py-0.5 border border-slate-200 text-slate-600 rounded text-xs font-medium uppercase truncate max-w-[120px]">
                               {item.name}
                             </span>
                          ))}
                          {bill.items?.length > 3 && (
                            <span className="px-1.5 py-0.5 text-slate-400 text-xs font-medium">+{bill.items.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">KSh {parseFloat(bill.grand_total).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {parseFloat(bill.paid_amount) > 0 ? `KSh ${parseFloat(bill.paid_amount).toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">KSh {parseFloat(bill.balance_amount).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium border ${bill.status === 'paid' ? 'bg-green-50 text-green-700 border-green-100' :
                          bill.status === 'partial' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                          {bill.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => viewBillDetails(bill)} className="text-slate-400 hover:text-slate-600" title="View Details">
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenPayment(bill)}
                            className="bg-slate-900 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-slate-800 transition-colors"
                          >
                            Add Payment
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient / Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Discount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Final Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Settled</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredHistory.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm italic">No history found.</td></tr>
                  ) : filteredHistory.map((bill: any) => (
                    <tr key={bill.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{bill.patient_name || 'Walking Patient'}</div>
                        <div className="text-xs text-slate-400">Inv #{bill.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">KSh {parseFloat(bill.grand_total).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {parseFloat(bill.discount_amount) > 0 ? `- KSh ${parseFloat(bill.discount_amount).toLocaleString()}` : '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                        KSh {(parseFloat(bill.grand_total) - parseFloat(bill.discount_amount)).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-100 uppercase">Paid</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {bill.updated_at ? new Date(bill.updated_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button onClick={() => viewBillDetails(bill)} className="text-slate-400 hover:text-slate-600">
                          <FileText className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isBillDetailOpen}
        onClose={() => setIsBillDetailOpen(false)}
        title="Invoice Review"
        description="Official medical bill summary"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 pt-2">
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <ThermalReceipt bill={selectedBill} />
          </div>

          <div className="flex gap-3">
            {selectedBill?.status !== 'paid' ? (
              <button
                onClick={() => { setIsBillDetailOpen(false); handleOpenPayment(selectedBill); }}
                className="flex-1 bg-slate-900 text-white font-medium py-2.5 rounded hover:bg-slate-800 transition-colors"
              >
                Proceed to Payment
              </button>
            ) : (
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded p-2.5 flex items-center justify-center gap-2 text-slate-600 font-medium text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Settled in Full
              </div>
            )}
            <button
              onClick={() => window.print()}
              className="px-4 border border-slate-200 rounded hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-slate-500"
            >
              <Receipt className="h-4 w-4" />
              <span className="text-xs font-medium">Print</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Processing Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Process Settlement"
        description={`Patient: ${selectedBill?.patient_name} | Bill #${selectedBill?.id}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Original</span>
              <span className="text-sm font-medium text-slate-700">KSh {parseFloat(selectedBill?.grand_total || "0").toLocaleString()}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Already Paid</span>
              <span className="text-sm font-medium text-slate-700">KSh {parseFloat(selectedBill?.paid_amount || "0").toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded text-white flex justify-between items-center">
            <div>
              <span className="text-xs uppercase font-medium text-slate-400 block mb-0.5">Amount Outstanding</span>
              <span className="text-2xl font-bold font-mono">
                KSh {(() => {
                  const originalBalance = parseFloat(selectedBill?.balance_amount || "0");
                  let disc = parseFloat(paymentData.discount_amount || "0");
                  if (paymentData.discount_type === 'percentage') {
                    disc = (parseFloat(selectedBill?.grand_total || "0") * disc) / 100;
                  }
                  return Math.max(0, originalBalance - disc).toLocaleString();
                })()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">Payment Amount (KES)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-medium">KSh</div>
              <input
                required
                type="number"
                step="0.01"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                className="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-semibold text-lg"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700 uppercase">Apply Discount</label>
              <div className="flex border border-slate-300 rounded overflow-hidden h-7">
                <button
                  type="button"
                  onClick={() => setPaymentData(prev => ({ ...prev, discount_type: 'fixed' }))}
                  className={`px-3 text-xs font-bold transition-colors ${paymentData.discount_type === 'fixed' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}`}
                >
                  KSh
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentData(prev => ({ ...prev, discount_type: 'percentage' }))}
                  className={`px-3 text-xs font-bold transition-colors ${paymentData.discount_type === 'percentage' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}`}
                >
                  %
                </button>
              </div>
            </div>
            <input
              type="number"
              placeholder={paymentData.discount_type === 'fixed' ? 'Amount' : 'Percentage'}
              value={paymentData.discount_amount}
              onChange={(e) => {
                const val = e.target.value;
                setPaymentData(prev => {
                  const next = { ...prev, discount_amount: val };
                  const originalBalance = parseFloat(selectedBill?.balance_amount || "0");
                  let disc = parseFloat(val || "0");
                  if (prev.discount_type === 'percentage') {
                    disc = (parseFloat(selectedBill?.grand_total || "0") * disc) / 100;
                  }
                  next.amount = Math.max(0, originalBalance - disc).toString();
                  return next;
                });
              }}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm placeholder-slate-400 focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'card', label: 'Card', icon: CardIcon },
                { id: 'mobile', label: 'M-Pesa', icon: Smartphone }
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentData({ ...paymentData, payment_method: method.id })}
                  className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${paymentData.payment_method === method.id
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                >
                  <method.icon className="h-5 w-5 mb-1" />
                  <span className="text-xs uppercase font-semibold">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {paymentData.payment_method !== 'cash' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                {paymentData.payment_method === 'mobile' ? 'M-Pesa Transaction Code' :
                 paymentData.payment_method === 'card' ? 'Bank/Card Reference No.' :
                 'Reference / Auth No.'}
              </label>
              <input
                type="text"
                required
                placeholder={paymentData.payment_method === 'mobile' ? 'e.g. QJB5RF4KZT' : 'Enter reference number'}
                value={paymentData.transaction_reference}
                onChange={(e) => setPaymentData({ ...paymentData, transaction_reference: e.target.value })}
                className="w-full px-3 py-2 border border-slate-900 rounded text-sm font-mono tracking-wider placeholder-slate-400 focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !paymentData.amount}
            className="w-full bg-slate-900 text-white font-semibold py-3 rounded hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Processing</span>
            ) : "Confirm Settlement"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
