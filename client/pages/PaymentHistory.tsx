import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, query, where, doc, updateDoc, addDoc } from "firebase/firestore";
import {
  ArrowLeft,
  History,
  Search,
  Calendar,
  CheckCircle,
  Receipt,
  User,
  Plus,
  X,
  Save,
  DollarSign
} from "lucide-react";
import PageLayout from "../components/PageLayout";
import { cn } from "@/lib/utils";

interface UserSession {
  uid: string;
  role: "tenant" | "landlord";
  apartmentId: string;
  phone: string;
  name?: string;
}

interface PaymentRecord {
  id: string;
  amountPaid: number;
  mpesaLine: string;
  mpesaReceiptNumber: string;
  status: string;
  timestamp: string;
  houseNumber: string;
  tenantName: string;
  paymentType?: "mpesa" | "cash";
}

interface TenantOption {
  id: string;
  name: string;
  houseNumber: string;
  phone: string;
  balance: number;
}

export default function PaymentHistory() {
  const navigate = useNavigate();
  const [session, setSession] = useState<UserSession | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [totalCollectedSum, setTotalCollectedSum] = useState(0);

  // Modal state
  const [showCashModal, setShowCashModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/");
      return;
    }

    const userData = JSON.parse(stored) as UserSession;
    setSession(userData);

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch payments
        const paymentsRef = collection(db, "payments");
        let q;

        if (userData.role === "landlord") {
          q = query(
            paymentsRef,
            where("associatedApartmentId", "==", userData.apartmentId)
          );
        } else {
          q = query(paymentsRef, where("tenantId", "==", userData.uid));
        }

        const snap = await getDocs(q);
        let aggregateSum = 0;

        const historyList: PaymentRecord[] = snap.docs.map((doc) => {
          const data = doc.data() as any;
          const amt = Number(data.amountPaid || 0);
          aggregateSum += amt;

          return {
            id: doc.id,
            amountPaid: amt,
            mpesaLine: data.mpesaLine || "",
            mpesaReceiptNumber: data.mpesaReceiptNumber || "N/A",
            status: data.status || "Completed",
            timestamp: data.timestamp || new Date().toISOString(),
            houseNumber: data.houseNumber || "N/A",
            tenantName: data.tenantName || "Unknown Occupant",
            paymentType: data.paymentType || "mpesa"
          };
        });

        historyList.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setPayments(historyList);
        setTotalCollectedSum(aggregateSum);

        // If landlord, fetch tenants for dropdown
        if (userData.role === "landlord") {
          const usersRef = collection(db, "users");
          const tenantsQuery = query(
            usersRef,
            where("role", "==", "tenant"),
            where("associatedApartmentId", "==", userData.apartmentId)
          );
          const tenantsSnap = await getDocs(tenantsQuery);
          const tenantsList: TenantOption[] = tenantsSnap.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || "Unknown",
              houseNumber: data.houseNumber || data.unit || "N/A",
              phone: data.phone || "",
              balance: Number(data.balance || 0)
            };
          });
          setTenants(tenantsList);
        }
      } catch (err) {
        console.error("Firestore loading failure for statements ledger:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const filteredPayments = payments.filter((record) => {
    return (
      record.mpesaReceiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.houseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.timestamp.substring(0, 10).includes(searchTerm)
    );
  });

  const handleRecordCashPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selectedTenantId || !cashAmount || Number(cashAmount) <= 0) return;

    try {
      const selectedTenant = tenants.find((t) => t.id === selectedTenantId);
      if (!selectedTenant) return;

      // Update tenant balance
      const newBalance = selectedTenant.balance - Number(cashAmount);
      const tenantDocRef = doc(db, "users", selectedTenantId);
      await updateDoc(tenantDocRef, {
        balance: newBalance >= 0 ? newBalance : 0
      });

      // Add payment record
      await addDoc(collection(db, "payments"), {
        tenantId: selectedTenantId,
        associatedApartmentId: session.apartmentId,
        tenantName: selectedTenant.name,
        houseNumber: selectedTenant.houseNumber,
        amountPaid: Number(cashAmount),
        mpesaLine: "Cash Payment",
        mpesaReceiptNumber: "CASH-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        timestamp: new Date().toISOString(),
        status: "Completed",
        paymentType: "cash",
        note: note || undefined
      });

      // Send notification to tenant
      await addDoc(collection(db, "notifications"), {
        recipientId: selectedTenantId,
        title: "Cash Payment Recorded",
        message: `Your cash payment of KSh ${Number(cashAmount).toLocaleString()} has been recorded! Your new balance is KSh ${Math.max(0, newBalance).toLocaleString()}.`,
        type: "payment",
        read: false,
        timestamp: new Date().toISOString()
      });

      // Refresh local state
      setTenants(
        tenants.map((t) =>
          t.id === selectedTenantId
            ? { ...t, balance: newBalance >= 0 ? newBalance : 0 }
            : t
        )
      );

      // Refresh payments (we could just add to list, but let's refetch for simplicity)
      const paymentsRef = collection(db, "payments");
      const q = query(
        paymentsRef,
        where("associatedApartmentId", "==", session.apartmentId)
      );
      const snap = await getDocs(q);
      let aggregateSum = 0;
      const historyList: PaymentRecord[] = snap.docs.map((doc) => {
        const data = doc.data() as any;
        const amt = Number(data.amountPaid || 0);
        aggregateSum += amt;
        return {
          id: doc.id,
          amountPaid: amt,
          mpesaLine: data.mpesaLine || "",
          mpesaReceiptNumber: data.mpesaReceiptNumber || "N/A",
          status: data.status || "Completed",
          timestamp: data.timestamp || new Date().toISOString(),
          houseNumber: data.houseNumber || "N/A",
          tenantName: data.tenantName || "Unknown Occupant",
          paymentType: data.paymentType || "mpesa"
        };
      });
      historyList.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setPayments(historyList);
      setTotalCollectedSum(aggregateSum);

      // Reset modal
      setShowCashModal(false);
      setSelectedTenantId("");
      setCashAmount("");
      setNote("");
    } catch (err) {
      console.error("Error recording cash payment:", err);
      alert("Error recording cash payment. Please try again.");
    }
  };

  if (!session || loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500 font-medium">
        Assembling Ledger Statements... Please wait.
      </div>
    );
  }

  const isLandlord = session.role === "landlord";

  return (
    <PageLayout
      user={session}
      title={isLandlord ? "Master Property Payments Ledger" : "My Rent Statements"}
      headerRight={
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          {isLandlord && (
            <>
              <div className="bg-green-900 text-white px-4 py-3 rounded-lg shadow-sm flex items-center gap-6 text-sm text-right">
                <div>
                  <p className="text-green-200 text-[10px] font-bold uppercase tracking-wider">
                    Total Revenue Collected
                  </p>
                  <p className="text-xl font-black tracking-tight mt-0.5">
                    KES {totalCollectedSum.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCashModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors"
              >
                <Plus size={16} />
                <span>Record Cash Payment</span>
              </button>
            </>
          )}
        </div>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={
              isLandlord
                ? "Search by tenant name, house room number, or M-Pesa receipt code..."
                : "Search by code or date (YYYY-MM-DD)..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full pl-9 pr-4 py-2 text-sm text-gray-900 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:bg-white focus:ring-1",
              isLandlord ? "focus:ring-green-500" : "focus:ring-purple-500"
            )}
          />
        </div>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="p-12 text-center text-sm text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-2">
          <Receipt size={32} className="text-gray-300" />
          <span className="font-bold text-gray-700">No payment receipts available yet</span>
          <span className="text-xs text-gray-400">
            Transactions processed via M-Pesa or recorded cash will update this panel instantly.
          </span>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden text-left">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Transaction Date</th>
                  {isLandlord && <th className="p-4">Tenant Name</th>}
                  <th className="p-4">House No.</th>
                  <th className="p-4">Reference / M-Pesa Code</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Amount Cleared</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-900">
                {filteredPayments.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="p-4 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                        <Calendar size={13} className="text-gray-400" />
                        {new Date(record.timestamp).toLocaleString("en-KE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </td>
                    {isLandlord && (
                      <td className="p-4 whitespace-nowrap font-bold text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <User size={13} className="text-purple-500 shrink-0" />
                          <span>{record.tenantName}</span>
                        </div>
                      </td>
                    )}
                    <td className="p-4 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 bg-gray-50 border text-[10px] font-black tracking-wide rounded text-gray-600 uppercase">
                        {record.houseNumber}
                      </span>
                    </td>
                    <td className="p-4 font-bold font-mono tracking-wide text-green-950 uppercase text-xs whitespace-nowrap">
                      {record.mpesaReceiptNumber}
                    </td>
                    <td className="p-4 text-xs whitespace-nowrap">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full font-medium",
                          record.paymentType === "cash"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        )}
                      >
                        {record.paymentType === "cash" ? "Cash" : "M-Pesa"}
                      </span>
                    </td>
                    <td className="p-4 font-extrabold text-gray-900 whitespace-nowrap">
                      KSh {record.amountPaid.toLocaleString()}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <CheckCircle size={12} className="text-emerald-600" />
                        <span>{record.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Cash Payment Modal */}
      {showCashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-lg p-6 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900">Record Cash Payment</h3>
              <button
                onClick={() => setShowCashModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordCashPayment} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">
                  Select Tenant
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                >
                  <option value="">-- Select Tenant --</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} - {tenant.houseNumber} (Current Balance: KSh {tenant.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">
                  Amount (KES)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-gray-400">KSh</span>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold bg-white"
                    required
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">
                  Note (Optional)
                </label>
                <textarea
                  placeholder="Add a note about this cash payment..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  rows={3}
                />
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCashModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 shadow flex items-center gap-2"
                >
                  <Save size={16} />
                  <span>Record Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
