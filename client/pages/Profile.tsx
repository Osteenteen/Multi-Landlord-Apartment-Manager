import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  ArrowLeft,
  User,
  Smartphone,
  Save,
  CreditCard,
  QrCode,
  PhoneCall,
  ShieldCheck,
  Users,
  Briefcase,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageLayout from "../components/PageLayout";

interface UserSession {
  uid: string;
  role: "tenant" | "landlord";
  apartmentId: string;
  email: string;
  phone: string;
  name?: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Personal Identification States
  const [name, setName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Tenant-Specific Contact and Necessary Leasing States
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [nextOfKinName, setNextOfKinName] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [workLocation, setWorkLocation] = useState("");

  // Read-Only Leasing Data Context States
  const [houseNumber, setHouseNumber] = useState("");
  const [monthlyRent, setMonthlyRent] = useState(0);

  // LANDLORD M-PESA PARAMETERS DYNAMIC SELECTION STATES
  const [mpesaType, setMpesaType] = useState<"paybill" | "till" | "sendmoney">("paybill");
  const [paybillNumber, setPaybillNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [tillNumber, setTillNumber] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/");
      return;
    }

    const userData = JSON.parse(stored) as UserSession;
    setSession(userData);

    const loadProfileData = async () => {
      try {
        const userDocRef = doc(db, "users", userData.uid);
        const snap = await getDoc(userDocRef);

        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || "");
          setNationalId(data.nationalId || "");
          setEmail(data.email || userData.email || "");
          setPhone(data.phone || userData.phone || "");

          if (userData.role === "landlord") {
            const savedType = data.mpesaType || "paybill";
            setMpesaType(savedType);

            // Read stored data values appropriately depending on historical parameters
            if (savedType === "paybill") {
              setPaybillNumber(data.paybillNumber || "");
              setAccountNumber(data.accountNumber || "");
            } else if (savedType === "till") {
              setTillNumber(data.paybillNumber || "");
            } else if (savedType === "sendmoney") {
              setRecipientPhone(data.paybillNumber || "");
            }
          } else {
            setHouseNumber(data.houseNumber || data.unit || "N/A");
            setMonthlyRent(Number(data.monthlyRent || 0));
            setEmergencyContactName(data.emergencyContactName || "");
            setEmergencyContactPhone(data.emergencyContactPhone || "");
            setNextOfKinName(data.nextOfKinName || "");
            setNextOfKinPhone(data.nextOfKinPhone || "");
            setEmployerName(data.employerName || "");
            setWorkLocation(data.workLocation || "");
          }
        }
      } catch (err) {
        console.error("Profile data sync failure:", err);
        setErrorMsg("Failed to synchronize profile records with cloud indexes.");
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [navigate]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setErrorMsg("");
    setSaved(false);

    if (!name.trim() || !nationalId.trim()) {
      setErrorMsg("Full Legal Name and National ID parameters are mandatory fields.");
      return;
    }

    // Isolate chosen payment methodology variables for database validation handshakes
    let finalPaybillOrTerminalValue = "";
    let finalAccountModeLabel = "";

    if (mpesaType === "paybill") {
      finalPaybillOrTerminalValue = paybillNumber.trim();
      finalAccountModeLabel = accountNumber.trim();
    } else if (mpesaType === "till") {
      finalPaybillOrTerminalValue = tillNumber.trim();
      finalAccountModeLabel = "Till Mode";
    } else if (mpesaType === "sendmoney") {
      finalPaybillOrTerminalValue = recipientPhone.trim();
      finalAccountModeLabel = "Phone Mode";
    }

    const payload: any = {
      name: name.trim(),
      nationalId: nationalId.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
    };

    if (session.role === "landlord") {
      payload.mpesaType = mpesaType;
      payload.paybillNumber = finalPaybillOrTerminalValue;
      payload.accountNumber = finalAccountModeLabel;
    } else {
      payload.emergencyContactName = emergencyContactName.trim();
      payload.emergencyContactPhone = emergencyContactPhone.trim();
      payload.nextOfKinName = nextOfKinName.trim();
      payload.nextOfKinPhone = nextOfKinPhone.trim();
      payload.employerName = employerName.trim();
      payload.workLocation = workLocation.trim();
    }

    console.log("SENDING DATA TO SECURE CLOUD NODE:", payload);

    try {
      const userDocRef = doc(db, "users", session.uid);
      await updateDoc(userDocRef, payload);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error("Cloud database rejection error exception:", err);
      setErrorMsg(`Cloud transaction failure: ${err.message || "Verify your connection settings."}`);
    }
  };

