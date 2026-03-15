"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  CreditCard, 
  Search, 
  Loader2, 
  Calendar, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Receipt,
  DollarSign,
  X,
  CreditCard as CardIcon,
  Banknote,
  Smartphone
} from "lucide-react";
import { billingAPI, paymentAPI } from "@/lib/api";
import Link from "next/link";

export default function CashierPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [paymentData, setPaymentData] = useState({
    amount: "",
    payment_method: "cash",
    transaction_reference: ""
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

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const filteredBills = bills.filter(bill => 
    bill.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.id.toString().includes(searchTerm)
  );

  const handleOpenPayment = (bill: any) => {
    setSelectedBill(bill);
    setPaymentData({
      amount: bill.grand_total, // Default to full amount
      payment_method: "cash",
      transaction_reference: ""
    });
    setIsModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await paymentAPI.store(selectedBill.id, paymentData);
      setIsModalOpen(false);
      fetchBills();
      alert("Payment processed successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to process payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary-600" />
            Cashier Dashboard
          </h1>
          <p className="text-slate-500 mt-1">Manage patient billings and payment settlements.</p>
        </div>
        <div className="relative max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search patient or bill ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-slate-500">Unpaid Bills</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{bills.length}</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="p-12 text-center text-slate-500 italic">
            No pending bills found. All caught up!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient / Bill ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{bill.patient_name}</div>
                          <div className="text-xs text-slate-400">Bill #{bill.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">${parseFloat(bill.grand_total).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bill.status === 'paid' ? 'bg-green-100 text-green-800' : 
                        bill.status === 'partial' ? 'bg-blue-100 text-blue-800' : 
                        'bg-amber-100 text-amber-800'
                      } capitalize`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 opacity-40" />
                        {new Date(bill.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleOpenPayment(bill)}
                        className="inline-flex items-center text-primary-600 hover:text-primary-900 font-bold"
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Process Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {isModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Process Payment</h3>
                  <p className="text-xs text-slate-500">Bill ID: #{selectedBill.id}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-5">
              <div className="bg-slate-50 p-4 rounded-lg flex justify-between items-center border border-slate-100">
                <span className="text-sm text-slate-500">Total Outstanding:</span>
                <span className="text-xl font-bold text-slate-900">${parseFloat(selectedBill.grand_total).toLocaleString()}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Amount ($) *</label>
                <input 
                  required 
                  type="number" 
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Method *</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'cash', label: 'Cash', icon: Banknote },
                    { id: 'card', label: 'Card', icon: CardIcon },
                    { id: 'mobile', label: 'Mobile', icon: Smartphone }
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentData({...paymentData, payment_method: method.id})}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all ${
                        paymentData.payment_method === method.id 
                        ? 'border-primary-600 bg-primary-50 text-primary-700 ring-1 ring-primary-600' 
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <method.icon className={`h-5 w-5 mb-1.5 ${paymentData.payment_method === method.id ? 'text-primary-600' : 'text-slate-400'}`} />
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Reference / Notes</label>
                <input 
                  type="text" 
                  placeholder="e.g. Transaction ID, Check #"
                  value={paymentData.transaction_reference}
                  onChange={(e) => setPaymentData({...paymentData, transaction_reference: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" 
                />
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !paymentData.amount} 
                  className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing...</>
                  ) : (
                    <><CheckCircle2 className="mr-2 h-4 w-4" /> Confirm Payment</>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-full px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
