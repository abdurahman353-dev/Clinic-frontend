"use client";

import { useState, useEffect, useCallback } from "react";
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

export default function CashierPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'unbilled' | 'history'>('pending');
  const [bills, setBills] = useState<any[]>([]);
  const [historyBills, setHistoryBills] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBillDetailOpen, setIsBillDetailOpen] = useState(false);
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

  const fetchUnbilledVisits = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await visitAPI.list({ 'filter[status]': 'open,completed' });
      setVisits(response.data || []);
    } catch (err) {
      console.error("Failed to fetch visits", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'pending') fetchBills();
    if (activeTab === 'unbilled') fetchUnbilledVisits();
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, fetchBills, fetchUnbilledVisits, fetchHistory]);

  const filteredBills = bills.filter(bill => 
    bill.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.id.toString().includes(searchTerm)
  );

  const filteredVisits = visits.filter(visit => 
    visit.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit.id.toString().includes(searchTerm)
  );

  const filteredHistory = historyBills.filter(bill => 
    bill.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.id.toString().includes(searchTerm)
  );

  const handleOpenPayment = (bill: any) => {
    setSelectedBill(bill);
    setPaymentData({
      amount: bill.grand_total,
      payment_method: "cash",
      transaction_reference: ""
    });
    setIsModalOpen(true);
  };

  const handleGenerateBill = async (visit: any) => {
    setIsSubmitting(true);
    try {
      const response = await billingAPI.store({ visit_id: visit.id });
      toast.success("Invoice generated successfully!");
      setActiveTab('pending');
      fetchBills();
    } catch (err) {
      // Error handled by interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await paymentAPI.store(selectedBill.id, paymentData);
      setIsModalOpen(false);
      fetchBills();
      toast.success("Payment processed successfully!");
    } catch (err: any) {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-primary-600" />
            Cashier Dashboard
          </h1>
          <p className="text-slate-500 mt-1">Generate invoices and process patient payments.</p>
        </div>
        <div className="relative max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search patient, ID or bill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 sm:text-sm transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Clock className="h-4 w-4" />
          Unpaid Invoices
          {bills.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded-full text-[10px]">{bills.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('unbilled')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'unbilled' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <PlusCircle className="h-4 w-4" />
          Ready for Invoicing
          {visits.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px]">{visits.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <History className="h-4 w-4" />
          Payment History
        </button>
      </div>

      {isLoading ? (
        <div className="p-24 flex justify-center bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="text-center">
            <Loader2 className="h-10 w-10 text-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Loading medical records...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden border-b-0">
          {activeTab === 'pending' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Patient / Bill ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Breakdown</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredBills.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No pending bills found.</td></tr>
                  ) : filteredBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mr-3 border border-slate-200">
                            <User className="h-5 w-5 text-slate-500" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition-colors">{bill.patient_name || 'Walking Patient'}</div>
                            <div className="text-xs text-slate-400 font-medium font-mono uppercase">Bill #{bill.id} &bull; {new Date(bill.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {bill.consultation_fee > 0 && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">Consult</span>}
                          {bill.vitals_total > 0 && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">Vitals</span>}
                          {bill.investigation_total > 0 && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px] font-bold">Labs</span>}
                          {bill.medicine_total > 0 && <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-[10px] font-bold">Pharmacy</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base font-black text-slate-900">KSh {parseFloat(bill.grand_total).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide ${
                          bill.status === 'paid' ? 'bg-green-100 text-green-800' : 
                          bill.status === 'partial' ? 'bg-blue-100 text-blue-800' : 
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                           <button onClick={() => viewBillDetails(bill)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all" title="View Details">
                             <FileText className="h-5 w-5" />
                           </button>
                           <button 
                            onClick={() => handleOpenPayment(bill)}
                            className="inline-flex items-center font-black text-primary-600 bg-primary-50 px-4 py-2 rounded-xl hover:bg-primary-600 hover:text-white transition-all shadow-sm active:scale-95"
                          >
                            Pay
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'unbilled' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Patient / Visit ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Clinical Progress</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Visit Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredVisits.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No visits ready for invoicing.</td></tr>
                  ) : filteredVisits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center mr-3 border border-amber-100 text-amber-600">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{visit.patient?.name || 'Unknown Patient'}</div>
                            <div className="text-xs text-slate-400 font-medium">#{visit.patient?.id} &bull; Visit ID: {visit.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           {/* These indicators could be more refined by checking vitals/tests counts in API response if provided */}
                           <div className="flex -space-x-1 overflow-hidden" title="Active items">
                             <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-blue-100 flex items-center justify-center"><Activity className="h-3 w-3 text-blue-600" /></div>
                             <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-purple-100 flex items-center justify-center"><FileText className="h-3 w-3 text-purple-600" /></div>
                           </div>
                           <span className="text-xs font-medium text-slate-500">Record ready</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide border ${
                          visit.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                          {visit.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {new Date(visit.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleGenerateBill(visit)}
                          disabled={isSubmitting}
                          className="inline-flex items-center font-black text-amber-600 bg-amber-50 px-4 py-2 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Receipt className="h-4 w-4 mr-1.5" />}
                          Generate Invoice
                        </button>
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
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Patient / Invoice History</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Settled On</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredHistory.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No paid invoices found.</td></tr>
                  ) : filteredHistory.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center mr-3 border border-green-100 text-green-600">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{bill.patient_name || 'Walking Patient'}</div>
                            <div className="text-xs text-slate-400 font-medium font-mono uppercase">Inv #{bill.id} &bull; Generated: {new Date(bill.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base font-black text-slate-900 font-mono">KSh {parseFloat(bill.grand_total).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide bg-green-100 text-green-800">
                           {bill.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {bill.updated_at ? new Date(bill.updated_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => viewBillDetails(bill)} className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all" title="View Details">
                          <FileText className="h-5 w-5" />
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

      {/* Invoice Detail Modal */}
      <Modal
        isOpen={isBillDetailOpen}
        onClose={() => setIsBillDetailOpen(false)}
        title="Invoice Details"
        description={`Patient: ${selectedBill?.patient_name} | Bill #${selectedBill?.id}`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-6 py-2">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Itemized Breakdown</h4>
            <div className="space-y-3">
              {selectedBill?.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-slate-700 font-medium">{item.name}</span>
                  <span className="text-slate-900 font-bold">KSh {parseFloat(item.amount).toLocaleString()}</span>
                </div>
              ))}
              <div className="pt-4 mt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="text-base font-black text-slate-900">Total Amount Due</span>
                <span className="text-xl font-black text-primary-700 underline decoration-primary-200 underline-offset-4">KSh {parseFloat(selectedBill?.grand_total || "0").toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            {selectedBill?.status !== 'paid' ? (
              <button 
                onClick={() => { setIsBillDetailOpen(false); handleOpenPayment(selectedBill); }} 
                className="flex-1 bg-primary-600 text-white font-black py-4 rounded-xl shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95"
              >
                Proceed to Payment
              </button>
            ) : (
              <div className="flex-1 bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-bold uppercase tracking-wide">Invoice Settled</span>
              </div>
            )}
            <button 
              onClick={() => {
                // Future: Implement proper print view
                window.print();
              }} 
              className="px-6 border-2 border-slate-100 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              title="Print Invoice"
            >
              <Receipt className="h-5 w-5 text-slate-400" />
              <span className="text-xs font-bold text-slate-500">Print</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Processing Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Process Settlement"
        description={`Completing Bill #${selectedBill?.id} for ${selectedBill?.patient_name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl text-white flex justify-between items-center shadow-xl shadow-slate-200">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Total Outstanding</span>
              <span className="text-3xl font-black">KSh {parseFloat(selectedBill?.grand_total || "0").toLocaleString()}</span>
            </div>
            <Receipt className="h-10 w-10 text-slate-700" />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">Payment Amount (KES) *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none font-bold text-slate-400">
                KSh
              </div>
              <input 
                required 
                type="number" 
                step="0.01"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                className="w-full pl-16 pr-4 py-4 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 font-bold text-xl transition-all outline-none" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">Select Payment Method *</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'card', label: 'Card', icon: CardIcon },
                { id: 'mobile', label: 'M-Pesa', icon: Smartphone }
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentData({...paymentData, payment_method: method.id})}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${
                    paymentData.payment_method === method.id 
                    ? 'border-primary-600 bg-primary-50 text-primary-700 ring-4 ring-primary-500/5 shadow-sm' 
                    : 'border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-100 hover:bg-slate-100/50'
                  }`}
                >
                  <method.icon className={`h-7 w-7 mb-2 ${paymentData.payment_method === method.id ? 'text-primary-600' : 'text-slate-300'}`} />
                  <span className="text-[10px] uppercase tracking-tighter font-black">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">Transaction Reference</label>
            <input 
              type="text" 
              placeholder="e.g. MPESA-ABC123XYZ"
              value={paymentData.transaction_reference}
              onChange={(e) => setPaymentData({...paymentData, transaction_reference: e.target.value})}
              className="w-full px-4 py-4 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 text-sm font-medium transition-all outline-none" 
            />
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button 
              type="submit" 
              disabled={isSubmitting || !paymentData.amount} 
              className="w-full inline-flex items-center justify-center px-4 py-5 border border-transparent shadow-xl text-lg font-black rounded-2xl text-white bg-primary-600 hover:bg-primary-700 hover:shadow-primary-200 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-6 w-6 animate-spin"/> Processing...</>
              ) : (
                <><CheckCircle2 className="mr-2 h-6 w-6" /> Complete Settlement</>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