  if (loading || !session) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500 font-medium">
        Syncing Account Profile Parameters... Please wait.
      </div>
    );
  }

  const isLandlord = session.role === "landlord";

  return (
    <PageLayout
      user={session}
      title="Manage Account Profile"
      headerRight={
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <span
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wider",
              isLandlord
                ? "bg-green-950 text-green-400 border-green-800"
                : "bg-purple-950 text-purple-400 border-purple-800"
            )}
          >
            {session.role}
          </span>
        </div>
      }
    >
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden text-left">
          <form onSubmit={handleProfileSave} className="p-6 space-y-6">
            {saved && (
              <div className="p-3 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md">
                Success! Your profile parameters have been safely written to Firestore.
              </div>
            )}
            {errorMsg && (
              <div className="p-3 text-xs font-semibold text-red-800 bg-red-50 border border-red-200 rounded-md">
                {errorMsg}
              </div>
            )}

            {/* Section 1: Personal Identification Fields Block */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-1 flex items-center gap-1">
                <ShieldCheck size={14} />
                <span>Personal Identification</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 block">Full Legal Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:ring-1 focus:ring-purple-500 focus:outline-none shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 block">
                    National ID / Passport Number
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:ring-1 focus:ring-purple-500 focus:outline-none shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 block">Communication Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:ring-1 focus:ring-purple-500 focus:outline-none shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 block">
                    Registered Phone Line (System Key)
                  </label>
                  <div className="w-full p-2.5 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-500 font-mono flex items-center gap-2">
                    <Smartphone size={14} />
                    <span>{phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Tenant-Specific Extended Forms */}
            {!isLandlord && (
              <>
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-1 flex items-center gap-1">
                    <Users size={14} />
                    <span>Emergency & Kin Relations Contact Information</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2.5">
                      <label className="text-xs font-bold text-gray-600 block border-b pb-1">
                        1. Next of Kin Contact
                      </label>
                      <input
                        type="text"
                        placeholder="Kin Full Name"
                        value={nextOfKinName}
                        onChange={(e) => setNextOfKinName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <input
                        type="tel"
                        placeholder="Kin Phone Number"
                        value={nextOfKinPhone}
                        onChange={(e) => setNextOfKinPhone(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-xs font-mono bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2.5">
                      <label className="text-xs font-bold text-gray-600 block border-b pb-1">
                        2. Emergency Contact
                      </label>
                      <input
                        type="text"
                        placeholder="Emergency Contact Name"
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <input
                        type="tel"
                        placeholder="Emergency Contact Phone"
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-xs font-mono bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-1 flex items-center gap-1">
                    <Briefcase size={14} />
                    <span>Employment Details</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 block">
                        Employer / Company Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Safaricom"
                        value={employerName}
                        onChange={(e) => setEmployerName(e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 block">
                        Workplace Location / Town
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Nairobi CBD"
                        value={workLocation}
                        onChange={(e) => setWorkLocation(e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-1">
                    Active Lease Terms Summary
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Home size={12} /> Allocated Space ID
                      </p>
                      <p className="text-sm font-black text-gray-900 mt-1">{houseNumber}</p>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <CreditCard size={12} /> Base Monthly Rent
                      </p>
                      <p className="text-sm font-black text-gray-900 mt-1">KSh {monthlyRent.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* DYNAMIC LANDLORD M-PESA CONFIGURATION LAYER */}
            {isLandlord && (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-1">
                  M-Pesa Payment Terminal Configuration
                </h3>

                {/* Selector Tabs Grid */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setMpesaType("paybill")}
                    className={cn(
                      "py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-1.5",
                      mpesaType === "paybill"
                        ? "bg-white text-gray-900 shadow border border-gray-200 font-black"
                        : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    <CreditCard size={14} />
                    <span>Paybill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMpesaType("till")}
                    className={cn(
                      "py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-1.5",
                      mpesaType === "till"
                        ? "bg-white text-gray-900 shadow border border-gray-200 font-black"
                        : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    <QrCode size={14} />
                    <span>Till</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMpesaType("sendmoney")}
                    className={cn(
                      "py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-1.5",
                      mpesaType === "sendmoney"
                        ? "bg-white text-gray-900 shadow border border-gray-200 font-black"
                        : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    <PhoneCall size={14} />
                    <span>Send Money</span>
                  </button>
                </div>

                {/* Conditional Form Wrapper Panel */}
                {mpesaType === "paybill" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 block">
                        M-Pesa Paybill Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 247247 or 400222"
                        value={paybillNumber}
                        onChange={(e) => setPaybillNumber(e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-md text-sm font-mono text-gray-900 bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 block">
                        M-Pesa Passbook Account ID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Building / House Code"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-sm"
                      />
                    </div>
                  </div>
                )}

                {mpesaType === "till" && (
                  <div className="space-y-1 pt-2">
                    <label className="text-xs font-semibold text-gray-500 block">
                      M-Pesa Buy Goods Till Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5123456"
                      value={tillNumber}
                      onChange={(e) => setTillNumber(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-md text-sm font-mono text-gray-900 bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-sm"
                    />
                  </div>
                )}

                {mpesaType === "sendmoney" && (
                  <div className="space-y-1 pt-2">
                    <label className="text-xs font-semibold text-gray-500 block">
                      Recipient Safaricom Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 0712345678"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-md text-sm font-mono text-gray-900 bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-sm"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Submission Button */}
            <div className="pt-4 border-t border-gray-200 flex justify-end">
              <button
                type="submit"
                className={cn(
                  "px-5 py-2.5 text-white text-xs font-bold rounded shadow uppercase tracking-wide flex items-center gap-2 transition-all active:scale-[0.99]",
                  isLandlord ? "bg-emerald-600 hover:bg-emerald-700" : "bg-purple-600 hover:bg-purple-700"
                )}
              >
                <Save size={14} />
                <span>Save Profile Parameters</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}
