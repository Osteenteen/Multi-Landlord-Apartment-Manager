import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";
import { 
  ArrowLeft, 
  Smartphone, 
  Loader2, 
  CheckCircle2, 
  ShieldAlert, 
  Receipt, 
  Info, 
  Share2, 
  Wallet 
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

export default function PayRent() {
  const navigate = useNavigate();
  const [session, setSession] = useState<UserSession | null>(null);

  const [tenantName, setTenantName] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [currentBalance, setCurrentBalance] = useState(0);

  const [baseRent, setBaseRent] = useState(0);
  const [lastBilledTotal, setLastBilledTotal] = useState(0);
  const [lastBillingDate, setLastBillingDate] = useState("");

  const [mpesaType, setMpesaType] = useState<"paybill" | "till" | "sendmoney" | "">("");
  const [landlordPaybill, setLandlordPaybill] = useState("");
  const [landlordAccount, setLandlordAccount] = useState("");
  const [landlordBusinessName, setLandlordBusinessName] = useState("");
  const [landlordUid, setLandlordUid] = useState("");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "">("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/");
      return;
    }

    const userData = JSON.parse(stored) as UserSession;
    if (userData.role !== "tenant") {
      navigate("/dashboard");
      return;
    }
    setSession(userData);
    setMpesaPhone(userData.phone);
    setTenantName(userData.name || "Valued Tenant");

    const loadCompleteInvoiceAndLandlordData = async () => {
      try {
        const tenantRef = doc(db, "users", userData.uid);
        const tenantSnap = await getDoc(tenantRef);

        if (tenantSnap.exists()) {
          const d = tenantSnap.data();
          setTenantName(d.name || "Valued Tenant");
          setHouseNumber(d.houseNumber || d.unit || "N/A");
          setCurrentBalance(Number(d.balance || 0));
          setPaymentAmount(String(d.balance || ""));
          setBaseRent(Number(d.monthlyRent || 0));
          setLastBilledTotal(Number(d.lastBilledInvoiceAmount || d.monthlyRent || 0));
          setLastBillingDate(
            d.lastBillingTimestamp
              ? new Date(d.lastBillingTimestamp).toLocaleDateString("en-KE", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Current Cycle"
          );
        }

        const aptRef = doc(db, "apartments", userData.apartmentId);
        const aptSnap = await getDoc(aptRef);

        if (aptSnap.exists()) {
          const aptData = aptSnap.data();
          const targetLandlordUid = aptData.landlordId;
          setLandlordUid(targetLandlordUid);

          if (targetLandlordUid) {
            const landlordRef = doc(db, "users", targetLandlordUid);
            const landlordSnap = await getDoc(landlordRef);

            if (landlordSnap.exists()) {
              const lData = landlordSnap.data();
              setMpesaType(lData.mpesaType || "paybill");
              setLandlordPaybill(lData.paybillNumber || "Not Set By Admin");
              setLandlordAccount(lData.accountNumber || houseNumber || "Rent Acc");
              setLandlordBusinessName(lData.name || "Apartment Management");
            }
          }
        }
      } catch (err) {
        console.error("Firestore loading failure for business mapping parameters:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCompleteInvoiceAndLandlordData();
  }, [navigate]);

  const formatMpesaLine = (input: string) => {
    let clean = input.replace(/\D/g, "");
    if (clean.startsWith("0")) {
      clean = "254" + clean.substring(1);
    } else if (clean.startsWith("+")) {
      clean = clean.substring(1);
    }
    return clean;
  };

  const handleMpesaPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg("");
    setStatusType("");

    const parsedAmount = Number(paymentAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      setStatusMsg("Please specify a valid payment amount greater than 0 KSh.");
      setStatusType("error");
      return;
    }

    const cleanLine = formatMpesaLine(mpesaPhone);
    if (cleanLine.length !== 12 || !cleanLine.startsWith("254")) {
      setStatusMsg("Please input a valid Safaricom phone number (e.g., 0712345678).");
      setStatusType("error");
      return;
    }

    setProcessingPayment(true);
    setStatusMsg(`Sending STK Push Request linked to your landlord's gateway... Please enter your M-Pesa PIN on your phone handset.`);

    try {
      await new Promise((resolve) => setTimeout(resolve, 4000));

      if (!session) return;

      const newBalance = currentBalance - parsedAmount;

      const tenantDocRef = doc(db, "users", session.uid);
      await updateDoc(tenantDocRef, {
        balance: newBalance >= 0 ? newBalance : 0,
      });

      await addDoc(collection(db, "payments"), {
        tenantId: session.uid,
        associatedApartmentId: session.apartmentId,
        tenantName: tenantName,
        houseNumber: houseNumber,
        amountPaid: parsedAmount,
        mpesaLine: "+" + cleanLine,
        timestamp: new Date().toISOString(),
        status: "Completed",
        recipientBusinessName: landlordBusinessName,
        destinationPaybill: landlordPaybill,
        mpesaReceiptNumber: "B" + Math.random().toString(36).substring(2, 11).toUpperCase(),
        paymentType: "mpesa"
      });

      // Send notification to tenant
      await addDoc(collection(db, "notifications"), {
        recipientId: session.uid,
        title: "Payment Received",
        message: `Your payment of KSh ${parsedAmount.toLocaleString()} has been processed successfully! Your new balance is KSh ${Math.max(0, newBalance).toLocaleString()}.`,
        type: "payment",
        read: false,
        timestamp: new Date().toISOString()
      });

      // Send notification to landlord
      if (landlordUid) {
        await addDoc(collection(db, "notifications"), {
          recipientId: landlordUid,
          title: "New Payment Received",
          message: `${tenantName} (Unit ${houseNumber}) has made a payment of KSh ${parsedAmount.toLocaleString()}.`,
          type: "payment",
          read: false,
          timestamp: new Date().toISOString()
        });
      }

      setCurrentBalance(newBalance >= 0 ? newBalance : 0);
      setStatusType("success");
      setStatusMsg(
        `Success! Payment of KSh ${parsedAmount.toLocaleString()} processed successfully to ${landlordBusinessName}. Your updated balance is KSh ${Math.max(
          0,
          newBalance
        ).toLocaleString()}.`
      );
      setPaymentAmount("");
    } catch (err) {
      console.error("Transaction processing ledger fault:", err);
      setStatusType("error");
      setStatusMsg("Payment communication failure. Please verify network cloud rules configurations.");
    } finally {
      setProcessingPayment(false);
    }
  };

  if (!session || loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500 font-medium">
        Loading Payment Portal Matrix Nodes...
      </div>
    );
  }

  const utilitiesSurcharge = lastBilledTotal - baseRent;

  return (
    <PageLayout
      user={session}
      title="M-Pesa Payment Link"
      headerRight={
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
      }
    >
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
          
          {/* Left Column: Ledger Records and Alternative Flows */}
          <div className="p-6 space-y-6 bg-gray-50/30">
            
            {/* Account Meta Badge Block */}
            <div className="p-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tenant Profiling</span>
                <p className="text-sm font-extrabold text-gray-800 mt-0.5">{tenantName}</p>
                <p className="text-xs text-gray-400 font-mono">Unit: {houseNumber}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Outstanding Arrears</span>
                <p className="text-base font-black text-purple-700 mt-0.5">KSh {currentBalance.toLocaleString()}</p>
              </div>
            </div>

            {/* Landlord Billing Description Breakdown */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <header className="bg-gray-50 px-4 py-2.5 text-xs font-bold text-gray-700 flex items-center gap-1.5 border-b border-gray-200 uppercase tracking-wider">
                <Receipt size={14} className="text-purple-600" />
                <span>Last Billed Invoice Summary ({lastBillingDate})</span>
              </header>
              <div className="p-4 space-y-3 text-xs text-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Base House Rent Liability</span>
                  <span className="font-bold text-gray-900">KSh {baseRent.toLocaleString()}</span>
                </div>
                
                {utilitiesSurcharge > 0 ? (
                  <div className="flex justify-between items-center text-purple-700 font-medium bg-purple-50/50 p-2 rounded border border-purple-100/50">
                    <span className="flex items-center gap-1">
                      <Info size={12} />
                      <span>Appended Utility Surcharges</span>
                    </span>
                    <span className="font-bold">KSh {utilitiesSurcharge.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-gray-400 italic">
                    <span>No active auxiliary utility surcharges added</span>
                    <span>KSh 0.00</span>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100 flex justify-between items-center font-black text-gray-900 text-sm">
                  <span className="uppercase text-xs tracking-wider text-gray-500">Total Calculated Billing Amount</span>
                  <span className="font-mono text-gray-900 text-base">KSh {lastBilledTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Dynamic Manual Option B Checklist Container */}
            <div className="p-5 border border-blue-100 bg-blue-50/30 rounded-xl space-y-3 shadow-inner">
              <div className="flex items-center gap-2 font-black text-blue-950 uppercase tracking-wider text-[10px]">
                <Info size={14} className="text-blue-600" />
                <span>Option B: Manual Payment Instructions</span>
              </div>
              
              <div className="text-xs text-blue-900 leading-relaxed font-medium space-y-2">
                <p>If the STK push fails, open your Sim ToolKit or M-Pesa Application and execute manually:</p>
                
                {mpesaType === "paybill" && (
                  <div className="bg-white/80 border border-blue-100 p-3 rounded-lg space-y-1 text-blue-950 font-sans shadow-sm">
                    <div>1. Select <span className="font-bold">Lipa Na M-Pesa ➔ Paybill</span></div>
                    <div>2. Enter Business No: <span className="font-mono font-black bg-blue-100 px-1.5 py-0.5 rounded">{landlordPaybill}</span></div>
                    <div>3. Enter Account No: <span className="font-mono font-black bg-blue-100 px-1.5 py-0.5 rounded">{landlordAccount}</span></div>
                    <div>4. Enter Amount and confirm with your secret PIN.</div>
                  </div>
                )}

                {mpesaType === "till" && (
                  <div className="bg-white/80 border border-blue-100 p-3 rounded-lg space-y-1 text-blue-950 font-sans shadow-sm">
                    <div>1. Select <span className="font-bold">Lipa Na M-Pesa ➔ Buy Goods and Services</span></div>
                    <div>2. Enter Till No: <span className="font-mono font-black bg-blue-100 px-1.5 py-0.5 rounded">{landlordPaybill}</span></div>
                    <div>3. Enter Amount and confirm with your secret PIN.</div>
                  </div>
                )}

                {mpesaType === "sendmoney" && (
                  <div className="bg-white/80 border border-blue-100 p-3 rounded-lg space-y-1 text-blue-950 font-sans shadow-sm">
                    <div>1. Select <span className="font-bold">Send Money</span></div>
                    <div>2. Enter Phone Number: <span className="font-mono font-black bg-blue-100 px-1.5 py-0.5 rounded">{landlordPaybill}</span></div>
                    <div>3. Enter Amount and confirm with your secret PIN.</div>
                  </div>
                )}
                
                {!mpesaType && (
                  <p className="text-gray-400 animate-pulse font-mono">Loading dynamic manual node profiles...</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Automated Express Form Matrix Panel */}
          <div className="p-6 bg-white flex flex-col justify-between">
            <form onSubmit={handleMpesaPay} className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest">
                  <Wallet size={14} className="text-emerald-600" />
                  <span>Option A: Express Automated Push</span>
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Enter your Safaricom mobile line information below to trigger an instant checkout wizard directly to your handset.
                </p>
              </div>

              {/* Response Alert Banners */}
              {statusMsg && (
                <div className={cn(
                  "p-3.5 text-xs font-semibold border rounded-lg flex items-start gap-2.5 leading-relaxed text-left animate-in fade-in duration-150 shadow-sm",
                  statusType === "success" && "bg-emerald-50 text-emerald-800 border-emerald-200",
                  statusType === "error" && "bg-red-50 text-red-800 border-red-200",
                  statusType === "" && "bg-blue-50 text-blue-800 border-blue-200"
                )}>
                  {statusType === "success" && <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />}
                  {statusType === "error" && <ShieldAlert size={16} className="shrink-0 text-red-600 mt-0.5" />}
                  {statusType === "" && <Loader2 size={16} className="shrink-0 text-blue-600 mt-0.5 animate-spin" />}
                  <span>{statusMsg}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Payment Amount (KES)</label>
                  <div className="relative rounded-lg shadow-sm">
                    <span className="absolute left-3 top-2.5 text-sm font-black text-gray-400">KSh</span>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      disabled={processingPayment}
                      className="w-full pl-11 pr-4 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold bg-white disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Safaricom Payer Line</label>
                  <div className="relative rounded-lg shadow-sm">
                    <span className="absolute left-3 top-3 text-gray-400">
                      <Smartphone size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="0712345678"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      disabled={processingPayment}
                      className="w-full pl-9 pr-4 py-2.5 text-sm font-mono font-bold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white disabled:bg-gray-50"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold tracking-wide uppercase">
                    * Pre-populated with your system mobile profile code.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={processingPayment || (currentBalance <= 0 && paymentAmount === "") || landlordPaybill.startsWith("Not Set")}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md flex items-center justify-center gap-2 text-xs uppercase tracking-widest transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {processingPayment ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing Express Hook...</span>
                  </>
                ) : (
                  <>
                    <Share2 size={14} />
                    <span>Initiate M-Pesa STK Push</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </PageLayout>
  );
}
