import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, getDocs, query, where, addDoc } from "firebase/firestore";
import {
  Save,
  Wifi,
  Droplet,
  Trash2,
  Bell,
  CheckCircle2
} from "lucide-react";
import PageLayout from "../components/PageLayout";

interface UserSession {
  role: "tenant" | "landlord";
  apartmentId: string;
  phone: string;
  uid: string;
  name?: string;
}

interface TenantDropdownItem {
  id: string;
  name: string;
  unit: string;
  monthlyRent: number;
  currentBalance: number;
}

export default function RentSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [apartmentName, setApartmentName] = useState("Loading Block...");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTenantId, setReminderTenantId] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");

  // Live Tenant Dropdown List State
  const [registeredTenants, setRegisteredTenants] = useState<TenantDropdownItem[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");

  // Dynamic Form Parameters
  const [baseRent, setBaseRent] = useState(0);
  
  const [waterEnabled, setWaterEnabled] = useState(false);
  const [waterRate, setWaterRate] = useState(50); 
  const [waterUnits, setWaterUnits] = useState(""); 

  // FULLY EDITABLE INTERACTIVE FLOATS
  const [wifiEnabled, setWifiEnabled] = useState(false);
  const [wifiAmount, setWifiAmount] = useState("2000");
  
  const [garbageEnabled, setGarbageEnabled] = useState(false);
  const [garbageAmount, setGarbageAmount] = useState("500");

  const sendNotification = async (
    recipientId: string,
    title: string,
    message: string,
    type: "payment" | "onboard" | "alert" | "general"
  ) => {
    try {
      await addDoc(collection(db, "notifications"), {
        recipientId: recipientId,
        title: title,
        message: message,
        type: type,
        read: false,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error sending notification:", err);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/");
      return;
    }

    const userData = JSON.parse(stored) as UserSession;
    if (userData.role !== "landlord") {
      navigate("/dashboard");
      return;
    }
    setUser(userData);

    const loadPropertyAndTenantsData = async () => {
      try {
        const aptRef = doc(db, "apartments", userData.apartmentId);
        const aptSnap = await getDoc(aptRef);
        if (aptSnap.exists()) {
          setApartmentName(aptSnap.data().name || "Apartment Block");
        }

        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("role", "==", "tenant"),
          where("associatedApartmentId", "==", userData.apartmentId)
        );
        
        const tenantSnap = await getDocs(q);
        const tenantList: TenantDropdownItem[] = tenantSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || "Unnamed Tenant",
            unit: data.houseNumber || data.unit || "N/A",
            monthlyRent: Number(data.monthlyRent || data.rentAmount || 0),
            currentBalance: Number(data.balance || 0),
          };
        });

        setRegisteredTenants(tenantList);
      } catch (err) {
        console.error("Cloud parameters parsing error:", err);
        setErrorMsg("Failed to synchronize active tenant records.");
      } finally {
        setLoading(false);
      }
    };

    loadPropertyAndTenantsData();
  }, [navigate]);

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setErrorMsg("");
    setSaved(false);

    const tenantObj = registeredTenants.find((t) => t.id === tenantId);
    if (tenantObj) {
      setBaseRent(tenantObj.monthlyRent);
      setWaterUnits("");
      setWaterEnabled(false);
      setWifiEnabled(false);
      setWifiAmount("2000"); 
      setGarbageEnabled(false);
      setGarbageAmount("500");  
    } else {
      setBaseRent(0);
    }
  };

  // Math Aggregator Formulas
  const calculateWaterTotal = (): number => {
    const unitsParsed = parseFloat(waterUnits);
    if (waterEnabled && !isNaN(unitsParsed) && unitsParsed > 0) {
      return Number((waterRate * unitsParsed).toFixed(2));
    }
    return 0;
  };

  const calculateFinalTotalRent = (): number => {
    let grandTotal = baseRent + calculateWaterTotal();

    const parsedWifi = parseFloat(wifiAmount);
    if (wifiEnabled && !isNaN(parsedWifi) && parsedWifi > 0) {
      grandTotal += parsedWifi;
    }

    const parsedGarbage = parseFloat(garbageAmount);
    if (garbageEnabled && !isNaN(parsedGarbage) && parsedGarbage > 0) {
      grandTotal += parsedGarbage;
    }

    return grandTotal;
  };

  const handleSave = async () => {
    if (!selectedTenantId) {
      setErrorMsg("Please select a registered tenant profile first from the dropdown list.");
      return;
    }
    setErrorMsg("");
    setSaved(false);

    try {
      const targetTenant = registeredTenants.find((t) => t.id === selectedTenantId);
      if (!targetTenant) return;

      const calculatedInvoiceBill = calculateFinalTotalRent();
      
      const tenantDocRef = doc(db, "users", selectedTenantId);
      await updateDoc(tenantDocRef, {
        balance: targetTenant.currentBalance + calculatedInvoiceBill,
        lastBilledInvoiceAmount: calculatedInvoiceBill,
        lastBillingTimestamp: new Date().toISOString()
      });

      // Send notification when rent settings are updated
      await sendNotification(
        selectedTenantId,
        "Rent Invoice Updated",
        `Your rent invoice has been updated. Total amount due: KSh ${calculatedInvoiceBill.toLocaleString()}.`,
        "alert"
      );

      setRegisteredTenants(registeredTenants.map(t => 
        t.id === selectedTenantId ? { ...t, currentBalance: t.currentBalance + calculatedInvoiceBill } : t
      ));

      setSaved(true);
      setWaterUnits("");
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error("Firestore balance mutation exception:", err);
      setErrorMsg("Failed to push utility charge matrix updates to cloud database node.");
    }
  };

  const handleSendReminder = async () => {
    if (!reminderTenantId) return;

    const targetTenant = registeredTenants.find((t) => t.id === reminderTenantId);
    if (!targetTenant) return;

    const defaultMessage = `Hi ${targetTenant.name}, this is a friendly reminder that you have a current balance of KSh ${targetTenant.currentBalance.toLocaleString()}. Please make your payment as soon as possible.`;
    const finalMessage = reminderMessage || defaultMessage;

    await sendNotification(
      reminderTenantId,
      "Rent Reminder",
      finalMessage,
      "alert"
    );

    setShowReminderModal(false);
    setReminderTenantId("");
    setReminderMessage("");
  };

  if (loading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-sm font-medium text-gray-500">
        Syncing Individual Lease Parameter Matrices... Please standby.
      </div>
    );
  }

  return (
    <PageLayout
      user={user}
      apartmentName={apartmentName}
      title="Individual Rent & Meter Settings"
      headerRight={
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowReminderModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 transition-colors"
          >
            <Bell size={16} />
            <span>Send Rent Reminder</span>
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <CheckCircle2 size={16} />
            <span>Back</span>
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 text-left">
        
        <div className="pb-4 border-b border-gray-200">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Individual Rent & Meter Settings</h1>
          <p className="text-xs text-gray-500 mt-1">Select a registered profile below to append utility charges to their monthly statement invoices.</p>
        </div>

        {/* Personalized Dynamic Status Notifications */}
        {saved && (
          <div className="p-3.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md shadow-sm">
            Success! Invoice statement charges compiled and successfully committed surcharge to{" "}
            <span className="underline font-black">
              {registeredTenants.find((t) => t.id === selectedTenantId)?.name || "the selected tenant"}
            </span>. A notification has been sent.
          </div>
        )}
        
        {errorMsg && (
          <div className="p-3.5 text-xs font-semibold text-red-800 bg-red-50 border border-red-200 rounded-md shadow-sm">
            {errorMsg}
          </div>
        )}

        {/* Tenant Selection Dropdown Row */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Target Registered Occupant Profile</label>
          <select
            value={selectedTenantId}
            onChange={(e) => handleTenantChange(e.target.value)}
            className="w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm font-bold text-sm text-gray-900 focus:ring-1 focus:ring-green-500 focus:outline-none"
          >
            <option value="">-- Choose Tenant (Space Allocation - Legal Name) --</option>
            {registeredTenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                [{tenant.unit}] — {tenant.name} (Current Arrears: KSh {tenant.currentBalance.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        {/* Utilities Billing Configuration Form Matrix Panel */}
        {selectedTenantId && (
          <div className="space-y-4">
            
            {/* Base Rent Row Indicator */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Allocated Unit Base Rent</h3>
                <p className="text-xs text-gray-400 mt-0.5">Fixed housing cost matching tenant lease index.</p>
              </div>
              <span className="text-lg font-black text-gray-900">KSh {baseRent.toLocaleString()}</span>
            </div>

            {/* WATER CONFIGURATION INJECTOR CARD */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mt-0.5">
                    <Droplet size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Metered Water Consumption</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Appends variable water usage sums based on decimal unit reads.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={waterEnabled}
                  onChange={(e) => setWaterEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                />
              </div>
              
              {waterEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 block">Rate Charge Per Unit (KES)</label>
                    <input
                      type="number"
                      value={waterRate}
                      onChange={(e) => setWaterRate(Number(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded text-xs font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 block">Units Consumed (Accepts Decimals)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 14.75"
                      value={waterUnits}
                      onChange={(e) => setWaterUnits(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* VARIABLE WI-FI CONFIGURATION CARD LAYER */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg mt-0.5">
                    <Wifi size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Internet / Wi-Fi Surcharge</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Toggle to append an editable flat internet charge parameter.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={wifiEnabled}
                  onChange={(e) => setWifiEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                />
              </div>
              
              {wifiEnabled && (
                <div className="pt-2 border-t border-gray-100 space-y-1 animate-in fade-in duration-150">
                  <label className="text-xs font-semibold text-gray-500 block">Wi-Fi Fee Amount (KSh)</label>
                  <input
                    type="number"
                    value={wifiAmount}
                    onChange={(e) => setWifiAmount(e.target.value)}
                    className="w-full max-w-xs p-2 border border-gray-300 rounded text-xs font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                </div>
              )}
            </div>

            {/* VARIABLE GARBAGE CONFIGURATION CARD LAYER */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg mt-0.5">
                    <Trash2 size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Garbage / Sanitation Token</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Toggle to append an editable building cleaning service fee block.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={garbageEnabled}
                  onChange={(e) => setGarbageEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                />
              </div>
              
              {garbageEnabled && (
                <div className="pt-2 border-t border-gray-100 space-y-1 animate-in fade-in duration-150">
                  <label className="text-xs font-semibold text-gray-500 block">Sanitation Fee Amount (KSh)</label>
                  <input
                    type="number"
                    value={garbageAmount}
                    onChange={(e) => setGarbageAmount(e.target.value)}
                    className="w-full max-w-xs p-2 border border-gray-300 rounded text-xs font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                  />
                </div>
              )}
            </div>

            {/* TOTAL CALCULATIONS PANEL FOOTER */}
            <div className="bg-gray-900 text-white p-6 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-800 shadow-md">
              <div>
                <span className="text-xs font-bold uppercase text-gray-400 tracking-widest">Calculated Invoice Sum Total</span>
                <div className="text-2xl font-black text-green-400 mt-0.5">
                  KES {calculateFinalTotalRent().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <button
                onClick={handleSave}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white text-xs font-bold tracking-wider uppercase rounded-md shadow transition-all shrink-0"
              >
                <Save size={14} /> Commit Surcharge to Tenant
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Send Rent Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900">Send Rent Reminder</h3>
              <button
                onClick={() => setShowReminderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">
                  Select Tenant
                </label>
                <select
                  value={reminderTenantId}
                  onChange={(e) => setReminderTenantId(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm font-bold text-sm text-gray-900 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">-- Choose Tenant --</option>
                  {registeredTenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.unit}) - Current Balance: KSh {tenant.currentBalance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">
                  Reminder Message (Optional)
                </label>
                <textarea
                  placeholder="Type your reminder message here... Leave empty for default."
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  rows={4}
                />
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReminder}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 shadow"
                >
                  Send Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
